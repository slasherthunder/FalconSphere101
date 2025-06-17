"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../components/firebase";
import { collection, getDocs, doc, setDoc, addDoc } from "firebase/firestore";
import { FaCopy, FaRedo, FaPlay, FaTrash, FaEdit, FaCrown } from "react-icons/fa";
import { useRouter } from 'next/navigation';

import {io} from "socket.io-client";
const socket = io("http://localhost:5001");

export default function NewGame() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState("");
  const [players, setPlayers] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [availableSets, setAvailableSets] = useState([]);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  // Fetch all sets from Firestore
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "sets"));
        const sets = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAvailableSets(sets);
      } catch (error) {
        console.error("Error fetching sets: ", error);
      }
    };

    fetchSets();
  }, []);





  // Generate a random session code and save it to Firestore
  const generateRandomCode = () => {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    setSessionCode(code);
    localStorage.setItem("Session Code", code);
    const sessionRef = doc(db, "sessions", code);
    setDoc(sessionRef, { code, players: [], selectedSet: null }, { merge: true })
      .then(() => console.log("Session created in Firestore"))
      .catch((error) => console.error("Error creating session: ", error));
  };

  useEffect(() => {
    generateRandomCode();
    socket.emit("Send_message", {message: "If you see this, WWWWW"})
  }, []);

  useEffect(() => {
    socket.on("SendID", (data) => {
  });
}, [socket]);



  // useEffect(() => {

  // }, [socket])

  // Copy session code to clipboard with visual feedback
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionCode);
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  };

  // Handle set selection and save it to Firestore
  const handleSetSelection = async (setId) => {
    const selected = availableSets.find((set) => set.id === setId);
    if (selected) {
      setSelectedSet(selected);
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { selectedSet: selected }, { merge: true });
    }
  };

  // Remove a player from the session
  const removePlayer = async (id) => {
    if (window.confirm("Are you sure you want to remove this player?")) {
      const updatedPlayers = players.filter((player) => player.id !== id);
      setPlayers(updatedPlayers);
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { players: updatedPlayers }, { merge: true });
    }
  };

  // Edit a player's name
  const editPlayerName = async (id) => {
    const newName = prompt("Enter the new name:");
    if (newName) {
      const updatedPlayers = players.map((player) =>
        player.id === id ? { ...player, name: newName } : player
      );
      setPlayers(updatedPlayers);
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { players: updatedPlayers }, { merge: true });
    }
  };

  // Reset the session
  const resetSession = async () => {
    if (window.confirm("Are you sure you want to reset the session?")) {
      setPlayers([]);
      setSelectedSet(null);
      generateRandomCode();
      const sessionRef = doc(db, "sessions", sessionCode);
      await setDoc(sessionRef, { players: [], selectedSet: null }, { merge: true });
    }
  };

  // Start the game with validation
  const startGame = async () => {
    if (!selectedSet) {
      alert("Please select a set to start the game.");
      return;
    }

    // Update session status in Firestore
    const sessionRef = doc(db, "sessions", sessionCode);
    await setDoc(sessionRef, { 
      status: "started",
      startTime: new Date().toISOString()
    }, { merge: true });

    // Navigate to host view
    router.push(`/host-view/${sessionCode}`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        {/* Session Code Card */}
        <motion.div
          className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 sm:p-10 rounded-3xl shadow-2xl mb-8 border border-[#FFD700]/20 relative overflow-hidden"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 to-transparent opacity-50"></div>
          <div className="relative flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-[#FFD700]/80 text-lg mb-3 tracking-wider uppercase font-medium">Session Code</h3>
              <h2 className="text-5xl sm:text-6xl font-bold text-[#FFD700] tracking-wider font-mono bg-[#700000]/30 px-6 py-3 rounded-xl">
                {sessionCode}
              </h2>
            </div>
            <motion.button
              onClick={copyToClipboard}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#FFD700] to-[#F3B13B] text-[#8B0000] px-8 py-4 rounded-xl 
                font-bold shadow-lg hover:shadow-xl flex items-center gap-3 transition-all duration-300
                hover:from-[#F3B13B] hover:to-[#FFD700]"
            >
              <FaCopy className="text-lg" /> Copy Code
            </motion.button>
          </div>
          <AnimatePresence>
            {showCopiedMessage && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[#FFD700]/90 text-sm mt-4 font-medium"
              >
                Code copied to clipboard!
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Set Selection Card */}
        <motion.div
          className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 sm:p-10 rounded-3xl shadow-2xl mb-8 border border-[#FFD700]/20 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 to-transparent opacity-50"></div>
          <div className="relative">
            <h3 className="text-[#FFD700] text-2xl font-bold mb-6 tracking-wide">Select a Study Set</h3>
            <select
              onChange={(e) => handleSetSelection(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] border border-[#FFD700]/20 
                focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all duration-300
                hover:border-[#FFD700]/40 shadow-lg text-lg"
            >
              <option value="">Choose a set</option>
              {availableSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.title}
                </option>
              ))}
            </select>
            {selectedSet && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-5 bg-[#700000]/80 backdrop-blur-sm rounded-xl border border-[#FFD700]/20 shadow-lg"
              >
                <div className="flex items-center gap-3 text-[#FFD700]">
                  <FaCrown className="text-2xl text-[#F3B13B]" />
                  <p className="font-semibold text-lg">{selectedSet.title}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Players List Card */}
        <motion.div
          className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 sm:p-10 rounded-3xl shadow-2xl mb-8 border border-[#FFD700]/20 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 to-transparent opacity-50"></div>
          <div className="relative">
            <h3 className="text-[#FFD700] text-2xl font-bold mb-6 tracking-wide">Players</h3>
            <div className="space-y-4">
              <AnimatePresence>
                {players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#700000]/80 backdrop-blur-sm p-5 rounded-xl 
                      shadow-lg border border-[#FFD700]/10 hover:border-[#FFD700]/30 transition-all duration-300
                      flex justify-between items-center group hover:bg-[#700000]/90"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[#FFD700]/60 font-mono text-lg bg-[#600000] px-3 py-1 rounded-lg">{index + 1}</span>
                      <h4 className="text-xl text-[#FFD700] font-semibold">{player.name}</h4>
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => editPlayerName(player.id)}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-[#FFD700] hover:text-[#F3B13B] p-2 transition-all duration-300 bg-[#600000]/50 rounded-lg"
                      >
                        <FaEdit className="text-lg" />
                      </motion.button>
                      <motion.button
                        onClick={() => removePlayer(player.id)}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-[#FFD700] hover:text-red-500 p-2 transition-all duration-300 bg-[#600000]/50 rounded-lg"
                      >
                        <FaTrash className="text-lg" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.button
            onClick={resetSession}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-[#FFD700] to-[#F3B13B] text-[#8B0000] px-8 py-4 rounded-xl 
              font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transition-all duration-300
              hover:from-[#F3B13B] hover:to-[#FFD700] text-lg"
          >
            <FaRedo className="text-xl" /> Reset Session
          </motion.button>
          <motion.button
            onClick={startGame}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-[#FFD700] to-[#F3B13B] text-[#8B0000] px-10 py-4 rounded-xl 
              font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transition-all duration-300
              hover:from-[#F3B13B] hover:to-[#FFD700] text-lg"
          >
            <FaPlay className="text-xl" /> Start Game
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
