"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowUp, FaArrowDown, FaEdit, FaTrash, FaSave, FaTimes, FaReply, FaPlus, FaTags, FaHandPointUp, FaShare, FaFire, FaClock, FaThermometerHalf, FaThumbsUp, FaBold, FaItalic, FaCode, FaLink, FaUnderline, FaThumbsDown } from 'react-icons/fa';
import { BsEmojiSmile, BsEmojiHeartEyes, BsEmojiAngry, BsEmojiNeutral, BsEmojiDizzy, BsEmojiLaughing, BsEmojiSunglasses, BsStars } from 'react-icons/bs';
import { db } from '../../components/firebase'; // Import Firestore instance
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Filter } from 'bad-words'; // Import the profanity filter

// Initialize the profanity filter
const filter = new Filter();

// Predefined tags
const PREDEFINED_TAGS = [
  'Mathematics',
  'English',
  'Science',
  'History',
  'Geography',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Literature',
  'Art',
  'Music',
  'Physical Education',
  'Economics',
  'Psychology',
  'Philosophy',
  'Foreign Languages',
  'Social Studies',
  'Business',
  'Technology'
];

// Add animation variants at the top of the file
const questionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      type: "spring",
      stiffness: 100
    }
  }),
  hover: {
    scale: 1.02,
    y: -5,
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.98,
    y: 0,
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    transition: { duration: 0.1 }
  }
};

const replyVariants = {
  hidden: { opacity: 0, x: -20, height: 0 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    height: "auto",
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      type: "spring",
      stiffness: 120
    }
  }),
  exit: {
    opacity: 0,
    x: -20,
    height: 0,
    transition: { duration: 0.2 }
  }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50, rotate: -5 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    rotate: 5,
    transition: { duration: 0.2 }
  }
};

const floatingButtonVariants = {
  initial: { y: 0, rotate: 0 },
  animate: {
    y: [-5, 5],
    rotate: [-5, 5],
    transition: {
      y: {
        repeat: Infinity,
        repeatType: "reverse",
        duration: 2,
        ease: "easeInOut"
      },
      rotate: {
        repeat: Infinity,
        repeatType: "reverse",
        duration: 3,
        ease: "easeInOut"
      }
    }
  },
  hover: {
    scale: 1.1,
    y: -10,
    rotate: -10,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.95,
    y: 0,
    rotate: 0
  }
};

// Add new animation variants at the top
const searchInputVariants = {
  initial: { scale: 1 },
  focus: {
    scale: 1.05,
    boxShadow: "0 0 15px rgba(255,215,0,0.3)",
    transition: { duration: 0.3 }
  }
};

const tagVariants = {
  initial: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.1,
    rotate: [-2, 2],
    transition: {
      rotate: {
        repeat: Infinity,
        repeatType: "reverse",
        duration: 0.3
      }
    }
  },
  tap: { scale: 0.95 }
};

const buttonVariants = {
  initial: { scale: 1 },
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

const reactionButtonVariants = {
  initial: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.2,
    rotate: [-10, 10],
    transition: {
      rotate: {
        repeat: Infinity,
        repeatType: "reverse",
        duration: 0.5
      }
    }
  },
  tap: { scale: 0.9, rotate: 0 }
};

