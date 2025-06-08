"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import { FaSpinner } from "react-icons/fa";

const socket = io("https://localhost:5001");

export default function Hello() {
  const router = useRouter();
  const [gameSessionID, setGameSessionID] = useState("");
  
  useEffect(() => {
    setGameSessionID(sessionStorage.getItem("currentGameSetID"));
    // useEffect (() => {

  //   console.log("Whats good")
  //   socket.on("ConfirmSendQuestionRequest", () => {
  //     console.log("hello")
  //     router.push("/study-set/play/" + gameSessionID)
  //   });

  //   }


  // }, [socket]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (localStorage.getItem("isNext") == "true") {
        router.push("/study-set/play/" + sessionStorage.getItem("currentGameSetID"));
        localStorage.setItem("isNext", false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <motion.div 
        className="bg-[#8B0000] p-8 rounded-lg shadow-lg text-center max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-[#FFD700] text-4xl mb-4 flex justify-center"
        >
          <FaSpinner />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-[#FFD700] mb-4">
          Waiting for Next Question
        </h1>
        
        <p className="text-[#FFD700] mb-6">
          The next question will appear shortly. Get ready!
        </p>
        
        <div className="flex justify-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#FFD700] text-[#8B0000] px-6 py-2 rounded-lg font-bold hover:bg-[#F3B13B] transition-colors duration-300"
          >
            Practice Mode
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#700000] text-[#FFD700] px-6 py-2 rounded-lg font-bold border border-[#FFD700] hover:bg-[#600000] transition-colors duration-300"
          >
            Exit Game
          </motion.button>
        </div>
        
        <div className="mt-6 text-[#FFD700] text-sm">
          <p>Session ID: {gameSessionID}</p>
        </div>
      </motion.div>
    </div>
  );
}
  
