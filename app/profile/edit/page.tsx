"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    university: "",
    birthDate: "",
    profilePicture: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const user = data.user;
          
          // Formatear fecha para input date (YYYY-MM-DD)
          let formattedDate = "";
          if (user.birthDate) {
            formattedDate = new Date(user.birthDate).toISOString().split('T')[0];
          }

          setFormData({
            name: user.name || "",
            email: user.email || "",
            bio: user.bio || "",
            university: user.university || "",
            birthDate: formattedDate,
            profilePicture: user.profilePicture || "",
          });
          
          // Set preview URL if user has a profile picture
          if (user.profilePicture) {
            setPreviewUrl(user.profilePicture);
          }
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Error fetching user", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Por favor selecciona un archivo de imagen válido");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen debe ser menor a 5MB");
        return;
      }
      
      setSelectedImage(file);
      setError("");
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    let profilePictureUrl = formData.profilePicture;

    // Upload image if a new one was selected
    if (selectedImage) {
      setUploading(true);
      try {
        const imageFormData = new FormData();
        imageFormData.append("image", selectedImage);

        const uploadRes = await fetch("/api/upload/profile-picture", {
          method: "POST",
          body: imageFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          profilePictureUrl = uploadData.url;
        } else {
          const uploadError = await uploadRes.json();
          setError(uploadError.error || "Error al subir la imagen");
          setSaving(false);
          setUploading(false);
          return;
        }
      } catch (err) {
        console.error("Error uploading image:", err);
        setError("Error al subir la imagen");
        setSaving(false);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    // Validación de edad básica en frontend
    if (formData.birthDate) {
        const birth = new Date(formData.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        if (age < 18) {
            setError("Debes ser mayor de 18 años para usar esta plataforma.");
            setSaving(false);
            return;
        }
    }

    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, profilePicture: profilePictureUrl }),
      });

      if (res.ok) {
        router.push("/profile");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message || "Error al actualizar perfil");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (

    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
          Editar Perfil
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-2xl border border-border sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-lg">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Picture Upload */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Foto de Perfil
              </label>
              <div className="flex items-center gap-6">
                {/* Preview */}
                <div className="relative">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={96}
                      height={96}
                      className="rounded-full object-cover border-4 border-primary/20"
                      unoptimized={!!selectedImage} // Skip optimization for local preview blobs
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                      <span className="text-3xl font-bold text-primary">
                        {formData.name.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                <div className="flex-1">
                  <input
                    type="file"
                    id="profile-picture"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-picture"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-border rounded-lg shadow-sm text-sm font-medium text-foreground bg-muted hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {selectedImage ? "Cambiar Imagen" : "Seleccionar Imagen"}
                  </label>
                  <p className="mt-2 text-xs text-muted-foreground">
                    PNG, JPG, GIF hasta 5MB
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">
                Nombre Completo
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 bg-input border border-border rounded-lg shadow-sm placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 bg-input border border-border rounded-lg shadow-sm placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="university" className="block text-sm font-medium text-muted-foreground">
                Universidad / Instituto
              </label>
              <div className="mt-1">
                <input
                  id="university"
                  name="university"
                  type="text"
                  placeholder="Ej: Universidad Nacional"
                  value={formData.university}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 bg-input border border-border rounded-lg shadow-sm placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-muted-foreground">
                Fecha de Nacimiento
              </label>
              <div className="mt-1">
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 bg-input border border-border rounded-lg shadow-sm placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Debes ser mayor de 18 años.</p>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-muted-foreground">
                Presentación / Biografía
              </label>
              <div className="mt-1">
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  placeholder="Cuéntanos un poco sobre ti..."
                  value={formData.bio}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 bg-input border border-border rounded-lg shadow-sm placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full flex justify-center py-2 px-4 border border-border rounded-lg shadow-sm text-sm font-medium text-foreground bg-muted hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-lg shadow-blue-900/20 text-sm font-bold text-primary-foreground bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all"
              >
                {uploading ? "Subiendo imagen..." : saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
