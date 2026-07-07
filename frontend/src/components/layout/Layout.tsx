import type { ReactNode } from "react";
import Navbar from "./Navbar";
import { Toaster } from "react-hot-toast";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937', // gray-800
            color: '#fff',
            border: '1px solid #374151', // gray-700
          },
        }}
      />
    </div>
  );
}
