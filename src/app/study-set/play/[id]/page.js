"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // Import useRouter
import { db } from "../../../../components/firebase"; // Import Firestore instance
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { motion, AnimatePresence } from "framer-motion"; // Import framer-motion

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
  const { id } = useParams(); // Get the set ID from the URL
  const router = useRouter(); // Initialize the router
  const [setData, setSetData] = useState(null); // State to store the set data
  const [loading, setLoading] = useState(true); // State to handle loading
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0); // Track current slide
  const [selectedAnswer, setSelectedAnswer] = useState(""); // Track user's selected answer
  const [score, setScore] = useState(0); // Track user's score
  const [showResult, setShowResult] = useState(false); // Show result after quiz ends

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

  // Handle answer selection
  const handleAnswerSelect = (option) => {
    setSelectedAnswer(option);
  };

  // Handle moving to the next question
  const handleNextQuestion = () => {
    if (selectedAnswer === setData.slides[currentSlideIndex].correctAnswer) {
      setScore(score + 1); // Increment score if the answer is correct
    }

    // Move to the next question
    if (currentSlideIndex < setData.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
      setSelectedAnswer(""); // Reset selected answer for the next question
    } else {
      setShowResult(true); // Show result if all questions are answered
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
        className="min-h-screen bg-[#8B0000] py-8 flex items-center justify-center"
      >
        <p className="text-[#FFD700] text-2xl">Loading...</p>
      </motion.div>
    );
  }

  if (!setData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-[#8B0000] py-8 flex items-center justify-center"
      >
        <p className="text-[#FFD700] text-2xl">Set not found.</p>
      </motion.div>
    );
  }

  const currentSlide = setData.slides[currentSlideIndex];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#8B0000] to-[#600000] py-12 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
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
              {setData.title}
            </motion.h2>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={navigateToStudySet}
              className="mt-4 sm:mt-0 bg-[#FFD700] text-[#8B0000] px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-[#FFC300] transition-all duration-300"
            >
              Back to Study Set
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row gap-8">
            <motion.div
              key={currentSlideIndex}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="w-full p-8 bg-[#600000]/90 backdrop-blur-sm rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div 
                  className="text-[#FFD700] text-3xl font-semibold mb-8"
                  whileHover={{ scale: 1.01 }}
                >
                  Question {currentSlideIndex + 1} of {setData.slides.length}
                </motion.div>
                <motion.div 
                  className="text-[#FFD700] text-2xl font-medium mb-6"
                  whileHover={{ scale: 1.01 }}
                >
                  {currentSlide.question}
                </motion.div>

                {currentSlide.image && (
                  <motion.div
                    className="relative overflow-hidden rounded-xl mb-8"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={currentSlide.image}
                      alt="Question"
                      className="w-full h-full object-cover rounded-xl shadow-lg"
                    />
                  </motion.div>
                )}

                <div className="space-y-4">
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
                      className={`flex items-center p-6 rounded-xl border-2 cursor-pointer ${
                        option === selectedAnswer
                          ? "border-[#FFD700] bg-[#500000]/90"
                          : "border-[#FFD700]/50 bg-[#500000]/50 hover:border-[#FFD700]"
                      } backdrop-blur-sm shadow-lg transition-all duration-300`}
                    >
                      <input
                        type="radio"
                        name="quiz-answer"
                        value={option}
                        checked={option === selectedAnswer}
                        onChange={() => handleAnswerSelect(option)}
                        className="form-radio h-6 w-6 text-[#FFD700] border-2 border-[#FFD700]"
                      />
                      <span className="ml-4 text-[#FFD700] text-xl">
                        {option}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextQuestion}
                  className="w-full mt-8 bg-[#FFD700] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#FFC300] transition-all duration-300"
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
                className="mt-8 p-8 bg-[#600000]/90 backdrop-blur-sm rounded-xl shadow-xl border border-[#ffffff10]"
              >
                <motion.h2 
                  className="text-4xl text-[#FFD700] font-bold mb-6"
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
                  className="text-6xl text-[#FFD700] font-bold mb-8"
                >
                  {Math.round((score / setData.slides.length) * 100)}%
                </motion.div>
                <motion.p 
                  className="text-[#FFD700] text-2xl mb-8"
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
                  className="bg-[#FFD700] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#FFC300] transition-all duration-300"
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
