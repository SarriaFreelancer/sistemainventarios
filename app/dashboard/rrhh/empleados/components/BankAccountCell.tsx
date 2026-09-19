"use client";

import { useState } from "react";
import { Eye, EyeOff, CreditCard, Copy, Check } from "lucide-react";

interface BankAccountCellProps {
  bankName?: string | null;
  bankAccount?: string | null;
}

export function BankAccountCell({ bankName, bankAccount }: BankAccountCellProps) {
  const [showAccount, setShowAccount] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!bankAccount) {
    return (
      <div className="flex flex-col">
        {bankName && <span className="text-xs font-medium text-foreground">{bankName}</span>}
        <span className="text-xs text-muted-foreground/60 italic">No registrada</span>
      </div>
    );
  }

  const maskAccount = (acc: string) => {
    if (acc.length <= 4) return "••••";
    const visible = acc.slice(-4);
    return `•••• ${visible}`;
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bankAccount);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-0.5">
      {bankName && (
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <CreditCard className="h-3 w-3 text-muted-foreground" />
          {bankName}
        </span>
      )}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs tracking-wider text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/50">
          {showAccount ? bankAccount : maskAccount(bankAccount)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowAccount(!showAccount);
          }}
          title={showAccount ? "Ocultar número de cuenta" : "Ver número de cuenta"}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
        >
          {showAccount ? (
            <EyeOff className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>
        {showAccount && (
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copiado" : "Copiar número de cuenta"}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
