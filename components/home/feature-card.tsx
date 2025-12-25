import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: string
  title: string
  text: string
  className?: string
}

export function FeatureCard({ icon, title, text, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white/5 border border-white/10 p-6 text-center",
        "hover:bg-white/10 transition-all duration-300",
        "hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10",
        className,
      )}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-lg mb-2 text-slate-100">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{text}</p>
    </div>
  )
}
