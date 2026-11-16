/** @type {import('next').NextConfig} */
const nextConfig = {
  // бібліотека малювання картинок працює на сервері як є (не пакується в збірку)
  serverExternalPackages: ["@napi-rs/canvas"],
  // шрифти для підпису складу на картинці мають потрапити на Vercel разом із серверним кодом
  outputFileTracingIncludes: {
    "/api/**/*": ["./app/lib/server/fonts/**/*"],
  },
};

export default nextConfig;
