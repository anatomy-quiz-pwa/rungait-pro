'use client';

import dynamic from 'next/dynamic';
import type { AngleSample, NormBand } from '../types/gait';

const JointChartInner = dynamic(() => import('./JointChartInner').then(mod => ({ default: mod.JointChartInner })), {
  ssr: false,
});

interface JointChartProps {
  data: AngleSample[];
  overlayData?: AngleSample[];
  normBand?: NormBand;
  jointName: string;
  phaseMarkers?: Array<{ time: number; label: string }>;
}

export function JointChart(props: JointChartProps) {
  return <JointChartInner {...props} />;
}

