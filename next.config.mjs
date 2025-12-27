/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 配置 webpack 來處理 @react-google-maps/api 的 SSR 問題
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 在 server-side 構建時，忽略 @react-google-maps/api 中的 location 錯誤
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

export default nextConfig
