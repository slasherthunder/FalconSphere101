"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaSignInAlt, FaIdCard, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../components/firebase";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const formVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: 0.2
    }
  }
};

const buttonVariants = {
  hover: {
    scale: 1.05,
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400
    }
  },
  tap: { scale: 0.95 }
};

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    studentId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Sign in with Firebase using email and password
      await signInWithEmailAndPassword(auth, formData.email, formData.studentId);
      
      // Redirect to home page on successful sign in
      router.push("/");
    } catch (err) {
      console.error("Sign in error:", err);
      let errorMessage = "Failed to sign in. Please check your email and password.";
      
      // Handle specific Firebase error codes
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = "Invalid email format.";
          break;
        case 'auth/user-not-found':
          errorMessage = "No account found with this email.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        default:
          errorMessage = "An error occurred during sign in.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetStatus("");
    setError("");

    if (!resetEmail) {
      setError("Please enter your email address");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetStatus("Password reset email sent! Please check your inbox.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (err) {
      console.error("Password reset error:", err);
      let errorMessage = "Failed to send reset email.";
      
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = "Invalid email format.";
          break;
        case 'auth/user-not-found':
          errorMessage = "No account found with this email.";
          break;
        default:
          errorMessage = "An error occurred while sending reset email.";
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto"
      >
        <motion.div 
          className="bg-gradient-to-br from-[#8B0000] to-[#A52A2A] p-8 rounded-2xl shadow-2xl border border-[#ffffff20] overflow-hidden"
          whileHover={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-8">
            <motion.h1 
              className="text-4xl font-bold text-[#FFD700] mb-2 tracking-wide"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {showForgotPassword ? "Reset Password" : "Welcome Back"}
            </motion.h1>
            <p className="text-[#FFD700]/80">
              {showForgotPassword 
                ? "Enter your email to reset your password" 
                : "Sign in to your FalconSphere account"}
            </p>
          </div>

          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-600/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg flex items-start gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>{error}</div>
              </motion.div>
            )}

            {resetStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-600/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg flex items-start gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>{resetStatus}</div>
              </motion.div>
            )}

            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">School Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-[#FFD700]/70" />
                    </div>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-3 border-2 rounded-xl bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300"
                      placeholder="Enter your school email"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 bg-[#700000] text-[#FFD700] px-8 py-4 rounded-xl font-bold text-xl hover:bg-[#FFD700] hover:text-[#8B0000] transition-all duration-300"
                  >
                    Back to Sign In
                  </motion.button>

                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl hover:shadow-xl transition-all duration-300 shadow-lg"
                  >
                    Send Reset Link
                  </motion.button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">School Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-[#FFD700]/70" />
                    </div>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-3 border-2 rounded-xl bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300"
                      placeholder="Enter your school email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-[#FFD700] text-lg font-medium tracking-wide">Student ID</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[#FFD700]/80 hover:text-[#FFD700] text-sm transition-colors duration-200"
                    >
                      Forgot Student ID?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaIdCard className="text-[#FFD700]/70" />
                    </div>
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type={showPassword ? "text" : "password"}
                      name="studentId"
                      required
                      value={formData.studentId}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 border-2 rounded-xl bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300"
                      placeholder="Enter your student ID"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#FFD700]/70 hover:text-[#FFD700] transition-colors duration-200"
                    >
                      {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl hover:shadow-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#8B0000]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FaSignInAlt className="mr-2" />
                      Sign In
                    </span>
                  )}
                </motion.button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#FFD700]/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gradient-to-br from-[#8B0000] to-[#A52A2A] text-[#FFD700]/80">or</span>
                  </div>
                </div>

                <motion.a
                  href="https://docs.google.com/forms/d/1ALrU7NJ23mb58njndnHuO0MLcf0EzzW7ka47c0vstBc/edit"
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="w-full bg-[#700000] text-[#FFD700] px-8 py-4 rounded-xl font-bold text-xl hover:bg-[#FFD700] hover:text-[#8B0000] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Join Us as a Tutor
                </motion.a>
              </form>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
} 
