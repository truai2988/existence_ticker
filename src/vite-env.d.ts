/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Direct global flag for critical race condition prevention
interface Window {
  __isRegistering?: boolean;
}
