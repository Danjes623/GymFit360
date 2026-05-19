"use client";

import { useEffect, useState } from "react";
import { DollarSign, Users, Dumbbell, CreditCard, Calendar } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Resumen {
  afiliados_activos: number;
  entrenadores_activos: number;
  clases_hoy: number;
  membresias_por_vencer: number;
}

interface Ingreso {
  mes: string;
  total: string;
  cantidad: number;
}

interface Distribucion {
  membresias: { nombre: string; total: number }[];
  total_afiliados: number;
}

interface PagoReciente {
  id: number;
  monto: string;
  fecha_pago: string;
  metodo_pago: string;
  afiliado: string;
  membresia: string;
}

export default function ReportesPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [distribucion, setDistribucion] = useState<Distribucion | null>(null);
  const [ultimosPagos, setUltimosPagos] = useState<PagoReciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [r, i, d, p] = await Promise.all([
          api.get("/reportes/resumen"),
          api.get("/reportes/ingresos"),
          api.get("/reportes/distribucion-afiliados"),
          api.get("/reportes/ultimos-pagos"),
        ]);
        setResumen(r.data.data);
        setIngresos(i.data.data);
        setDistribucion(d.data.data);
        setUltimosPagos(p.data.data);
      } catch {
        toast.error("Error al cargar reportes");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const cards = [
    { label: "Afiliados activos", value: resumen?.afiliados_activos ?? "-", icon: Users, color: "text-blue-600" },
    { label: "Entrenadores activos", value: resumen?.entrenadores_activos ?? "-", icon: Dumbbell, color: "text-green-600" },
    { label: "Clases hoy", value: resumen?.clases_hoy ?? "-", icon: Calendar, color: "text-purple-600" },
    { label: "Memb. por vencer", value: resumen?.membresias_por_vencer ?? "-", icon: CreditCard, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reportes</h1>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Ingresos mensuales
              </h2>
              {ingresos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos de ingresos</p>
              ) : (
                <div className="space-y-2">
                  {ingresos.map((i) => (
                    <div key={i.mes} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{i.mes}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">{i.cantidad} pagos</span>
                        <span className="font-medium">${parseFloat(i.total).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Distribución por membresía
              </h2>
              {!distribucion || distribucion.membresias.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos</p>
              ) : (
                <div className="space-y-2">
                  {distribucion.membresias.map((m) => {
                    const pct = distribucion.total_afiliados > 0
                      ? ((m.total / distribucion.total_afiliados) * 100).toFixed(1)
                      : "0";
                    return (
                      <div key={m.nombre} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{m.nombre}</span>
                          <span className="text-muted-foreground">{m.total} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Últimos pagos</h2>
            {ultimosPagos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Afiliado</th>
                      <th className="pb-2 font-medium">Membresía</th>
                      <th className="pb-2 font-medium">Monto</th>
                      <th className="pb-2 font-medium">Método</th>
                      <th className="pb-2 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimosPagos.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2">{p.afiliado}</td>
                        <td className="py-2 text-muted-foreground">{p.membresia}</td>
                        <td className="py-2 font-medium">${parseFloat(p.monto).toFixed(2)}</td>
                        <td className="py-2 capitalize">{p.metodo_pago}</td>
                        <td className="py-2 text-muted-foreground">{new Date(p.fecha_pago).toLocaleDateString("es-CO")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
