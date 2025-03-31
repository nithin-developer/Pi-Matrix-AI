import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 60000, // Increased timeout for larger computations
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

function PiFractal() {
    const [digitCount, setDigitCount] = useState(100);
    const [fractalType, setFractalType] = useState('Mandelbrot');
    const [fractalImage, setFractalImage] = useState('');
    const [fractalParams, setFractalParams] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    const [error, setError] = useState(null);

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError(null);

            // Stage 1: Computing Pi digits
            setLoadingStage('Computing π digits...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // UI feedback

            const response = await api.post('/generate-fractal', {
                digit_count: digitCount,
                fractal_type: fractalType
            });

            // Stage 2: Generating Art
            setLoadingStage('Creating fractal patterns...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Stage 3: Finalizing
            setLoadingStage('Applying final touches...');
            await new Promise(resolve => setTimeout(resolve, 500));

            setFractalImage(response.data.generated_image_url);
            setFractalParams(response.data.pi_applied_parameters);
        } catch (error) {
            console.error('Fractal generation failed:', error);
            setError(error.response?.data?.detail || error.message);
        } finally {
            setLoading(false);
            setLoadingStage('');
        }
    };

    return (
        <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto p-6 space-y-8"
        >
            <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                        π-Based Fractal Art Generator
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Select the number of π digits to use in generating unique fractal art.
                    </p>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Number of π Digits
                                </label>
                                <span className="text-sm font-mono text-purple-600 dark:text-purple-400">
                                    {formatNumber(digitCount)}
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    type="range"
                                    min="100"
                                    max="10000000"
                                    step="100"
                                    value={digitCount}
                                    onChange={(e) => setDigitCount(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span>100</span>
                                    <span>5M</span>
                                    <span>10M</span>
                                </div>
                            </div>
                        </div>

                        <select
                            value={fractalType}
                            onChange={(e) => setFractalType(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="Mandelbrot">Mandelbrot Set</option>
                            <option value="Julia">Julia Set</option>
                        </select>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 relative overflow-hidden"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <motion.div 
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                    <span>{loadingStage}</span>
                                </div>
                            ) : (
                                'Generate Fractal'
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="text-red-500 dark:text-red-400 text-center p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    {error}
                </div>
            )}

            {fractalImage && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                            Generated Fractal Art
                        </h3>
                        {fractalParams && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                    Parameters Used:
                                </h4>
                                <ul className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                                    {Object.entries(fractalParams).map(([key, value]) => (
                                        <li key={key} className="flex justify-between">
                                            <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                            <span className="font-mono">{value}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <img 
                        src={`${fractalImage}?t=${Date.now()}`}
                        alt="Generated Fractal"
                        className="w-full rounded-lg shadow-md"
                    />
                </motion.div>
            )}
        </motion.div>
    );
}

export default PiFractal; 