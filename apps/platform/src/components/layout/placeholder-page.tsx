interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="premium-card p-8">
      <h1 className="premium-page-title">{title}</h1>
      <p className="premium-page-subtitle">
        {description ?? "This section is available in the navigation. Extend as needed."}
      </p>
    </div>
  );
}
