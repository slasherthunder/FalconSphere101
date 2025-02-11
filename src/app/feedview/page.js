"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuestionFeed() {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [tags, setTags] = useState(''); // Tags for the question
  const [searchQuery, setSearchQuery] = useState(''); // Search bar query
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 5;
  const characterLimit = 200; // Character limit for questions

  // Handle form submission for new questions
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newQuestion.trim() === '') {
      alert('Please enter a question.');
      return;
    }
    if (newQuestion.length > characterLimit) {
      alert(`Question exceeds the character limit of ${characterLimit}.`);
      return;
    }

    const question = {
      id: Date.now(),
      text: newQuestion,
      tags: tags.split(',').map((tag) => tag.trim()), // Split tags by comma
      votes: 0,
      date: new Date().toISOString(),
    };

    setQuestions([question, ...questions]);
    setNewQuestion('');
    setTags('');
  };

  // Handle upvoting a question
  const handleUpvote = (id) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === id ? { ...q, votes: q.votes + 1 } : q
      )
    );
  };

  // Handle downvoting a question
  const handleDownvote = (id) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === id ? { ...q, votes: q.votes - 1 } : q
      )
    );
  };

  // Handle deleting a question
  const handleDelete = (id) => {
    setQuestions((prevQuestions) => prevQuestions.filter((q) => q.id !== id));
  };

  // Handle editing a question
  const handleEdit = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  // Save the edited question
  const saveEdit = (id) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === id ? { ...q, text: editText } : q
      )
    );
    setEditingId(null);
    setEditText('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  // Sort questions by votes or date
  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.votes - a.votes;
    } else {
      return new Date(b.date) - new Date(a.date);
    }
  });

  // Filter questions by search query
  const filteredQuestions = sortedQuestions.filter((question) =>
    question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    question.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination logic
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen w-full bg-[#8B0000] py-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-[#700000] backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-4xl mx-4 text-center transform transition-all hover:scale-105 duration-300 border border-[#ffffff20]"
      >
        <h1 className="text-4xl text-[#FFD700] font-bold mb-8">Question Feed</h1>

        {/* Search Bar */}
        <div className="mb-8">
          <motion.input
            type="text"
            placeholder="Search questions or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#600000] text-[#FFD700] p-4 rounded-lg w-full max-w-md text-center placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition transform hover:scale-105"
          />
        </div>

        {/* Input for new question */}
        <form onSubmit={handleSubmit} className="mb-8">
          <motion.textarea
            placeholder="Ask a question..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            maxLength={characterLimit}
            className="bg-[#600000] text-[#FFD700] p-4 rounded-lg w-full max-w-md text-center placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition transform hover:scale-105 resize-none"
            rows={4}
          />
          <div className="text-[#FFD700] text-sm mt-2">
            {newQuestion.length}/{characterLimit}
          </div>
          <motion.input
            type="text"
            placeholder="Add tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="bg-[#600000] text-[#FFD700] p-4 rounded-lg w-full max-w-md text-center placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition transform hover:scale-105 mt-4"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-lg font-bold mt-6 transition duration-300"
          >
            Submit
          </motion.button>
        </form>

        {/* Sorting Controls */}
        <div className="mb-8 flex justify-center space-x-4">
          <motion.button
            onClick={() => setSortBy('date')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2 ${sortBy === 'date' ? 'bg-[#FFD700] text-[#8B0000]' : 'bg-[#600000] text-[#FFD700]'} rounded-lg font-bold transition duration-300`}
          >
            Sort by Date
          </motion.button>
          <motion.button
            onClick={() => setSortBy('votes')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2 ${sortBy === 'votes' ? 'bg-[#FFD700] text-[#8B0000]' : 'bg-[#600000] text-[#FFD700]'} rounded-lg font-bold transition duration-300`}
          >
            Sort by Votes
          </motion.button>
        </div>

        {/* Question List */}
        <div className="w-full max-w-md mx-auto">
          <AnimatePresence>
            {currentQuestions.map((question) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-4 p-4 bg-[#600000] rounded-lg shadow-md border border-[#ffffff20]"
              >
                {editingId === question.id ? (
                  // Edit Mode
                  <div>
                    <motion.textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="bg-[#700000] text-[#FFD700] p-2 rounded-lg w-full text-center placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition transform hover:scale-105 resize-none"
                      rows={4}
                    />
                    <div className="mt-2 flex justify-end space-x-2">
                      <motion.button
                        onClick={() => saveEdit(question.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-[#FFD700] text-[#8B0000] px-4 py-2 rounded-lg font-bold transition duration-300"
                      >
                        Save
                      </motion.button>
                      <motion.button
                        onClick={cancelEdit}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-[#600000] text-[#FFD700] px-4 py-2 rounded-lg font-bold transition duration-300"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div>
                    <div className="flex justify-between items-center">
                      <p className="text-[#FFD700]">{question.text}</p>
                      <motion.button
                        onClick={() => handleEdit(question.id, question.text)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-[#FFD700] hover:text-[#FFA500]"
                      >
                        Edit
                      </motion.button>
                    </div>
                    <div className="mt-2 text-[#FFD700] text-sm">
                      Tags: {question.tags.join(', ')}
                    </div>
                    <div className="flex items-center mt-2">
                      <motion.button
                        onClick={() => handleUpvote(question.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-[#FFD700] hover:text-[#00FF00]"
                      >
                        ▲
                      </motion.button>
                      <span className="mx-2 text-[#FFD700]">{question.votes}</span>
                      <motion.button
                        onClick={() => handleDownvote(question.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-[#FFD700] hover:text-[#FF0000]"
                      >
                        ▼
                      </motion.button>
                      <motion.button
                        onClick={() => handleDelete(question.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="ml-4 text-[#FFD700] hover:text-[#FF0000]"
                      >
                        Delete
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-center space-x-2">
          {Array.from({ length: Math.ceil(filteredQuestions.length / questionsPerPage) }, (_, i) => (
            <motion.button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 ${currentPage === i + 1 ? 'bg-[#FFD700] text-[#8B0000]' : 'bg-[#600000] text-[#FFD700]'} rounded-lg font-bold transition duration-300`}
            >
              {i + 1}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
