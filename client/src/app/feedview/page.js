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
import { db } from "../../components/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Filter } from "bad-words";

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
  const questionsPerPage = 5;
  const characterLimit = 200;

  useEffect(() => {
    setUserId(getUserId());
    // Initialize votes if not exists
    if (!localStorage.getItem("votes")) {
      localStorage.setItem("votes", JSON.stringify({}));
    }
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
    const shareText = `Check out this question: ${question.text}`;
    try {
      await navigator.share({
        title: "Shared Question",
        text: shareText,
        url: window.location.href,
      });
    } catch (error) {
      navigator.clipboard.writeText(shareText + "\n" + window.location.href);
      alert("Link copied to clipboard!");
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
      userId: userId, // Store userId of the reply author
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

  const allTags = [...new Set(questions.flatMap((q) => q.tags))];

  return (
    <div className="min-h-screen w-full bg-[#8B0000] py-12">
      {/* Header */}
      <header className="bg-[#700000] p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl text-[#FFD700] font-bold">Peer Help</h1>
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="text"
            placeholder="Search questions or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#600000] text-[#FFD700] p-2 rounded-lg w-64 text-center placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto mt-8 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#700000] p-4 rounded-lg shadow-md mr-8">
          <h2 className="text-[#FFD700] font-bold mb-4">Filters</h2>
          <motion.button
            onClick={() => setSortBy("date")}
            whileHover={{ scale: 1.03 }}
            className={`w-full p-2 mb-2 ${
              sortBy === "date"
                ? "bg-[#FFD700] text-[#8B0000]"
                : "bg-[#600000] text-[#FFD700]"
            } rounded-lg font-bold transition duration-300`}
          >
            Sort by Date
          </motion.button>
          <motion.button
            onClick={() => setSortBy("votes")}
            whileHover={{ scale: 1.03 }}
            className={`w-full p-2 ${
              sortBy === "votes"
                ? "bg-[#FFD700] text-[#8B0000]"
                : "bg-[#600000] text-[#FFD700]"
            } rounded-lg font-bold transition duration-300`}
          >
            Sort by Votes
          </motion.button>

          {/* Tag Filters */}
          <h3 className="text-[#FFD700] font-bold mt-6 mb-2">Tags</h3>
          <div className="space-y-2">
            <motion.button
              onClick={() => setSelectedTag(null)}
              whileHover={{ scale: 1.03 }}
              className={`w-full p-2 ${
                selectedTag === null
                  ? "bg-[#FFD700] text-[#8B0000]"
                  : "bg-[#600000] text-[#FFD700]"
              } rounded-lg font-bold transition duration-300`}
            >
              All Tags
            </motion.button>
            {allTags.map((tag) => (
              <motion.button
                whileHover={{ scale: 1.03 }}
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`w-full p-2 ${
                  selectedTag === tag
                    ? "bg-[#FFD700] text-[#8B0000]"
                    : "bg-[#600000] text-[#FFD700]"
                } rounded-lg font-bold transition duration-300`}
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
                custom={index}
                variants={questionVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="mb-4 p-4 bg-[#600000] rounded-lg shadow-md border border-[#ffffff20]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {isHotQuestion(question) && (
                      <FaFire
                        className="text-[#FF4500] text-xl"
                        title="Hot Question"
                      />
                    )}
                    <span className="text-[#FFD700] text-sm flex items-center gap-1">
                      <FaThermometerHalf className="text-sm" />
                      {question.difficulty || "medium"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => handleShare(question)}
                      whileHover={{ scale: 1.05 }}
                      className="text-[#FFD700] hover:text-[#FFA500]"
                    >
                      <FaShare />
                    </motion.button>
                  </div>
                </div>

                {editingId === question.id ? (
                  // Edit Mode
                  <div>
                    <motion.textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="bg-[#700000] text-[#FFD700] p-2 rounded-lg w-full text-center placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none"
                      rows={4}
                    />
                    <div className="mt-2 flex justify-end space-x-2">
                      <motion.button
                        onClick={() => saveEdit(question.id)}
                        whileHover={{ scale: 1.05 }}
                        className="bg-[#FFD700] text-[#8B0000] px-4 py-2 rounded-lg font-bold transition duration-300 flex items-center"
                      >
                        <FaSave className="mr-2" /> Save
                      </motion.button>
                      <motion.button
                        onClick={cancelEdit}
                        whileHover={{ scale: 1.05 }}
                        className="bg-[#600000] text-[#FFD700] px-4 py-2 rounded-lg font-bold transition duration-300 flex items-center"
                      >
                        <FaTimes className="mr-2" /> Cancel
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex">
                    {/* Votes Section */}
                    <div className="w-20 text-center flex flex-col items-center gap-3">
                      <div className="flex flex-col items-center">
                        <motion.button
                          onClick={() => handleUpvote(question.id)}
                          whileHover={{ scale: 1.05 }}
                          className={`text-[#FFD700] ${
                            hasVoted(question.id, "like")
                              ? "text-[#00FF00]"
                              : "hover:text-[#00FF00]"
                          } transition-colors duration-200 p-1`}
                        >
                          <FaThumbsUp className="text-xl" />
                        </motion.button>
                        <span className="text-[#00FF00] text-sm font-bold">
                          {question.likes || 0}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <motion.button
                          onClick={() => handleDownvote(question.id)}
                          whileHover={{ scale: 1.05 }}
                          className={`text-[#FFD700] ${
                            hasVoted(question.id, "dislike")
                              ? "text-[#FF0000]"
                              : "hover:text-[#FF0000]"
                          } transition-colors duration-200 p-1`}
                        >
                          <FaThumbsDown className="text-xl" />
                        </motion.button>
                        <span className="text-[#FF0000] text-sm font-bold">
                          {question.dislikes || 0}
                        </span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 ml-4">
                      <p className="text-[#FFD700]">{question.text}</p>
                      <div className="mt-2 text-[#FFD700] text-sm">
                        Tags:{" "}
                        {question.tags.map((tag) => (
                          <motion.span
                            key={tag}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setSelectedTag(tag)}
                            className="inline-block bg-[#700000] px-2 py-1 rounded-lg mr-2 cursor-pointer"
                          >
                            {tag}
                          </motion.span>
                        ))}
                      </div>

                      {/* Always show reply button */}
                      <div className="mt-2 flex justify-end space-x-2">
                        {isOwner(question) && (
                          <>
                            <motion.button
                              onClick={() => handleEdit(question.id, question.text)}
                              whileHover={{ scale: 1.05 }}
                              className="text-[#FFD700] hover:text-[#FFA500] flex items-center"
                            >
                              <FaEdit className="mr-2" /> Edit
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(question.id)}
                              whileHover={{ scale: 1.05 }}
                              className="text-[#FFD700] hover:text-[#FF0000] flex items-center"
                            >
                              <FaTrash className="mr-2" /> Delete
                            </motion.button>
                          </>
                        )}
                        <motion.button
                          onClick={() => handleReply(question.id)}
                          whileHover={{ scale: 1.05 }}
                          className="text-[#FFD700] hover:text-[#FFA500] flex items-center"
                        >
                          <FaReply className="mr-2" /> Reply
                        </motion.button>
                      </div>

                      {/* Reactions Section */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {question.reactions &&
                            Object.entries(question.reactions).map(
                              ([reaction, count]) => (
                                <span
                                  key={reaction}
                                  className="bg-[#700000] px-2 py-1 rounded-full text-sm flex items-center gap-1"
                                >
                                  {reaction === "smile" && <BsEmojiSmile />}
                                  {reaction === "love" && <BsEmojiHeartEyes />}
                                  {reaction === "angry" && <BsEmojiAngry />}
                                  {reaction === "thinking" && <BsEmojiNeutral />}
                                  {reaction === "confused" && <BsEmojiDizzy />}
                                  {reaction === "haha" && <BsEmojiLaughing />}
                                  {reaction === "cool" && <BsEmojiSunglasses />}
                                  {reaction === "celebrate" && <BsStars />}
                                  {reaction === "helpful" && <FaThumbsUp />}
                                  <span className="ml-1">{count}</span>
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
                          className="text-[#FFD700] text-sm hover:text-[#FFA500]"
                        >
                          Feelings About This
                        </motion.button>
                        {showReactions === question.id && (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-wrap gap-2 bg-[#700000] p-2 rounded-lg absolute z-10"
                          >
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "smile")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Smile"
                            >
                              <BsEmojiSmile className="text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "love")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Love"
                            >
                              <BsEmojiHeartEyes className="text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "haha")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Haha"
                            >
                              <BsEmojiLaughing className="text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "thinking")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Thinking"
                            >
                              <BsEmojiNeutral className="text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "confused")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Confused"
                            >
                              <BsEmojiDizzy className="text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "angry")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Angry"
                            >
                              <BsEmojiAngry className="text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "cool")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Cool"
                            >
                              <BsEmojiSunglasses className="text-xl" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleReaction(question.id, "helpful")}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Helpful"
                            >
                              <FaThumbsUp />
                            </motion.button>
                          </motion.div>
                        )}
                      </div>

                      {/* Reply Input */}
                      {replyingToId === question.id && (
                        <div className="mt-4">
                          <div className="bg-[#700000] rounded-lg p-2">
                            <textarea
                              placeholder="Write a reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="bg-[#600000] text-[#FFD700] p-2 rounded-lg w-full placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none"
                              rows={3}
                            />
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-[#FFD700] text-sm">
                                {replyText.length} characters
                              </span>
                              <div className="flex space-x-2">
                                <motion.button
                                  onClick={() => setReplyingToId(null)}
                                  whileHover={{ scale: 1.05 }}
                                  className="bg-[#600000] text-[#FFD700] px-4 py-2 rounded-lg font-bold transition duration-300 flex items-center"
                                >
                                  <FaTimes className="mr-2" /> Cancel
                                </motion.button>
                                <motion.button
                                  onClick={() => submitReply(question.id)}
                                  whileHover={{ scale: 1.05 }}
                                  className="bg-[#FFD700] text-[#8B0000] px-4 py-2 rounded-lg font-bold transition duration-300 flex items-center"
                                >
                                  <FaSave className="mr-2" /> Submit
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Mapping Replies */}
                      <div className="mt-4">
                        {question.replies.map((reply) => (
                          <div key={reply.id} className="bg-[#700000] p-4 rounded-lg mb-2">
                            <p className="text-[#FFD700]">{reply.text}</p>
                            <div className="flex justify-between mt-2">
                              <span className="text-[#FFD700] text-sm">{new Date(reply.date).toLocaleString()}</span>
                              {isReplyOwner(reply) && (
                                <div className="flex items-center">
                                  <motion.button
                                    onClick={() => handleEditReply(reply.id, question.id, reply.text)}
                                    whileHover={{ scale: 1.05 }}
                                    className="text-[#FFD700] hover:text-[#FFA500] flex items-center"
                                  >
                                    <FaEdit className="mr-2" /> Edit
                                  </motion.button>
                                  <motion.button
                                    onClick={() => handleDeleteReply(reply.id, question.id)}
                                    whileHover={{ scale: 1.05 }}
                                    className="text-[#FFD700] hover:text-[#FF0000] flex items-center"
                                  >
                                    <FaTrash className="mr-2" /> Delete
                                  </motion.button>
                                </div>
                              )}
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
      <div className="mt-4 flex justify-center space-x-2">
        {Array.from(
          { length: Math.ceil(filteredQuestions.length / questionsPerPage) },
          (_, i) => (
            <motion.button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              whileHover={{ scale: 1.05 }}
              className={`p-2 ${
                currentPage === i + 1
                  ? "bg-[#FFD700] text-[#8B0000]"
                  : "bg-[#600000] text-[#FFD700]"
              } rounded-lg font-bold transition duration-300`}
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
          className="bg-[#FFD700] text-[#8B0000] px-6 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg"
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          >
            <motion.div className="bg-[#700000] p-8 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-2xl text-[#FFD700] font-bold mb-4">Ask a Question</h2>
              <form onSubmit={handleSubmit}>
                <motion.textarea
                  placeholder="Ask a question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  maxLength={characterLimit}
                  className="bg-[#600000] text-[#FFD700] p-4 rounded-lg w-full text-center placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none"
                  rows={4}
                />
                <div className="text-[#FFD700] text-sm mt-2">
                  {newQuestion.length}/{characterLimit}
                </div>

                {/* Difficulty Selection */}
                <div className="mt-4">
                  <label className="text-[#FFD700] font-medium mb-2 block">Difficulty:</label>
                  <div className="flex gap-2">
                    {["easy", "medium", "hard"].map((level) => (
                      <motion.button
                        key={level}
                        whileHover={{ scale: 1.03 }}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                          difficulty === level
                            ? "bg-[#FFD700] text-[#8B0000]"
                            : "bg-[#500000] text-[#FFD700]"
                        }`}
                      >
                        {level}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Tag Selection */}
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[#FFD700] font-medium">Tags:</label>
                    <button
                      type="button"
                      onClick={() => setShowTagSelector(!showTagSelector)}
                      className="text-[#FFD700] hover:text-[#FFA500] flex items-center"
                    >
                      <FaTags className="mr-2" />
                      {showTagSelector ? "Hide Tags" : "Show Tags"}
                    </button>
                  </div>

                  {showTagSelector && (
                    <div className="mt-2 max-h-40 overflow-y-auto bg-[#600000] p-4 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {PREDEFINED_TAGS.map((tag) => (
                          <motion.button
                            key={tag}
                            type="button"
                            onClick={() => handleTagSelect(tag)}
                            whileHover={{ scale: 1.03 }}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              selectedTags.includes(tag)
                                ? "bg-[#FFD700] text-[#8B0000]"
                                : "bg-[#500000] text-[#FFD700]"
                            }`}
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
                    className="mt-2 bg-[#600000] text-[#FFD700] p-4 rounded-lg w-full text-center placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowQuestionForm(false);
                      setSelectedTags([]);
                      setTags("");
                    }}
                    whileHover={{ scale: 1.03 }}
                    className="bg-[#600000] text-[#FFD700] px-4 py-2 rounded-lg font-bold transition duration-300"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    className="bg-[#FFD700] text-[#8B0000] px-4 py-2 rounded-lg font-bold transition duration-300"
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
