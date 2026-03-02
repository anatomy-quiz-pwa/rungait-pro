/**
 * 夥伴 Sun 相容：supabase 單例
 * 供 src/app 的 upload、single、job、result 等頁面使用
 */
import { supabaseBrowser } from "@/lib/supabase-browser"

export const supabase = supabaseBrowser()
