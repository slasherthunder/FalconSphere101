"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/components/firebase";
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

const LeaderboardPage = () => {
  const { code } = useParams();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const docRef = doc(db, "game", code);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setGameData(data);
          const sortedPlayers = [...data.player].sort((a, b) => b.score - a.score);
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

  const exportToCSV = () => {
    if (!gameData) return;

    // Prepare CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add metadata
    csvContent += `Game Code,${code}\n`;
    csvContent += `Game Start Time,${gameData.startTime}\n`;
    csvContent += `Total Questions,${gameData.questions?.length || 0}\n`;
    csvContent += `Total Players,${players.length}\n\n`;

    // Add leaderboard
    csvContent += "Rank,Player Name,Score\n";
    players.forEach((player, index) => {
      csvContent += `${index + 1},${player.name},${player.score}\n`;
    });

    // Add question analytics if available
    if (gameData.questions) {
      csvContent += "\nQuestion Analytics\n";
      csvContent += "Question Number,Question Text,Correct Answer,Average Score\n";
      
      gameData.questions.forEach((question, index) => {
        const totalScore = players.reduce((sum, player) => {
          return sum + (player.questionScores?.[index] || 0);
        }, 0);
        const averageScore = players.length > 0 ? (totalScore / players.length).toFixed(2) : 0;
        
        csvContent += `${index + 1},"${question.question}","${question.correctAnswer}",${averageScore}\n`;
      });
    }

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `game_analytics_${code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-[#FFD700]">Leaderboard</h1>
          <button
            onClick={exportToCSV}
            className="bg-[#FFD700] hover:bg-[#FFC000] text-[#8B0000] font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Export Analytics
          </button>
        </div>
        
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