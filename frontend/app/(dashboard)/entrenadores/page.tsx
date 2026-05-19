"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";

interface Entrenador {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  especialidad: string;
  activo: number;
  fecha_ingreso: string;
}

const entrenadorSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  email: z.string().email("Email inválido"),
  telefono: z.string().max(20).optional().or(z.literal("")),
  especialidad: z.string().min(1, "La especialidad es requerida").max(200),
});

type EntrenadorForm = z.infer<typeof entrenadorSchema>;

export default function EntrenadoresPage() {
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eliminarId, setEliminarId] = useState<number | null>(null);
  const [editando, setEditando] = useState<Entrenador | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<EntrenadorForm>({
    resolver: zodResolver(entrenadorSchema),
  });

  const cargarEntrenadores = async () => {
    try {
      const res = await api.get("/entrenadores");
      setEntrenadores(res.data.data);
    } catch {
      toast.error("Error al cargar entrenadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEntrenadores();
  }, []);

  const abrirCrear = () => {
    setEditando(null);
    form.reset({ nombre: "", email: "", telefono: "", especialidad: "" });
    setDialogOpen(true);
  };

  const abrirEditar = (e: Entrenador) => {
    setEditando(e);
    form.reset({
      nombre: e.nombre,
      email: e.email,
      telefono: e.telefono || "",
      especialidad: e.especialidad,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: EntrenadorForm) => {
    setSaving(true);
    try {
      if (editando) {
        await api.put(`/entrenadores/${editando.id}`, data);
        toast.success("Entrenador actualizado");
      } else {
        await api.post("/entrenadores", data);
        toast.success("Entrenador creado");
      }
      setDialogOpen(false);
      cargarEntrenadores();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const eliminarEntrenador = async () => {
    if (!eliminarId) return;
    try {
      await api.delete(`/entrenadores/${eliminarId}`);
      toast.success("Entrenador eliminado");
      setEliminarId(null);
      cargarEntrenadores();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al eliminar");
      setEliminarId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Entrenadores</h1>
        <Button onClick={abrirCrear}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo entrenador
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Especialidad</TableHead>
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
            ) : entrenadores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay entrenadores
                </TableCell>
              </TableRow>
            ) : (
              entrenadores.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nombre}</TableCell>
                  <TableCell>{e.email}</TableCell>
                  <TableCell>{e.telefono || "—"}</TableCell>
                  <TableCell>{e.especialidad}</TableCell>
                  <TableCell>
                    <Badge variant={e.activo ? "default" : "secondary"}>
                      {e.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEliminarId(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar entrenador" : "Nuevo entrenador"}</DialogTitle>
            <DialogDescription>
              {editando ? "Actualiza los datos del entrenador" : "Ingresa los datos del nuevo entrenador"}
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
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" {...form.register("telefono")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="especialidad">Especialidad *</Label>
              <Input id="especialidad" {...form.register("especialidad")} />
              {form.formState.errors.especialidad && (
                <p className="text-sm text-destructive">{form.formState.errors.especialidad.message}</p>
              )}
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
              ¿Estás seguro de eliminar este entrenador? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminarId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={eliminarEntrenador}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
