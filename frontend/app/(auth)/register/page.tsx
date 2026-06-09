"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";

const registerSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  email: z.string().email("Debe ser un email válido"),
  telefono: z.string().max(20, "Máximo 20 caracteres").optional().or(z.literal("")),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmarPassword: z.string().min(6, "Debe confirmar la contraseña"),
}).refine((data) => data.password === data.confirmarPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await api.post("/auth/register", {
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono || undefined,
        password: data.password,
      });
      toast.success("Código de verificación enviado a tu email");
      router.push("/verificar-cuenta?email=" + encodeURIComponent(data.email));
    } catch (err: any) {
      const message = err.response?.data?.error || "Error al crear la cuenta";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md mx-4">
        <div className="glass rounded-2xl p-8 space-y-6">
          <button onClick={() => router.push("/login")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Volver al inicio de sesión
          </button>
          <div className="text-center space-y-2">
            <img alt="GymFit360" className="h-12 w-12 rounded-xl inline-flex mb-2" src="/logo.png"/>
            <h1 className="text-2xl font-bold tracking-tight">Crear cuenta de miembro</h1>
            <p className="text-sm text-muted-foreground">Regístrate para acceder a tu perfil de gimnasio</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-sm font-medium">Nombre completo *</Label>
              <Input
                id="nombre"
                placeholder="Tu nombre"
                className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-11"
                {...register("nombre")}
              />
              {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="bg-white/5 border-white/10 focus:border-primary/50 h-11"
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-sm font-medium">Teléfono <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="+57 300 000 0000"
                className="bg-white/5 border-white/10 focus:border-primary/50 h-11"
                {...register("telefono")}
              />
              {errors.telefono && <p className="text-sm text-destructive">{errors.telefono.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mín. 6"
                  className="bg-white/5 border-white/10 focus:border-primary/50 h-11"
                  {...register("password")}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmarPassword" className="text-sm font-medium">Confirmar *</Label>
                <Input
                  id="confirmarPassword"
                  type="password"
                  placeholder="Repite"
                  className="bg-white/5 border-white/10 focus:border-primary/50 h-11"
                  {...register("confirmarPassword")}
                />
                {errors.confirmarPassword && <p className="text-sm text-destructive">{errors.confirmarPassword.message}</p>}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm bg-primary text-[#050505] hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all duration-300"
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline transition-colors">
              Inicia sesión
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            ¿Eres administrador?{" "}
            <Link href="/register-admin" className="font-semibold text-primary hover:underline transition-colors">
              Suscríbete como administrador
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
