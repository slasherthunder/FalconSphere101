"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function JoinGame() {
  const [sessionCode, setSessionCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  // Handle session code input change
  const handleSessionCodeChange = (event) => {
    setSessionCode(event.target.value);
  };

  // Handle player name input change
  const handlePlayerNameChange = (event) => {
    setPlayerName(event.target.value);
  };

  // Join the game session
  const joinGame = () => {
    if (!sessionCode) {
      alert('Please enter a session code.');
      return;
    }
    if (!playerName) {
      alert('Please enter your name.');
      return;
    }
    alert(`Joined game session with code: ${sessionCode}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-4xl mx-4 text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]"
      >
        <h1 className="text-4xl text-[#FFD700] font-bold mb-8">Join A Game</h1>

        <div className="mb-8">
          <motion.input
            type="text"
            placeholder="Enter Session Code"
            value={sessionCode}
            onChange={handleSessionCodeChange}
            className="bg-[#600000] text-[#FFD700] p-4 rounded-lg w-full max-w-xs text-center placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition transform hover:scale-105"
          />
        </div>

        <div className="mb-8">
          <motion.input
            type="text"
            placeholder="Enter Your Name"
            value={playerName}
            onChange={handlePlayerNameChange}
            className="bg-[#600000] text-[#FFD700] p-4 rounded-lg w-full max-w-xs text-center placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition transform hover:scale-105"
          />
        </div>

        <motion.button
          onClick={joinGame}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold transition duration-300"
        >
          Join Game
        </motion.button>
      </motion.div>
    </div>
  );
}
