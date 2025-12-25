import type {
  AnalysisPacket,
  GaitPhase,
  JointType,
  EvidenceRecommendation,
  LiteratureCitation,
  CaseInfo,
  EvidenceExcerpt,
} from "./types"

function generateJointAngles(joint: JointType, phases: any[]) {
  const points = []
  const configs = {
    ankle: { base: -10, range: 30, normalMin: -15, normalMax: 25 },
    knee: { base: 20, range: 60, normalMin: 0, normalMax: 70 },
    hip: { base: 30, range: 50, normalMin: -10, normalMax: 50 },
    pelvisTilt: { base: 10, range: 20, normalMin: 5, normalMax: 15 },
    pelvisDrop: { base: 5, range: 10, normalMin: 0, normalMax: 8 },
    trunkLean: { base: 5, range: 10, normalMin: 0, normalMax: 10 },
    footProg: { base: 0, range: 15, normalMin: -5, normalMax: 10 },
  }

  const config = configs[joint]

  for (let i = 0; i <= 100; i += 2) {
    const phase = Math.sin((i / 100) * Math.PI * 2)
    const angle = config.base + phase * config.range + (Math.random() - 0.5) * 5
    points.push({ frame: i * 3, percent: i, angle: Number(angle.toFixed(1)) })
  }

  return {
    joint,
    angles: points,
    normalRange: { min: config.normalMin, max: config.normalMax },
  }
}

export function createMockAnalysis(id = "1"): AnalysisPacket {
  const phases: any[] = [
    { phase: "IC" as GaitPhase, startFrame: 0, endFrame: 5, startPercent: 0, endPercent: 2 },
    { phase: "LR" as GaitPhase, startFrame: 5, endFrame: 30, startPercent: 2, endPercent: 12 },
    { phase: "MS" as GaitPhase, startFrame: 30, endFrame: 90, startPercent: 12, endPercent: 35 },
    { phase: "TS" as GaitPhase, startFrame: 90, endFrame: 120, startPercent: 35, endPercent: 50 },
    { phase: "PSw" as GaitPhase, startFrame: 120, endFrame: 150, startPercent: 50, endPercent: 62 },
    { phase: "ISw" as GaitPhase, startFrame: 150, endFrame: 180, startPercent: 62, endPercent: 75 },
    { phase: "MidSw" as GaitPhase, startFrame: 180, endFrame: 210, startPercent: 75, endPercent: 87 },
    { phase: "TSw" as GaitPhase, startFrame: 210, endFrame: 240, startPercent: 87, endPercent: 100 },
  ]

  return {
    id,
    videoUrl: "/running-gait-analysis-video.jpg",
    speed: 3.5,
    cadence: 172,
    footwear: "Nike Pegasus 40",
    phases,
    joints: [
      generateJointAngles("ankle", phases),
      generateJointAngles("knee", phases),
      generateJointAngles("hip", phases),
      generateJointAngles("pelvisTilt", phases),
      generateJointAngles("pelvisDrop", phases),
      generateJointAngles("trunkLean", phases),
      generateJointAngles("footProg", phases),
    ],
    findings: [
      {
        phase: "IC",
        joint: "ankle",
        value: 28,
        normalRange: { min: -15, max: 25 },
        status: "abnormal",
        severity: "high",
        description: "Excessive ankle dorsiflexion at initial contact may indicate overstride",
        citation: {
          author: "Novacheck et al.",
          year: 1998,
          title: "The biomechanics of running",
          doi: "10.1016/S0966-6362(98)00002-X",
          summary: "Ankle angle at IC typically ranges from -15° to 25° plantarflexion",
        },
      },
      {
        phase: "MS",
        joint: "knee",
        value: 42,
        normalRange: { min: 0, max: 70 },
        status: "normal",
        severity: "low",
        description: "Knee flexion within normal range during midstance",
      },
      {
        phase: "TS",
        joint: "hip",
        value: 18,
        normalRange: { min: -10, max: 50 },
        status: "warning",
        severity: "medium",
        description: "Slightly reduced hip extension may limit propulsion efficiency",
      },
    ],
    citations: [
      {
        author: "Novacheck T.F.",
        year: 1998,
        title: "The biomechanics of running",
        doi: "10.1016/S0966-6362(98)00002-X",
        summary: "Comprehensive review of gait cycle kinematics and kinetics during running at various speeds.",
      },
      {
        author: "Willy R.W. et al.",
        year: 2019,
        title:
          "Innovations and pitfalls in the use of wearable devices in the prevention and rehabilitation of running related injuries",
        doi: "10.1007/s40279-019-01107-3",
        summary: "Evidence-based recommendations for gait retraining and injury prevention strategies.",
      },
    ],
    aiSummary:
      "This analysis reveals a generally efficient running pattern with one area of concern. The primary finding is excessive ankle dorsiflexion at initial contact (28°), which exceeds the normal range and suggests an overstriding pattern. This can increase braking forces and injury risk. Consider cueing for a more midfoot strike pattern. Hip extension is slightly limited, which may reduce propulsive efficiency. All other joint angles fall within expected ranges for the given speed and cadence.",
    datasetVersion: "RunGait-Norms-2024-v2.1",
    modelVersion: "MediaPipe-Pose-v0.10.7",
    createdAt: new Date().toISOString(),
    thumbnailUrl: "/running-analysis-thumbnail.jpg",
    evidenceRecommendations: createMockEvidenceRecommendations({ id } as AnalysisPacket),
    caseInfo: createMockCaseInfo(id),
  }
}

