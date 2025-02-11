import { Geist, Geist_Mono } from "next/font/google";
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
  title: "FalconSphere!",
  description: "Welcome to FalconSphere - Your next-gen platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FFFFFF] text-[#FFD700]`}
      >
        {/* Navbar */}
        <nav className="bg-[#600000] shadow-sm">
          <div className="container mx-auto px-5 py-5 flex items-center justify-between">
            {/* Logo */}
            <h1 className="text-2xl font-bold text-[#F3B13B]">FalconSphere</h1>

            {/* Navigation Links */}
            <div className="space-x-6">
              <Link href="/" className="text-[#F3B13B] hover:text-white">
                Home
              </Link>
              <Link href="/create-set" className="text-[#F3B13B] hover:text-white">
                Create Sets 
              </Link>
              <Link href="/new-game" className="text-[#F3B13B] hover:text-white">
                New Game
              </Link>
              <Link href="/join-game" className="text-[#F3B13B] hover:text-white">
                Join Game
              </Link>
              <Link href="/feedview" className="text-[#F3B13B] hover:text-white">
                Ask A Question
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto px-5 py-8">{children}</main>

        {/* Footer */}
        <footer className="bg-[#600000] border-t border-[#FFD700] mt-8">
          <div className="container mx-auto px-4 py-6 text-center text-[#F3B13B]">
            <p>&copy; {new Date().getFullYear()} FalconSphere. All rights reserved.</p>
            <div className="space-x-6">
              <Link href="/help" className="text-[#F3B13B] hover:text-white">
                Need Help and Issues With FalconSphere?
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
} 
