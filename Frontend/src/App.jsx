import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
import SignUpPage from "./pages/Signup";
import SignInPage from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import UploadNotes from "./pages/UploadNotes";
import QuizPage from "./pages/QuizPage";
import Navbar from "./components/Navbar";
import ViewNote from "./pages/ViewNote";
import NotesLibrary from "./pages/NotesLibrary";
import SharedNoteView from "./pages/SharedNoteView";
import ScrollToTop from "./components/ScrollToTop";

function AppRoutes() {
  const location = useLocation();
  const hideNavbar =
    location.pathname.startsWith("/shared/");

  return (
    <>
      <ScrollToTop />
      {!hideNavbar ? <Navbar /> : null}
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload-notes" element={<UploadNotes />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/notes" element={<NotesLibrary />} />
          <Route path="/shared/:shareToken" element={<SharedNoteView />} />
          <Route path="/notes/:noteId" element={<ViewNote />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;
