"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { createEmployee } from "@/app/actions/hr-actions";

interface EmployeeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EmployeeForm({ onSuccess, onCancel }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    documentId: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    position: "",
    hireDate: new Date().toISOString().split("T")[0],
    baseSalary: "",
    bankName: "",
    bankAccount: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createEmployee({
      ...formData,
      hireDate: new Date(formData.hireDate),
      baseSalary: Number(formData.baseSalary)
    });

    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-4">
          Datos Personales
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nombre</label>
            <input 
              name="firstName"
              type="text" 
              required
              value={formData.firstName}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Apellidos</label>
            <input 
              name="lastName"
              type="text" 
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Documento (ID)</label>
            <input 
              name="documentId"
              type="text" 
              required
              value={formData.documentId}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Correo Electrónico</label>
            <input 
              name="email"
              type="email" 
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Teléfono</label>
            <input 
              name="phone"
              type="tel" 
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Dirección</label>
            <input 
              name="address"
              type="text" 
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-4">
          Datos Laborales y Nómina
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Departamento</label>
            <input 
              name="department"
              type="text" 
              required
              value={formData.department}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Cargo / Posición</label>
            <input 
              name="position"
              type="text" 
              required
              value={formData.position}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Fecha de Contratación</label>
            <input 
              name="hireDate"
              type="date" 
              required
              value={formData.hireDate}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Salario Base Mensual</label>
            <input 
              name="baseSalary"
              type="number" 
              required
              min="0"
              step="0.01"
              value={formData.baseSalary}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Banco</label>
            <input 
              name="bankName"
              type="text" 
              value={formData.bankName}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Cuenta Bancaria</label>
            <input 
              name="bankAccount"
              type="text" 
              value={formData.bankAccount}
              onChange={handleChange}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border gap-4">
        <button 
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-8 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80 gap-2"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 gap-2"
        >
          {loading ? (
            <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar Empleado
        </button>
      </div>
    </form>
  );
}
