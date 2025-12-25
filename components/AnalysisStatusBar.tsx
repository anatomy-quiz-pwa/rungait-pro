'use client'

import { useEffect } from 'react'
import { useAnalysisStore } from '@/lib/analysisStore'

const statusText: Record<string, string> = {
  idle: '準備就緒',
  picking: '選擇影片中…',
  clipping: '剪輯區間中…',
  uploading: '上傳中…',
  analyzing: '分析中…',
  saving: '儲存結果…',
  done: '完成 ✅',
  error: '發生錯誤',
}

export default function AnalysisStatusBar() {
  const { status, progress, lastError } = useAnalysisStore((state) => ({
    status: state.status,
    progress: state.progress,
    lastError: state.lastError,
  }))
  const setStatus = useAnalysisStore((state) => state.setStatus)
  const setProgress = useAnalysisStore((state) => state.setProgress)
  const setError = useAnalysisStore((state) => state.setError)

  useEffect(() => {
    if (status === 'done') {
      const timer = setTimeout(() => {
        setStatus('idle')
        setProgress(0)
        setError(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
    return
  }, [status, setStatus, setProgress, setError])

  const text = status === 'error' && lastError ? `錯誤：${lastError}` : statusText[status] ?? statusText.idle
  const showProgress = status === 'uploading' || status === 'analyzing'

  return (
    <div className="mb-3 rounded-lg bg-slate-800/70 px-3 py-2 text-sm text-slate-200 shadow-inner border border-slate-700/60">
      <div>{text}</div>
      {showProgress && (
        <div className="mt-2 h-1.5 w-full rounded bg-slate-700 overflow-hidden">
          <div
            className="h-1.5 rounded bg-cyan-500 transition-all"
            style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  )
}

