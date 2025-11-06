"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FindingCard } from "@/components/finding-card"
import { ProvenancePanel } from "@/components/provenance-panel"
import { CitationCard } from "@/components/citation-card"
import type { GaitPhase } from "@/components/phase-bar"
import {
  Home,
  Download,
  Printer,
  Mail,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Calendar,
  User,
  Activity,
} from "lucide-react"
import Link from "next/link"

// Mock data for the report
const mockPatientInfo = {
  name: "John Doe",
  id: "PT-2024-001",
  date: "January 20, 2024",
  clinician: "Dr. Sarah Johnson, PT, DPT",
  sessionType: "Running Gait Analysis",
}

const mockFindings = [
  {
    phase: "IC" as GaitPhase,
    finding: "Ankle dorsiflexion at initial contact is within normal range, indicating proper heel strike mechanics.",
    confidence: 92,
    features: [
      { name: "Ankle Angle", value: "5.2°", reference: "0-10°" },
      { name: "Knee Flexion", value: "8.1°", reference: "5-10°" },
    ],
    status: "OK" as const,
  },
  {
    phase: "MS" as GaitPhase,
    finding:
      "Excessive knee flexion during mid-stance may indicate quadriceps weakness or compensatory pattern for ankle limitation.",
    confidence: 87,
    features: [
      { name: "Knee Flexion", value: "22.3°", reference: "10-15°" },
      { name: "Hip Extension", value: "8.5°", reference: "5-10°" },
    ],
    status: "Warning" as const,
  },
  {
    phase: "TS" as GaitPhase,
    finding:
      "Limited ankle plantarflexion at terminal stance suggests reduced push-off power, potentially affecting propulsion efficiency.",
    confidence: 94,
    features: [
      { name: "Ankle Plantarflexion", value: "8.2°", reference: "15-25°" },
      { name: "Hip Extension", value: "18.1°", reference: "10-20°" },
    ],
    status: "Risk" as const,
  },
]

const mockRecommendations = [
  {
    priority: "High",
    title: "Ankle Plantarflexion Strengthening",
    description:
      "Implement progressive calf strengthening exercises including eccentric heel drops and single-leg calf raises to improve push-off power.",
    exercises: ["Eccentric heel drops: 3x15 reps", "Single-leg calf raises: 3x12 reps", "Plyometric hops: 2x10 reps"],
  },
  {
    priority: "Medium",
    title: "Quadriceps Strengthening",
    description:
      "Address mid-stance knee flexion through targeted quadriceps strengthening and neuromuscular control exercises.",
    exercises: ["Step-downs: 3x10 reps", "Single-leg squats: 3x8 reps", "Wall sits: 3x30 seconds"],
  },
  {
    priority: "Low",
    title: "Running Form Cues",
    description:
      "Implement verbal cues during running to promote optimal biomechanics and reduce compensatory patterns.",
    exercises: [
      "Focus on 'pushing through the ground' at toe-off",
      "Maintain upright posture with slight forward lean",
      "Increase cadence by 5-10% to reduce impact forces",
    ],
  },
]

const mockDatasets = [
  {
    name: "Novacheck 1998 Dataset",
    version: "v2.1",
    lastUpdate: "2024-01-15",
  },
  {
    name: "Perry & Burnfield 2010",
    version: "v1.3",
    lastUpdate: "2023-11-20",
  },
]

const mockPipeline = {
  name: "OpenPose + Kinematics",
  version: "v3.2",
  steps: [
    "2D pose estimation via OpenPose",
    "3D reconstruction from calibrated cameras",
    "Joint angle calculation using inverse kinematics",
    "Phase detection via foot contact events",
  ],
  limitations: "Assumes sagittal plane dominance. May underestimate out-of-plane motion in complex gait patterns.",
}

