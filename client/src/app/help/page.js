"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaEnvelope, FaComments, FaChevronDown, FaPaperPlane, FaTimes, FaSpinner, FaQuestionCircle } from "react-icons/fa";

export default function Help() {
  const faqs = [
    { 
      category: "Account", 
      questions: [
        { question: "How do I reset my password?", answer: "Go to settings and click on 'Reset Password' to receive an email with instructions." },
        { question: "How do I update my email address?", answer: "You can update your email address in the 'Account Settings' section." }
      ]
    },
    { 
      category: "Support", 
      questions: [
        { question: "How can I contact support?", answer: "You can reach out via our support page or email us at tphs.acdc@gmail.com." },
        { question: "What are your support hours?", answer: "Our support team is available 24/7." }
      ]
    },
    { 
      category: "Legal", 
      questions: [
        { question: "Where can I find the terms of service?", answer: "The terms of service can be found at the bottom of the homepage." },
        { question: "How do I request a refund?", answer: "Refund requests can be submitted through the 'Billing' section of your account." }
      ]
    }
  ];

  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "ai",
      content: "Hello! I'm your virtual assistant. I can help you with questions about study sets, account management, and general platform usage. How can I assist you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Add user message
    const userMessage = {
      type: "user",
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate response delay
    setTimeout(() => {
      const responses = [
        "I understand your question. Let me help you with that.",
        "That's a good question! Here's what you need to know...",
        "I can help you with that. Here's the information you're looking for...",
        "Let me explain that for you...",
        "I'll help you find the answer to that...",
        "Based on your question, here's what I can tell you...",
        "I have information about that. Here's what you should know...",
        "Let me provide you with the details you need...",
        "I can assist you with that. Here's what you need to know...",
        "I'll help you understand that better..."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiMessage = {
        type: "ai",
        content: randomResponse,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFAQs = faqs
    .filter(category => 
      selectedCategory ? category.category === selectedCategory : true
    )
    .map(category => ({
      ...category,
      questions: category.questions.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B0000] via-[#700000] to-[#600000] py-12 px-4">
      <motion.div 
        className="container mx-auto max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-block mb-6"
          >
            <FaQuestionCircle className="text-[#FFD700] text-6xl mb-4" />
          </motion.div>
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFC300] mb-6">
            Help Center
          </h1>
          <p className="text-[#FFD700]/90 text-xl max-w-2xl mx-auto">
            Find answers to common questions or contact us for further assistance.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-5 pl-14 rounded-2xl bg-[#700000]/80 backdrop-blur-lg text-[#FFD700] placeholder-[#FFD700]/50 
              focus:outline-none focus:ring-2 focus:ring-[#FFD700] border border-[#FFD700]/20 shadow-lg
              transition-all duration-300 hover:shadow-xl"
            />
            <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-[#FFD700]/50 text-xl" />
          </div>
        </motion.div>

        {/* Category Filters */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.button
            onClick={() => setSelectedCategory(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg
              ${selectedCategory === null 
                ? "bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000]" 
                : "bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] hover:bg-[#600000]"
              }`}
          >
            All
          </motion.button>
          {faqs.map((category, index) => (
            <motion.button
              key={index}
              onClick={() => setSelectedCategory(category.category)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg
                ${selectedCategory === category.category 
                  ? "bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000]" 
                  : "bg-[#700000]/80 backdrop-blur-sm text-[#FFD700] hover:bg-[#600000]"
                }`}
            >
              {category.category}
            </motion.button>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <motion.div 
          className="space-y-12 mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {filteredFAQs.map((category, catIndex) => (
            <motion.div 
              key={catIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 + catIndex * 0.1 }}
              className="bg-[#700000]/50 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-[#FFD700]/10"
            >
              <h2 className="text-3xl font-bold text-[#FFD700] mb-8">{category.category}</h2>
              <div className="space-y-4">
                {category.questions.map((faq, index) => (
                  <motion.div 
                    key={index}
                    className="bg-[#600000]/80 backdrop-blur-sm rounded-xl shadow-lg border border-[#FFD700]/10 
                    overflow-hidden transition-all duration-300 hover:shadow-xl"
                    whileHover={{ scale: 1.02 }}
                  >
                    <button
                      className="flex justify-between items-center w-full p-6 text-[#FFD700] font-medium text-xl"
                      onClick={() => toggleFAQ(`${catIndex}-${index}`)}
                    >
                      {faq.question}
                      <motion.span
                        animate={{ rotate: openIndex === `${catIndex}-${index}` ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <FaChevronDown className="text-xl" />
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {openIndex === `${catIndex}-${index}` && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-6 pb-6"
                        >
                          <p className="text-[#FFD700]/90 text-lg leading-relaxed">{faq.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact Support Section */}
        <motion.div 
          className="text-center bg-gradient-to-br from-[#700000]/90 to-[#600000]/90 backdrop-blur-lg rounded-2xl p-12 shadow-2xl border border-[#FFD700]/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFC300] mb-6">
            Still need help?
          </h2>
          <p className="text-[#FFD700]/90 text-xl mb-10">
            Reach out to us through any of these channels.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <motion.a 
              href="mailto:tphs.acdc@gmail.com?subject=Help Request"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button className="w-full sm:w-auto bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] font-bold px-10 py-5 rounded-xl 
                transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center gap-3 text-lg">
                <FaEnvelope className="text-2xl" />
                Email Support
              </button>
            </motion.a>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsChatOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] font-bold px-10 py-5 rounded-xl 
                transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
            >
              <FaComments className="text-2xl" />
              Live Chat
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-4 right-4 w-96 h-[600px] bg-gradient-to-br from-[#700000]/95 to-[#600000]/95 backdrop-blur-xl 
              rounded-2xl shadow-2xl border border-[#FFD700]/20 overflow-hidden flex flex-col"
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#600000] to-[#500000] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaComments className="text-[#FFD700] text-xl" />
                <h3 className="text-[#FFD700] font-semibold">Virtual Assistant</h3>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-[#FFD700] hover:text-[#FFC300] transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000]"
                        : "bg-[#600000] text-[#FFD700]"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#600000] p-4 rounded-2xl text-[#FFD700] flex items-center gap-3 shadow-lg">
                    <FaSpinner className="animate-spin text-lg" />
                    <span>Thinking...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#FFD700]/20 bg-[#600000]/50">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 p-3 rounded-xl bg-[#500000] text-[#FFD700] placeholder-[#FFD700]/50 
                    focus:outline-none focus:ring-2 focus:ring-[#FFD700] border border-[#FFD700]/20
                    disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-[#FFD700] to-[#FFC300] text-[#8B0000] p-3 rounded-xl
                    transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane className="text-xl" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
