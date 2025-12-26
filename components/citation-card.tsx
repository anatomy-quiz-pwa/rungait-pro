import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CitationCardProps {
  author: string
  year: number
  title: string
  population?: string
  speedContext?: string
  measuredRange: string
  doi?: string
  extractedRange?: string
}

export function CitationCard({
  author,
  year,
  title,
  population,
  speedContext,
  measuredRange,
  doi,
  extractedRange,
}: CitationCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {author} ({year})
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{title}</p>
            </div>
            {doi && (
              <Button size="icon" variant="ghost" asChild>
                <a href={doi} target="_blank" rel="noopener noreferrer" aria-label="View DOI">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {population && (
              <Badge variant="outline" className="text-xs">
                {population}
              </Badge>
            )}
            {speedContext && (
              <Badge variant="outline" className="text-xs">
                {speedContext}
              </Badge>
            )}
            {extractedRange && (
              <Badge variant="secondary" className="text-xs font-mono">
                Range: {extractedRange}
              </Badge>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400">Measured Range</p>
            <p className="text-sm font-mono mt-1">{measuredRange}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

