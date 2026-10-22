export function GeometricBrandGraphic({ className = "size-64" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Deep Navy + Metallic Gold ambient glow aura */}
      <div className="absolute -inset-6 -z-10 rounded-full bg-gradient-to-tr from-blue-950/60 via-amber-500/25 to-blue-700/30 blur-3xl" />

      {/* Glass card container with metallic gold border and deep navy gradient */}
      <div className="relative flex size-52 items-center justify-center rounded-3xl border border-amber-500/40 bg-gradient-to-b from-[#0a192f]/95 via-[#0f2744]/80 to-[#0a192f]/95 p-5 shadow-2xl backdrop-blur-md transition-all duration-500 hover:scale-105 hover:border-amber-400/60">
        <img
          src="/Logo.png"
          alt="LH Studio Logo"
          className="size-44 object-contain drop-shadow-[0_12px_24px_rgba(245,158,11,0.25)] transition-transform duration-500"
        />
      </div>
    </div>
  )
}
