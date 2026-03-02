"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

const DEBUG_UPLOAD = process.env.NODE_ENV === "development"
const SIGNED_UPLOAD_TIMEOUT_MS = 90_000 // 90s（直接打到 Supabase，不經 Next.js）
const LARGE_FILE_THRESHOLD_BYTES = 10 * 1024 * 1024 // 10MB
const BUCKET = "personal-library"

export function LiteratureUploadModal({
    children,
    className
}: {
    children?: React.ReactNode
    className?: string
}) {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState("")
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile)
        } else if (selectedFile) {
            toast({
                title: "Invalid file type",
                description: "Please select a PDF file.",
                variant: "destructive",
            })
        }
    }

    /** 從 Supabase Storage error 或一般 Error 產出可解釋字串（含 status/code/message） */
    function getExplainableError(err: unknown): string {
        if (err && typeof err === "object") {
            const o = err as Record<string, unknown>
            const status = o.statusCode ?? o.status ?? ""
            const code = o.code ?? o.error ?? ""
            const msg = o.message ?? (err instanceof Error ? err.message : "")
            const parts = [msg]
            if (status) parts.push(`status: ${status}`)
            if (code) parts.push(`code: ${code}`)
            return parts.join(" · ")
        }
        if (err instanceof Error) return err.message
        return "An error occurred"
    }

    /** 依 status / response 判斷並回傳可顯示的錯誤類型（RLS / 未登入 / 超時 / 檔案過大） */
    function getErrorCategory(status: number, body: unknown): string {
        if (status === 401) return "未登入：請先登入再上傳。"
        if (status === 403) return "權限不足（RLS）：請確認已登入且 Storage policy 允許您的路徑。"
        if (status === 413) return "檔案過大：超過伺服器或 bucket 限制，請試較小檔案。"
        if (status === 408 || status === 504) return "上傳超時：網路較慢或檔案過大，請試較小檔案或稍後再試。"
        if (body && typeof body === "object" && "message" in body) {
            const msg = String((body as { message?: string }).message ?? "")
            if (/timeout|timed out|逾時/i.test(msg)) return "上傳超時：請試較小檔案或稍後再試。"
            if (/size|too large|413/i.test(msg)) return "檔案過大：請試較小檔案。"
            if (/policy|RLS|permission|403/i.test(msg)) return "權限不足（RLS）：請確認已登入。"
        }
        return ""
    }

    const handleUpload = async () => {
        if (!file) return

        setLoading(true)
        setStatus("取得上傳網址...")

        if (DEBUG_UPLOAD) {
            console.debug("[Upload] file.size:", file.size, "file.type:", file.type)
        }

        const uploadStart = Date.now()

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user
            if (!user || !session) {
                const msg = "未登入：請先登入再上傳。"
                console.error("[Upload] Not authenticated")
                toast({ title: "上傳失敗", description: msg, variant: "destructive" })
                throw new Error(msg)
            }

            // (1) POST /api/storage/sign-upload 拿 signedUrl（帶 access_token，server 才能辨識登入狀態）
            const signRes = await fetch("/api/storage/sign-upload", {
                method: "POST",
                headers: session.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
            })
            const signText = await signRes.text()
            let signJson: { objectPath?: string; signedUrl?: string; token?: string | null; error?: string; code?: string }
            try {
                signJson = JSON.parse(signText)
            } catch {
                signJson = {}
            }

            if (DEBUG_UPLOAD) {
                console.debug("[Upload] sign-upload path:", signJson.objectPath, "start:", new Date().toISOString())
            }

            if (!signRes.ok) {
                const explainable = signJson.error ?? signText
                const category = getErrorCategory(signRes.status, signJson)
                const display = category || explainable
                console.error("[Upload] sign-upload failed — status:", signRes.status, "response:", signText)
                toast({
                    title: "取得上傳網址失敗",
                    description: display,
                    variant: "destructive",
                })
                throw new Error(display)
            }

            const { objectPath, signedUrl } = signJson
            if (!objectPath || !signedUrl) {
                console.error("[Upload] sign-upload missing objectPath/signedUrl — response:", signJson)
                toast({
                    title: "上傳失敗",
                    description: "伺服器未回傳上傳網址。",
                    variant: "destructive",
                })
                throw new Error("Missing objectPath or signedUrl")
            }

            setStatus("上傳檔案到 Storage...")

            // (2) PUT 檔案直接到 signedUrl（不走後端，避開 body size / timeout）
            const putController = new AbortController()
            const putTimeout = setTimeout(() => putController.abort(), SIGNED_UPLOAD_TIMEOUT_MS)
            const putRes = await fetch(signedUrl, {
                method: "PUT",
                headers: { "Content-Type": "application/pdf" },
                body: file,
                signal: putController.signal,
            })
            clearTimeout(putTimeout)

            if (DEBUG_UPLOAD) {
                console.debug("[Upload] PUT end:", new Date().toISOString(), "elapsed ms:", Date.now() - uploadStart)
            }

            const putText = await putRes.text()
            let putBody: unknown = null
            try {
                putBody = putText ? JSON.parse(putText) : null
            } catch {
                putBody = putText
            }

            if (!putRes.ok) {
                const category = getErrorCategory(putRes.status, putBody)
                const display = category || putText || `HTTP ${putRes.status}`
                console.error("[Upload] PUT failed — status:", putRes.status, "response:", putText)
                toast({
                    title: "Storage 上傳失敗",
                    description: display,
                    variant: "destructive",
                })
                throw new Error(display)
            }

            setStatus("儲存文獻紀錄...")

            // (3) 建立 literature 紀錄（只送 metadata，不送檔案）
            const title = file.name.replace(/\.pdf$/i, "") || "Untitled"
            const { data: literatureData, error: dbError } = await supabase
                .from("literature")
                .insert({
                    title,
                    url: objectPath,
                    owner_user_id: user.id,
                    tags: [],
                })
                .select()
                .single()

            if (dbError) {
                const explainable = getExplainableError(dbError)
                console.error("[Upload] DB error:", dbError)
                toast({ title: "儲存失敗", description: explainable, variant: "destructive" })
                throw new Error(explainable)
            }

            toast({
                title: "上傳成功",
                description: "PDF 已上傳，正在背景提取資料，稍後重新整理即可看到結果。",
            })
            setOpen(false)
            setFile(null)
            router.refresh()

            // (4) 背景呼叫 AI 提取（bucket = personal-library）
            fetch("/api/ai/extract-literature", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filePath: objectPath,
                    literatureId: literatureData.id,
                    bucket: BUCKET,
                }),
            })
                .then((res) => {
                    if (res.ok) router.refresh()
                    else {
                        const t = res.text()
                        console.error("[Upload] AI extraction failed — status:", res.status, "response:", t)
                    }
                })
                .catch((e) => console.error("[Upload] AI extraction error:", e))
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            const isAbort = message.includes("abort") || (error instanceof Error && error.name === "AbortError")
            const isTimeout = message.includes("逾時") || message.includes("超時")
            console.error("[Upload] Error:", message, error)
            toast({
                title: "上傳失敗",
                description: isAbort || isTimeout
                    ? `上傳超時或中斷。若檔案較大或網路較慢，請試較小檔案或稍後再試。`
                    : message,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
            setStatus("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className={className}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload PDF
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload Literature</DialogTitle>
                    <DialogDescription>
                        Upload a research paper (PDF) to automatically extract gait analysis data.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pdf-file" className="text-right">
                            PDF
                        </Label>
                        <Input
                            id="pdf-file"
                            type="file"
                            accept=".pdf"
                            className="col-span-3"
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                    </div>
                    {file && file.size > LARGE_FILE_THRESHOLD_BYTES && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            檔案較大（&gt;10MB），上傳可能較久；若逾時請試較小檔案或稍後再試。
                        </p>
                    )}
                    {loading && (
                        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{status}</span>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleUpload} disabled={!file || loading}>
                        {loading ? "Processing..." : "Upload & Analyze"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
