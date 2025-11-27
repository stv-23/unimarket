"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";

export default function CreateProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    categoryId: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch("/api/categories");
      if (res.ok) {
        setCategories(await res.json());
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!image) {
      setError("La imagen es obligatoria");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("categoryId", form.categoryId);
    formData.append("image", image);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        router.push("/market");
      } else {
        const data = await res.json();
        setError(data.error || "Error al crear el producto");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 min-h-screen bg-background">
      <h1 className="text-3xl font-bold text-primary mb-8 tracking-tight">Vender un producto</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-xl shadow-2xl border border-border">
        {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">{error}</div>}
        
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Título</label>
          <input
            type="text"
            name="title"
            required
            value={form.title}
            onChange={handleChange}
            className="block w-full bg-input border border-border rounded-lg shadow-sm py-3 px-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Ej: Libro de Cálculo Vol. 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Precio</label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-muted-foreground sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="price"
              required
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              className="block w-full bg-input border border-border rounded-lg pl-8 pr-12 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Categoría</label>
          <select
            name="categoryId"
            required
            value={form.categoryId}
            onChange={handleChange}
            className="block w-full bg-input border border-border rounded-lg shadow-sm py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((cat: Category) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Descripción</label>
          <textarea
            name="description"
            required
            rows={4}
            value={form.description}
            onChange={handleChange}
            className="block w-full bg-input border border-border rounded-lg shadow-sm py-3 px-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Describe el estado, edición, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Imagen del producto</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-blue-600 transition-all cursor-pointer bg-input rounded-lg border border-border"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg shadow-blue-900/20 text-sm font-bold text-primary-foreground bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
          >
            {loading ? "Publicando..." : "Publicar Producto"}
          </button>
        </div>
      </form>
    </main>
  );
}
