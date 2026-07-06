export type BuilderChromeTheme = "light" | "dark";

export function getBuilderChrome(theme: BuilderChromeTheme = "dark") {
  if (theme === "light") {
    return {
      toolbar: "border-b border-slate-200 bg-white",
      toolbarDivider: "bg-slate-200",
      toolbarTitle: "text-slate-900",
      toolbarSubtitle: "text-slate-500",
      toolbarLink: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      toolbarGhost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      toolbarOutline: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      toolbarPublish: "bg-blue-600 text-white hover:bg-blue-700",
      sidebar: "border-r border-slate-200 bg-white",
      sidebarTabs: "border-b border-slate-200",
      sidebarTab: "text-slate-500 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900",
      sidebarInput: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400",
      sidebarMuted: "text-slate-500",
      sidebarItem:
        "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 group-hover:text-blue-700",
      sidebarItemText: "text-slate-700 group-hover:text-slate-900",
      properties: "border-l border-slate-200 bg-white",
      propertiesTitle: "text-slate-900",
      propertiesSubtitle: "text-slate-500",
      propertiesEmpty: "text-slate-900",
      propertiesEmptyMuted: "text-slate-500",
      propertiesIcon: "bg-blue-50 text-blue-600",
      canvas: "bg-slate-100",
      canvasGrid: "radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)",
      footer: "border-t border-slate-200 bg-white text-slate-500",
      footerText: "text-slate-600",
      deviceSwitcher: "border-slate-200 bg-slate-50",
      deviceActive: "bg-blue-600 text-white shadow-sm",
      deviceInactive: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
      propertiesPanel:
        "text-slate-900 [&_label]:text-slate-700 [&_input]:border-slate-200 [&_input]:bg-white [&_input]:text-slate-900 [&_textarea]:border-slate-200 [&_textarea]:bg-white [&_select]:border-slate-200 [&_select]:bg-white [&_p]:text-slate-600",
    };
  }

  return {
    toolbar: "border-b border-white/[0.08] bg-[#12141c]",
    toolbarDivider: "bg-white/10",
    toolbarTitle: "text-white",
    toolbarSubtitle: "text-slate-500",
    toolbarLink: "text-slate-400 hover:bg-white/5 hover:text-white",
    toolbarGhost: "text-slate-300 hover:bg-white/10 hover:text-white",
    toolbarOutline: "border-white/10 bg-transparent text-slate-200 hover:bg-white/10",
    toolbarPublish: "bg-indigo-600 text-white hover:bg-indigo-500",
    sidebar: "border-r border-white/[0.08] bg-[#12141c]",
    sidebarTabs: "border-b border-white/[0.08]",
    sidebarTab: "text-slate-400 data-[state=active]:bg-white/10 data-[state=active]:text-white",
    sidebarInput: "border-white/10 bg-white/5 text-slate-200 placeholder:text-slate-500",
    sidebarMuted: "text-slate-500",
    sidebarItem:
      "border-white/[0.08] bg-white/[0.04] hover:border-indigo-500/40 hover:bg-indigo-500/10",
    sidebarItemText: "text-slate-300 group-hover:text-white",
    properties: "border-l border-white/[0.08] bg-[#12141c]",
    propertiesTitle: "text-white",
    propertiesSubtitle: "text-slate-300",
    propertiesEmpty: "text-white",
    propertiesEmptyMuted: "text-slate-400",
    propertiesIcon: "bg-indigo-500/20 text-indigo-300",
    canvas: "bg-[#1a1d27]",
    canvasGrid: "radial-gradient(circle at 1px 1px, #3f4455 1px, transparent 0)",
    footer: "border-t border-white/[0.08] bg-[#12141c] text-slate-500",
    footerText: "text-slate-400",
    deviceSwitcher: "border-white/10 bg-white/5",
    deviceActive: "bg-indigo-600 text-white shadow-sm",
    deviceInactive: "text-slate-400 hover:bg-white/10 hover:text-white",
    propertiesPanel:
      "text-slate-200 [&_label]:text-slate-200 [&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:text-white [&_textarea]:border-white/20 [&_textarea]:bg-white/10 [&_select]:border-white/20 [&_select]:bg-white/10 [&_p]:text-slate-300",
  };
}
