import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const RAW_R2_ENDPOINT = process.env.R2_ENDPOINT;
const RAW_R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const RAW_R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_VIDEOS = process.env.R2_BUCKET_VIDEOS || "runpose-videos";

const s3 = new S3Client({
  region: "auto",
  endpoint: RAW_R2_ENDPOINT,
  credentials: {
    accessKeyId: RAW_R2_ACCESS_KEY_ID || "",
    secretAccessKey: RAW_R2_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();
    if (!fileName) {
      return NextResponse.json({ error: "缺少 fileName" }, { status: 400 });
    }

    // 1) 驗證登入
    const supabase = createSupabaseServerClient();
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
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({ uploadUrl, objectKey: key });
  } catch (err: any) {
    console.error("❌ /api/r2-presign 錯誤：", err);
    return NextResponse.json({ error: "預簽失敗：" + err.message }, { status: 500 });
  }
}
