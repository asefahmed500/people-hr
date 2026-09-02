import Link from "next/link"

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 px-6 py-12">
      <h1 className="text-h1">Privacy Policy</h1>
      <div className="flex flex-col gap-4 font-sans text-[14px] leading-relaxed text-secondary-foreground">
        <p>Last updated: {new Date().toISOString().slice(0, 10)}</p>
        <p>
          PeopleHR stores the data you provide — such as your name, email and people records — to
          power the dashboard. This data lives in the workspace you sign in to.
        </p>
        <p>
          We use a secure session to keep you signed in. Passwords are stored as hashes, not
          plaintext. We don’t sell your data or share it with third parties for advertising.
        </p>
        <p>
          You can update or remove your personal information from the settings page at any time.
        </p>
        <p>
          Contact us through the support options in the app if you have privacy questions.
        </p>
      </div>
      <Link href="/" className="font-sans text-[13px] font-semibold text-primary">
        ← Back to PeopleHR
      </Link>
    </main>
  )
}
