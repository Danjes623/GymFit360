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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";

interface TipoMembresia {
  id: number;
  nombre: string;
  duracion_dias: number;
  precio: string;
  descripcion: string | null;
  activo: number;
}

interface Membresia {
  id: number;
  afiliado_id: number;
  afiliado: string;
  tipo_membresia_id: number;
  tipo_membresia: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: number;
  observaciones: string | null;
}

interface Afiliado {
  id: number;
  nombre: string;
}

const tipoSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(100),
  duracion_dias: z.number().int().positive("Debe ser positivo"),
  precio: z.number().positive("Debe ser mayor a 0"),
  descripcion: z.string().max(500).optional().or(z.literal("")),
});

const membresiaSchema = z.object({
  afiliado_id: z.number().int().positive("Selecciona un afiliado"),
  tipo_membresia_id: z.number().int().positive("Selecciona un plan"),
  fecha_inicio: z.string().min(1, "Requerida"),
  observaciones: z.string().max(500).optional().or(z.literal("")),
});

type TipoForm = z.infer<typeof tipoSchema>;
type MembresiaForm = z.infer<typeof membresiaSchema>;

export default function MembresiasPage() {
  const [tab, setTab] = useState<"tipos" | "asignadas">("tipos");
  const [tipos, setTipos] = useState<TipoMembresia[]>([]);
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogTipo, setDialogTipo] = useState(false);
  const [dialogMembresia, setDialogMembresia] = useState(false);
  const [eliminarId, setEliminarId] = useState<{ type: "tipo" | "membresia"; id: number } | null>(null);
  const [editando, setEditando] = useState<TipoMembresia | null>(null);
  const [saving, setSaving] = useState(false);

  const tipoForm = useForm<TipoForm>({ resolver: zodResolver(tipoSchema) });
  const membresiaForm = useForm<MembresiaForm>({ resolver: zodResolver(membresiaSchema) });

  const cargarTipos = async () => {
    const res = await api.get("/tipos-membresia");
    setTipos(res.data.data);
  };

  const cargarMembresias = async () => {
    const res = await api.get("/membresias");
    setMembresias(res.data.data);
  };

  const cargarAfiliados = async () => {
    const res = await api.get("/afiliados");
    setAfiliados(res.data.data);
  };

  const cargarTodo = async () => {
    setLoading(true);
    try {
      await Promise.all([cargarTipos(), cargarMembresias(), cargarAfiliados()]);
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarTodo(); }, []);

  const abrirCrearTipo = () => {
    setEditando(null);
    tipoForm.reset({ nombre: "", duracion_dias: 30, precio: 0, descripcion: "" });
    setDialogTipo(true);
  };

  const abrirEditarTipo = (t: TipoMembresia) => {
    setEditando(t);
    tipoForm.reset({
      nombre: t.nombre,
      duracion_dias: t.duracion_dias,
      precio: parseFloat(t.precio),
      descripcion: t.descripcion || "",
    });
    setDialogTipo(true);
  };

  const onSubmitTipo = async (data: TipoForm) => {
    setSaving(true);
    try {
      if (editando) {
        await api.put(`/tipos-membresia/${editando.id}`, data);
        toast.success("Plan actualizado");
      } else {
        await api.post("/tipos-membresia", data);
        toast.success("Plan creado");
      }
      setDialogTipo(false);
      cargarTipos();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const onSubmitMembresia = async (data: MembresiaForm) => {
    setSaving(true);
    try {
      await api.post("/membresias", data);
      toast.success("Membresía asignada");
      setDialogMembresia(false);
      cargarMembresias();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al asignar");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!eliminarId) return;
    try {
      if (eliminarId.type === "tipo") {
        await api.delete(`/tipos-membresia/${eliminarId.id}`);
        toast.success("Plan eliminado");
        cargarTipos();
      } else {
        await api.delete(`/membresias/${eliminarId.id}`);
        toast.success("Membresía eliminada");
        cargarMembresias();
      }
      setEliminarId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al eliminar");
      setEliminarId(null);
    }
  };

  const tabs = [
    { value: "tipos" as const, label: "Planes" },
    { value: "asignadas" as const, label: "Membresías activas" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Membresías</h1>
        {tab === "tipos" ? (
          <Button onClick={abrirCrearTipo}>
            <Plus className="h-4 w-4 mr-2" />Nuevo plan
          </Button>
        ) : (
          <Button onClick={() => { membresiaForm.reset({ afiliado_id: 0, tipo_membresia_id: 0, fecha_inicio: "", observaciones: "" }); setDialogMembresia(true); }}>
            <Plus className="h-4 w-4 mr-2" />Asignar membresía
          </Button>
        )}
      </div>

      <div className="flex gap-2 border-b pb-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t transition-colors",
              tab === t.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tipos" && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : tipos.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay planes</TableCell></TableRow>
              ) : (
                tipos.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nombre}</TableCell>
                    <TableCell>{t.duracion_dias} días</TableCell>
                    <TableCell>${parseFloat(t.precio).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={t.activo ? "default" : "secondary"}>{t.activo ? "Activo" : "Inactivo"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => abrirEditarTipo(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEliminarId({ type: "tipo", id: t.id })}>
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
      )}

      {tab === "asignadas" && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Afiliado</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : membresias.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay membresías asignadas</TableCell></TableRow>
              ) : (
                membresias.map((m) => {
                  const vencida = new Date(m.fecha_fin) < new Date();
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.afiliado}</TableCell>
                      <TableCell>{m.tipo_membresia}</TableCell>
                      <TableCell>{m.fecha_inicio}</TableCell>
                      <TableCell>{m.fecha_fin}</TableCell>
                      <TableCell>
                        {m.activa && !vencida ? (
                          <Badge variant="default">Activa</Badge>
                        ) : vencida ? (
                          <Badge variant="destructive">Vencida</Badge>
                        ) : (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setEliminarId({ type: "membresia", id: m.id })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogTipo} onOpenChange={setDialogTipo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar plan" : "Nuevo plan"}</DialogTitle>
            <DialogDescription>Crea o edita un tipo de membresía</DialogDescription>
          </DialogHeader>
          <form onSubmit={tipoForm.handleSubmit(onSubmitTipo)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo-nombre">Nombre *</Label>
              <Input id="tipo-nombre" {...tipoForm.register("nombre")} />
              {tipoForm.formState.errors.nombre && <p className="text-sm text-destructive">{tipoForm.formState.errors.nombre.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duracion">Duración (días) *</Label>
                <Input id="duracion" type="number" {...tipoForm.register("duracion_dias", { valueAsNumber: true })} />
                {tipoForm.formState.errors.duracion_dias && <p className="text-sm text-destructive">{tipoForm.formState.errors.duracion_dias.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio">Precio *</Label>
                <Input id="precio" type="number" step="0.01" {...tipoForm.register("precio", { valueAsNumber: true })} />
                {tipoForm.formState.errors.precio && <p className="text-sm text-destructive">{tipoForm.formState.errors.precio.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" {...tipoForm.register("descripcion")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogTipo(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : editando ? "Actualizar" : "Crear"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMembresia} onOpenChange={setDialogMembresia}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar membresía</DialogTitle>
            <DialogDescription>Selecciona afiliado, plan y fecha de inicio</DialogDescription>
          </DialogHeader>
          <form onSubmit={membresiaForm.handleSubmit(onSubmitMembresia)} className="space-y-4">
            <div className="space-y-2">
              <Label>Afiliado *</Label>
              <Select
                value={membresiaForm.watch("afiliado_id")?.toString() || ""}
                onValueChange={(v) => v && membresiaForm.setValue("afiliado_id", parseInt(v))}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar afiliado" /></SelectTrigger>
                <SelectContent>
                  {afiliados.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {membresiaForm.formState.errors.afiliado_id && <p className="text-sm text-destructive">{membresiaForm.formState.errors.afiliado_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Plan *</Label>
              <Select
                value={membresiaForm.watch("tipo_membresia_id")?.toString() || ""}
                onValueChange={(v) => v && membresiaForm.setValue("tipo_membresia_id", parseInt(v))}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
                <SelectContent>
                  {tipos.filter(t => t.activo).map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.nombre} — ${parseFloat(t.precio).toFixed(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {membresiaForm.formState.errors.tipo_membresia_id && <p className="text-sm text-destructive">{membresiaForm.formState.errors.tipo_membresia_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha-inicio">Fecha de inicio *</Label>
              <Input id="fecha-inicio" type="date" {...membresiaForm.register("fecha_inicio")} />
              {membresiaForm.formState.errors.fecha_inicio && <p className="text-sm text-destructive">{membresiaForm.formState.errors.fecha_inicio.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="memb-obs">Observaciones</Label>
              <Textarea id="memb-obs" {...membresiaForm.register("observaciones")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogMembresia(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Asignar"}</Button>
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
