'use client';

import { LEGAL_DECLARATION_TEXT } from '@ondigo/shared';

export function LegalDeclaration({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 border border-line bg-line/20 p-4 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-accent"
      />
      <span>{LEGAL_DECLARATION_TEXT}</span>
    </label>
  );
}