export function getMockAnalyses(): AnalysisPacket[] {
  return [createMockAnalysis("1"), createMockAnalysis("2"), createMockAnalysis("3")]
}

export function createMockEvidenceExcerpts(): Record<string, EvidenceExcerpt[]> {
  return {
    "ev-1": [
      {
        citationId: "cite-1",
        excerpt:
          "Peak knee flexion during loading response typically ranges from 20–45° in recreational runners at moderate speeds.",
        highlight: ["20–45°", "loading response"],
      },
      {
        citationId: "cite-2",
        excerpt:
          "Increasing cadence by 5-10% significantly reduces peak knee flexion and loading forces, with optimal cadence around 175–180 spm for most runners.",
        highlight: ["5-10%", "175–180 spm"],
      },
    ],
    "ev-2": [
      {
        citationId: "cite-3",
        excerpt:
          "Ankle angle at initial contact typically ranges from -15° plantarflexion to 25° dorsiflexion. Values exceeding 20° dorsiflexion indicate overstride pattern.",
        highlight: ["-15°", "25°", "overstride"],
      },
      {
        citationId: "cite-1",
        excerpt:
          "Midfoot strike pattern shows ankle angles between -5° to 10° at IC, associated with reduced braking forces and lower injury risk.",
        highlight: ["midfoot strike", "-5° to 10°"],
      },
    ],
    "ev-3": [
      {
        citationId: "cite-1",
        excerpt:
          "Hip extension during terminal stance ranges from 20–35° in efficient runners, with greater extension correlating with improved propulsion.",
        highlight: ["20–35°", "terminal stance"],
      },
      {
        citationId: "cite-4",
        excerpt:
          "Limited hip extension (<20°) may indicate weak glutes or hip flexor tightness, reducing running economy and increasing injury risk.",
        highlight: ["<20°", "weak glutes"],
      },
    ],
  }
}

export function createMockEvidenceRecommendations(analysis: AnalysisPacket): EvidenceRecommendation[] {
  const excerpts = createMockEvidenceExcerpts()

  return [
    {
      id: "ev-1",
      phase: "LR",
      joints: ["knee"],
      recommendation:
        "Consider reducing knee peak flexion by ~9° through increased cadence (+5%). Current value is at the upper range of literature norms (20–45°).",
      triggered: ["Knee peak 42° vs 20–45° range", "Cadence 172 spm (optimal: 175–180)"],
      confidence: "high",
      citationIds: ["cite-1", "cite-2"],
      excerpts: excerpts["ev-1"],
      appendixSelected: false,
    },
    {
      id: "ev-2",
      phase: "IC",
      joints: ["ankle"],
      recommendation:
        "Reduce ankle dorsiflexion at initial contact. Current 28° exceeds normal range (-15° to 25°), suggesting overstride. Focus on midfoot landing pattern.",
      triggered: ["Ankle IC 28° vs -15–25° range", "Overstriding pattern detected"],
      confidence: "high",
      citationIds: ["cite-3", "cite-1"],
      excerpts: excerpts["ev-2"],
      appendixSelected: false,
    },
    {
      id: "ev-3",
      phase: "TS",
      joints: ["hip"],
      recommendation:
        "Increase hip extension during terminal stance to improve propulsion efficiency. Current 18° is below optimal range (20–35°).",
      triggered: ["Hip TS 18° vs 20–35° range", "Reduced push-off power"],
      confidence: "medium",
      citationIds: ["cite-1", "cite-4"],
      excerpts: excerpts["ev-3"],
      appendixSelected: false,
    },
  ]
}

