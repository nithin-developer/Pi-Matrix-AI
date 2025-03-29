import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    }
});

function PiAnalysis() {
    const [piSequence, setPiSequence] = useState('');
    const [analysisType, setAnalysisType] = useState('Frequency Distribution');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [visualizationUrl, setVisualizationUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!piSequence.trim()) {
                throw new Error('Please enter a π sequence');
            }

            const response = await api.post('/analyze-pi', {
                pi_sequence: piSequence,
                analysis_type: analysisType
            });

            setAnalysisResult(response.data.analysis);
            setVisualizationUrl(response.data.visualization_url);
        } catch (error) {
            console.error('Analysis failed:', error);
            setError(
                error.response?.data?.detail || 
                error.message || 
                'An error occurred during analysis'
            );
            setAnalysisResult(null);
            setVisualizationUrl('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto p-6 space-y-8"
        >
            <motion.div 
                className="text-center space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                    π Pattern Analysis
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Analyze patterns and anomalies in the digits of π
                </p>
            </motion.div>

            <motion.div 
                className="space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className="space-y-4">
                    <textarea
                        value={piSequence}
                        onChange={(e) => setPiSequence(e.target.value)}
                        placeholder="Enter π sequence (e.g., 3.14159...)"
                        className="w-full h-32 p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                    
                    <select 
                        value={analysisType} 
                        onChange={(e) => setAnalysisType(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                        <option>Frequency Distribution</option>
                        <option>Pattern Detection</option>
                        <option>Anomaly Detection</option>
                    </select>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </span>
                        ) : 'Analyze'}
                    </motion.button>
                </div>
            </motion.div>

            {analysisResult && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Analysis Results</h2>
                    <div className="space-y-4">
                        {Object.entries(analysisResult).map(([key, value]) => (
                            <div key={key} className="space-y-2">
                                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 capitalize">
                                    {key.replace(/_/g, ' ')}
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    {Array.isArray(value) ? (
                                        <ul className="list-disc list-inside space-y-2">
                                            {value.map((item, index) => (
                                                <li key={index} className="text-gray-600 dark:text-gray-300">{item}</li>
                                            ))}
                                        </ul>
                                    ) : typeof value === 'object' ? (
                                        <pre className="text-sm text-gray-600 dark:text-gray-300 overflow-x-auto">
                                            {JSON.stringify(value, null, 2)}
                                        </pre>
                                    ) : (
                                        <p className="text-gray-600 dark:text-gray-300">{value}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {visualizationUrl && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Visualization</h2>
                    <img 
                        src={visualizationUrl} 
                        alt="Analysis Graph" 
                        className="w-full rounded-lg shadow-md"
                    />
                </motion.div>
            )}
        </motion.div>
    );
}

export default PiAnalysis; 