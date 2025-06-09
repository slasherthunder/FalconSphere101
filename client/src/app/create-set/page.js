"use client";
import React, { useState, useEffect } from "react";
import { db, auth } from "../../components/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Filter } from "bad-words";
import { motion } from "framer-motion";
import { saveAs } from 'file-saver';
import { parse } from 'papaparse';
import { onAuthStateChanged } from "firebase/auth";

const filter = new Filter();

// Animation variants
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
      imageData: null,
    },
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [error, setError] = useState("");
  const [duplicateOptions, setDuplicateOptions] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [user, setUser] = useState(null);

  const convertToCSV = () => {
    if (!title) {
      setError("Please add a title before exporting");
      return null;
    }

    let csv = "Question,Option1,Option2,Option3,Option4,CorrectAnswer,ImageData\n";
    
    slides.forEach(slide => {
      const imageData = slide.imageData ? 
        slide.imageData.split(',')[1] || slide.imageData : 
        '';
      
      const row = [
        `"${(slide.question || '').replace(/"/g, '""')}"`,
        ...slide.options.map(opt => `"${(opt || '').replace(/"/g, '""')}"`),
        `"${(slide.correctAnswer || '').replace(/"/g, '""')}"`,
        imageData ? `"${imageData}"` : '""'
      ].join(",");
      
      csv += row + "\n";
    });

    return csv;
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const csv = convertToCSV();
      if (!csv) return;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${title.replace(/\s+/g, '_')}_quiz.csv`);
      setSuccessMessage("Set exported as CSV successfully!");
    } catch (error) {
      setError("Failed to export CSV: " + error.message);
    } finally {
      setIsExporting(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const importFromCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setSuccessMessage("");

    parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.data.length < 2) {
            setError("CSV file must contain at least one question row");
            return;
          }

          const firstRow = results.data[0];
          let startIndex = 0;
          if (firstRow.some(cell => typeof cell === 'string' && 
              (cell.toLowerCase().includes("question") || 
               cell.toLowerCase().includes("answer")))) {
            startIndex = 1;
          }

          const importedSlides = [];
          for (let i = startIndex; i < results.data.length; i++) {
            const row = results.data[i];
            if (!row[0]) continue;

            const options = [];
            for (let j = 1; j <= 4; j++) {
              options.push(row[j] || "");
            }

            const correctAnswer = row[5] || "";
            let imageData = null;

            if (row[6] && row[6].trim() !== "") {
              if (row[6].startsWith('data:')) {
                imageData = row[6];
              } else {
                imageData = `data:image/jpeg;base64,${row[6]}`;
              }
            }

            importedSlides.push({
              question: row[0],
              options: options,
              correctAnswer: correctAnswer,
              imageData: imageData
            });
          }

          if (importedSlides.length === 0) {
            setError("No valid questions found in CSV");
            return;
          }

          setTitle(file.name.replace('.csv', '').replace(/_/g, ' '));
          setSlides(importedSlides);
          setCurrentSlideIndex(0);
          setSuccessMessage(`Successfully imported ${importedSlides.length} questions!`);
        } catch (error) {
          setError("Error processing CSV: " + error.message);
        } finally {
          setTimeout(() => setSuccessMessage(""), 5000);
        }
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setError("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const newSlides = [...slides];
      newSlides[currentSlideIndex].imageData = event.target.result;
      setSlides(newSlides);
      setError("");
    };
    reader.onerror = () => {
      setError("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].imageData = null;
    setSlides(newSlides);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a title for your set");
      return;
    }

    if (validateProfanity(title)) {
      setError("Title contains inappropriate language");
      return;
    }

    for (const slide of slides) {
      if (!slide.question.trim()) {
        setError(`Please enter a question for slide ${slides.indexOf(slide) + 1}`);
        return;
      }

      if (validateProfanity(slide.question)) {
        setError(`Question in slide ${slides.indexOf(slide) + 1} contains inappropriate language`);
        return;
      }

      const validOptions = slide.options.filter(opt => opt.trim() !== "");
      if (validOptions.length < 2) {
        setError(`Slide ${slides.indexOf(slide) + 1} needs at least 2 options`);
        return;
      }

      if (!slide.correctAnswer.trim()) {
        setError(`Please select a correct answer for slide ${slides.indexOf(slide) + 1}`);
        return;
      }

      for (const option of slide.options) {
        if (validateProfanity(option)) {
          setError(`Option in slide ${slides.indexOf(slide) + 1} contains inappropriate language`);
          return;
        }
      }

      const hasDuplicates = new Set(
        slide.options.filter(opt => opt.trim() !== "")
      ).size !== slide.options.filter(opt => opt.trim() !== "").length;

      if (hasDuplicates) {
        setError(`Options must be unique in slide ${slides.indexOf(slide) + 1}`);
        return;
      }
    }

    const setData = {
      title,
      slides: slides.map(slide => ({
        question: slide.question,
        options: slide.options,
        correctAnswer: slide.correctAnswer,
        imageData: slide.imageData || null
      })),
      createdAt: new Date().toISOString(),
      isPublic: !!user,
      userId: user ? user.uid : null,
      userEmail: user ? user.email : null
    };

    try {
      const docRef = await addDoc(collection(db, "sets"), setData);
      
      const storedUserSets = JSON.parse(localStorage.getItem("userSets")) || [];
      const newUserSets = [{ id: docRef.id, ...setData }, ...storedUserSets].slice(0, 5);
      localStorage.setItem("userSets", JSON.stringify(newUserSets));

      setTitle("");
      setSlides([{
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        imageData: null,
      }]);
      setCurrentSlideIndex(0);
      setDuplicateOptions([]);
      setError("");
      setSuccessMessage(user ? "Set created and shared successfully!" : "Set created successfully! (Only visible to you)");
    } catch (error) {
      console.error("Error saving set: ", error);
      setError("Failed to save the set. Please try again.");
    } finally {
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleAddSlide = () => {
    setSlides([
      ...slides,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        imageData: null,
      },
    ]);
    setCurrentSlideIndex(slides.length);
  };

  const handleDeleteSlide = (index) => {
    if (slides.length > 1) {
      const newSlides = slides.filter((_, i) => i !== index);
      setSlides(newSlides);
      setCurrentSlideIndex(Math.min(currentSlideIndex, newSlides.length - 1));
    } else {
      setError("A set must have at least one slide");
    }
  };

  const handleQuestionChange = (value) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].question = value;
    setSlides(newSlides);
  };

  const handleOptionChange = (index, value) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].options[index] = value;
    setSlides(newSlides);
    checkForDuplicates(newSlides[currentSlideIndex].options);
  };

  const handleRemoveOption = (index) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].options.splice(index, 1);
    setSlides(newSlides);
    checkForDuplicates(newSlides[currentSlideIndex].options);
  };

  const handleCorrectAnswerChange = (value) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].correctAnswer = value;
    setSlides(newSlides);
  };

  const handleAddOption = () => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].options.push("");
    setSlides(newSlides);
  };

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
  };

  const validateProfanity = (text) => {
    return filter.isProfane(text);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const copiedSet = localStorage.getItem('copiedSet');
    if (copiedSet) {
      try {
        const setData = JSON.parse(copiedSet);
        if (setData.userId && user && setData.userId !== user.uid) {
          setError('You are not authorized to edit this set.');
          localStorage.removeItem('copiedSet');
          return;
        }
        setTitle(setData.title);
        setSlides(setData.slides);
        localStorage.removeItem('copiedSet');
      } catch (error) {
        setError('Error loading copied set data');
      }
    }
  }, [user]);

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 py-12 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        <motion.div 
          className="bg-gradient-to-br from-[#8B0000] to-[#A52A2A] p-8 rounded-2xl shadow-2xl border border-[#ffffff20] overflow-hidden"
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
              Create New Set
            </motion.h2>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={exportToCSV}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export CSV</span>
                  </>
                )}
              </motion.button>
              <motion.label
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Import CSV</span>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={importFromCSV} 
                  className="hidden" 
                />
              </motion.label>
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
              variants={previewVariants}
              initial="hidden"
              animate="visible"
              className="w-full lg:w-1/2 p-8 bg-gradient-to-br from-[#8B0000] to-[#A52A2A] rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-3xl text-[#FFD700] font-bold tracking-wide">Preview</h2>
                <motion.button
                  variants={buttonVariants}
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: "rgba(220, 38, 38, 0.8)",
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleDeleteSlide(currentSlideIndex)}
                  className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-[#700000] border border-[#FFD700]/30 hover:border-[#FF0000] transition-all duration-300"
                  title="Delete this slide"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-[#FF6B6B] group-hover:text-[#FF0000] transition-colors"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                    />
                  </svg>
                  <span className="text-[#FFD700] text-sm font-medium group-hover:text-white">
                    Delete Slide
                  </span>
                </motion.button>
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
                      className="w-full h-auto max-h-64 object-contain rounded-xl shadow-lg bg-black bg-opacity-50 p-2"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "/image-placeholder.png";
                        e.target.className = "w-full h-auto max-h-64 object-contain rounded-xl shadow-lg bg-black bg-opacity-50 p-2 border border-red-500";
                      }}
                    />
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm text-white w-8 h-8 flex items-center justify-center rounded-full shadow-lg"
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
                          : "border-[#FFD700] bg-[#700000]"
                      } shadow-lg backdrop-blur-sm`}
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
              className="w-full lg:w-1/2 p-8 bg-gradient-to-br from-[#8B0000] to-[#A52A2A] rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <h2 className="text-3xl text-[#FFD700] font-bold mb-8 tracking-wide">Edit Set</h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Set Title */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Title:</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-4 border-2 rounded-xl bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300"
                    placeholder="Enter title"
                    required
                  />
                </div>

                {/* Slide Navigation */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Slide:</label>
                  <div className="flex flex-wrap gap-2">
                    {slides.map((_, index) => (
                      <motion.button
                        key={index}
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        type="button"
                        onClick={() => setCurrentSlideIndex(index)}
                        className={`px-4 py-2 rounded-lg font-bold shadow-lg ${
                          currentSlideIndex === index
                            ? "bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000]"
                            : "bg-[#700000]/80 text-[#FFD700] hover:bg-[#FFD700] hover:text-[#8B0000]"
                        } transition-all duration-300`}
                      >
                        {index + 1}
                      </motion.button>
                    ))}
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      type="button"
                      onClick={handleAddSlide}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg font-bold bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] hover:shadow-xl transition-all duration-300 shadow-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add</span>
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
                    className="w-full p-4 border-2 rounded-xl bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300"
                    placeholder="Enter your question"
                    required
                  />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Image:</label>
                  <motion.label
                    whileHover={{ scale: 1.01 }}
                    className="w-full p-4 border-2 rounded-xl bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer border-dashed border-[#FFD700]/50 hover:border-solid"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#FFD700]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-center">
                      {currentSlide.imageData ? "Replace Image" : "Upload Image"}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                  </motion.label>
                  {currentSlide.imageData && (
                    <div className="mt-2 text-sm text-[#FFD700]/80 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Image ready
                    </div>
                  )}
                </div>

                {/* Options */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Options:</label>
                  <div className="space-y-3">
                    {currentSlide.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <motion.input
                          whileFocus={{ scale: 1.02 }}
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className={`flex-1 p-3 border-2 rounded-lg bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 ${
                            duplicateOptions.includes(index) ? "border-red-500" : "border-[#FFD700]"
                          }`}
                          placeholder={`Option ${index + 1}`}
                          required
                        />
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="bg-red-600/90 backdrop-blur-sm text-white w-10 h-10 rounded-lg hover:bg-red-700 transition-all duration-300 shadow-lg flex items-center justify-center"
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
                      className="bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-5 py-2 rounded-lg font-bold hover:shadow-xl transition-all duration-300 shadow-lg flex items-center gap-2 justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Option
                    </motion.button>
                  </div>
                </div>

                {/* Correct Answer */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Correct Answer:</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    value={currentSlide.correctAnswer}
                    onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                    className="w-full p-4 border-2 rounded-xl bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300"
                    required
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
                  className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl hover:shadow-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
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
