import Link from "next/link";
import { unsubscribeByToken } from "@/modules/email-marketing";
import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function UnsubscribePage({ params }: Props) {
  const { token } = await params;
  const contact = await unsubscribeByToken(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {contact ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="mt-4 text-xl font-semibold text-slate-900">You&apos;re unsubscribed</h1>
            <p className="mt-2 text-sm text-slate-600">
              <strong>{contact.email}</strong> will no longer receive marketing emails from this sender.
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-12 w-12 text-slate-400" />
            <h1 className="mt-4 text-xl font-semibold text-slate-900">Invalid link</h1>
            <p className="mt-2 text-sm text-slate-600">This unsubscribe link is invalid or has already been used.</p>
          </>
        )}
        <Link href="/" className="mt-6 inline-block text-sm text-[var(--theme-primary)] hover:underline">
          Return to home
        </Link>
      </div>
    </div>
  );
}
