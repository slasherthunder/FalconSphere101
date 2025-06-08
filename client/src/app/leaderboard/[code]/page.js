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
    const interval = setInterval(() => {
      console.log("This runs every second");
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
    }, 1000); // 1000 ms = 1 second
  
    // Cleanup to avoid memory leaks
    return () => clearInterval(interval);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-gray-100">
        <div className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 rounded-3xl shadow-2xl border border-[#FFD700]/20">
          <p className="text-[#FFD700] text-2xl font-medium tracking-wide">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto bg-gradient-to-br from-[#8B0000] to-[#700000] p-6 md:p-10 rounded-3xl shadow-2xl border border-[#FFD700]/20 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 to-transparent opacity-50"></div>
        <div className="relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-[#FFD700] tracking-wide">Leaderboard</h1>
            <motion.button
              onClick={exportToCSV}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#FFD700] to-[#F3B13B] text-[#8B0000] px-6 py-3 rounded-xl 
                font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-300
                hover:from-[#F3B13B] hover:to-[#FFD700]"
            >
              Export Results
            </motion.button>
          </div>
          
          <div className="space-y-4">
            {players.map((player, index) => {
              const correctAnswers = player.questionScores?.reduce((count, score) => score > 0 ? count + 1 : count, 0) || 0;
              const totalQuestions = player.currentSlide;
              const accuracy = ((player.correctAnswers / totalQuestions) * 100).toFixed(1);
              
              return (
                <div key={player.name} className="rounded-2xl overflow-hidden shadow-lg border border-[#FFD700]/20 bg-[#700000]/50 backdrop-blur-sm">
                  <motion.div
                    className="flex justify-between items-center px-6 py-5 cursor-pointer hover:bg-[#700000]/70 transition-colors duration-300"
                    whileHover={{ scale: 1.01 }}
                    onClick={() => togglePlayerDetails(player.name)}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[#FFD700] text-xl md:text-2xl font-bold w-10 text-center bg-[#600000] px-3 py-1 rounded-lg">#{index + 1}</span>
                      <span className="text-[#FFD700] text-xl md:text-2xl font-semibold tracking-wide">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <span className="text-[#FFD700]/80 text-sm block mb-1">Score</span>
                        <span className="text-[#FFD700] text-xl md:text-2xl font-bold">{player.correctAnswers}</span>
                      </div>
                      <div className="text-center hidden sm:block">
                        <span className="text-[#FFD700]/80 text-sm block mb-1">Accuracy</span>
                        <span className="text-[#FFD700] text-xl md:text-2xl font-bold">{accuracy}%</span>
                      </div>
                      <div className="text-center hidden sm:block">
                        <span className="text-[#FFD700]/80 text-sm block mb-1">Correct</span>
                        <span className="text-[#FFD700] text-xl md:text-2xl font-bold">{player.correctAnswers}/{totalQuestions}</span>
                      </div>
                      <div className="text-[#FFD700] text-2xl font-bold">
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
                      className="bg-[#600000]/50 overflow-hidden"
                    >
                      <div className="p-6">
                        <h3 className="text-[#FFD700] font-bold mb-4 text-xl tracking-wide">Question-by-Question Performance</h3>
                        <div className="grid gap-4">
                          {gameData.questions?.map((question, qIndex) => {
                            const playerAnswer = player.answers?.[qIndex] || "No answer";
                            const isCorrect = (player.questionScores?.[qIndex] || 0) > 0;
                            const score = player.questionScores?.[qIndex] || 0;
                            
                            return (
                              <div key={qIndex} className="bg-[#500000]/50 p-4 rounded-xl border border-[#FFD700]/10">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1">
                                    <p className="text-[#FFD700] font-semibold text-lg mb-2">Q{qIndex + 1}: {question.question}</p>
                                    <p className="text-[#FFAAAA] mb-1">Your answer: {playerAnswer}</p>
                                    <p className="text-[#AAFFAA]">Correct answer: {question.correctAnswer}</p>
                                  </div>
                                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${isCorrect ? 'bg-green-800/50 text-green-100' : 'bg-red-800/50 text-red-100'}`}>
                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                  </div>
                                </div>
                                <p className="text-[#FFD700] mt-3 font-medium">Points earned: {score}</p>
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
              <h2 className="text-2xl font-bold text-[#FFD700] mb-8 tracking-wide">Question Statistics</h2>
              <div className="space-y-6">
                {gameData.questions.map((question, index) => {
                  const stats = calculateQuestionStats(index);
                  
                  return (
                    <div key={index} className="bg-[#600000]/50 p-6 rounded-2xl shadow-lg border border-[#FFD700]/20">
                      <h3 className="text-[#FFD700] font-bold text-xl mb-3 tracking-wide">Q{index + 1}: {question.question}</h3>
                      <p className="text-[#AAFFAA] mb-4">Correct answer: {question.correctAnswer}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[#FFD700]">
                        <div className="bg-[#500000]/50 p-4 rounded-xl border border-[#FFD700]/10">
                          <p className="font-semibold mb-2">Correct Answers</p>
                          <p className="text-xl">{stats.correctCount} ({((stats.correctCount / players.length) * 100).toFixed(1)}%)</p>
                        </div>
                        <div className="bg-[#500000]/50 p-4 rounded-xl border border-[#FFD700]/10">
                          <p className="font-semibold mb-2">Average Score</p>
                          <p className="text-xl">{stats.averageScore}</p>
                        </div>
                        <div className="bg-[#500000]/50 p-4 rounded-xl border border-[#FFD700]/10">
                          <p className="font-semibold mb-2">Answer Distribution</p>
                          <div className="mt-2 space-y-2">
                            {Object.entries(stats.answerDistribution || {}).map(([answer, count]) => (
                              <div key={answer} className="flex items-center gap-3">
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
        </div>
      </motion.div>
    </div>
  );
};

export default LeaderboardPage;