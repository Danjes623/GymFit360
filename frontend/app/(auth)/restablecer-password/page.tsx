"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, AlertCircle } from "lucide-react";
import api from "@/lib/api";

const passwordSchema = z.object({
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmarPassword: z.string().min(6, "Debe confirmar la contraseña"),
}).refine((data) => data.password === data.confirmarPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function RestablecerPasswordPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <RestablecerPassword />
    </Suspense>
  );
}

function RestablecerPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordForm) => {
    setLoading(true);
    try {
      await api.post("/auth/restablecer-password", {
        token,
        password: data.password,
        confirmarPassword: data.confirmarPassword,
      });
      toast.success("Contraseña restablecida. Ya puedes iniciar sesión.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al restablecer la contraseña");
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

          {!token ? (
            <div className="text-center space-y-4 py-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Enlace inválido</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No se encontró un token de restablecimiento. Solicita un nuevo enlace.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/olvide-password")}
              >
                Solicitar nuevo enlace
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Nueva contraseña</h1>
                <p className="text-sm text-muted-foreground">
                  Ingresa tu nueva contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Nueva contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mín. 6 caracteres"
                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-11"
                    {...register("password")}
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarPassword" className="text-sm font-medium">Confirmar contraseña *</Label>
                  <Input
                    id="confirmarPassword"
                    type="password"
                    placeholder="Repite la contraseña"
                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-11"
                    {...register("confirmarPassword")}
                  />
                  {errors.confirmarPassword && <p className="text-sm text-destructive">{errors.confirmarPassword.message}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold text-sm bg-primary text-[#050505] hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? "Restableciendo..." : "Restablecer contraseña"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
