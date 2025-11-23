"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return null;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background px-6 text-center">
      <h1 className="text-5xl font-extrabold text-primary tracking-tight">UniMarket</h1>
      <p className="mt-4 text-muted-foreground max-w-lg text-lg">
        El marketplace estudiantil donde puedes comprar, vender e intercambiar productos dentro de tu universidad.
      </p>

      {!user ? (
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/register"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-blue-900/20 hover:bg-blue-600 transition-all transform hover:scale-105 font-medium"
          >
            Registrarme
          </Link>

          <Link
            href="/auth/login"
            className="px-8 py-3 bg-transparent text-primary border border-primary rounded-lg hover:bg-primary/10 transition-all font-medium"
          >
            Iniciar Sesión
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          <Link
            href="/profile/edit"
            className="group bg-card border border-border rounded-xl p-6 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Mi Perfil</h3>
            <p className="text-sm text-muted-foreground mt-2">Revisa o edita tu información personal.</p>
          </Link>

          <Link
            href="/market"
            className="group bg-card border border-border rounded-xl p-6 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="text-4xl mb-4">🛍️</div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Mercado</h3>
            <p className="text-sm text-muted-foreground mt-2">Gestiona tus ventas o publicaciones.</p>
          </Link>

          <Link
            href="/chat"
            className="group bg-card border border-border rounded-xl p-6 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Soporte</h3>
            <p className="text-sm text-muted-foreground mt-2">¿Necesitas ayuda? Contáctanos.</p>
          </Link>
        </div>
      )}
    </main>
  );
}
