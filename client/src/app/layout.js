import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";

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
            <div className="flex flex-col items-center">
              <div className="flex flex-row justify-between items-center w-full mb-4">
                <p className="text-[#F3B13B] text-base sm:text-lg">
                  © {new Date().getFullYear()} FalconSphere. All rights reserved.
                </p>
                
                <div className="flex flex-col items-center">
                  <p className="text-[#F3B13B] text-base sm:text-lg">
                    Want to help students across the district?
                  </p>
                  <p className="text-[#F3B13B] text-base sm:text-lg mt-1">
                    Join our amazing team! Just by filling out our google form.
                  </p>
                  <a 
                    href="https://docs.google.com/forms/d/1ALrU7NJ23mb58njndnHuO0MLcf0EzzW7ka47c0vstBc/edit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-6 py-2 rounded-lg font-bold hover:shadow-lg transition-all duration-300 mt-2"
                  >
                    Join Us
                  </a>
                </div>

                <div className="flex space-x-6">
                  <a 
                    href="/help" 
                    className="text-[#F3B13B] hover:text-[#FFD700] transition-colors duration-300 relative group"
                  >
                    <span className="relative">
                      Need Help?
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFD700] transition-all duration-300 group-hover:w-full"></span>
                    </span>
                  </a>
                  <a 
                    href="/issues" 
                    className="text-[#F3B13B] hover:text-[#FFD700] transition-colors duration-300 relative group"
                  >
                    <span className="relative">
                      Report Issues
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFD700] transition-all duration-300 group-hover:w-full"></span>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
