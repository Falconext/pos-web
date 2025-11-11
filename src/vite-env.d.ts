/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // más variables de entorno según las necesites
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}