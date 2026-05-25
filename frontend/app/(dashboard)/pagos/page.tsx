"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";

interface Pago {
  id: number;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  referencia: string | null;
  observaciones: string | null;
  membresia_id: number;
  afiliado_id: number;
  afiliado: string;
  membresia: string;
}

interface Afiliado {
  id: number;
  nombre: string;
}

interface Membresia {
  id: number;
  afiliado_id: number;
  afiliado: string;
  tipo_membresia: string;
  activa: number;
}

const pagoSchema = z.object({
  afiliado_id: z.number().positive("Selecciona un afiliado"),
  membresia_id: z.number().positive("Selecciona una membresía"),
  monto: z.number().positive("Debe ser mayor a 0"),
  metodo_pago: z.string().min(1, "Selecciona un método"),
  referencia: z.string().max(100).optional().or(z.literal("")),
  observaciones: z.string().max(500).optional().or(z.literal("")),
});

type PagoForm = z.infer<typeof pagoSchema>;

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eliminarId, setEliminarId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<PagoForm>({ resolver: zodResolver(pagoSchema) });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [p, a, m] = await Promise.all([
        api.get("/pagos"),
        api.get("/afiliados"),
        api.get("/membresias"),
      ]);
      setPagos(p.data.data);
      setAfiliados(a.data.data);
      setMembresias(m.data.data);
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const abrirCrear = () => {
    form.reset({
      afiliado_id: 0 as unknown as number,
      membresia_id: 0 as unknown as number,
      monto: 0 as unknown as number,
      metodo_pago: "",
      referencia: "",
      observaciones: "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: PagoForm) => {
    setSaving(true);
    try {
      await api.post("/pagos", data);
      toast.success("Pago registrado");
      setDialogOpen(false);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const eliminarPago = async () => {
    if (!eliminarId) return;
    try {
      await api.delete(`/pagos/${eliminarId}`);
      toast.success("Pago eliminado");
      setEliminarId(null);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al eliminar");
      setEliminarId(null);
    }
  };

  const afiliadoId = form.watch("afiliado_id");
  const membresiasFiltradas = membresias.filter(
    (m) => m.afiliado_id === afiliadoId || !afiliadoId
  );

  const metodoBadge: Record<string, string> = {
    efectivo: "bg-green-500/20 text-green-400 border-green-500/30",
    tarjeta: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    transferencia: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    otro: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de pagos de membresías
          </p>
        </div>
        <Button onClick={abrirCrear} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo pago
        </Button>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold w-16">ID</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Afiliado</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Membresía</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold text-right">Monto</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Método</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Referencia</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Fecha</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold text-right w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : pagos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  No hay pagos registrados
                </TableCell>
              </TableRow>
            ) : (
              pagos.map((pago) => (
                <TableRow key={pago.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    #{pago.id}
                  </TableCell>
                  <TableCell className="font-medium">{pago.afiliado}</TableCell>
                  <TableCell>{pago.membresia}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">
                    ${pago.monto.toLocaleString("es-CO")}
                  </TableCell>
                  <TableCell>
                    <Badge className={metodoBadge[pago.metodo_pago] || ""}>
                      {pago.metodo_pago}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {pago.referencia || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(pago.fecha_pago).toLocaleDateString("es-CO", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setEliminarId(pago.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="afiliado_id">Afiliado</Label>
              <Select
                value={form.watch("afiliado_id") ? String(form.watch("afiliado_id")) : ""}
                onValueChange={(v) => v && form.setValue("afiliado_id", Number(v), { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar afiliado" />
                </SelectTrigger>
                <SelectContent>
                  {afiliados.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="membresia_id">Membresía</Label>
              <Select
                value={form.watch("membresia_id") ? String(form.watch("membresia_id")) : ""}
                onValueChange={(v) => v && form.setValue("membresia_id", Number(v), { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={afiliadoId ? "Seleccionar membresía" : "Primero selecciona un afiliado"} />
                </SelectTrigger>
                <SelectContent>
                  {membresiasFiltradas.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.tipo_membresia} {!m.activa ? "(inactiva)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="monto">Monto ($)</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...form.register("monto", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="metodo_pago">Método de pago</Label>
              <Select
                value={form.watch("metodo_pago") || ""}
                onValueChange={(v) => v && form.setValue("metodo_pago", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="referencia">Referencia (opcional)</Label>
              <Input
                id="referencia"
                placeholder="N° de recibo, consignación, etc."
                maxLength={100}
                {...form.register("referencia")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observaciones">Observaciones (opcional)</Label>
              <Textarea
                id="observaciones"
                placeholder="Notas adicionales..."
                maxLength={500}
                {...form.register("observaciones")}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Registrar pago"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!eliminarId} onOpenChange={(o) => !o && setEliminarId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar pago?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminarId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={eliminarPago}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
