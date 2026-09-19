"use client";

import { useState, useMemo } from "react";
import { Search, Mail, Phone, Users } from "lucide-react";
import { BankAccountCell } from "./BankAccountCell";
import { EmployeeActions } from "./EmployeeActions";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  documentId: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  department: string | null;
  positionId: number | null;
  position?: { id: number; name: string; baseSalary: number } | null;
  status: string;
  bankName: string | null;
  bankAccount: string | null;
  hireDate: Date | string;
}

interface EmployeesTableProps {
  employees: Employee[];
}

export function EmployeesTable({ employees }: EmployeesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "INACTIVE":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "SUSPENDED":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "TERMINATED":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Activo";
      case "INACTIVE":
        return "Inactivo";
      case "SUSPENDED":
        return "Suspendido";
      case "TERMINATED":
        return "Liquidado";
      default:
        return status;
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const doc = (emp.documentId || "").toLowerCase();
      const pos = (emp.position?.name || "").toLowerCase();
      const dept = (emp.department || "").toLowerCase();
      const email = (emp.email || "").toLowerCase();
      const bank = (emp.bankName || "").toLowerCase();
      const acc = (emp.bankAccount || "").toLowerCase();

      return (
        fullName.includes(term) ||
        doc.includes(term) ||
        pos.includes(term) ||
        dept.includes(term) ||
        email.includes(term) ||
        bank.includes(term) ||
        acc.includes(term)
      );
    });
  }, [employees, searchTerm]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between gap-4 bg-muted/20">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, documento, cargo, banco o cuenta..."
            className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Mostrando {filteredEmployees.length} de {employees.length} empleados
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Empleado</th>
              <th className="px-6 py-4 font-medium">Documento</th>
              <th className="px-6 py-4 font-medium">Cargo y Dpto.</th>
              <th className="px-6 py-4 font-medium">Cuenta Bancaria</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  {searchTerm ? "No se encontraron empleados con los criterios de búsqueda." : "No hay empleados registrados en el sistema."}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                  {/* Empleado */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{emp.firstName} {emp.lastName}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                          {emp.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {emp.email}
                            </span>
                          )}
                          {emp.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {emp.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Documento */}
                  <td className="px-6 py-4 text-muted-foreground font-mono">
                    {emp.documentId}
                  </td>

                  {/* Cargo y Departamento */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{emp.position?.name || "Sin asignar"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{emp.department || "General"}</p>
                  </td>

                  {/* Cuenta Bancaria con Ojo */}
                  <td className="px-6 py-4">
                    <BankAccountCell bankName={emp.bankName} bankAccount={emp.bankAccount} />
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(emp.status)}`}>
                      {getStatusLabel(emp.status)}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 text-right">
                    <EmployeeActions employeeId={emp.id} currentStatus={emp.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
