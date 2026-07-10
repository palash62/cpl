import Link from "next/link";
import "./auth-page.css";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

export function AuthLayout({ children, title, description, badge }: AuthLayoutProps) {
  return (
    <div className="authPage">
      <div className="authGlow authGlowPurple" aria-hidden />
      <div className="authGlow authGlowBlue" aria-hidden />
      <div className="authGlow authGlowTeal" aria-hidden />

      <header className="authHeader">
        <Link href="/" className="authLogo">
          <span>✦</span> LEADVIX
        </Link>
      </header>

      <main className="authMain">
        <div className="authCard">
          {badge ? <div className="authBadge">{badge}</div> : null}
          <h1 className="authTitle">{title}</h1>
          <p className="authDescription">{description}</p>
          <div className="authContent">{children}</div>
        </div>
      </main>
    </div>
  );
}
