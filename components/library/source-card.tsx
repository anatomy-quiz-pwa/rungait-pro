"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { BookOpen, FlaskConical, Database, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import type { LibrarySource } from "@/lib/types"
import { useI18n } from "@/lib/i18n/i18n-provider"

interface SourceCardProps {
  source: LibrarySource
  selected: boolean
  onToggle: (selected: boolean) => void
  onView?: () => void
}

const iconMap = {
  BookOpen,
  FlaskConical,
  Database,
}

export function SourceCard({ source, selected, onToggle }: SourceCardProps) {
  const { t } = useI18n()
  const router = useRouter()
  const Icon = iconMap[source.icon as keyof typeof iconMap] || BookOpen

  const handleViewContents = () => {
    router.push(`/library/source/${source.id}`)
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{source.title}</h3>
          <p className="text-sm text-slate-400">{source.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <Switch checked={selected} onCheckedChange={onToggle} className="data-[state=checked]:bg-cyan-500" />
          <span className="text-sm text-slate-300">{t("useThisSource")}</span>
        </div>

        <Badge
          className={
            source.cost === 0
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
          }
        >
          {source.cost === 0 ? t("free") : t("costPlus").replace("{0}", source.cost.toString())}
        </Badge>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleViewContents}
        className="w-full mt-3 bg-slate-800 border-slate-700 hover:bg-slate-700"
      >
        <Eye className="h-4 w-4 mr-2" />
        {t("view")}
      </Button>
    </Card>
  )
}
