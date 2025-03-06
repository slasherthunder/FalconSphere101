"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // Import useRouter
import { db } from "../../../../components/firebase"; // Import Firestore instance
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { motion, AnimatePresence } from "framer-motion"; // Import framer-motion

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
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <div className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-6xl mx-4 text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-4xl text-[#FFD700] font-bold">Play Set: {setData.title}</h2>
          {/* Add a button to navigate back to the Study Set page */}
          <button
            onClick={navigateToStudySet}
            className="mt-4 sm:mt-0 bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
          >
            Back to Study Set
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-8">
          {/* Quiz Section */}
          <motion.div
            key={currentSlideIndex}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.5 }}
            className="w-full p-6 bg-[#600000] rounded-lg"
          >
            <h2 className="text-2xl text-[#FFD700] font-bold mb-6">Quiz</h2>
            <div className="space-y-4">
              <div className="text-[#FFD700] text-lg font-semibold">
                {currentSlide.question || "Question:"}
              </div>
              {currentSlide.image && (
                <div className="relative overflow-hidden rounded">
                  <img
                    src={currentSlide.image}
                    alt="Question"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-2">
                {currentSlide.options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 rounded-lg border ${
                      option === selectedAnswer
                        ? "border-[#FFD700] bg-[#500000]"
                        : "border-[#FFD700] bg-[#500000]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="quiz-answer"
                      value={option}
                      checked={option === selectedAnswer}
                      onChange={() => handleAnswerSelect(option)}
                      className="form-radio h-5 w-5 text-[#FFD700] border-2 border-[#FFD700]"
                    />
                    <span className="ml-3 text-[#FFD700] text-lg">
                      {option || `Option ${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Question Button */}
            <button
              onClick={handleNextQuestion}
              className="mt-6 bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
            >
              Next Question
            </button>
          </motion.div>
        </div>

        {/* Result Section */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="mt-8 p-6 bg-[#600000] rounded-lg"
            >
              <h2 className="text-2xl text-[#FFD700] font-bold mb-6">Quiz Result</h2>
              <p className="text-[#FFD700] text-lg">
                You scored {score} out of {setData.slides.length}!
              </p>
              <button
                onClick={restartQuiz}
                className="mt-6 bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
              >
                Restart Quiz
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
