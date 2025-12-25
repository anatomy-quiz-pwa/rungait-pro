'use client'

import { create } from 'zustand'

export type AnalysisPhase =
  | 'idle'
  | 'picking'
  | 'clipping'
  | 'uploading'
  | 'analyzing'
  | 'saving'
  | 'done'
  | 'error'

type State = {
  uploadedPublicUrl: string | null
  pendingFile: File | null
  status: AnalysisPhase
  progress: number
  lastError: string | null
}

type Actions = {
  setUploaded: (url: string) => void
  clearUploaded: () => void
  setPending: (f: File | null) => void
  setStatus: (status: AnalysisPhase) => void
  setProgress: (value: number) => void
  setError: (message: string | null) => void
  reset: () => void
}

const initialState: State = {
  uploadedPublicUrl: null,
  pendingFile: null,
  status: 'idle',
  progress: 0,
  lastError: null,
}

export const useAnalysisStore = create<State & Actions>((set) => ({
  ...initialState,
  setUploaded: (url) => set({ uploadedPublicUrl: url }),
  clearUploaded: () => set({ uploadedPublicUrl: null }),
  setPending: (f) => set({ pendingFile: f }),
  setStatus: (status) => set({ status }),
  setProgress: (value) => set({ progress: Math.max(0, Math.min(100, Math.round(value))) }),
  setError: (message) => set({ lastError: message }),
  reset: () => set(initialState),
}))

