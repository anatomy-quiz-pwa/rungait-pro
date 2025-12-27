/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 禁用 Turbopack 以使用 webpack（Turbopack 可能不支援某些配置）
  // 或者使用 experimental.turbopack 來配置
  experimental: {
    // 暫時禁用 Turbopack 以確保 webpack 配置生效
    // turbopack: {
    //   resolveAlias: {
    //     '@react-google-maps/api': false,
    //   },
    // },
  },
  // 配置 webpack 來處理 @react-google-maps/api 的 SSR 問題
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // 在 server-side 構建時，將 @react-google-maps/api 設為 external
      // 這樣它就不會在 server bundle 中被包含
      config.externals = config.externals || []
      config.externals.push({
        '@react-google-maps/api': 'commonjs @react-google-maps/api',
      })
      
      // 提供一個假的 location 物件來避免模組載入時的錯誤
      config.plugins = config.plugins || []
      config.plugins.push(
        new webpack.DefinePlugin({
          'typeof location': JSON.stringify('undefined'),
          'location': JSON.stringify(undefined),
        })
      )
    }
    return config
  },
}

export default nextConfig
