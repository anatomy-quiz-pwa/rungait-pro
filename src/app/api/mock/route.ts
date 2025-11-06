import { NextResponse } from 'next/server';
import type { AnalysisPacket, ComparisonPacket } from '../../../types/gait';

// 生成假資料的輔助函數
function generateAngleSamples(
  startTime: number,
  endTime: number,
  baseAngle: number,
  amplitude: number,
  frequency: number
) {
  const samples: { time: number; angle: number }[] = [];
  const steps = Math.floor((endTime - startTime) * 10); // 10 samples per second
  
  for (let i = 0; i <= steps; i++) {
    const time = startTime + (i / 10);
    const normalizedTime = (time - startTime) / (endTime - startTime);
    const angle = baseAngle + amplitude * Math.sin(normalizedTime * Math.PI * frequency);
    samples.push({ time, angle: Math.round(angle * 10) / 10 });
  }
  
  return samples;
}

function createMockAnalysis(id: string, videoUrl: string, isBefore: boolean = false): AnalysisPacket {
  const duration = 3.2;
  const phaseTimes = [0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2];
  const phases = [
    'initial-contact',
    'loading-response',
    'mid-stance',
    'terminal-stance',
    'pre-swing',
    'initial-swing',
    'mid-swing',
    'terminal-swing'
  ] as const;

  const eventMarkers = phases.map((phase, idx) => ({
    phase,
    time: phaseTimes[idx],
    frame: Math.floor(phaseTimes[idx] * 30) // 30 fps
  }));

  // 根據 isBefore 調整角度值，模擬改善前後的差異
  const hipOffset = isBefore ? 5 : 2;
  const kneeOffset = isBefore ? 8 : 3;
  const ankleOffset = isBefore ? 4 : 1;

  const hipSamples = generateAngleSamples(0, duration, 20 + hipOffset, 15, 2);
  const kneeSamples = generateAngleSamples(0, duration, 10 + kneeOffset, 40, 2);
  const ankleSamples = generateAngleSamples(0, duration, 5 + ankleOffset, 20, 2);

  const norms: AnalysisPacket['norms'] = {};
  phases.forEach((phase, idx) => {
    norms[phase] = {
      hip: {
        mean: isBefore ? 25 : 22,
        std: 3,
        min: isBefore ? 20 : 18,
        max: isBefore ? 30 : 26
      },
      knee: {
        mean: isBefore ? 18 : 13,
        std: 5,
        min: isBefore ? 10 : 8,
        max: isBefore ? 26 : 18
      },
      ankle: {
        mean: isBefore ? 9 : 6,
        std: 2,
        min: isBefore ? 6 : 4,
        max: isBefore ? 12 : 8
      }
    };
  });

  const aiInsights: AnalysisPacket['aiInsights'] = [
    {
      phase: 'initial-contact',
      text: isBefore 
        ? '初始接觸時髖關節角度偏大，可能影響步態穩定性'
        : '初始接觸時髖關節角度已改善，步態更加穩定',
      flags: isBefore ? ['hip-angle-high'] : [],
      severity: isBefore ? 'warning' : 'info'
    },
    {
      phase: 'mid-stance',
      text: isBefore
        ? '中期支撐時膝關節彎曲角度過大'
        : '中期支撐時膝關節角度已接近正常範圍',
      flags: isBefore ? ['knee-flexion-excessive'] : [],
      severity: isBefore ? 'error' : 'info'
    },
    {
      phase: 'terminal-swing',
      text: isBefore
        ? '末期擺動時踝關節背屈不足'
        : '末期擺動時踝關節活動度已改善',
      flags: isBefore ? ['ankle-dorsiflexion-limited'] : [],
      severity: isBefore ? 'warning' : 'info'
    }
  ];

  return {
    id,
    videoUrl,
    duration,
    phases: eventMarkers,
    series: {
      hip: hipSamples,
      knee: kneeSamples,
      ankle: ankleSamples
    },
    norms,
    aiInsights,
    metadata: {
      recordedAt: new Date().toISOString(),
      subjectId: 'demo-subject-001',
      notes: isBefore ? '治療前評估' : '治療後評估'
    },
    // Gait metrics
    speed: isBefore ? 3.2 : 3.5, // m/s
    cadence: isBefore ? 170 : 175, // steps/min
    stepLength: isBefore ? 1.13 : 1.2, // m
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'analysis' | 'comparison' | null (both)

  try {
    if (type === 'analysis') {
      // 只回傳單一 AnalysisPacket
      const analysis = createMockAnalysis('analysis-001', '/demo-video.mp4', false);
      return NextResponse.json(analysis);
    } else if (type === 'comparison') {
      // 只回傳 ComparisonPacket
      const before = createMockAnalysis('before-001', '/demo-before.mp4', true);
      const after = createMockAnalysis('after-001', '/demo-after.mp4', false);
      
      const differences: ComparisonPacket['differences'] = [
        {
          phase: 'initial-contact',
          joint: 'hip',
          metric: 'peak',
          beforeValue: 28,
          afterValue: 24,
          improvement: 14.3
        },
        {
          phase: 'mid-stance',
          joint: 'knee',
          metric: 'peak',
          beforeValue: 24,
          afterValue: 16,
          improvement: 33.3
        },
        {
          phase: 'terminal-swing',
          joint: 'ankle',
          metric: 'range',
          beforeValue: 8,
          afterValue: 12,
          improvement: 50.0
        },
        {
          phase: 'loading-response',
          joint: 'hip',
          metric: 'timing',
          beforeValue: 0.45,
          afterValue: 0.38,
          improvement: 15.6
        }
      ];

      const comparison: ComparisonPacket = {
        before,
        after,
        differences
      };

      return NextResponse.json(comparison);
    } else {
      // 預設回傳兩者
      const analysis = createMockAnalysis('analysis-001', '/demo-video.mp4', false);
      const before = createMockAnalysis('before-001', '/demo-before.mp4', true);
      const after = createMockAnalysis('after-001', '/demo-after.mp4', false);
      
      const differences: ComparisonPacket['differences'] = [
        {
          phase: 'initial-contact',
          joint: 'hip',
          metric: 'peak',
          beforeValue: 28,
          afterValue: 24,
          improvement: 14.3
        },
        {
          phase: 'mid-stance',
          joint: 'knee',
          metric: 'peak',
          beforeValue: 24,
          afterValue: 16,
          improvement: 33.3
        },
        {
          phase: 'terminal-swing',
          joint: 'ankle',
          metric: 'range',
          beforeValue: 8,
          afterValue: 12,
          improvement: 50.0
        }
      ];

      const comparison: ComparisonPacket = {
        before,
        after,
        differences
      };

      return NextResponse.json({
        analysis,
        comparison
      });
    }
  } catch (error) {
    console.error('Error generating mock data:', error);
    return NextResponse.json(
      { error: 'Failed to generate mock data' },
      { status: 500 }
    );
  }
}

