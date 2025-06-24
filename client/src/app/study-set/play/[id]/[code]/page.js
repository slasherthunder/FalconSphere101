"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // Import useRouter
import { db } from "../../../../../components/firebase"; // Import Firestore instance
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Import Firestore functions
import { motion, AnimatePresence } from "framer-motion"; // Import framer-motion

import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

// Add new animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const optionVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.3 }
  }),
  hover: {
    scale: 1.02,
    x: 10,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
};

export default function PlaySet() {
  const [timer, setTimer] = useState(60) // the varible that stores current time of timer in seconds
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setTimer(timer - 1);
  //   }, 1000);

  //   // Cleanup to prevent memory leaks
  //   return () => clearInterval(interval);
  // }, []); 
  useEffect(() => {
    setTimeout(() => {
       setTimer(timer -1);
       if(timer == 1){
        router.push("/./leaderboard/" + code)
      }
    }, 1000);  }, [timer])


  const params = useParams(); // Get the set ID from the URL
  const id = params.id
  const code = params.code
  const router = useRouter(); // Initialize the router
  const [setData, setSetData] = useState(null); // State to store the set data
  const [loading, setLoading] = useState(true); // State to handle loading
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0); // Track current slide
  const [selectedAnswer, setSelectedAnswer] = useState(""); // Track user's selected answer
  const [score, setScore] = useState(0); // Track user's score
  const [showResult, setShowResult] = useState(false); // Show result after quiz ends
  const [answers, setAnswers] = useState([]); // Stores user's answers per question
  const [questionResults, setQuestionResults] = useState([]); // Stores correctness per question
  const [questionStartTime, setQuestionStartTime] = useState(Date.now()); // For timing
  const [questionTimes, setQuestionTimes] = useState([]); // Stores time spent per question

  useEffect (() => {
    // const listOfObject = localStorage.getItem("PlayerData")
    // const listOfObjects = JSON.parse(listOfObject);
    // sessionStorage.setItem("currentGameSetID", id)
    // const name = sessionStorage.getItem("name")

    // const index = listOfObjects.findIndex(obj => obj.name === name);
    // const slideNum = listOfObjects[index].slideNumber
    const getPlayerSlideIndexData = async () => {
      const docRef = doc(db, "game", code)
      const playerDocData = await getDoc(docRef);
      const playerData =  playerDocData.data().player[0]
      const playerSlide =  playerData.currentSlide
      setCurrentSlideIndex(playerSlide)
    } 
    getPlayerSlideIndexData()

    // setCurrentSlideIndex(slideNum)

  }, []);


  // Fetch the set data from Firestore
  useEffect(() => {
    const fetchSetData = async () => {
      try {
        const docRef = doc(db, "sets", id); // Reference to the specific set
        const docSnap = await getDoc(docRef); // Fetch the document

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSetData(data);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching set data: ", error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchSetData();
  }, [id]);

  // After setData is loaded, ensure questions are written to the game document
  useEffect(() => {
    if (!setData) return;
    const writeQuestionsToGame = async () => {
      try {
        const docRef = doc(db, "game", code);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Only write if questions field is missing or empty
          if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
            // Map slides to a format suitable for leaderboard (question, options, correctAnswer)
            const questions = setData.slides.map(slide => {
              if (slide.questionType === "multipleChoice") {
                return {
                  question: slide.question,
                  options: slide.options,
                  correctAnswer: slide.correctAnswer,
                  questionType: slide.questionType,
                };
              } else if (slide.questionType === "multipleCorrect") {
                return {
                  question: slide.question,
                  options: slide.options,
                  correctAnswer: slide.correctAnswers, // array
                  questionType: slide.questionType,
                };
              } else if (slide.questionType === "openEnded") {
                return {
                  question: slide.question,
                  options: [],
                  correctAnswer: slide.openEndedAnswers, // array
                  questionType: slide.questionType,
                };
              } else {
                return {
                  question: slide.question,
                  options: slide.options || [],
                  correctAnswer: slide.correctAnswer || slide.correctAnswers || slide.openEndedAnswers || [],
                  questionType: slide.questionType,
                };
              }
            });
            await updateDoc(docRef, { questions });
          }
        }
      } catch (e) {
        console.error("Error writing questions to game document:", e);
      }
    };
    writeQuestionsToGame();
  }, [setData, code]);

  // Handle answer selection
  const handleAnswerSelect = (option) => {
    setSelectedAnswer(option);
  };

  // Handle moving to the next question
  const handleNextQuestion = () => {
    // Calculate time spent on this question
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    // Determine if the answer is correct
    const currentQuestion = setData.slides[currentSlideIndex];
    let isCorrect = false;
    if (currentQuestion.questionType === "multipleChoice") {
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    } else if (currentQuestion.questionType === "multipleCorrect") {
      if (Array.isArray(selectedAnswer) && Array.isArray(currentQuestion.correctAnswers)) {
        const correctSet = new Set(currentQuestion.correctAnswers.map(String));
        const answerSet = new Set(selectedAnswer.map(String));
        isCorrect = correctSet.size === answerSet.size && [...correctSet].every(x => answerSet.has(x));
      }
    } else if (currentQuestion.questionType === "openEnded") {
      isCorrect = currentQuestion.openEndedAnswers?.some(
        ans => ans.trim().toLowerCase() === selectedAnswer.trim().toLowerCase()
      );
    }

    setAnswers(prev => [...prev, selectedAnswer]);
    setQuestionResults(prev => [...prev, isCorrect]);
    setQuestionTimes(prev => [...prev, timeSpent]);
    if (isCorrect) setScore(score + 1);

    // Update Firestore with all answers, correctness, and times
    const updatePlayerData = async () => {
      try {
        const docRef = doc(db, "game", code);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const updatedPlayers = data.players.map(player => {
            if (player.name === sessionStorage.getItem("name")) {
              return {
                ...player,
                currentSlide: currentSlideIndex + 1,
                answers: [...(player.answers || []), selectedAnswer],
                questionResults: [...(player.questionResults || []), isCorrect],
                questionTimes: [...(player.questionTimes || []), timeSpent],
                correctAnswers: (player.correctAnswers || 0) + (isCorrect ? 1 : 0),
                percentage: (((player.correctAnswers || 0) + (isCorrect ? 1 : 0)) / (currentSlideIndex + 1)).toFixed(2)
              };
            }
            return player;
          });
          await updateDoc(docRef, { players: updatedPlayers });
        }
      } catch (e) {
        console.error("Error updating player:", e);
      }
    };
    updatePlayerData();
    
    // Move to next question or finish
    if (currentSlideIndex < setData.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
      setSelectedAnswer("");
      setQuestionStartTime(Date.now());
    } else {
      setShowResult(true);
      router.push("/leaderboard/" + code);
    }
  };

  // Restart the quiz
  const restartQuiz = () => {
    setCurrentSlideIndex(0);
    setSelectedAnswer("");
    setScore(0);
    setShowResult(false);
  };

  // Navigate back to the Study Set page
  const navigateToStudySet = () => {
    router.push(`/study-set/${id}`);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8 flex items-center justify-center"
      >
        <div className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 rounded-2xl shadow-2xl border border-[#ffffff20] text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-2xl font-semibold tracking-wide">Loading...</p>
        </div>
      </motion.div>
    );
  }

  if (!setData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8 flex items-center justify-center"
      >
        <div className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 rounded-2xl shadow-2xl border border-[#ffffff20] text-center">
          <p className="text-[#FFD700] text-2xl font-semibold tracking-wide">Set not found.</p>
        </div>
      </motion.div>
    );
  }

  const currentSlide = setData.slides[currentSlideIndex];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 py-4 sm:py-12 px-2 sm:px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
      >
        <motion.div 
          className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-4 sm:p-8 rounded-2xl shadow-2xl border border-[#ffffff20] overflow-hidden"
          whileHover={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8 gap-4">
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl text-[#FFD700] font-bold tracking-wide text-center sm:text-left"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {setData.title} <span className="text-2xl sm:text-3xl md:text-4xl ml-2">{timer}</span>
            </motion.h2>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={navigateToStudySet}
              className="w-full sm:w-auto bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-lg sm:text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Back to Study Set
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <motion.div
              key={currentSlideIndex}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="w-full p-4 sm:p-8 bg-gradient-to-br from-[#8B0000] to-[#700000] rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <motion.div 
                className="space-y-4 sm:space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div 
                  className="text-2xl sm:text-3xl text-[#FFD700] font-semibold mb-4 sm:mb-8 tracking-wide text-center sm:text-left"
                  whileHover={{ scale: 1.01 }}
                >
                  Question {currentSlideIndex + 1} of {setData.slides.length}
                </motion.div>
                <motion.div 
                  className="text-xl sm:text-2xl text-[#FFD700] font-medium mb-4 sm:mb-6 tracking-wide text-center sm:text-left"
                  whileHover={{ scale: 1.01 }}
                >
                  {currentSlide.question}
                </motion.div>

                {currentSlide.imageData && (
                  <motion.div
                    className="relative overflow-hidden rounded-xl mb-4 sm:mb-8 shadow-xl"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={currentSlide.imageData}
                      alt="Question"
                      className="w-full h-auto max-h-[200px] sm:max-h-[300px] md:max-h-[400px] object-contain rounded-xl"
                    />
                  </motion.div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  {currentSlide.options.map((option, index) => (
                    <motion.div
                      key={index}
                      custom={index}
                      variants={optionVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => handleAnswerSelect(option)}
                      className={`flex items-center p-3 sm:p-6 rounded-xl border-2 cursor-pointer ${
                        option === selectedAnswer
                          ? "border-[#FFD700] bg-gradient-to-r from-[#700000] to-[#600000]"
                          : "border-[#FFD700]/50 bg-gradient-to-r from-[#700000]/50 to-[#600000]/50 hover:border-[#FFD700]"
                      } shadow-lg transition-all duration-300`}
                    >
                      <input
                        type="radio"
                        name="quiz-answer"
                        value={option}
                        checked={option === selectedAnswer}
                        onChange={() => handleAnswerSelect(option)}
                        className="form-radio h-5 w-5 sm:h-6 sm:w-6 text-[#FFD700] border-2 border-[#FFD700]"
                      />
                      <span className="ml-3 sm:ml-4 text-[#FFD700] text-base sm:text-xl tracking-wide">
                        {option}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextQuestion}
                  className="w-full mt-4 sm:mt-8 bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-lg sm:text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  {currentSlideIndex === setData.slides.length - 1 ? "Finish Quiz" : "Next Question"}
                </motion.button>
              </motion.div>
            </motion.div>
          </div>

          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="mt-4 sm:mt-8 p-4 sm:p-8 bg-gradient-to-br from-[#8B0000] to-[#700000] rounded-xl shadow-xl border border-[#ffffff10]"
              >
                <motion.h2 
                  className="text-3xl sm:text-4xl text-[#FFD700] font-bold mb-4 sm:mb-6 tracking-wide text-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Quiz Result
                </motion.h2>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="text-4xl sm:text-6xl text-[#FFD700] font-bold mb-4 sm:mb-8 tracking-wide text-center"
                >
                  {Math.round((score / setData.slides.length) * 100)}%
                </motion.div>
                <motion.p 
                  className="text-xl sm:text-2xl text-[#FFD700] mb-4 sm:mb-8 tracking-wide text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  You scored {score} out of {setData.slides.length} questions correctly!
                </motion.p>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={restartQuiz}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-lg sm:text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Restart Quiz
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
