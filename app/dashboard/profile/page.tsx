import { getAuthSession } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./profile-client";

export const metadata = {
  title: "Mi Perfil - GNS SarriaTech",
  description: "Administra tu perfil personal, cargo y seguridad de acceso.",
};

export default async function ProfilePage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/auth/login");

  const userId = Number(session.user.id);

  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: { select: { name: true } },
      company: { select: { name: true } }
    }
  });

  if (!userData) redirect("/auth/login");

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Administra tus datos personales, preferencias de visualización y contraseña de acceso.
        </p>
      </div>

      <ProfileClient 
        user={JSON.parse(JSON.stringify(userData))}
      />
    </div>
  );
}
