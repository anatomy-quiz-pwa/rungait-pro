'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { AngleSample, NormBand } from '../types/gait';

interface JointChartInnerProps {
  data: AngleSample[];
  overlayData?: AngleSample[];
  normBand?: NormBand;
  jointName: string;
  phaseMarkers?: Array<{ time: number; label: string }>;
}

export function JointChartInner({
  data,
  overlayData,
  normBand,
  jointName,
  phaseMarkers = [],
}: JointChartInnerProps) {
  // 準備圖表資料
  const chartData = data.map((sample) => {
    const overlay = overlayData?.find((s) => Math.abs(s.time - sample.time) < 0.05);
    return {
      time: sample.time.toFixed(2),
      [jointName]: sample.angle,
      ...(overlay ? { [`${jointName}_overlay`]: overlay.angle } : {}),
      ...(normBand ? {
        norm_mean: normBand.mean,
        norm_min: normBand.min,
        norm_max: normBand.max,
      } : {}),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="time"
          label={{ value: '時間 (秒)', position: 'insideBottom', offset: -5 }}
          stroke="#6b7280"
        />
        <YAxis
          label={{ value: '角度 (度)', angle: -90, position: 'insideLeft' }}
          stroke="#6b7280"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Legend />
        
        {/* 正常範圍區域 */}
        {normBand && (
          <>
            <ReferenceLine
              y={normBand.mean}
              stroke="#10b981"
              strokeDasharray="2 2"
              label={{ value: '平均值', position: 'right' }}
            />
            <ReferenceLine y={normBand.min} stroke="#6ee7b7" strokeDasharray="1 1" />
            <ReferenceLine y={normBand.max} stroke="#6ee7b7" strokeDasharray="1 1" />
          </>
        )}

        {/* 主要資料線 */}
        <Line
          type="monotone"
          dataKey={jointName}
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name={`${jointName} 角度`}
        />

        {/* 覆蓋資料線（用於比較） */}
        {overlayData && (
          <Line
            type="monotone"
            dataKey={`${jointName}_overlay`}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name={`${jointName} (對照)`}
          />
        )}

        {/* 相位標記 */}
        {phaseMarkers.map((marker, idx) => (
          <ReferenceLine
            key={idx}
            x={marker.time.toFixed(2)}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            label={{ value: marker.label, position: 'top' }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

