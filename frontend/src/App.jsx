import { useState, useEffect } from 'react'
import PiAnalysis from './components/PiAnalysis';
import { motion } from 'framer-motion';
import PiFractal from './components/PiFractal';
import PiMusic from './components/PiMusic';
import { 
  ChartBarIcon, 
  MusicalNoteIcon, 
  SunIcon, 
  MoonIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentFeature, setCurrentFeature] = useState('analysis');

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 transition-all duration-300">
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg transform rotate-6 transition-transform group-hover:rotate-12" />
                <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg transform transition-transform group-hover:translate-x-1 group-hover:translate-y-1">
                  <span className="flex items-center justify-center h-full text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    π
                  </span>
                </div>
              </div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                Pi-Matrix AI
              </h1>
            </motion.div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentFeature('analysis')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  currentFeature === 'analysis' 
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <ChartBarIcon className="h-5 w-5" />
                <span>Analysis</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentFeature('fractal')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  currentFeature === 'fractal'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <SparklesIcon className="h-5 w-5" />
                <span>Fractals</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentFeature('music')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  currentFeature === 'music'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <MusicalNoteIcon className="h-5 w-5" />
                <span>Music</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto text-center mb-12 space-y-4"
        >
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
            Discover Hidden Patterns in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              π
            </span>
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Leverage advanced AI algorithms to analyze and visualize patterns, frequencies, and anomalies in the digits of π.
          </p>
        </motion.div>
        
        {currentFeature === 'analysis' ? <PiAnalysis /> : 
         currentFeature === 'fractal' ? <PiFractal /> : <PiMusic />}
      </main>

      <footer className="mt-auto backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} Pi-Matrix AI. All rights reserved.
            </p>
            <div className="mt-2 flex justify-center space-x-6">
              <a href="#" className="text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
