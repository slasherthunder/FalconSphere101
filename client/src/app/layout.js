import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "../components/Navigation";

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
        <Navigation />
        <main className="min-h-screen">{children}</main>
        <footer className="bg-gradient-to-r from-[#8B0000] to-[#600000] border-t border-[#FFD700]/20 mt-8 sm:mt-12">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-[#F3B13B] text-base sm:text-lg text-center md:text-left">
                © {new Date().getFullYear()} FalconSphere. All rights reserved.
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-6">
                <a 
                  href="/help" 
                  className="text-[#F3B13B] hover:text-[#FFD700] transition-colors duration-300 relative group text-center sm:text-left"
                >
                  <span className="relative">
                    Need Help?
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFD700] transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </a>
                <a 
                  href="/issues" 
                  className="text-[#F3B13B] hover:text-[#FFD700] transition-colors duration-300 relative group text-center sm:text-left"
                >
                  <span className="relative">
                    Report Issues
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFD700] transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
