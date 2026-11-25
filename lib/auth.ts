import NextAuth, { type DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { recordActivity } from "@/lib/activity"
import { isLoginLocked, recordLoginFailure, recordLoginSuccess } from "@/lib/rate-limit"
import {
  getSessionSecurity,
  recordSignInEvent,
  revokeSignIn,
  signInMetaFromRequest,
} from "@/lib/login-history"

// A bcrypt hash compared against when the account doesn't exist, so the
// failed-login response time can't reveal which emails have accounts.
const DUMMY_BCRYPT_HASH = bcrypt.hashSync("timing-equalizer", 10)

const googleId = process.env.AUTH_GOOGLE_ID
const googleSecret = process.env.AUTH_GOOGLE_SECRET
const googleConfigured =
  process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" &&
  !!googleId &&
  !!googleSecret &&
  googleId !== "placeholder-google-client-id" &&
  googleSecret !== "placeholder-google-client-secret"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...(googleConfigured
      ? [Google({ clientId: googleId as string, clientSecret: googleSecret as string })]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        token: { label: "2FA code", type: "text" },
      },
      async authorize(credentials, request) {
        const email = typeof credentials?.email === "string" ? credentials.email : ""
        const password = typeof credentials?.password === "string" ? credentials.password : ""
        const token = typeof credentials?.token === "string" ? credentials.token : ""
        if (!email || !password) return null

        // Brute-force lockout for this account after repeated failures.
        if (isLoginLocked(email)) return null

        const user = await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
        })
        if (!user || !user.password || user.deactivatedAt) {
          // Burn the same bcrypt cost as the found-user path so response
          // timing can't be used to enumerate accounts.
          bcrypt.compareSync(password, DUMMY_BCRYPT_HASH)
          return null
        }

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) {
          recordLoginFailure(email)
          return null
        }

        // 2FA: require a valid TOTP code or an unused backup code. The backup
        // code is claimed atomically (used: false → used: true) so two
        // concurrent sign-ins can never burn the same code.
        if (user.twoFactorEnabled) {
          const { verifyTotp, hashBackupCode } = await import("@/lib/totp")
          if (user.totpSecret && verifyTotp(token, user.totpSecret)) {
            // ok
          } else {
            const codeHash = hashBackupCode(token)
            const claimed = await prisma.backupCode.updateMany({
              where: { userId: user.id, code: codeHash, used: false },
              data: { used: true },
            })
            if (claimed.count === 0) {
              // Upgrade legacy plaintext rows on first use: accept the code,
              // then replace it with a digest in the same atomic claim.
              const legacy = await prisma.backupCode.findFirst({
                where: { userId: user.id, code: token.trim(), used: false },
                select: { id: true },
              })
              const migrated = legacy
                ? await prisma.backupCode.updateMany({
                    where: { id: legacy.id, used: false },
                    data: { used: true, code: codeHash },
                  })
                : { count: 0 }
              if (migrated.count === 0) {
                // A valid password with a bad 2FA code is still a failed login.
                // Without this, the 6-digit TOTP space (and backup codes) can be
                // brute-forced forever while the password lockout stays pristine.
                recordLoginFailure(email)
                return null
              }
            }
          }
        }

        // Durable audit trail for this successful credentials sign-in. The
        // helpers are best-effort so a storage hiccup can never block login.
        const meta = signInMetaFromRequest(request)
        const signIn = await recordSignInEvent(user.id, meta)

        // Mirror the sign-in into the workspace activity log. Best-effort:
        // an audit failure must never block an otherwise valid login.
        try {
          await recordActivity({
            actor: {
              id: user.id,
              name: user.name,
              role: user.role,
              department: user.department,
            },
            action: "auth",
            module: "auth",
            summary: "Signed in",
          })
        } catch {
          // recordActivity already swallows its own errors — this is belt
          // and braces in case the helper is changed later.
        }

        recordLoginSuccess(email)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          initials: user.initials,
          department: user.department,
          managerId: user.managerId,
          twoFactorEnabled: user.twoFactorEnabled,
          signInId: signIn.id,
          sessionEpoch: signIn.epoch,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  events: {
    // Auth.js clears the cookie on Sign out, but a session refresh already in
    // flight can re-set it with a freshly signed copy of the same JWT. Mark
    // the sign-in as ended server-side so the jwt callback rejects it.
    async signOut(event) {
      const token = "token" in event ? event.token : null
      if (typeof token?.id === "string" && typeof token.signInId === "string") {
        await revokeSignIn(token.id, token.signInId)
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? "employee"
        token.initials = (user as { initials?: string }).initials ?? ""
        token.department = (user as { department?: string }).department ?? null
        token.managerId = (user as { managerId?: string }).managerId ?? null
        token.twoFactorEnabled = (user as { twoFactorEnabled?: boolean }).twoFactorEnabled ?? false
        const issuedEpoch = (user as { sessionEpoch?: number }).sessionEpoch
        if (typeof issuedEpoch === "number") token.epoch = issuedEpoch
        const issuedSignInId = (user as { signInId?: string }).signInId
        if (typeof issuedSignInId === "string") token.signInId = issuedSignInId
        token.lastRefresh = Date.now()
      }
      if (!token.id) return token

      // Revocation and deactivation must take effect on the NEXT request, not
      // at the old 60s profile-refresh interval — a stolen token or a
      // deactivated account must not stay usable for a minute.
      const [dbUser, security] = await Promise.all([
        prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, name: true, email: true, role: true, initials: true, department: true, managerId: true, twoFactorEnabled: true, deactivatedAt: true },
        }),
        getSessionSecurity(token.id as string),
      ])
      if (!dbUser || dbUser.deactivatedAt) return null
      // A session refresh that was already in flight during Sign out re-signs
      // the old JWT and re-sets the cookie. Reject its sign-in id explicitly.
      if (
        typeof token.signInId === "string" &&
        security.revokedSignInIds.includes(token.signInId)
      ) {
        return null
      }
      // Tokens with no epoch (Google OAuth / legacy sessions) are left alone.
      if (typeof security.epoch === "number") {
        if (typeof token.epoch === "number" && token.epoch !== security.epoch) return null
        token.epoch = security.epoch
      }

      // dbUser is already read on every request for revocation checks, so keep
      // identity and role current immediately. Waiting for a 60s window left
      // the top bar, greeting and 2FA switch stale after profile changes.
      token.name = dbUser.name
      token.email = dbUser.email
      token.role = dbUser.role
      token.initials = dbUser.initials
      token.department = dbUser.department
      token.managerId = dbUser.managerId
      token.twoFactorEnabled = dbUser.twoFactorEnabled
      token.lastRefresh = Date.now()
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) ?? "employee"
        session.user.initials = (token.initials as string) ?? ""
        session.user.department = (token.department as string | null) ?? null
        session.user.managerId = (token.managerId as string | null) ?? null
        session.user.twoFactorEnabled = (token.twoFactorEnabled as boolean) ?? false
        if (typeof token.signInId === "string") session.user.signInId = token.signInId
      }
      return session
    },
  },
})

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      initials: string
      department: string | null
      managerId: string | null
      twoFactorEnabled: boolean
      /** Id of the sign-in event that issued this token, for the "Current" marker. */
      signInId?: string
    } & DefaultSession["user"]
  }
}
