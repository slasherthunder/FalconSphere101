"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function CreateSet() {
  const [slides, setSlides] = useState([
    {
      question: "What is the capital of Russia?",
      options: ["Moscow", "Romania", "St. Petersburg", "Macedonia"],
      correctAnswer: "Moscow",
      image: null,
    },
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleAddOption = () => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].options.push("");
    setSlides(updatedSlides);
  };

  const handleOptionChange = (index, value) => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].options[index] = value;
    setSlides(updatedSlides);
  };

  const handleOptionRemove = (index) => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].options.splice(index, 1);
    setSlides(updatedSlides);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedSlides = [...slides];
        updatedSlides[currentSlideIndex].image = reader.result;
        setSlides(updatedSlides);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].image = null;
    setSlides(updatedSlides);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission, e.g., save the question and options
    console.log(slides);
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
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

  return (
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <div className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-6xl mx-4 text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-4xl text-[#FFD700] font-bold">Create New Set</h2>
        </div>

        {/* Display the current slide number out of total slides */}
        <div className="mb-6">
          <span className="text-xl text-[#FFD700]">
            Slide {currentSlideIndex + 1} of {slides.length}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-8">
          {/* Preview Section */}
          <div className="w-full sm:w-1/2 p-6 bg-[#600000] rounded-lg">
            <h2 className="text-2xl text-[#FFD700] font-bold mb-6">Preview</h2>
            <div className="space-y-4">
              <div className="text-[#FFD700] text-lg font-semibold">
                {slides[currentSlideIndex].question}
              </div>
              {slides[currentSlideIndex].image && (
                <div className="w-full h-48 overflow-hidden rounded relative">
                  <img
                    src={slides[currentSlideIndex].image}
                    alt="Question"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 text-[#FFD700] text-xl"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="space-y-2">
                {slides[currentSlideIndex].options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 rounded-lg border border-[#FFD700] ${
                      option === slides[currentSlideIndex].correctAnswer
                        ? "bg-[#FFD700] text-[#8B0000]"
                        : "bg-[#500000] text-[#FFD700]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="preview-answer"
                      value={option}
                      checked={option === slides[currentSlideIndex].correctAnswer}
                      readOnly
                      className="form-radio h-5 w-5 text-[#FFD700] border-2 border-[#FFD700]"
                    />
                    <span className="ml-3 text-lg">{option}</span>

                    {/* Move Remove Option Button inside */}
                    <button
                      type="button"
                      onClick={() => handleOptionRemove(index)}
                      className="absolute top-1 right-1 text-[#FFD700] text-xl"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Edit Section */}
          <div className="w-full sm:w-1/2 p-6 bg-[#600000] rounded-lg">
            <h2 className="text-2xl text-[#FFD700] font-bold mb-6">Edit Set</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Question:</label>
                <input
                  type="text"
                  value={slides[currentSlideIndex].question}
                  onChange={(e) => {
                    const updatedSlides = [...slides];
                    updatedSlides[currentSlideIndex].question = e.target.value;
                    setSlides(updatedSlides);
                  }}
                  className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  placeholder="Enter question"
                />
              </div>
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Image:</label>
                {slides[currentSlideIndex].image ? (
                  <div className="w-full h-48 overflow-hidden rounded relative">
                    <img
                      src={slides[currentSlideIndex].image}
                      alt="Selected Image"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 text-[#FFD700] text-xl"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    onChange={handleImageChange}
                    className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                )}
              </div>
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Options:</label>
                {slides[currentSlideIndex].options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2 relative">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                      placeholder={`Option ${index + 1}`}
                    />
                    {/* Remove Option Button inside the box */}
                    <button
                      type="button"
                      onClick={() => handleOptionRemove(index)}
                      className="absolute top-1 right-1 text-[#FFD700] text-xl"
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
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Correct Answer:</label>
                <select
                  value={slides[currentSlideIndex].correctAnswer}
                  onChange={(e) => {
                    const updatedSlides = [...slides];
                    updatedSlides[currentSlideIndex].correctAnswer = e.target.value;
                    setSlides(updatedSlides);
                  }}
                  className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                >
                  <option value="">Select correct answer</option>
                  {slides[currentSlideIndex].options.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110"
              >
                Save Set
              </button>
            </form>

            {/* Navigation Arrows */}
            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 cursor-pointer" onClick={handlePreviousSlide}>
              <span className="text-4xl text-[#FFD700]">←</span>
            </div>
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer" onClick={handleNextSlide}>
              <span className="text-4xl text-[#FFD700]">→</span>
            </div>

            <button
              type="button"
              onClick={handleAddSlide}
              className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold hover:bg-[#FFC300] transition duration-300 transform hover:scale-110 mt-6"
            >
              Add Slide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
