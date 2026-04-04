import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SignUpPage from "./pages/Signup";
import SignInPage from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import UploadNotes from "./pages/UploadNotes";
import QuizPage from "./pages/QuizPage";
import Navbar from "./components/Navbar";
import ViewNote from "./pages/ViewNote";
import NotesLibrary from "./pages/NotesLibrary";
import SharedNoteView from "./pages/SharedNoteView"; // <--- IMPORT THIS

const App = () => (
  <Router>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload-notes" element={<UploadNotes />} />
      <Route path="/quiz" element={<QuizPage />} />
      
      {/* ADD THIS ROUTE */}
      <Route path="/notes" element={<NotesLibrary />} /> 
      <Route path="/shared/:shareToken" element={<SharedNoteView />} />
      <Route path="/notes/:noteId" element={<ViewNote />} />
    </Routes>
  </Router>
);

export default App;