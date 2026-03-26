import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions";
import { getDb, initDb } from "@/lib/db";
import Link from "next/link";

async function getGmailStatus(userId: number) {
  const sql = getDb();
  await initDb();
  const rows = await sql`
    SELECT gmail_email FROM google_tokens WHERE user_id = ${userId}
  `;
  return rows.length > 0 ? (rows[0].gmail_email as string) : null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const gmailEmail = await getGmailStatus(session.userId);
  const params = await searchParams;
  const gmailStatus = params.gmail;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Status messages */}
        {gmailStatus === "connected" && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4 text-sm text-green-700 dark:text-green-400">
            Gmail connected successfully!
          </div>
        )}
        {gmailStatus === "denied" && (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/30 p-4 text-sm text-yellow-700 dark:text-yellow-400">
            Gmail access was denied.
          </div>
        )}
        {gmailStatus === "error" && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">
            Failed to connect Gmail. Please try again.
          </div>
        )}

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <svg
              className="h-8 w-8 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Welcome!
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            You are logged in as{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {session.email}
            </span>
          </p>

          {/* Gmail status */}
          <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 text-left">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M20 18H4V8l8 5 8-5v10z" fill="currentColor" opacity=".3"/>
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
              </svg>
              Gmail Integration
            </div>
            {gmailEmail ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Connected: <span className="font-medium text-zinc-900 dark:text-zinc-100">{gmailEmail}</span>
                </span>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                  Connect Gmail to send emails on behalf of your account.
                </p>
                <a
                  href="/api/auth/google"
                  className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Connect Gmail
                </a>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href="/clients"
              className="block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              My Clients
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
