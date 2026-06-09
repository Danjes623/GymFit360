"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";

const QUICK_LOGIN = [
  { label: "Administrador", email: "admin@gymfit360.com", password: "Admin2024!", role: "admin", icon: "shield" },
  { label: "Recepcionista", email: "recepcion@gymfit360.com", password: "Admin2024!", role: "recepcionista", icon: "support_agent" },
  { label: "Usuario", email: "jp.ramirez@email.com", password: "Admin2024!", role: "usuario", icon: "person" },
];

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: '', email: '', mensaje: '' });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const quickLogin = async (email: string, password: string, role: string) => {
    setLoading(email);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token } = res.data.data;
      localStorage.setItem("token", token);
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
      toast.success(`Bienvenido, ${role}`);
      if (role === "usuario") {
        router.push("/mi-perfil");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setLoading(null);
    }
  };
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const initObserver = () => {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("active");
          });
        },
        { threshold: 0.1 }
      );
      document.querySelectorAll(".reveal:not(.active)").forEach((el) => observerRef.current?.observe(el));
    };

    initObserver();

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        observerRef.current?.disconnect();
        initObserver();
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <div id="landing-page" className="bg-[#050505] text-[#e3e2e2] antialiased overflow-x-hidden">
      <style>{`
        .gradient-kinetic { background: linear-gradient(90deg, #CCFF00 0%, #abd600 100%); }
        .glass-card { background: rgba(26, 26, 26, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .neon-border-hover:hover { border-color: #CCFF00; box-shadow: 0 0 15px rgba(204, 255, 0, 0.2); }
        .text-glow { text-shadow: 0 0 10px rgba(204, 255, 0, 0.3); }
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
        .reveal.active { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* Top Nav */}
      <header className="fixed top-0 w-full z-50 bg-[#121414]/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex justify-between items-center px-[64px] py-2 max-w-[1280px] mx-auto h-20">
          <a href="/" className="flex items-center gap-3">
            <img alt="GymFit360" className="h-9 w-9 rounded-lg" src="/logo.png"/>
            <span className="font-['Montserrat'] text-2xl font-[800] italic uppercase tracking-tighter text-white">
              GYMFIT<span className="text-[#CCFF00]">360</span>
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7] hover:text-white transition-colors" href="#features">Features</a>
            <a className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7] hover:text-white transition-colors" href="#pricing">Planes</a>
            <a className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7] hover:text-white transition-colors" href="#contact">Contacto</a>
          </nav>
          <div className="flex gap-3">
            <a href="/login" className="px-5 py-2.5 text-[12px] font-[600] tracking-[0.1em] uppercase border border-[#CCFF00] text-[#CCFF00] hover:bg-[#CCFF00] hover:text-[#050505] transition-all">Ingresar</a>
            <a href="/register" className="px-5 py-2.5 text-[12px] font-[600] tracking-[0.1em] uppercase gradient-kinetic text-[#050505] font-bold hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all">Registrarse</a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#050505] via-[#121414] to-[#050505]">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          </div>
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(204,255,0,0.08) 0%, transparent 60%)" }} />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#CCFF00]/5 rounded-full blur-3xl" />
          <div className="relative z-10 px-[64px] max-w-[1280px] w-full text-left reveal">
            <p className="text-[12px] font-[600] tracking-[0.3em] uppercase text-[#CCFF00] mb-4">Gesti&oacute;n premium desde 2024</p>
            <h1 className="font-['Montserrat'] text-[80px] font-[900] italic uppercase text-white leading-none mb-8 tracking-[-0.04em]">
              FORJA TU<br/>
              <span className="text-[#CCFF00] text-glow">LEGADO</span>
            </h1>
            <p className="text-[18px] text-[#c4c7c7] max-w-xl mb-10 leading-relaxed">
              El sistema integral de gesti&oacute;n de gimnasio m&aacute;s avanzado. Controla afiliados, entrenadores, membres&iacute;as, clases y m&aacute;s desde un solo panel.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <a href="/register" className="gradient-kinetic text-[#050505] px-10 py-5 text-[12px] font-[600] tracking-[0.1em] font-bold uppercase hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] transition-all text-center">COMENZAR AHORA</a>
              <a href="#features" className="border border-[#CCFF00] text-[#CCFF00] px-10 py-5 text-[12px] font-[600] tracking-[0.1em] font-bold uppercase hover:bg-[#CCFF00] hover:text-[#050505] transition-all text-center">CONOCER M&Aacute;S</a>
            </div>
          </div>
        </section>

        {/* Quick Login */}
        <section className="py-[80px] bg-[#121414]">
          <div className="px-[64px] max-w-[1280px] mx-auto text-center reveal">
            <p className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#CCFF00] mb-2">ACCESO RÁPIDO</p>
            <h2 className="font-['Montserrat'] text-[56px] font-[800] italic uppercase tracking-[-0.02em] mb-12">SELECCIONA TU ROL</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
              {QUICK_LOGIN.map((q, i) => (
                <button
                  key={i}
                  disabled={loading === q.email}
                  onClick={() => quickLogin(q.email, q.password, q.role)}
                  className="glass-card p-10 neon-border-hover transition-all group text-left hover:-translate-y-1 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[#CCFF00] text-5xl mb-6 inline-block group-hover:scale-110 transition-transform">{q.icon}</span>
                  <h3 className="font-['Montserrat'] text-[24px] font-[700] uppercase mb-2 italic">{q.label}</h3>
                  <p className="text-[14px] text-[#c4c7c7] mb-4">Inicio de sesión automático</p>
                  <span className="inline-block px-3 py-1 border border-[#CCFF00]/30 text-[#CCFF00] text-[10px] font-[600] tracking-[0.1em] uppercase">
                    {loading === q.email ? "Ingresando..." : "Entrar como " + q.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[14px] text-[#c4c7c7] mt-10">
              ¿Prefieres usar tu propia cuenta?{" "}
              <a href="/login" className="text-[#CCFF00] font-semibold hover:underline">Inicia sesión aquí</a>
              {" o "}
              <a href="/register" className="text-[#CCFF00] font-semibold hover:underline">regístrate</a>
              {". "}
              ¿Eres administrador con código de invitación?{" "}
              <a href="/register-admin" className="text-[#CCFF00] font-semibold hover:underline">Regístrate aquí</a>
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-[80px] px-[64px] max-w-[1280px] mx-auto">
          <div className="text-center mb-[80px] reveal">
            <p className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#CCFF00] mb-2">TODO EN UN SOLO LUGAR</p>
            <h2 className="font-['Montserrat'] text-[56px] font-[800] italic uppercase tracking-[-0.02em]">CARACTER&Iacute;STICAS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "groups", title: "Afiliados", desc: "Gestión completa de miembros con historial de membresías, clases inscritas y planes de entrenamiento personalizados." },
              { icon: "fitness_center", title: "Entrenadores", desc: "Directorio de instructores con especialidades, horarios y asignación a clases grupales y planes individuales." },
              { icon: "credit_card", title: "Membresías", desc: "Planes flexibles con renovación automática, control de pagos y notificaciones de vencimiento próximas." },
              { icon: "calendar_month", title: "Clases", desc: "Programación de clases grupales con control de cupo, inscripciones y asignación automática de entrenadores." },
              { icon: "assignment", title: "Planes", desc: "Planes de entrenamiento personalizados creados por instructores para cada afiliado con objetivos medibles." },
              { icon: "bar_chart", title: "Reportes", desc: "Dashboard interactivo con métricas en tiempo real, ingresos mensuales y distribución de membresías." },
            ].map((f, i) => (
              <div key={i} className="glass-card p-10 neon-border-hover transition-all group reveal">
                <span className="material-symbols-outlined text-[#CCFF00] text-5xl mb-6 inline-block group-hover:scale-110 transition-transform">{f.icon}</span>
                <h3 className="font-['Montserrat'] text-[32px] font-[700] uppercase mb-4 italic tracking-[-0.01em]">{f.title}</h3>
                <p className="text-[16px] text-[#c4c7c7] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="py-[80px] bg-[#121414]">
          <div className="px-[64px] max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center reveal">
            {[
              { num: "10+", label: "Módulos" },
              { num: "100%", label: "Web" },
              { num: "24/7", label: "Disponible" },
              { num: "3 Capas", label: "Validación" },
            ].map((s, i) => (
              <div key={i}>
                <p className="font-['Montserrat'] text-[48px] font-[900] italic text-[#CCFF00]">{s.num}</p>
                <p className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7] mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-[80px] px-[64px] max-w-[1280px] mx-auto">
          <div className="text-center mb-[80px] reveal">
            <p className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#CCFF00] mb-2">ELIGE TU CAMINO</p>
            <h2 className="font-['Montserrat'] text-[56px] font-[800] italic uppercase tracking-[-0.02em]">PLANES</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="glass-card p-10 border-t-4 border-white/5 hover:border-white/20 transition-all reveal">
              <h3 className="font-['Montserrat'] text-[32px] font-[700] uppercase mb-2 italic tracking-[-0.01em]">B&aacute;sico</h3>
              <p className="text-[#c4c7c7] mb-6 text-[16px]">Acceso fundamental</p>
              <div className="font-['Montserrat'] text-[32px] font-[800] italic mb-8">$149<span className="text-[16px] not-italic font-normal text-[#c4c7c7]">/mo</span></div>
              <ul className="space-y-4 mb-10 text-[16px] text-[#c4c7c7]">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[#CCFF00] text-sm">check_circle</span> Acceso 24/7</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[#CCFF00] text-sm">check_circle</span> Lockers y duchas</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[#CCFF00] text-sm">check_circle</span> 2 pases de invitado/mes</li>
              </ul>
              <button className="w-full py-4 border border-white/10 hover:border-white text-[12px] font-[600] tracking-[0.1em] font-bold uppercase transition-all">Seleccionar</button>
            </div>
            <div className="glass-card p-12 border-t-4 border-[#CCFF00] scale-105 shadow-[0_0_40px_rgba(204,255,0,0.1)] reveal">
              <div className="bg-[#CCFF00] text-[#050505] inline-block px-3 py-1 text-[10px] font-[800] tracking-[0.1em] uppercase mb-4">M&aacute;s popular</div>
              <h3 className="font-['Montserrat'] text-[32px] font-[700] uppercase mb-2 italic tracking-[-0.01em]">Pro</h3>
              <p className="text-[#c4c7c7] mb-6 text-[16px]">Rendimiento mejorado</p>
              <div className="font-['Montserrat'] text-[32px] font-[800] italic mb-8 text-[#CCFF00]">$249<span className="text-[16px] not-italic font-normal text-[#c4c7c7]">/mo</span></div>
              <ul className="space-y-4 mb-10 text-[16px] text-[#c4c7c7]">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[#CCFF00] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Todo B&aacute;sico</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[#CCFF00] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Clases ilimitadas</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[#CCFF00] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 1 sesi&oacute;n personal/mes</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[#CCFF00] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Evaluaci&oacute;n nutricional</li>
              </ul>
              <button className="w-full py-5 gradient-kinetic text-[#050505] text-[12px] font-[600] tracking-[0.1em] font-extrabold uppercase hover:brightness-110 transition-all">Elegir Pro</button>
            </div>
            <div className="glass-card p-10 border-t-4 border-white/5 hover:border-white/20 transition-all reveal">
              <h3 className="font-['Montserrat'] text-[32px] font-[700] uppercase mb-2 italic tracking-[-0.01em]">Titan</h3>
              <p className="text-[#c4c7c7] mb-6 text-[16px]">Maestr&iacute;a total</p>
              <div className="font-['Montserrat'] text-[32px] font-[800] italic mb-8">$499<span className="text-[16px] not-italic font-normal text-[#c4c7c7]">/mo</span></div>
              <ul className="space-y-4 mb-10 text-[16px] text-[#c4c7c7]">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[#CCFF00] text-sm">check_circle</span> Todo Pro</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[#CCFF00] text-sm">check_circle</span> 4 sesiones personales/mes</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[#CCFF00] text-sm">check_circle</span> &Aacute;rea de recuperaci&oacute;n</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[#CCFF00] text-sm">check_circle</span> App personalizada</li>
              </ul>
              <button className="w-full py-4 border border-white/10 hover:border-white text-[12px] font-[600] tracking-[0.1em] font-bold uppercase transition-all">Seleccionar</button>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-[80px] bg-[#121414] relative overflow-hidden">
          <div className="px-[64px] max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-[80px] relative z-10 reveal">
            <div>
              <p className="text-[12px] font-[600] tracking-[0.1em] uppercase text-[#CCFF00] mb-2">CONTACTO</p>
              <h2 className="font-['Montserrat'] text-[56px] font-[800] italic uppercase tracking-[-0.02em] mb-8">HABLEMOS</h2>
              <p className="text-[18px] text-[#c4c7c7] mb-12 leading-relaxed">&iquest;Listo para transformar la gesti&oacute;n de tu gimnasio? Solicita una demostraci&oacute;n y un especialista te contactar&aacute; en 24 horas.</p>
              <div className="space-y-6">
                <div className="flex items-center gap-4"><span className="material-symbols-outlined text-[#CCFF00]">location_on</span><span className="text-[16px]">Av. Siempre Viva 742, Ciudad</span></div>
                <div className="flex items-center gap-4"><span className="material-symbols-outlined text-[#CCFF00]">call</span><span className="text-[16px]">+1 (555) GYMFIT-01</span></div>
                <div className="flex items-center gap-4"><span className="material-symbols-outlined text-[#CCFF00]">mail</span><span className="text-[16px]">info@gymfit360.com</span></div>
              </div>
            </div>
            <div className="glass-card p-10">
              <form className="space-y-8" onSubmit={async (e) => {
                e.preventDefault();
                if (enviando || enviado) return;
                setEnviando(true);
                try {
                  const res = await api.post('/auth/contacto', formData);
                  if (res.success) {
                    toast.success('Mensaje enviado correctamente. Te contactaremos pronto.');
                    setFormData({ nombre: '', email: '', mensaje: '' });
                    setEnviado(true);
                    setTimeout(() => setEnviado(false), 5000);
                  }
                } catch (err: unknown) {
                  const msg =
                    err && typeof err === 'object' && 'response' in err
                      ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                      : undefined;
                  toast.error(msg || 'Error al enviar el mensaje. Intenta de nuevo.');
                } finally {
                  setEnviando(false);
                }
              }}>
                <div className="relative group">
                  <input className="w-full bg-transparent border-0 border-b border-white/20 py-4 focus:ring-0 focus:border-[#CCFF00] transition-all peer placeholder-transparent outline-none text-white" id="name" placeholder="Nombre" type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}/>
                  <label className="absolute left-0 top-0 text-[10px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7] transition-all -translate-y-4 peer-placeholder-shown:translate-y-4 peer-placeholder-shown:text-[16px] peer-focus:-translate-y-4 peer-focus:text-[#CCFF00] peer-focus:text-[10px]" htmlFor="name">Nombre completo</label>
                </div>
                <div className="relative group">
                  <input className="w-full bg-transparent border-0 border-b border-white/20 py-4 focus:ring-0 focus:border-[#CCFF00] transition-all peer placeholder-transparent outline-none text-white" id="email" placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}/>
                  <label className="absolute left-0 top-0 text-[10px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7] transition-all -translate-y-4 peer-placeholder-shown:translate-y-4 peer-placeholder-shown:text-[16px] peer-focus:-translate-y-4 peer-focus:text-[#CCFF00] peer-focus:text-[10px]" htmlFor="email">Correo electr&oacute;nico</label>
                </div>
                <div className="relative group">
                  <textarea className="w-full bg-transparent border-0 border-b border-white/20 py-4 focus:ring-0 focus:border-[#CCFF00] transition-all peer placeholder-transparent outline-none text-white" id="message" placeholder="Mensaje" rows={3} value={formData.mensaje} onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}></textarea>
                  <label className="absolute left-0 top-0 text-[10px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7] transition-all -translate-y-4 peer-placeholder-shown:translate-y-4 peer-placeholder-shown:text-[16px] peer-focus:-translate-y-4 peer-focus:text-[#CCFF00] peer-focus:text-[10px]" htmlFor="message">Mensaje</label>
                </div>
                <button className="w-full py-5 gradient-kinetic text-[#050505] text-[12px] font-[600] tracking-[0.1em] font-extrabold uppercase hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed" type="submit" disabled={enviando || enviado}>{enviando ? 'Enviando...' : enviado ? 'Enviado ✓' : 'Enviar mensaje'}</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-white/5 py-[80px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-[64px] max-w-[1280px] mx-auto">
          <div>
            <a href="/" className="flex items-center gap-3 mb-6">
              <img alt="GymFit360" className="h-8 w-8 rounded-lg" src="/logo.png"/>
              <span className="font-['Montserrat'] text-lg font-[800] italic uppercase tracking-tighter text-white">GYMFIT360</span>
            </a>
            <p className="text-[16px] text-[#c4c7c7] pr-8 leading-relaxed">El est&aacute;ndar en gesti&oacute;n de gimnasios. Administra tu centro con la plataforma m&aacute;s avanzada.</p>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className="text-[12px] font-[600] tracking-[0.1em] uppercase text-white mb-2">ENLACES</h5>
            <a className="text-[16px] text-[#c4c7c7] hover:text-[#CCFF00] transition-all" href="#features">Features</a>
            <a className="text-[16px] text-[#c4c7c7] hover:text-[#CCFF00] transition-all" href="#pricing">Planes</a>
            <a className="text-[16px] text-[#c4c7c7] hover:text-[#CCFF00] transition-all" href="#contact">Contacto</a>
            <a className="text-[16px] text-[#c4c7c7] hover:text-[#CCFF00] transition-all" href="/login">Ingresar</a>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className="text-[12px] font-[600] tracking-[0.1em] uppercase text-white mb-2">LEGAL</h5>
            <a className="text-[16px] text-[#c4c7c7] hover:text-[#CCFF00] transition-all" href="#">Privacidad</a>
            <a className="text-[16px] text-[#c4c7c7] hover:text-[#CCFF00] transition-all" href="#">T&eacute;rminos</a>
            <a className="text-[16px] text-[#c4c7c7] hover:text-[#CCFF00] transition-all" href="#">FAQ</a>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className="text-[12px] font-[600] tracking-[0.1em] uppercase text-white mb-2">NEWSLETTER</h5>
            <p className="text-[16px] text-[#c4c7c7] mb-2">Recibe novedades y tips exclusivos.</p>
            <div className="flex">
              <input className="bg-[#1a1d1d] border-0 px-4 py-2 w-full text-white focus:ring-1 focus:ring-[#CCFF00] outline-none" placeholder="Email" type="email"/>
              <button className="bg-[#CCFF00] text-[#050505] p-2"><span className="material-symbols-outlined">send</span></button>
            </div>
          </div>
        </div>
        <div className="px-[64px] max-w-[1280px] mx-auto mt-[80px] pt-[12px] border-t border-white/5 flex justify-center">
          <p className="text-[10px] font-[600] tracking-[0.1em] uppercase text-[#c4c7c7]">&copy; 2026 GYMFIT360. TODOS LOS DERECHOS RESERVADOS.</p>
        </div>
      </footer>
    </div>
  );
}
