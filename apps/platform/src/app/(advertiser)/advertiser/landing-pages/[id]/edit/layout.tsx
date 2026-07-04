export default function LandingPageEditLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f1117]">
      {children}
    </div>
  );
}
