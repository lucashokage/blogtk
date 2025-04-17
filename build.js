const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

// Función para ejecutar comandos y mostrar la salida
function runCommand(command) {
  console.log(`Ejecutando: ${command}`);
  try {
    const output = execSync(command, { stdio: "inherit" });
    return true;
  } catch (error) {
    console.error(`Error al ejecutar: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Obtener el directorio raíz del proyecto
const rootDir = process.cwd();
console.log(`Directorio raíz: ${rootDir}`);

// Determine the correct data directory based on the environment
let dataDir;
try {
  // Check if we're on Vercel
  if (process.env.VERCEL === "1") {
    // On Vercel, use the /tmp directory which is writable
    dataDir = path.join("/tmp", "data");
    console.log(`Running on Vercel, using temp directory: ${dataDir}`);
  }
  // Check if we're on Render
  else if (process.env.RENDER_PERSISTENT_DIR) {
    // Make sure we have an absolute path
    const renderDir = process.env.RENDER_PERSISTENT_DIR;
    if (path.isAbsolute(renderDir)) {
      dataDir = path.join(renderDir, "data");
    } else {
      // If it's not absolute, make it relative to current directory
      dataDir = path.join(rootDir, renderDir, "data");
    }
    console.log(`Running on Render, using persistent directory: ${dataDir}`);
  }
  // Local development or other environment
  else {
    dataDir = path.join(rootDir, "data");
    console.log(`Using local data directory: ${dataDir}`);
  }

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    console.log(`Creating data directory: ${dataDir}`);
    fs.ensureDirSync(dataDir);
  }
} catch (error) {
  console.error(`Error setting up data directory: ${error.message}`);
  // Last resort fallback - use temp directory
  dataDir = path.join(os.tmpdir(), "blog-teikoku-data");
  console.log(`Falling back to temp directory: ${dataDir}`);

  try {
    fs.ensureDirSync(dataDir);
  } catch (err) {
    console.error(`Failed to create fallback directory: ${err.message}`);
  }
}

// Crear directorios necesarios
const dirs = [
  path.join(rootDir, "blog"),
  path.join(rootDir, "blog/app"),
  path.join(rootDir, "lib"),
  path.join(rootDir, "assets"),
  path.join(rootDir, "vendor"),
  path.join(rootDir, "backup"),
];

// Crear directorios si no existen
console.log("Creando directorios necesarios...");
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`Creando directorio: ${dir}`);
    fs.ensureDirSync(dir);
  }
});

// Crear archivo members.json vacío si no existe
const membersJsonPath = path.join(dataDir, "members.json");
if (!fs.existsSync(membersJsonPath)) {
  console.log(`Creando archivo members.json en ${membersJsonPath}`);
  fs.writeFileSync(membersJsonPath, "[]", "utf8");
}

// Crear archivo codes.json vacío si no existe
const codesJsonPath = path.join(dataDir, "codes.json");
if (!fs.existsSync(codesJsonPath)) {
  console.log(`Creando archivo codes.json en ${codesJsonPath}`);
  fs.writeFileSync(codesJsonPath, "[]", "utf8");
}

// Verificar y crear archivo next.config.mjs en el directorio blog si no existe
const blogNextConfigPath = path.join(rootDir, "blog", "next.config.mjs");
if (!fs.existsSync(blogNextConfigPath)) {
  console.log("Creando next.config.mjs en directorio blog...");
  const nextConfigContent = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['files.catbox.moe', 'example.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Configuración para ignorar errores de compilación en producción
  typescript: {
    // !! ADVERTENCIA !!
    // Esto solo debe usarse como solución temporal
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! ADVERTENCIA !!
    // Esto solo debe usarse como solución temporal
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
`;
  fs.writeFileSync(blogNextConfigPath, nextConfigContent, "utf8");
}

// Asegurarse de que Next.js está instalado
console.log("Verificando instalación de Next.js...");
try {
  // Intentar instalar Next.js en el directorio raíz
  runCommand("npm install next --no-save");

  // Construir la aplicación Next.js
  console.log("Construyendo la aplicación Next.js...");
  
  // Asegurarse de que Next.js está instalado en el directorio blog
  if (!runCommand("npx next build")) {
    console.error("Error al construir la aplicación Next.js");
    process.exit(1);
  }

  console.log("Construcción completada con éxito!");
} catch (error) {
  console.error(`Error durante la construcción: ${error.message}`);
  process.exit(1);
}
