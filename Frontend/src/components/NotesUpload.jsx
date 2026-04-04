// import { useState } from "react";
// import { useApi } from "../hooks/useApi";
// import { useAuth } from "../contexts/AuthContext";
// import Markdown from "markdown-to-jsx";

// const MODES = [
//   { label: "Brief", value: "short" },
//   { label: "Simple", value: "normal" },
//   { label: "In Depth", value: "detailed" },
//   { label: "Exam-level", value: "ultra" }
// ];

// export default function UploadNotes() {
//   const [file, setFile] = useState(null);
//   const [customPrompt, setCustomPrompt] = useState("");
//   const [mode, setMode] = useState("normal");
//   const [message, setMessage] = useState("");
//   const [geminiSummary, setGeminiSummary] = useState("");
//   const [notesId, setNotesId] = useState(null);

//   const { loading, error, apiCall } = useApi();
//   const { isAuthenticated, user } = useAuth();

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//     setMessage("");
//     setGeminiSummary("");
//     setNotesId(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!isAuthenticated) {
//       setMessage("❌ Please sign in to upload notes");
//       return;
//     }

//     if (!file) {
//       setMessage("Please upload a file first.");
//       return;
//     }

//     setMessage("Uploading file...");

//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       const uploadResponse = await apiCall('post', '/notes/upload', formData, {
//         headers: { "Content-Type": "multipart/form-data" }
//       });

//       const uploadedNotesId = uploadResponse.notesId;
//       setNotesId(uploadedNotesId);
//       localStorage.setItem("currentNotesId", uploadedNotesId);

//       setMessage("Generating summary...");

//       const summaryResponse = await apiCall('post', '/notes/summarize', {
//         notesId: uploadedNotesId,
//         prompt: customPrompt,
//         mode
//       });

//       setGeminiSummary(summaryResponse.summary);
//       setMessage("Done!");
//     } catch (err) {
//       console.error('❌ Submit error:', err);
//       setMessage("Error: " + err.message);
//     }
//   };

//   const handleQuizRedirect = () => {
//     if (notesId) {
//       localStorage.setItem("currentNotesId", notesId);
//       window.location.href = "/quiz";
//     }
//   };

//   if (!isAuthenticated) {
//     return (
//       <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
//         <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
//           <h2 className="text-2xl font-bold text-slate-800 mb-4">🔒 Sign In Required</h2>
//           <p className="text-slate-600 mb-6">Please sign in to upload and manage your study notes.</p>
//           <button
//             onClick={() => window.location.href = '/sign-in'}
//             className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
//           >
//             Go to Sign In
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-slate-100 flex flex-col items-center py-10 px-4">
//       <div className="w-full max-w-5xl bg-white border border-slate-200 shadow-xl rounded-3xl p-10">
//         <h1 className="text-4xl font-extrabold text-blue-700 text-center tracking-tight">
//           StudyBot AI <span>📘</span>
//         </h1>
//         <p className="text-center text-slate-500 mt-2 mb-10 text-sm">
//           Upload notes · Choose a mode · Learn with AI
//         </p>

//         <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
//           <p className="text-green-800 text-sm">
//             ✅ <strong>Signed in as:</strong> {user?.name || user?.email}
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="flex flex-col gap-2">
//             <label className="font-semibold text-slate-700 text-sm">
//               Upload Notes File
//             </label>
//             <div className="flex items-center gap-3 border border-slate-300 rounded-xl bg-slate-50 p-3">
//               <input
//                 type="file"
//                 accept=".pdf,.docx,.txt"
//                 onChange={handleFileChange}
//                 className="w-full text-sm"
//               />
//             </div>
//             {file && <p className="text-xs text-slate-500">Selected: {file.name}</p>}
//           </div>

//           <div>
//             <label className="font-semibold text-slate-700 text-sm">Choose Answer Mode</label>
//             <div className="flex gap-3 flex-wrap mt-3">
//               {MODES.map((m) => (
//                 <button
//                   type="button"
//                   key={m.value}
//                   onClick={() => setMode(m.value)}
//                   className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
//                     mode === m.value
//                       ? "bg-blue-600 text-white"
//                       : "bg-white text-slate-700 border-slate-300"
//                   }`}
//                 >
//                   {m.label}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div>
//             <label className="font-semibold text-slate-700 text-sm">Ask or Describe</label>
//             <textarea
//               rows={4}
//               value={customPrompt}
//               onChange={(e) => setCustomPrompt(e.target.value)}
//               placeholder="Explain topic simply, summarize with examples..."
//               className="mt-2 w-full p-4 border rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className={`w-full py-3 rounded-xl text-white font-bold text-lg shadow transition-all ${
//               loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"
//             }`}
//           >
//             {loading ? "Processing..." : "Generate Output"}
//           </button>
//         </form>

//         {error && (
//           <div className="mt-4 w-full bg-red-100 text-red-700 font-semibold py-3 px-4 rounded-xl">
//             ❌ {error}
//           </div>
//         )}

//         {message && !error && (
//           <div className="mt-4 w-full text-center bg-blue-100 text-blue-700 font-semibold py-3 rounded-xl">
//             {message === "Done!" ? "✨ Your AI Answer Is Ready!" : message}
//           </div>
//         )}

//         {geminiSummary && (
//           <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-8 shadow-inner">
//             <h2 className="text-xl font-bold text-blue-700 mb-4">Result</h2>
//             <div className="prose prose-blue prose-sm sm:prose-base max-w-none">
//               <Markdown>{geminiSummary}</Markdown>
//             </div>
//             <button
//               className="mt-8 w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow"
//               onClick={handleQuizRedirect}
//             >
//               Take Self Assessment Quiz
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
