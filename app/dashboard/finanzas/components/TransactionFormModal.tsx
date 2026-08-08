"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createIncome, createExpense } from "@/app/actions/finance-actions";
import { Loader2 } from "lucide-react";

export function TransactionFormModal({ 
  isOpen, 
  onClose,
  type 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  type: "INCOME" | "EXPENSE";
}) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("OTHER");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert("Ingrese un monto válido");
        setLoading(false);
        return;
      }

      if (type === "INCOME") {
        await createIncome({ description, amount: parsedAmount, category });
      } else {
        await createExpense({ description, amount: parsedAmount, category });
      }

      setDescription("");
      setAmount("");
      setCategory("OTHER");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al registrar movimiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {type === "INCOME" ? "Registrar Ingreso Manual" : "Registrar Gasto Manual"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input 
              id="description" 
              placeholder="Ej. Inyección de capital, Pago de servicios..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input 
              id="amount" 
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {type === "EXPENSE" && (
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="OTHER">Otro</option>
                <option value="MARKETING">Marketing</option>
                <option value="SUPPLIES">Suministros</option>
                <option value="UTILITIES">Servicios (Utilities)</option>
                <option value="PAYROLL">Nómina</option>
                <option value="INVENTORY_COST">Costo de Inventario</option>
              </Select>
            </div>
          )}

          {type === "INCOME" && (
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="OTHER">Otro</option>
                <option value="SALES">Ventas (Externa)</option>
                <option value="SERVICES">Servicios</option>
                <option value="INVESTMENT">Inversión / Capital</option>
              </Select>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
