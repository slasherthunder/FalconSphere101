"use client";
import { useState } from "react";

export default function CreateSet() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flashcards, setFlashcards] = useState([{ term: "", definition: "" }]);

  // Add a new flashcard
  const addFlashcard = () => {
    setFlashcards([...flashcards, { term: "", definition: "" }]);
  };

  // Remove a flashcard
  const removeFlashcard = (index) => {
    setFlashcards(flashcards.filter((_, i) => i !== index));
  };

  // Handle flashcard input changes
  const handleFlashcardChange = (index, field, value) => {
    const updatedFlashcards = [...flashcards];
    updatedFlashcards[index][field] = value;
    setFlashcards(updatedFlashcards);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please fill in all fields!");
      return;
    }

    console.log("Set Created:", { title, description, flashcards });
    alert("Study Set Created Successfully!");
  };

  return (
    <div className="min-h-screen bg-[#8B0000] py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#FFD700] mb-4">Create a New Set</h1>
        <form className="bg-[#FFD700] p-6 rounded-lg shadow-md" onSubmit={handleSubmit}>
          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-[#8B0000] font-semibold mb-2" htmlFor="title">
              Set Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-[#8B0000] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              placeholder="Enter a title for your set"
            />
          </div>

          {/* Description Input */}
          <div className="mb-4">
            <label className="block text-[#8B0000] font-semibold mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-[#8B0000] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              placeholder="Describe your set"
              rows="4"
            />
          </div>

          {/* Flashcards Section */}
          <h2 className="text-xl font-semibold text-[#FFD700] mb-4">Flashcards</h2>
          {flashcards.map((flashcard, index) => (
            <div key={index} className="mb-4 p-4 bg-[#8B0000] rounded-lg">
              <div className="flex gap-2">
                {/* Term Input */}
                <input
                  type="text"
                  value={flashcard.term}
                  onChange={(e) => handleFlashcardChange(index, "term", e.target.value)}
                  className="w-1/2 px-4 py-2 border border-[#FFD700] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
                  placeholder="Term"
                />
                {/* Definition Input */}
                <input
                  type="text"
                  value={flashcard.definition}
                  onChange={(e) => handleFlashcardChange(index, "definition", e.target.value)}
                  className="w-1/2 px-4 py-2 border border-[#FFD700] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
                  placeholder="Definition"
                />
                {/* Remove Button */}
                {flashcards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFlashcard(index)}
                    className="bg-red-500 text-yellow px-3 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add Flashcard Button */}
          <button
            type="button"
            onClick={addFlashcard}
            className="bg-[#8B0000] text-[#FFD700] px-4 py-2 rounded-lg font-semibold hover:bg-[#6A0000] transition-colors"
          >
            + Add Flashcard
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-[#8B0000] text-[#FFD700] px-6 py-2 rounded-lg font-semibold hover:bg-[#6A0000] transition-colors mt-6 w-full"
          >
            Create Set
          </button>
        </form>
      </div>
    </div>
  );
}