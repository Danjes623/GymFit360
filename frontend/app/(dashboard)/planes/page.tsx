"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface Plan {
  id: number;
  nombre: string;
  descripcion: string;
  objetivo: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: number;
  afiliado_id: number;
  afiliado: string;
  entrenador_id: number;
  entrenador: string;
}

const planSchema = z.object({
  afiliado_id: z.number().int().positive("Selecciona un afiliado"),
  entrenador_id: z.number().int().positive("Selecciona un entrenador"),
  nombre: z.string().min(1, "Requerido").max(150),
  descripcion: z.string().min(1, "Requerida"),
  objetivo: z.string().max(200).optional().or(z.literal("")),
  fecha_inicio: z.string().min(1, "Requerida"),
  fecha_fin: z.string().optional().or(z.literal("")),
});

type PlanForm = z.infer<typeof planSchema>;

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [afiliados, setAfiliados] = useState<{ id: number; nombre: string }[]>([]);
  const [entrenadores, setEntrenadores] = useState<{ id: number; nombre: string; activo: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Plan | null>(null);
  const [eliminarId, setEliminarId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<PlanForm>({ resolver: zodResolver(planSchema) });

  const cargar = async () => {
    setLoading(true);
    try {
      const [p, a, e] = await Promise.all([
        api.get("/planes"),
        api.get("/afiliados"),
        api.get("/entrenadores"),
      ]);
      setPlanes(p.data.data);
      setAfiliados(a.data.data);
      setEntrenadores(e.data.data);
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setEditando(null);
    form.reset({ afiliado_id: 0, entrenador_id: 0, nombre: "", descripcion: "", objetivo: "", fecha_inicio: "", fecha_fin: "" });
    setDialogOpen(true);
  };

  const abrirEditar = (p: Plan) => {
    setEditando(p);
    form.reset({
      afiliado_id: p.afiliado_id,
      entrenador_id: p.entrenador_id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      objetivo: p.objetivo || "",
      fecha_inicio: p.fecha_inicio,
      fecha_fin: p.fecha_fin || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: PlanForm) => {
    setSaving(true);
    try {
      if (editando) {
        await api.put(`/planes/${editando.id}`, data);
        toast.success("Plan actualizado");
      } else {
        await api.post("/planes", data);
        toast.success("Plan creado");
      }
      setDialogOpen(false);
      cargar();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!eliminarId) return;
    try {
      await api.delete(`/planes/${eliminarId}`);
      toast.success("Plan eliminado");
      setEliminarId(null);
      cargar();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al eliminar");
      setEliminarId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Planes de entrenamiento</h1>
        <Button onClick={abrirCrear}>
          <Plus className="h-4 w-4 mr-2" />Nuevo plan
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Afiliado</TableHead>
              <TableHead>Entrenador</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : planes.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay planes</TableCell></TableRow>
            ) : (
              planes.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>{p.afiliado}</TableCell>
                  <TableCell>{p.entrenador}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{p.objetivo || "—"}</TableCell>
                  <TableCell>{p.fecha_inicio}</TableCell>
                  <TableCell>
                    <Badge variant={p.activo ? "default" : "secondary"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEliminarId(p.id)}>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar plan" : "Nuevo plan"}</DialogTitle>
            <DialogDescription>{editando ? "Actualiza los datos del plan" : "Crea un plan de entrenamiento personalizado"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Afiliado *</Label>
                <Select value={form.watch("afiliado_id")?.toString() || ""} onValueChange={(v) => v && form.setValue("afiliado_id", +v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {afiliados.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>{a.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.afiliado_id && <p className="text-sm text-destructive">{form.formState.errors.afiliado_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Entrenador *</Label>
                <Select value={form.watch("entrenador_id")?.toString() || ""} onValueChange={(v) => v && form.setValue("entrenador_id", +v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {entrenadores.filter(e => e.activo).map((e) => (
                      <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.entrenador_id && <p className="text-sm text-destructive">{form.formState.errors.entrenador_id.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-nombre">Nombre del plan *</Label>
              <Input id="plan-nombre" {...form.register("nombre")} />
              {form.formState.errors.nombre && <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="objetivo">Objetivo</Label>
              <Input id="objetivo" {...form.register("objetivo")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-inicio">Fecha inicio *</Label>
                <Input id="plan-inicio" type="date" {...form.register("fecha_inicio")} />
                {form.formState.errors.fecha_inicio && <p className="text-sm text-destructive">{form.formState.errors.fecha_inicio.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-fin">Fecha fin</Label>
                <Input id="plan-fin" type="date" {...form.register("fecha_fin")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción del plan *</Label>
              <Textarea id="descripcion" rows={4} {...form.register("descripcion")} />
              {form.formState.errors.descripcion && <p className="text-sm text-destructive">{form.formState.errors.descripcion.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : editando ? "Actualizar" : "Crear"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!eliminarId} onOpenChange={(open) => { if (!open) setEliminarId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminarId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={eliminar}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
