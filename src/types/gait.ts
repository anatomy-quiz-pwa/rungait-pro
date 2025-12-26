// Gait analysis types

export type GaitPhaseId = 
  | 'initial-contact'
  | 'loading-response'
  | 'mid-stance'
  | 'terminal-stance'
  | 'pre-swing'
  | 'initial-swing'
  | 'mid-swing'
  | 'terminal-swing';

export type JointKey = 
  | 'hip'
  | 'knee'
  | 'ankle';

export interface EventMarker {
  phase: GaitPhaseId;
  time: number; // in seconds
  frame: number;
}

export interface AngleSample {
  time: number; // in seconds
  angle: number; // degrees
}

export interface NormBand {
  mean: number;
  std: number;
  min: number;
  max: number;
}

export interface NormsByPhase {
  [phase: string]: {
    [joint in JointKey]: NormBand;
  };
}

export interface AiSnippet {
  phase: GaitPhaseId;
  text: string;
  flags: string[];
  severity: 'info' | 'warning' | 'error';
}

export interface AnalysisPacket {
  id: string;
  videoUrl: string;
  duration: number;
  phases: EventMarker[];
  series: {
    [joint in JointKey]: AngleSample[];
  };
  norms: NormsByPhase;
  aiInsights: AiSnippet[];
  metadata: {
    recordedAt: string;
    subjectId?: string;
    notes?: string;
  };
  // Gait metrics
  speed?: number; // m/s
  cadence?: number; // steps/min
  stepLength?: number; // m
}

export interface ComparisonPacket {
  before: AnalysisPacket;
  after: AnalysisPacket;
  differences: {
    phase: GaitPhaseId;
    joint: JointKey;
    metric: 'peak' | 'range' | 'timing';
    beforeValue: number;
    afterValue: number;
    improvement: number; // percentage
  }[];
}

