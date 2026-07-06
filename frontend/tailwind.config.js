/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom color palette for status badges and DAG node colors
      colors: {
        status: {
          pending:   "#64748b",   // slate-500
          running:   "#3b82f6",   // blue-500
          completed: "#10b981",   // emerald-500
          failed:    "#ef4444",   // red-500
          skipped:   "#f59e0b",   // amber-500
          queued:    "#8b5cf6",   // violet-500
        },
      },
      // Custom animation for the "running" pulse on DAG nodes
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
