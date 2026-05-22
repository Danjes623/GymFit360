"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Dumbbell,
  CreditCard,
  Calendar,
  ClipboardList,
  BarChart3,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const baseNavItems = [
  { href: "/afiliados", label: "Afiliados", icon: Users },
  { href: "/entrenadores", label: "Entrenadores", icon: Dumbbell },
  { href: "/membresias", label: "Membresías", icon: CreditCard },
  { href: "/clases", label: "Clases", icon: Calendar },
  { href: "/planes", label: "Planes", icon: ClipboardList },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rol, setRol] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const fetchRol = async () => {
      try {
        const res = await api.get("/auth/me");
        const userRol = res.data.data.rol;
        setRol(userRol);
        if (userRol === "usuario") {
          router.push("/mi-perfil");
        }
      } catch {
        router.push("/login");
      }
    };
    fetchRol();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const navItems = rol === "admin"
    ? [...baseNavItems, { href: "/recepcionistas", label: "Recepcionistas", icon: UserPlus }]
    : baseNavItems;

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 glass-strong transform transition-all duration-300 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <img alt="GymFit360" className="h-8 w-8 rounded-lg" src="/logo.png"/>
            <div>
              <h1 className="text-base font-bold tracking-tight">GymFit360</h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Management</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-3">
          <Link href="/dashboard">
            <span
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === "/dashboard"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </span>
          </Link>
        </div>

        <div className="px-3 mb-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Módulos
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary/10 text-primary border border-primary/20 glow-green-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 mt-auto border-t border-white/5">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2.5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-4 p-4 border-b border-white/5 bg-[#050505] lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-muted-foreground">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <img alt="GymFit360" className="h-7 w-7 rounded-lg" src="/logo.png"/>
            <h1 className="font-bold text-sm">GymFit360</h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-radial">{children}</main>
      </div>
    </div>
  );
}
