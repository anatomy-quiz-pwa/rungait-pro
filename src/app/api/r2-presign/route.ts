// src/app/api/r2-presign/route.ts
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 先讀 raw 環境變數（不要先加 !，我們要檢查它是不是 undefined）
const RAW_R2_ENDPOINT = process.env.R2_ENDPOINT;
const RAW_R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const RAW_R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_VIDEOS = process.env.R2_BUCKET_VIDEOS || "runpose-videos";

// 🔍 在模組載入時就印一次環境變數狀態
console.log("🟦 DEBUG R2 ENV:", {
  endpoint: RAW_R2_ENDPOINT,
  accessKeyId_present: !!RAW_R2_ACCESS_KEY_ID,
  secretKey_present: !!RAW_R2_SECRET_ACCESS_KEY,
});

// 如果少任何一個，直接在伺服器 log 提醒（也避免 AWS SDK 報那個看不懂的錯誤）
if (!RAW_R2_ENDPOINT || !RAW_R2_ACCESS_KEY_ID || !RAW_R2_SECRET_ACCESS_KEY) {
  console.error("❌ R2 環境變數缺少，請檢查 Vercel 設定");
  // 這裡不要 throw，讓 POST 回傳可讀的錯誤訊息
}

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
    const { fileName, email } = await req.json();
    if (!fileName || !email) {
      return NextResponse.json(
        { error: "缺少 fileName 或 email" },
        { status: 400 }
      );
    }

    // 如果環境變數缺少，直接回比較清楚的訊息
    if (!RAW_R2_ENDPOINT || !RAW_R2_ACCESS_KEY_ID || !RAW_R2_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: "伺服器 R2 環境變數未設定完整，請聯絡管理者" },
        { status: 500 }
      );
    }

    const safeEmail = encodeURIComponent(email);
    const key = `${safeEmail}/${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_VIDEOS,
      Key: key,
      // ContentType 由前端 PUT 時帶 file.type 即可
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({
      uploadUrl,
      objectKey: key,
    });
  } catch (err: any) {
    console.error("❌ /api/r2-presign 錯誤：", err);
    return NextResponse.json(
      { error: "預簽失敗：" + err.message },
      { status: 500 }
    );
  }
}
