import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPostHog } from "./lib/posthog";

// Initialize PostHog analytics
initPostHog();

// Enforce light theme on startup
document.documentElement.classList.remove('dark');
localStorage.setItem('everpay-theme', 'light');

createRoot(document.getElementById("root")!).render(<App />);
