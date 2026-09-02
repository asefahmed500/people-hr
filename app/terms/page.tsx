import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-h1">Terms of Service</h1>
      <div className="flex flex-col gap-4 font-sans text-[14px] leading-relaxed text-secondary-foreground">
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
      <Link href="/" className="font-sans text-[13px] font-semibold text-primary">
        ← Back to PeopleHR
      </Link>
    </main>
  )
}
