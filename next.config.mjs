/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Полностью отключаем SSR для статического экспорта
  trailingSlash: true,
  output: "export",
  experimental: {
    esmExternals: 'loose',
    largePageDataBytes: 512 * 1024, // 512KB
  },
  // Webpack конфигурация для статического сайта
  webpack: (config, { isServer }) => {
    // Полностью отключаем серверный рендеринг для всех модулей
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }
    }
    
    // Исключаем проблемные модули из серверного бандла
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push('@tonconnect/ui-react')
    }
    
    return config
  },
}

export default nextConfig
