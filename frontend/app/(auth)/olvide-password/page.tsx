"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";
import api from "@/lib/api";

const emailSchema = z.object({
  email: z.string().email("Debe ser un email válido"),
});

type EmailForm = z.infer<typeof emailSchema>;

export default function OlvidePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailForm) => {
    setLoading(true);
    try {
      await api.post("/auth/olvide-password", { email: data.email });
      setEnviado(true);
    } catch {
      toast.error("Error al procesar la solicitud");
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

          {!enviado ? (
            <>
              <div className="text-center space-y-2">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">¿Olvidaste tu contraseña?</h1>
                <p className="text-sm text-muted-foreground">
                  Ingresa tu email y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-11"
                    {...register("email")}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold text-sm bg-primary text-[#050505] hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar enlace"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                ¿Recordaste tu contraseña?{" "}
                <button onClick={() => router.push("/login")} className="font-semibold text-primary hover:underline transition-colors">
                  Inicia sesión
                </button>
              </p>
            </>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Revisa tu email</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Si el email está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/login")}
              >
                Volver al inicio de sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
