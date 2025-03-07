"use client";
import React, { useState } from "react";
import { db } from "../../components/firebase"; // Import Firestore instance
import { collection, addDoc } from "firebase/firestore"; // Import Firestore functions
import { Filter } from "bad-words"; // Import the profanity filter

// Initialize the profanity filter
const filter = new Filter();

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
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <div className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-6xl mx-4 text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-4xl text-[#FFD700] font-bold">Create New Set</h2>
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
                    className={`flex items-center p-3 rounded-lg border ${
                      duplicateOptions.includes(index)
                        ? "border-red-500 bg-red-900"
                        : "border-[#FFD700] bg-[#500000]"
                    }`}
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      className={`w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                        duplicateOptions.includes(index) ? "border-red-500" : ""
                      }`}
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
                type="submit"
                className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
              >
                Save Set
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
