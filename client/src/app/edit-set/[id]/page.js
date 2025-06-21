"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../components/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Filter } from "bad-words";
import { motion, AnimatePresence } from "framer-motion";

// Initialize the profanity filter
const filter = new Filter();

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

export default function EditSet() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slides, setSlides] = useState([
    {
      question: "",
      questionType: "multipleChoice",
      options: ["", "", "", ""],
      correctAnswer: "",
      correctAnswers: [],
      sampleAnswers: [""],
      imageData: null,
    },
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const currentSlide = slides[currentSlideIndex];

  // Question type options
  const questionTypes = [
    { value: "multipleChoice", label: "Multiple Choice (Single Answer)" },
    { value: "multipleCorrect", label: "Multiple Choice (Multiple Answers)" },
    { value: "openEnded", label: "Open-Ended Answer" }
  ];

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

      // Validate based on question type
      if (slide.questionType === "multipleChoice") {
        for (const option of slide.options) {
          if (validateProfanity(option)) {
            setError(`Option in slide ${slides.indexOf(slide) + 1} contains inappropriate language. Please revise.`);
            return;
          }
        }
        // Check if correct answer is one of the options
        if (!slide.options.includes(slide.correctAnswer)) {
          setError(`Correct answer in slide ${slides.indexOf(slide) + 1} must be one of the options.`);
          return;
        }
      } else if (slide.questionType === "multipleCorrect") {
        for (const option of slide.options) {
          if (validateProfanity(option)) {
            setError(`Option in slide ${slides.indexOf(slide) + 1} contains inappropriate language. Please revise.`);
            return;
          }
        }
        // Check if all correct answers are in the options
        if (slide.correctAnswers && slide.correctAnswers.length > 0) {
          for (const correctAnswer of slide.correctAnswers) {
            if (!slide.options.includes(correctAnswer)) {
              setError(`Correct answer "${correctAnswer}" in slide ${slides.indexOf(slide) + 1} must be one of the options.`);
              return;
            }
          }
        }
      } else if (slide.questionType === "openEnded") {
        // Check all sample answers for profanity
        for (const sampleAnswer of slide.sampleAnswers) {
          if (validateProfanity(sampleAnswer)) {
            setError(`Open-ended answer in slide ${slides.indexOf(slide) + 1} contains inappropriate language. Please revise.`);
            return;
          }
        }
      }
    }

    // Proceed with saving if no profanity is found
    try {
      const docRef = doc(db, "sets", id);
      await updateDoc(docRef, {
        title,
        slides,
        updatedAt: new Date().toISOString(),
      });

      // Update the set in local storage
      const storedUserSets = JSON.parse(localStorage.getItem("userSets")) || [];
      const updatedUserSets = storedUserSets.map((set) =>
        set.id === id ? { ...set, title, slides } : set
      );
      localStorage.setItem("userSets", JSON.stringify(updatedUserSets));

      setSuccessMessage("Set updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating set: ", error);
      setError("Failed to update the set. Please try again.");
    }
  };

  // Handle deleting the set
  const handleDeleteSet = async () => {
    if (confirm("Are you sure you want to delete this set? This action cannot be undone.")) {
      try {
        const docRef = doc(db, "sets", id);
        await deleteDoc(docRef);

        // Remove the set from local storage
        const storedUserSets = JSON.parse(localStorage.getItem("userSets")) || [];
        const updatedUserSets = storedUserSets.filter((set) => set.id !== id);
        localStorage.setItem("userSets", JSON.stringify(updatedUserSets));

        router.push("/");
      } catch (error) {
        console.error("Error deleting set: ", error);
        setError("Failed to delete the set. Please try again.");
      }
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
        const docRef = doc(db, "sets", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title);
          setSlides(data.slides || [
            {
              question: "",
              questionType: "multipleChoice",
              options: ["", "", "", ""],
              correctAnswer: "",
              correctAnswers: [],
              sampleAnswers: [""],
              imageData: null,
            },
          ]);
        } else {
          setError("No such document!");
        }
      } catch (error) {
        console.error("Error fetching set data: ", error);
        setError("Failed to fetch data, please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSetData();
  }, [id]);

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
        updatedSlides[currentSlideIndex].imageData = reader.result;
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
        questionType: "multipleChoice",
        options: ["", "", "", ""],
        correctAnswer: "",
        correctAnswers: [],
        sampleAnswers: [""],
        imageData: null,
      },
    ]);
    setCurrentSlideIndex(slides.length);
  };

  const handleRemoveImage = () => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].imageData = null;
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

  const handleQuestionTypeChange = (questionType) => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].questionType = questionType;
    // Reset answer fields when changing question type
    updatedSlides[currentSlideIndex].correctAnswer = "";
    updatedSlides[currentSlideIndex].correctAnswers = [];
    updatedSlides[currentSlideIndex].sampleAnswers = [""];
    setSlides(updatedSlides);
  };

  const handleMultipleCorrectChange = (option, isChecked) => {
    const updatedSlides = [...slides];
    if (isChecked) {
      updatedSlides[currentSlideIndex].correctAnswers = [
        ...(updatedSlides[currentSlideIndex].correctAnswers || []),
        option
      ];
    } else {
      updatedSlides[currentSlideIndex].correctAnswers = 
        (updatedSlides[currentSlideIndex].correctAnswers || []).filter(ans => ans !== option);
    }
    setSlides(updatedSlides);
  };

  const handleSampleAnswerChange = (index, value) => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].sampleAnswers[index] = value;
    setSlides(updatedSlides);
  };

  const handleAddSampleAnswer = () => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].sampleAnswers.push("");
    setSlides(updatedSlides);
  };

  const handleRemoveSampleAnswer = (index) => {
    const updatedSlides = [...slides];
    if (updatedSlides[currentSlideIndex].sampleAnswers.length > 1) {
      updatedSlides[currentSlideIndex].sampleAnswers.splice(index, 1);
      setSlides(updatedSlides);
    } else {
      setError("At least one open-ended answer is required");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white py-12 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-[#8B0000] p-8 rounded-2xl shadow-2xl border border-[#ffffff20] text-center"
        >
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#FFD700] text-2xl font-semibold">Loading set...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white py-12 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        <motion.div 
          className="bg-[#8B0000] p-8 rounded-2xl shadow-2xl border border-[#ffffff20] overflow-hidden"
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
              Edit Set: {title}
            </motion.h2>
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
              className="w-full lg:w-1/2 p-8 bg-[#8B0000] rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-3xl text-[#FFD700] font-bold tracking-wide">Preview</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[#FFD700] text-lg">
                    Slide {currentSlideIndex + 1} of {slides.length}
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
                  className="text-[#FFD700] text-4xl font-semibold mb-4 tracking-wide"
                  whileHover={{ scale: 1.01 }}
                >
                  {title || "Name of Set"}
                </motion.div>
                <motion.div 
                  className="text-[#FFD700] text-xl font-semibold tracking-wide"
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
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm text-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg"
                    >
                      ×
                    </motion.button>
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
                          ? "border-green-500 bg-green-900/50"
                          : "border-[#FFD700] bg-[#700000]"
                      } backdrop-blur-sm shadow-lg`}
                    >
                      <input
                        type="radio"
                        name="preview-answer"
                        value={option}
                        checked={option === currentSlide.correctAnswer}
                        readOnly
                        className="form-radio h-6 w-6 text-[#FFD700] border-2 border-[#FFD700]"
                      />
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
                          ? "border-green-500 bg-green-900/50"
                          : "border-[#FFD700] bg-[#700000]"
                      } backdrop-blur-sm shadow-lg`}
                    >
                      <input
                        type="checkbox"
                        checked={currentSlide.correctAnswers && currentSlide.correctAnswers.includes(option)}
                        readOnly
                        className="form-checkbox h-6 w-6 text-[#FFD700] border-2 border-[#FFD700]"
                      />
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
                          className="flex items-center p-4 rounded-xl border-2 border-[#FFD700] bg-[#700000] backdrop-blur-sm shadow-lg"
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

            {/* Edit Section */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="w-full lg:w-1/2 p-8 bg-[#8B0000] rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <h2 className="text-3xl text-[#FFD700] font-bold mb-8 tracking-wide">Edit Set</h2>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                {/* Set Title */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Title:</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-4 border-2 rounded-xl bg-[#700000] text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300"
                    placeholder="Enter title"
                  />
                </div>

                {/* Slide Navigation */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Slide:</label>
                  <div className="flex flex-wrap gap-3">
                    {slides.map((_, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          type="button"
                          onClick={() => setCurrentSlideIndex(index)}
                          className={`px-5 py-3 rounded-xl font-bold shadow-lg ${
                            currentSlideIndex === index
                              ? "bg-[#FFD700] text-[#8B0000]"
                              : "bg-[#700000] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#8B0000]"
                          } transition-all duration-300`}
                        >
                          {index + 1}
                        </motion.button>
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          type="button"
                          onClick={() => handleDeleteSlide(index)}
                          className="bg-red-600/90 text-white w-10 h-10 rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg"
                        >
                          ×
                        </motion.button>
                      </div>
                    ))}
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      type="button"
                      onClick={handleAddSlide}
                      className="px-5 py-3 rounded-xl font-bold bg-[#FFD700] text-[#8B0000] hover:bg-[#FFC300] transition-all duration-300 shadow-lg"
                    >
                      +
                    </motion.button>
                  </div>
                </div>

                {/* Question */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Question:</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    value={currentSlide.question}
                    onChange={(e) => handleQuestionChange(e.target.value)}
                    className="w-full p-4 border-2 rounded-xl bg-[#700000] text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300"
                    placeholder="Enter your question"
                  />
                </div>

                {/* Question Type */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Question Type:</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    value={currentSlide.questionType}
                    onChange={(e) => handleQuestionTypeChange(e.target.value)}
                    className="w-full p-4 border-2 rounded-xl bg-[#700000] text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 border-[#FFD700]"
                  >
                    {questionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </motion.select>
                </div>

                {/* Image */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Image:</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="file"
                    onChange={handleImageChange}
                    className="w-full p-4 border-2 rounded-xl bg-[#700000] text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFD700] file:text-[#8B0000] hover:file:bg-[#FFC300]"
                  />
                </div>

                {/* Options - Only show for multiple choice questions */}
                {(currentSlide.questionType === "multipleChoice" || currentSlide.questionType === "multipleCorrect") && (
                  <div>
                    <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Options:</label>
                    <div className="space-y-3">
                      {currentSlide.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <motion.input
                            whileFocus={{ scale: 1.02 }}
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            className="flex-1 p-4 border-2 rounded-xl bg-[#700000] text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 border-[#FFD700]"
                            placeholder={`Enter a possible answer`}
                          />
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            type="button"
                            onClick={() => handleRemoveOption(index)}
                            className="bg-red-600/90 text-white w-12 h-12 rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg"
                          >
                            ×
                          </motion.button>
                        </div>
                      ))}
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        type="button"
                        onClick={handleAddOption}
                        className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-xl font-bold hover:bg-[#FFC300] transition-all duration-300 shadow-lg"
                      >
                        Add Option
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Correct Answer - Only show for single choice questions */}
                {currentSlide.questionType === "multipleChoice" && (
                  <div>
                    <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Correct Answer:</label>
                    <motion.select
                      whileFocus={{ scale: 1.02 }}
                      value={currentSlide.correctAnswer}
                      onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                      className="w-full p-4 border-2 rounded-xl bg-[#700000] text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 border-[#FFD700]"
                    >
                      <option value="">Select correct answer</option>
                      {currentSlide.options.map((option, index) => (
                        <option key={index} value={option}>
                          {option || `Option ${index + 1}`}
                        </option>
                      ))}
                    </motion.select>
                  </div>
                )}

                {/* Multiple Correct Answers */}
                {currentSlide.questionType === "multipleCorrect" && (
                  <div>
                    <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Correct Answers:</label>
                    <div className="space-y-3">
                      {currentSlide.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <motion.input
                            whileFocus={{ scale: 1.02 }}
                            type="checkbox"
                            checked={currentSlide.correctAnswers.includes(option)}
                            onChange={(e) => handleMultipleCorrectChange(option, e.target.checked)}
                            className="form-checkbox h-6 w-6 text-[#FFD700] border-2 border-[#FFD700]"
                          />
                          <span className="ml-4 text-[#FFD700] text-lg">
                            {option || `Option ${index + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Answers */}
                {currentSlide.questionType === "openEnded" && (
                  <div>
                    <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Sample Answers:</label>
                    <div className="space-y-3">
                      {currentSlide.sampleAnswers.map((answer, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <motion.input
                            whileFocus={{ scale: 1.02 }}
                            type="text"
                            value={answer}
                            onChange={(e) => handleSampleAnswerChange(index, e.target.value)}
                            className="flex-1 p-4 border-2 rounded-xl bg-[#700000] text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 border-[#FFD700]"
                            placeholder="Enter a sample answer"
                          />
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            type="button"
                            onClick={() => handleRemoveSampleAnswer(index)}
                            className="bg-red-600/90 text-white w-12 h-12 rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg"
                          >
                            ×
                          </motion.button>
                        </div>
                      ))}
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        type="button"
                        onClick={handleAddSampleAnswer}
                        className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-xl font-bold hover:bg-[#FFC300] transition-all duration-300 shadow-lg"
                      >
                        Add Sample Answer
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-4">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleSaveSet}
                    className="w-full bg-[#FFD700] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#FFC300] transition-all duration-300"
                  >
                    Save Set
                  </motion.button>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleDeleteSet}
                    className="w-full bg-red-600/90 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-red-700 transition-all duration-300"
                  >
                    Delete Set
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
