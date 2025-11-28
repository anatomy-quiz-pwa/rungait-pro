// src/app/api/r2-presign/route.ts
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ENDPOINT = process.env.R2_ENDPOINT!;           // 例： https://a8904....r2.cloudflarestorage.com
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_VIDEOS = process.env.R2_BUCKET_VIDEOS || "runpose-videos";

// 建一個 S3 client 指向 Cloudflare R2
const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(req: Request) {
  try {
    const { fileName, email } = await req.json();
    if (!fileName || !email) {
      return NextResponse.json({ error: "缺少 fileName 或 email" }, { status: 400 });
    }

    // 建議的物件 key： userEmail/時間戳_檔名
    const safeEmail = encodeURIComponent(email);
    const key = `${safeEmail}/${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_VIDEOS,
      Key: key,
      // 這裡可以不指定 ContentType，前端用 file.type 傳過來即可
    });

    // 產生 1 小時有效的預簽 URL
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({
      uploadUrl,   // 前端用這個 URL 做 PUT
      objectKey: key, // 存到 jobs.original_video_r2
    });
  } catch (err: any) {
    console.error("❌ /api/r2-presign 錯誤：", err);
    return NextResponse.json({ error: "預簽失敗：" + err.message }, { status: 500 });
  }
}