export function createMockLiteratureCitations(): LiteratureCitation[] {
  return [
    {
      id: "cite-1",
      author: "Schache A.G., et al.",
      year: 2014,
      title: "Lower-limb muscular strategies for increasing running speed",
      journal: "Journal of Orthopaedic & Sports Physical Therapy",
      doi: "10.2519/jospt.2014.5433",
      url: "https://doi.org/10.2519/jospt.2014.5433",
      context: "10–14 km/h; neutral shoes; treadmill; 3D motion capture",
      extractedRanges: [
        { phase: "LR", joint: "knee", min: 20, max: 45, units: "deg" },
        { phase: "IC", joint: "ankle", min: -5, max: 10, units: "deg" },
        { phase: "TS", joint: "hip", min: 20, max: 35, units: "deg" },
      ],
      evidenceLevel: "clinical",
    },
    {
      id: "cite-2",
      author: "Heiderscheit B.C., et al.",
      year: 2011,
      title: "Effects of step rate manipulation on joint mechanics during running",
      journal: "Medicine & Science in Sports & Exercise",
      doi: "10.1249/MSS.0b013e3182078532",
      url: "https://doi.org/10.1249/MSS.0b013e3182078532",
      context: "Cadence manipulation; 8–12 km/h; controlled lab study",
      extractedRanges: [
        { phase: "LR", joint: "knee", min: 25, max: 42, units: "deg" },
        { phase: "MS", joint: "knee", min: 35, max: 48, units: "deg" },
      ],
      evidenceLevel: "systematic",
    },
    {
      id: "cite-3",
      author: "Novacheck T.F.",
      year: 1998,
      title: "The biomechanics of running",
      journal: "Gait & Posture",
      doi: "10.1016/S0966-6362(98)00002-X",
      url: "https://doi.org/10.1016/S0966-6362(98)00002-X",
      context: "Comprehensive review; various speeds; consensus data",
      extractedRanges: [
        { phase: "IC", joint: "ankle", min: -15, max: 25, units: "deg" },
        { phase: "MS", joint: "ankle", min: 10, max: 25, units: "deg" },
      ],
      evidenceLevel: "consensus",
    },
    {
      id: "cite-4",
      author: "Willy R.W., et al.",
      year: 2019,
      title: "Innovations and pitfalls in the use of wearable devices",
      journal: "Sports Medicine",
      doi: "10.1007/s40279-019-01107-3",
      url: "https://doi.org/10.1007/s40279-019-01107-3",
      context: "Gait retraining review; clinical applications",
      extractedRanges: [
        { phase: "TS", joint: "hip", min: 15, max: 30, units: "deg" },
        { phase: "PSw", joint: "hip", min: -10, max: 5, units: "deg" },
      ],
      evidenceLevel: "systematic",
    },
  ]
}

export function createMockCaseInfo(analysisId: string): CaseInfo {
  return {
    code: `RUN-${analysisId.padStart(4, "0")}`,
    age: 32,
    speedKph: 12.6,
    cadence: 172,
    stepLengthCm: 122,
    footwear: "Nike Pegasus 40 (neutral)",
    inclinePct: 0,
    dateISO: new Date().toISOString(),
    coachNotes:
      "Baseline assessment for marathon training program. Runner reports mild anterior knee pain after long runs (>15km). Focus on overstride correction.",
  }
}
