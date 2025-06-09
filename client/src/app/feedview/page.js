"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaReply,
  FaTags,
  FaHandPointUp,
  FaShare,
  FaFire,
  FaThermometerHalf,
  FaThumbsUp,
  FaThumbsDown,
  FaSignInAlt,
} from "react-icons/fa";
import {
  BsEmojiSmile,
  BsEmojiHeartEyes,
  BsEmojiAngry,
  BsEmojiNeutral,
  BsEmojiDizzy,
  BsEmojiLaughing,
  BsEmojiSunglasses,
  BsStars,
} from "react-icons/bs";
import { db, auth } from "../../components/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Filter } from "bad-words";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

const filter = new Filter();
const PREDEFINED_TAGS = [
  "Mathematics",
  "English",
  "Science",
  "History",
  "Geography",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Literature",
  "Art",
  "Music",
  "Physical Education",
  "Economics",
  "Psychology",
  "Philosophy",
  "Foreign Languages",
  "Social Studies",
  "Business",
  "Technology",
];

// Generate or retrieve user ID
const getUserId = () => {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId =
      Date.now().toString(36) + Math.random().toString(36).substring(2);
    localStorage.setItem("userId", userId);
  }
  return userId;
};

const questionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
  hover: {
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
    transition: {
      duration: 0.2,
    },
  },
};

const replyVariants = {
  hidden: { opacity: 0, x: -20, height: 0 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    height: "auto",
    transition: {
      delay: i * 0.05,
      duration: 0.2,
    },
  }),
  exit: {
    opacity: 0,
    x: -20,
    height: 0,
    transition: { duration: 0.2 },
  },
};

const modalVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 },
  },
};

const floatingButtonVariants = {
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
};

