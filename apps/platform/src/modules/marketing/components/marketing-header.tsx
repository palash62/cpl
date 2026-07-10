import Link from "next/link";
import { PlatformLogo } from "@/components/brand/platform-logo";

export function MarketingHeader() {
  return (
    <header>
      <div className="container">
        <nav>
          <Link href="/" className="logo">
            <PlatformLogo />
          </Link>
          <div className="navlinks">
            <a href="#cost">Cost</a>
            <a href="#features">Features</a>
            <a href="#integrations">Integrations</a>
            <a href="#how">How It Works</a>
          </div>
          <div className="navactions">
            <Link href="/login" className="btn-outline">
              Login
            </Link>
            <Link href="/register" className="btn">
              Join Now →
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
