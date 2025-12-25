'use client'

import { useEffect, useRef, useState } from 'react'

type ClipRange = { start: number; end: number }

type ClipModalProps = {
  file: File | null
  open: boolean
  onClose: () => void
  onConfirm: (result: ClipRange & { file: File }) => void
  minLengthSec?: number
}

export default function ClipModal({
  file,
  open,
  onClose,
  onConfirm,
  minLengthSec = 1.5,
}: ClipModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [ready, setReady] = useState(false)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)

  useEffect(() => {
    if (!file || !open) return
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    setReady(false)
    setDuration(0)
    setStart(0)
    setEnd(0)
    return () => URL.revokeObjectURL(url)
  }, [file, open])

  useEffect(() => {
    if (!open || !objectUrl) return
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      const d = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
      setDuration(d)
      const defaultLen = Math.min(Math.max(minLengthSec, 0.5), Math.max(d, 0.5))
      setStart(0)
      setEnd(d > 0 ? Math.min(defaultLen, d) : 0)
      setReady(true)
    }

    video.preload = 'metadata'
    video.crossOrigin = 'anonymous'
    video.src = objectUrl
    video.load()
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [objectUrl, open, minLengthSec])

  const minValue = 0
  const maxValue = Math.max(duration, 0)
  const minGap = minLengthSec

  function clampStart(value: number) {
    const next = Math.max(minValue, Math.min(value, end - minGap))
    setStart(Number(next.toFixed(2)))
  }

  function clampEnd(value: number) {
    const next = Math.min(maxValue, Math.max(value, start + minGap))
    setEnd(Number(next.toFixed(2)))
  }

  const disabled = !ready || !file || duration <= 0

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        style={{ pointerEvents: 'auto' }}
        aria-hidden="true"
      />
      <div
        className="relative z-[101] w-[min(720px,92vw)] rounded-2xl bg-slate-900 p-5 text-slate-100 shadow-xl pointer-events-auto"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'manipulation' }}
      >
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-lg font-semibold">選擇剪輯區間</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          建議保留至少一個完整週期（約 {minLengthSec.toFixed(1)} 秒）。完成後會自動開始上傳並分析。
        </p>

        <video ref={videoRef} className="w-full rounded bg-black mb-3" controls playsInline />

        <div className="grid grid-cols-2 gap-3 text-xs mb-2">
          <div>開始時間：{start.toFixed(2)}s</div>
          <div className="text-right">結束時間：{end.toFixed(2)}s</div>
        </div>

        <div className="space-y-4 select-none">
          <input
            type="range"
            min={minValue}
            max={Math.max(end - minGap, minValue)}
            step={0.01}
            value={start}
            onChange={(e) => clampStart(parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <input
            type="range"
            min={Math.min(start + minGap, maxValue)}
            max={maxValue}
            step={0.01}
            value={end}
            onChange={(e) => clampEnd(parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600">
            取消
          </button>
          <button
            disabled={disabled}
            onClick={() => file && onConfirm({ start, end, file })}
            className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50"
          >
            開始上傳並分析
          </button>
        </div>
      </div>
    </div>
  )
}