export default function QuestionFeed() {
  const [newQuestion, setNewQuestion] = useState("");
  const [tags, setTags] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [currentPage, setCurrentPage] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [replyingToId, setReplyingToId] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [showReactions, setShowReactions] = useState(null);
  const [userId, setUserId] = useState("");
  const [popularTags, setPopularTags] = useState([]);
  const [highlightedQuestionId, setHighlightedQuestionId] = useState(null);
  const questionsPerPage = 5;
  const characterLimit = 200;
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUserId(getUserId());
    // Initialize votes if not exists
    if (!localStorage.getItem("votes")) {
      localStorage.setItem("votes", JSON.stringify({}));
    }
  }, []);

  useEffect(() => {
    // Calculate popular tags based on usage frequency
    const tagCounts = {};
    questions.forEach((question) => {
      question.tags.forEach((tag) => {
        if (PREDEFINED_TAGS.includes(tag)) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });
    
    // Sort tags by popularity and take top 5
    const sortedPopularTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
    
    setPopularTags(sortedPopularTags);
  }, [questions]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const questionId = params.get('question');
    if (questionId) {
      setHighlightedQuestionId(questionId);
      // Scroll to the question after a short delay to ensure it's rendered
      setTimeout(() => {
        const element = document.getElementById(`question-${questionId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('highlight-question');
          setTimeout(() => {
            element.classList.remove('highlight-question');
          }, 2000);
        }
      }, 500);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const validateProfanity = (text) => {
    return filter.isProfane(text);
  };

  const isHotQuestion = (question) => {
    const lastDay = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const questionDate = new Date(question.date);
    return (
      questionDate > lastDay &&
      (question.votes > 5 || (question.replies && question.replies.length > 2))
    );
  };

  const hasVoted = (questionId, type) => {
    try {
      const votes = JSON.parse(localStorage.getItem("votes") || "{}");
      return votes[questionId] === type;
    } catch (e) {
      console.error("Error parsing votes from localStorage", e);
      return false;
    }
  };

  const isOwner = (question) => {
    return question.userId === userId;
  };

  const isReplyOwner = (reply) => {
    return reply.userId === userId;
  };

  const handleUpvote = async (id) => {
    if (hasVoted(id, "like")) return;

    const votes = JSON.parse(localStorage.getItem("votes") || "{}");
    const questionRef = doc(db, "questions", id);
    const question = questions.find((q) => q.id === id);

    let newLikes = question.likes || 0;
    let newDislikes = question.dislikes || 0;

    // If already liked, remove the like (toggle off)
    if (votes[id] === "like") {
      newLikes = Math.max(0, newLikes - 1);
      delete votes[id]; // Remove the vote entirely
    } 
    // If disliked, switch to like
    else if (votes[id] === "dislike") {
      newDislikes = Math.max(0, newDislikes - 1);
      newLikes += 1;
      votes[id] = "like";
    }
    // If no vote, add a like
    else {
      newLikes += 1;
      votes[id] = "like";
    }

    await updateDoc(questionRef, {
      likes: newLikes,
      dislikes: newDislikes,
      votes: newLikes - newDislikes,
    });

    localStorage.setItem("votes", JSON.stringify(votes));
  };

  const handleDownvote = async (id) => {
    const votes = JSON.parse(localStorage.getItem("votes") || "{}");
    const questionRef = doc(db, "questions", id);
    const question = questions.find((q) => q.id === id);

    let newLikes = question.likes || 0;
    let newDislikes = question.dislikes || 0;

    // If already disliked, remove the dislike (toggle off)
    if (votes[id] === "dislike") {
      newDislikes = Math.max(0, newDislikes - 1);
      delete votes[id]; // Remove the vote entirely
    } 
    // If liked, switch to dislike
    else if (votes[id] === "like") {
      newLikes = Math.max(0, newLikes - 1);
      newDislikes += 1;
      votes[id] = "dislike";
    }
    // If no vote, add a dislike
    else {
      newDislikes += 1;
      votes[id] = "dislike";
    }

    await updateDoc(questionRef, {
      likes: newLikes,
      dislikes: newDislikes,
      votes: newLikes - newDislikes,
    });

    localStorage.setItem("votes", JSON.stringify(votes));
  };

  const handleShare = async (question) => {
    const shareData = {
      title: 'Shared Question from Peer Help',
      text: question.text,
      url: `${window.location.origin}/feedview?question=${question.id}`
    };

    try {
      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        
        // Show a toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-[#8B0000] text-[#FFD700] px-6 py-3 rounded-xl shadow-lg z-50 opacity-0 transition-all duration-300';
        toast.textContent = 'Link copied to clipboard!';
        document.body.appendChild(toast);
        
        // Trigger reflow to enable transition
        toast.offsetHeight;
        toast.classList.add('opacity-100');
        
        // Remove the toast after 3 seconds
        setTimeout(() => {
          toast.classList.remove('opacity-100');
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 300);
        }, 3000);
      }
    } catch (error) {
      // Don't show error for user cancellation
      if (error.name === 'AbortError') {
        return;
      }
      
      console.error('Error sharing:', error);
      
      // Show error toast only for actual errors
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 opacity-0 transition-all duration-300';
      toast.textContent = 'Failed to share. Please try again.';
      document.body.appendChild(toast);
      
      // Trigger reflow to enable transition
      toast.offsetHeight;
      toast.classList.add('opacity-100');
      
      // Remove the error toast after 3 seconds
      setTimeout(() => {
        toast.classList.remove('opacity-100');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    }
  };

  const handleTagSelect = (tag) => {
    setSelectedTags((prevTags) => {
      if (prevTags.includes(tag)) {
        return prevTags.filter((t) => t !== tag); // remove tag if already selected
      } else {
        return [...prevTags, tag]; // add tag if not selected
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newQuestion.trim() === "") {
      alert("Please enter a question.");
      return;
    }
    if (validateProfanity(newQuestion)) {
      alert("Please keep the language appropriate.");
      return;
    }

    const customTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");
    const allTags = [...new Set([...selectedTags, ...customTags])];

    if (allTags.some((tag) => validateProfanity(tag))) {
      alert("Please use appropriate tags.");
      return;
    }

    const question = {
      text: newQuestion,
      tags: allTags,
      votes: 0,
      likes: 0,
      dislikes: 0,
      date: new Date().toISOString(),
      replies: [],
      difficulty: difficulty,
      reactions: {},
      userId: userId,
    };

    try {
      await addDoc(collection(db, "questions"), question);
      setNewQuestion("");
      setTags("");
      setSelectedTags([]);
      setShowQuestionForm(false);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error adding question: ", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "questions", id));
      setCurrentPage(1);
    } catch (error) {
      console.error("Error deleting question: ", error);
    }
  };

  const handleEdit = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = async (id) => {
    if (validateProfanity(editText)) {
      alert("Please keep the language appropriate.");
      return;
    }

    const questionRef = doc(db, "questions", id);
    await updateDoc(questionRef, { text: editText });
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleReply = (id) => {
    if (!user) {
      // Show a toast notification to sign in
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-[#8B0000] text-[#FFD700] px-6 py-3 rounded-xl shadow-lg z-50 opacity-0 transition-all duration-300';
      toast.textContent = 'Please sign in to reply to questions';
      document.body.appendChild(toast);
      
      // Trigger reflow to enable transition
      toast.offsetHeight;
      toast.classList.add('opacity-100');
      
      // Remove the toast after 3 seconds
      setTimeout(() => {
        toast.classList.remove('opacity-100');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
      return;
    }
    setReplyingToId(id);
  };

  const submitReply = async (id) => {
    if (replyText.trim() === "") {
      alert("Please enter a reply.");
      return;
    }

    if (validateProfanity(replyText)) {
      alert("Please keep the language appropriate.");
      return;
    }

    const reply = {
      id: Date.now(),
      text: replyText,
      date: new Date().toISOString(),
      userId: userId,
      reactions: {},
    };

    const questionRef = doc(db, "questions", id);
    const question = questions.find((q) => q.id === id);
    await updateDoc(questionRef, { replies: [...question.replies, reply] });

    setReplyText("");
    setReplyingToId(null);
  };

  const handleEditReply = async (replyId, questionId, newText) => {
    const questionRef = doc(db, "questions", questionId);
    const question = questions.find((q) => q.id === questionId);
    const updatedReplies = question.replies.map((reply) => {
      if (reply.id === replyId) {
        return { ...reply, text: newText };
      }
      return reply;
    });

    await updateDoc(questionRef, { replies: updatedReplies });
  };

  const handleDeleteReply = async (replyId, questionId) => {
    const questionRef = doc(db, "questions", questionId);
    const question = questions.find((q) => q.id === questionId);
    const updatedReplies = question.replies.filter((reply) => reply.id !== replyId);
    await updateDoc(questionRef, { replies: updatedReplies });
  };

  const handleReaction = async (questionId, reaction) => {
    const questionRef = doc(db, "questions", questionId);
    const question = questions.find((q) => q.id === questionId);
    const reactions = question.reactions || {};
    reactions[reaction] = (reactions[reaction] || 0) + 1;
    await updateDoc(questionRef, { reactions });
    setShowReactions(null);
  };

  const handleReplyReaction = async (questionId, replyId, reaction) => {
    const questionRef = doc(db, "questions", questionId);
    const question = questions.find((q) => q.id === questionId);
    const reply = question.replies.find((r) => r.id === replyId);
    
    // Initialize reactions if not exists
    if (!reply.reactions) {
      reply.reactions = {};
    }
    
    // Update reaction count
    reply.reactions[reaction] = (reply.reactions[reaction] || 0) + 1;
    
    // Update the question in Firestore
    await updateDoc(questionRef, {
      replies: question.replies.map(r => 
        r.id === replyId ? { ...r, reactions: reply.reactions } : r
      )
    });
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "questions"), (snapshot) => {
      const questionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuestions(questionsData);
    });

    return () => unsubscribe();
  }, []);

  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortBy === "votes") {
      return b.votes - a.votes;
    } else {
      return new Date(b.date) - new Date(a.date);
    }
  });

  const filteredQuestions = sortedQuestions.filter((question) => {
    const matchesSearch =
      question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesTag = selectedTag ? question.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(
    indexOfFirstQuestion,
    indexOfLastQuestion
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50">
      {/* Add styles for highlight effect */}
      <style jsx global>{`
        @keyframes highlight-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }
        .highlight-question {
          animation: highlight-pulse 2s ease-out;
        }
      `}</style>

      {/* Header */}
      <header className="bg-gradient-to-r from-[#8B0000] to-[#A52A2A] p-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl text-[#FFD700] font-bold tracking-wide">Peer Help (Beta)</h1>
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="text"
            placeholder="Search questions or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] p-3 rounded-xl w-72 text-center placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all duration-300"
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto py-8 px-4 flex gap-8">
        {/* Sidebar */}
        <aside className="w-72 bg-gradient-to-b from-[#8B0000] to-[#A52A2A] p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl text-[#FFD700] font-bold mb-6 tracking-wide">Filters</h2>
          <motion.button
            onClick={() => setSortBy("date")}
            whileHover={{ scale: 1.02 }}
            className={`w-full p-3 mb-3 ${
              sortBy === "date"
                ? "bg-[#FFD700] text-[#8B0000] shadow-lg"
                : "bg-[#700000]/80 text-[#FFD700] hover:bg-[#700000]"
            } rounded-xl font-bold transition-all duration-300`}
          >
            Sort by Date
          </motion.button>
          <motion.button
            onClick={() => setSortBy("votes")}
            whileHover={{ scale: 1.02 }}
            className={`w-full p-3 ${
              sortBy === "votes"
                ? "bg-[#FFD700] text-[#8B0000] shadow-lg"
                : "bg-[#700000]/80 text-[#FFD700] hover:bg-[#700000]"
            } rounded-xl font-bold transition-all duration-300`}
          >
            Sort by Votes
          </motion.button>

          {/* Popular Tags Section */}
          <h3 className="text-lg text-[#FFD700] font-bold mt-8 mb-4 tracking-wide">Popular Tags</h3>
          <div className="space-y-2 mb-8">
            {popularTags.map((tag) => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`w-full p-3 ${
                  selectedTag === tag
                    ? "bg-[#FFD700] text-[#8B0000] shadow-lg"
                    : "bg-[#700000]/80 text-[#FFD700] hover:bg-[#700000]"
                } rounded-xl font-bold transition-all duration-300`}
              >
                {tag}
              </motion.button>
            ))}
          </div>

          {/* All Tags Section */}
          <h3 className="text-lg text-[#FFD700] font-bold mt-8 mb-4 tracking-wide">All Tags</h3>
          <div className="space-y-2">
            <motion.button
              onClick={() => setSelectedTag(null)}
              whileHover={{ scale: 1.02 }}
              className={`w-full p-3 ${
                selectedTag === null
                  ? "bg-[#FFD700] text-[#8B0000] shadow-lg"
                  : "bg-[#700000]/80 text-[#FFD700] hover:bg-[#700000]"
              } rounded-xl font-bold transition-all duration-300`}
            >
              All Tags
            </motion.button>
            {PREDEFINED_TAGS.map((tag) => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`w-full p-3 ${
                  selectedTag === tag
                    ? "bg-[#FFD700] text-[#8B0000] shadow-lg"
                    : "bg-[#700000]/80 text-[#FFD700] hover:bg-[#700000]"
                } rounded-xl font-bold transition-all duration-300`}
              >
                {tag}
              </motion.button>
            ))}
          </div>
        </aside>

        {/* Question List */}
        <main className="flex-1">
          <AnimatePresence>
            {currentQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                id={`question-${question.id}`}
                custom={index}
                variants={questionVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className={`mb-6 p-6 bg-gradient-to-br from-[#8B0000] to-[#A52A2A] rounded-2xl shadow-xl border border-[#ffffff10] ${
                  highlightedQuestionId === question.id ? 'highlight-question' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {isHotQuestion(question) && (
                      <FaFire
                        className="text-[#FF4500] text-2xl animate-pulse"
                        title="Hot Question"
                      />
                    )}
                    <span className="text-[#FFD700] text-sm flex items-center gap-2 bg-[#700000]/50 px-3 py-1 rounded-full">
                      <FaThermometerHalf className="text-sm" />
                      {question.difficulty || "medium"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.button
                      onClick={() => handleShare(question)}
                      whileHover={{ scale: 1.1 }}
                      className="text-[#FFD700] hover:text-[#FFA500] transition-colors duration-300"
                    >
                      <FaShare className="text-xl" />
                    </motion.button>
                  </div>
                </div>

                {editingId === question.id ? (
                  // Edit Mode
                  <div>
                    <motion.textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] p-4 rounded-xl w-full text-center placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none transition-all duration-300"
                      rows={4}
                    />
                    <div className="mt-4 flex justify-end space-x-3">
                      <motion.button
                        onClick={() => saveEdit(question.id)}
                        whileHover={{ scale: 1.05 }}
                        className="bg-[#FFD700] text-[#8B0000] px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
                      >
                        <FaSave className="mr-2" /> Save
                      </motion.button>
                      <motion.button
                        onClick={cancelEdit}
                        whileHover={{ scale: 1.05 }}
                        className="bg-[#700000] text-[#FFD700] px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center hover:bg-[#800000]"
                      >
                        <FaTimes className="mr-2" /> Cancel
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex">
                    {/* Votes Section */}
                    <div className="w-24 text-center flex flex-col items-center gap-4">
                      <div className="flex flex-col items-center">
                        <motion.button
                          onClick={() => handleUpvote(question.id)}
                          whileHover={{ scale: 1.1 }}
                          className={`text-[#FFD700] ${
                            hasVoted(question.id, "like")
                              ? "text-[#00FF00]"
                              : "hover:text-[#00FF00]"
                          } transition-colors duration-300 p-2`}
                        >
                          <FaThumbsUp className="text-2xl" />
                        </motion.button>
                        <span className="text-[#00FF00] text-lg font-bold">
                          {question.likes || 0}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <motion.button
                          onClick={() => handleDownvote(question.id)}
                          whileHover={{ scale: 1.1 }}
                          className={`text-[#FFD700] ${
                            hasVoted(question.id, "dislike")
                              ? "text-[#FF0000]"
                              : "hover:text-[#FF0000]"
                          } transition-colors duration-300 p-2`}
                        >
                          <FaThumbsDown className="text-2xl" />
                        </motion.button>
                        <span className="text-[#FF0000] text-lg font-bold">
                          {question.dislikes || 0}
                        </span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 ml-6">
                      <p className="text-[#FFD700] text-lg leading-relaxed">{question.text}</p>
                      <div className="mt-4 text-[#FFD700] text-sm flex flex-wrap gap-2">
                        {question.tags.map((tag) => (
                          <motion.span
                            key={tag}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setSelectedTag(tag)}
                            className="inline-block bg-[#700000]/80 px-3 py-1.5 rounded-full cursor-pointer hover:bg-[#700000] transition-all duration-300"
                          >
                            {tag}
                          </motion.span>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex justify-end space-x-4">
                        {isOwner(question) && (
                          <>
                            <motion.button
                              onClick={() => handleEdit(question.id, question.text)}
                              whileHover={{ scale: 1.05 }}
                              className="text-[#FFD700] hover:text-[#FFA500] flex items-center transition-colors duration-300"
                            >
                              <FaEdit className="mr-2" /> Edit
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(question.id)}
                              whileHover={{ scale: 1.05 }}
                              className="text-[#FFD700] hover:text-[#FF0000] flex items-center transition-colors duration-300"
                            >
                              <FaTrash className="mr-2" /> Delete
                            </motion.button>
                          </>
                        )}
                        {user && (
                          <motion.button
                            onClick={() => handleReply(question.id)}
                            whileHover={{ scale: 1.05 }}
                            className="text-[#FFD700] hover:text-[#FFA500] flex items-center transition-colors duration-300"
                          >
                            <FaReply className="mr-2" /> Reply
                          </motion.button>
                        )}
                      </div>

                      {/* Reactions Section */}
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex flex-wrap gap-2">
                          {question.reactions &&
                            Object.entries(question.reactions).map(
                              ([reaction, count]) => (
                                <span
                                  key={reaction}
                                  className="bg-[#700000]/80 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 hover:bg-[#700000] transition-all duration-300"
                                >
                                  {reaction === "smile" && <BsEmojiSmile className="text-lg" />}
                                  {reaction === "love" && <BsEmojiHeartEyes className="text-lg" />}
                                  {reaction === "angry" && <BsEmojiAngry className="text-lg" />}
                                  {reaction === "thinking" && <BsEmojiNeutral className="text-lg" />}
                                  {reaction === "confused" && <BsEmojiDizzy className="text-lg" />}
                                  {reaction === "haha" && <BsEmojiLaughing className="text-lg" />}
                                  {reaction === "cool" && <BsEmojiSunglasses className="text-lg" />}
                                  {reaction === "celebrate" && <BsStars className="text-lg" />}
                                  {reaction === "helpful" && <FaThumbsUp className="text-lg" />}
                                  <span className="text-[#FFD700]">{count}</span>
                                </span>
                              )
                            )}
                        </div>
                        <motion.button
                          onClick={() =>
                            setShowReactions(
                              showReactions === question.id ? null : question.id
                            )
                          }
                          className="text-[#FFD700] text-sm hover:text-[#FFA500] transition-colors duration-300"
                        >
                          Feelings About This
                        </motion.button>
                        {showReactions === question.id && (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-wrap gap-3 bg-[#700000]/90 backdrop-blur-sm p-4 rounded-xl absolute z-10 shadow-xl"
                          >
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "smile")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-2 transition-colors duration-300"
                              title="Smile"
                            >
                              <BsEmojiSmile className="text-2xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "love")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-2 transition-colors duration-300"
                              title="Love"
                            >
                              <BsEmojiHeartEyes className="text-2xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "haha")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-2 transition-colors duration-300"
                              title="Haha"
                            >
                              <BsEmojiLaughing className="text-2xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "thinking")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-2 transition-colors duration-300"
                              title="Thinking"
                            >
                              <BsEmojiNeutral className="text-2xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "confused")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-2 transition-colors duration-300"
                              title="Confused"
                            >
                              <BsEmojiDizzy className="text-2xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "angry")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-2 transition-colors duration-300"
                              title="Angry"
                            >
                              <BsEmojiAngry className="text-2xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "cool")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-2 transition-colors duration-300"
                              title="Cool"
                            >
                              <BsEmojiSunglasses className="text-2xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "helpful")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-2 transition-colors duration-300"
                              title="Helpful"
                            >
                              <FaThumbsUp className="text-2xl" />
                            </motion.button>
                          </motion.div>
                        )}
                      </div>

                      {/* Reply Input */}
                      {replyingToId === question.id && (
                        <div className="mt-6">
                          <div className="bg-[#700000]/80 backdrop-blur-sm rounded-xl p-4">
                            <textarea
                              placeholder={user ? "Write a reply..." : "Please sign in to reply"}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="bg-[#700000]/50 text-[#FFD700] p-4 rounded-xl w-full placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none transition-all duration-300"
                              rows={3}
                              disabled={!user}
                            />
                            <div className="mt-4 flex justify-between items-center">
                              <span className="text-[#FFD700]/80 text-sm">
                                {replyText.length} characters
                              </span>
                              <div className="flex space-x-3">
                                <motion.button
                                  onClick={() => setReplyingToId(null)}
                                  whileHover={{ scale: 1.05 }}
                                  className="bg-[#700000] text-[#FFD700] px-6 py-2 rounded-xl font-bold transition-all duration-300 flex items-center hover:bg-[#800000]"
                                >
                                  <FaTimes className="mr-2" /> Cancel
                                </motion.button>
                                {user ? (
                                  <motion.button
                                    onClick={() => submitReply(question.id)}
                                    whileHover={{ scale: 1.05 }}
                                    className="bg-[#FFD700] text-[#8B0000] px-6 py-2 rounded-xl font-bold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
                                  >
                                    <FaSave className="mr-2" /> Submit
                                  </motion.button>
                                ) : (
                                  <Link href="/signup">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      className="bg-[#FFD700] text-[#8B0000] px-6 py-2 rounded-xl font-bold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
                                    >
                                      <FaSignInAlt className="mr-2" /> Sign In to Reply
                                    </motion.button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mapping Replies */}
                      <div className="mt-6 space-y-4">
                        {question.replies.map((reply) => (
                          <div key={reply.id} className="bg-[#700000]/80 backdrop-blur-sm p-6 rounded-xl">
                            <p className="text-[#FFD700] text-lg leading-relaxed">{reply.text}</p>
                            
                            {/* Reply Reactions */}
                            <div className="mt-4 flex items-center gap-3">
                              <div className="flex flex-wrap gap-2">
                                {reply.reactions &&
                                  Object.entries(reply.reactions).map(
                                    ([reaction, count]) => (
                                      <span
                                        key={reaction}
                                        className="bg-[#700000]/50 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 hover:bg-[#700000] transition-all duration-300"
                                      >
                                        {reaction === "smile" && <BsEmojiSmile className="text-lg" />}
                                        {reaction === "love" && <BsEmojiHeartEyes className="text-lg" />}
                                        {reaction === "angry" && <BsEmojiAngry className="text-lg" />}
                                        {reaction === "thinking" && <BsEmojiNeutral className="text-lg" />}
                                        {reaction === "confused" && <BsEmojiDizzy className="text-lg" />}
                                        {reaction === "haha" && <BsEmojiLaughing className="text-lg" />}
                                        {reaction === "cool" && <BsEmojiSunglasses className="text-lg" />}
                                        {reaction === "celebrate" && <BsStars className="text-lg" />}
                                        {reaction === "helpful" && <FaThumbsUp className="text-lg" />}
                                        <span className="text-[#FFD700]">{count}</span>
                                      </span>
                                    )
                                  )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center space-x-3">
        {Array.from(
          { length: Math.ceil(filteredQuestions.length / questionsPerPage) },
          (_, i) => (
            <motion.button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              whileHover={{ scale: 1.05 }}
              className={`p-3 ${
                currentPage === i + 1
                  ? "bg-[#FFD700] text-[#8B0000] shadow-lg"
                  : "bg-[#8B0000] text-[#FFD700] hover:bg-[#A52A2A]"
              } rounded-xl font-bold transition-all duration-300`}
            >
              {i + 1}
            </motion.button>
          )
        )}
      </div>

      {/* "Ask a Question" Button */}
      <div className="fixed bottom-8 right-8 flex items-end">
        <motion.button
          variants={floatingButtonVariants}
          whileHover="hover"
          onClick={() => setShowQuestionForm(true)}
          className="bg-gradient-to-r from-[#8B0000] to-[#A52A2A] text-[#FFD700] px-8 py-5 rounded-2xl font-bold flex items-center gap-4 shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          <FaHandPointUp className="text-3xl" />
          I have a question
        </motion.button>
      </div>

      {/* Question Form Modal */}
      <AnimatePresence>
        {showQuestionForm && (
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div className="bg-gradient-to-br from-[#8B0000] to-[#A52A2A] p-8 rounded-2xl shadow-2xl w-full max-w-2xl">
              <h2 className="text-3xl text-[#FFD700] font-bold mb-6 tracking-wide">Ask a Question</h2>
              <form onSubmit={handleSubmit}>
                <motion.textarea
                  placeholder="Ask a question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  maxLength={characterLimit}
                  className="bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] p-6 rounded-xl w-full text-center placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none transition-all duration-300"
                  rows={4}
                />
                <div className="text-[#FFD700]/80 text-sm mt-2">
                  {newQuestion.length}/{characterLimit}
                </div>

                {/* Difficulty Selection */}
                <div className="mt-6">
                  <label className="text-[#FFD700] text-lg font-medium mb-3 block">Difficulty:</label>
                  <div className="flex gap-3">
                    {["easy", "medium", "hard"].map((level) => (
                      <motion.button
                        key={level}
                        whileHover={{ scale: 1.03 }}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`px-6 py-3 rounded-xl text-base font-medium capitalize ${
                          difficulty === level
                            ? "bg-[#FFD700] text-[#8B0000] shadow-lg"
                            : "bg-[#700000]/80 text-[#FFD700] hover:bg-[#700000]"
                        } transition-all duration-300`}
                      >
                        {level}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Tag Selection */}
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[#FFD700] text-lg font-medium">Tags:</label>
                    <button
                      type="button"
                      onClick={() => setShowTagSelector(!showTagSelector)}
                      className="text-[#FFD700] hover:text-[#FFA500] flex items-center transition-colors duration-300"
                    >
                      <FaTags className="mr-2" />
                      {showTagSelector ? "Hide Tags" : "Show Tags"}
                    </button>
                  </div>

                  {showTagSelector && (
                    <div className="mt-4 max-h-48 overflow-y-auto bg-[#700000]/80 backdrop-blur-sm p-6 rounded-xl">
                      <div className="flex flex-wrap gap-3">
                        {PREDEFINED_TAGS.map((tag) => (
                          <motion.button
                            key={tag}
                            type="button"
                            onClick={() => handleTagSelect(tag)}
                            whileHover={{ scale: 1.03 }}
                            className={`px-4 py-2 rounded-full text-sm font-medium ${
                              selectedTags.includes(tag)
                                ? "bg-[#FFD700] text-[#8B0000] shadow-lg"
                                : "bg-[#700000]/80 text-[#FFD700] hover:bg-[#700000]"
                            } transition-all duration-300`}
                          >
                            {tag}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  <motion.input
                    type="text"
                    placeholder="Add custom tags (comma-separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="mt-4 bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] p-4 rounded-xl w-full text-center placeholder-[#FFD700]/80 focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all duration-300"
                  />
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowQuestionForm(false);
                      setSelectedTags([]);
                      setTags("");
                    }}
                    whileHover={{ scale: 1.03 }}
                    className="bg-[#700000] text-[#FFD700] px-8 py-3 rounded-xl font-bold transition-all duration-300 hover:bg-[#800000]"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    className="bg-[#FFD700] text-[#8B0000] px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Submit
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
