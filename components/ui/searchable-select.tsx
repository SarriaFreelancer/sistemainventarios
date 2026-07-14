"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  name?: string;
  className?: string;
  required?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar opción...",
  searchPlaceholder = "Buscar...",
  name,
  className,
  required,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Hidden input for HTML Form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-border/80 bg-card px-4 py-2 text-sm text-foreground outline-none transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/15",
          !selectedOption && "text-muted-foreground/60"
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-violet-500/5 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="flex items-center border-b border-border px-3 py-2 bg-muted/20">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground/45" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-8 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/55 outline-none"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48 custom-scrollbar py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-muted-foreground/70 italic text-center">
                No se encontraron resultados.
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-primary/10 hover:text-foreground transition-colors",
                    opt.value === value ? "bg-primary/15 text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
