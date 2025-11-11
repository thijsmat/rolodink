import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthCallbackClient } from "./callback-client"

export const metadata: Metadata = {
  title: "Email confirmation | Rolodink",
  description:
    "Confirm your Rolodink account and continue organising your LinkedIn network.",
}

export default function AuthCallbackPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-24">
      <Suspense
        fallback={
          <div className="text-center text-grey">
            Verifying your email confirmation…
          </div>
        }
      >
        <AuthCallbackClient />
      </Suspense>
    </main>
  )
}

