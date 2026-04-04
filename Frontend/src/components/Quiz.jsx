// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { useApi } from '../hooks/useApi';

// export default function Quiz() {
//   const [quizData, setQuizData] = useState(null);
//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   const [userAnswers, setUserAnswers] = useState([]);
//   const [showResults, setShowResults] = useState(false);
//   const [quizResults, setQuizResults] = useState(null);
//   const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);

//   const { isAuthenticated, loading: authLoading } = useAuth();
//   const { apiCall, loading: submittingQuiz } = useApi();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!authLoading && !isAuthenticated) {
//       navigate('/sign-in');
//     } else if (isAuthenticated) {
//       loadQuiz();
//     }
//   }, [isAuthenticated, authLoading, navigate]);

//   const loadQuiz = async () => {
//     setIsLoadingQuiz(true);
//     try {
//       const notesId = localStorage.getItem('currentNotesId');
//       if (!notesId) {
//         alert('Please upload notes first');
//         navigate('/upload-notes');
//         return;
//       }

//       const response = await apiCall('post', 'notes/generate-quiz', {
//         notesId,
//         numQuestions: 5
//       });

//       setQuizData(response);
//       setUserAnswers(new Array(response.questions.length).fill(null));
//     } catch (err) {
//       alert('Failed to load quiz');
//     } finally {
//       setIsLoadingQuiz(false);
//     }
//   };

//   const handleAnswerSelect = (answer) => {
//     const newAnswers = [...userAnswers];
//     newAnswers[currentQuestion] = answer;
//     setUserAnswers(newAnswers);
//   };

//   const handleNext = () => {
//     if (currentQuestion < quizData.questions.length - 1) {
//       setCurrentQuestion(currentQuestion + 1);
//     }
//   };

//   const handlePrevious = () => {
//     if (currentQuestion > 0) {
//       setCurrentQuestion(currentQuestion - 1);
//     }
//   };

//   const handleSubmit = async () => {
//     if (userAnswers.includes(null)) {
//       alert('Please answer all questions before submitting');
//       return;
//     }

//     try {
//       const formattedAnswers = userAnswers.map((answer, index) => ({
//         questionIndex: index,
//         selectedAnswer: answer
//       }));

//       const response = await apiCall('post', 'notes/submit-quiz', {
//         quizId: quizData.quizId,
//         userAnswers: formattedAnswers
//       });

//       setQuizResults(response);
//       setShowResults(true);
//     } catch (err) {
//       alert('Failed to submit quiz');
//     }
//   };

//   if (authLoading || isLoadingQuiz) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center">
//         <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
//         <p className="text-slate-600 font-medium">Generating quiz questions...</p>
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return null;
//   }

//   if (showResults && quizResults) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full">
//           <div className="text-center mb-6">
//             <h1 className="text-4xl font-bold text-blue-600 mb-2">
//               {quizResults.score} / {quizResults.totalQuestions}
//             </h1>
//             <p className="text-2xl font-semibold text-slate-700">
//               {quizResults.percentage}% Correct
//             </p>
//           </div>
//           <div className={`p-4 rounded-lg mb-6 ${
//             quizResults.percentage >= 80 ? 'bg-green-100' : 
//             quizResults.percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
//           }`}>
//             <p className={`text-center font-semibold ${
//               quizResults.percentage >= 80 ? 'text-green-800' : 
//               quizResults.percentage >= 60 ? 'text-yellow-800' : 'text-red-800'
//             }`}>
//               {quizResults.percentage >= 80 ? 'Great job! You understood all topics.' :
//                quizResults.percentage >= 60 ? 'Good work! Review weak areas.' :
//                'Keep studying! Review the material again.'}
//             </p>
//           </div>

//           {quizResults.weakTopics && quizResults.weakTopics.length > 0 && (
//             <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
//               <p className="font-semibold text-yellow-800 mb-2">Topics to review:</p>
//               <p className="text-yellow-700">{quizResults.weakTopics.join(', ')}</p>
//             </div>
//           )}

//           <div className="flex gap-4">
//             <button
//               onClick={() => navigate('/dashboard')}
//               className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
//             >
//               Back to Dashboard
//             </button>
//             <button
//               onClick={() => {
//                 setShowResults(false);
//                 setCurrentQuestion(0);
//                 setUserAnswers(new Array(quizData.questions.length).fill(null));
//                 loadQuiz();
//               }}
//               className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
//             >
//               Retake Quiz
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!quizData || !quizData.questions) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p>Loading quiz...</p>
//       </div>
//     );
//   }

//   const question = quizData.questions[currentQuestion];
//   const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
//       <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl p-8">
//         <div className="mb-6">
//           <div className="flex justify-between items-center mb-2">
//             <span className="text-sm font-semibold text-slate-600">
//               Question {currentQuestion + 1} of {quizData.questions.length}
//             </span>
//             <span className="text-sm font-semibold text-blue-600">
//               {Math.round(progress)}%
//             </span>
//           </div>
//           <div className="w-full bg-slate-200 rounded-full h-2">
//             <div
//               className="bg-blue-600 h-2 rounded-full transition-all"
//               style={{ width: `${progress}%` }}
//             ></div>
//           </div>
//         </div>

//         <h2 className="text-xl font-bold text-slate-800 mb-6">{question.question}</h2>

//         <div className="space-y-3 mb-8">
//           {question.options.map((option, index) => (
//             <button
//               key={index}
//               onClick={() => handleAnswerSelect(option)}
//               className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
//                 userAnswers[currentQuestion] === option
//                   ? 'border-blue-600 bg-blue-50 text-blue-800'
//                   : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
//               }`}
//             >
//               {option}
//             </button>
//           ))}
//         </div>

//         <div className="flex justify-between gap-4">
//           <button
//             onClick={handlePrevious}
//             disabled={currentQuestion === 0}
//             className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
//           >
//             Previous
//           </button>

//           {currentQuestion === quizData.questions.length - 1 ? (
//             <button
//               onClick={handleSubmit}
//               disabled={userAnswers.includes(null) || submittingQuiz}
//               className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
//             >
//               {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
//             </button>
//           ) : (
//             <button
//               onClick={handleNext}
//               className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
//             >
//               Next
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
