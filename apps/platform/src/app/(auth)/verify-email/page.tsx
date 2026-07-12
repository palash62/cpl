"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "@/components/layout/auth-layout";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    fetch(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setStatus("error");
          setMessage(data?.error?.message ?? "Verification failed.");
          return;
        }
        setStatus("success");
        setMessage(data?.message ?? "Email verified successfully.");
        setRole(data?.role ?? null);
      })
      .catch(() => {
        setStatus("error");
        setMessage("Verification failed. Please try again.");
      });
  }, [token]);

  return (
    <>
      {status === "loading" && <p className="authMuted text-sm">Verifying your email...</p>}
      {status === "success" && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {status === "success" && role === "PUBLISHER" && (
        <p className="authMuted mt-3 text-sm">
          An admin will review your publisher account before you can sign in.
        </p>
      )}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout badge="Email verification" title="Verify email" description="Confirming your email address">
      <Suspense fallback={<p className="authMuted text-sm">Loading...</p>}>
        <VerifyEmailContent />
      </Suspense>
      <p className="authMuted mt-4 text-center">
        <Link href="/login" className="authLink hover:underline">
          Go to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
