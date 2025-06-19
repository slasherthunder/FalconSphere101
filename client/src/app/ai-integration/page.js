"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AISetGenerator() {
  // State for form inputs
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionTypes, setQuestionTypes] = useState({
    multipleChoice: true,
    trueFalse: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Aaron or jervis put in API here
  const courses = [
    { id: "testClass1", name: "testClass1", units: ["Unit 1a", "Unit 2a", "Unit 3a", "Cumulative Class Questions"] },
    { id: "testClass2", name: "testClass2", units: ["Unit 1b", "Unit 2b", "Unit 3b", "Cumulative Class Questions"] },
    { id: "testClass3", name: "testClass3", units: ["Unit 1c", "Unit 2c", "Unit 3c", "Cumulative Class Questions"] }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const buttonVariants = {
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
// Backend bonus ;).
  const handleGenerate = () => {
    // Check if at least one question type is selected
    const atLeastOneSelected = Object.values(questionTypes).some(Boolean);
    if (!atLeastOneSelected) {
      alert("Please select at least one question type.");
      return;
    }

    setIsGenerating(true);
    console.log({
      course: selectedCourse,
      unit: selectedUnit,
      difficulty,
      questionTypes
    });

    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handleQuestionTypeChange = (type) => {
    setQuestionTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <div className="min-h-screen w-full bg-white py-12 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        <motion.div 
          className="bg-[#8B0000] p-8 rounded-2xl shadow-2xl border border-[#ffffff20] overflow-hidden"
          whileHover={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <motion.h2 
              className="text-5xl text-[#FFD700] font-bold tracking-wide"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              AI Set Generator
            </motion.h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Preview Section */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="w-full lg:w-1/2 p-8 bg-[#8B0000] rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <h2 className="text-3xl text-[#FFD700] font-bold tracking-wide mb-6">Preview</h2>
              
              <div className="space-y-6">
                <motion.div 
                  className="text-[#FFD700] text-4xl font-semibold mb-4 tracking-wide"
                  whileHover={{ scale: 1.01 }}
                >
                  {selectedCourse || "Select a Course"}
                </motion.div>
                
                <div className="space-y-4">
                  <motion.div 
                    className="text-[#FFD700] text-xl font-semibold tracking-wide"
                    whileHover={{ scale: 1.01 }}
                  >
                    {selectedUnit ? `Unit: ${selectedUnit}` : "No unit selected"}
                  </motion.div>
                        
                  <div className="pt-4 border-t border-[#FFD700]/20">
                    <motion.div 
                      className="text-[#FFD700] text-lg tracking-wide"
                      whileHover={{ scale: 1.01 }}
                    >
                      Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </motion.div>
                    
                    <motion.div 
                      className="text-[#FFD700] text-lg tracking-wide mt-2"
                      whileHover={{ scale: 1.01 }}
                    >
                      Question Types: 
                      {Object.entries(questionTypes)
                        .filter(([_, value]) => value)
                        .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
                        .join(', ')}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Configuration Section */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="w-full lg:w-1/2 p-8 bg-[#8B0000] rounded-xl shadow-xl border border-[#ffffff10]"
            >
              <h2 className="text-3xl text-[#FFD700] font-bold mb-8 tracking-wide">Configuration</h2>
              
              <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                {/* Course Selection */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Course:</label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    value={selectedCourse}
                    onChange={(e) => {
                      setSelectedCourse(e.target.value);
                      setSelectedUnit(""); // Reset unit when course changes
                    }}
                    className="w-full p-4 border-2 rounded-xl bg-[#700000] text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 border-[#FFD700]"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </motion.select>
                </div>

                {/* Unit Selection */}
                {selectedCourse && (
                  <div>
                    <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Unit:</label>
                    <motion.select
                      whileFocus={{ scale: 1.02 }}
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full p-4 border-2 rounded-xl bg-[#700000] text-[#FFD700] focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all duration-300 border-[#FFD700]"
                    >
                      <option value="">Select a unit (optional)</option>
                      {courses.find(c => c.id === selectedCourse)?.units.map((unit, index) => (
                        <option key={index} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </motion.select>
                  </div>
                )}
                {/* Difficulty */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Difficulty:</label>
                  <div className="flex gap-4">
                    {['easy', 'medium', 'hard'].map((level) => (
                      <motion.button
                        key={level}
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`px-5 py-3 rounded-xl font-bold shadow-lg ${
                          difficulty === level
                            ? "bg-[#FFD700] text-[#8B0000]"
                            : "bg-[#700000] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#8B0000]"
                        } transition-all duration-300 capitalize`}
                      >
                        {level}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Question Types */}
                <div>
                  <label className="block text-[#FFD700] text-lg font-medium mb-3 tracking-wide">Question Types:</label>
                  <div className="space-y-3">
                    {Object.keys(questionTypes).map((type) => (
                      <label key={type} className="flex items-center space-x-3">
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          className="relative"
                        >
                          <input
                            type="checkbox"
                            checked={questionTypes[type]}
                            onChange={() => handleQuestionTypeChange(type)}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 rounded-full shadow-inner transition-colors duration-300 ${questionTypes[type] ? 'bg-[#FFD700]' : 'bg-[#700000]'}`}></div>
                          <div
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${questionTypes[type] ? 'translate-x-6' : ''}`}
                          ></div>
                        </motion.div>
                        <span className="text-[#FFD700] text-lg tracking-wide">
                          {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleGenerate}
                  disabled={!selectedCourse || isGenerating}
                  className={`w-full ${isGenerating ? 'bg-[#FFD700]/70' : 'bg-[#FFD700]'} text-[#8B0000] px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-[#FFC300] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#8B0000] border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </div>
                  ) : (
                    "Generate Custom Set"
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}