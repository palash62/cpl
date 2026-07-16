"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { writeReferralCookie } from "@/lib/referral";

export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("referral_by") ?? searchParams.get("ref") ?? "";
    if (ref.trim()) {
      writeReferralCookie(ref.trim());
    }
  }, [searchParams]);

  return null;
}
