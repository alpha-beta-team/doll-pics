import { formatCustomerName } from '../../shared/formatCustomerName';
import { useState } from "react";
import { request } from "../api/http";
export type CustomerIdentityOption = {
  customerId: string;
  customerCode: string;
  customerName: string;
};
export function CustomerIdentityChoice({
  options,
  selected,
  reason,
  onSelect,
  onReason,
}: {
  options: CustomerIdentityOption[];
  selected: CustomerIdentityOption | null;
  reason: string;
  onSelect: (value: CustomerIdentityOption | null) => void;
  onReason: (value: string) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [different, setDifferent] = useState(false);
  const choose = (value: CustomerIdentityOption) => {
    onSelect(value);
    onReason("");
    setDifferent(false);
    setError("");
  };
  const lookup = async () => {
    setChecking(true);
    setError("");
    try {
      const customer = await request<CustomerIdentityOption | null>(
        `/admin/customers/lookup?code=${encodeURIComponent(code.trim().toUpperCase())}`,
        { auth: true },
      );
      if (!customer) setError("No customer found with this ID.");
      else choose(customer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Customer lookup failed");
    } finally {
      setChecking(false);
    }
  };
  return (
    <fieldset className="rounded-xl border border-admin-border p-3 sm:col-span-2">
      <legend className="px-1 text-sm font-semibold">Customer identity</legend>
      <p className="text-xs text-admin-subtle">
        Repeat customer? Select their existing ID. A different shoot can belong
        to the same customer.
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <label className="flex-1 text-sm">
          Existing customer ID
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="DP-C202611-0001"
            className="mt-1 block min-h-11 w-full rounded-lg border border-admin-border px-3"
          />
        </label>
        <button
          type="button"
          onClick={() => void lookup()}
          disabled={checking || !code.trim()}
          className="min-h-11 rounded-lg border border-admin-border px-3 text-sm disabled:opacity-50"
        >
          {checking ? "Finding…" : "Find customer"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {options.length > 0 && (
        <div className="mt-2 space-y-2">
          <p className="text-sm">Confirm which customer is booking:</p>
          {options.map((option) => (
            <button
              type="button"
              key={option.customerId}
              onClick={() => choose(option)}
              aria-pressed={selected?.customerId === option.customerId}
              className="block min-h-11 w-full rounded-lg border border-admin-border p-2 text-left text-sm"
            >
              {formatCustomerName(option.customerName)} · {option.customerCode}
              {selected?.customerId === option.customerId ? " · Selected" : ""}
            </button>
          ))}
        </div>
      )}
      {selected && (
        <p className="mt-2 text-sm text-emerald-800">
          Using {selected.customerCode} · {formatCustomerName(selected.customerName)}{" "}
          <button
            type="button"
            className="ml-2 min-h-8 underline"
            onClick={() => onSelect(null)}
          >
            Clear
          </button>
        </p>
      )}
      {(options.length > 0 || different) && (
        <label className="mt-2 block text-sm">
          <input
            type="checkbox"
            checked={different}
            onChange={(event) => {
              setDifferent(event.target.checked);
              onSelect(null);
              if (!event.target.checked) onReason("");
            }}
            className="mr-2"
          />
          This is a different person; create a new customer ID
        </label>
      )}
      {different && (
        <label className="mt-2 block text-sm">
          Reason for a different customer
          <textarea
            value={reason}
            onChange={(event) => onReason(event.target.value)}
            minLength={10}
            maxLength={500}
            rows={2}
            className="mt-1 block w-full rounded-lg border border-admin-border p-2"
            placeholder="Explain why this is a different person (10–500 characters)"
          />
        </label>
      )}
    </fieldset>
  );
}
