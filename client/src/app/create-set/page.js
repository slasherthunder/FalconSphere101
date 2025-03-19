"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../components/firebase"; // Import Firestore instance
import { collection, addDoc } from "firebase/firestore"; // Import Firestore functions
import { Filter } from "bad-words"; // Import the profanity filter
import { motion } from "framer-motion";
// Initialize the profanity filter
const filter = new Filter();

// Add animation variants at the top
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const formVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: 0.2
    }
  }
};

const previewVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: 0.2
    }
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

export default function CreateSet() {
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
  const [duplicateOptions, setDuplicateOptions] = useState([]);

  // Add useEffect to check for copied set data
  useEffect(() => {
    const copiedSet = localStorage.getItem('copiedSet');
    if (copiedSet) {
      try {
        const setData = JSON.parse(copiedSet);
        setTitle(setData.title);
        setSlides(setData.slides);
        // Clear the copied set from localStorage
        localStorage.removeItem('copiedSet');
      } catch (error) {
        console.error('Error parsing copied set:', error);
        setError('Error loading copied set data');
      }
    }
  }, []);

  // Validate for profanity
  const validateProfanity = (text) => {
    return filter.isProfane(text);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

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

    // Check for duplicate options
    const hasDuplicates = slides.some((slide) => {
      const optionSet = new Set(slide.options.filter((option) => option.trim() !== ""));
      return optionSet.size !== slide.options.filter((option) => option.trim() !== "").length;
    });

    if (hasDuplicates) {
      setError("Options must be unique. Please remove duplicate options.");
      return;
    }

    // Proceed with saving if no profanity or duplicates are found
    const setData = {
      title,
      slides,
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, "sets"), setData);
      console.log("Set saved with ID: ", docRef.id);

      // Store the set in local storage
      const storedUserSets = JSON.parse(localStorage.getItem("userSets")) || [];
      const newUserSets = [{ id: docRef.id, ...setData }, ...storedUserSets].slice(0, 5);
      localStorage.setItem("userSets", JSON.stringify(newUserSets));

      setTitle("");
      setSlides([
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: "",
          image: null,
        },
      ]);
      setCurrentSlideIndex(0);
      setDuplicateOptions([]);
      setError("");
      alert("Set created successfully!");
    } catch (error) {
      console.error("Error saving set: ", error);
      setError("Failed to save the set. Please try again.");
    }
  };

  // Handle adding a new slide
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

  // Handle deleting a slide
  const handleDeleteSlide = (index) => {
    if (slides.length > 1) {
      const newSlides = slides.filter((_, i) => i !== index);
      setSlides(newSlides);
      setCurrentSlideIndex(Math.min(currentSlideIndex, newSlides.length - 1));
    } else {
      setError("A set must have at least one slide.");
    }
  };

  // Handle changing the question for the current slide
  const handleQuestionChange = (value) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].question = value;
    setSlides(newSlides);
  };

  // Handle changing an option for the current slide
  const handleOptionChange = (index, value) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].options[index] = value;
    setSlides(newSlides);
    checkForDuplicates(newSlides[currentSlideIndex].options);
  };

  // Handle removing an option for the current slide
  const handleRemoveOption = (index) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].options.splice(index, 1);
    setSlides(newSlides);
    checkForDuplicates(newSlides[currentSlideIndex].options);
  };

  // Handle changing the correct answer for the current slide
  const handleCorrectAnswerChange = (value) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].correctAnswer = value;
    setSlides(newSlides);
  };

  // Handle adding an image to the current slide
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newSlides = [...slides];
        newSlides[currentSlideIndex].image = reader.result;
        setSlides(newSlides);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing the image from the current slide
  const handleRemoveImage = () => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].image = null;
    setSlides(newSlides);
    const fileInput = document.querySelector('input[type=file]');
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Handle adding a new option to the current slide
  const handleAddOption = () => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].options.push("");
    setSlides(newSlides);
  };

  // Check for duplicate options in the current slide
  const checkForDuplicates = (options) => {
    const optionCounts = {};
    const duplicates = [];

    options.forEach((option, index) => {
      if (option.trim() !== "") {
        if (optionCounts[option]) {
          duplicates.push(index);
          optionCounts[option].push(index);
        } else {
          optionCounts[option] = [index];
        }
      }
    });

    const allDuplicates = Object.values(optionCounts)
      .filter((indices) => indices.length > 1)
      .flat();

    setDuplicateOptions(allDuplicates);

    if (allDuplicates.length > 0) {
      setError("Options must be unique. Please remove duplicate options.");
    } else {
      setError("");
    }
  };

  const currentSlide = slides[currentSlideIndex];

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
              Create New Set
            </motion.h2>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-600/90 backdrop-blur-sm text-white p-4 rounded-lg mb-6 shadow-lg"
            >
              {error}
            </motion.div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Preview Section */}
            <motion.div
              variants={previewVariants}
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
                  {title || "Name of Set"}
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
                  >
                    <img
                      src={currentSlide.image}
                      alt="Question"
                      className="w-full h-full object-cover rounded-xl shadow-lg"
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
                  {currentSlide.options.map((option, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, x: 5 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center p-4 rounded-xl border-2 ${
                        duplicateOptions.includes(index)
                          ? "border-red-500 bg-red-900/50"
                          : "border-[#FFD700] bg-[#500000]/70"
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
                </div>
              </motion.div>
            </motion.div>

            {/* Edit Section */}
            <motion.div
              variants={formVariants}
              initial="hidden"
              animate="visible"
              className="w-full lg:w-1/2 p-8 bg-[#600000]/90 backdrop-blur-sm rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <h2 className="text-3xl text-[#FFD700] font-bold mb-8">Edit Set</h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Set Title */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3">Title:</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-4 border-2 rounded-xl bg-[#500000]/70 text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300"
                    placeholder="Enter title"
                  />
                </div>

                {/* Slide Navigation */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3">Slide:</label>
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
                              : "bg-[#500000]/70 text-[#FFD700] hover:bg-[#FFD700] hover:text-[#8B0000]"
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
                  <label className="block text-[#FFD700] text-lg font-medium mb-3">Question:</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    value={currentSlide.question}
                    onChange={(e) => handleQuestionChange(e.target.value)}
                    className="w-full p-4 border-2 rounded-xl bg-[#500000]/70 text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300"
                    placeholder="Enter your question"
                  />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3">Image:</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="file"
                    onChange={handleImageChange}
                    className="w-full p-4 border-2 rounded-xl bg-[#500000]/70 text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFD700] file:text-[#8B0000] hover:file:bg-[#FFC300]"
                  />
                </div>

                {/* Options */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3">Options:</label>
                  <div className="space-y-3">
                    {currentSlide.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <motion.input
                          whileFocus={{ scale: 1.02 }}
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className={`flex-1 p-4 border-2 rounded-xl bg-[#500000]/70 text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 ${
                            duplicateOptions.includes(index) ? "border-red-500" : "border-[#FFD700]"
                          }`}
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

                {/* Correct Answer */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3">Correct Answer:</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    value={currentSlide.correctAnswer}
                    onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                    className="w-full p-4 border-2 rounded-xl bg-[#500000]/70 text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300"
                  >
                    <option value="">Select correct answer</option>
                    {currentSlide.options.map((option, index) => (
                      <option key={index} value={option}>
                        {option || `Option ${index + 1}`}
                      </option>
                    ))}
                  </motion.select>
                </div>

                {/* Save Set Button */}
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  type="submit"
                  className="w-full bg-[#FFD700] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl hover:bg-[#FFC300] transition-all duration-300 shadow-lg"
                >
                  Save Set
                </motion.button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
