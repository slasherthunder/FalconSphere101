import { Geist, Geist_Mono } from "next/font/google";
import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FalconSphere",
  description: "Welcome to FalconSphere - Your next-gen platform.",
};

export default function RootLayout({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) setDarkMode(storedTheme === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300 bg-white text-black dark:bg-black dark:text-[#FFD700]`}
      >
        {/* Navbar */}
        <nav className="bg-[#600000] dark:bg-[#330000] shadow-md py-4 px-6 flex justify-between items-center fixed w-full top-0 z-50">
          <h1 className="text-2xl font-bold text-[#FFD700]">FalconSphere</h1>
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-[#FFD700] text-black dark:bg-black dark:text-[#FFD700] hover:scale-110 transition"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-[#FFD700]"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden absolute top-16 left-0 w-full bg-[#600000] dark:bg-[#330000] text-[#FFD700] shadow-md p-5 flex flex-col gap-4">
            <Link href="#">Home</Link>
            <Link href="#">About</Link>
            <Link href="#">Contact</Link>
          </div>
        )}

        {/* Main Content */}
        <main className="container mx-auto px-6 py-20 min-h-screen">{children}</main>

        {/* Footer */}
        <footer className="bg-[#600000] dark:bg-[#330000] border-t border-[#FFD700] mt-8 py-6 text-center text-[#FFD700]">
          <p>&copy; {new Date().getFullYear()} FalconSphere. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="#" className="hover:scale-110 transition">🔗 Twitter</a>
            <a href="#" className="hover:scale-110 transition">🔗 LinkedIn</a>
            <a href="#" className="hover:scale-110 transition">🔗 GitHub</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
