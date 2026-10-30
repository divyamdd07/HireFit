export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
      <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-300 sm:text-base">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}