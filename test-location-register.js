#!/usr/bin/env node
/**
 * 測試 location register API
 * 
 * 使用方法：
 * 1. 確保 .env.local 中有 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 2. 在 frontend 目錄下執行：node test-location-register.js
 */

const https = require('https');
const http = require('http');

// 從環境變數或直接設定（測試用）
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ENDPOINT = '/api/locations/register';

// 測試資料
const testData = {
  user_id: 'user_test_' + Date.now(), // 模擬認證的 user_id（非 UUID 格式）
  user_email: 'test@example.com',
  name: '測試地點 - ' + new Date().toLocaleString('zh-TW'),
  lat: 25.0330,
  lng: 121.5654,
  address: '台北市信義區信義路五段7號',
  city: '台北市',
  source: 'manual',
  description: '這是一個自動測試地點',
  contact_info: 'test@example.com'
};

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(data))
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  console.log('🧪 開始測試 location register API...\n');
  console.log('📋 測試資料：');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n');
  
  const url = API_URL + ENDPOINT;
  console.log(`🌐 請求 URL: ${url}\n`);
  
  try {
    const response = await makeRequest(url, testData);
    
    console.log('📥 回應狀態碼:', response.status);
    console.log('📦 回應內容:');
    console.log(JSON.stringify(response.body, null, 2));
    console.log('\n');
    
    if (response.status === 201 || response.status === 200) {
      console.log('✅ 測試成功！');
      console.log('📍 地點 ID:', response.body.id);
      console.log('\n💡 提示：請在 Supabase 中確認資料已正確插入');
    } else {
      console.log('❌ 測試失敗');
      if (response.body.error) {
        console.log('錯誤訊息:', response.body.error);
      }
      if (response.body.details) {
        console.log('詳細資訊:', response.body.details);
      }
      if (response.body.hint) {
        console.log('提示:', response.body.hint);
      }
    }
  } catch (error) {
    console.error('❌ 請求失敗:', error.message);
    console.error('\n💡 提示：');
    console.error('1. 確認 Next.js dev server 正在運行（pnpm dev）');
    console.error('2. 確認 API_URL 設定正確（預設: http://localhost:3000）');
    console.error('3. 如果使用生產環境，設定 API_URL 環境變數：');
    console.error('   API_URL=https://your-project.vercel.app node test-location-register.js');
  }
}

// 執行測試
test();

