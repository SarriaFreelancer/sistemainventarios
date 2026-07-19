"use client";

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { LogOut, LayoutDashboard, User } from 'lucide-react';

interface LandingAuthNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    companyStatus?: string | null;
  } | null;
}

export function LandingAuthNav({ user }: LandingAuthNavProps) {
  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/auth/login" style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', textDecoration: 'none' }}>
          Iniciar Sesión
        </Link>
        <Link href="/auth/login?demo=true" style={{ textDecoration: 'none' }}>
          <button className="btn-red" style={{ padding: '10px 20px', fontSize: 13, borderRadius: 10 }}>
            Ver Demo
          </button>
        </Link>
      </div>
    );
  }

  const isSuspended = user.companyStatus === 'SUSPENDED';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f8fafc', fontSize: 14, fontWeight: 500 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={16} />
        </div>
        <span className="hidden sm:inline-block">Hola, {user.name?.split(' ')[0] || user.email}</span>
      </div>

      <Link href={isSuspended ? "/#planes" : "/dashboard"} style={{ textDecoration: 'none' }}>
        <button style={{ 
          display: 'flex', alignItems: 'center', gap: 6, 
          padding: '8px 16px', fontSize: 13, fontWeight: 600, 
          borderRadius: 10, background: isSuspended ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255,255,255,0.1)', color: '#fff', 
          border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s'
        }} className={isSuspended ? "hover:scale-105" : "hover:bg-white/20"}>
          <LayoutDashboard size={14} />
          <span className="hidden sm:inline-block">{isSuspended ? 'Completar Pago' : 'Dashboard'}</span>
        </button>
      </Link>
      
      <button 
        onClick={() => signOut({ callbackUrl: '/' })}
        style={{ 
          display: 'flex', alignItems: 'center', gap: 6, 
          padding: '8px 16px', fontSize: 13, fontWeight: 600, 
          borderRadius: 10, background: 'transparent', color: '#f8fafc', 
          border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s'
        }} className="hover:text-red-400 hover:bg-red-500/10"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline-block">Salir</span>
      </button>
    </div>
  );
}
