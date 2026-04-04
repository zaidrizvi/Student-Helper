import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  BrainCircuit, 
  Zap, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2,
  PlayCircle,
  BarChart3,
  FileText
} from "lucide-react";

const Home = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-x-hidden font-sans selection:bg-indigo-500 selection:text-white pt-2">
      
      {/* Hero Section */}
      <div className="relative pt-2 pb-20 lg:pt-32 lg:pb-22 px-6">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-200/40 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-200/40 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight text-gray-900 dark:text-white"
          >
            Master your studies with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">Superhuman AI.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Stop drowning in PDFs. Upload your course material and let our AI generate summaries, flashcards, and exam-level quizzes in seconds.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link 
              to="/sign-up" 
              className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold text-lg text-white transition-all hover:scale-105 shadow-xl shadow-indigo-500/20 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              Start Learning Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 pt-8 border-t border-gray-200 dark:border-white/5"
          >
            <p className="text-sm text-gray-500 mb-4 uppercase tracking-widest font-semibold">Optimized for</p>
            <div className="flex justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 font-bold text-xl text-gray-700 dark:text-gray-300"><FileText className="w-5 h-5" /> PDF</div>
              <div className="flex items-center gap-2 font-bold text-xl text-gray-700 dark:text-gray-300"><FileText className="w-5 h-5" /> DOCX</div>
              <div className="flex items-center gap-2 font-bold text-xl text-gray-700 dark:text-gray-300"><FileText className="w-5 h-5" /> TXT</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Large Card */}
          <div className="md:col-span-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden group shadow-sm dark:shadow-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] -mr-16 -mt-16 transition-all group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-500/30" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-200 dark:border-indigo-500/30">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Smart Summarization</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mb-8">
                Don't just read, understand. Choose from "Explain like I'm 5" to "PhD Deep Dive" modes. Our AI adapts to your learning style instantly.
              </p>
              
              {/* UI Mockup */}
              <div className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl p-4 backdrop-blur-sm max-w-lg">
                <div className="flex gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 dark:bg-white/20 rounded w-3/4" />
                  <div className="h-2 bg-gray-200 dark:bg-white/20 rounded w-1/2" />
                  <div className="h-2 bg-gray-200 dark:bg-white/20 rounded w-5/6" />
                </div>
              </div>
            </div>
          </div>

          {/* Tall Card */}
          <div className="md:col-span-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-indigo-500/50 transition-colors shadow-sm dark:shadow-none">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-500/20 rounded-2xl flex items-center justify-center mb-6 border border-pink-200 dark:border-pink-500/30">
              <Zap className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Instant Quizzes</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Turn any note into a multiple-choice exam. Test your knowledge immediately after reading.
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-black to-transparent z-10" />
            
            {/* Floating Elements */}
            <div className="space-y-3 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-white/5">
                <div className="w-4 h-4 rounded-full border border-gray-400 dark:border-gray-500" />
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-24" />
              </div>
              <div className="flex items-center gap-3 bg-green-50 dark:bg-green-500/20 p-3 rounded-lg border border-green-100 dark:border-green-500/30">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <div className="h-2 bg-green-200 dark:bg-green-200/50 rounded w-32" />
              </div>
            </div>
          </div>

          {/* Medium Card */}
          <div className="md:col-span-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-8 group hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-colors shadow-sm dark:shadow-none">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-200 dark:border-blue-500/30">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Weakness Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              We identify exactly where you're struggling and generate custom explanations to plug the gaps.
            </p>
          </div>

          {/* CTA Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-900/50 dark:to-purple-900/50 border border-indigo-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg">
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-2 text-white">Ready to ace that exam?</h3>
              <p className="text-indigo-100 mb-0">Join students saving 10+ hours/week.</p>
            </div>
            <Link 
              to="/sign-up" 
              className="px-6 py-3 bg-white text-indigo-900 rounded-full font-bold hover:bg-gray-100 transition-colors flex-shrink-0 shadow-lg"
            >
              Get Started Now
            </Link>
          </div>

        </div>
      </div>

      {/* Steps Section */}
      <div className="py-24 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">How it works</h2>
            <p className="text-gray-500 dark:text-gray-400">From chaos to clarity in three simple steps.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
             <StepCard 
               number="1" 
               title="Upload" 
               desc="Drop your PDF, DOCX or notes." 
               icon={<FileText className="w-6 h-6" />} 
             />
             <StepCard 
               number="2" 
               title="Analyze" 
               desc="AI processes context in seconds." 
               icon={<BrainCircuit className="w-6 h-6" />} 
             />
             <StepCard 
               number="3" 
               title="Master" 
               desc="Quiz yourself and track progress." 
               icon={<GraduationCap className="w-6 h-6" />} 
             />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 py-12 bg-gray-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <BrainCircuit className="w-6 h-6 text-gray-600 dark:text-gray-600" />
            <span className="text-gray-600 dark:text-gray-600">StudyBot AI</span>
          </div>
          <div className="text-gray-500 text-sm">
            © 2025 StudyBot AI. All rights reserved.
          </div>
          <div className="flex gap-6">
             <a href="#" className="text-gray-500 hover:text-indigo-600 dark:hover:text-white transition-colors">Privacy</a>
             <a href="#" className="text-gray-500 hover:text-indigo-600 dark:hover:text-white transition-colors">Terms</a>
             <a href="#" className="text-gray-500 hover:text-indigo-600 dark:hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

const StepCard = ({ number, title, desc, icon }) => (
  <div className="relative z-10 flex flex-col items-center text-center group">
    <div className="w-24 h-24 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-full flex items-center justify-center mb-6 group-hover:border-indigo-500/50 group-hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.3)] transition-all duration-300">
      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
        {icon}
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-sm text-white border-4 border-white dark:border-black">
        {number}
      </div>
    </div>
    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 max-w-xs">{desc}</p>
  </div>
);

export default Home;