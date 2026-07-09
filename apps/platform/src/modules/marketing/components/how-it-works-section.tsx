const STEPS = [
  {
    num: "1",
    title: "Create Campaign",
    description: "Set your offer, targeting, and lead requirements.",
  },
  {
    num: "2",
    title: "Set CPL Bid",
    description: "Choose your desired cost per lead based on country tier.",
  },
  {
    num: "3",
    title: "Choose Funnel",
    description: "Use a pre-made funnel or create your own.",
  },
  {
    num: "4",
    title: "Connect Tools",
    description: "Connect GetResponse, AWeber, Systeme.io, or Webhook.",
  },
  {
    num: "5",
    title: "Pay For Leads",
    description: "Pay only for valid, verified lead opt-ins.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="how">
      <div className="container">
        <div className="section-title">
          <h2>How It Works</h2>
          <p>Launch your Pay Per Lead campaign in a simple step-by-step process.</p>
        </div>

        <div className="steps">
          {STEPS.map((step) => (
            <div key={step.num} className="step">
              <div className="num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
