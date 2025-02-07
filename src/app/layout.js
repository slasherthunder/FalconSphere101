import { Geist, Geist_Mono } from "next/font/google";
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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FFFFFF] text-[#FFD700]`}
      >
        {/* Navbar */}
        <nav className="bg-[#600000] shadow-sm"> {/* Darker red for better contrast */}
          <div className="container mx-auto px-4 py-4 flex items-center justify-center">
            <h1 className="text-2xl font-bold text-[#FFD700]">FalconSphere</h1> {/* Gold text */}
            
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto px-5 py-8">{children}</main>

        {/* Footer */}
        <footer className="bg-[#600000] border-t border-[#FFD700] mt-8">
          <div className="container mx-auto px-4 py-6 text-center text-[#FFD700]">
            <p>&copy; {new Date().getFullYear()} FalconSphere. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}