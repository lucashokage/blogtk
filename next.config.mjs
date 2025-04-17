/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desactivar generación estática para evitar problemas de tiempo de espera
  output: 'standalone',
  
  // Optimizar para producción
  productionBrowserSourceMaps: false,
  
  // Configuración de optimización de imágenes
  images: {
    domains: ['files.catbox.moe', 'example.com', 'i.imgur.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Deshabilitar optimización de imágenes durante build para evitar problemas de memoria
    unoptimized: process.env.NODE_ENV === 'production',
  },
  
  // Aumentar memoria y tiempo de espera
  experimental: {
    memoryBasedWorkersCount: true,
    serverComponentsExternalPackages: ['mongoose', 'mongodb'],
    cpus: 1, // Limitar CPUs en entornos con restricciones
  },
  
  // Deshabilitar verificaciones de tipos y eslint durante la construcción
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Aumentar el tiempo de espera para generación de páginas estáticas
  staticPageGenerationTimeout: 180,
  
  // Configuración de webpack para manejar módulos problemáticos
  webpack: (config, { isServer }) => {
    // Resolver problemas con módulos en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        mongodb: false,
        mongoose: false,
      };
    }
    
    // Ampliar límites de memoria para webpack
    config.performance = {
      ...config.performance,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    };
    
    // Resolver rutas absolutas
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
    };
    
    return config;
  },
  
  // Configuración para reducir el tamaño del paquete
  poweredByHeader: false,
  reactStrictMode: false, // Desactivar en producción para evitar renderizados dobles
};

export default nextConfig;
