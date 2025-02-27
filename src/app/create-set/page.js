"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function CreateSet() {
  const [question, setQuestion] = useState("What is the capital of Russia?");
  const [options, setOptions] = useState(["Moscow", "Romania", "St. Petersburg", "Macedonia"]);
  const [correctAnswer, setCorrectAnswer] = useState("Moscow");
  const [image, setImage] = useState(null);

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission, e.g., save the question and options
    console.log({ question, options, correctAnswer, image });
  };

  return (
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <div className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-6xl mx-4 text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-4xl text-[#FFD700] font-bold">
            Create New Set
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-8">
          {/* Preview Section */}
          <div className="w-full sm:w-1/2 p-6 bg-[#600000] rounded-lg">
            <h2 className="text-2xl text-[#FFD700] font-bold mb-6">Preview</h2>
            <div className="space-y-4">
              <div className="text-[#FFD700] text-lg font-semibold">
                {question}
              </div>
              {image && (
                <div className="w-full h-48 overflow-hidden rounded">
                  <img src={image} alt="Question" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-[#500000] rounded-lg border border-[#FFD700]"
                  >
                    <input
                      type="radio"
                      name="preview-answer"
                      value={option}
                      checked={option === correctAnswer}
                      readOnly
                      className="form-radio h-5 w-5 text-[#FFD700] border-2 border-[#FFD700]"
                    />
                    <span className="ml-3 text-[#FFD700] text-lg">{option}</span>
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
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  placeholder="Enter question"
                />
              </div>
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Image:</label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                />
              </div>
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Options:</label>
                {options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] mb-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    placeholder={`Option ${index + 1}`}
                  />
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
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                >
                  <option value="">Select correct answer</option>
                  {options.map((option, index) => (
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
          </div>
        </div>
      </div>
    </div>
  );
}
