"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

interface Ingreso {
  mes: string;
  total: number;
  cantidad: number;
}

interface Distribucion {
  membresias: { nombre: string; total: number }[];
  total_afiliados: number;
}

interface PagoReciente {
  id: number;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  afiliado: string;
  membresia: string;
}

interface MetodoPago {
  metodo_pago: string;
  cantidad: number;
  total: number;
}

interface ResumenFinanciero {
  total_mes: number;
  total_mes_anterior: number;
  variacion: number;
  total_anual: number;
  promedio_mensual: number;
}

const formatCurrency = (n: number) => "$" + n.toLocaleString("es-CO");

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export default function ReportesPage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [distribucion, setDistribucion] = useState<Distribucion | null>(null);
  const [ultimosPagos, setUltimosPagos] = useState<PagoReciente[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [financiero, setFinanciero] = useState<ResumenFinanciero | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/reportes/ingresos"),
      api.get("/reportes/distribucion-afiliados"),
      api.get("/reportes/ultimos-pagos"),
      api.get("/reportes/metodos-pago"),
      api.get("/reportes/resumen-financiero"),
    ])
      .then(([i, d, p, m, f]) => {
        setIngresos(i.data.data);
        setDistribucion(d.data.data);
        setUltimosPagos(p.data.data);
        setMetodosPago(m.data.data);
        setFinanciero(f.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pagosFiltrados = useMemo(() => {
    if (!filtroMes) return ultimosPagos;
    return ultimosPagos.filter((p) => p.fecha_pago.startsWith(filtroMes));
  }, [ultimosPagos, filtroMes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Chart data
  const ingresosReversed = [...ingresos].reverse().slice(-12);
  const maxIngreso = Math.max(...ingresosReversed.map((i) => i.total), 1);
  const chartH = 200;
  const chartW = 600;
  const stepX = chartW / Math.max(ingresosReversed.length - 1, 1);
  const points = ingresosReversed.map(
    (d, i) => `${i * stepX},${chartH - (d.total / maxIngreso) * chartH * 0.85}`
  ).join(" ");
  const polygonPoints = `${points} ${(ingresosReversed.length - 1) * stepX},${chartH} 0,${chartH}`;

  // Payment methods donut
  const totalPagos = metodosPago.reduce((s, m) => s + m.cantidad, 0);
  const colores: Record<string, string> = {
    efectivo: "#CCFF00",
    tarjeta: "#60a5fa",
    transferencia: "#a78bfa",
    otro: "#c4c7c7",
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[32px] font-[800] italic uppercase tracking-[-0.02em] text-white">Reportes</h2>
        <p className="text-[16px] text-[#c4c7c7] mt-1">Análisis financiero y distribución del gimnasio</p>
      </div>

      {/* Resumen Financiero */}
      {financiero && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass p-6 group hover:border-primary/50 transition-all duration-300">
            <span className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7]">Total del mes</span>
            <p className="font-['Montserrat'] text-[32px] font-[800] italic text-primary mt-2">
              {formatCurrency(financiero.total_mes)}
            </p>
          </div>
          <div className="glass p-6 group hover:border-primary/50 transition-all duration-300">
            <span className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7]">Vs mes anterior</span>
            <div className="flex items-center gap-2 mt-2">
              <span className={`font-['Montserrat'] text-[32px] font-[800] italic ${financiero.variacion >= 0 ? "text-green-400" : "text-red-400"}`}>
                {financiero.variacion >= 0 ? "+" : ""}{financiero.variacion}%
              </span>
            </div>
          </div>
          <div className="glass p-6 group hover:border-primary/50 transition-all duration-300">
            <span className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7]">Total anual</span>
            <p className="font-['Montserrat'] text-[32px] font-[800] italic text-primary mt-2">
              {formatCurrency(financiero.total_anual)}
            </p>
          </div>
          <div className="glass p-6 group hover:border-primary/50 transition-all duration-300">
            <span className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7]">Promedio mensual</span>
            <p className="font-['Montserrat'] text-[32px] font-[800] italic text-primary mt-2">
              {formatCurrency(financiero.promedio_mensual)}
            </p>
          </div>
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Ingresos Chart */}
        <div className="col-span-12 lg:col-span-8 glass p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[12px] font-[600] tracking-[0.1em] uppercase text-white">Historial de Ingresos</h3>
              <p className="text-[14px] text-[#c4c7c7]">Últimos 12 meses</p>
            </div>
          </div>
          {ingresosReversed.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-[#c4c7c7] text-sm">Sin datos de ingresos</div>
          ) : (
            <>
              <div className="flex-1 min-h-[200px] relative">
                <svg className="w-full h-full" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="rpt-kinetic" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#CCFF00" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points={polygonPoints} fill="url(#rpt-kinetic)" />
                  <polyline points={points} fill="none" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {ingresosReversed.map((_, i) => (
                    <line key={i} x1={i * stepX} y1="0" x2={i * stepX} y2={chartH} stroke="#333" strokeDasharray="3" strokeWidth="0.5" />
                  ))}
                </svg>
              </div>
              <div className="flex justify-between text-[11px] text-[#c4c7c7] font-[600] tracking-[0.1em] mt-4">
                {ingresosReversed.map((d, i) => {
                  const [, m] = d.mes.split("-");
                  return <span key={i}>{MONTHS[parseInt(m) - 1]}</span>;
                })}
              </div>
            </>
          )}
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[#c4c7c7] uppercase tracking-wider text-[11px]">
                  <th className="pb-3 font-semibold">Mes</th>
                  <th className="pb-3 font-semibold">Pagos</th>
                  <th className="pb-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {ingresosReversed.slice(0, 6).map((d) => {
                  const [, m] = d.mes.split("-");
                  return (
                    <tr key={d.mes} className="border-b border-white/5">
                      <td className="py-3">{MONTHS[parseInt(m) - 1]}</td>
                      <td className="py-3 text-[#c4c7c7]">{d.cantidad}</td>
                      <td className="py-3 font-bold text-primary">{formatCurrency(d.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="col-span-12 lg:col-span-4 glass p-6">
          <h3 className="text-[12px] font-[600] tracking-[0.1em] uppercase text-white mb-6">Métodos de Pago</h3>
          {metodosPago.length === 0 ? (
            <p className="text-sm text-[#c4c7c7]">Sin datos</p>
          ) : (
            <div className="space-y-5">
              {metodosPago.map((m) => {
                const pct = totalPagos > 0 ? Math.round((m.cantidad / totalPagos) * 100) : 0;
                const color = colores[m.metodo_pago] || "#c4c7c7";
                return (
                  <div key={m.metodo_pago}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white font-medium capitalize">{m.metodo_pago}</span>
                      <span className="text-[#c4c7c7]">{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", backgroundColor: color }} />
                    </div>
                    <p className="text-[11px] text-[#c4c7c7]/60 mt-1">{m.cantidad} pagos · {formatCurrency(m.total)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Distribución Membresías */}
        <div className="col-span-12 lg:col-span-4 glass p-6">
          <h3 className="text-[12px] font-[600] tracking-[0.1em] uppercase text-white mb-6">Distribución por Membresía</h3>
          {!distribucion || distribucion.membresias.length === 0 ? (
            <p className="text-sm text-[#c4c7c7]">Sin datos</p>
          ) : (
            <div className="space-y-4">
              {distribucion.membresias.map((m) => {
                const pct = distribucion.total_afiliados > 0
                  ? Math.round((m.total / distribucion.total_afiliados) * 100)
                  : 0;
                return (
                  <div key={m.nombre}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white font-medium">{m.nombre}</span>
                      <span className="text-primary font-bold">{m.total}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: pct + "%" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimos Pagos */}
        <div className="col-span-12 lg:col-span-8 glass overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-[12px] font-[600] tracking-[0.1em] uppercase text-white">Últimos Pagos</h3>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="bg-white/5 border border-white/10 text-sm px-3 py-1.5 rounded text-[#c4c7c7] focus:border-primary/50 outline-none"
            >
              <option value="">Todos</option>
              {ingresos.map((i) => (
                <option key={i.mes} value={i.mes}>{i.mes}</option>
              ))}
            </select>
          </div>
          {pagosFiltrados.length === 0 ? (
            <div className="p-6 text-sm text-[#c4c7c7]">Sin pagos registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02]">
                  <tr>
                    <th className="p-4 text-[11px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7]">Afiliado</th>
                    <th className="p-4 text-[11px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7]">Membresía</th>
                    <th className="p-4 text-[11px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7]">Monto</th>
                    <th className="p-4 text-[11px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7]">Fecha</th>
                    <th className="p-4 text-[11px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7]">Método</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pagosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-sm font-bold text-white">{p.afiliado}</td>
                      <td className="p-4 text-sm text-[#c4c7c7]">{p.membresia}</td>
                      <td className="p-4 text-sm font-bold text-primary">{formatCurrency(p.monto)}</td>
                      <td className="p-4 text-sm text-[#c4c7c7]">{new Date(p.fecha_pago).toLocaleDateString("es-CO")}</td>
                      <td className="p-4 text-sm capitalize text-[#c4c7c7]">{p.metodo_pago}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
