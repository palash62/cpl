import Link from "next/link";

export function MarketingHeader() {
  return (
    <header>
      <div className="container">
        <nav>
          <div className="logo">
            <span>✦</span> LEADVIX
          </div>
          <div className="navlinks">
            <a href="#cost">Cost</a>
            <a href="#features">Features</a>
            <a href="#integrations">Integrations</a>
            <a href="#how">How It Works</a>
          </div>
          <Link href="/login" className="btn">
            Join Now →
          </Link>
        </nav>
      </div>
    </header>
  );
}
