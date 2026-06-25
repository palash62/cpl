"use client";

import { useState } from "react";
import { Copy, Check, Gift, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdvertiserReferralCard({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const referralUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${userId}`
      : `/register?ref=${userId}`;

  async function copyLink() {
    await navigator.clipboard.writeText(
      typeof window !== "undefined"
        ? `${window.location.origin}/register?ref=${userId}`
        : referralUrl,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="premium-card overflow-hidden">
      <div className="h-1" style={{ background: "var(--theme-gradient-approved)" }} />
      <div className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
            style={{ background: "var(--theme-primary-soft)" }}
          >
            <Gift className="h-5 w-5 text-[var(--theme-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Your Referral Link</h3>
            <p className="text-xs text-slate-500">Invite publishers to the platform</p>
          </div>
        </div>

        <div
          className="mb-4 rounded-xl border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)",
            background: "var(--theme-primary-soft)",
          }}
        >
          <p className="text-xs font-medium text-slate-800">Earn when referrals join</p>
          <p className="mt-1 text-xs text-slate-600">
            Share your link with publishers. When they sign up and generate leads, you grow your
            network.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            readOnly
            value={referralUrl}
            className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600"
          />
          <Button
            size="sm"
            onClick={copyLink}
            className="h-9 shrink-0 gap-1 bg-[var(--theme-primary)] hover:opacity-90"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div
          className="mt-4 flex gap-2 rounded-lg border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--theme-primary) 15%, transparent)",
            background: "color-mix(in srgb, var(--theme-primary-soft) 60%, white)",
          }}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--theme-primary)]" />
          <p className="text-xs leading-relaxed text-slate-600">
            Copy and share your referral link on social media, email, or your website to invite new
            publishers.
          </p>
        </div>
      </div>
    </div>
  );
}
