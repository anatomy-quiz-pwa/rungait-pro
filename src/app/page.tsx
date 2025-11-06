// 強制動態渲染，避免快取
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, GitCompare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold text-white">
            RunGait Analysis Platform
          </h1>
          <p className="text-xl text-slate-400">
            Professional running gait analysis with transparent, evidence-based methodology
          </p>
        </div>

        {/* Cards Section */}
        <div className="space-y-6">
          {/* Analyze Card */}
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-cyan-500/10">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl text-white mb-2">Analyze</CardTitle>
                  <CardDescription className="text-slate-400 text-base">
                    Comprehensive gait analysis with phase markers, joint kinematics, and evidence-based findings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
                <Link href="/analyze">
                  Open Analyzer
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Compare Card */}
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-cyan-500/10">
                  <GitCompare className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl text-white mb-2">Compare</CardTitle>
                  <CardDescription className="text-slate-400 text-base">
                    Side-by-side comparison of before/after videos with transparent difference analysis
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
                <Link href="/compare">
                  Compare Sessions
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
