"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../components/firebase"; // Import Firestore instance
import { doc, getDoc, setDoc } from "firebase/firestore"; // Import Firestore functions
import { motion } from "framer-motion"; // For animations
import { getAuth } from "firebase/auth"; // Import Firebase Authentication

export default function StudySet() {
  const { id } = useParams(); // Get the set ID from the URL
  const [setData, setSetData] = useState(null); // State to store the set data
  const [loading, setLoading] = useState(true); // State to handle loading
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0); // Track current slide
  const [selectedAnswer, setSelectedAnswer] = useState(""); // Track user's selected answer
  const [score, setScore] = useState(0); // Track user's score
  const [showResult, setShowResult] = useState(false); // Show result after quiz ends
  const [imageBoxSize, setImageBoxSize] = useState({ width: 100, height: 12, unit: "%" }); // Default image box size
  const auth = getAuth(); // Firebase Authentication instance

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

  // Fetch user preferences on component load
  useEffect(() => {
    const fetchUserPreferences = async () => {
      const user = auth.currentUser;
      if (user) {
        const userPrefsRef = doc(db, "userPreferences", user.uid);
        const userPrefsSnap = await getDoc(userPrefsRef);

        if (userPrefsSnap.exists()) {
          const userPrefs = userPrefsSnap.data();
          if (userPrefs.imageBoxSize) {
            setImageBoxSize(userPrefs.imageBoxSize); // Load saved preferences
          }
        }
      }
    };

    fetchUserPreferences();
  }, [auth]);

  // Save user preferences to Firestore
  const saveUserPreferences = async () => {
    const user = auth.currentUser;
    if (user) {
      const userPrefsRef = doc(db, "userPreferences", user.uid);
      await setDoc(userPrefsRef, { imageBoxSize }, { merge: true }); // Save preferences
      console.log("User preferences saved!");
    }
  };

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

  // Handle image box size change
  const handleImageBoxSizeChange = (e, dimension) => {
    const value = e.target.value;
    setImageBoxSize((prevSize) => ({
      ...prevSize,
      [dimension]: value,
    }));
  };

  // Handle unit change
  const handleUnitChange = (e) => {
    const unit = e.target.value;
    setImageBoxSize((prevSize) => ({
      ...prevSize,
      unit,
    }));
  };

  // Save preferences when imageBoxSize changes
  useEffect(() => {
    saveUserPreferences();
  }, [imageBoxSize]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#8B0000] py-8 flex items-center justify-center">
        <p className="text-[#FFD700] text-2xl">Loading...</p>
      </div>
    );
  }

  if (!setData) {
    return (
      <div className="min-h-screen bg-[#8B0000] py-8 flex items-center justify-center">
        <p className="text-[#FFD700] text-2xl">Set not found.</p>
      </div>
    );
  }

  const currentSlide = setData.slides[currentSlideIndex];

  return (
    <div className="min-h-screen bg-[#8B0000] py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#FFD700] mb-4">Quiz: {setData.title}</h1>
        <div className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-6xl mx-auto text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]">
          {!showResult ? (
            <>
              {/* Quiz Section */}
              <div className="w-full p-6 bg-[#600000] rounded-lg">
                <h2 className="text-2xl text-[#FFD700] font-bold mb-6">
                  Question {currentSlideIndex + 1} of {setData.slides.length}
                </h2>
                <div className="space-y-4">
                  <div className="text-[#FFD700] text-lg font-semibold">
                    {currentSlide.question}
                  </div>
                  {currentSlide.image && (
                    <div
                      className="relative overflow-hidden rounded"
                      style={{
                        width: `${imageBoxSize.width}${imageBoxSize.unit}`,
                        height: `${imageBoxSize.height}${imageBoxSize.unit}`,
                      }}
                    >
                      <img
                        src={currentSlide.image}
                        alt="Question"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    {currentSlide.options.map((option, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        className={`w-full p-3 bg-[#500000] rounded-lg border border-[#FFD700] text-[#FFD700] text-lg text-left ${
                          selectedAnswer === option
                            ? "bg-[#FFD700] text-[#8B0000]"
                            : "hover:bg-[#FFD700] hover:text-[#8B0000]"
                        } transition duration-300`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {option || `Option ${index + 1}`}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Image Box Size Controls */}
              <div className="mt-6">
                <label className="block text-[#FFD700] font-medium mb-2">Image Box Size:</label>
                <div className="flex gap-4 justify-center">
                  <div>
                    <label className="block text-[#FFD700] font-medium mb-2">Width:</label>
                    <input
                      type="number"
                      value={imageBoxSize.width}
                      onChange={(e) => handleImageBoxSizeChange(e, "width")}
                      className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                      placeholder="Width"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[#FFD700] font-medium mb-2">Height:</label>
                    <input
                      type="number"
                      value={imageBoxSize.height}
                      onChange={(e) => handleImageBoxSizeChange(e, "height")}
                      className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                      placeholder="Height"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[#FFD700] font-medium mb-2">Unit:</label>
                    <select
                      value={imageBoxSize.unit}
                      onChange={handleUnitChange}
                      className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    >
                      <option value="%">%</option>
                      <option value="px">px</option>
                      <option value="rem">rem</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <button
                onClick={handleNextQuestion}
                disabled={!selectedAnswer}
                className="mt-6 bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentSlideIndex < setData.slides.length - 1
                  ? "Next Question"
                  : "Finish Quiz"}
              </button>
            </>
          ) : (
            /* Result Section */
            <div className="w-full p-6 bg-[#600000] rounded-lg">
              <h2 className="text-2xl text-[#FFD700] font-bold mb-6">Quiz Result</h2>
              <div className="text-[#FFD700] text-lg font-semibold">
                You scored {score} out of {setData.slides.length}!
              </div>
              <button
                onClick={restartQuiz}
                className="mt-6 bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
              >
                Restart Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
