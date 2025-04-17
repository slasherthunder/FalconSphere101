"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../components/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { saveAs } from 'file-saver';

// Animation variants
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
  const { id } = useParams();
  const router = useRouter();
  const [setData, setSetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch the set data from Firestore
  useEffect(() => {
    const fetchSetData = async () => {
      try {
        const docRef = doc(db, "sets", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSetData(data);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching set data: ", error);
        setError("Failed to load set data");
      } finally {
        setLoading(false);
      }
    };

    fetchSetData();
  }, [id]);

  // Handle answer selection
  const handleAnswerSelect = (option) => {
    setSelectedAnswer(option);
  };

  // Handle moving to the next question
  const handleNextQuestion = () => {
    if (selectedAnswer === setData.slides[currentSlideIndex].correctAnswer) {
      setScore(score + 1);
    }

    if (currentSlideIndex < setData.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
      setSelectedAnswer("");
    } else {
      setShowResult(true);
    }
  };

  // Restart the quiz
  const restartQuiz = () => {
    setCurrentSlideIndex(0);
    setSelectedAnswer("");
    setScore(0);
    setShowResult(false);
    setIsPlaying(false);
  };

  // Download the set as a JSON file
  const downloadSet = () => {
    try {
      const jsonString = JSON.stringify(setData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      saveAs(blob, `${setData.title.replace(/\s+/g, "_")}_set.json`);
      setSuccessMessage("Set downloaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setError("Failed to download set");
    }
  };

  // Start playing the set
  const startPlaying = () => {
    setIsPlaying(true);
    setCurrentSlideIndex(0);
    setSelectedAnswer("");
    setScore(0);
    setShowResult(false);
  };

  // Copy set to create a new one
  const handleCopySet = () => {
    localStorage.setItem('copiedSet', JSON.stringify({
      ...setData,
      title: `${setData.title} (Copy)`,
      createdAt: new Date().toISOString(),
    }));
    router.push('/create-set');
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-[#8B0000] to-[#600000] py-12 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-[#700000]/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-[#ffffff20] text-center"
        >
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-2xl font-semibold">Loading set...</p>
        </motion.div>
      </div>
    );
  }

  if (!setData) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-[#8B0000] to-[#600000] py-12 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-[#700000]/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-[#ffffff20] text-center"
        >
          <p className="text-[#FFD700] text-2xl font-semibold">Set not found.</p>
        </motion.div>
      </div>
    );
  }

  if (isPlaying) {
    const currentSlide = setData.slides[currentSlideIndex];
    
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-[#8B0000] to-[#600000] py-12 px-4 flex items-center justify-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-4xl"
        >
          {showResult ? (
            <motion.div
              className="bg-[#700000]/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-[#ffffff20] text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl text-[#FFD700] font-bold mb-6">Quiz Completed!</h2>
              <p className="text-2xl text-[#FFD700] mb-8">
                Your score: {score} out of {setData.slides.length}
              </p>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={restartQuiz}
                className="bg-[#FFD700] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#FFC300] transition-all duration-300"
              >
                Play Again
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              className="bg-[#700000]/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-[#ffffff20]"
              variants={cardVariants}
            >
              <div className="mb-6 flex justify-between items-center">
                <span className="text-[#FFD700] text-xl">
                  Question {currentSlideIndex + 1} of {setData.slides.length}
                </span>
                <span className="text-[#FFD700] text-xl">Score: {score}</span>
              </div>

              <motion.h3
                className="text-3xl text-[#FFD700] font-bold mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {currentSlide.question}
              </motion.h3>

              {currentSlide.imageData && (
                <motion.div
                  className="relative overflow-hidden rounded-xl mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <img
                    src={currentSlide.imageData}
                    alt="Question"
                    className="w-full h-auto max-h-96 object-contain rounded-xl shadow-lg"
                  />
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {currentSlide.options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAnswerSelect(option)}
                    className={`p-6 rounded-xl text-xl font-semibold transition-all duration-300 ${
                      selectedAnswer === option
                        ? option === currentSlide.correctAnswer
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                        : "bg-[#500000]/70 text-[#FFD700] hover:bg-[#FFD700] hover:text-[#8B0000]"
                    }`}
                    disabled={selectedAnswer !== ""}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>

              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleNextQuestion}
                disabled={!selectedAnswer}
                className={`w-full py-4 rounded-xl font-bold text-xl shadow-lg transition-all duration-300 ${
                  selectedAnswer
                    ? "bg-[#FFD700] text-[#8B0000] hover:bg-[#FFC300]"
                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                }`}
              >
                {currentSlideIndex < setData.slides.length - 1 ? "Next Question" : "Finish Quiz"}
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  const currentSlide = setData.slides[currentSlideIndex];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#8B0000] to-[#600000] py-12 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        <motion.div 
          className="bg-[#700000]/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-[#ffffff20] overflow-hidden"
          whileHover={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <motion.h2 
              className="text-5xl text-[#FFD700] font-bold"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Study Set: {setData.title}
            </motion.h2>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleCopySet}
                className="flex items-center gap-2 bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#FFC300] transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Copy Set</span>
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={startPlaying}
                className="flex items-center gap-2 bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#FFC300] transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Play Set</span>
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={downloadSet}
                className="flex items-center gap-2 bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#FFC300] transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download</span>
              </motion.button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-600/90 backdrop-blur-sm text-white p-4 rounded-lg mb-6 shadow-lg flex items-start gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>{error}</div>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-600/90 backdrop-blur-sm text-white p-4 rounded-lg mb-6 shadow-lg flex items-start gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>{successMessage}</div>
            </motion.div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Preview Section */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="w-full lg:w-1/2 p-8 bg-[#600000]/90 backdrop-blur-sm rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-3xl text-[#FFD700] font-bold">Preview</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[#FFD700] text-lg">
                    Slide {currentSlideIndex + 1} of {setData.slides.length}
                  </span>
                </div>
              </div>

              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div 
                  className="text-[#FFD700] text-4xl font-semibold mb-4"
                  whileHover={{ scale: 1.01 }}
                >
                  {setData.title}
                </motion.div>
                <motion.div 
                  className="text-[#FFD700] text-xl font-semibold"
                  whileHover={{ scale: 1.01 }}
                >
                  {currentSlide.question || "Question:"}
                </motion.div>
                {currentSlide.imageData && (
                  <motion.div
                    className="relative overflow-hidden rounded-xl"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={currentSlide.imageData}
                      alt="Question"
                      className="w-full h-auto max-h-96 object-contain rounded-xl shadow-lg"
                    />
                  </motion.div>
                )}
                <div className="space-y-3">
                  {currentSlide.options.map((option, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, x: 5 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center p-4 rounded-xl border-2 ${
                        option === currentSlide.correctAnswer
                          ? "border-green-500 bg-green-900/50"
                          : "border-[#FFD700] bg-[#500000]/70"
                      } backdrop-blur-sm shadow-lg`}
                    >
                      <span className="ml-4 text-[#FFD700] text-lg">
                        {option || `Option ${index + 1}`}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Information Section */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="w-full lg:w-1/2 p-8 bg-[#600000]/90 backdrop-blur-sm rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <h2 className="text-3xl text-[#FFD700] font-bold mb-8">Slide Navigation</h2>
              <div className="space-y-8">
                {/* Slide Navigation */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3">Go to Slide:</label>
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
                            ? "bg-[#FFD700] text-[#8B0000]"
                            : "bg-[#500000]/70 text-[#FFD700] hover:bg-[#FFD700] hover:text-[#8B0000]"
                        } transition-all duration-300`}
                      >
                        {index + 1}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Correct Answer */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3">Correct Answer:</label>
                  <motion.div 
                    className="p-4 bg-[#500000]/70 backdrop-blur-sm rounded-xl border-2 border-[#FFD700] text-[#FFD700] text-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    {currentSlide.correctAnswer || "No correct answer set"}
                  </motion.div>
                </div>

                {/* Set Details */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3">Set Details:</label>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-[#500000]/70 backdrop-blur-sm rounded-xl border-2 border-[#FFD700]/30 text-[#FFD700]">
                      <div className="text-sm text-[#FFD700]/80">Total Questions</div>
                      <div className="text-xl font-bold">{setData.slides.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
