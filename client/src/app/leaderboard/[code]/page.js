"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/components/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { connect } from "socket.io-client";

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
  const [showDetails, setShowDetails] = useState({});

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const docRef = doc(db, "game", code);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setGameData(data);
          const sortedPlayers = [...data.players].sort((a, b) => b.correctAnswers - a.correctAnswers);
          setPlayers(sortedPlayers);
          
          // Initialize showDetails state
          const detailsState = {};
          sortedPlayers.forEach(player => {
            detailsState[player.name] = false;
          });
          setShowDetails(detailsState);
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

  const togglePlayerDetails = (playerName) => {
    setShowDetails(prev => ({
      ...prev,
      [playerName]: !prev[playerName]
    }));
  };

  const calculateQuestionStats = (questionIndex) => {
    if (!players.length || !gameData?.questions?.[questionIndex]) return {};
    
    const question = gameData.questions[questionIndex];
    const totalPlayers = players.length;
    let correctCount = 0;
    let totalScore = 0;
    const answerDistribution = {};
    
    // Initialize answer distribution
    question.options.forEach(opt => {
      answerDistribution[opt] = 0;
    });
    
    players.forEach(player => {
      const playerAnswer = player.answers?.[questionIndex];
      const playerScore = player.questionScores?.[questionIndex] || 0;
      
      totalScore += playerScore;
      
      if (playerScore > 0) {
        correctCount++;
      }
      
      if (playerAnswer) {
        answerDistribution[playerAnswer] = (answerDistribution[playerAnswer] || 0) + 1;
      }
    });
    
    return {
      correctCount,
      incorrectCount: totalPlayers - correctCount,
      averageScore: (totalScore / totalPlayers).toFixed(2),
      answerDistribution
    };
  };

  const exportToCSV = () => {
    if (!gameData) return;

    let csvContent = "data:text/csv;charset=utf-8,";

    // Game metadata
    csvContent += `Game Code,${code}\n`;
    csvContent += `Game Start Time,${gameData.startTime}\n`;
    csvContent += `Total Questions,${gameData.questions?.length || 0}\n`;
    csvContent += `Total Players,${players.length}\n\n`;

    // Main leaderboard
    csvContent += "Rank,Player Name,Score,Correct Answers,Wrong Answers,Accuracy\n";
    players.forEach((player, index) => {
      const correctAnswers = player.questionScores?.reduce((count, score) => score > 0 ? count + 1 : count, 0) || 0;
      const totalQuestions = gameData.questions?.length || 1;
      const accuracy = ((correctAnswers / totalQuestions) * 100).toFixed(2);
      
      csvContent += `${index + 1},${player.name},${player.score},${correctAnswers},${totalQuestions - correctAnswers},${accuracy}%\n`;
    });

    // Detailed player performance
    csvContent += "\nPlayer Detailed Performance\n";
    players.forEach((player, playerIndex) => {
      csvContent += `\nPlayer ${playerIndex + 1}: ${player.name}\n`;
      csvContent += "Question,Player Answer,Correct Answer,Score,Correct\n";
      
      gameData.questions?.forEach((question, qIndex) => {
        const playerAnswer = player.answers?.[qIndex] || "N/A";
        const correctAnswer = question.correctAnswer;
        const score = player.questionScores?.[qIndex] || 0;
        const isCorrect = score > 0 ? "Yes" : "No";
        
        csvContent += `${qIndex + 1},"${playerAnswer}","${correctAnswer}",${score},${isCorrect}\n`;
      });
    });

    // Question analytics
    if (gameData.questions) {
      csvContent += "\nQuestion Analytics\n";
      csvContent += "Question Number,Question Text,Correct Answer,% Correct,Average Score,Answer Distribution\n";
      
      gameData.questions.forEach((question, index) => {
        const stats = calculateQuestionStats(index);
        const answerDist = Object.entries(stats.answerDistribution || {})
          .map(([ans, count]) => `${ans}: ${count} (${((count / players.length) * 100).toFixed(1)}%)`)
          .join("; ");
        
        csvContent += `${index + 1},"${question.question}","${question.correctAnswer}",${((stats.correctCount / players.length) * 100).toFixed(2)}%,${stats.averageScore},"${answerDist}"\n`;
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
    <div className="min-h-screen bg-gradient-to-b from-[#8B0000] to-[#600000] p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto bg-[#700000]/90 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-2xl border border-[#ffffff20]"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[#FFD700]">Leaderboard</h1>
        </div>
        
        <div className="space-y-4">
          {players.map((player, index) => {
            const correctAnswers = player.questionScores?.reduce((count, score) => score > 0 ? count + 1 : count, 0) || 0;
            const totalQuestions = player.currentSlide;
            const accuracy = ((player.correctAnswers / totalQuestions) * 100).toFixed(1);
            
            return (
              <div key={player.name} className="rounded-xl overflow-hidden shadow-md border border-[#FFD700]/30">
                <motion.div
                  className="flex justify-between items-center px-4 md:px-6 py-4 bg-[#500000]/80 cursor-pointer"
                  whileHover={{ scale: 1.01 }}
                  onClick={() => togglePlayerDetails(player.name)}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[#FFD700] text-lg md:text-xl font-bold w-8 text-center">#{index + 1}</span>
                    <span className="text-[#FFD700] text-lg md:text-xl font-semibold">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <span className="text-[#FFD700] text-sm block">Score</span>
                      <span className="text-[#FFD700] text-lg md:text-xl font-bold">{player.correctAnswers}</span>
                    </div>
                    <div className="text-center hidden sm:block">
                      <span className="text-[#FFD700] text-sm block">Accuracy</span>
                      <span className="text-[#FFD700] text-lg md:text-xl font-bold">{accuracy}%</span>
                    </div>
                    <div className="text-center hidden sm:block">
                      <span className="text-[#FFD700] text-sm block">Correct</span>
                      <span className="text-[#FFD700] text-lg md:text-xl font-bold">{player.correctAnswers}/{totalQuestions}</span>
                    </div>
                    <div className="text-[#FFD700] text-xl">
                      {showDetails[player.name] ? '−' : '+'}
                    </div>
                  </div>
                </motion.div>
                
                {showDetails[player.name] && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#400000]/70 overflow-hidden"
                  >
                    <div className="p-4 md:p-6">
                      <h3 className="text-[#FFD700] font-bold mb-3 text-lg">Question-by-Question Performance</h3>
                      <div className="grid gap-4">
                        {gameData.questions?.map((question, qIndex) => {
                          const playerAnswer = player.answers?.[qIndex] || "No answer";
                          const isCorrect = (player.questionScores?.[qIndex] || 0) > 0;
                          const score = player.questionScores?.[qIndex] || 0;
                          
                          return (
                            <div key={qIndex} className="bg-[#300000]/50 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-[#FFD700] font-semibold">Q{qIndex + 1}: {question.question}</p>
                                  <p className="text-[#FFAAAA]">Your answer: {playerAnswer}</p>
                                  <p className="text-[#AAFFAA]">Correct answer: {question.correctAnswer}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full ${isCorrect ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
                                  {isCorrect ? 'Correct' : 'Incorrect'}
                                </div>
                              </div>
                              <p className="text-[#FFD700] mt-1">Points earned: {score}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
        
        {gameData?.questions && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-[#FFD700] mb-6">Question Statistics</h2>
            <div className="space-y-6">
              {gameData.questions.map((question, index) => {
                const stats = calculateQuestionStats(index);
                
                return (
                  <div key={index} className="bg-[#500000]/80 p-4 md:p-6 rounded-xl shadow-md border border-[#FFD700]/30">
                    <h3 className="text-[#FFD700] font-bold text-lg mb-2">Q{index + 1}: {question.question}</h3>
                    <p className="text-[#AAFFAA] mb-3">Correct answer: {question.correctAnswer}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[#FFD700]">
                      <div className="bg-[#400000]/50 p-3 rounded-lg">
                        <p className="font-semibold">Correct Answers</p>
                        <p>{stats.correctCount} ({((stats.correctCount / players.length) * 100).toFixed(1)}%)</p>
                      </div>
                      <div className="bg-[#400000]/50 p-3 rounded-lg">
                        <p className="font-semibold">Average Score</p>
                        <p>{stats.averageScore}</p>
                      </div>
                      <div className="bg-[#400000]/50 p-3 rounded-lg">
                        <p className="font-semibold">Answer Distribution</p>
                        <div className="mt-1 space-y-1">
                          {Object.entries(stats.answerDistribution || {}).map(([answer, count]) => (
                            <div key={answer} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#FFD700]"></div>
                              <span>{answer}: {count} ({(count / players.length * 100).toFixed(1)}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LeaderboardPage;