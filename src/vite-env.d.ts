/// <reference types="vite/client" />

interface Window {
  noctis?: {
    isElectron: boolean;
    toggleFullscreen: () => Promise<boolean>;
    isFullscreen: () => Promise<boolean>;
  };
}
