import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
export function CustomerCode({ code, copyIcon }: { code?: string; copyIcon?: ReactNode }) {
  const [message, setMessage] = useState("");
  if (!code) return null;
  return (
    <span className="mt-1 inline-flex flex-wrap items-center gap-1 text-xs text-admin-subtle">
      <span>{code}</span>
      <button
        type="button"
        aria-label={`Copy customer ID ${code}`}
        className="inline-flex min-h-8 min-w-8 items-center justify-center rounded hover:bg-slate-100"
        onKeyDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          void (async () => {
            try { await navigator.clipboard.writeText(code); setMessage("Customer ID copied"); }
            catch { setMessage("Unable to copy customer ID"); }
          })();
        }}
      >
        {message === "Customer ID copied" ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          copyIcon || <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </span>
  );
}
