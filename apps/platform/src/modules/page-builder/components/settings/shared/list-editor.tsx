"use client";

import { Button } from "@/components/ui/button";
import { FieldInput, FieldLabel } from "@/modules/page-builder/components/settings/shared/block-settings";

export function ListItemEditor<T extends Record<string, string>>({
  items,
  fields,
  onChange,
  createItem,
}: {
  items: T[];
  fields: Array<{ key: keyof T; label: string; multiline?: boolean }>;
  onChange: (items: T[]) => void;
  createItem: () => T;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-lg border border-slate-200 p-3">
          {fields.map((field) => (
            <div key={String(field.key)} className="space-y-1">
              <FieldLabel>{field.label}</FieldLabel>
              {field.multiline ? (
                <textarea
                  className="w-full min-h-[60px] rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                  value={item[field.key] ?? ""}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = { ...next[index], [field.key]: e.target.value };
                    onChange(next);
                  }}
                />
              ) : (
                <FieldInput
                  value={item[field.key] ?? ""}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = { ...next[index], [field.key]: e.target.value };
                    onChange(next);
                  }}
                />
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-red-600"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, createItem()])}>
        Add item
      </Button>
    </div>
  );
}
