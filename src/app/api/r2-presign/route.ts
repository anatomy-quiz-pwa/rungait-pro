import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// 從後端環境變數讀取（安全）
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET!;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN!;
// R2 endpoint (S3 相容)
const R2_ENDPOINT = process.env.R2_ENDPOINT!; 
// 例如: https://<account_id>.r2.cloudflarestorage.com

export async function POST(req: NextRequest) {
  try {
    const { fileName, email } = await req.json();
    if (!fileName || !email)
      return NextResponse.json({ error: "缺少 fileName 或 email" }, { status: 400 });

    // 實際 R2 存放路徑
    const objectKey = `${email}/${Date.now()}_${fileName}`;

    // Pre-signed URL 期限（秒）
    const expiresIn = 300;

    // ===== 產生 S3 相容簽名（v4） =====
    const isoDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const shortDate = isoDate.slice(0, 8);

    const credential = `${R2_ACCESS_KEY_ID}/${shortDate}/auto/s3/aws4_request`;

    const policy = {
      expiration: new Date(Date.now() + expiresIn * 1000).toISOString(),
      conditions: [
        { bucket: R2_BUCKET },
        ["starts-with", "$key", objectKey],
        { "x-amz-algorithm": "AWS4-HMAC-SHA256" },
        { "x-amz-credential": credential },
        { "x-amz-date": isoDate },
      ],
    };

    const policyBase64 = Buffer.from(JSON.stringify(policy)).toString("base64");

    // 簽名
    const sign = (key: any, msg: any) =>
      crypto.createHmac("sha256", key).update(msg).digest();

    const dateKey = sign("AWS4" + R2_SECRET_ACCESS_KEY, shortDate);
    const regionKey = sign(dateKey, "auto");
    const serviceKey = sign(regionKey, "s3");
    const signingKey = sign(serviceKey, "aws4_request");
    const signature = crypto
      .createHmac("sha256", signingKey)
      .update(policyBase64)
      .digest("hex");

    // 回傳前端可用的 form data
    return NextResponse.json({
      uploadUrl: `${R2_ENDPOINT}/${R2_BUCKET}`,
      fields: {
        key: objectKey,
        "x-amz-algorithm": "AWS4-HMAC-SHA256",
        "x-amz-credential": credential,
        "x-amz-date": isoDate,
        policy: policyBase64,
        "x-amz-signature": signature,
      },
      publicUrl: `${R2_PUBLIC_DOMAIN}/${objectKey}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
