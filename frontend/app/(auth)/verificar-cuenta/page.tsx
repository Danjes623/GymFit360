"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

export default function VerificarCuentaPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <VerificarCuenta />
    </Suspense>
  );
}

function VerificarCuenta() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCodigo = [...codigo];
    newCodigo[index] = value.slice(-1);
    setCodigo(newCodigo);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codigo[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCodigo = [...codigo];
    for (let i = 0; i < text.length; i++) {
      newCodigo[i] = text[i];
    }
    setCodigo(newCodigo);
    const nextIndex = Math.min(text.length, 5);
    inputsRef.current[nextIndex]?.focus();
  };

  const verificar = async () => {
    const code = codigo.join("");
    if (code.length !== 6) {
      toast.error("Ingresa el código completo de 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/verificar-codigo", { email, codigo: code });
      localStorage.setItem("token", res.data.data.token);
      document.cookie = `token=${res.data.data.token}; path=/; max-age=86400; SameSite=Lax`;
      toast.success("Cuenta verificada exitosamente");
      router.push("/mi-perfil");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al verificar");
    } finally {
      setLoading(false);
    }
  };

  const reenviar = async () => {
    setReenviando(true);
    try {
      await api.post("/auth/reenviar-codigo", { email });
      toast.success("Nuevo código enviado a tu email");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al reenviar");
    } finally {
      setReenviando(false);
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
          <div className="text-center space-y-2">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Verifica tu cuenta</h1>
            <p className="text-sm text-muted-foreground">
              Hemos enviado un código de 6 dígitos a
            </p>
            <p className="text-sm font-semibold text-primary">{email || "tu correo"}</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
              {codigo.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 h-14 text-center text-lg font-bold rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
              ))}
            </div>

            {!email && (
              <p className="text-xs text-destructive text-center">
                No se encontró email en la URL. Vuelve a registrarte.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-11 font-semibold text-sm bg-primary text-[#050505] hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all duration-300"
              disabled={loading || !email}
              onClick={verificar}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar código"
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                className="text-xs text-muted-foreground hover:text-primary p-0"
                disabled={reenviando || !email}
                onClick={reenviar}
              >
                {reenviando ? "Reenviando..." : "Reenviar código"}
              </Button>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Volver al registro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