export default function QuestionFeed() {
  const [newQuestion, setNewQuestion] = useState('');
  const [tags, setTags] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [showReactions, setShowReactions] = useState(null);
  const [replyFormat, setReplyFormat] = useState({
    selection: { start: 0, end: 0 },
    formats: new Set()
  });
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyText, setEditReplyText] = useState('');
  const [showReplyReactions, setShowReplyReactions] = useState(null);
  const [replyToReplyId, setReplyToReplyId] = useState(null);
  const [nestedReplyText, setNestedReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const questionsPerPage = 5;
  const characterLimit = 200;

  // Handle tag selection
  const handleTagSelect = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setTags(selectedTags.join(', '));
  };

  // Validate for profanity
  const validateProfanity = (text) => {
    return filter.isProfane(text);
  };

  // Fetch questions from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'questions'), (snapshot) => {
      const questionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuestions(questionsData);
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  // Check if question is "hot" (high engagement in last 24h)
  const isHotQuestion = (question) => {
    const lastDay = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const questionDate = new Date(question.date);
    return questionDate > lastDay && (question.votes > 5 || (question.replies && question.replies.length > 2));
  };

  // Handle reactions
  const handleReaction = async (questionId, reaction) => {
    const questionRef = doc(db, 'questions', questionId);
    const question = questions.find((q) => q.id === questionId);
    const reactions = question.reactions || {};
    reactions[reaction] = (reactions[reaction] || 0) + 1;
    await updateDoc(questionRef, { reactions });
    setShowReactions(null);
  };

  // Share question
  const handleShare = async (question) => {
    const shareText = `Check out this question: ${question.text}`;
    try {
      await navigator.share({
        title: 'Shared Question',
        text: shareText,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText + '\n' + window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Handle form submission for new questions
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newQuestion.trim() === '') {
      alert('Please enter a question.');
      return;
    }
    if (newQuestion.length > characterLimit) {
      alert(`Question exceeds the character limit of ${characterLimit}.`);
      return;
    }

    // Combine selected tags with any custom tags
    const customTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    const allTags = [...new Set([...selectedTags, ...customTags])];

    // Check for profanity in question
    if (validateProfanity(newQuestion)) {
      alert('Please keep the language appropriate.');
      return;
    }

    // Check for profanity in tags
    if (allTags.some(tag => validateProfanity(tag))) {
      alert('Please use appropriate tags.');
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
    };

    try {
      await addDoc(collection(db, 'questions'), question);
      setNewQuestion('');
      setTags('');
      setSelectedTags([]);
      setShowQuestionForm(false);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error adding question: ', error);
    }
  };

  // Handle upvoting a question
  const handleUpvote = async (id) => {
    const questionRef = doc(db, 'questions', id);
    const question = questions.find((q) => q.id === id);
    await updateDoc(questionRef, { 
      likes: (question.likes || 0) + 1,
      votes: ((question.likes || 0) + 1) - (question.dislikes || 0)
    });
  };

  // Handle downvoting a question
  const handleDownvote = async (id) => {
    const questionRef = doc(db, 'questions', id);
    const question = questions.find((q) => q.id === id);
    await updateDoc(questionRef, { 
      dislikes: (question.dislikes || 0) + 1,
      votes: (question.likes || 0) - ((question.dislikes || 0) + 1)
    });
  };

  // Handle deleting a question
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'questions', id));
      setCurrentPage(1);
    } catch (error) {
      console.error('Error deleting question: ', error);
    }
  };

  // Handle editing a question
  const handleEdit = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  // Save the edited question
  const saveEdit = async (id) => {
    // Check for profanity in edited text
    if (validateProfanity(editText)) {
      alert('Please keep the language appropriate.');
      return;
    }

    const questionRef = doc(db, 'questions', id);
    await updateDoc(questionRef, { text: editText });
    setEditingId(null);
    setEditText('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  // Handle replying to a question
  const handleReply = (id) => {
    setReplyingToId(id);
  };

  // Submit a reply
  const submitReply = async (id) => {
    if (replyText.trim() === '') {
      alert('Please enter a reply.');
      return;
    }

    // Check for profanity in reply
    if (validateProfanity(replyText)) {
      alert('Please keep the language appropriate.');
      return;
    }

    const reply = {
      id: Date.now(),
      text: replyText,
      date: new Date().toISOString(),
    };

    const questionRef = doc(db, 'questions', id);
    const question = questions.find((q) => q.id === id);
    await updateDoc(questionRef, { replies: [...question.replies, reply] });

    setReplyText('');
    setReplyingToId(null);
  };

  // Format text helpers
  const applyFormat = (type) => {
    const textarea = document.querySelector(`#reply-${replyingToId}`);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = replyText.substring(start, end);
    
    // Update format tracking
    setReplyFormat(prev => {
      const newFormats = new Set(prev.formats);
      if (newFormats.has(type)) {
        newFormats.delete(type);
      } else {
        newFormats.add(type);
      }
      return {
        selection: { start, end },
        formats: newFormats
      };
    });

    // Apply visual styling
    const style = window.getComputedStyle(textarea);
    const existingStyles = {
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      textDecoration: style.textDecoration
    };

    switch (type) {
      case 'bold':
        textarea.style.fontWeight = existingStyles.fontWeight === '700' ? '400' : '700';
        break;
      case 'italic':
        textarea.style.fontStyle = existingStyles.fontStyle === 'italic' ? 'normal' : 'italic';
        break;
      case 'underline':
        textarea.style.textDecoration = existingStyles.textDecoration.includes('underline') ? 'none' : 'underline';
        break;
    }
  };

  // Handle reply reactions
  const handleReplyReaction = async (questionId, replyId, reaction) => {
    const questionRef = doc(db, 'questions', questionId);
    const question = questions.find((q) => q.id === questionId);
    const updatedReplies = question.replies.map(reply => {
      if (reply.id === replyId) {
        const reactions = reply.reactions || {};
        reactions[reaction] = (reactions[reaction] || 0) + 1;
        return { ...reply, reactions };
      }
      return reply;
    });
    await updateDoc(questionRef, { replies: updatedReplies });
    setShowReplyReactions(null);
  };

  // Edit reply
  const handleEditReply = async (questionId, replyId) => {
    const questionRef = doc(db, 'questions', questionId);
    const question = questions.find((q) => q.id === questionId);
    const updatedReplies = question.replies.map(reply => {
      if (reply.id === replyId) {
        return { ...reply, text: editReplyText };
      }
      return reply;
    });
    await updateDoc(questionRef, { replies: updatedReplies });
    setEditingReplyId(null);
    setEditReplyText('');
  };

  // Submit nested reply
  const submitNestedReply = async (questionId, parentReplyId) => {
    if (nestedReplyText.trim() === '') {
      alert('Please enter a reply.');
      return;
    }

    if (validateProfanity(nestedReplyText)) {
      alert('Please keep the language appropriate.');
      return;
    }

    const questionRef = doc(db, 'questions', questionId);
    const question = questions.find((q) => q.id === questionId);
    const nestedReply = {
      id: Date.now(),
      text: nestedReplyText,
      date: new Date().toISOString(),
      parentId: parentReplyId,
      reactions: {},
    };

    const updatedReplies = [...question.replies, nestedReply];
    await updateDoc(questionRef, { replies: updatedReplies });
    setNestedReplyText('');
    setReplyToReplyId(null);
  };

  // Sort questions by votes or date
  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.votes - a.votes;
    } else {
      return new Date(b.date) - new Date(a.date);
    }
  });

  // Filter questions by search query and selected tag
  const filteredQuestions = sortedQuestions.filter((question) => {
    const matchesSearch = question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag ? question.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  // Pagination logic
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get unique tags from all questions
  const allTags = [...new Set(questions.flatMap((q) => q.tags))];

  // Add toggle function for replies
  const toggleReplies = (questionId) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#8B0000] py-12">
      {/* Header */}
      <header className="bg-[#700000] p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl text-[#FFD700] font-bold">Peer Help</h1>
          <motion.input
            variants={searchInputVariants}
            initial="initial"
            whileFocus="focus"
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
            onClick={() => setSortBy('date')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-full p-2 mb-2 ${sortBy === 'date' ? 'bg-[#FFD700] text-[#8B0000]' : 'bg-[#600000] text-[#FFD700]'} rounded-lg font-bold transition duration-300`}
          >
            Sort by Date
          </motion.button>
          <motion.button
            onClick={() => setSortBy('votes')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-full p-2 ${sortBy === 'votes' ? 'bg-[#FFD700] text-[#8B0000]' : 'bg-[#600000] text-[#FFD700]'} rounded-lg font-bold transition duration-300`}
          >
            Sort by Votes
          </motion.button>

          {/* Tag Filters */}
          <h3 className="text-[#FFD700] font-bold mt-6 mb-2">Tags</h3>
          <div className="space-y-2">
            <motion.button
              onClick={() => setSelectedTag(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full p-2 ${selectedTag === null ? 'bg-[#FFD700] text-[#8B0000]' : 'bg-[#600000] text-[#FFD700]'} rounded-lg font-bold transition duration-300`}
            >
              All Tags
            </motion.button>
            {allTags.map((tag) => (
              <motion.button
                variants={tagVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`w-full p-2 ${selectedTag === tag ? 'bg-[#FFD700] text-[#8B0000]' : 'bg-[#600000] text-[#FFD700]'} rounded-lg font-bold transition duration-300`}
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
                whileTap="tap"
                className="mb-4 p-4 bg-[#600000] rounded-lg shadow-md border border-[#ffffff20]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {isHotQuestion(question) && (
                      <FaFire className="text-[#FF4500] text-xl animate-pulse" title="Hot Question" />
                    )}
                    <span className="text-[#FFD700] text-sm flex items-center gap-1">
                      <FaThermometerHalf className="text-sm" />
                      {question.difficulty || 'medium'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => handleShare(question)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
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
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-[#FFD700] text-[#8B0000] px-4 py-2 rounded-lg font-bold transition duration-300 flex items-center"
                      >
                        <FaSave className="mr-2" /> Save
                      </motion.button>
                      <motion.button
                        onClick={cancelEdit}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
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
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-[#FFD700] hover:text-[#00FF00] transition-colors duration-200 p-1"
                        >
                          <FaThumbsUp className="text-xl" />
                        </motion.button>
                        <span className="text-[#00FF00] text-sm font-bold">{question.likes || 0}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <motion.button
                          onClick={() => handleDownvote(question.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-[#FFD700] hover:text-[#FF0000] transition-colors duration-200 p-1"
                        >
                          <FaThumbsDown className="text-xl" />
                        </motion.button>
                        <span className="text-[#FF0000] text-sm font-bold">{question.dislikes || 0}</span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 ml-4">
                      <p className="text-[#FFD700]">{question.text}</p>
                      <div className="mt-2 text-[#FFD700] text-sm">
                        Tags: {question.tags.map((tag) => (
                          <motion.span
                            key={tag}
                            whileHover={{
                              scale: 1.1,
                              rotate: [-2, 2],
                              transition: {
                                rotate: {
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                  duration: 0.3
                                }
                              }
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedTag(tag)}
                            className="inline-block bg-[#700000] px-2 py-1 rounded-lg mr-2 cursor-pointer"
                          >
                            {tag}
                          </motion.span>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-end space-x-2">
                        <motion.button
                          onClick={() => handleEdit(question.id, question.text)}
                          whileHover={{ scale: 1.1, x: 2 }}
                          whileTap={{ scale: 0.9, x: -2 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          className="text-[#FFD700] hover:text-[#FFA500] flex items-center"
                        >
                          <FaEdit className="mr-2" /> Edit
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(question.id)}
                          whileHover={{ scale: 1.1, x: 2 }}
                          whileTap={{ scale: 0.9, x: -2 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          className="text-[#FFD700] hover:text-[#FF0000] flex items-center"
                        >
                          <FaTrash className="mr-2" /> Delete
                        </motion.button>
                        <motion.button
                          onClick={() => handleReply(question.id)}
                          whileHover={{ scale: 1.1, x: 2 }}
                          whileTap={{ scale: 0.9, x: -2 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          className="text-[#FFD700] hover:text-[#FFA500] flex items-center"
                        >
                          <FaReply className="mr-2" /> Reply
                        </motion.button>
                      </div>

                      {/* Updated Reactions Section */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {question.reactions && Object.entries(question.reactions).map(([reaction, count]) => (
                            <span key={reaction} className="bg-[#700000] px-2 py-1 rounded-full text-sm flex items-center gap-1">
                              {reaction === 'smile' && <BsEmojiSmile />}
                              {reaction === 'love' && <BsEmojiHeartEyes />}
                              {reaction === 'angry' && <BsEmojiAngry />}
                              {reaction === 'thinking' && <BsEmojiNeutral />}
                              {reaction === 'confused' && <BsEmojiDizzy />}
                              {reaction === 'haha' && <BsEmojiLaughing />}
                              {reaction === 'cool' && <BsEmojiSunglasses />}
                              {reaction === 'celebrate' && <BsStars />}
                              {reaction === 'helpful' && <FaThumbsUp />}
                              <span className="ml-1">{count}</span>
                            </span>
                          ))}
                        </div>
                        <motion.button
                          onClick={() => setShowReactions(showReactions === question.id ? null : question.id)}
                          className="text-[#FFD700] text-sm hover:text-[#FFA500]"
                        >
                          Feelings About This
                        </motion.button>
                        {showReactions === question.id && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-wrap gap-2 bg-[#700000] p-2 rounded-lg shadow-lg absolute z-10"
                          >
                            <motion.button
                              variants={reactionButtonVariants}
                              initial="initial"
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => handleReaction(question.id, 'smile')}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Smile"
                            >
                              <BsEmojiSmile className="text-xl" />
                            </motion.button>
                            <motion.button
                              variants={reactionButtonVariants}
                              initial="initial"
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => handleReaction(question.id, 'love')}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Love"
                            >
                              <BsEmojiHeartEyes className="text-xl" />
                            </motion.button>
                            <motion.button
                              variants={reactionButtonVariants}
                              initial="initial"
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => handleReaction(question.id, 'haha')}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Haha"
                            >
                              <BsEmojiLaughing className="text-xl" />
                            </motion.button>
                            <motion.button
                              variants={reactionButtonVariants}
                              initial="initial"
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => handleReaction(question.id, 'thinking')}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Thinking"
                            >
                              <BsEmojiNeutral className="text-xl" />
                            </motion.button>
                            <motion.button
                              variants={reactionButtonVariants}
                              initial="initial"
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => handleReaction(question.id, 'confused')}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Confused"
                            >
                              <BsEmojiDizzy className="text-xl" />
                            </motion.button>
                            <motion.button
                              variants={reactionButtonVariants}
                              initial="initial"
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => handleReaction(question.id, 'angry')}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Angry"
                            >
                              <BsEmojiAngry className="text-xl" />
                            </motion.button>
                            <motion.button
                              variants={reactionButtonVariants}
                              initial="initial"
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => handleReaction(question.id, 'cool')}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Cool"
                            >
                              <BsEmojiSunglasses className="text-xl" />
                            </motion.button>
                            <motion.button
                              variants={reactionButtonVariants}
                              initial="initial"
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => handleReaction(question.id, 'helpful')}
                              className="text-[#FFD700] hover:text-[#FFA500] p-1"
                              title="Helpful"
                            >
                              <FaThumbsUp className="text-xl" />
                            </motion.button>
                          </motion.div>
                        )}
                      </div>

                      {/* Updated Reply Input with Visual Formatting */}
                      {replyingToId === question.id && (
                        <div className="mt-4">
                          <div className="bg-[#700000] rounded-lg p-2">
                            <div className="flex gap-2 mb-2 border-b border-[#FFD700] pb-2">
                              <motion.button
                                onClick={() => applyFormat('bold')}
                                whileHover={{ scale: 1.2, y: -2 }}
                                whileTap={{ scale: 0.9, y: 0 }}
                                transition={{ type: "spring", stiffness: 400 }}
                                className={`text-[#FFD700] hover:text-[#FFA500] p-1 ${
                                  replyFormat.formats.has('bold') ? 'bg-[#600000] rounded' : ''
                                }`}
                                title="Bold"
                              >
                                <FaBold />
                              </motion.button>
                              <motion.button
                                onClick={() => applyFormat('italic')}
                                whileHover={{ scale: 1.2, y: -2 }}
                                whileTap={{ scale: 0.9, y: 0 }}
                                transition={{ type: "spring", stiffness: 400 }}
                                className={`text-[#FFD700] hover:text-[#FFA500] p-1 ${
                                  replyFormat.formats.has('italic') ? 'bg-[#600000] rounded' : ''
                                }`}
                                title="Italic"
                              >
                                <FaItalic />
                              </motion.button>
                              <motion.button
                                onClick={() => applyFormat('underline')}
                                whileHover={{ scale: 1.2, y: -2 }}
                                whileTap={{ scale: 0.9, y: 0 }}
                                transition={{ type: "spring", stiffness: 400 }}
                                className={`text-[#FFD700] hover:text-[#FFA500] p-1 ${
                                  replyFormat.formats.has('underline') ? 'bg-[#600000] rounded' : ''
                                }`}
                                title="Underline"
                              >
                                <FaUnderline />
                              </motion.button>
                            </div>
                            <textarea
                              id={`reply-${replyingToId}`}
                              placeholder="Write a reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onSelect={(e) => {
                                const target = e.target;
                                setReplyFormat(prev => ({
                                  ...prev,
                                  selection: {
                                    start: target.selectionStart,
                                    end: target.selectionEnd
                                  }
                                }));
                              }}
                              className="bg-[#600000] text-[#FFD700] p-2 rounded-lg w-full placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none"
                              rows={3}
                              style={{
                                fontFamily: 'inherit'
                              }}
                            />
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-[#FFD700] text-sm">
                                {replyText.length} characters
                              </span>
                              <div className="flex space-x-2">
                                <motion.button
                                  onClick={() => setReplyingToId(null)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="bg-[#600000] text-[#FFD700] px-4 py-2 rounded-lg font-bold transition duration-300 flex items-center"
                                >
                                  <FaTimes className="mr-2" /> Cancel
                                </motion.button>
                                <motion.button
                                  onClick={() => submitReply(question.id)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="bg-[#FFD700] text-[#8B0000] px-4 py-2 rounded-lg font-bold transition duration-300 flex items-center"
                                >
                                  <FaSave className="mr-2" /> Submit
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Updated Display Replies */}
                      {question.replies && question.replies.length > 0 && (
                        <div className="mt-4">
                          <motion.button
                            onClick={() => toggleReplies(question.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400 }}
                            className="flex items-center gap-2 text-[#FFD700] text-sm hover:text-[#FFA500]"
                          >
                            {expandedReplies.has(question.id) ? (
                              <FaTimes className="text-sm" />
                            ) : (
                              <FaReply className="text-sm" />
                            )}
                            {question.replies.length} {question.replies.length === 1 ? 'Reply' : 'Replies'}
                          </motion.button>
                          
                          <AnimatePresence mode="wait">
                            {expandedReplies.has(question.id) && (
                              <motion.div
                                variants={replyVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                custom={index}
                                className="pl-4 border-l-2 border-[#FFD700]"
                              >
                                {question.replies.map((reply) => (
                                  <div key={reply.id} className="mt-4">
                                    {editingReplyId === reply.id ? (
                                      <div className="bg-[#700000] rounded-lg p-2">
                                        <motion.textarea
                                          value={editReplyText}
                                          onChange={(e) => setEditReplyText(e.target.value)}
                                          className="bg-[#600000] text-[#FFD700] p-2 rounded-lg w-full placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none"
                                          rows={3}
                                        />
                                        <div className="mt-2 flex justify-end space-x-2">
                                          <motion.button
                                            onClick={() => {
                                              setEditingReplyId(null);
                                              setEditReplyText('');
                                            }}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="bg-[#600000] text-[#FFD700] px-4 py-2 rounded-lg font-bold transition duration-300 flex items-center"
                                          >
                                            <FaTimes className="mr-2" /> Cancel
                                          </motion.button>
                                          <motion.button
                                            onClick={() => handleEditReply(question.id, reply.id)}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="bg-[#FFD700] text-[#8B0000] px-4 py-2 rounded-lg font-bold transition duration-300 flex items-center"
                                          >
                                            <FaSave className="mr-2" /> Save
                                          </motion.button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className={`bg-[#700000] rounded-lg p-3 ${reply.parentId ? 'ml-8' : ''}`}>
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <p className="text-[#FFD700] whitespace-pre-wrap">{reply.text}</p>
                                            <div className="mt-2 flex items-center gap-2 text-sm text-[#FFD700]">
                                              <span>{new Date(reply.date).toLocaleString()}</span>
                                              <div className="flex gap-2">
                                                <motion.button
                                                  onClick={() => {
                                                    setEditingReplyId(reply.id);
                                                    setEditReplyText(reply.text);
                                                  }}
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  className="hover:text-[#FFA500]"
                                                >
                                                  <FaEdit />
                                                </motion.button>
                                                <motion.button
                                                  onClick={() => setReplyToReplyId(reply.id)}
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  className="hover:text-[#FFA500]"
                                                >
                                                  <FaReply />
                                                </motion.button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Reply Reactions */}
                                        <div className="mt-2 flex items-center gap-2">
                                          <div className="flex flex-wrap gap-1">
                                            {reply.reactions && Object.entries(reply.reactions).map(([reaction, count]) => (
                                              <span key={reaction} className="bg-[#600000] px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                                {reaction === 'smile' && <BsEmojiSmile />}
                                                {reaction === 'love' && <BsEmojiHeartEyes />}
                                                {reaction === 'helpful' && <FaThumbsUp />}
                                                <span className="ml-1">{count}</span>
                                              </span>
                                            ))}
                                          </div>
                                          <motion.button
                                            onClick={() => setShowReplyReactions(showReplyReactions === reply.id ? null : reply.id)}
                                            className="text-[#FFD700] text-xs hover:text-[#FFA500]"
                                          >
                                            React
                                          </motion.button>
                                          {showReplyReactions === reply.id && (
                                            <motion.div
                                              initial={{ scale: 0.8, opacity: 0 }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              className="flex gap-2 bg-[#600000] p-2 rounded-lg absolute z-10"
                                            >
                                              <motion.button
                                                variants={reactionButtonVariants}
                                                initial="initial"
                                                whileHover="hover"
                                                whileTap="tap"
                                                onClick={() => handleReplyReaction(question.id, reply.id, 'smile')}
                                                className="text-[#FFD700] hover:text-[#FFA500]"
                                              >
                                                <BsEmojiSmile className="text-xl" />
                                              </motion.button>
                                              <motion.button
                                                variants={reactionButtonVariants}
                                                initial="initial"
                                                whileHover="hover"
                                                whileTap="tap"
                                                onClick={() => handleReplyReaction(question.id, reply.id, 'love')}
                                                className="text-[#FFD700] hover:text-[#FFA500]"
                                              >
                                                <BsEmojiHeartEyes className="text-xl" />
                                              </motion.button>
                                              <motion.button
                                                variants={reactionButtonVariants}
                                                initial="initial"
                                                whileHover="hover"
                                                whileTap="tap"
                                                onClick={() => handleReplyReaction(question.id, reply.id, 'helpful')}
                                                className="text-[#FFD700] hover:text-[#FFA500]"
                                              >
                                                <FaThumbsUp />
                                              </motion.button>
                                            </motion.div>
                                          )}
                                        </div>

                                        {/* Nested Reply Input */}
                                        {replyToReplyId === reply.id && (
                                          <div className="mt-2 ml-4">
                                            <motion.textarea
                                              placeholder="Write a reply..."
                                              value={nestedReplyText}
                                              onChange={(e) => setNestedReplyText(e.target.value)}
                                              className="bg-[#600000] text-[#FFD700] p-2 rounded-lg w-full placeholder-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none"
                                              rows={2}
                                            />
                                            <div className="mt-2 flex justify-end space-x-2">
                                              <motion.button
                                                onClick={() => setReplyToReplyId(null)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="bg-[#600000] text-[#FFD700] px-3 py-1 rounded-lg font-bold transition duration-300 text-sm"
                                              >
                                                Cancel
                                              </motion.button>
                                              <motion.button
                                                onClick={() => submitNestedReply(question.id, reply.id)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="bg-[#FFD700] text-[#8B0000] px-3 py-1 rounded-lg font-bold transition duration-300 text-sm"
                                              >
                                                Reply
                                              </motion.button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
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
        {Array.from({ length: Math.ceil(filteredQuestions.length / questionsPerPage) }, (_, i) => (
          <motion.button
            key={i + 1}
            onClick={() => paginate(i + 1)}
            whileHover={{ scale: 1.15, y: -2 }}
            whileTap={{ scale: 0.9, y: 0 }}
            transition={{ type: "spring", stiffness: 400 }}
            className={`p-2 ${currentPage === i + 1 ? 'bg-[#FFD700] text-[#8B0000]' : 'bg-[#600000] text-[#FFD700]'} rounded-lg font-bold transition duration-300`}
          >
            {i + 1}
          </motion.button>
        ))}
      </div>

      {/* "Ask a Question" Button */}
      <div className="fixed bottom-8 right-8 flex items-end">
        <motion.button
          variants={floatingButtonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          onClick={() => setShowQuestionForm(true)}
          className="bg-[#FFD700] text-[#8B0000] px-6 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg"
        >
          <FaHandPointUp className="text-3xl transform -rotate-45" />
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
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-[#700000] p-8 rounded-lg shadow-lg w-full max-w-md"
            >
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
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                    className="flex gap-2"
                  >
                    {['easy', 'medium', 'hard'].map((level, index) => (
                      <motion.button
                        key={level}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{
                          scale: 1.1,
                          y: -2,
                          transition: { type: "spring", stiffness: 400 }
                        }}
                        whileTap={{ scale: 0.95, y: 0 }}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                          difficulty === level
                            ? 'bg-[#FFD700] text-[#8B0000]'
                            : 'bg-[#500000] text-[#FFD700]'
                        }`}
                      >
                        {level}
                      </motion.button>
                    ))}
                  </motion.div>
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
                      {showTagSelector ? 'Hide Tags' : 'Show Tags'}
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
                            whileHover={{ scale: 1.1, rotate: 2 }}
                            whileTap={{ scale: 0.95, rotate: -2 }}
                            transition={{ type: "spring", stiffness: 400 }}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              selectedTags.includes(tag)
                                ? 'bg-[#FFD700] text-[#8B0000]'
                                : 'bg-[#500000] text-[#FFD700]'
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
                      setTags('');
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-[#600000] text-[#FFD700] px-4 py-2 rounded-lg font-bold transition duration-300"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9, y: 0 }}
                    transition={{ type: "spring", stiffness: 400 }}
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
