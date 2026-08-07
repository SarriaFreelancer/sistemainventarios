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

  let userData = session.user.id
    ? await prisma.user.findUnique({
        where: { id: Number(session.user.id) },
        include: {
          role: { select: { name: true } },
          company: { select: { name: true } }
        }
      })
    : null;

  if (!userData && session.user.email) {
    userData = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        role: { select: { name: true } },
        company: { select: { name: true } }
      }
    });
  }

  if (!userData) {
    userData = await prisma.user.findFirst({
      include: {
        role: { select: { name: true } },
        company: { select: { name: true } }
      }
    });
  }

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
