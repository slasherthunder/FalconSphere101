"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../components/firebase"; // Import Firestore instance
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { motion, AnimatePresence } from "framer-motion"; // For animations

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
  const [score, setScore] = useState(0); // Track user's score
  const [showResult, setShowResult] = useState(false); // Show result after quiz ends
  const [imageBoxSize, setImageBoxSize] = useState({ width: 100, height: 12, unit: "%" }); // Default image box size

  // Fetch the set data from Firestore
  useEffect(() => {
    const fetchSetData = async () => {
      try {
        const docRef = doc(db, "sets", id); // Reference to the specific set
        const docSnap = await getDoc(docRef); // Fetch the document

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSetData(data);

          // Load saved image box size if it exists
          if (data.imageBoxSize) {
            setImageBoxSize(data.imageBoxSize);
          }
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

  // Navigate to the play set page
  const navigateToPlaySet = () => {
    router.push(`/study-set/play/${id}`);
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
                className="bg-[#FFD700] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#FFC300] transition-all duration-300"
              >
                Copy Set
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={navigateToPlaySet}
                className="bg-[#FFD700] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#FFC300] transition-all duration-300"
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
              className="w-full lg:w-1/2 p-8 bg-[#600000]/90 backdrop-blur-sm rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <h2 className="text-3xl text-[#FFD700] font-bold mb-8">Preview</h2>
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
                {currentSlide.image && (
                  <motion.div
                    className="relative overflow-hidden rounded-xl"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: `${imageBoxSize.width}${imageBoxSize.unit}`,
                      height: `${imageBoxSize.height}${imageBoxSize.unit}`,
                    }}
                  >
                    <img
                      src={currentSlide.image}
                      alt="Question"
                      className="w-full h-full object-cover rounded-xl shadow-lg"
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
                      <input
                        type="radio"
                        name="preview-answer"
                        value={option}
                        checked={option === selectedAnswer}
                        onChange={() => handleAnswerSelect(option)}
                        className="form-radio h-6 w-6 text-[#FFD700] border-2 border-[#FFD700]"
                      />
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
              <h2 className="text-3xl text-[#FFD700] font-bold mb-8">Slide Information</h2>
              <div className="space-y-8">
                {/* Slide Navigation */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3">Slide:</label>
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

                {/* Image Box Size */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3">Image Box Size:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[#FFD700] text-sm font-medium mb-2">Width:</label>
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="number"
                        value={imageBoxSize.width}
                        onChange={(e) =>
                          setImageBoxSize((prev) => ({ ...prev, width: e.target.value }))
                        }
                        className="w-full p-4 border-2 rounded-xl bg-[#500000]/70 text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 border-[#FFD700]"
                        placeholder="Width"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[#FFD700] text-sm font-medium mb-2">Height:</label>
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type="number"
                        value={imageBoxSize.height}
                        onChange={(e) =>
                          setImageBoxSize((prev) => ({ ...prev, height: e.target.value }))
                        }
                        className="w-full p-4 border-2 rounded-xl bg-[#500000]/70 text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 border-[#FFD700]"
                        placeholder="Height"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[#FFD700] text-sm font-medium mb-2">Unit:</label>
                      <motion.select
                        whileFocus={{ scale: 1.02 }}
                        value={imageBoxSize.unit}
                        onChange={(e) =>
                          setImageBoxSize((prev) => ({ ...prev, unit: e.target.value }))
                        }
                        className="w-full p-4 border-2 rounded-xl bg-[#500000]/70 text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 border-[#FFD700]"
                      >
                        <option value="%">%</option>
                        <option value="px">px</option>
                        <option value="rem">rem</option>
                      </motion.select>
                    </div>
                  </div>
                </div>

                {/* Download Set Button */}
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={downloadSet}
                  className="w-full bg-[#FFD700] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#FFC300] transition-all duration-300"
                >
                  Download Set
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
