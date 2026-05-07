export function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-line bg-bg">
      <div className="flex items-center gap-2">
        <span className="text-accent text-lg leading-none">⬡</span>
        <span className="text-accent text-sm tracking-wider2">Alchemy</span>
      </div>
      <div className="text-[10px] uppercase tracking-wider2 text-muted">
        New Horizons · Astra Tech
      </div>
    </header>
  )
}
