import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { FaHome, FaPlus, FaGamepad, FaSignInAlt, FaInfoCircle } from "react-icons/fa"; // Import icons
import "./globals.css"; // Keep it if you're handling fonts and general styles

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-b from-[#FFFFFF] to-[#FFF5E6] text-[#FFD700]`}
      >
        {/* Navbar */}
        <nav className="bg-gradient-to-r from-[#8B0000] to-[#600000] shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="group">
              <h1 className="text-3xl font-bold text-[#F3B13B] hover:text-[#FFD700] transition-all duration-300 transform hover:scale-105">
                FalconSphere
              </h1>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { href: "/", label: "Home", icon: FaHome },
                { href: "/create-set", label: "Create Sets", icon: FaPlus },
                { href: "/new-game", label: "New Game", icon: FaGamepad },
                { href: "/join-game", label: "Join Game", icon: FaSignInAlt },
                { href: "/about-us", label: "About Us", icon: FaInfoCircle }
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center text-[#F3B13B] hover:text-[#FFD700] transition-all duration-300 relative py-2"
                >
                  <Icon className="mr-2 text-lg transform group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-lg font-medium">{label}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFD700] transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-[#F3B13B] hover:text-[#FFD700] transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="min-h-screen">{children}</main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-[#8B0000] to-[#600000] border-t border-[#FFD700]/20 mt-12">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-[#F3B13B] text-lg">
                © {new Date().getFullYear()} FalconSphere. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <Link 
                  href="/help" 
                  className="text-[#F3B13B] hover:text-[#FFD700] transition-colors duration-300 relative group"
                >
                  <span className="relative">
                    Need Help?
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFD700] transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
                <Link 
                  href="/issues" 
                  className="text-[#F3B13B] hover:text-[#FFD700] transition-colors duration-300 relative group"
                >
                  <span className="relative">
                    Report Issues
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFD700] transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
