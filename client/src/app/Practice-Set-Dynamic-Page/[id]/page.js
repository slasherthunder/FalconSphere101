"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

const questions = [
  {
    question: "What is the result of vector A + vector B if both are in the same direction?",
    options: [
      "A vector with smaller magnitude",
      "A vector with greater magnitude",
      "A scalar value",
      "Zero vector"
    ],
    correctIndex: 1,
    hint: "Adding two vectors in the same direction increases the magnitude."
  },
  {
    question: "Which of the following is a scalar quantity?",
    options: ["Force", "Velocity", "Acceleration", "Temperature"],
    correctIndex: 3,
    hint: "Scalars only have magnitude, no direction."
  },
  {
    question: "If vector A = -vector B, what is the angle between them?",
    options: ["0 degrees", "90 degrees", "180 degrees", "360 degrees"],
    correctIndex: 2,
    hint: "They're in opposite directions."
  },
  {
    question: "Which operation is not valid on vectors?",
    options: [
      "Addition",
      "Multiplication by a scalar",
      "Division by a vector",
      "Subtraction"
    ],
    correctIndex: 2,
    hint: "You can't divide by a vector."
  }
];

const QuizPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [guesses, setGuesses] = useState(Array(questions.length).fill(0));
  const [correctAnswers, setCorrectAnswers] = useState(Array(questions.length).fill(false));
  const [shake, setShake] = useState(false);

  const q = questions[currentQ];

  const handleSelect = (index) => {
    if (guesses[currentQ] >= 2 || correctAnswers[currentQ]) return;

    const updatedGuesses = [...guesses];
    updatedGuesses[currentQ] += 1;
    setGuesses(updatedGuesses);

    if (index === q.correctIndex) {
      const updatedCorrect = [...correctAnswers];
      updatedCorrect[currentQ] = true;
      setCorrectAnswers(updatedCorrect);
    } else {
      if (updatedGuesses[currentQ] === 1) {
        setShowHint(true);
      }
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    setSelected(index);
  };

  const nextQuestion = () => {
    setSelected(null);
    setShowHint(false);
    if (currentQ < questions.length - 1) setCurrentQ((prev) => prev + 1);
  };

  const prevQuestion = () => {
    if (currentQ > 0) setCurrentQ((prev) => prev - 1);
    setSelected(null);
    setShowHint(false);
  };

  const resetQuiz = () => {
    setCurrentQ(0);
    setSelected(null);
    setShowHint(false);
    setGuesses(Array(questions.length).fill(0));
    setCorrectAnswers(Array(questions.length).fill(false));
  };

  const isQuizDone = guesses.every((g, i) => g >= 2 || correctAnswers[i]);
  const score = correctAnswers.filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white p-8 text-[#222]">
      <div className="max-w-3xl mx-auto">
        {isQuizDone ? (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-[#700000]/90 rounded-2xl p-6 shadow-xl border border-[#FFD700]/20 ${shake ? 'animate-shake' : ''}`}
          >
            <h2 className="text-3xl font-bold text-center mb-4 text-white">
              Quiz Complete
            </h2>
            <p className="text-xl text-center mb-6 text-white" >
              Your Score: {score} / {questions.length}
            </p>
            <div className="space-y-4">
              {questions.map((question, i) => (
                <div key={i} className="bg-[#FFF8E1] p-4 rounded-xl border border-[#FFD700]/30">
                  <p className="font-semibold mb-2 text-[#8B0000]">
                    Q{i + 1}: {question.question}
                  </p>
                  <p className="text-green-700">
                    Correct Answer: {question.options[question.correctIndex]}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-4 justify-center ">
              <button
                onClick={resetQuiz}
                className="bg-[#FFD700] text-[#8B0000] px-4 py-2 rounded-lg hover:bg-[#fae8e1]"
              >
                Retake Quiz
              </button>
              <button
                onClick={() => router.push(`/courses/${id}`)}
                className="border border-[#FFD700] text-[#FFD700] px-4 py-2 rounded-lg hover:bg-[#fae8e1]"
              >
                Back to Course
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
            className={`bg-[#700000]/90 rounded-2xl p-6 shadow-xl border border-[#FFD700]/20 ${shake ? 'animate-shake' : ''}`}
          >
            <div className="text-[#FFD700] font-bold text-xl mb-4">
              Question {currentQ + 1} of {questions.length}
            </div>
            <div className="text-white text-lg font-semibold mb-6">{q.question}</div>

            <div className="space-y-4">
              {q.options.map((option, index) => {
                let base = "w-full text-left px-4 py-2 rounded-xl border text-lg transition-all duration-200";
                let color = "border-white hover:bg-white/10";
                if (guesses[currentQ] === 2 || correctAnswers[currentQ]) {
                  if (index === q.correctIndex) color = "bg-green-800 border-green-400";
                  else if (index === selected) color = "bg-red-800 border-red-400";
                  else color = "opacity-60 border-white";
                } else if (selected === index) {
                  color = "bg-red-800 border-red-400";
                }
                return (
                  <button
                    key={index}
                    className={`${base} ${color}`}
                    onClick={() => handleSelect(index)}
                    disabled={guesses[currentQ] >= 2 || correctAnswers[currentQ]}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {showHint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 p-4 rounded-lg bg-yellow-900/40 border border-yellow-400 text-yellow-200"
              >
                Hint: {q.hint}
              </motion.div>
            )}

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={prevQuestion}
                disabled={currentQ === 0}
                className="text-[#FFD700] text-lg px-4 py-2 border border-[#FFD700] rounded-lg hover:bg-[#FFD700]/10 disabled:opacity-50"
              >
                Back
              </button>
              <div className="flex gap-2">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 ${
                      i === currentQ
                        ? "bg-[#FFD700] border-[#FFD700]"
                        : "border-[#FFD700]"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextQuestion}
                disabled={currentQ === questions.length - 1 || (guesses[currentQ] < 1 && !correctAnswers[currentQ])}
                className="text-[#FFD700] text-lg px-4 py-2 border border-[#FFD700] rounded-lg hover:bg-[#FFD700]/10 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
