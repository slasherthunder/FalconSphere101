"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FaExclamationTriangle } from 'react-icons/fa';

// Bad words list and filtering functions
const badWords = [
  // Common inappropriate words
  'fuck', 'shit', 'ass', 'bitch', 'dick', 'pussy', 'cock', 'cunt', 'whore',
  // Racial slurs
  'nigger', 'nigga', 'chink', 'spic', 'wetback', 'beaner', 'kike', 'gook',
  // Offensive terms
  'faggot', 'fag', 'dyke', 'retard', 'tard', 'nazi',
  // Variations and l33t speak
  'f*ck', 'sh*t', 'b!tch', 'd!ck', 'p*ssy', 'c*ck', 'c*nt',
  'f**k', 's**t', 'b**ch', 'd**k', 'p**sy',
  'fu*k', 'sh!t', 'b!tch', 'd!ck', 'pu$$y',
];

// Helper function to normalize text for comparison
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\d/g, '')      // Remove numbers
    .replace(/\s+/g, '');    // Remove spaces
};

// Check if text contains any bad words
const containsBadWord = (text) => {
  if (!text) return false;
  
  const normalizedText = normalizeText(text);
  
  // Check for exact matches and partial matches
  return badWords.some(word => {
    const normalizedWord = normalizeText(word);
    return normalizedText.includes(normalizedWord);
  });
};

export default function JoinGame() {
  const [sessionCode, setSessionCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();
  const [activeSessionCode, setActiveSessionCode] = useState("");
  const [players, setPlayers] = useState(localStorage.getItem("Players"));

  // Handle session code input change
  const handleSessionCodeChange = (event) => {
    setSessionCode(event.target.value);
    setError('');
  };

  // Handle player name input change with debounce
  const handlePlayerNameChange = (event) => {
    const newName = event.target.value;
    setPlayerName(newName);
    setIsValidating(true);
    
    // Clear previous error
    setError('');
    
    // Debounce validation to avoid too many checks while typing
    setTimeout(() => {
      if (containsBadWord(newName)) {
        setError('Your name contains inappropriate content. Please choose another name.');
        setIsValidating(false);
      } else {
        setIsValidating(false);
      }
    }, 300);
  };

  // Join the game session
  const joinGame = () => {
    // Validate inputs
    if (!sessionCode.trim()) {
      setError('Please enter a session code.');
      return;
    }
    if (!playerName.trim()) {
      setError('Please enter your name.');
      return;
    }

    // Final validation for inappropriate content
    if (containsBadWord(playerName)) {
      setError('Your name contains inappropriate content. Please choose another name.');
      return;
    }

    // Validate session code
    setActiveSessionCode(localStorage.getItem("Session Code"));
    if (sessionCode !== activeSessionCode) {
      setError("No sessions exist with that code");
      return;
    }

    // All validations passed, proceed with joining
    router.push(`/game-wait`);
    setSavedValues(playerName);
  };

  const setSavedValues = (name) => {
    setPlayers([players, name]);
    sessionStorage.setItem("Name", name);
  };

  useEffect(() => {
    localStorage.setItem("Players", players);
  }, [players]);

  return (
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-4xl mx-4 text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]"
      >
        <h1 className="text-4xl text-[#FFD700] font-bold mb-8">Join A Game</h1>

        {/* Session Code Input */}
        <div className="mb-6">
          <motion.input
            type="text"
            placeholder="Enter Session Code"
            value={sessionCode}
            onChange={handleSessionCodeChange}
            className="bg-[#600000] text-[#FFD700] p-4 rounded-lg w-full max-w-xs text-center placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition transform hover:scale-105"
          />
        </div>

        {/* Player Name Input */}
        <div className="mb-6 relative">
          <motion.input
            type="text"
            placeholder="Enter Your Name"
            value={playerName}
            onChange={handlePlayerNameChange}
            className={`bg-[#600000] text-[#FFD700] p-4 rounded-lg w-full max-w-xs text-center placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition transform hover:scale-105 ${
              error && error.includes('inappropriate') ? 'ring-2 ring-red-500' : ''
            }`}
          />
          {isValidating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#FFD700]"
            >
              <div className="animate-spin h-5 w-5 border-2 border-[#FFD700] rounded-full border-t-transparent"/>
            </motion.div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center gap-2 text-[#FF5252] mb-4"
          >
            <FaExclamationTriangle />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Join Game Button */}
        <motion.button
          onClick={joinGame}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={isValidating || error}
          className={`bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold transition duration-300
            ${(isValidating || error) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#FFC300]'}`}
        >
          Join Game
        </motion.button>
      </motion.div>
    </div>
  );
}
