"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import {
  Loader2,
  Building2,
  MapPin,
  Phone,
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Pencil,
  Upload,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface Gimnasio {
  nombre: string;
  logo: string;
  direccion: string;
  telefono: string;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: number;
  creado_en: string;
  gimnasio: Gimnasio;
}

function logoUrl(path: string): string {
  if (!path) return "/logo.png";
  if (path.startsWith("/uploads/")) {
    return `${api.defaults.baseURL?.replace("/api", "")}${path}`;
  }
  return path;
}

export default function MiCuentaPage() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [form, setForm] = useState({ nombre: "", direccion: "", telefono: "" });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.data);
      setForm({
        nombre: res.data.data.gimnasio.nombre || "",
        direccion: res.data.data.gimnasio.direccion || "",
        telefono: res.data.data.gimnasio.telefono || "",
      });
    } catch {
      // error silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/auth/gimnasio", form);
      setUser((prev) => prev ? { ...prev, gimnasio: { ...prev.gimnasio, ...res.data.data } } : prev);
      setEditOpen(false);
    } catch {
      // error silently
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", logoFile);
      const res = await api.post("/auth/gimnasio/logo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser((prev) => prev ? { ...prev, gimnasio: { ...prev.gimnasio, logo: res.data.data.logo } } : prev);
      setLogoPreview(null);
      setLogoFile(null);
    } catch {
      // error silently
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await api.post("/auth/eliminar-cuenta", { password: deletePassword });
      if (res.data.success) {
        localStorage.removeItem("token");
        document.cookie = "token=; path=/; max-age=0";
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Error al eliminar la cuenta";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = () => {
    if (!user) return;
    setForm({
      nombre: user.gimnasio.nombre || "",
      direccion: user.gimnasio.direccion || "",
      telefono: user.gimnasio.telefono || "",
    });
    setLogoPreview(null);
    setLogoFile(null);
    setEditOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Error al cargar</h2>
        <p className="text-muted-foreground">No se pudo cargar la información de la cuenta.</p>
      </div>
    );
  }

  const rolBadge = {
    admin: "bg-primary text-[#050505]",
    recepcionista: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    usuario: "bg-green-500/20 text-green-400 border-green-500/30",
  }[user.rol] || "bg-secondary text-secondary-foreground";

  return (
    <div className="space-y-8">
      {/* Gym Info */}
      <Card className="glass overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="h-20 w-20 rounded-xl bg-white/10 flex items-center justify-center ring-2 ring-primary/20 shrink-0 overflow-hidden">
            {user.gimnasio.logo ? (
              <img
                src={logoUrl(user.gimnasio.logo)}
                alt={user.gimnasio.nombre}
                className="h-full w-full object-contain p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.png";
                }}
              />
            ) : (
              <Building2 className="h-10 w-10 text-primary" />
            )}
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
              <h1 className="text-2xl font-bold">{user.gimnasio.nombre}</h1>
              {user.rol === "admin" && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger
                    render={
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={openEdit}>
                        <Pencil className="h-3.5 w-3.5" />
                        Configurar
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Configuración del Gimnasio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      {/* Logo */}
                      <div className="space-y-2">
                        <Label>Logo</Label>
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/20 overflow-hidden shrink-0">
                            {(logoPreview || user.gimnasio.logo) ? (
                              <img
                                src={logoPreview || logoUrl(user.gimnasio.logo)}
                                alt="Preview"
                                className="h-full w-full object-contain p-1.5"
                              />
                            ) : (
                              <Building2 className="h-8 w-8 text-muted-foreground/50" />
                            )}
                          </div>
                          <div className="flex-1">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                              className="hidden"
                              onChange={handleLogoChange}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              disabled={uploading}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="h-3.5 w-3.5" />
                              {uploading ? "Subiendo..." : "Seleccionar imagen"}
                            </Button>
                            {logoFile && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="ml-2 gap-1.5"
                                disabled={uploading}
                                onClick={handleLogoUpload}
                              >
                                {uploading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Upload className="h-3.5 w-3.5" />
                                )}
                                Guardar logo
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nombre */}
                      <div className="space-y-1.5">
                        <Label htmlFor="nombre">Nombre del gimnasio</Label>
                        <Input
                          id="nombre"
                          value={form.nombre}
                          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                          maxLength={100}
                        />
                      </div>

                      {/* Dirección */}
                      <div className="space-y-1.5">
                        <Label htmlFor="direccion">Dirección</Label>
                        <Input
                          id="direccion"
                          value={form.direccion}
                          onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                          maxLength={255}
                        />
                      </div>

                      {/* Teléfono */}
                      <div className="space-y-1.5">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          value={form.telefono}
                          onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                          maxLength={20}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose
                        render={<Button variant="outline">Cancelar</Button>}
                      />
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          "Guardar cambios"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 text-sm text-muted-foreground">
              {user.gimnasio.direccion && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {user.gimnasio.direccion}
                </span>
              )}
              {user.gimnasio.telefono && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {user.gimnasio.telefono}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* User Info */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Datos de la Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider">
                <UserIcon className="h-3 w-3" />
                Nombre
              </div>
              <p className="font-medium">{user.nombre}</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider">
                <Mail className="h-3 w-3" />
                Email
              </div>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider">
                <Shield className="h-3 w-3" />
                Rol
              </div>
              <Badge className={rolBadge}>{user.rol}</Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider">
                <Calendar className="h-3 w-3" />
                Registrado
              </div>
              <p className="font-medium">{new Date(user.creado_en).toLocaleDateString("es-CO")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gym Details Card */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información del Gimnasio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Nombre</p>
              <p className="font-medium">{user.gimnasio.nombre}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Dirección</p>
              <p className="font-medium">{user.gimnasio.direccion || "—"}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Teléfono</p>
              <p className="font-medium">{user.gimnasio.telefono || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eliminar Cuenta */}
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Esta acción es irreversible. Todos tus datos serán eliminados permanentemente.
          </p>
          {user.rol === "admin" && (
            <p className="text-sm text-destructive/80 mb-4 font-medium">
              Al eliminar tu cuenta de administrador, todos los afiliados, entrenadores,
              membresías, pagos y datos del gimnasio se eliminarán en cascada.
            </p>
          )}
          <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); setDeletePassword(""); setDeleteError(""); }}>
            <DialogTrigger
              render={
                <Button variant="destructive" className="gap-1.5">
                  <Trash2 className="h-4 w-4" />
                  Eliminar mi cuenta
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Confirmar eliminación
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Para confirmar, ingresa tu contraseña actual. Esta acción no se puede deshacer.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="delete-password">Contraseña</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
                    placeholder="Tu contraseña actual"
                    disabled={deleting}
                  />
                  {deleteError && (
                    <p className="text-sm text-destructive">{deleteError}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline">Cancelar</Button>}
                />
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={!deletePassword || deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    "Confirmar eliminación"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
