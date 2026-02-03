import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RetroScreen from './RetroScreen';
import { Check, X, Zap, Trophy, Star } from 'lucide-react';

const MindCareQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [flashColor, setFlashColor] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [combo, setCombo] = useState(0);
  const [particles, setParticles] = useState([]);
  const [shake, setShake] = useState(false);

  const questions = [
    {
      question: "What is a healthy way to manage stress?",
      options: [
        "Ignoring your feelings",
        "Deep breathing exercises",
        "Staying up all night",
        "Avoiding all challenges"
      ],
      correct: 1
    },
    {
      question: "Which practice helps improve mindfulness?",
      options: [
        "Multitasking constantly",
        "Meditation",
        "Skipping meals",
        "Excessive screen time"
      ],
      correct: 1
    },
    {
      question: "What is emotional intelligence?",
      options: [
        "Ignoring emotions",
        "Understanding and managing emotions",
        "Being emotionless",
        "Suppressing feelings"
      ],
      correct: 1
    },
    {
      question: "How much sleep do adults typically need?",
      options: [
        "3-4 hours",
        "5-6 hours",
        "7-9 hours",
        "10-12 hours"
      ],
      correct: 2
    },
    {
      question: "What is a sign of good mental health?",
      options: [
        "Never feeling sad",
        "Avoiding all social interaction",
        "Coping effectively with stress",
        "Working 24/7"
      ],
      correct: 2
    }
  ];

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setIsBooting(false);
    }, 2000);
    return () => clearTimeout(bootTimer);
  }, []);

  const createParticles = (isCorrect) => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: isCorrect ? '#10b981' : '#ef4444',
      size: Math.random() * 8 + 4,
      duration: Math.random() * 1 + 0.5
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  };

  const handleAnswer = (answerIndex) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === questions[currentQuestion].correct;
    
    if (isCorrect) {
      setScore(score + 1);
      setCombo(combo + 1);
      setFlashColor('green');
      createParticles(true);
    } else {
      setCombo(0);
      setFlashColor('red');
      setShake(true);
      createParticles(false);
      setTimeout(() => setShake(false), 500);
    }

    setShowFeedback(true);

    setTimeout(() => {
      setFlashColor(null);
      setShowFeedback(false);
      setSelectedAnswer(null);

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setQuizCompleted(true);
      }
    }, 1500);
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setCombo(0);
    setSelectedAnswer(null);
    setQuizCompleted(false);
    setQuizStarted(false);
  };

  const getGrade = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    return 'D';
  };

  return (
    <div className="relative">
      {/* Particle Effects */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: `${particle.x}%`, 
              y: `${particle.y}%`, 
              scale: 1, 
              opacity: 1 
            }}
            animate={{ 
              y: `${particle.y - 50}%`, 
              scale: 0, 
              opacity: 0 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: particle.duration }}
            className="absolute pointer-events-none z-50"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: '50%',
              boxShadow: `0 0 10px ${particle.color}`
            }}
          />
        ))}
      </AnimatePresence>

      <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <RetroScreen flashColor={flashColor} isBooting={isBooting}>
          {!isBooting && (
            <AnimatePresence mode="wait">
              {!quizStarted ? (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center h-full space-y-6"
                >
                  <motion.div
                    animate={{ 
                      textShadow: [
                        '0 0 10px #10b981',
                        '0 0 20px #10b981',
                        '0 0 10px #10b981'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <h1 className="text-5xl font-bold text-green-500 mb-4">
                      MINDCARE WELLNESS QUIZ
                    </h1>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-center max-w-md"
                  >
                    Test your knowledge about mental health and wellness practices.
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.1, boxShadow: '0 0 30px #10b981' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startQuiz}
                    className="mt-8 px-12 py-5 bg-green-500 text-black font-bold text-2xl rounded-lg border-4 border-green-400 hover:bg-green-400 transition-all shadow-lg shadow-green-500/50"
                  >
                    <span className="flex items-center gap-3">
                      <Zap className="w-6 h-6" />
                      START QUIZ
                      <Zap className="w-6 h-6" />
                    </span>
                  </motion.button>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-4 text-sm opacity-70"
                  >
                    {questions.length} questions • Multiple choice • Combo system
                  </motion.div>
                </motion.div>
              ) : quizCompleted ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <Trophy className="w-32 h-32 text-green-500" />
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-5xl font-bold text-green-500 mb-4"
                  >
                    QUIZ COMPLETE!
                  </motion.h1>
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="text-7xl font-bold text-green-400"
                    >
                      {score} / {questions.length}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="text-4xl"
                    >
                      Grade: <span className="text-green-500 font-bold">{getGrade()}</span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9 }}
                      className="text-2xl opacity-80"
                    >
                      {((score / questions.length) * 100).toFixed(0)}% Correct
                    </motion.div>
                    {score === questions.length && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.1 }}
                        className="flex items-center justify-center gap-2 text-2xl text-yellow-400"
                      >
                        <Star className="w-8 h-8 fill-yellow-400" />
                        PERFECT SCORE!
                        <Star className="w-8 h-8 fill-yellow-400" />
                      </motion.div>
                    )}
                  </div>
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                    whileHover={{ scale: 1.1, boxShadow: '0 0 30px #10b981' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={restartQuiz}
                    className="mt-8 px-12 py-5 bg-green-500 text-black font-bold text-2xl rounded-lg border-4 border-green-400 hover:bg-green-400 transition-all shadow-lg shadow-green-500/50"
                  >
                    TRY AGAIN
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key={`question-${currentQuestion}`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="h-full flex flex-col"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-green-500/30">
                    <div className="text-sm flex items-center gap-2">
                      <span>Question {currentQuestion + 1} / {questions.length}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {combo > 1 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border-2 border-yellow-500 rounded-full"
                        >
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="text-yellow-500 font-bold">x{combo} COMBO!</span>
                        </motion.div>
                      )}
                      <div className="text-sm font-bold">
                        Score: <span className="text-green-500">{score}</span>
                      </div>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="flex-1">
                    <motion.h2
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-3xl font-bold mb-8 text-green-400"
                    >
                      {questions[currentQuestion].question}
                    </motion.h2>

                    {/* Answer Options */}
                    <div className="space-y-4">
                      {questions[currentQuestion].options.map((option, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ 
                            scale: selectedAnswer === null ? 1.03 : 1, 
                            x: selectedAnswer === null ? 10 : 0,
                            boxShadow: selectedAnswer === null ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none'
                          }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleAnswer(index)}
                          disabled={selectedAnswer !== null}
                          className={`w-full text-left p-5 rounded-lg border-2 transition-all ${
                            selectedAnswer === index
                              ? index === questions[currentQuestion].correct
                                ? 'border-green-500 bg-green-500/30 shadow-lg shadow-green-500/50'
                                : 'border-red-500 bg-red-500/30 shadow-lg shadow-red-500/50'
                              : selectedAnswer !== null && index === questions[currentQuestion].correct
                              ? 'border-green-500 bg-green-500/30 shadow-lg shadow-green-500/50'
                              : 'border-green-500/30 hover:border-green-500 hover:bg-green-500/10'
                          } ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-4">
                              <span className="text-green-500 font-bold text-xl">{String.fromCharCode(65 + index)}.</span>
                              <span className="text-lg">{option}</span>
                            </span>
                            {showFeedback && selectedAnswer === index && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className="flex-shrink-0"
                              >
                                {index === questions[currentQuestion].correct ? (
                                  <Check className="w-8 h-8 text-green-500" strokeWidth={3} />
                                ) : (
                                  <X className="w-8 h-8 text-red-500" strokeWidth={3} />
                                )}
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-8 pt-4 border-t-2 border-green-500/30">
                    <div className="w-full h-3 bg-green-500/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 shadow-lg shadow-green-500/50"
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </RetroScreen>
      </motion.div>
    </div>
  );
};

export default MindCareQuiz;
