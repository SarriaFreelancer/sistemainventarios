"use client";

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { LogOut, LayoutDashboard, User, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

interface LandingAuthNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    companyStatus?: string | null;
  } | null;
}

export function LandingAuthNav({ user }: LandingAuthNavProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        {mounted && (
          <button 
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="p-1.5 sm:p-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} className="text-slate-300" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        )}
        <Link href="/auth/login" className="no-underline hidden sm:block">
          <button className="px-3 sm:px-6 py-2 sm:py-2.5 text-[12px] sm:text-[13px] font-bold rounded-lg bg-transparent text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap">
            Iniciar Sesión
          </button>
        </Link>
        <Link href="/auth/login?register=true" className="no-underline">
          <button className="px-4 sm:px-6 py-2 sm:py-2.5 text-[12px] sm:text-[13px] rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-none transition-colors whitespace-nowrap">
            Registrarse
          </button>
        </Link>
      </div>
    );
  }

  const isSuspended = user.companyStatus === 'SUSPENDED';

  return (
    <div className="flex items-center gap-4">
      {mounted && (
        <button 
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          className="p-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} className="text-slate-300" /> : <Moon size={20} className="text-slate-600" />}
        </button>
      )}

      <div className="flex items-center gap-2 text-slate-900 dark:text-white text-sm font-semibold">
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <User size={16} className="text-slate-500 dark:text-slate-400" />
        </div>
        <span className="hidden sm:inline-block">Hola, {user.name?.split(' ')[0] || user.email}</span>
      </div>

      <Link href={isSuspended ? "/#planes" : "/dashboard"} className="no-underline">
        <button className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold rounded-lg border-none cursor-pointer transition-all ${
          isSuspended 
            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:scale-105' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}>
          <LayoutDashboard size={14} />
          <span className="hidden sm:inline-block">{isSuspended ? 'Completar Pago' : 'Dashboard'}</span>
        </button>
      </Link>
      
      <button 
        onClick={() => signOut({ callbackUrl: '/' })}
        className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-[10px] bg-transparent text-slate-900 dark:text-white border border-transparent cursor-pointer transition-all hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline-block">Salir</span>
      </button>
    </div>
  );
}
