import Link from "next/link";

type UnpublishedOptinFunnelPageProps = {
  slug: string;
  title?: string;
};

/** Friendly response when a funnel exists but is not published yet (HTTP 200, not Next 404). */
export function UnpublishedOptinFunnelPage({
  slug,
  title,
}: UnpublishedOptinFunnelPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Not published
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          This funnel isn’t live yet
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {title ? (
            <>
              <span className="font-medium text-slate-800">{title}</span> (
              <span className="font-mono text-xs">/o/{slug}</span>) exists as a draft.
              Publish it from the funnel editor to make it available publicly.
            </>
          ) : (
            <>
              <span className="font-mono text-xs">/o/{slug}</span> exists as a draft.
              Publish it from the funnel editor to make it available publicly.
            </>
          )}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
