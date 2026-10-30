// Dark input style: login aur register dono use karte hain
export const authInput =
  "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white placeholder-slate-400 " +
  "focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40 [&>option]:text-slate-900";

export const authButton =
  "w-full rounded-lg bg-linear-to-r from-indigo-500 to-cyan-500 py-2.5 font-semibold text-white " +
  "hover:opacity-90 transition disabled:opacity-50";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      {/* Background: glow + halka grid */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] bg-size:[40px_40px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-3xl font-bold bg-linear-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
            HireFit
          </div>
          <p className="mt-1 text-sm text-slate-400">AI-powered hiring, assessments and interview practice</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8 space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
          {children}
        </div>

        {footer && <div className="mt-4 text-center text-sm text-slate-400">{footer}</div>}
      </div>
    </div>
  );
}