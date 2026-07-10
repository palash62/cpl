export default function AdminFunnelTemplatePreviewLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 min-h-screen overflow-auto">{children}</div>;
}
