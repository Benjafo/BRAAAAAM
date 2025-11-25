import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/700.css";
import "./index.css";
import { routeTree } from "./routeTree.gen";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import App from './App.tsx'

// Apply theme from localStorage on initial load
const THEME_STORAGE_KEY = "app-theme";
const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";

// Remove all theme classes first
document.documentElement.classList.remove(
    "cherry-blossom",
    "lavender-dreams",
    "rose-gold",
    "coffee-mocha",
    "desert-sand",
    "arctic-frost",
    "electric-cyan",
    "electric-neon",
    "crimson-night",
    "wine-cellar",
    "dark",
    "dark-amber",
    "ocean-blue",
    "forest-green",
    "sunset-purple",
    "midnight-slate",
    "coral-reef"
);

// Apply the stored theme
if (storedTheme !== "light") {
    document.documentElement.classList.add(storedTheme);
}

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </StrictMode>
);
