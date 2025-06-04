"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaHome, FaPlus, FaGamepad, FaSignInAlt, FaLightbulb } from "react-icons/fa";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-[#8B0000] to-[#600000] shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F3B13B] hover:text-[#FFD700] transition-all duration-300 transform hover:scale-105">
              FalconSphere
            </h1>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {[
              { href: "/", label: "Home", icon: FaHome },
              { href: "/create-set", label: "Create Sets", icon: FaPlus },
              { href: "/new-game", label: "New Game", icon: FaGamepad },
              { href: "/join-game", label: "Join Game", icon: FaSignInAlt },
              { href: "/feedview", label: "Peer Help", icon: FaLightbulb },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center text-[#F3B13B] hover:text-[#FFD700] transition-all duration-300 relative py-2"
              >
                <Icon className="mr-2 text-lg transform group-hover:scale-110 transition-transform duration-300" />
                <span className="text-base lg:text-lg font-medium">{label}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFD700] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-[#F3B13B] hover:text-[#FFD700] transition-colors p-2"
            aria-label="Toggle mobile menu"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-3">
                {[
                  { href: "/", label: "Home", icon: FaHome },
                  { href: "/create-set", label: "Create Sets", icon: FaPlus },
                  { href: "/new-game", label: "New Game", icon: FaGamepad },
                  { href: "/join-game", label: "Join Game", icon: FaSignInAlt },
                  { href: "/feedview", label: "Peer Help", icon: FaLightbulb },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center text-[#F3B13B] hover:text-[#FFD700] transition-all duration-300 py-2 px-4 rounded-lg hover:bg-[#700000]/50"
                  >
                    <Icon className="mr-3 text-lg" />
                    <span className="text-lg font-medium">{label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
} 