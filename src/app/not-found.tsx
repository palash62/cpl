import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <ButtonLink href="/login">Go to Login</ButtonLink>
    </div>
  );
}
