// src/app/api/r2-presign/route.ts
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const RAW_R2_ENDPOINT = process.env.R2_ENDPOINT;
const RAW_R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const RAW_R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_VIDEOS = process.env.R2_BUCKET_VIDEOS || "runpose-videos";

// 🔍 這行會出現在「Functions log」裡
console.log("🟦 DEBUG R2 ENV:", {
  endpoint: RAW_R2_ENDPOINT,
  accessKeyId_present: !!RAW_R2_ACCESS_KEY_ID,
  secretKey_present: !!RAW_R2_SECRET_ACCESS_KEY,
});

if (!RAW_R2_ENDPOINT || !RAW_R2_ACCESS_KEY_ID || !RAW_R2_SECRET_ACCESS_KEY) {
  console.error("❌ R2 環境變數缺少，請檢查 Vercel 設定");
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
