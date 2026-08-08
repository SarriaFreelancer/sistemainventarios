import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { getSessionCompanyId } from "@/lib/session";
import { redirect } from "next/navigation";
import { MovimientosClient } from "./components/MovimientosClient";

export const metadata = {
  title: "Ingresos y Gastos Manuales · GNS",
};

export default async function MovimientosPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect("/auth/login");

  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  // Traer Incomes y Expenses
  const incomes = await prisma.income.findMany({
    where: companyFilter,
    orderBy: { date: "desc" },
    take: 50
  });

  const expenses = await prisma.expense.findMany({
    where: companyFilter,
    orderBy: { date: "desc" },
    take: 50
  });

  // Mapear y mezclar
  const movIncomes = incomes.map(i => ({
    id: i.id,
    type: "INCOME" as const,
    description: i.description,
    amount: i.amount,
    date: i.date.toISOString(),
    category: i.category
  }));

  const movExpenses = expenses.map(e => ({
    id: e.id,
    type: "EXPENSE" as const,
    description: e.description,
    amount: e.amount,
    date: e.date.toISOString(),
    category: e.category
  }));

  const transactions = [...movIncomes, ...movExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return <MovimientosClient initialTransactions={transactions} />;
}
