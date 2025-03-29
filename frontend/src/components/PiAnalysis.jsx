import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

function PiAnalysis() {
    const [piSequence, setPiSequence] = useState('');
    const [analysisType, setAnalysisType] = useState('Frequency Distribution');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [visualizationUrl, setVisualizationUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentAnalysisType, setCurrentAnalysisType] = useState('Frequency Distribution');

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
            console.log('Analysis response:', response.data);
            
            setAnalysisResult(response.data.analysis);
            setVisualizationUrl(response.data.visualization_url);
            setCurrentAnalysisType(analysisType);
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

    const renderFrequencyDistribution = (data) => {
        const { digit_distribution, observed_vs_expected, insights, statistical_significance } = data;
        
        return (
            <div className="space-y-6">
                {/* Digit Distribution Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Digit
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Observed
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Expected
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Difference
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {Object.entries(observed_vs_expected).map(([digit, values]) => {
                                const observed = parseFloat(values.observed);
                                const expected = parseFloat(values.expected);
                                const difference = (observed - expected).toFixed(2);
                                const isDifferencePositive = parseFloat(difference) > 0;

                                return (
                                    <tr key={digit}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {digit}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {values.observed}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {values.expected}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                                            isDifferencePositive 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {difference > 0 ? '+' : ''}{difference}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Insights */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Key Insights
                    </h3>
                    <ul className="list-disc list-inside space-y-2">
                        {insights.map((insight, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-400">
                                {insight}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Statistical Significance */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Statistical Significance
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200">
                        {statistical_significance}
                    </p>
                </div>
            </div>
        );
    };

    const renderPatternDetection = (data) => {
        const { common_patterns, pattern_frequencies, interesting_sequences, mathematical_significance } = data;
        
        return (
            <div className="space-y-8">
                {/* Pattern Frequencies */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                        Common Patterns & Frequencies
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {common_patterns.map((pattern, index) => (
                            <div 
                                key={pattern}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl font-mono text-purple-600 dark:text-purple-400">
                                        {pattern}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Pattern {index + 1}
                                    </span>
                                </div>
                                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    {pattern_frequencies[pattern]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Interesting Sequences */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                        Notable Sequences
                    </h3>
                    <div className="space-y-4">
                        {interesting_sequences.map((sequence, index) => (
                            <motion.div 
                                key={sequence}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                                        {sequence}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Length: {sequence.length} digits
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Mathematical Significance */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
                        Mathematical Significance
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                        {mathematical_significance}
                    </p>
                </div>
            </div>
        );
    };

    const renderAnomalyDetection = (data) => {
        const { anomalies, statistical_deviations, confidence_scores, analysis_summary } = data;
        
        return (
            <div className="space-y-8">
                {/* Anomalies with Confidence Scores */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                        Detected Anomalies
                    </h3>
                    <div className="space-y-4">
                        {anomalies.map((anomaly) => (
                            <motion.div 
                                key={anomaly}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-gray-800 dark:text-gray-200 font-medium">
                                            {anomaly}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            {statistical_deviations[anomaly.split(' ').join('_').toLowerCase()] || ''}
                                        </p>
                                    </div>
                                    <div className="ml-4">
                                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                                {confidence_scores[anomaly]}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Statistical Deviations */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                        Statistical Analysis
                    </h3>
                    <div className="prose dark:prose-invert max-w-none">
                        <div className="space-y-4">
                            {Object.entries(statistical_deviations).map(([key, value]) => (
                                <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 capitalize mb-2">
                                        {key.split('_').join(' ')}
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Analysis Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
                        Analysis Summary
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                        {analysis_summary}
                    </p>
                </div>
            </div>
        );
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
                        className="w-full text-white h-32 p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                    
                    <select 
                        value={analysisType} 
                        onChange={(e) => setAnalysisType(e.target.value)}
                        className="w-full text-white p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
                    {currentAnalysisType === "Pattern Detection" 
                        ? renderPatternDetection(analysisResult)
                        : currentAnalysisType === "Frequency Distribution"
                        ? renderFrequencyDistribution(analysisResult)
                        : currentAnalysisType === "Anomaly Detection"
                        ? renderAnomalyDetection(analysisResult)
                        : (
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
                        )
                    }
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
                        src={`${visualizationUrl}?t=${Date.now()}`}
                        alt="Analysis Graph" 
                        className="w-full rounded-lg shadow-md"
                    />
                </motion.div>
            )}
        </motion.div>
    );
}

export default PiAnalysis; 