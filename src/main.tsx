import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyTheme, getSavedTheme } from "@/lib/theme";

// Apply theme as early as possible (after CSS is loaded)
applyTheme(getSavedTheme());

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration failed, app will still work
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
