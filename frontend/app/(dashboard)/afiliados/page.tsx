"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";

interface Afiliado {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  documento: string;
  tipo_membresia: string | null;
  fecha_fin: string | null;
  membresia_activa: number | null;
  estado_membresia: string;
  activo: number;
}

const afiliadoSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  email: z.string().email("Email inválido"),
  telefono: z.string().max(20).optional().or(z.literal("")),
  documento: z.string().min(1, "El documento es requerido").max(30),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  direccion: z.string().max(255).optional().or(z.literal("")),
});

type AfiliadoForm = z.infer<typeof afiliadoSchema>;

const estadoBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  activa: { label: "Activa", variant: "default" },
  por_vencer: { label: "Por vencer", variant: "secondary" },
  vencida: { label: "Vencida", variant: "destructive" },
  sin_membresia: { label: "Sin membresía", variant: "outline" },
};

export default function AfiliadosPage() {
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eliminarId, setEliminarId] = useState<number | null>(null);
  const [editando, setEditando] = useState<Afiliado | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<AfiliadoForm>({
    resolver: zodResolver(afiliadoSchema),
  });

  const cargarAfiliados = async () => {
    try {
      const res = await api.get("/afiliados", { params: filtro !== "todos" ? { estado: filtro } : {} });
      setAfiliados(res.data.data);
    } catch {
      toast.error("Error al cargar afiliados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAfiliados();
  }, [filtro]);

  const abrirCrear = () => {
    setEditando(null);
    form.reset({ nombre: "", email: "", telefono: "", documento: "", fecha_nacimiento: "", direccion: "" });
    setDialogOpen(true);
  };

  const abrirEditar = (a: Afiliado) => {
    setEditando(a);
    form.reset({
      nombre: a.nombre,
      email: a.email,
      telefono: a.telefono || "",
      documento: a.documento,
      fecha_nacimiento: "",
      direccion: "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: AfiliadoForm) => {
    setSaving(true);
    try {
      if (editando) {
        await api.put(`/afiliados/${editando.id}`, data);
        toast.success("Afiliado actualizado");
      } else {
        await api.post("/afiliados", data);
        toast.success("Afiliado creado");
      }
      setDialogOpen(false);
      cargarAfiliados();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const eliminarAfiliado = async () => {
    if (!eliminarId) return;
    try {
      await api.delete(`/afiliados/${eliminarId}`);
      toast.success("Afiliado eliminado");
      setEliminarId(null);
      cargarAfiliados();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al eliminar");
      setEliminarId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Afiliados</h1>
        <Button onClick={abrirCrear}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo afiliado
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={filtro} onValueChange={(v) => v && setFiltro(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activa">Membresía activa</SelectItem>
            <SelectItem value="por_vencer">Por vencer</SelectItem>
            <SelectItem value="vencida">Vencida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Membresía</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : afiliados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay afiliados
                </TableCell>
              </TableRow>
            ) : (
              afiliados.map((a) => {
                const badge = estadoBadge[a.estado_membresia] || estadoBadge.sin_membresia;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.nombre}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>{a.documento}</TableCell>
                    <TableCell>{a.tipo_membresia || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => abrirEditar(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEliminarId(a.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar afiliado" : "Nuevo afiliado"}</DialogTitle>
            <DialogDescription>
              {editando ? "Actualiza los datos del afiliado" : "Ingresa los datos del nuevo afiliado"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" {...form.register("nombre")} />
              {form.formState.errors.nombre && (
                <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="documento">Documento *</Label>
                <Input id="documento" {...form.register("documento")} />
                {form.formState.errors.documento && (
                  <p className="text-sm text-destructive">{form.formState.errors.documento.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" {...form.register("telefono")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha nacimiento</Label>
                <Input id="fecha_nacimiento" type="date" {...form.register("fecha_nacimiento")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" {...form.register("direccion")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editando ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!eliminarId} onOpenChange={(open) => { if (!open) setEliminarId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar este afiliado? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminarId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={eliminarAfiliado}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
