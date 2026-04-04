import { createContext, useContext, useState, useMemo } from 'react';

const NotesContext = createContext();

export const NotesProvider = ({ children }) => {
  const [currentNotes, setCurrentNotes] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [summary, setSummary] = useState(null);

  const value = useMemo(
    () => ({
      currentNotes,
      setCurrentNotes,
      currentQuiz,
      setCurrentQuiz,
      summary,
      setSummary
    }),
    [currentNotes, currentQuiz, summary]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used within NotesProvider');
  return context;
};
