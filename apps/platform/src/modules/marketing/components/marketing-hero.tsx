import Link from "next/link";

export function MarketingHero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <div className="badge">AI-Powered Pay Per Lead Network</div>
          <h1>
            Stop Paying $1–$3 Per Click. Start Buying <span>Verified Leads.</span>
          </h1>
          <p>
            LeadVix helps advertisers buy 100% verified lead opt-ins from $0.70–$2.50 per lead,
            instead of wasting budget on expensive clicks that may never convert.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn">
              Join Now →
            </Link>
            <a href="#vsl" className="video-btn">
              ▶ Watch Demo
            </a>
          </div>
        </div>

        <div className="mockup">
          <div className="screen">
            <div className="stats">
              <div className="stat">
                <small>Verified Leads</small>
                <b>8,742</b>
              </div>
              <div className="stat">
                <small>Avg CPL</small>
                <b>$1.24</b>
              </div>
              <div className="stat">
                <small>Lead Score</small>
                <b>92%</b>
              </div>
              <div className="stat">
                <small>Campaign ROI</small>
                <b>248%</b>
              </div>
            </div>
            <div className="chart" />
            <div className="mini-row">
              <div className="mini">✅ Tier 1 Targeting</div>
              <div className="mini">✅ Custom CPL Bidding</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
