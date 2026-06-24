interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-muted-foreground">
        {description ?? "This section is available in the navigation. Extend as needed."}
      </p>
    </div>
  );
}
