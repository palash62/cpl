import { RoleHero } from "@/components/layout/role-hero";
import { Mail } from "lucide-react";

/**
 * Autoresponder UI is temporarily gated. Email/autoresponder modules and APIs
 * remain in the codebase — restore AutoresponderSubNav + {children} when ready.
 */
export default function EmailModuleLayout({ children: _children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="Autoresponder"
        description="Email automations, campaigns, and subscriber tools for your leads."
      />

      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--theme-primary-soft)" }}
        >
          <Mail className="h-7 w-7 text-[var(--theme-primary)]" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-primary)]">
          Coming soon
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Autoresponder is launching soon</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          We&apos;re finishing the built-in email and automation experience. Check back shortly —
          your nav link will open this feature when it&apos;s ready.
        </p>
      </div>
    </div>
  );
}
