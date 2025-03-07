"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../components/firebase"; // Import Firestore instance
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"; // Import Firestore functions
import { Filter } from "bad-words"; // Import the profanity filter

// Initialize the profanity filter
const filter = new Filter();

export default function EditSet() {
  const { id } = useParams(); // Get the set ID from the URL
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slides, setSlides] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      image: null,
    },
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const currentSlide = slides[currentSlideIndex];

  // Validate for profanity
  const validateProfanity = (text) => {
    return filter.isProfane(text);
  };

  // Handle saving the set
  const handleSaveSet = async () => {
    // Check for profanity in the title
    if (validateProfanity(title)) {
      setError("Title contains inappropriate language. Please revise.");
      return;
    }

    // Check for profanity in the slides
    for (const slide of slides) {
      if (validateProfanity(slide.question)) {
        setError(`Question in slide ${slides.indexOf(slide) + 1} contains inappropriate language. Please revise.`);
        return;
      }
      for (const option of slide.options) {
        if (validateProfanity(option)) {
          setError(`Option in slide ${slides.indexOf(slide) + 1} contains inappropriate language. Please revise.`);
          return;
        }
      }
    }

    // Check if correct answer is one of the options
    if (!currentSlide.options.includes(currentSlide.correctAnswer)) {
      setError("Correct answer must be one of the options.");
      return;
    }

    // Proceed with saving if no profanity is found
    try {
      const docRef = doc(db, "sets", id);
      await updateDoc(docRef, {
        title,
        slides,
      });
      alert("Set updated successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error updating set: ", error);
      setError("Failed to update the set. Please try again.");
    }
  };

  // Handle deleting the set
  const handleDeleteSet = async () => {
    try {
      const docRef = doc(db, "sets", id);
      await deleteDoc(docRef);
      alert("Set deleted successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error deleting set: ", error);
      setError("Failed to delete the set. Please try again.");
    }
  };

  // Handle deleting a slide
  const handleDeleteSlide = (index) => {
    if (slides.length > 1) {
      const updatedSlides = slides.filter((_, i) => i !== index);
      setSlides(updatedSlides);
      setCurrentSlideIndex(Math.min(currentSlideIndex, updatedSlides.length - 1));
    } else {
      setError("A set must have at least one slide.");
    }
  };

  // Fetch set data on component mount
  useEffect(() => {
    const fetchSetData = async () => {
      try {
        const docRef = doc(db, "sets", id); // Reference to the specific set
        const docSnap = await getDoc(docRef); // Fetch the document

        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title);
          setSlides(data.slides || [
            {
              question: "",
              options: ["", "", "", ""],
              correctAnswer: "",
              image: null,
            },
          ]);
        } else {
          setError("No such document!");
        }
      } catch (error) {
        console.error("Error fetching set data: ", error);
        setError("Failed to fetch data, please try again.");
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchSetData();
  }, [id]);

  // Handle other functions like slide management ...
  const handleQuestionChange = (question) => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].question = question;
    setSlides(updatedSlides);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      const updatedSlides = [...slides];
      const reader = new FileReader();
      reader.onloadend = () => {
        updatedSlides[currentSlideIndex].image = reader.result;
        setSlides(updatedSlides);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please upload a valid JPEG or PNG image.");
    }
  };

  const handleAddSlide = () => {
    setSlides([
      ...slides,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        image: null,
      },
    ]);
    setCurrentSlideIndex(slides.length);
  };

  const handleRemoveImage = () => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].image = null;
    setSlides(updatedSlides);
  };

  const handleOptionChange = (index, value) => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].options[index] = value;
    setSlides(updatedSlides);
  };

  const handleAddOption = () => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].options.push("");
    setSlides(updatedSlides);
  };

  const handleRemoveOption = (index) => {
    if (currentSlide.options.length > 2) {
      const updatedSlides = [...slides];
      updatedSlides[currentSlideIndex].options.splice(index, 1);
      setSlides(updatedSlides);
    } else {
      setError("A question must have at least 2 options.");
    }
  };

  const handleCorrectAnswerChange = (correctAnswer) => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].correctAnswer = correctAnswer;
    setSlides(updatedSlides);
  };

  if (loading) {
    return <div className="text-[#FFD700] text-2xl">Loading...</div>; // Loading state
  }

  return (
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <div className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-6xl mx-4 text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-4xl text-[#FFD700] font-bold">Edit Set</h2>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-8">
          {/* Preview Section */}
          <div className="w-full sm:w-1/2 p-6 bg-[#600000] rounded-lg">
            <h2 className="text-2xl text-[#FFD700] font-bold mb-6">Preview</h2>
            <div className="space-y-4">
              <div className="text-[#FFD700] text-3xl font-semibold mb-2">
                {title || "Name of Set"}
              </div>
              <div className="text-[#FFD700] text-lg font-semibold">
                {currentSlide.question || "Question:"}
              </div>
              {currentSlide.image && (
                <div
                  className="relative overflow-hidden rounded"
                  style={{
                    width: "100%",
                    height: "auto",
                  }}
                >
                  <img
                    src={currentSlide.image}
                    alt="Question"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    aria-label="Remove Image"
                    className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded-full transition duration-300 ease-in-out transform hover:bg-red-700 hover:scale-105"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="space-y-2">
                {currentSlide.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 rounded-lg border border-[#FFD700] bg-[#500000]"
                  >
                    <input
                      type="radio"
                      name="preview-answer"
                      value={option}
                      checked={option === currentSlide.correctAnswer}
                      readOnly
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

          {/* Edit Section */}
          <div className="w-full sm:w-1/2 p-6 bg-[#600000] rounded-lg">
            <h2 className="text-2xl text-[#FFD700] font-bold mb-6">Edit Set</h2>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {/* Set Title */}
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  placeholder="Enter title"
                />
              </div>

              {/* Slide Navigation */}
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Slide:</label>
                <div className="flex gap-2">
                  {slides.map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button
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
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(index)}
                        className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition duration-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddSlide}
                    className="px-4 py-2 rounded-lg font-bold bg-[#FFD700] text-[#8B0000] hover:bg-[#FFC300] transition duration-300"
                    aria-label="Add Slide"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Question:</label>
                <input
                  type="text"
                  value={currentSlide.question}
                  onChange={(e) => handleQuestionChange(e.target.value)}
                  className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  placeholder="Enter your question"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Image:</label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Options:</label>
                {currentSlide.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                      placeholder={`Enter a possible answer`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition duration-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
                >
                  Add Option
                </button>
              </div>

              {/* Correct Answer */}
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Correct Answer:</label>
                <select
                  value={currentSlide.correctAnswer}
                  onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                  className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                >
                  <option value="">Select correct answer</option>
                  {currentSlide.options.map((option, index) => (
                    <option key={index} value={option}>
                      {option || `Option ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Set Button */}
              <button
                onClick={handleSaveSet}
                className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
              >
                Save Set
              </button>

              {/* Delete Set Button */}
              <button
                onClick={handleDeleteSet}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition duration-300 transform hover:scale-110"
              >
                Delete Set
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
