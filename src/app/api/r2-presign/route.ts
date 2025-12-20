import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const RAW_R2_ENDPOINT = process.env.R2_ENDPOINT;
const RAW_R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const RAW_R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_VIDEOS = process.env.R2_BUCKET_VIDEOS || "runpose-videos";

// 建立 S3 Client（Cloudflare R2）
const s3 = new S3Client({
  region: "auto",
  endpoint: RAW_R2_ENDPOINT,
  credentials: {
    accessKeyId: RAW_R2_ACCESS_KEY_ID || "",
    secretAccessKey: RAW_R2_SECRET_ACCESS_KEY || "",
  },
});

function sanitizeFileName(input: string) {
  // 只保留檔名，避免帶入路徑（含 Windows/Unix）
  const base = input.split("/").pop()?.split("\\").pop() ?? input;
  // 移除可能造成路徑或 header 異常的字元
  return base.replace(/[^\w.\-()+\s]/g, "_");
}

export async function POST(req: Request) {
  try {
    // 0) 基本環境變數檢查
    if (!RAW_R2_ENDPOINT) {
      return NextResponse.json({ error: "R2_ENDPOINT 未設定" }, { status: 500 });
    }
    if (!RAW_R2_ACCESS_KEY_ID || !RAW_R2_SECRET_ACCESS_KEY) {
      return NextResponse.json({ error: "R2 Access Key 未設定" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({} as any));
    const rawFileName = body?.fileName;

    if (typeof rawFileName !== "string" || !rawFileName.trim()) {
      return NextResponse.json({ error: "缺少 fileName" }, { status: 400 });
    }

    const fileName = sanitizeFileName(rawFileName.trim());

    // 1) 驗證登入（注意：createSupabaseServerClient 已改為 async）
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();

    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "未登入，禁止上傳" }, { status: 401 });
    }

    const userId = authData.user.id;

    // 2) 查白名單
    const { data: access, error: accessErr } = await supabase
      .from("user_access")
      .select("can_upload")
      .eq("user_id", userId)
      .single();

    if (accessErr || !access?.can_upload) {
      return NextResponse.json({ error: "此帳號未開通上傳權限" }, { status: 403 });
    }

    // 3) 用 userId 當資料夾前綴
    const key = `videos/${userId}/${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_VIDEOS,
      Key: key,
      // 你如果前端會帶 contentType，可在這裡一併寫入（非必要）
      // ContentType: body?.contentType || "application/octet-stream",
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({ uploadUrl, objectKey: key });
  } catch (err: any) {
    console.error("❌ /api/r2-presign 錯誤：", err);
    return NextResponse.json(
      { error: "預簽失敗：" + (err?.message || String(err)) },
      { status: 500 }
    );
  }
}
