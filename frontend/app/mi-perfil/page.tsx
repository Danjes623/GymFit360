"use client";

import { useEffect, useState, useMemo } from "react";
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
  Loader2, User as UserIcon, Mail, Shield, Calendar,
  Building2, MapPin, Phone, ChevronLeft, ChevronRight,
  Dumbbell, Clock, Target, Trash2, AlertTriangle,
} from "lucide-react";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIAS_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_MAP: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0 };

interface Usuario { id: number; nombre: string; email: string; rol: string; }
interface Gimnasio { nombre: string; logo: string | null; direccion: string | null; telefono: string | null; }
interface Afiliado { id: number; nombre: string; email: string; telefono: string | null; documento: string; fecha_nacimiento: string | null; fecha_ingreso: string; direccion: string | null; }
interface Membresia { id: number; fecha_inicio: string; fecha_fin: string; activa: number; tipo_membresia: string; precio: number; }
interface Clase { nombre: string; horario: string; duracion_minutos: number; entrenador: string; estado: string; fecha_inscripcion: string; }
interface Pago { monto: number; fecha_pago: string; metodo_pago: string; referencia: string | null; tipo_membresia: string; }

interface Ejercicio {
  id: number; nombre: string; series: number; repeticiones: number;
  peso: number | null; dia_semana: number; hora: string | null;
  orden: number; notas: string | null;
}

interface Plan {
  id: number; nombre: string; descripcion: string; objetivo: string | null;
  fecha_inicio: string; fecha_fin: string | null; activo: number;
  entrenador: string; entrenador_id: number; ejercicios: Ejercicio[];
}

interface Evento {
  fecha: string; dia: string; ejercicio: string;
  series: number; repeticiones: number; peso: number | null;
  hora: string | null; plan: string; entrenador: string;
}

function getWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return { monday, sunday };
}

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function MiPerfilPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [afiliado, setAfiliado] = useState<Afiliado | null>(null);
  const [membresia, setMembresia] = useState<Membresia | null>(null);
  const [gimnasio, setGimnasio] = useState<Gimnasio | null>(null);
  const [clases, setClases] = useState<Clase[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const semana = useMemo(() => {
    const ref = new Date();
    ref.setDate(ref.getDate() + semanaOffset * 7);
    return getWeek(ref);
  }, [semanaOffset]);

  const eventosSemana = useMemo(() => {
    const inicio = formatDate(semana.monday);
    const fin = formatDate(semana.sunday);
    return eventos.filter((e) => e.fecha >= inicio && e.fecha <= fin);
  }, [eventos, semana]);

  const eventosPorDia = useMemo(() => {
    const map: Record<string, Evento[]> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(semana.monday);
      d.setDate(d.getDate() + i);
      map[formatDate(d)] = [];
    }
    for (const e of eventosSemana) {
      if (!map[e.fecha]) map[e.fecha] = [];
      map[e.fecha].push(e);
    }
    return map;
  }, [eventosSemana, semana]);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, cRes, plRes, pgRes, calRes] = await Promise.all([
          api.get("/mi-perfil"),
          api.get("/mi-perfil/clases"),
          api.get("/mi-perfil/planes"),
          api.get("/mi-perfil/pagos"),
          api.get("/mi-perfil/calendario"),
        ]);
        setUsuario(pRes.data.data.usuario);
        setAfiliado(pRes.data.data.afiliado);
        setMembresia(pRes.data.data.membresia);
        setGimnasio(pRes.data.data.gimnasio);
        setClases(cRes.data.data);
        setPlanes(plRes.data.data);
        setPagos(pgRes.data.data);
        setEventos(calRes.data.data);
      } catch {
        // error silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Error al cargar</h2>
        <p className="text-muted-foreground">No se pudo cargar tu información.</p>
      </div>
    );
  }

  const diasRestantes = membresia
    ? Math.max(0, Math.ceil((new Date(membresia.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-8">
      {/* User Info */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Mi Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Nombre</p>
              <p className="font-medium">{usuario.nombre}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Email</p>
              <p className="font-medium">{usuario.email}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Rol</p>
              <Badge>Miembro</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {!afiliado ? (
        <Card className="glass border-t-4 border-muted">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Afiliación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No estás afiliado a ningún gimnasio</h3>
              <p className="text-sm text-muted-foreground">
                Para acceder a membresías, clases y planes, contacta a la administración
                de tu gimnasio para que te vinculen como afiliado.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Welcome + Membership */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 glass">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Bienvenido, {afiliado.nombre}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Email</p>
                    <p>{afiliado.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Teléfono</p>
                    <p>{afiliado.telefono || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Documento</p>
                    <p>{afiliado.documento}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Miembro desde</p>
                    <p>{new Date(afiliado.fecha_ingreso).toLocaleDateString("es-CO")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-t-4 border-primary">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Membresía
                  {membresia?.activa ? (
                    <Badge className="bg-primary text-[#050505] text-[10px]">Activa</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">Inactiva</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {membresia ? (
                  <>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Plan</p>
                      <p className="text-lg font-bold">{membresia.tipo_membresia}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">Vence</p>
                        <p>{new Date(membresia.fecha_fin).toLocaleDateString("es-CO")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">Días restantes</p>
                        <p className={`text-2xl font-black ${diasRestantes <= 7 ? "text-destructive" : "text-primary"}`}>
                          {diasRestantes}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Sin membresía activa</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Gym Info */}
          {gimnasio && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Gimnasio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Nombre</p>
                    <p className="font-medium">{gimnasio.nombre}</p>
                  </div>
                  {gimnasio.direccion && (
                    <div className="space-y-1.5">
                      <p className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider">
                        <MapPin className="h-3 w-3" />
                        Dirección
                      </p>
                      <p className="font-medium">{gimnasio.direccion}</p>
                    </div>
                  )}
                  {gimnasio.telefono && (
                    <div className="space-y-1.5">
                      <p className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider">
                        <Phone className="h-3 w-3" />
                        Teléfono
                      </p>
                      <p className="font-medium">{gimnasio.telefono}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendario de rutinas
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSemanaOffset((s) => s - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[120px] text-center">
                    {semana.monday.toLocaleDateString("es-CO", { day: "numeric", month: "short" })} – {semana.sunday.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSemanaOffset((s) => s + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="ml-2 h-8 text-xs" onClick={() => setSemanaOffset(0)}>
                    Hoy
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5">
                {DIAS_CORTO.map((d, i) => {
                  const date = new Date(semana.monday);
                  date.setDate(date.getDate() + i);
                  const dateStr = formatDate(date);
                  const today = formatDate(new Date());
                  const esHoy = dateStr === today;
                  const items = eventosPorDia[dateStr] || [];

                  return (
                    <div
                      key={i}
                      className={`rounded-xl border min-h-[100px] p-2 transition-all ${
                        esHoy
                          ? "border-primary/40 bg-primary/[0.03]"
                          : "border-white/5 bg-white/[0.02]"
                      }`}
                    >
                      <div className="text-center mb-1.5">
                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${esHoy ? "text-primary" : "text-muted-foreground/60"}`}>{d}</p>
                        <p className={`text-sm font-bold ${esHoy ? "text-primary" : ""}`}>{date.getDate()}</p>
                      </div>
                      <div className="space-y-1">
                        {items.length === 0 && (
                          <p className="text-[10px] text-muted-foreground/30 text-center">—</p>
                        )}
                        {items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="rounded-md bg-primary/5 border border-primary/10 px-1.5 py-1">
                            <p className="text-[10px] font-medium leading-tight truncate">{item.ejercicio}</p>
                            <p className="text-[8px] text-muted-foreground">
                              {item.series}x{item.repeticiones}{item.peso ? ` ${item.peso}kg` : ""}
                              {item.hora && ` · ${item.hora.slice(0, 5)}`}
                            </p>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <p className="text-[9px] text-muted-foreground text-center">+{items.length - 3} más</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Plan activo + Ejercicios */}
          {planes.filter((p) => p.activo).length > 0 && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Plan activo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {planes.filter((p) => p.activo).map((plan) => (
                  <div key={plan.id}>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold">{plan.nombre}</h3>
                      <Badge className="bg-primary text-[#050505] text-[10px]">Activo</Badge>
                      {plan.objetivo && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
                          <Target className="h-4 w-4 text-primary" />
                          {plan.objetivo}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5" />
                        Entrenador: <span className="font-medium text-foreground">{plan.entrenador}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(plan.fecha_inicio).toLocaleDateString("es-CO")}
                        {plan.fecha_fin && ` — ${new Date(plan.fecha_fin).toLocaleDateString("es-CO")}`}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{plan.descripcion}</p>

                    {/* Exercises table */}
                    {plan.ejercicios.length > 0 ? (
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
                            </tr>
                          </thead>
                          <tbody>
                            {plan.ejercicios.map((ej) => (
                              <tr key={ej.id} className="border-b border-white/5">
                                <td className="py-2.5 font-medium">{ej.nombre}</td>
                                <td className="py-2.5">{ej.series}</td>
                                <td className="py-2.5">{ej.repeticiones}</td>
                                <td className="py-2.5">{ej.peso ? `${ej.peso} kg` : "—"}</td>
                                <td className="py-2.5">{DIAS[DIAS_MAP[ej.dia_semana]]}</td>
                                <td className="py-2.5">{ej.hora ? ej.hora.slice(0, 5) : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Este plan no tiene ejercicios asignados.</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Mis Clases */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Mis Clases</CardTitle>
            </CardHeader>
            <CardContent>
              {clases.length === 0 ? (
                <p className="text-muted-foreground text-sm">No estás inscrito en ninguna clase.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-muted-foreground uppercase tracking-wider text-[11px]">
                        <th className="pb-3 font-semibold">Clase</th>
                        <th className="pb-3 font-semibold">Horario</th>
                        <th className="pb-3 font-semibold">Entrenador</th>
                        <th className="pb-3 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clases.map((c, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-3 font-medium">{c.nombre}</td>
                          <td className="py-3">{new Date(c.horario).toLocaleString("es-CO")}</td>
                          <td className="py-3">{c.entrenador}</td>
                          <td className="py-3">
                            <Badge variant={c.estado === "activa" ? "default" : "secondary"} className="text-[10px]">
                              {c.estado}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial de Pagos */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {pagos.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay pagos registrados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-muted-foreground uppercase tracking-wider text-[11px]">
                        <th className="pb-3 font-semibold">Plan</th>
                        <th className="pb-3 font-semibold">Monto</th>
                        <th className="pb-3 font-semibold">Fecha</th>
                        <th className="pb-3 font-semibold">Método</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map((p, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-3 font-medium">{p.tipo_membresia}</td>
                          <td className="py-3">${p.monto.toLocaleString("es-CO")}</td>
                          <td className="py-3">{new Date(p.fecha_pago).toLocaleDateString("es-CO")}</td>
                          <td className="py-3 capitalize">{p.metodo_pago}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Eliminar Cuenta */}
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Esta acción es irreversible. Todos tus datos serán eliminados permanentemente.
          </p>
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
                  <Label htmlFor="delete-password-perfil">Contraseña</Label>
                  <Input
                    id="delete-password-perfil"
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
