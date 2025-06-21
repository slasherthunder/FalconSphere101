"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "../../../components/firebase"; // Import Firestore instance and auth
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { motion, AnimatePresence } from "framer-motion"; // For animations
import { onAuthStateChanged } from "firebase/auth";
import { 
  FaClock, 
  FaRandom, 
  FaBook, 
  FaBrain, 
  FaStopwatch, 
  FaCheck, 
  FaTimes, 
  FaArrowRight,
  FaGamepad,
  FaRedo,
  FaChartLine,
  FaTrophy,
  FaMedal,
  FaStar,
  FaArrowLeft
} from "react-icons/fa";

// Add animation variants
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

const buttonVariants = {
  hover: {
    scale: 1.05,
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400
    }
  },
  tap: { scale: 0.95 }
};

export default function StudySet() {
  const { id } = useParams(); // Get the set ID from the URL
  const router = useRouter(); // Router for navigation
  const [setData, setSetData] = useState(null); // State to store the set data
  const [loading, setLoading] = useState(true); // State to handle loading
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0); // Track current slide
  const [selectedAnswer, setSelectedAnswer] = useState(""); // Track user's selected answer
  const [selectedAnswers, setSelectedAnswers] = useState([]); // Track multiple selected answers
  const [openEndedAnswer, setOpenEndedAnswer] = useState(""); // Track open-ended answer input
  const [score, setScore] = useState(0); // Track user's score
  const [showResult, setShowResult] = useState(false); // Show result after quiz ends
  const [isPlaying, setIsPlaying] = useState(false); // Track if in play mode
  const [user, setUser] = useState(null);
  const [showStudyModes, setShowStudyModes] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyHistory, setStudyHistory] = useState([]);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundScores, setRoundScores] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [maxConsecutiveCorrect, setMaxConsecutiveCorrect] = useState(0);
  const [studyStreak, setStudyStreak] = useState(0);

  // Pomodoro timer (25 minutes)
  const POMODORO_TIME = 25 * 60;
  // Speed challenge time (30 seconds per question)
  const SPEED_CHALLENGE_TIME = 30;

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let timer;
    if (selectedMode && timeLeft !== null) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (selectedMode === "Pomodoro Study") {
              setIsBreak(true);
              setTimeLeft(5 * 60); // 5 minute break
            } else if (selectedMode === "Speed Challenge") {
              handleNextQuestion();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [selectedMode, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleMultipleAnswerSelect = (answer) => {
    setSelectedAnswers(prev => {
      if (prev.includes(answer)) {
        return prev.filter(a => a !== answer);
      } else {
        return [...prev, answer];
      }
    });
  };

  const handleOpenEndedAnswerChange = (value) => {
    setOpenEndedAnswer(value);
  };

  const handleReset = () => {
    setCurrentSlideIndex(0);
    setSelectedAnswer("");
    setSelectedAnswers([]);
    setOpenEndedAnswer("");
    setScore(0);
    setShowResult(false);
    setShowAnswer(false);
    setIsBreak(false);
    setPomodoroCount(0);
    setTotalCorrect(0);
    setTotalAttempts(0);
    setCurrentRound(1);
    setRoundScores([]);
    setConsecutiveCorrect(0);
    setMaxConsecutiveCorrect(0);
    if (selectedMode === "Random Order") {
      const shuffled = [...setData.slides].sort(() => Math.random() - 0.5);
      setShuffledQuestions(shuffled);
    }
  };

  const handleNextQuestion = () => {
    const currentQuestion = getCurrentQuestion();
    let isCorrect = false;

    // Handle different question types
    if (currentQuestion.questionType === "multipleChoice") {
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    } else if (currentQuestion.questionType === "multipleCorrect") {
      // For multiple correct answers, check if selected answer is in the correct answers array
      isCorrect = currentQuestion.correctAnswers && currentQuestion.correctAnswers.includes(selectedAnswer);
    } else if (currentQuestion.questionType === "openEnded") {
      // For open-ended questions, we'll need to implement a different UI
      // For now, we'll skip scoring for open-ended questions
      isCorrect = false; // Open-ended questions need manual review
    }

    if (isCorrect) {
      setScore(score + 1);
      setTotalCorrect(prev => prev + 1);
      setConsecutiveCorrect(prev => {
        const newCount = prev + 1;
        setMaxConsecutiveCorrect(current => Math.max(current, newCount));
        return newCount;
      });
    } else {
      setConsecutiveCorrect(0);
    }
    setTotalAttempts(prev => prev + 1);

    if (currentSlideIndex < setData.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
      setSelectedAnswer("");
      setSelectedAnswers([]);
      setOpenEndedAnswer("");
      if (selectedMode === "Speed Challenge") {
        setTimeLeft(SPEED_CHALLENGE_TIME);
      }
    } else {
      if (selectedMode === "Pomodoro Study") {
        setRoundScores(prev => [...prev, score]);
        setBestScore(prev => Math.max(prev, score));
        setAverageScore(prev => (prev * (currentRound - 1) + score) / currentRound);
        setCurrentSlideIndex(0);
        setSelectedAnswer("");
        setScore(0);
        setCurrentRound(prev => prev + 1);
      } else {
        setShowResult(true);
        setBestScore(prev => Math.max(prev, score));
      }
    }
  };

  // Restart the quiz
  const restartQuiz = () => {
    setCurrentSlideIndex(0);
    setSelectedAnswer("");
    setSelectedAnswers([]);
    setOpenEndedAnswer("");
    setScore(0);
    setShowResult(false);
    setIsPlaying(false);
  };

  // Download the set as a JSON file
  const downloadSet = () => {
    const jsonString = JSON.stringify(setData, null, 2); // Convert setData to JSON string
    const blob = new Blob([jsonString], { type: "application/json" }); // Create a Blob from the JSON string
    const url = URL.createObjectURL(blob); // Create a URL for the Blob

    // Create a temporary anchor element to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${setData.title.replace(/\s+/g, "_")}_set.json`; // Set the filename
    document.body.appendChild(a);
    a.click(); // Trigger the download
    document.body.removeChild(a); // Clean up
    URL.revokeObjectURL(url); // Release the Blob URL
  };

  // Start playing the set
  const startPlaying = () => {
    setIsPlaying(true);
    setCurrentSlideIndex(0);
    setSelectedAnswer("");
    setScore(0);
    setShowResult(false);
  };

  // Add new function to handle copying set
  const handleCopySet = () => {
    // Store the set data in localStorage
    localStorage.setItem('copiedSet', JSON.stringify({
      ...setData,
      title: `${setData.title} (Copy)`, // Add "(Copy)" to the title
      createdAt: new Date().toISOString(), // Update creation date
    }));
    // Navigate to create page
    router.push('/create-set');
  };

  const handleEditSet = () => {
    if (!user) {
      router.push('/signup');
      return;
    }
    
    if (setData.userId !== user.uid) {
      alert("You can only edit sets that you created.");
      return;
    }
    
    router.push(`/edit-set/${id}`);
  };

  const studyModes = [
    {
      title: "Pomodoro Study",
      description: "25-minute focused study sessions with breaks",
      icon: FaClock,
      color: "from-[#FF6B6B] to-[#FF8E8E]",
      gradient: "bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E]",
    },
    {
      title: "Quick Quiz",
      description: "Test your knowledge with immediate feedback",
      icon: FaGamepad,
      color: "from-[#4ECDC4] to-[#45B7AF]",
      gradient: "bg-gradient-to-br from-[#4ECDC4] to-[#45B7AF]",
    },
    {
      title: "Speed Challenge",
      description: "Race against time to answer questions",
      icon: FaStopwatch,
      color: "from-[#FFD93D] to-[#FFC107]",
      gradient: "bg-gradient-to-br from-[#FFD93D] to-[#FFC107]",
    },
    {
      title: "Active Recall",
      description: "Practice recalling answers from memory",
      icon: FaBrain,
      color: "from-[#6C5CE7] to-[#5B4BC4]",
      gradient: "bg-gradient-to-br from-[#6C5CE7] to-[#5B4BC4]",
    },
    {
      title: "Random Order",
      description: "Questions in random sequence",
      icon: FaRandom,
      color: "from-[#00B894] to-[#00A884]",
      gradient: "bg-gradient-to-br from-[#00B894] to-[#00A884]",
    },
    {
      title: "Flashcards",
      description: "Flip cards to learn and review",
      icon: FaBook,
      color: "from-[#FF7675] to-[#FF6B6B]",
      gradient: "bg-gradient-to-br from-[#FF7675] to-[#FF6B6B]",
    },
  ];

  const handlePlayClick = () => {
    setShowStudyModes(true);
  };

  const handleModeSelect = (mode) => {
    setShowStudyModes(false);
    setSelectedMode(mode.title);
    setCurrentSlideIndex(0);
    setSelectedAnswer("");
    setSelectedAnswers([]);
    setOpenEndedAnswer("");
    setScore(0);
    setShowResult(false);
    setShowAnswer(false);
    setIsBreak(false);
    setPomodoroCount(0);
    setTotalCorrect(0);
    setTotalAttempts(0);
    setCurrentRound(1);
    setRoundScores([]);

    switch (mode.title) {
      case "Pomodoro Study":
        setTimeLeft(POMODORO_TIME);
        break;
      case "Speed Challenge":
        setTimeLeft(SPEED_CHALLENGE_TIME);
        break;
      case "Random Order":
        const shuffled = [...setData.slides].sort(() => Math.random() - 0.5);
        setShuffledQuestions(shuffled);
        break;
      case "Flashcards":
        setShowAnswer(false);
        break;
      default:
        break;
    }
    
    startPlaying();
  };

  const handleBreakEnd = () => {
    setIsBreak(false);
    setPomodoroCount(prev => prev + 1);
    if (pomodoroCount < 3) { // After 4 pomodoros, end the session
      setTimeLeft(POMODORO_TIME);
    } else {
      setShowResult(true);
    }
  };

  const toggleFlashcard = () => {
    setShowAnswer(!showAnswer);
  };

  const getCurrentQuestion = () => {
    if (selectedMode === "Random Order") {
      return shuffledQuestions[currentSlideIndex];
    }
    return setData.slides[currentSlideIndex];
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 py-12 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 rounded-2xl shadow-2xl border border-[#ffffff20] text-center"
        >
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-2xl font-semibold tracking-wide">Loading set...</p>
        </motion.div>
      </div>
    );
  }

  if (!setData) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 py-12 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 rounded-2xl shadow-2xl border border-[#ffffff20] text-center"
        >
          <p className="text-[#FFD700] text-2xl font-semibold tracking-wide">Set not found.</p>
        </motion.div>
      </div>
    );
  }

  const currentSlide = setData.slides[currentSlideIndex];

  if (isPlaying) {
    const currentQuestion = getCurrentQuestion();

    if (isBreak) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 py-12 px-4 flex items-center justify-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-4xl"
        >
            <motion.div
              className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 rounded-2xl shadow-2xl border border-[#ffffff20] text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl text-[#FFD700] font-bold mb-6 tracking-wide">Break Time!</h2>
              <p className="text-2xl text-[#FFD700] mb-4 tracking-wide">
                Time remaining: {formatTime(timeLeft)}
              </p>
              <div className="mb-8">
                <h3 className="text-2xl text-[#FFD700] font-bold mb-4">Session Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#700000] p-4 rounded-xl">
                    <p className="text-[#FFD700] text-lg mb-2">Total Correct</p>
                    <p className="text-[#FFD700] text-2xl font-bold">{totalCorrect}/{totalAttempts}</p>
                  </div>
                  <div className="bg-[#700000] p-4 rounded-xl">
                    <p className="text-[#FFD700] text-lg mb-2">Accuracy</p>
                    <p className="text-[#FFD700] text-2xl font-bold">{((totalCorrect / totalAttempts) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-[#700000] p-4 rounded-xl">
                    <p className="text-[#FFD700] text-lg mb-2">Rounds Completed</p>
                    <p className="text-[#FFD700] text-2xl font-bold">{currentRound - 1}</p>
                  </div>
                  <div className="bg-[#700000] p-4 rounded-xl">
                    <p className="text-[#FFD700] text-lg mb-2">Best Score</p>
                    <p className="text-[#FFD700] text-2xl font-bold">{bestScore}/{setData.slides.length}</p>
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleBreakEnd}
                    className="bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    End Break
                  </motion.button>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleReset}
                    className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  >
                    <FaRedo /> Reset Set
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      );
    }

    if (showResult) {
      return (
        <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 py-12 px-4 flex items-center justify-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-4xl"
          >
            <motion.div
              className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 rounded-2xl shadow-2xl border border-[#ffffff20] text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl text-[#FFD700] font-bold mb-6 tracking-wide">Session Complete!</h2>
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#700000] p-4 rounded-xl">
                    <p className="text-[#FFD700] text-lg mb-2">Final Score</p>
                    <p className="text-[#FFD700] text-2xl font-bold">{totalCorrect}/{totalAttempts}</p>
                  </div>
                  <div className="bg-[#700000] p-4 rounded-xl">
                    <p className="text-[#FFD700] text-lg mb-2">Accuracy</p>
                    <p className="text-[#FFD700] text-2xl font-bold">{((totalCorrect / totalAttempts) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-[#700000] p-4 rounded-xl">
                    <p className="text-[#FFD700] text-lg mb-2">Best Score</p>
                    <p className="text-[#FFD700] text-2xl font-bold">{bestScore}/{setData.slides.length}</p>
                  </div>
                  <div className="bg-[#700000] p-4 rounded-xl">
                    <p className="text-[#FFD700] text-lg mb-2">Max Streak</p>
                    <p className="text-[#FFD700] text-2xl font-bold">{maxConsecutiveCorrect}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-xl text-[#FFD700] font-bold mb-4">Round Scores:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {roundScores.map((score, index) => (
                      <div key={index} className="bg-[#700000] p-4 rounded-xl">
                        <p className="text-[#FFD700] text-lg">Round {index + 1}</p>
                        <p className="text-[#FFD700] text-2xl font-bold">{score}/{setData.slides.length}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => {
                    setSelectedMode(null);
                    setIsPlaying(false);
                  }}
                  className="bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Return to Set
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleReset}
                  className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <FaRedo /> Reset Set
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 py-12 px-4 flex items-center justify-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-4xl"
        >
          <motion.div
            className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 rounded-2xl shadow-2xl border border-[#ffffff20]"
            variants={cardVariants}
          >
            <div className="flex justify-between items-center mb-8">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => router.back()}
                className="bg-[#700000] text-[#FFD700] px-6 py-3 rounded-xl font-medium text-lg hover:bg-[#FFD700] hover:text-[#8B0000] transition-all duration-200 flex items-center gap-2"
              >
                <FaArrowLeft /> Back
              </motion.button>

              <div className="flex items-center gap-4">
                {selectedMode === "Pomodoro Study" && (
                  <div className="text-2xl font-bold text-[#FFD700]">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </div>
                )}
                {selectedMode === "Speed Challenge" && (
                  <div className="text-2xl font-bold text-[#FFD700]">
                    {timeLeft}s
                  </div>
                )}
                <div className="text-xl font-medium text-[#FFD700]">
                  Score: {score}/{currentSlideIndex + 1}
                </div>
              </div>
            </div>

            <div className="bg-[#8B0000] rounded-2xl p-8 mb-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                <span className="text-[#FFD700] text-xl tracking-wide font-medium">
                  Question {currentSlideIndex + 1} of {setData.slides.length}
                </span>
                  {selectedMode === "Pomodoro Study" && (
                    <>
                      <div className="flex items-center gap-2">
                        <FaClock className="text-[#FFD700]" />
                        <span className="text-[#FFD700] text-xl tracking-wide font-medium">
                          {formatTime(timeLeft)}
                        </span>
                      </div>
                      <span className="text-[#FFD700] text-xl tracking-wide font-medium">
                        Round {currentRound}
                      </span>
                    </>
                  )}
                  {selectedMode === "Speed Challenge" && (
                    <div className="flex items-center gap-2">
                      <FaClock className="text-[#FFD700]" />
                      <span className="text-[#FFD700] text-xl tracking-wide font-medium">
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#FFD700] text-xl tracking-wide font-medium">
                    Score: {score}
                  </span>
                  {selectedMode === "Pomodoro Study" && (
                    <span className="text-[#FFD700] text-xl tracking-wide font-medium">
                      Total: {totalCorrect}/{totalAttempts}
                    </span>
                  )}
                  {consecutiveCorrect > 0 && (
                    <span className="text-[#FFD700] text-xl tracking-wide font-medium flex items-center gap-2">
                      <FaStar className="text-yellow-400" /> {consecutiveCorrect}
                    </span>
                  )}
                </div>
              </div>
              </div>

            {selectedMode === "Flashcards" ? (
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={toggleFlashcard}
                className="cursor-pointer bg-gradient-to-br from-[#700000] to-[#600000] p-8 rounded-xl shadow-lg"
              >
                <motion.h3
                  className="text-3xl text-[#FFD700] font-bold mb-6 tracking-wide text-center"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {showAnswer ? currentQuestion.correctAnswer : currentQuestion.question}
                </motion.h3>
                <p className="text-[#FFD700] text-lg text-center">
                  {showAnswer ? "Click to show question" : "Click to show answer"}
                </p>
              </motion.div>
            ) : (
              <>
              <motion.h3
                  className="text-3xl text-[#FFD700] font-bold mb-6 tracking-wide text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                  {currentQuestion.question}
              </motion.h3>

                {currentQuestion.imageData && (
                <motion.div
                  className="relative overflow-hidden rounded-xl mb-8 shadow-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <img
                      src={currentQuestion.imageData}
                    alt="Question"
                    className="w-full h-auto max-h-96 object-contain rounded-xl"
                  />
                </motion.div>
              )}

                {/* Render different UI based on question type */}
                {currentQuestion.questionType === "multipleChoice" && (
                  <div className="space-y-4 mb-8">
                    {currentQuestion.options.map((option, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleAnswerSelect(option)}
                        className={`w-full p-6 rounded-xl text-xl font-medium transition-all duration-200 ${
                          selectedAnswer === option
                            ? option === currentQuestion.correctAnswer
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                            : "bg-[#700000] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#8B0000]"
                        }`}
                        disabled={selectedAnswer !== ""}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {selectedAnswer === option && (
                            <span className="ml-4">
                              {option === currentQuestion.correctAnswer ? (
                                <FaCheck className="text-white text-xl" />
                              ) : (
                                <FaTimes className="text-white text-xl" />
                              )}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {currentQuestion.questionType === "multipleCorrect" && (
                  <div className="space-y-4 mb-8">
                    {currentQuestion.options.map((option, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleMultipleAnswerSelect(option)}
                        className={`w-full p-6 rounded-xl text-xl font-medium transition-all duration-200 ${
                          selectedAnswers.includes(option)
                            ? currentQuestion.correctAnswers && currentQuestion.correctAnswers.includes(option)
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                            : "bg-[#700000] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#8B0000]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {selectedAnswers.includes(option) && (
                            <span className="ml-4">
                              {currentQuestion.correctAnswers && currentQuestion.correctAnswers.includes(option) ? (
                                <FaCheck className="text-white text-xl" />
                              ) : (
                                <FaTimes className="text-white text-xl" />
                              )}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                    {selectedAnswers.length > 0 && (
                      <div className="mt-4 p-4 bg-[#700000] rounded-xl">
                        <p className="text-[#FFD700] text-lg mb-2">Selected answers:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnswers.map((answer, index) => (
                            <span key={index} className="px-3 py-1 bg-[#FFD700] text-[#8B0000] rounded-lg text-sm">
                              {answer}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentQuestion.questionType === "openEnded" && (
                  <div className="space-y-4 mb-8">
                    <div className="mb-4">
                      <label className="block text-[#FFD700] text-lg font-medium mb-3">Your Answer:</label>
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="text"
                        value={openEndedAnswer}
                        onChange={(e) => handleOpenEndedAnswerChange(e.target.value)}
                        className="w-full p-4 border-2 rounded-xl bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300"
                        placeholder="Type your answer here..."
                      />
                    </div>
                    {openEndedAnswer && (
                      <div className="mt-4 p-4 bg-[#700000] rounded-xl">
                        <p className="text-[#FFD700] text-lg mb-2">Sample answers:</p>
                        <div className="space-y-2">
                          {currentQuestion.sampleAnswers && currentQuestion.sampleAnswers.map((sampleAnswer, index) => (
                            <div key={index} className="p-3 bg-[#8B0000] rounded-lg">
                              <p className="text-[#FFD700] text-sm">{sampleAnswer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedMode !== "Active Recall" && (
                  <div className="flex justify-between items-center gap-4">
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={handleReset}
                      className="bg-[#700000] text-[#FFD700] px-6 py-3 rounded-xl font-medium text-lg hover:bg-[#FFD700] hover:text-[#8B0000] transition-all duration-200 flex items-center gap-2"
                    >
                      <FaRedo /> Reset
                    </motion.button>

                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={handleNextQuestion}
                      disabled={
                        (currentQuestion.questionType === "multipleChoice" && !selectedAnswer) ||
                        (currentQuestion.questionType === "multipleCorrect" && selectedAnswers.length === 0) ||
                        (currentQuestion.questionType === "openEnded" && !openEndedAnswer.trim())
                      }
                      className={`flex-1 py-4 rounded-xl font-medium text-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                        ((currentQuestion.questionType === "multipleChoice" && selectedAnswer) ||
                         (currentQuestion.questionType === "multipleCorrect" && selectedAnswers.length > 0) ||
                         (currentQuestion.questionType === "openEnded" && openEndedAnswer.trim()))
                          ? "bg-[#FFD700] text-[#8B0000] hover:bg-[#FFC300]"
                          : "bg-gray-500 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      {currentSlideIndex < setData.slides.length - 1 ? (
                        <>
                          Next Question
                          <FaArrowRight />
                        </>
                      ) : (
                        "Finish Quiz"
                      )}
                    </motion.button>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end mt-4">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleReset}
                className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <FaRedo /> Reset
              </motion.button>
            </div>
            </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 py-12 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        <motion.div 
          className="bg-gradient-to-br from-[#8B0000] to-[#700000] p-8 rounded-2xl shadow-2xl border border-[#ffffff20] overflow-hidden"
          whileHover={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <motion.h2 
              className="text-5xl text-[#FFD700] font-bold tracking-wide"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Study Set: {setData.title}
            </motion.h2>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
              {user && setData.userId === user.uid && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleEditSet}
                  className="bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Edit Set
                </motion.button>
              )}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleCopySet}
                className="bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Copy Set
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handlePlayClick}
                className="bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Play Set
              </motion.button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Preview Section */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="w-full lg:w-1/2 p-8 bg-gradient-to-br from-[#8B0000] to-[#700000] rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <h2 className="text-3xl text-[#FFD700] font-bold mb-8 tracking-wide">Preview</h2>
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div 
                  className="text-[#FFD700] text-4xl font-semibold mb-4 tracking-wide"
                  whileHover={{ scale: 1.01 }}
                >
                  {setData.title}
                </motion.div>
                <motion.div 
                  className="text-[#FFD700] text-xl font-semibold tracking-wide"
                  whileHover={{ scale: 1.01 }}
                >
                  {currentSlide.question || "Question:"}
                </motion.div>
                {currentSlide.imageData && (
                  <motion.div
                    className="relative overflow-hidden rounded-xl shadow-xl"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={currentSlide.imageData}
                      alt="Question"
                      className="w-full h-auto max-h-96 object-contain rounded-xl"
                    />
                  </motion.div>
                )}
                <div className="space-y-3">
                  {currentSlide.questionType === "multipleChoice" && currentSlide.options.map((option, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, x: 5 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center p-4 rounded-xl border-2 ${
                        option === currentSlide.correctAnswer
                          ? "border-green-500 bg-gradient-to-r from-green-900/50 to-green-800/50"
                          : "border-[#FFD700] bg-gradient-to-r from-[#700000] to-[#600000]"
                      } shadow-lg`}
                    >
                      <span className="ml-4 text-[#FFD700] text-lg">
                        {option || `Option ${index + 1}`}
                      </span>
                    </motion.div>
                  ))}
                  
                  {currentSlide.questionType === "multipleCorrect" && currentSlide.options.map((option, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, x: 5 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center p-4 rounded-xl border-2 ${
                        currentSlide.correctAnswers && currentSlide.correctAnswers.includes(option)
                          ? "border-green-500 bg-gradient-to-r from-green-900/50 to-green-800/50"
                          : "border-[#FFD700] bg-gradient-to-r from-[#700000] to-[#600000]"
                      } shadow-lg`}
                    >
                      <span className="ml-4 text-[#FFD700] text-lg">
                        {option || `Option ${index + 1}`}
                      </span>
                    </motion.div>
                  ))}
                  
                  {currentSlide.questionType === "openEnded" && (
                    <motion.div
                      whileHover={{ scale: 1.02, x: 5 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="text-[#FFD700] text-lg font-medium mb-2">Open-Ended Answers:</div>
                      {currentSlide.sampleAnswers && currentSlide.sampleAnswers.map((answer, index) => (
                        <div
                          key={index}
                          className="flex items-center p-4 rounded-xl border-2 border-[#FFD700] bg-gradient-to-r from-[#700000] to-[#600000] shadow-lg"
                        >
                          <span className="ml-4 text-[#FFD700] text-lg">
                            {answer || `Sample answer ${index + 1}`}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Information Section */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="w-full lg:w-1/2 p-8 bg-gradient-to-br from-[#8B0000] to-[#700000] rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <h2 className="text-3xl text-[#FFD700] font-bold mb-8 tracking-wide">Slide Information</h2>
              <div className="space-y-8">
                {/* Slide Navigation */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Slide:</label>
                  <div className="flex flex-wrap gap-3">
                    {setData.slides.map((_, index) => (
                      <motion.button
                        key={index}
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        type="button"
                        onClick={() => setCurrentSlideIndex(index)}
                        className={`px-5 py-3 rounded-xl font-bold shadow-lg ${
                          currentSlideIndex === index
                            ? "bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000]"
                            : "bg-gradient-to-r from-[#700000] to-[#600000] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#8B0000]"
                        } transition-all duration-300`}
                      >
                        {index + 1}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Correct Answer */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">
                    {currentSlide.questionType === "multipleCorrect" ? "Correct Answers:" : 
                     currentSlide.questionType === "openEnded" ? "Sample Answers:" : "Correct Answer:"}
                  </label>
                  {currentSlide.questionType === "multipleCorrect" ? (
                    <div className="space-y-2">
                      {currentSlide.correctAnswers && currentSlide.correctAnswers.map((answer, index) => (
                        <motion.div 
                          key={index}
                          className="p-4 bg-gradient-to-r from-[#700000] to-[#600000] rounded-xl border-2 border-[#FFD700] text-[#FFD700] text-lg shadow-lg"
                          whileHover={{ scale: 1.02 }}
                        >
                          {answer || `Correct answer ${index + 1}`}
                        </motion.div>
                      ))}
                    </div>
                  ) : currentSlide.questionType === "openEnded" ? (
                    <div className="space-y-2">
                      {currentSlide.sampleAnswers && currentSlide.sampleAnswers.map((answer, index) => (
                        <motion.div 
                          key={index}
                          className="p-4 bg-gradient-to-r from-[#700000] to-[#600000] rounded-xl border-2 border-[#FFD700] text-[#FFD700] text-lg shadow-lg"
                          whileHover={{ scale: 1.02 }}
                        >
                          {answer || `Sample answer ${index + 1}`}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      className="p-4 bg-gradient-to-r from-[#700000] to-[#600000] rounded-xl border-2 border-[#FFD700] text-[#FFD700] text-lg shadow-lg"
                      whileHover={{ scale: 1.02 }}
                    >
                      {currentSlide.correctAnswer || "No correct answer set"}
                    </motion.div>
                  )}
                </div>

                {/* Download Set Button */}
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={downloadSet}
                  className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Download Set
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Study Modes Modal */}
      <AnimatePresence>
        {showStudyModes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-[#8B0000] to-[#700000] rounded-2xl shadow-2xl border border-[#ffffff20] p-8 max-w-4xl w-full"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl text-[#FFD700] font-bold tracking-wide">Choose Study Mode</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowStudyModes(false)}
                  className="text-[#FFD700] hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studyModes.map((mode, index) => (
                  <motion.button
                    key={mode.title}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleModeSelect(mode)}
                    className={`${mode.gradient} p-6 rounded-xl shadow-lg border border-white/10 hover:shadow-xl transition-all duration-300`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <mode.icon className="text-4xl text-white mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">{mode.title}</h3>
                      <p className="text-white/80 text-sm">{mode.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
