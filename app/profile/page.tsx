"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Product } from "@/lib/types";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [soldProducts, setSoldProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          
          // Fetch only my products
          const prodRes = await fetch(`/api/products?sellerId=${data.user.id}&limit=100`);
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            // Handle both array (old API) and object with products array (new API)
            const myProducts = Array.isArray(prodData) ? prodData : prodData.products;
            
            setActiveProducts(myProducts.filter((p: Product) => !p.isSold));
            setSoldProducts(myProducts.filter((p: Product) => p.isSold));
          }
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Por favor ingresa tu contraseña");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirigir al home después de eliminar la cuenta
        router.push("/");
      } else {
        setDeleteError(data.error || "Error al eliminar la cuenta");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError("Error al eliminar la cuenta");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando perfil...</div>;
  if (!user) return null;

  return (
    <>
    <main className="max-w-7xl mx-auto px-4 py-12 min-h-screen bg-background">
      {/* User Info */}
      <div className="bg-card shadow-xl border border-border overflow-hidden sm:rounded-xl mb-12">
        <div className="px-6 py-6 sm:px-8 flex justify-between items-center bg-card/50">
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            {user.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt={user.name}
                width={80}
                height={80}
                className="rounded-full object-cover border-4 border-primary/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                <span className="text-3xl font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-2xl leading-6 font-bold text-primary">Perfil de Usuario</h3>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Detalles personales y cuenta.</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap justify-end">
            <Link href="/profile/edit" className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 text-sm font-medium transition-colors">
                Editar Perfil
            </Link>
            <Link href="/market/create" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
                Vender Producto
            </Link>
            <Link href="/chat" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20">
                Mis Mensajes
            </Link>
          </div>
        </div>
        <div className="border-t border-border">
          <dl>
            <div className="bg-card px-6 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 border-b border-border">
              <dt className="text-sm font-medium text-muted-foreground">Nombre completo</dt>
              <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2 font-medium">{user.name}</dd>
            </div>
            <div className="bg-muted/30 px-6 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 border-b border-border">
              <dt className="text-sm font-medium text-muted-foreground">Correo electrónico</dt>
              <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">{user.email}</dd>
            </div>
            {user.university && (
              <div className="bg-card px-6 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 border-b border-border">
                <dt className="text-sm font-medium text-muted-foreground">Universidad / Instituto</dt>
                <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">{user.university}</dd>
              </div>
            )}
            {user.birthDate && (
              <div className="bg-muted/30 px-6 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 border-b border-border">
                <dt className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</dt>
                <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
                  {new Date(user.birthDate).toLocaleDateString()}
                </dd>
              </div>
            )}
            {user.bio && (
              <div className="bg-card px-6 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 border-b border-border">
                <dt className="text-sm font-medium text-muted-foreground">Biografía</dt>
                <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2 whitespace-pre-wrap leading-relaxed">{user.bio}</dd>
              </div>
            )}
          </dl>
        </div>
        
        {/* Delete Account Section */}
        <div className="bg-destructive/5 px-6 py-5 sm:px-8 border-t border-destructive/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-destructive">Zona de Peligro</h4>
              <p className="mt-1 text-xs text-muted-foreground">Eliminar tu cuenta es permanente y no se puede deshacer.</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 text-sm font-medium transition-colors shadow-md"
            >
              Eliminar Cuenta
            </button>
          </div>
        </div>
      </div>
      
      {/* Active Products */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-primary flex items-center gap-2">
          <span className="w-2 h-8 bg-primary rounded-full"></span>
          Mis Publicaciones Activas ({activeProducts.length})
        </h2>
        {activeProducts.length === 0 ? (
          <p className="text-muted-foreground bg-card p-6 rounded-xl border border-border text-center">No tienes productos activos en venta.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {activeProducts.map((product) => (
              <Link key={product.id} href={`/market/${product.id}`} className="group">
                <div className="bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-border hover:-translate-y-1">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-muted xl:aspect-w-7 xl:aspect-h-8 relative h-48">
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover object-center group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">{product.title}</h3>
                    <p className="text-lg font-bold text-foreground">${product.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Sold Products */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-muted-foreground flex items-center gap-2">
           <span className="w-2 h-8 bg-muted-foreground rounded-full"></span>
           Historial de Ventas ({soldProducts.length})
        </h2>
        {soldProducts.length === 0 ? (
          <p className="text-muted-foreground bg-card p-6 rounded-xl border border-border text-center">No has vendido productos aún.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {soldProducts.map((product) => (
              <Link key={product.id} href={`/market/${product.id}`} className="group opacity-60 hover:opacity-100 transition-opacity">
                <div className="bg-card rounded-xl shadow-md overflow-hidden border border-border grayscale hover:grayscale-0 transition-all">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-muted xl:aspect-w-7 xl:aspect-h-8 relative h-48">
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover object-center"
                    />
                    <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded z-10 shadow-sm">
                      VENDIDO
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm text-muted-foreground line-through">{product.title}</h3>
                    <p className="mt-1 text-lg font-medium text-muted-foreground">${product.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>

    {/* Delete Account Modal */}
    {showDeleteModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
          <h3 className="text-xl font-bold text-destructive mb-2">¿Eliminar tu cuenta?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Esta acción es <strong>permanente</strong> y no se puede deshacer. Todos tus datos, productos y mensajes serán eliminados.
          </p>
          
          <div className="mb-6">
            <label htmlFor="delete-password" className="block text-sm font-medium text-foreground mb-2">
              Confirma tu contraseña
            </label>
            <input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive text-foreground"
              placeholder="Ingresa tu contraseña"
              disabled={isDeleting}
            />
            {deleteError && (
              <p className="mt-2 text-sm text-destructive">{deleteError}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeletePassword("");
                setDeleteError("");
              }}
              disabled={isDeleting}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Eliminando...
                </>
              ) : (
                "Eliminar Cuenta"
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
