import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Cpu, AlertCircle } from "lucide-react"

interface Dataset {
  name: string
  version: string
  lastUpdate: string
}

interface Pipeline {
  name: string
  steps: string[]
  version: string
  limitations: string
}

interface ProvenancePanelProps {
  datasets: Dataset[]
  pipeline: Pipeline
}

export function ProvenancePanel({ datasets, pipeline }: ProvenancePanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {datasets.map((dataset, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{dataset.name}</p>
                <Badge variant="outline" className="text-xs font-mono">
                  {dataset.version}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Updated: {dataset.lastUpdate}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Processing Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{pipeline.name}</p>
              <Badge variant="outline" className="text-xs font-mono">
                {pipeline.version}
              </Badge>
            </div>
            <div className="space-y-1">
              {pipeline.steps.map((step, idx) => (
                <p key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                  {idx + 1}. {step}
                </p>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">Limitations</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{pipeline.limitations}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

