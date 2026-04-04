import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { motion } from 'framer-motion';
import { 
  Search, 
  FileText, 
  Calendar, 
  ArrowUpRight, 
  Loader2, 
  Library 
} from 'lucide-react';

export default function NotesLibrary() {
  const { apiCall, loading } = useApi();
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await apiCall('get', 'notes/history');
      setNotes(res.notes || []);
    } catch (err) {
      console.error("Failed to load library", err);
    }
  };

  // Filter notes based on search
  const filteredNotes = notes.filter(note => 
    note.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans pt-24 px-4 md:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Library className="w-8 h-8 text-indigo-600" />
              My Library
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage and review all your uploaded study materials.
            </p>
          </div>

          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl leading-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          </div>
        ) : (
          /* Notes Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note, index) => (
                <motion.div
                  key={note._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/notes/${note._id}`)}
                  className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 cursor-pointer shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {note.fileName}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(note.createdAt).toLocaleDateString()}
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-1" />
                    <span className="uppercase tracking-wider font-semibold">
                      {note.fileType?.includes('pdf') ? 'PDF' : 'DOC'}
                    </span>
                  </div>

                  {note.summary && (
                     <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                       {note.summary.replace(/[#*`]/g, '').slice(0, 100)}...
                     </p>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No notes found</h3>
                <p className="text-gray-500">Try uploading a new document or adjust your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}