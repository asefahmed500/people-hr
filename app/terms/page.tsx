import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center">
      <h1 className="joi-statement">Terms of Service</h1>
      <div className="flex w-full flex-col gap-4 text-left font-sans text-[14px] leading-relaxed text-secondary-foreground">
        <p>Last updated: {new Date().toISOString().slice(0, 10)}</p>
        <p>
          PeopleHR provides a people-operations dashboard for HR teams. By using the service you
          agree to use it lawfully, keep your account credentials secure, and not misuse the data
          it holds.
        </p>
        <p>
          The service is provided “as is” for evaluation. We don’t guarantee availability, and you
          are responsible for the accuracy of the data you enter.
        </p>
        <p>
          We may update these terms from time to time. Continued use of the service after changes
          means you accept the updated terms.
        </p>
        <p>
          Questions? Reach out via the contact options in the app’s settings panel.
        </p>
      </div>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-primary transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
        Back to PeopleHR
      </Link>
    </main>
  )
}
