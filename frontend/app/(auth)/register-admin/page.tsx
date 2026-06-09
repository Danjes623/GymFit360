"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, ChevronRight, CreditCard, Mail, Shield } from "lucide-react";
import api from "@/lib/api";

interface PlanAdmin {
  id: number;
  nombre: string;
  duracion_dias: number;
  precio: number;
  descripcion: string;
}

const infoFormSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  email: z.string().email("Debe ser un email válido"),
});

const registroSchema = z.object({
  codigo: z.string().min(1, "El código es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmarPassword: z.string().min(6, "Debe confirmar la contraseña"),
}).refine((data) => data.password === data.confirmarPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarPassword"],
});

const steps = ["Plan", "Datos", "Pago", "Código"];

export default function RegisterAdminPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [planes, setPlanes] = useState<PlanAdmin[]>([]);
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanAdmin | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [suscripcionId, setSuscripcionId] = useState<number | null>(null);

  const infoForm = useForm<z.infer<typeof infoFormSchema>>({
    resolver: zodResolver(infoFormSchema),
  });

  const registroForm = useForm<z.infer<typeof registroSchema>>({
    resolver: zodResolver(registroSchema),
  });

  useEffect(() => {
    api.get("/planes-admin")
      .then((res) => setPlanes(res.data.data))
      .catch(() => toast.error("Error al cargar planes"))
      .finally(() => setLoadingPlanes(false));
  }, []);

  const handleSeleccionarPlan = (plan: PlanAdmin) => {
    setPlanSeleccionado(plan);
    setStep(1);
  };

  const handleInfoSubmit = async (data: z.infer<typeof infoFormSchema>) => {
    if (!planSeleccionado) return;
    setLoading(true);
    try {
      const res = await api.post("/suscripciones-admin/solicitar", {
        plan_admin_id: planSeleccionado.id,
        nombre: data.nombre,
        email: data.email,
      });
      setSuscripcionId(res.data.data.suscripcion_id);
      setStep(2);
      toast.success("Pago simulado exitosamente. Se ha generado tu código.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const handlePagarMock = () => {
    setStep(3);
  };

  const handleRegistroSubmit = async (data: z.infer<typeof registroSchema>) => {
    if (!infoForm.watch("nombre") || !infoForm.watch("email")) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/register-admin", {
        nombre: infoForm.getValues("nombre"),
        email: infoForm.getValues("email"),
        password: data.password,
        codigo: data.codigo,
      });
      localStorage.setItem("token", res.data.data.token);
      document.cookie = `token=${res.data.data.token}; path=/; max-age=86400; SameSite=Lax`;
      toast.success("Administrador registrado exitosamente");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al completar el registro");
    } finally {
      setLoading(false);
    }
  };

  const content = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Selecciona el plan de suscripción para tu gimnasio
            </p>
            {loadingPlanes ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="grid gap-3">
                {planes.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`p-4 cursor-pointer border transition-all duration-200 hover:border-primary/50 ${
                      planSeleccionado?.id === plan.id
                        ? "border-primary bg-primary/5"
                        : "border-white/10 bg-white/5"
                    }`}
                    onClick={() => handleSeleccionarPlan(plan)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{plan.nombre}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{plan.descripcion}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          ${plan.precio.toLocaleString("es-CO")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plan.duracion_dias === 30 ? "mensual" : "anual"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <form onSubmit={infoForm.handleSubmit(handleInfoSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Plan seleccionado: <span className="font-semibold text-primary">{planSeleccionado?.nombre}</span> —{" "}
              <span className="font-semibold">${planSeleccionado?.precio.toLocaleString("es-CO")}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-sm font-medium">Nombre completo *</Label>
              <Input
                id="nombre"
                placeholder="Nombre del administrador"
                className="bg-white/5 border-white/10 focus:border-primary/50 h-11"
                {...infoForm.register("nombre")}
              />
              {infoForm.formState.errors.nombre && (
                <p className="text-sm text-destructive">{infoForm.formState.errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="bg-white/5 border-white/10 focus:border-primary/50 h-11"
                {...infoForm.register("email")}
              />
              {infoForm.formState.errors.email && (
                <p className="text-sm text-destructive">{infoForm.formState.errors.email.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm bg-primary text-[#050505] hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Procesando..." : "Continuar al pago"}
            </Button>
          </form>
        );

      case 2:
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Pago simulado</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Vas a pagar <span className="font-semibold text-primary">${planSeleccionado?.precio.toLocaleString("es-CO")}</span> por el <span className="font-semibold">{planSeleccionado?.nombre}</span>
              </p>
            </div>
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="space-y-2 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span>{planSeleccionado?.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{infoForm.watch("email")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método</span>
                  <span>Simulado</span>
                </div>
                <hr className="border-white/10" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">${planSeleccionado?.precio.toLocaleString("es-CO")}</span>
                </div>
              </div>
            </Card>
            <Button
              onClick={handlePagarMock}
              className="w-full h-11 font-semibold text-sm bg-primary text-[#050505] hover:bg-primary/90"
            >
              Pagar ${planSeleccionado?.precio.toLocaleString("es-CO")} (Simulado)
            </Button>
          </div>
        );

      case 3:
        return (
          <form onSubmit={registroForm.handleSubmit(handleRegistroSubmit)} className="space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Revisa tu bandeja de entrada (<span className="font-semibold text-primary">{infoForm.watch("email")}</span>).
              Te enviamos un código de activación.
            </p>
            <div className="space-y-2">
              <Label htmlFor="codigo" className="text-sm font-medium">Código de activación *</Label>
              <Input
                id="codigo"
                placeholder="Ej: A1B2C3D4"
                className="bg-white/5 border-primary/30 focus:border-primary/50 h-11 font-mono tracking-wider uppercase text-center text-lg"
                {...registroForm.register("codigo")}
              />
              {registroForm.formState.errors.codigo && (
                <p className="text-sm text-destructive">{registroForm.formState.errors.codigo.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mín. 6"
                  className="bg-white/5 border-white/10 focus:border-primary/50 h-11"
                  {...registroForm.register("password")}
                />
                {registroForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{registroForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmarPassword" className="text-sm font-medium">Confirmar *</Label>
                <Input
                  id="confirmarPassword"
                  type="password"
                  placeholder="Repite"
                  className="bg-white/5 border-white/10 focus:border-primary/50 h-11"
                  {...registroForm.register("confirmarPassword")}
                />
                {registroForm.formState.errors.confirmarPassword && (
                  <p className="text-sm text-destructive">{registroForm.formState.errors.confirmarPassword.message}</p>
                )}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm bg-primary text-[#050505] hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Registrando..." : "Completar registro"}
            </Button>
          </form>
        );
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md mx-4">
        <div className="glass rounded-2xl p-8 space-y-6">
          <button onClick={() => router.push("/login")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Volver al inicio de sesión
          </button>
          <div className="text-center space-y-2">
            <img alt="GymFit360" className="h-12 w-12 rounded-xl inline-flex mb-2" src="/logo.png" />
            <h1 className="text-2xl font-bold tracking-tight">Registro de Administrador</h1>
            <p className="text-sm text-muted-foreground">
              {step === 0 && "Elige un plan de suscripción para tu gimnasio"}
              {step === 1 && "Completa tus datos para continuar"}
              {step === 2 && "Revisa y confirma tu pago"}
              {step === 3 && "Ingresa el código recibido por email"}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium transition-all duration-300 ${
                    i < step
                      ? "bg-primary text-[#050505]"
                      : i === step
                      ? "bg-primary/20 text-primary border border-primary"
                      : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-6 transition-all duration-300 ${
                      i < step ? "bg-primary" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {content()}

          <div className="flex justify-between items-center text-sm">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Atrás
              </button>
            ) : (
              <div />
            )}
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