const mockCitations = [
  {
    author: "Novacheck TF",
    year: 1998,
    title: "The biomechanics of running",
    population: "Recreational runners",
    speedContext: "3.5 m/s",
    measuredRange: "Ankle: -5° to 25° dorsi/plantarflexion",
    doi: "https://doi.org/10.1016/s0966-6362(98)00012-8",
    extractedRange: "-5° to 25°",
  },
  {
    author: "Perry J, Burnfield JM",
    year: 2010,
    title: "Gait Analysis: Normal and Pathological Function",
    population: "Healthy adults",
    speedContext: "Self-selected",
    measuredRange: "Knee: 0-40° flexion during stance",
    extractedRange: "0-40°",
  },
]

export const dynamic = 'force-dynamic';

export default function ReportPage() {
  const [isPrintView, setIsPrintView] = useState(false)

  const handlePrint = () => {
    setIsPrintView(true)
    setTimeout(() => {
      window.print()
      setIsPrintView(false)
    }, 100)
  }

  const handleDownloadPDF = () => {
    // In a real implementation, this would generate a PDF
    alert("PDF download functionality would be implemented here using a library like jsPDF or react-pdf")
  }

  const handleEmail = () => {
    // In a real implementation, this would open an email dialog or send via API
    alert("Email functionality would be implemented here")
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {!isPrintView && (
        <div className="border-b bg-white dark:bg-slate-800 print:hidden">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/">
                    <Home className="h-5 w-5" />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Clinical Report</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Comprehensive gait analysis summary</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="default" size="sm" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-8 bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm print:shadow-none print:p-0">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Running Gait Analysis Report</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Evidence-Based Biomechanical Assessment</p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                Report ID: RPT-2024-001
              </Badge>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Patient:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{mockPatientInfo.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Patient ID:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-50">{mockPatientInfo.id}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Assessment Date:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{mockPatientInfo.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Clinician:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{mockPatientInfo.clinician}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                This report presents a comprehensive biomechanical analysis of running gait for {mockPatientInfo.name}.
                The assessment utilized video-based motion capture with validated kinematic analysis algorithms,
                comparing observed patterns against normative data from peer-reviewed literature.
              </p>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-sm text-green-800 dark:text-green-200">Normal</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">1</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">findings within range</p>
                </div>

                <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-semibold text-sm text-yellow-800 dark:text-yellow-200">Warning</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">1</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">areas to monitor</p>
                </div>

                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="font-semibold text-sm text-red-800 dark:text-red-200">Risk</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">1</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">requires intervention</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Findings */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Key Findings</h2>
            <div className="space-y-4">
              {mockFindings.map((finding, idx) => (
                <FindingCard key={idx} {...finding} />
              ))}
            </div>
          </div>

          {/* Clinical Recommendations */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Clinical Recommendations</h2>
            <div className="space-y-4">
              {mockRecommendations.map((rec, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{rec.title}</CardTitle>
                      <Badge
                        variant={rec.priority === "High" ? "default" : "outline"}
                        className={
                          rec.priority === "High"
                            ? "bg-red-600 text-white"
                            : rec.priority === "Medium"
                              ? "bg-yellow-600 text-white"
                              : ""
                        }
                      >
                        {rec.priority} Priority
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{rec.description}</p>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        Recommended Exercises
                      </p>
                      <ul className="space-y-1">
                        {rec.exercises.map((exercise, exerciseIdx) => (
                          <li key={exerciseIdx} className="text-sm flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                            <span>{exercise}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Methodology & Evidence Base */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Methodology & Evidence Base</h2>
            <ProvenancePanel datasets={mockDatasets} pipeline={mockPipeline} />
          </div>

          {/* References */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">References</h2>
            <Card>
              <CardContent className="pt-6 space-y-3">
                {mockCitations.map((citation, idx) => (
                  <CitationCard key={idx} {...citation} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <Separator />
          <div className="text-center space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This report was generated using the RunGait Analysis Platform v3.2
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              For questions or clarifications, please contact {mockPatientInfo.clinician}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

