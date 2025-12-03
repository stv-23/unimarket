"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserData {
  username: string;
  email: string;
}

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(() => {
    if (typeof window === "undefined") return null;

    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as UserData;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  // Redirección si no hay usuario
  useEffect(() => {
    if (!user) router.push("/auth/login");
  }, [user, router]);

  // Logout profesional
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/auth/login");
  };

  if (!user) return null; // Evita parpadeos antes de redirigir

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* NAVBAR */}
      <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">UniMarket</h1>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Cerrar sesión
        </button>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8">

        {/* BIENVENIDA */}
        <h2 className="text-3xl font-semibold mb-6">
          Bienvenido, <span className="text-blue-600">{user.username}</span>
        </h2>

        {/* CARDS DEL DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <Link href="/profile" className="bg-white p-6 shadow rounded-xl hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer">
            <h3 className="text-lg font-semibold mb-2">Mi Perfil</h3>
            <p className="text-gray-600">Revisa o edita tu información personal.</p>
          </Link>

          <Link href="/market" className="bg-white p-6 shadow rounded-xl hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer">
            <h3 className="text-lg font-semibold mb-2">Productos</h3>
            <p className="text-gray-600">Gestiona tus ventas o publicaciones.</p>
          </Link>

          <Link href="/ai-support" className="bg-white p-6 shadow rounded-xl hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer">
            <h3 className="text-lg font-semibold mb-2">Soporte</h3>
            <p className="text-gray-600">¿Necesitas ayuda? Contáctanos.</p>
          </Link>

        </div>

      </main>
    </div>
  );
}







