"use client";

import { useState } from "react";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Plus } from "lucide-react";
import Link from "next/link";
import { TransactionFormModal } from "../../components/TransactionFormModal";

type Transaction = {
  id: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number;
  date: string;
  category: string;
};

export function MovimientosClient({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const [modalType, setModalType] = useState<"INCOME" | "EXPENSE" | null>(null);
  const [activeTab, setActiveTab] = useState<"INCOME" | "EXPENSE">("INCOME");

  const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  const filteredTransactions = initialTransactions.filter(tx => tx.type === activeTab);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/finanzas" className="p-2 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft size={20} className="text-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Ingresos y Gastos Manuales</h1>
            <p className="text-sm text-muted-foreground mt-1">Registra inyecciones de capital o egresos operativos.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setModalType("EXPENSE")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-500/10 rounded-xl hover:bg-rose-500/20 transition-colors"
          >
            <ArrowUpRight size={16} />
            Nuevo Gasto
          </button>
          <button 
            onClick={() => setModalType("INCOME")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-colors"
          >
            <ArrowDownLeft size={16} />
            Nuevo Ingreso
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 p-1 bg-muted/30 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("INCOME")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === "INCOME" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Ingresos
        </button>
        <button
          onClick={() => setActiveTab("EXPENSE")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === "EXPENSE" ? "bg-white dark:bg-slate-800 text-rose-600 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Gastos
        </button>
      </div>

      <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-border/50">
            {filteredTransactions.map((tx, idx) => (
              <div key={`${tx.type}-${tx.id}-${idx}`} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center hover:bg-muted/30 -mx-6 px-6 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {tx.type === 'INCOME' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString('es-CO')}
                      </span>
                      {tx.category !== 'N/A' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          {tx.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className={`text-base font-extrabold ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{formatter.format(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-muted/50 rounded-2xl mb-4">
              <Plus size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No hay movimientos registrados</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">Registra tus primeros ingresos o gastos manuales usando los botones superiores.</p>
          </div>
        )}
      </div>

      {modalType && (
        <TransactionFormModal 
          isOpen={true} 
          onClose={() => setModalType(null)} 
          type={modalType} 
        />
      )}
    </div>
  );
}
