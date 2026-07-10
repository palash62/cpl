import Link from "next/link";

export function VslSection() {
  return (
    <section id="vsl">
      <div className="container">
        <div className="vsl">
          <div className="video-box">▶</div>
          <div>
            <div className="badge">Watch The Demo</div>
            <h2>See How LeadVix Helps You Launch Smarter Lead Campaigns</h2>
            <p className="vsl-desc">
              Discover how advertisers can launch campaigns, use pre-made funnels, connect autoresponders,
              verify leads, bid CPL, and optimize performance with AI.
            </p>
            <Link href="/register" className="btn">
              Join Now →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
