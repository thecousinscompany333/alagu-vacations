"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

type Suggestion = { label: string; detail: string };

/**
 * Text input with place suggestions from /api/places (free OpenStreetMap search).
 * The value is always plain text: customers can type anything, pick a suggestion, or ignore them.
 * If the service is slow or down, it behaves like a normal input.
 */
export function LocationInput({
  id,
  name,
  defaultValue = "",
  placeholder,
  className,
  required,
  ...ariaProps
}: {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const typed = useRef(false); // only search after the user types, not for prefilled values
  const listId = useId();

  useEffect(() => {
    const q = value.trim();
    if (!typed.current || q.length < 3) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = res.ok ? ((await res.json()) as { suggestions?: Suggestion[] }) : { suggestions: [] };
        const list = (data.suggestions ?? []).filter((s) => s.label.toLowerCase() !== q.toLowerCase());
        setItems(list);
        setActive(-1);
        setOpen(list.length > 0);
      } catch {
        // Aborted or offline: keep free typing.
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [value]);

  function choose(s: Suggestion) {
    typed.current = false;
    setValue(s.label);
    setOpen(false);
    setItems([]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault(); // pick the suggestion instead of submitting the form
      choose(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        required={required}
        placeholder={placeholder}
        value={value}
        maxLength={160}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          typed.current = true;
          setValue(e.target.value);
          if (e.target.value.trim().length < 3) {
            setOpen(false);
            setLoading(false);
          }
        }}
        onKeyDown={onKeyDown}
        onFocus={() => items.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`${className ?? ""} pr-10`}
        {...ariaProps}
      />
      {loading && <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" aria-hidden />}
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-navy-100 bg-white shadow-lift">
          <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto py-1">
            {items.map((s, i) => (
              <li
                key={s.label}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown fires before the input's blur, so the pick isn't lost.
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-start gap-2 px-4 py-2.5 text-sm ${i === active ? "bg-gold-100" : ""}`}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-ink">{s.label}</span>
                  {s.detail && <span className="block truncate text-xs capitalize text-muted">{s.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t border-slate-100 px-4 py-1.5 text-[10px] text-muted">
            Suggestions ©{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline" onMouseDown={(e) => e.preventDefault()}>
              OpenStreetMap
            </a>{" "}
            contributors
          </p>
        </div>
      )}
    </div>
  );
}
