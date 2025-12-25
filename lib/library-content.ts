import { readLS, writeLS } from "@/lib/storage"
import type { OfficialFile, PersonalFile, PubmedRecord, UserCollection } from "./types"

// ============================================================
// Official Database (Admin can edit)
// ============================================================

export async function listOfficialFiles(): Promise<OfficialFile[]> {
  const stored = readLS("library_official_files")
  if (stored) {
    return JSON.parse(stored)
  }

  // Mock initial data
  const mockFiles: OfficialFile[] = [
    {
      id: "of-001",
      name: "標準跑步步態基準資料.pdf",
      description: "包含臨床常用的跑步步態基準值與正常範圍",
      tags: ["基準", "教學"],
      version: "v1.0",
      storage_path: "/official/standard-gait.pdf",
      mime: "application/pdf",
      size: 1024000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "of-002",
      name: "跑步機觀察法教學影片.mp4",
      description: "無動力跑步機觀察技巧示範影片",
      tags: ["教學", "影片"],
      version: "v2.1",
      storage_path: "/official/observation-tutorial.mp4",
      mime: "video/mp4",
      size: 15360000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "of-003",
      name: "常見步態異常圖解.png",
      description: "12 種常見步態偏差的圖解與說明",
      tags: ["圖解", "教學"],
      version: "v1.2",
      storage_path: "/official/gait-abnormalities.png",
      mime: "image/png",
      size: 512000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  writeLS("library_official_files", JSON.stringify(mockFiles))
  return mockFiles
}

export async function addOfficialFile(
  file: Omit<OfficialFile, "id" | "created_at" | "updated_at">,
): Promise<OfficialFile> {
  const files = await listOfficialFiles()
  const newFile: OfficialFile = {
    ...file,
    id: `of-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  files.push(newFile)
  writeLS("library_official_files", JSON.stringify(files))
  return newFile
}

export async function updateOfficialFile(id: string, updates: Partial<OfficialFile>): Promise<void> {
  const files = await listOfficialFiles()
  const index = files.findIndex((f) => f.id === id)
  if (index !== -1) {
    files[index] = {
      ...files[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    writeLS("library_official_files", JSON.stringify(files))
  }
}

export async function deleteOfficialFile(id: string): Promise<void> {
  const files = await listOfficialFiles()
  const filtered = files.filter((f) => f.id !== id)
  writeLS("library_official_files", JSON.stringify(filtered))
}

// ============================================================
// Personal Database (User files)
// ============================================================

export async function listPersonalFiles(userId: string): Promise<PersonalFile[]> {
  const stored = readLS(`personal_files_${userId}`)
  if (stored) {
    return JSON.parse(stored)
  }
  return []
}

export async function addPersonalFile(
  userId: string,
  file: Omit<PersonalFile, "id" | "user_id" | "created_at">,
): Promise<PersonalFile> {
  const files = await listPersonalFiles(userId)
  const newFile: PersonalFile = {
    ...file,
    id: `pf-${Date.now()}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  }
  files.push(newFile)
  writeLS(`personal_files_${userId}`, JSON.stringify(files))
  return newFile
}

export async function updatePersonalFile(userId: string, id: string, updates: Partial<PersonalFile>): Promise<void> {
  const files = await listPersonalFiles(userId)
  const index = files.findIndex((f) => f.id === id)
  if (index !== -1) {
    files[index] = { ...files[index], ...updates }
    writeLS(`personal_files_${userId}`, JSON.stringify(files))
  }
}

export async function deletePersonalFile(userId: string, id: string): Promise<void> {
  const files = await listPersonalFiles(userId)
  const filtered = files.filter((f) => f.id !== id)
  writeLS(`personal_files_${userId}`, JSON.stringify(filtered))
}

// ============================================================
// PubMed Database
// ============================================================

export async function listPubmedRecords(filters?: { keyword?: string; yearFrom?: number; yearTo?: number }): Promise<
  PubmedRecord[]
> {
  const stored = readLS("pubmed_records")
  let records: PubmedRecord[] = []

  if (stored) {
    records = JSON.parse(stored)
  } else {
    // Mock initial data
    const mockRecords: PubmedRecord[] = [
      {
        id: "pm-001",
        title: "Biomechanical analysis of running gait patterns in competitive athletes",
        authors: "Smith J, Johnson M, Williams K",
        year: 2023,
        doi: "10.1016/j.jbiomech.2023.001",
        journal: "Journal of Biomechanics",
        abstract: "This study examines the biomechanical characteristics of running gait in 50 competitive athletes...",
        keywords: ["running", "gait analysis", "biomechanics", "athletes"],
        url: "https://doi.org/10.1016/j.jbiomech.2023.001",
        created_at: new Date().toISOString(),
      },
      {
        id: "pm-002",
        title: "Effects of footwear on running economy and injury risk",
        authors: "Chen L, Wang X, Lee S",
        year: 2022,
        doi: "10.1080/sports.2022.003",
        journal: "Sports Medicine",
        abstract: "We investigated the relationship between different footwear types and running economy...",
        keywords: ["footwear", "running economy", "injury prevention"],
        url: "https://doi.org/10.1080/sports.2022.003",
        created_at: new Date().toISOString(),
      },
      {
        id: "pm-003",
        title: "Hip and knee joint angles during the gait cycle: A systematic review",
        authors: "Martinez R, Brown A, Davis P",
        year: 2024,
        doi: "10.1002/jbm.2024.045",
        journal: "Journal of Biomechanics",
        abstract: "This systematic review synthesizes current evidence on joint angle measurements during running...",
        keywords: ["hip", "knee", "gait cycle", "joint angles"],
        url: "https://doi.org/10.1002/jbm.2024.045",
        created_at: new Date().toISOString(),
      },
    ]
    records = mockRecords
    writeLS("pubmed_records", JSON.stringify(mockRecords))
  }

  // Apply filters
  if (filters?.keyword) {
    const keyword = filters.keyword.toLowerCase()
    records = records.filter(
      (r) =>
        r.title.toLowerCase().includes(keyword) ||
        r.abstract?.toLowerCase().includes(keyword) ||
        r.keywords.some((k) => k.toLowerCase().includes(keyword)),
    )
  }

  if (filters?.yearFrom) {
    records = records.filter((r) => r.year >= filters.yearFrom!)
  }

  if (filters?.yearTo) {
    records = records.filter((r) => r.year <= filters.yearTo!)
  }

  return records
}

// ============================================================
// User Collections (Favorites)
// ============================================================

export async function listUserCollections(userId: string): Promise<UserCollection[]> {
  const stored = readLS(`user_collections_${userId}`)
  return stored ? JSON.parse(stored) : []
}

export async function addToCollection(
  userId: string,
  sourceType: "official_file" | "pubmed",
  sourceId: string,
  note?: string,
): Promise<UserCollection> {
  const collections = await listUserCollections(userId)

  // Check if already exists
  const exists = collections.find((c) => c.source_type === sourceType && c.source_id === sourceId)
  if (exists) {
    return exists
  }

  const newCollection: UserCollection = {
    id: `col-${Date.now()}`,
    user_id: userId,
    source_type: sourceType,
    source_id: sourceId,
    note,
    created_at: new Date().toISOString(),
  }

  collections.push(newCollection)
  writeLS(`user_collections_${userId}`, JSON.stringify(collections))
  return newCollection
}

export async function removeFromCollection(userId: string, collectionId: string): Promise<void> {
  const collections = await listUserCollections(userId)
  const filtered = collections.filter((c) => c.id !== collectionId)
  writeLS(`user_collections_${userId}`, JSON.stringify(filtered))
}
