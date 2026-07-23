"use client";

import { useState } from "react";
import { AutomationCreateForm } from "./automation-create-form";
import { AutomationBuilderShell } from "./automation-builder-shell";
import type { Campaign, Trigger } from "./types";

type Props = {
  campaigns: Campaign[];
};

export function NewAutomationExperience({ campaigns }: Props) {
  const [seed, setSeed] = useState<{ name: string; trigger: Trigger } | null>(null);

  if (!seed) {
    return (
      <div className="py-6">
        <AutomationCreateForm onContinue={setSeed} />
      </div>
    );
  }

  return (
    <AutomationBuilderShell campaigns={campaigns} initialCreate={seed} />
  );
}
