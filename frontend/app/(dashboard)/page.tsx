"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface DashboardData {
  afiliados_activos: number;
  entrenadores_activos: number;
  clases_hoy: number;
  membresias_por_vencer: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get("/reportes/resumen")
      .then((res) => setData(res.data.data))
      .catch(() => {});
  }, []);

  const cards = [
    { label: "Afiliados activos", value: data?.afiliados_activos ?? "-", color: "text-blue-600" },
    { label: "Entrenadores activos", value: data?.entrenadores_activos ?? "-", color: "text-green-600" },
    { label: "Clases hoy", value: data?.clases_hoy ?? "-", color: "text-purple-600" },
    { label: "Membresías por vencer", value: data?.membresias_por_vencer ?? "-", color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
