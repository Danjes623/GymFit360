"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function MiPerfilLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<{ nombre: string; email: string; rol: string } | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data.data.rol !== "usuario") {
          router.push("/dashboard");
          return;
        }
        setUsuario(res.data.data);
      } catch {
        router.push("/login");
      }
    };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      loadUser();
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0";
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      <header className="sticky top-0 z-50 bg-[#121414]/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex justify-between items-center px-6 py-3 max-w-[1200px] mx-auto">
          <a href="/mi-perfil" className="flex items-center gap-2.5">
            <img alt="GymFit360" className="h-8 w-8 rounded-lg" src="/logo.png"/>
            <div>
              <h1 className="text-base font-bold tracking-tight">GymFit360</h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Mi Perfil</p>
            </div>
          </a>
          <div className="flex items-center gap-4">
            {usuario && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {usuario.nombre}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="p-6 max-w-[1200px] mx-auto">{children}</main>
    </div>
  );
}
