const INTEGRATIONS = ["GetResponse", "AWeber", "Systeme.io", "Webhook"] as const;

export function IntegrationsSection() {
  return (
    <section id="integrations">
      <div className="container">
        <div className="section-title">
          <h2>Connect With Your Favorite Autoresponder</h2>
          <p>
            Send every verified lead directly into your existing marketing workflow using API integration.
          </p>
        </div>

        <div className="integrations">
          {INTEGRATIONS.map((name) => (
            <div key={name} className="integration">
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
