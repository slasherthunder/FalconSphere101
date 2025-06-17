"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../components/firebase";
import { doc, onSnapshot, updateDoc, arrayRemove } from "firebase/firestore";
import { FaCrown, FaSignOutAlt } from "react-icons/fa";

export default function GameWait() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Get session code and player name from sessionStorage
    const sessionCode = sessionStorage.getItem("Session Code");
    const playerName = sessionStorage.getItem("Name");

    if (!sessionCode || !playerName) {
      router.push("/join-game");
      return;
    }

    // Subscribe to session updates
    const unsubscribe = onSnapshot(doc(db, "sessions", sessionCode),
      (doc) => {
        if (doc.exists()) {
          const sessionData = doc.data();
          setSession(sessionData);
          
          // If game has started, redirect to game page
          if (sessionData.status === "started") {
            router.push(`/game/${sessionCode}`);
          } else if (sessionData.status === "ended") {
            router.push("/");
          }
        } else {
          setError("Session not found");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching session:", error);
        setError("Error loading session");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [router]);

  const handleLeave = async () => {
    try {
      const sessionCode = sessionStorage.getItem("Session Code");
      const playerName = sessionStorage.getItem("Name");
      
      if (sessionCode && playerName) {
        const sessionRef = doc(db, "sessions", sessionCode);
        await updateDoc(sessionRef, {
          players: arrayRemove({ id: playerName, name: playerName })
        });
      }
      
      sessionStorage.removeItem("Session Code");
      sessionStorage.removeItem("Name");
      router.push("/join-game");
    } catch (error) {
      console.error("Error leaving game:", error);
      alert("Failed to leave game. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#8B0000] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-[#FFD700] rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#8B0000] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#FFD700] mb-4">Error</h2>
          <p className="text-white/80">{error}</p>
          <button
            onClick={() => router.push("/join-game")}
            className="mt-4 bg-[#FFD700] text-[#8B0000] px-6 py-2 rounded-lg hover:bg-[#FFC300] transition-colors"
          >
            Return to Join Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#8B0000] via-[#700000] to-[#600000] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header Card */}
        <motion.div
          className="bg-gradient-to-br from-[#700000]/90 to-[#600000]/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl mb-8 border border-[#FFD700]/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl text-[#FFD700] font-bold mb-6"
            >
              Waiting for the game to start...
            </motion.h1>
            <h2 className="text-2xl text-[#FFD700]/80 font-bold mb-4">
              Session Code: 
              <span className="ml-2 text-[#FFD700] tracking-wider font-mono">
                {session?.code}
              </span>
            </h2>
            {session?.selectedSet && (
              <div className="flex items-center justify-center gap-2 text-[#FFD700]/80">
                <FaCrown className="text-xl" />
                <p className="font-semibold">{session.selectedSet.title}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Players List */}
        <motion.div
          className="bg-gradient-to-br from-[#700000]/90 to-[#600000]/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl mb-8 border border-[#FFD700]/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-[#FFD700] text-2xl font-bold mb-6">Players</h3>
          <div className="space-y-4">
            <AnimatePresence>
              {session?.players?.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white/10 p-4 rounded-xl 
                    shadow-lg border border-[#FFD700]/10 hover:border-[#FFD700]/30 transition-all duration-300
                    flex justify-between items-center group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#FFD700]/60 font-mono">{index + 1}</span>
                    <h4 className="text-xl text-[#FFD700] font-semibold">{player.name}</h4>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {(!session?.players || session.players.length === 0) && (
              <p className="text-[#FFD700]/60 text-center py-4">Waiting for players to join...</p>
            )}
          </div>
        </motion.div>

        {/* Leave Game Button */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.button
            onClick={handleLeave}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-8 py-4 rounded-xl 
              font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <FaSignOutAlt /> Leave Game
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
