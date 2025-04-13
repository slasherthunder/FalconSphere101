"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../../../components/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

// Framer Motion variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

useEffect(() => {
  setTimeout(() => {
     setTimer(timer -1);
     if(timer == 1){
      router.push("/./wait-for-next-question")
    }
  }, 1000);  }, [timer])

const LeaderboardPage = () => {
  const { code } = useParams();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const docRef = doc(db, "game", code);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const gameData = docSnap.data();
          const sortedPlayers = [...gameData.player].sort((a, b) => b.score - a.score);
          setPlayers(sortedPlayers);
        } else {
          console.log("No such game document!");
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#8B0000]">
        <p className="text-[#FFD700] text-2xl">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#8B0000] to-[#600000] p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto bg-[#700000]/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-[#ffffff20]"
      >
        <h1 className="text-4xl font-bold text-center text-[#FFD700] mb-6">Leaderboard</h1>
        <div className="space-y-4">
          {players.map((player, index) => (
            <motion.div
              key={player.name}
              className="flex justify-between items-center px-6 py-4 bg-[#500000]/80 rounded-xl shadow-md border border-[#FFD700]/30"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-[#FFD700] text-xl font-semibold">
                #{index + 1} {player.name}
              </span>
              <span className="text-[#FFD700] text-xl font-bold">{player.score}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default LeaderboardPage;
