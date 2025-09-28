interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_ALLOW_REMOTE_EVENTS?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
