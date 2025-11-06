import type { AnalysisPacket } from '@/src/types/gait';

// Mock data for gait analysis
export const mockAnalysisData: AnalysisPacket = {
  id: 'analysis-001',
  videoUrl: '/demo-video.mp4',
  duration: 3.2,
  phases: [
    { phase: 'initial-contact', time: 0, frame: 0 },
    { phase: 'loading-response', time: 0.4, frame: 12 },
    { phase: 'mid-stance', time: 0.8, frame: 24 },
    { phase: 'terminal-stance', time: 1.2, frame: 36 },
    { phase: 'pre-swing', time: 1.6, frame: 48 },
    { phase: 'initial-swing', time: 2.0, frame: 60 },
    { phase: 'mid-swing', time: 2.4, frame: 72 },
    { phase: 'terminal-swing', time: 2.8, frame: 84 },
  ],
  series: {
    hip: Array.from({ length: 33 }, (_, i) => ({
      time: i * 0.1,
      angle: 20 + 15 * Math.sin((i * 0.1) * Math.PI * 2),
    })),
    knee: Array.from({ length: 33 }, (_, i) => ({
      time: i * 0.1,
      angle: 10 + 40 * Math.sin((i * 0.1) * Math.PI * 2),
    })),
    ankle: Array.from({ length: 33 }, (_, i) => ({
      time: i * 0.1,
      angle: 5 + 20 * Math.sin((i * 0.1) * Math.PI * 2),
    })),
  },
  norms: {
    'initial-contact': {
      hip: { mean: 22, std: 3, min: 18, max: 26 },
      knee: { mean: 13, std: 5, min: 8, max: 18 },
      ankle: { mean: 6, std: 2, min: 4, max: 8 },
    },
    'loading-response': {
      hip: { mean: 22, std: 3, min: 18, max: 26 },
      knee: { mean: 13, std: 5, min: 8, max: 18 },
      ankle: { mean: 6, std: 2, min: 4, max: 8 },
    },
    'mid-stance': {
      hip: { mean: 22, std: 3, min: 18, max: 26 },
      knee: { mean: 13, std: 5, min: 8, max: 18 },
      ankle: { mean: 6, std: 2, min: 4, max: 8 },
    },
    'terminal-stance': {
      hip: { mean: 22, std: 3, min: 18, max: 26 },
      knee: { mean: 13, std: 5, min: 8, max: 18 },
      ankle: { mean: 6, std: 2, min: 4, max: 8 },
    },
    'pre-swing': {
      hip: { mean: 22, std: 3, min: 18, max: 26 },
      knee: { mean: 13, std: 5, min: 8, max: 18 },
      ankle: { mean: 6, std: 2, min: 4, max: 8 },
    },
    'initial-swing': {
      hip: { mean: 22, std: 3, min: 18, max: 26 },
      knee: { mean: 13, std: 5, min: 8, max: 18 },
      ankle: { mean: 6, std: 2, min: 4, max: 8 },
    },
    'mid-swing': {
      hip: { mean: 22, std: 3, min: 18, max: 26 },
      knee: { mean: 13, std: 5, min: 8, max: 18 },
      ankle: { mean: 6, std: 2, min: 4, max: 8 },
    },
    'terminal-swing': {
      hip: { mean: 22, std: 3, min: 18, max: 26 },
      knee: { mean: 13, std: 5, min: 8, max: 18 },
      ankle: { mean: 6, std: 2, min: 4, max: 8 },
    },
  },
  aiInsights: [
    {
      phase: 'initial-contact',
      text: '初始接觸時髖關節角度已改善，步態更加穩定',
      flags: [],
      severity: 'info',
    },
    {
      phase: 'mid-stance',
      text: '中期支撐時膝關節角度已接近正常範圍',
      flags: [],
      severity: 'info',
    },
    {
      phase: 'terminal-swing',
      text: '末期擺動時踝關節活動度已改善',
      flags: [],
      severity: 'info',
    },
  ],
  metadata: {
    recordedAt: new Date().toISOString(),
    subjectId: 'demo-subject-001',
    notes: '治療後評估',
  },
  // Gait metrics
  speed: 3.5, // m/s
  cadence: 175, // steps/min
  stepLength: 1.2, // m
};

// Evidence data
export const mockDatasets = [
  {
    name: 'Novacheck 1998 Dataset',
    version: 'v2.1',
    lastUpdate: '2024-01-15',
  },
  {
    name: 'Perry & Burnfield 2010',
    version: 'v1.3',
    lastUpdate: '2023-11-20',
  },
];

export const mockPipeline = {
  name: 'OpenPose + Kinematics',
  version: 'v3.2',
  steps: [
    '2D pose estimation via OpenPose',
    '3D reconstruction from calibrated cameras',
    'Joint angle calculation using inverse kinematics',
    'Phase detection via foot contact events',
  ],
  limitations: 'Assumes sagittal plane dominance. May underestimate out-of-plane motion in complex gait patterns.',
};

export const mockCitations = [
  {
    author: 'Novacheck TF',
    year: 1998,
    title: 'The biomechanics of running',
    population: 'Recreational runners',
    speedContext: '3.5 m/s',
    measuredRange: 'Ankle: -5° to 25° dorsi/plantarflexion',
    doi: 'https://doi.org/10.1016/s0966-6362(98)00012-8',
    extractedRange: '-5° to 25°',
  },
  {
    author: 'Perry J, Burnfield JM',
    year: 2010,
    title: 'Gait Analysis: Normal and Pathological Function',
    population: 'Healthy adults',
    speedContext: 'Self-selected',
    measuredRange: 'Knee: 0-40° flexion during stance',
    extractedRange: '0-40°',
  },
];

