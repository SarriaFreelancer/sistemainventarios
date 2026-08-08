"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { PurchaseOrderForm } from "./PurchaseOrderForm";
import { useRouter } from "next/navigation";

interface Supplier {
  id: number;
  companyName: string;
}

export function NewPurchaseOrderModal({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 gap-2"
      >
        <Plus className="h-4 w-4" />
        Nueva Orden
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-background rounded-3xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="sticky top-0 bg-background/95 backdrop-blur z-10 flex items-center justify-between border-b border-border p-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Emitir Orden de Compra</h2>
                <p className="text-sm text-muted-foreground">Crea una orden formal (PO) para enviar a tu proveedor.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <PurchaseOrderForm 
                suppliers={suppliers} 
                onSuccess={handleSuccess} 
                onCancel={() => setIsOpen(false)} 
              />
            </div>
          </div>
        </div>, document.body
      )}
    </>
  );
}
