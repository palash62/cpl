"use client";

import type { ReactNode } from "react";

type FunnelModuleShellProps = {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

export function FunnelModuleShell({ title, description, action, children }: FunnelModuleShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
