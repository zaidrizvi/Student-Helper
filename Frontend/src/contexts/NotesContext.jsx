import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const NotesContext = createContext();
const ACTIVE_NOTE_KEY = "studybot.activeNote";
const ACTIVE_QUIZ_KEY = "studybot.activeQuiz";

function readSessionItem(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export const NotesProvider = ({ children }) => {
  const [activeNote, setActiveNoteState] = useState(() => readSessionItem(ACTIVE_NOTE_KEY, null));
  const [activeQuiz, setActiveQuizState] = useState(() => readSessionItem(ACTIVE_QUIZ_KEY, null));

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (activeNote) {
      window.sessionStorage.setItem(ACTIVE_NOTE_KEY, JSON.stringify(activeNote));
    } else {
      window.sessionStorage.removeItem(ACTIVE_NOTE_KEY);
    }
  }, [activeNote]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (activeQuiz) {
      window.sessionStorage.setItem(ACTIVE_QUIZ_KEY, JSON.stringify(activeQuiz));
    } else {
      window.sessionStorage.removeItem(ACTIVE_QUIZ_KEY);
    }
  }, [activeQuiz]);

  const setActiveNote = (note) => {
    setActiveNoteState(note ? {
      id: note.id || note._id,
      fileName: note.fileName || "note",
    } : null);
  };

  const clearActiveNote = () => setActiveNoteState(null);
  const setActiveQuiz = (quiz) => setActiveQuizState(quiz || null);
  const clearActiveQuiz = () => setActiveQuizState(null);

  const value = useMemo(
    () => ({
      activeNote,
      activeQuiz,
      setActiveNote,
      clearActiveNote,
      setActiveQuiz,
      clearActiveQuiz,
    }),
    [activeNote, activeQuiz]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used within NotesProvider');
  return context;
};
