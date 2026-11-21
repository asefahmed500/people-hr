"use client"

import * as React from "react"
import { useSession, signIn, signOut } from "next-auth/react"

import { apiRequest, ApiError } from "@/lib/api-client"
import { resetAllStores } from "@/hooks/use-api-store"
import { useNotificationsStore } from "@/lib/stores/notifications"
import type { SessionUser } from "@/lib/data"

export type AuthResult =
  | { ok: true }
  | { ok: false; error: string; twoFactorRequired?: boolean }

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true"

function clearClientState() {
  resetAllStores()
  useNotificationsStore.getState().reset()
}

export function useAuth() {
  const { data: session, status } = useSession()

  const hydrated = status !== "loading"
  const su = session?.user
  const user: SessionUser | null = su
    ? {
        id: su.id ?? "",
        name: su.name ?? "",
        email: su.email ?? "",
        role: su.role ?? "",
        initials: su.initials ?? "",
        department: su.department ?? null,
        managerId: su.managerId ?? null,
      }
    : null
  const isAuthenticated = !!user

  const login = React.useCallback(
    async (email: string, password: string, token?: string): Promise<AuthResult> => {
      // Without a code, pre-check whether 2FA is required before calling signIn.
      if (!token) {
        try {
          const pre = await apiRequest<{ twoFactorRequired?: boolean } | { error?: string }>(
            "/api/auth/2fa/required",
            { method: "POST", body: { email, password } },
          )
          if ("twoFactorRequired" in pre) {
            if (pre.twoFactorRequired) {
              return { ok: false, error: "", twoFactorRequired: true }
            }
          } else {
            return { ok: false, error: "Incorrect email or password." }
          }
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            return { ok: false, error: "Incorrect email or password." }
          }
          return { ok: false, error: "Couldn’t reach the server. Please try again." }
        }
      }

      const res = await signIn("credentials", {
        email,
        password,
        token,
        redirect: false,
      })
      if (!res || res.error || !res.ok) {
        return { ok: false, error: "Incorrect email, password, or 2FA code." }
      }
      clearClientState()
      return { ok: true }
    },
    [],
  )

  const loginWithGoogle = React.useCallback(async (): Promise<AuthResult> => {
    if (!GOOGLE_ENABLED) {
      return {
        ok: false,
        error:
          "Google sign-in isn't configured yet. Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env (and set NEXT_PUBLIC_GOOGLE_ENABLED=true) to enable it.",
      }
    }
    // Full redirect to Google — page will reload on return.
    await signIn("google", { callbackUrl: "/dashboard" })
    return { ok: true }
  }, [])

  const signup = React.useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      let res: { ok?: boolean; error?: string }
      try {
        res = await apiRequest<{ ok?: boolean; error?: string }>("/api/auth/register", {
          method: "POST",
          body: { name, email, password },
        })
      } catch (err) {
        return { ok: false, error: err instanceof ApiError ? err.message : "Could not create account." }
      }
      if (!res.ok) {
        return { ok: false, error: res.error ?? "Could not create account." }
      }
      // Auto sign-in after registration.
      const si = await signIn("credentials", { email, password, redirect: false })
      if (!si || si.error || !si.ok) {
        return { ok: false, error: "Account created, but automatic sign-in failed." }
      }
      clearClientState()
      return { ok: true }
    },
    [],
  )

  const logout = React.useCallback(async () => {
    clearClientState()
    // Use a real navigation, not router.replace: the Next router can replay a
    // cached /dashboard response for a still-authenticated RSC payload, which
    // made it look like sign-out "redirected back to the dashboard". An
    // absolute callback URL avoids the NEXTAUTH_URL port mismatch (3001 vs the
    // port actually serving the app).
    const callbackUrl = typeof window === "undefined"
      ? "/login"
      : `${window.location.origin}/login`
    try {
      await signOut({ callbackUrl, redirect: true })
    } catch {
      if (typeof window !== "undefined") window.location.assign(callbackUrl)
    }
  }, [])

  return {
    user,
    isAuthenticated,
    hydrated,
    login,
    loginWithGoogle,
    signup,
    logout,
  }
}

export type AuthUser = SessionUser
