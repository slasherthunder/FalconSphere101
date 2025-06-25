"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/app/components/firebase";
import { doc, getDoc } from "firebase/firestore";
import { connect } from "socket.io-client";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { FaCrown } from 'react-icons/fa';

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
    csvContent += "Rank,Player Name,Correct Answers,Wrong Answers,Accuracy\n";
    players.forEach((player, index) => {
      const correctAnswers = player.questionScores?.reduce((count, score) => score > 0 ? count + 1 : count, 0) || 0;
      const totalQuestions = gameData.questions?.length || 1;
      const accuracy = ((correctAnswers / totalQuestions) * 100).toFixed(2);
      
      csvContent += `${index + 1},${player.name},${correctAnswers},${totalQuestions - correctAnswers},${accuracy}%\n`;
    });

    // Detailed player performance
    csvContent += "\nPlayer Detailed Performance\n";
    players.forEach((player, playerIndex) => {
      csvContent += `\nPlayer ${playerIndex + 1}: ${player.name}\n`;
      csvContent += "Question,Player Answer,Correct Answer,Correct\n";
      
      gameData.questions?.forEach((question, qIndex) => {
        const playerAnswer = player.answers?.[qIndex] || "N/A";
        const correctAnswer = question.correctAnswer;
        const score = player.questionScores?.[qIndex] || 0;
        const isCorrect = score > 0 ? "Yes" : "No";
        
        csvContent += `${qIndex + 1},"${playerAnswer}","${correctAnswer}",${isCorrect}\n`;
      });
    });

    // Question analytics
    if (gameData.questions) {
      csvContent += "\nQuestion Analytics\n";
      csvContent += "Question Number,Question Text,Correct Answer,% Correct,Answer Distribution\n";
      
      gameData.questions.forEach((question, index) => {
        const stats = calculateQuestionStats(index);
        const answerDist = Object.entries(stats.answerDistribution || {})
          .map(([ans, count]) => `${ans}: ${count} (${((count / players.length) * 100).toFixed(1)}%)`)
          .join("; ");
        
        csvContent += `${index + 1},"${question.question || JSON.stringify(question)}","${question.correctAnswer}",${((stats.correctCount / players.length) * 100).toFixed(2)}%,"${answerDist}"\n`;
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-[#FFD700] text-2xl">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div
        className="max-w-4xl mx-auto bg-gradient-to-br from-[#8C1515] to-[#6B0D0D] p-6 md:p-8 rounded-3xl border-2 border-[#6B0D0D]"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#FFD700] tracking-wide drop-shadow-lg text-center w-full">
            Leaderboard
          </h1>
        </div>
        
        <div className="space-y-8">
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
                  display: false,
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
              <div
                key={player.name}
                className="rounded-3xl overflow-hidden border-2 border-[#6B0D0D] mb-12 bg-gradient-to-br from-[#8C1515] to-[#6B0D0D] relative group"
              >
                {/* Gold accent bar */}
                {/* <div className="h-1 w-full bg-gradient-to-r from-[#FFD700] to-[#fffbe6] opacity-80" /> */}
                {/* Crown for top player */}
                {index === 0 && (
                  <FaCrown className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#FFD700] text-4xl drop-shadow-lg z-10 animate-bounce" />
                )}
                <div
                  className="flex flex-col md:flex-row justify-between items-center px-8 py-8 bg-gradient-to-br from-[#8C1515] to-[#6B0D0D] border-b border-[#6B0D0D]/60 gap-6"
                >
                  <div className="flex items-center gap-8 w-full md:w-auto">
                    <span className="text-[#FFD700] text-3xl font-extrabold w-14 h-14 flex items-center justify-center text-center bg-[#FFD700]/10 rounded-full shadow-inner border-2 border-[#FFD700]">
                      {index + 1}
                    </span>
                    <span className="text-[#FFD700] text-2xl md:text-3xl font-bold tracking-wide drop-shadow-lg">
                      {player.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-10 mt-4 md:mt-0 items-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[#FFD700] text-sm font-semibold uppercase tracking-wider">Accuracy</span>
                      <span className="text-2xl md:text-3xl font-bold text-[#FFD700] drop-shadow">{accuracy}%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[#FFD700] text-sm font-semibold uppercase tracking-wider">Correct</span>
                      <span className="text-2xl md:text-3xl font-bold text-[#FFD700] drop-shadow">{correctAnswers}/{totalQuestions}</span>
                    </div>
                    <button
                      onClick={() => togglePlayerDetails(player.name)}
                      className={`ml-4 px-5 py-2 rounded-lg font-bold text-lg border-2 border-[#6B0D0D] bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000]`}
                      aria-expanded={showDetails[player.name]}
                      aria-controls={`player-details-${index}`}
                    >
                      {showDetails[player.name] ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                </div>
                
                {showDetails[player.name] && (
                  <div 
                    className="bg-gradient-to-br from-[#8C1515] to-[#6B0D0D] overflow-hidden"
                  >
                    <div className="p-4 md:p-6">
                      <h3 className="text-[#FFD700] font-bold mb-3 text-lg">Question-by-Question Performance</h3>
                      <div className="grid gap-4">
                        {gameData.questions?.map((question, qIndex) => {
                          const playerAnswer = player.answers?.[qIndex];
                        const isCorrect = (player.questionScores?.[qIndex] || 0) > 0;
                          const options = question.options || [];
                          const correctAnswer = question.correctAnswer;
                          const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
                          const isMultipleCorrect = Array.isArray(correctAnswer) && correctAnswer.length > 1;
                          const isOpenEnded = !options || options.length === 0;
                          // For multiple correct, playerAnswer may be array or string
                          const playerAnswersArr = Array.isArray(playerAnswer)
                            ? playerAnswer
                            : typeof playerAnswer === 'string' && playerAnswer.includes(',')
                              ? playerAnswer.split(',').map(a => a.trim())
                              : playerAnswer ? [playerAnswer] : [];

                        return (
                            <div key={qIndex} className="bg-gradient-to-br from-[#8C1515] to-[#6B0D0D] p-3 rounded-2xl mb-2 border border-[#6B0D0D]/30">
                              <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                  <p className="text-[#FFD700] font-semibold mb-1">Q{qIndex + 1}: {question.question || JSON.stringify(question)}</p>
                                  {isOpenEnded ? (
                                    <div className="space-y-1 ml-2">
                                      <div className="text-[#FFD700]">
                                        <span className="font-bold">Your answer:</span> {playerAnswer || <span className="italic text-[#FFD700]/70">No answer</span>}
                                      </div>
                                      <div className="text-[#FFD700]">
                                        <span className="font-bold">Correct answer{Array.isArray(correctAnswer) && correctAnswer.length > 1 ? 's' : ''}:</span> {Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {options.map((opt, i) => {
                                        const isPlayer = playerAnswersArr.includes(opt);
                                        const isCorrectOpt = correctAnswers.includes(opt);
                                        // For single answer, use radio; for multiple, use checkbox
                                        return (
                                          <div
                                            key={i}
                                            className={`flex items-center gap-2 px-3 py-1 rounded-lg border-2 transition-all
                                              ${isCorrectOpt ? 'border-[#6B0D0D] font-bold' : 'border-transparent'}
                                              ${isPlayer ? 'bg-[#FFD700] text-[#8B0000] font-bold shadow' : 'text-[#FFD700]'}
                                            `}
                                          >
                                            {isMultipleCorrect ? (
                                              <input type="checkbox" checked={isPlayer} readOnly className="form-checkbox h-5 w-5 text-[#FFD700] border-2 border-[#6B0D0D]" />
                                            ) : (
                                              <input type="radio" checked={isPlayer} readOnly className="form-radio h-5 w-5 text-[#FFD700] border-2 border-[#6B0D0D]" />
                                            )}
                                            <span>{opt}</span>
                                            {isCorrectOpt && (
                                              <span className="ml-2 text-xs bg-[#FFD700] text-[#8B0000] px-2 py-0.5 rounded-full font-bold">Correct</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {/* If player did not answer */}
                                      {playerAnswersArr.length === 0 && (
                                        <div className="text-[#FFD700]/70 italic mt-1">No answer selected</div>
                                      )}
                                    </div>
                                )}
                              </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap items-center gap-8 px-6 py-4 bg-gradient-to-br from-[#8C1515] to-[#6B0D0D] border-b border-[#FFD700] mt-8">
                        <div className="flex flex-col items-center bg-gradient-to-br from-[#8C1515] to-[#6B0D0D] rounded-2xl p-4 min-w-[180px] max-w-[220px] mx-auto">
                          <h4 className="text-[#FFD700] font-bold mb-2 text-lg">Correct vs Incorrect</h4>
                          <div className="w-[120px] h-[120px]">
                            <Pie data={pieData} options={pieOptions} />
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-800 text-[#FFD700] font-bold text-lg">
                          <svg className="w-5 h-5 text-[#FFD700]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          {correctAnswers} Correct
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-800 text-[#FFD700] font-bold text-lg">
                          <svg className="w-5 h-5 text-[#FFD700]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          {incorrectAnswers} Incorrect
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFD700]/20 text-[#FFD700] font-bold text-lg">
                          <svg className="w-5 h-5 text-[#FFD700]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                          {accuracy}% Accuracy
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                );
              })}
            </div>
          </div>
    </div>
  );
};

export default LeaderboardPage;
