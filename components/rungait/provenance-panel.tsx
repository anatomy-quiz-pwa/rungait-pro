import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProvenancePanelProps {
  datasetVersion: string
  speed: number
  footwear: string
}

export function ProvenancePanel({ datasetVersion, speed, footwear }: ProvenancePanelProps) {
  return (
    <Card className="p-4 bg-slate-800/30 border-slate-700">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Dataset:</span>
          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
            {datasetVersion}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Speed Bin:</span>
          <Badge variant="outline" className="border-blue-500/30 text-blue-400">
            {speed} m/s
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Footwear:</span>
          <Badge variant="outline" className="border-purple-500/30 text-purple-400">
            {footwear}
          </Badge>
        </div>
      </div>
    </Card>
  )
}
