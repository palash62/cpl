/** Shared Tailwind classes for the dark builder properties sidebar */
export const BUILDER_PROPERTIES_PANEL =
  "text-slate-200 " +
  "[&_label]:text-slate-200 [&_label]:font-medium " +
  "[&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:text-white [&_input]:placeholder:text-slate-400 " +
  "[&_textarea]:border-white/20 [&_textarea]:bg-white/10 [&_textarea]:text-white [&_textarea]:placeholder:text-slate-400 " +
  "[&_select]:border-white/20 [&_select]:bg-white/10 [&_select]:text-white " +
  "[&_option]:bg-[#1e2130] [&_option]:text-white " +
  "[&_.text-sm]:text-slate-200 " +
  "[&_p]:text-slate-300";

export const BUILDER_TAB_LIST = "h-auto w-full flex-wrap gap-1 bg-white/10 p-1";

export const BUILDER_TAB_TRIGGER =
  "flex-1 text-xs font-medium text-slate-300 transition-colors " +
  "hover:text-white " +
  "data-active:bg-indigo-600 data-active:text-white data-active:shadow-sm " +
  "!bg-transparent data-active:!bg-indigo-600";

export const BUILDER_FIELD_LABEL = "text-xs font-medium text-slate-200";

export const BUILDER_FIELD_INPUT =
  "h-8 border-white/20 bg-white/10 text-sm text-white placeholder:text-slate-400";

export const BUILDER_CHECKBOX_LABEL = "flex items-center gap-2 text-sm text-slate-200";
