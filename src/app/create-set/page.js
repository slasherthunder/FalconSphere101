"use client";

import { useState } from "react";

export default function CreateSet() {
  const [question, setQuestion] = useState("Question:");
  const [title, setTitle] = useState("Name of Set");
  const [options, setOptions] = useState(["Option 1", "Option 2", "Option 3", "Option 4"]);
  const [correctAnswer, setCorrectAnswer] = useState("Option 1");
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

  const handleRemoveImage = () => {
    setImage(null);
    const fileInput = document.querySelector('input[type=file]');
    if (fileInput) {
      fileInput.value = ""; 
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ title, question, options, correctAnswer, image });
  };

  return (
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <div className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-6xl mx-4 text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-4xl text-[#FFD700] font-bold">Create New Set</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-8">
          {/* Preview Section */}
          <div className="w-full sm:w-1/2 p-6 bg-[#600000] rounded-lg">
            <h2 className="text-2xl text-[#FFD700] font-bold mb-6">Preview</h2>
            <div className="space-y-4">
              <div className="text-[#FFD700] text-3xl font-semibold mb-2">{title}</div>
              <div className="text-[#FFD700] text-lg font-semibold">{question}</div>
              {image && (
                <div className="relative w-full h-48 overflow-hidden rounded">
                  <img src={image} alt="Question" className="w-full h-full object-cover" />
                  <button
                    onClick={handleRemoveImage}
                    aria-label="Remove Image"
                    className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded-full transition duration-300 ease-in-out transform hover:bg-red-700 hover:scale-105"
                  >
                    &times;
                  </button>
                </div>
              )}
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center p-3 bg-[#500000] rounded-lg border border-[#FFD700]">
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
                <label className="block text-[#FFD700] font-medium mb-2">Title:</label>
                <input
                  type="text"
                  value={title}
                  onFocus={() => setTitle("")} // Clear title on focus
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  placeholder="Enter title"
                />
              </div>
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Question:</label>
                <input
                  type="text"
                  value={question}
                  onFocus={() => setQuestion("")} // Clear question on focus
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  placeholder="Enter your question"
                />
              </div>
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Image:</label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  onFocus={handleRemoveImage} // Clear image on focus
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
                    onFocus={() => handleOptionChange(index, "")} // Clear option on focus
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full p-3 border rounded bg-[#500000] text-[#FFD700] placeholder-[#FFD70080] mb-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                    placeholder={`Enter a possible answer`}
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
                  onFocus={() => setCorrectAnswer("")} // Clear correct answer on focus
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
