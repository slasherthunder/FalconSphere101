"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../components/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Filter } from "bad-words";
import { motion } from "framer-motion";
import { saveAs } from 'file-saver';
import { parse } from 'papaparse';

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

  // Convert set to CSV format with proper image handling
  const convertToCSV = () => {
    if (!title) {
      setError("Please add a title before exporting");
      return null;
    }

    let csv = "Question,Option1,Option2,Option3,Option4,CorrectAnswer,ImageData\n";
    
    slides.forEach(slide => {
      // Extract just the base64 data without the data URL prefix for cleaner CSV
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

  // Export set as CSV file
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

  // Import set from CSV file with proper image handling
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

            // Handle image data from CSV
            if (row[6] && row[6].trim() !== "") {
              // Check if it already has the data URL prefix
              if (row[6].startsWith('data:')) {
                imageData = row[6];
              } else {
                // Assume it's base64 and add the proper prefix
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

  // Handle image upload with proper Base64 conversion
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      setError("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const newSlides = [...slides];
      // Store the complete data URL
      newSlides[currentSlideIndex].imageData = event.target.result;
      setSlides(newSlides);
      setError("");
    };
    reader.onerror = () => {
      setError("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  // Handle removing image
  const handleRemoveImage = () => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex].imageData = null;
    setSlides(newSlides);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate title
    if (!title.trim()) {
      setError("Please enter a title for your set");
      return;
    }

    // Check for profanity
    if (validateProfanity(title)) {
      setError("Title contains inappropriate language");
      return;
    }

    // Validate slides
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

    // Prepare set data
    const setData = {
      title,
      slides: slides.map(slide => ({
        question: slide.question,
        options: slide.options,
        correctAnswer: slide.correctAnswer,
        imageData: slide.imageData || null
      })),
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, "sets"), setData);
      
      // Store in local storage
      const storedUserSets = JSON.parse(localStorage.getItem("userSets")) || [];
      const newUserSets = [{ id: docRef.id, ...setData }, ...storedUserSets].slice(0, 5);
      localStorage.setItem("userSets", JSON.stringify(newUserSets));

      // Reset form
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
      setSuccessMessage("Set created successfully!");
    } catch (error) {
      console.error("Error saving set: ", error);
      setError("Failed to save the set. Please try again.");
    } finally {
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Other handlers
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
    const copiedSet = localStorage.getItem('copiedSet');
    if (copiedSet) {
      try {
        const setData = JSON.parse(copiedSet);
        setTitle(setData.title);
        setSlides(setData.slides);
        localStorage.removeItem('copiedSet');
      } catch (error) {
        setError('Error loading copied set data');
      }
    }
  }, []);

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
            <div className="flex gap-4 mt-4 sm:mt-0">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={exportToCSV}
                disabled={isExporting}
                className="px-6 py-3 bg-[#FFD700] text-[#8B0000] font-bold rounded-xl shadow-lg hover:bg-[#FFC300] transition-all duration-300 disabled:opacity-50"
              >
                {isExporting ? "Exporting..." : "Export CSV"}
              </motion.button>
              <motion.label
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="px-6 py-3 bg-[#FFD700] text-[#8B0000] font-bold rounded-xl shadow-lg hover:bg-[#FFC300] transition-all duration-300 cursor-pointer"
              >
                Import CSV
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
              className="bg-red-600/90 backdrop-blur-sm text-white p-4 rounded-lg mb-6 shadow-lg"
            >
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-600/90 backdrop-blur-sm text-white p-4 rounded-lg mb-6 shadow-lg"
            >
              {successMessage}
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
                    required
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
                    required
                  />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3">Image:</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-4 border-2 rounded-xl bg-[#500000]/70 text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FFD700] file:text-[#8B0000] hover:file:bg-[#FFC300]"
                  />
                  {currentSlide.imageData && (
                    <div className="mt-4 text-sm text-[#FFD700]">
                      Image attached (see preview)
                    </div>
                  )}
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
                          placeholder={`Option ${index + 1}`}
                          required
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