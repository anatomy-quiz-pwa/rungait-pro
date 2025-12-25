import { readLS, writeLS } from "@/lib/storage"
import type { LibrarySource } from "./types"

// Simulated backend - replace with Supabase when ready
export async function listLibrarySources(): Promise<LibrarySource[]> {
  return [
    {
      id: "official",
      title: "標準資料庫",
      description: "基本資料庫：提供跑步解剖教學用的標準 PDF 資料。",
      category: "official",
      cost: 0,
      enabled: true,
      icon: "BookOpen",
    },
    {
      id: "pubmed",
      title: "科學文獻資料庫（PubMed）",
      description: "整合 PubMed 的科學研究文獻，提供更深入的臨床證據與研究引用。",
      category: "pubmed",
      cost: 5,
      enabled: true,
      icon: "FlaskConical",
    },
    {
      id: "personal",
      title: "個人資料庫",
      description: "上傳並管理您自己的參考資料與文獻，建立專屬的分析標準。",
      category: "personal",
      cost: 5,
      enabled: true,
      icon: "Database",
    },
  ]
}

export async function loadUserLibrarySelection(): Promise<Map<string, boolean>> {
  // Simulated - reads from localStorage
  const savedUser = readLS("auth_user")
  if (!savedUser) return new Map([["official", true]])

  const user = JSON.parse(savedUser)
  const key = `library_selection_${user.id}`
  const saved = readLS(key)

  if (saved) {
    const obj = JSON.parse(saved)
    return new Map(Object.entries(obj))
  }

  return new Map([["official", true]])
}

export async function saveUserLibrarySelection(source_id: string, selected: boolean): Promise<void> {
  const savedUser = readLS("auth_user")
  if (!savedUser) throw new Error("Not authenticated")

  const user = JSON.parse(savedUser)
  const key = `library_selection_${user.id}`

  const current = await loadUserLibrarySelection()
  current.set(source_id, selected)

  const obj = Object.fromEntries(current)
  writeLS(key, JSON.stringify(obj))
}
