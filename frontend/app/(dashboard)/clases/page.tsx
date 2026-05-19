"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";

interface Clase {
  id: number;
  nombre: string;
  descripcion: string | null;
  entrenador_id: number;
  entrenador: string;
  horario: string;
  duracion_minutos: number;
  cupo_maximo: number;
  cupo_actual: number;
  activa: number;
}

interface Entrenador {
  id: number;
  nombre: string;
  activo: number;
}

interface Afiliado {
  id: number;
  nombre: string;
}

interface Inscrito {
  inscripcion_id: number;
  afiliado_id: number;
  afiliado: string;
  fecha_inscripcion: string;
  estado: string;
}

const claseSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(100),
  descripcion: z.string().max(500).optional().or(z.literal("")),
  entrenador_id: z.number().int().positive("Selecciona un entrenador"),
  horario: z.string().min(1, "Requerido"),
  duracion_minutos: z.number().int().positive("Debe ser mayor a 0"),
  cupo_maximo: z.number().int().positive("Debe ser mayor a 0"),
});

type ClaseForm = z.infer<typeof claseSchema>;

export default function ClasesPage() {
  const [clases, setClases] = useState<Clase[]>([]);
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Clase | null>(null);
  const [eliminarId, setEliminarId] = useState<number | null>(null);
  const [detalleClase, setDetalleClase] = useState<Clase & { inscritos: Inscrito[] } | null>(null);
  const [dialogInscribir, setDialogInscribir] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<ClaseForm>({ resolver: zodResolver(claseSchema) });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [c, e, a] = await Promise.all([
        api.get("/clases"),
        api.get("/entrenadores"),
        api.get("/afiliados"),
      ]);
      setClases(c.data.data);
      setEntrenadores(e.data.data);
      setAfiliados(a.data.data);
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const abrirCrear = () => {
    setEditando(null);
    form.reset({
      nombre: "", descripcion: "", entrenador_id: 0,
      horario: "", duracion_minutos: 60, cupo_maximo: 20,
    });
    setDialogOpen(true);
  };

  const abrirEditar = (c: Clase) => {
    setEditando(c);
    form.reset({
      nombre: c.nombre,
      descripcion: c.descripcion || "",
      entrenador_id: c.entrenador_id,
      horario: c.horario.slice(0, 16),
      duracion_minutos: c.duracion_minutos,
      cupo_maximo: c.cupo_maximo,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: ClaseForm) => {
    setSaving(true);
    try {
      const payload = { ...data, horario: new Date(data.horario).toISOString() };
      if (editando) {
        await api.put(`/clases/${editando.id}`, payload);
        toast.success("Clase actualizada");
      } else {
        await api.post("/clases", payload);
        toast.success("Clase creada");
      }
      setDialogOpen(false);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const eliminarClase = async () => {
    if (!eliminarId) return;
    try {
      await api.delete(`/clases/${eliminarId}`);
      toast.success("Clase eliminada");
      setEliminarId(null);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al eliminar");
      setEliminarId(null);
    }
  };

  const verDetalle = async (c: Clase) => {
    try {
      const res = await api.get(`/clases/${c.id}`);
      setDetalleClase(res.data.data);
    } catch {
      toast.error("Error al cargar detalle");
    }
  };

  const inscribirAfiliado = async (afiliado_id: number) => {
    if (!detalleClase) return;
    try {
      await api.post(`/clases/${detalleClase.id}/inscribir`, { afiliado_id });
      toast.success("Afiliado inscrito");
      setDialogInscribir(false);
      verDetalle(detalleClase);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al inscribir");
    }
  };

  const desinscribir = async (claseId: number, afiliadoId: number) => {
    try {
      await api.delete(`/clases/${claseId}/inscribir/${afiliadoId}`);
      toast.success("Afiliado desinscrito");
      if (detalleClase?.id === claseId) verDetalle(detalleClase);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al desinscribir");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clases</h1>
        <Button onClick={abrirCrear}>
          <Plus className="h-4 w-4 mr-2" />Nueva clase
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Entrenador</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Cupo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-32">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : clases.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay clases</TableCell></TableRow>
            ) : (
              clases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>{c.entrenador}</TableCell>
                  <TableCell>{new Date(c.horario).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                  <TableCell>{c.duracion_minutos} min</TableCell>
                  <TableCell>
                    <span className={cn(c.cupo_actual >= c.cupo_maximo && "text-destructive font-semibold")}>
                      {c.cupo_actual}/{c.cupo_maximo}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.activa ? "default" : "secondary"}>{c.activa ? "Activa" : "Inactiva"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => verDetalle(c)}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEliminarId(c.id)}>
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
            <DialogTitle>{editando ? "Editar clase" : "Nueva clase"}</DialogTitle>
            <DialogDescription>{editando ? "Actualiza los datos de la clase" : "Ingresa los datos de la nueva clase"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clase-nombre">Nombre *</Label>
              <Input id="clase-nombre" {...form.register("nombre")} />
              {form.formState.errors.nombre && <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Entrenador *</Label>
              <Select value={form.watch("entrenador_id")?.toString() || ""} onValueChange={(v) => v && form.setValue("entrenador_id", +v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar entrenador" /></SelectTrigger>
                <SelectContent>
                  {entrenadores.filter(e => e.activo).map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.entrenador_id && <p className="text-sm text-destructive">{form.formState.errors.entrenador_id.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horario">Horario *</Label>
                <Input id="horario" type="datetime-local" {...form.register("horario")} />
                {form.formState.errors.horario && <p className="text-sm text-destructive">{form.formState.errors.horario.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="duracion">Duración (min) *</Label>
                <Input id="duracion" type="number" {...form.register("duracion_minutos", { valueAsNumber: true })} />
                {form.formState.errors.duracion_minutos && <p className="text-sm text-destructive">{form.formState.errors.duracion_minutos.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cupo">Cupo máximo *</Label>
                <Input id="cupo" type="number" {...form.register("cupo_maximo", { valueAsNumber: true })} />
                {form.formState.errors.cupo_maximo && <p className="text-sm text-destructive">{form.formState.errors.cupo_maximo.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" {...form.register("descripcion")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : editando ? "Actualizar" : "Crear"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detalleClase} onOpenChange={(open) => { if (!open) setDetalleClase(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detalleClase?.nombre}</DialogTitle>
            <DialogDescription>
              Entrenador: {detalleClase?.entrenador} &middot;{' '}
              {detalleClase && new Date(detalleClase.horario).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Inscritos ({detalleClase?.inscritos.length || 0}/{detalleClase?.cupo_maximo})</span>
              <Button size="sm" onClick={() => { setDialogInscribir(true); }}>
                <Plus className="h-4 w-4 mr-1" />Inscribir
              </Button>
            </div>
            {detalleClase?.inscritos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin inscritos</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {detalleClase?.inscritos.map((i) => (
                  <div key={i.inscripcion_id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <span>{i.afiliado}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={i.estado === "activa" ? "default" : "secondary"}>{i.estado}</Badge>
                      {i.estado === "activa" && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => desinscribir(detalleClase.id, i.afiliado_id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogInscribir} onOpenChange={setDialogInscribir}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Inscribir afiliado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {afiliados.filter(a => !detalleClase?.inscritos.some(i => i.afiliado_id === a.id)).length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay afiliados disponibles para inscribir</p>
            ) : (
              afiliados
                .filter(a => !detalleClase?.inscritos.some(i => i.afiliado_id === a.id))
                .map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded border px-3 py-2">
                    <span className="text-sm">{a.nombre}</span>
                    <Button size="sm" variant="outline" onClick={() => inscribirAfiliado(a.id)}>Inscribir</Button>
                  </div>
                ))
            )}
          </div>
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
            <Button variant="destructive" onClick={eliminarClase}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
