"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

interface Afiliado {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  documento: string;
  fecha_nacimiento: string | null;
  fecha_ingreso: string;
  direccion: string | null;
}

interface Membresia {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  activa: number;
  tipo_membresia: string;
  precio: number;
}

interface Clase {
  nombre: string;
  horario: string;
  duracion_minutos: number;
  entrenador: string;
  estado: string;
  fecha_inscripcion: string;
}

interface Plan {
  nombre: string;
  descripcion: string;
  objetivo: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: number;
  entrenador: string;
}

interface Pago {
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  referencia: string | null;
  tipo_membresia: string;
}

export default function MiPerfilPage() {
  const [perfil, setPerfil] = useState<{ afiliado: Afiliado; membresia: Membresia | null } | null>(null);
  const [clases, setClases] = useState<Clase[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, cRes, plRes, pgRes] = await Promise.all([
          api.get("/mi-perfil"),
          api.get("/mi-perfil/clases"),
          api.get("/mi-perfil/planes"),
          api.get("/mi-perfil/pagos"),
        ]);
        setPerfil(pRes.data.data);
        setClases(cRes.data.data);
        setPlanes(plRes.data.data);
        setPagos(pgRes.data.data);
      } catch {
        // error silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Perfil no encontrado</h2>
        <p className="text-muted-foreground">No tienes un perfil de afiliado vinculado. Contacta a administración.</p>
      </div>
    );
  }

  const { afiliado, membresia } = perfil;
  const diasRestantes = membresia
    ? Math.max(0, Math.ceil((new Date(membresia.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-8">
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

      {/* Mis Planes */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Mis Planes de Entrenamiento</CardTitle>
        </CardHeader>
        <CardContent>
          {planes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tienes planes de entrenamiento asignados.</p>
          ) : (
            <div className="space-y-4">
              {planes.map((p, i) => (
                <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold">{p.nombre}</h4>
                    <Badge className={p.activo ? "bg-primary text-[#050505]" : ""}>{p.activo ? "Activo" : "Inactivo"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{p.descripcion}</p>
                  {p.objetivo && <p className="text-xs text-primary mb-1">Objetivo: {p.objetivo}</p>}
                  <p className="text-xs text-muted-foreground">
                    Entrenador: {p.entrenador} &middot; Inicio: {new Date(p.fecha_inicio).toLocaleDateString("es-CO")}
                    {p.fecha_fin && ` — Fin: ${new Date(p.fecha_fin).toLocaleDateString("es-CO")}`}
                  </p>
                </div>
              ))}
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
    </div>
  );
}
