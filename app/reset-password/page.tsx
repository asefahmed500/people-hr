import * as React from "react"
import { ResetPasswordClient } from "./reset-password-client"

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordClient />
    </React.Suspense>
  )
}
