"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, UserPlus, Shield } from "lucide-react";
import api from "@/lib/api";

const recepSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100),
  email: z.string().email("Debe ser un email válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type RecepForm = z.infer<typeof recepSchema>;

interface Recepcionista {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: number;
  creado_en: string;
}

export default function RecepcionistasPage() {
  const router = useRouter();
  const [recepcionistas, setRecepcionistas] = useState<Recepcionista[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RecepForm>({
    resolver: zodResolver(recepSchema),
  });

  const loadList = async () => {
    try {
      const res = await api.get("/auth/usuarios");
      const filtered = res.data.data.filter((u: Recepcionista) => u.rol === "recepcionista");
      setRecepcionistas(filtered);
    } catch {
      toast.error("Error al cargar recepcionistas");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const onSubmit = async (data: RecepForm) => {
    setCreating(true);
    try {
      await api.post("/auth/invitar-recepcionista", data);
      toast.success("Recepcionista creado exitosamente");
      reset();
      loadList();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al crear recepcionista");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recepcionistas</h1>
          <p className="text-muted-foreground text-sm">Gestiona los recepcionistas de tu gimnasio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Invitar Recepcionista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-medium">Nombre *</Label>
                <Input id="nombre" placeholder="Nombre completo" className="bg-white/5 border-white/10 h-10" {...register("nombre")} />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                <Input id="email" type="email" placeholder="correo@ejemplo.com" className="bg-white/5 border-white/10 h-10" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Contraseña *</Label>
                <Input id="password" type="password" placeholder="Mín. 6 caracteres" className="bg-white/5 border-white/10 h-10" {...register("password")} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" disabled={creating} className="w-full bg-primary text-[#050505] font-semibold hover:bg-primary/90">
                {creating ? "Creando..." : "Crear Recepcionista"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Recepcionistas Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingList ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : recepcionistas.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay recepcionistas registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-muted-foreground uppercase tracking-wider text-[11px]">
                      <th className="pb-3 font-semibold">Nombre</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Estado</th>
                      <th className="pb-3 font-semibold">Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recepcionistas.map((r) => (
                      <tr key={r.id} className="border-b border-white/5">
                        <td className="py-3 font-medium">{r.nombre}</td>
                        <td className="py-3 text-muted-foreground">{r.email}</td>
                        <td className="py-3">
                          <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${r.activo ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                            {r.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">{new Date(r.creado_en).toLocaleDateString("es-CO")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
