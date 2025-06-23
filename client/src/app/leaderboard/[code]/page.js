"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/app/components/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { connect } from "socket.io-client";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

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
        const sortedPlayers = [...data.players].sort(
          (a, b) => b.correctAnswers - a.correctAnswers
        );
        setPlayers(sortedPlayers);

        // ✅ Only initialize `showDetails` if it's still empty
        setShowDetails(prev => {
          if (Object.keys(prev).length === 0) {
            const detailsState = {};
            sortedPlayers.forEach(player => {
              detailsState[player.name] = false;
            });
            return detailsState;
          }
          return prev;
        });
      } else {
        console.log("No such game document!");
      }
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const interval = setInterval(fetchLeaderboard, 1000);
  return () => clearInterval(interval);
}, [code]);

  const togglePlayerDetails = (playerName) => {
    setShowDetails((prev) => ({
      ...prev,
      [playerName]: !prev[playerName],
    }));
  };

  const calculateQuestionStats = (questionIndex) => {
    if (!players.length || !gameData?.questions?.[questionIndex]) return {};

    const question = gameData.questions[questionIndex];
    const totalPlayers = players.length;
    let correctCount = 0;
    let totalScore = 0;
    const answerDistribution = {};

    question.options.forEach((opt) => {
      answerDistribution[opt] = 0;
    });

    players.forEach((player) => {
      const playerAnswer = player.answers?.[questionIndex];
      const playerScore = player.questionScores?.[questionIndex] || 0;

      totalScore += playerScore;
      if (playerScore > 0) correctCount++;

      if (playerAnswer) {
        answerDistribution[playerAnswer] =
          (answerDistribution[playerAnswer] || 0) + 1;
      }
    });

    return {
      correctCount,
      incorrectCount: totalPlayers - correctCount,
      averageScore: (totalScore / totalPlayers).toFixed(2),
      answerDistribution,
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
            // Use currentSlide as total questions answered by this player
            const totalQuestions = player.currentSlide || 0;
            const correctAnswers = Math.min(
              player.questionResults?.filter(Boolean).length || 0,
              totalQuestions
            );
            const incorrectAnswers = totalQuestions - correctAnswers;
            const accuracy = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : '0';

            const pieData = {
              labels: ['Correct', 'Incorrect'],
              datasets: [{
                data: [correctAnswers, incorrectAnswers],
                backgroundColor: ['#34d399', '#f87171'],
                borderColor: ['#059669', '#b91c1c'],
                borderWidth: 2,
                hoverOffset: 8,
              }],
            };

            const pieOptions = {
              plugins: {
                legend: {
                  display: true,
                  position: 'bottom',
                  labels: {
                    color: '#FFD700',
                    font: { size: 16, family: 'inherit', weight: 'bold' },
                    padding: 20,
                  },
                },
                tooltip: {
                  backgroundColor: '#222',
                  titleColor: '#FFD700',
                  bodyColor: '#FFD700',
                  borderColor: '#FFD700',
                  borderWidth: 1,
                },
              },
              cutout: '65%',
              responsive: true,
              maintainAspectRatio: false,
            };

            return (
              <div key={player.name} className="rounded-2xl overflow-hidden shadow-2xl border border-[#FFD700]/40 mb-12 bg-gradient-to-br from-[#2d0909] to-[#3a0d0d] hover:shadow-yellow-400/30 transition-shadow duration-300">
                <motion.div
                  className="flex flex-col md:flex-row justify-between items-center px-6 py-6 bg-[#500000]/90 border-b border-[#FFD700]/20"
                  whileHover={{ scale: 1.01 }}
                  onClick={() => togglePlayerDetails(player.name)}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <span className="text-[#FFD700] text-2xl font-extrabold w-10 text-center bg-[#FFD700]/10 rounded-full shadow-inner">#{index + 1}</span>
                    <span className="text-[#FFD700] text-2xl font-bold tracking-wide drop-shadow-lg">{player.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-6 mt-4 md:mt-0">
                    <div className="flex flex-col items-center">
                      <span className="text-[#FFD700]/80 text-xs font-semibold uppercase tracking-wider">Score</span>
                      <span className="text-2xl font-bold text-[#FFD700] drop-shadow">{correctAnswers}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[#FFD700]/80 text-xs font-semibold uppercase tracking-wider">Accuracy</span>
                      <span className="text-2xl font-bold text-[#AAFFAA] drop-shadow">{accuracy}%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[#FFD700]/80 text-xs font-semibold uppercase tracking-wider">Correct</span>
                      <span className="text-2xl font-bold text-[#FFD700] drop-shadow">{correctAnswers}/{totalQuestions}</span>
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
                                <p className={`text-lg ${isCorrect ? "text-[#AAFFAA]" : "text-[#FFAAAA]"}`}>
                                  Your answer: {playerAnswer}
                                </p>
                                {!isCorrect && (
                                  <p className="text-[#AAFFAA]">Correct answer: {question.correctAnswer}</p>
                                )}
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

                {/* Summary Card with Pie Chart */}
                <div className="flex flex-wrap items-center gap-8 px-6 py-4 bg-[#FFD700]/5 border-b border-[#FFD700]/10">
                  <div className="flex flex-col items-center bg-[#1a0909]/80 rounded-2xl shadow-lg p-4 min-w-[180px] max-w-[220px] mx-auto" style={{boxShadow:'0 4px 24px 0 #FFD70022'}}>
                    <h4 className="text-[#FFD700] font-bold mb-2 text-lg">Correct vs Incorrect</h4>
                    <div className="w-[120px] h-[120px]">
                      <Pie data={pieData} options={pieOptions} />
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-900/80 text-[#AAFFAA] font-bold text-lg shadow-sm">
                    <svg className="w-5 h-5 text-[#AAFFAA]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {correctAnswers} Correct
                  </span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/80 text-[#FFAAAA] font-bold text-lg shadow-sm">
                    <svg className="w-5 h-5 text-[#FFAAAA]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    {incorrectAnswers} Incorrect
                  </span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFD700]/20 text-[#FFD700] font-bold text-lg shadow-sm">
                    <svg className="w-5 h-5 text-[#FFD700]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                    {accuracy}% Accuracy
                  </span>
                </div>
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
