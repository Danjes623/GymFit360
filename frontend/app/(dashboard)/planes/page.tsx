"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Dumbbell } from "lucide-react";
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

interface Ejercicio {
  id: number;
  nombre: string;
  series: number;
  repeticiones: number;
  peso: number | null;
  dia_semana: number;
  hora: string | null;
  orden: number;
  notas: string | null;
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

const ejercicioSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(150),
  series: z.number().int().min(1, "Mínimo 1"),
  repeticiones: z.number().int().min(1, "Mínimo 1"),
  peso: z.number().min(0).optional().or(z.literal("") as any),
  dia_semana: z.number().int().min(1).max(7),
  hora: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM").optional().or(z.literal("")),
  orden: z.number().int().min(0).optional(),
  notas: z.string().max(500).optional().or(z.literal("")),
});

type EjercicioForm = z.infer<typeof ejercicioSchema>;

const DIAS_OPTS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [afiliados, setAfiliados] = useState<{ id: number; nombre: string }[]>([]);
  const [entrenadores, setEntrenadores] = useState<{ id: number; nombre: string; activo: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Plan | null>(null);
  const [eliminarId, setEliminarId] = useState<number | null>(null);

  const [ejDialogOpen, setEjDialogOpen] = useState(false);
  const [ejPlanId, setEjPlanId] = useState<number | null>(null);
  const [ejNombrePlan, setEjNombrePlan] = useState("");
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [ejEditando, setEjEditando] = useState<Ejercicio | null>(null);
  const [ejEliminarId, setEjEliminarId] = useState<number | null>(null);
  const [ejSaving, setEjSaving] = useState(false);

  const form = useForm<PlanForm>({ resolver: zodResolver(planSchema) });
  const ejForm = useForm<EjercicioForm>({ resolver: zodResolver(ejercicioSchema) });

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

  const cargarEjercicios = async (planId: number) => {
    try {
      const res = await api.get(`/rutinas/plan/${planId}`);
      setEjercicios(res.data.data);
    } catch {
      toast.error("Error al cargar ejercicios");
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setEditando(null);
    form.reset({ afiliado_id: 0 as any, entrenador_id: 0 as any, nombre: "", descripcion: "", objetivo: "", fecha_inicio: "", fecha_fin: "" });
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

  const abrirEjercicios = (plan: Plan) => {
    setEjPlanId(plan.id);
    setEjNombrePlan(plan.nombre);
    cargarEjercicios(plan.id);
    setEjDialogOpen(true);
  };

  const abrirCrearEj = () => {
    setEjEditando(null);
    ejForm.reset({
      nombre: "", series: 3, repeticiones: 10, peso: "" as any,
      dia_semana: 1 as any, hora: "", orden: 0, notas: "",
    });
  };

  const abrirEditarEj = (ej: Ejercicio) => {
    setEjEditando(ej);
    ejForm.reset({
      nombre: ej.nombre,
      series: ej.series,
      repeticiones: ej.repeticiones,
      peso: ej.peso ?? ("" as any),
      dia_semana: ej.dia_semana as any,
      hora: ej.hora || "",
      orden: ej.orden,
      notas: ej.notas || "",
    });
  };

  const onSubmit = async (data: PlanForm) => {
    const saving = true;
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

  const onSubmitEj = async (data: EjercicioForm) => {
    if (!ejPlanId) return;
    setEjSaving(true);
    try {
      const payload = { ...data, plan_id: ejPlanId, peso: data.peso || undefined, hora: data.hora || undefined, notas: data.notas || undefined };
      if (ejEditando) {
        await api.put(`/rutinas/${ejEditando.id}`, payload);
        toast.success("Ejercicio actualizado");
      } else {
        await api.post("/rutinas", payload);
        toast.success("Ejercicio creado");
      }
      cargarEjercicios(ejPlanId);
      setEjEditando(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al guardar");
    } finally {
      setEjSaving(false);
    }
  };

  const eliminarEj = async () => {
    if (!ejEliminarId) return;
    try {
      await api.delete(`/rutinas/${ejEliminarId}`);
      toast.success("Ejercicio eliminado");
      setEjEliminarId(null);
      if (ejPlanId) cargarEjercicios(ejPlanId);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al eliminar");
      setEjEliminarId(null);
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
              <TableHead className="w-32">Acciones</TableHead>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Ejercicios" onClick={() => abrirEjercicios(p)}>
                        <Dumbbell className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEliminarId(p.id)}>
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

      {/* Plan form dialog */}
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
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete plan confirmation */}
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

      {/* Ejercicios dialog */}
      <Dialog open={ejDialogOpen} onOpenChange={(open) => { if (!open) { setEjDialogOpen(false); setEjPlanId(null); setEjercicios([]); setEjEditando(null); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ejercicios — {ejNombrePlan}</DialogTitle>
            <DialogDescription>Gestiona los ejercicios de este plan de entrenamiento</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={abrirCrearEj}>
                <Plus className="h-4 w-4 mr-1.5" />Agregar ejercicio
              </Button>
            </div>

            {ejercicios.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No hay ejercicios en este plan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-muted-foreground uppercase tracking-wider text-[11px]">
                      <th className="pb-2 font-semibold">Ejercicio</th>
                      <th className="pb-2 font-semibold">Series</th>
                      <th className="pb-2 font-semibold">Reps</th>
                      <th className="pb-2 font-semibold">Peso</th>
                      <th className="pb-2 font-semibold">Día</th>
                      <th className="pb-2 font-semibold">Hora</th>
                      <th className="pb-2 font-semibold w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ejercicios.map((ej) => (
                      <tr key={ej.id} className="border-b border-white/5">
                        <td className="py-2 font-medium">{ej.nombre}</td>
                        <td className="py-2">{ej.series}</td>
                        <td className="py-2">{ej.repeticiones}</td>
                        <td className="py-2">{ej.peso ? `${ej.peso} kg` : "—"}</td>
                        <td className="py-2">{DIAS_OPTS.find(d => d.value === ej.dia_semana)?.label}</td>
                        <td className="py-2">{ej.hora ? ej.hora.slice(0, 5) : "—"}</td>
                        <td className="py-2">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => abrirEditarEj(ej)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEjEliminarId(ej.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Ejercicio form (inline inside the dialog) */}
            {(ejEditando !== undefined) && (
              <form onSubmit={ejForm.handleSubmit(onSubmitEj)} className="space-y-3 p-4 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-sm font-semibold">{ejEditando ? "Editar ejercicio" : "Nuevo ejercicio"}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre *</Label>
                    <Input className="h-9 text-sm" {...ejForm.register("nombre")} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Series</Label>
                    <Input type="number" min={1} className="h-9 text-sm" {...ejForm.register("series", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Reps</Label>
                    <Input type="number" min={1} className="h-9 text-sm" {...ejForm.register("repeticiones", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Peso (kg)</Label>
                    <Input type="number" step="0.5" min={0} className="h-9 text-sm" {...ejForm.register("peso", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Día *</Label>
                    <Select value={String(ejForm.watch("dia_semana") || 1)} onValueChange={(v) => v && ejForm.setValue("dia_semana", +v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIAS_OPTS.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hora</Label>
                    <Input type="time" className="h-9 text-sm" {...ejForm.register("hora")} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notas</Label>
                  <Input className="h-9 text-sm" {...ejForm.register("notas")} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEjEditando(null)}>Cancelar</Button>
                  <Button type="submit" size="sm" disabled={ejSaving}>{ejSaving ? "Guardando..." : ejEditando ? "Actualizar" : "Crear"}</Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete ejercicio confirmation */}
      <Dialog open={!!ejEliminarId} onOpenChange={(open) => { if (!open) setEjEliminarId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar ejercicio</DialogTitle>
            <DialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEjEliminarId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={eliminarEj}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
