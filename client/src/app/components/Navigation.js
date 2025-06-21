"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaHome, FaPlus, FaGamepad, FaSignInAlt, FaLightbulb, FaUser, FaSignOutAlt, FaRobot, FaBook } from "react-icons/fa";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const router = useRouter();

  
  const [ID, setID] = useState("0")

  const randomizeID = ()  =>{
    setID(Math.floor(10000000 + Math.random() * 90000000).toString())

  };

  useEffect(() => {
      randomizeID()
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/signup");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navigationItems = [
    { href: "/", label: "Home", icon: FaHome },
    { href: "/course", label: "Courses", icon: FaBook },
    { href: "/create-set", label: "Create Sets", icon: FaPlus },
    { href: "/dynamic-page/new-test/" + ID, label: "New Game", icon: FaGamepad},
    { href: "/join-game", label: "Join Game", icon: FaSignInAlt },
    { href: "/feedview", label: "Peer Help", icon: FaLightbulb },
    { href: "/ai-integration", label: "FalconAI", icon: FaRobot },
  ];

  return (
    <>
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
              {navigationItems.map(({ href, label, icon: Icon }) => (
              <Link
                onClick={randomizeID}
                key={href}
                href={href}
                className="group flex items-center text-[#F3B13B] hover:text-[#FFD700] transition-all duration-300 relative py-2"
              >
                <Icon className="mr-2 text-lg transform group-hover:scale-110 transition-transform duration-300" />
                <span className="text-base lg:text-lg font-medium">{label}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFD700] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
              {!user && (
                <Link
                  href="/signup"
                  className="relative group"
                  title="Sign In"
                >
                  <FaUser className="text-xl text-[#F3B13B] hover:text-[#FFD700] transition-all duration-300 transform hover:scale-110" />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-[#8B0000] text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    Sign In
                  </span>
                </Link>
              )}
              {user && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-[#F3B13B]">
                    <FaUser className="mr-2 text-lg" />
                    <span className="text-base lg:text-lg font-medium">{user.email}</span>
                  </div>
                  <button
                    onClick={() => setShowConfirmPopup(true)}
                    className="relative group"
                    title="Sign Out"
                  >
                    <FaSignOutAlt className="text-xl text-[#F3B13B] hover:text-[#FFD700] transition-all duration-300 transform hover:scale-110" />
                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-[#8B0000] text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      Sign Out
                    </span>
                  </button>
                </div>
              )}
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
                  {navigationItems.map(({ href, label, icon: Icon }) => (
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
                  {!user && (
                    <Link
                      href="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center text-[#F3B13B] hover:text-[#FFD700] transition-all duration-300 py-2 px-4 rounded-lg hover:bg-[#700000]/50"
                    >
                      <FaUser className="mr-3 text-lg" />
                      <span className="text-lg font-medium">Sign In</span>
                    </Link>
                  )}
                  {user && (
                    <>
                      <div className="flex items-center text-[#F3B13B] py-2 px-4">
                        <FaUser className="mr-3 text-lg" />
                        <span className="text-lg font-medium">{user.email}</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowConfirmPopup(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center text-[#F3B13B] hover:text-[#FFD700] transition-all duration-300 py-2 px-4 rounded-lg hover:bg-[#700000]/50"
                      >
                        <FaSignOutAlt className="mr-3 text-lg" />
                        <span className="text-lg font-medium">Sign Out</span>
                      </button>
                    </>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>

      {/* Confirmation Popup */}
      <AnimatePresence>
        {showConfirmPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-br from-[#8B0000] to-[#A52A2A] p-6 rounded-xl shadow-2xl border border-[#ffffff20] max-w-sm w-full mx-4"
            >
              <h3 className="text-xl font-bold text-[#FFD700] mb-4">Confirm Sign Out</h3>
              <p className="text-[#FFD700]/80 mb-6">Are you sure you want to sign out?</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowConfirmPopup(false)}
                  className="px-4 py-2 text-[#FFD700] hover:text-white transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSignOut();
                    setShowConfirmPopup(false);
                  }}
                  className="px-4 py-2 bg-[#FFD700] text-[#8B0000] rounded-lg hover:bg-[#FFC300] transition-colors duration-300"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
} 
