/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  __setIsRegistering?: (isRegistering: boolean) => void;
  __isRegistering?: boolean;
}
