import { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                base: { light: "#E0E5EC", dark: "#2A2D3A" },
                surface: { light: "#F5F7FA", dark: "#343849" },
                primary: { light: "#6C63FF", dark: "#8B85FF" },
                secondary: { light: "#FF8B6B", dark: "#FF9C7F" },
                online: { light: "#4ADE80", dark: "#5EE499" },
                ink: { light: "#3A3F4B", dark: "#E4E6EB" },
            },
            boxShadow: {
                // Neomorphic raised (light mode)
                "neo-raised": "6px 6px 12px #b8bcc5, -6px -6px 12px #ffffff",
                "neo-pressed":
                    "inset 4px 4px 8px #b8bcc5, inset -4px -4px 8px #ffffff",
                // Neomorphic raised (dark mode)
                "neo-raised-dark":
                    "6px 6px 12px #21232d, -6px -6px 12px #333747",
                "neo-pressed-dark":
                    "inset 4px 4px 8px #21232d, inset -4px -4px 8px #333747",
            },
            borderRadius: {
                neo: "20px",
            },
        },
    },
    plugins: [],
};

export default config;