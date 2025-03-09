"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function GameWait() {
  const [players, setPlayers] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const router = useRouter();

  // Fetch players and session code from localStorage on the client side
  useEffect(() => {
    // Ensure this code runs only in the browser
    if (typeof window !== "undefined") {
      const storedPlayers = localStorage.getItem("Players") || "";
      const storedSessionCode = localStorage.getItem("Session Code") || "";
      setPlayers(storedPlayers);
      setSessionCode(storedSessionCode);

      // Update players every second
      const intervalId = setInterval(() => {
        const updatedPlayers = localStorage.getItem("Players") || "";
        setPlayers(updatedPlayers);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, []);

  // Handle leaving the game
  const handleLeave = () => {
    if (typeof window !== "undefined") {
      const playerList = players.split(",").filter(Boolean);
      const playerName = sessionStorage.getItem("Name");
      const position = playerList.indexOf(playerName);

      if (position !== -1) {
        playerList.splice(position, 1);
        localStorage.setItem("Players:", playerList.join(","));
      }

      sessionStorage.setItem("Name", "");
      router.push("/join-game");
    }
  };

  // Filter out empty strings from the player list
  const playerList = players.split(",").filter(Boolean);

  return (
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-4xl mx-4 text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]"
      >
        <h1 className="text-4xl text-[#FFD700] font-bold mb-8">
          Waiting for the game to start...
        </h1>

        {/* Session Code Display */}
        <div className="mb-8">
          <h2 className="text-2xl text-[#FFD700] font-bold">
            Session Code:{" "}
            <span className="text-white">{sessionCode}</span>
          </h2>
        </div>

        {/* Player List */}
        <div className="mb-8">
          <h2 className="text-2xl text-[#FFD700] font-bold mb-4">Players</h2>
          <div className="space-y-4">
            {playerList.map((name, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-[#600000] p-4 rounded-lg shadow-md flex justify-between items-center"
              >
                <p className="text-2xl text-[#FFD700] font-semibold">{name}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Leave Game Button */}
        <motion.button
          onClick={handleLeave}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold transition duration-300"
        >
          Leave Game
        </motion.button>
      </motion.div>
    </div>
  );
}
