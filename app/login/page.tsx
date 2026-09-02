import * as React from "react"
import { LoginPageClient } from "./login-page-client"

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginPageClient />
    </React.Suspense>
  )
}
