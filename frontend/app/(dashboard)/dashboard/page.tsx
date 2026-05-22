"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

interface Resumen {
  afiliados_activos: number;
  entrenadores_activos: number;
  clases_hoy: number;
  membresias_por_vencer: number;
}

interface UltimoPago {
  id: number;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  afiliado: string;
  membresia: string;
}

interface Clase {
  id: number;
  nombre: string;
  horario: string;
  duracion_minutos: number;
  entrenador: string;
  cupo_maximo: number;
  cupo_actual: number;
  activa: number;
}

const formatCurrency = (n: number) => "$" + n.toLocaleString("es-CO");

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return formatDate(d);
};

export default function DashboardPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [clases, setClases] = useState<Clase[]>([]);
  const [ultimosPagos, setUltimosPagos] = useState<UltimoPago[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/reportes/resumen"),
      api.get("/clases"),
      api.get("/reportes/ultimos-pagos"),
    ])
      .then(([r, c, p]) => {
        setResumen(r.data.data);
        setClases(c.data.data);
        setUltimosPagos(p.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const proximasClases = clases
    .filter((c) => c.horario > new Date().toISOString() && c.activa)
    .slice(0, 5);

  const clasesCriticas = clases.filter(
    (c) => c.activa && c.cupo_maximo - c.cupo_actual <= Math.ceil(c.cupo_maximo * 0.2)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[32px] font-[800] italic uppercase tracking-[-0.02em] text-white">
          Dashboard
        </h2>
        <p className="text-[16px] text-[#c4c7c7] mt-1">Resumen general del gimnasio</p>
      </div>

      {/* Impact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { key: "afiliados_activos", label: "AFILIADOS ACTIVOS", icon: "groups", value: resumen?.afiliados_activos },
          { key: "entrenadores_activos", label: "ENTRENADORES ACTIVOS", icon: "fitness_center", value: resumen?.entrenadores_activos },
          { key: "clases_hoy", label: "CLASES HOY", icon: "calendar_month", value: resumen?.clases_hoy },
          { key: "membresias_por_vencer", label: "MEMBRESÍAS POR VENCER", icon: "warning", value: resumen?.membresias_por_vencer },
        ].map((card) => (
          <div key={card.key} className="glass p-6 group hover:border-primary/50 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7]">{card.label}</span>
              <span className="material-symbols-outlined text-primary opacity-50 group-hover:opacity-100 transition-opacity">{card.icon}</span>
            </div>
            <span className="font-['Montserrat'] text-[48px] font-[900] italic text-primary leading-none">
              {card.value ?? "—"}
            </span>
          </div>
        ))}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Próximas Clases */}
        <div className="col-span-12 lg:col-span-5 glass p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[12px] font-[600] tracking-[0.1em] uppercase text-white">Próximas Clases</h3>
          </div>
          {proximasClases.length === 0 ? (
            <p className="text-sm text-[#c4c7c7]">No hay clases próximas</p>
          ) : (
            <div className="space-y-4">
              {proximasClases.map((c) => (
                <div key={c.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-primary font-bold text-sm">{formatTime(c.horario)}</span>
                    <span className="text-[#c4c7c7] text-[11px] font-[600] tracking-[0.1em]">
                      {c.cupo_actual}/{c.cupo_maximo}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold uppercase text-white">{c.nombre}</h4>
                  <div className="flex justify-between items-end mt-1">
                    <p className="text-[12px] text-[#c4c7c7] italic">{c.entrenador}</p>
                    <span className="text-[10px] font-bold uppercase text-primary border border-primary/30 px-2 py-0.5">{c.duracion_minutos}min</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas */}
        <div className="col-span-12 lg:col-span-4 glass p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[12px] font-[600] tracking-[0.1em] uppercase text-white">Alertas</h3>
          </div>
          <div className="space-y-4">
            {resumen && resumen.membresias_por_vencer > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="material-symbols-outlined text-amber-400 text-xl">warning</span>
                <div>
                  <p className="text-sm font-bold text-amber-400">{resumen.membresias_por_vencer} membresías por vencer</p>
                  <p className="text-[12px] text-[#c4c7c7]">Vencen en los próximos 7 días</p>
                </div>
              </div>
            )}
            {clasesCriticas.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="material-symbols-outlined text-red-400 text-xl">group_off</span>
                <div>
                  <p className="text-sm font-bold text-red-400">{clasesCriticas.length} clases con cupo crítico</p>
                  <p className="text-[12px] text-[#c4c7c7]">Menos del 20% disponible</p>
                </div>
              </div>
            )}
            {resumen && resumen.afiliados_activos === 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="material-symbols-outlined text-blue-400 text-xl">info</span>
                <div>
                  <p className="text-sm font-bold text-blue-400">Sin afiliados activos</p>
                  <p className="text-[12px] text-[#c4c7c7]">Registra afiliados para comenzar</p>
                </div>
              </div>
            )}
            {resumen && resumen.membresias_por_vencer === 0 && clasesCriticas.length === 0 && (
              <p className="text-sm text-[#c4c7c7]">No hay alertas activas. Todo en orden.</p>
            )}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="col-span-12 lg:col-span-3 glass p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[12px] font-[600] tracking-[0.1em] uppercase text-white">Actividad Reciente</h3>
          </div>
          <div className="space-y-4">
            {ultimosPagos.length === 0 ? (
              <p className="text-sm text-[#c4c7c7]">Sin actividad reciente</p>
            ) : (
              ultimosPagos.slice(0, 6).map((p, i) => (
                <div key={p.id} className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">payments</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.afiliado}</p>
                    <p className="text-[11px] text-[#c4c7c7]">
                      {formatCurrency(p.monto)} · {p.membresia}
                    </p>
                    <p className="text-[10px] text-[#c4c7c7]/60">{timeAgo(p.fecha_pago)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
