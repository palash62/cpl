interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[var(--theme-bg)]">
      <div
        className="hidden w-[42%] flex-col justify-between p-10 text-white lg:flex"
        style={{
          backgroundImage: "linear-gradient(to bottom, var(--theme-sidebar-from), var(--theme-sidebar-to))",
        }}
      >
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-sm font-bold">
            CP
          </div>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">CPL Platform</h1>
          <p className="mt-3 max-w-sm text-sm text-white/80">
            Enterprise cost-per-lead marketplace connecting advertisers and publishers.
          </p>
        </div>
        <p className="text-xs text-white/50">Trusted by marketing teams worldwide</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <div
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              CP
            </div>
          </div>
          <div className="premium-card p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
