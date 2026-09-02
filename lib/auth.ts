import NextAuth, { type DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { isLoginLocked, recordLoginFailure, recordLoginSuccess } from "@/lib/rate-limit"

// A bcrypt hash compared against when the account doesn't exist, so the
// failed-login response time can't reveal which emails have accounts.
const DUMMY_BCRYPT_HASH = bcrypt.hashSync("timing-equalizer", 10)

const googleId = process.env.AUTH_GOOGLE_ID
const googleSecret = process.env.AUTH_GOOGLE_SECRET
const googleConfigured =
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
      async authorize(credentials) {
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
          const { verifyTotp } = await import("@/lib/totp")
          if (user.totpSecret && verifyTotp(token, user.totpSecret)) {
            // ok
          } else {
            const claimed = await prisma.backupCode.updateMany({
              where: { userId: user.id, code: token.trim(), used: false },
              data: { used: true },
            })
            if (claimed.count === 0) return null
          }
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
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
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
        token.lastRefresh = Date.now()
      }
      // Periodically re-read from DB so profile/role changes propagate
      // without requiring a fresh sign-in (every 60s for demo responsiveness).
      const last = (token.lastRefresh as number) ?? 0
      if (token.id && Date.now() - last > 60_000) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, name: true, email: true, role: true, initials: true, department: true, managerId: true, twoFactorEnabled: true, deactivatedAt: true },
        })
        if (!dbUser || dbUser.deactivatedAt) {
          // Account was deactivated mid-session — drop the whole token so the
          // user is signed out instead of limping on with a dead session.
          return null
        }
        token.name = dbUser.name
        token.email = dbUser.email
        token.role = dbUser.role
        token.initials = dbUser.initials
        token.department = dbUser.department
        token.managerId = dbUser.managerId
        token.twoFactorEnabled = dbUser.twoFactorEnabled
        token.lastRefresh = Date.now()
      }
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
    } & DefaultSession["user"]
  }
}
