"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../components/firebase"; // Import Firestore instance
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { motion } from "framer-motion"; // For animations

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
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <div className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-6xl mx-4 text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-4xl text-[#FFD700] font-bold">Study Set: {setData.title}</h2>
          <button
            onClick={navigateToPlaySet}
            className="mt-4 sm:mt-0 bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
          >
            Play Set
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-8">
          {/* Preview Section (Left Side) */}
          <div className="w-full sm:w-1/2 p-6 bg-[#600000] rounded-lg">
            <h2 className="text-2xl text-[#FFD700] font-bold mb-6">Preview</h2>
            <div className="space-y-4">
              <div className="text-[#FFD700] text-3xl font-semibold mb-2">
                {setData.title}
              </div>
              <div className="text-[#FFD700] text-lg font-semibold">
                {currentSlide.question || "Question:"}
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
                  <div
                    key={index}
                    className={`flex items-center p-3 rounded-lg border ${
                      option === currentSlide.correctAnswer
                        ? "border-green-500 bg-green-900"
                        : "border-[#FFD700] bg-[#500000]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="preview-answer"
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
          </div>

          {/* Information Section (Right Side) */}
          <div className="w-full sm:w-1/2 p-6 bg-[#600000] rounded-lg">
            <h2 className="text-2xl text-[#FFD700] font-bold mb-6">Slide Information</h2>
            <div className="space-y-6">
              {/* Slide Navigation */}
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Slide:</label>
                <div className="flex gap-2">
                  {setData.slides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentSlideIndex(index)}
                      className={`px-4 py-2 rounded-lg font-bold ${
                        currentSlideIndex === index
                          ? "bg-[#FFD700] text-[#8B0000]"
                          : "bg-[#500000] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#8B0000]"
                      } transition duration-300`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Correct Answer */}
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Correct Answer:</label>
                <div className="p-3 bg-[#500000] rounded-lg border border-[#FFD700] text-[#FFD700]">
                  {currentSlide.correctAnswer || "No correct answer set"}
                </div>
              </div>

              {/* Image Box Size */}
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Image Box Size:</label>
                <div className="flex gap-4">
                  <div>
                    <label className="block text-[#FFD700] font-medium mb-2">Width:</label>
                    <input
                      type="number"
                      value={imageBoxSize.width}
                      onChange={(e) =>
                        setImageBoxSize((prev) => ({ ...prev, width: e.target.value }))
                      }
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
                      onChange={(e) =>
                        setImageBoxSize((prev) => ({ ...prev, height: e.target.value }))
                      }
                      className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                      placeholder="Height"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[#FFD700] font-medium mb-2">Unit:</label>
                    <select
                      value={imageBoxSize.unit}
                      onChange={(e) =>
                        setImageBoxSize((prev) => ({ ...prev, unit: e.target.value }))
                      }
                      className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    >
                      <option value="%">%</option>
                      <option value="px">px</option>
                      <option value="rem">rem</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Download Set Button */}
              <button
                onClick={downloadSet}
                className="mt-6 bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
              >
                Download Set
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
