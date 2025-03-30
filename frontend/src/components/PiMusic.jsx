import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { PlayIcon, PauseIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import MidiPlayer from 'midi-player-js';
import Soundfont from 'soundfont-player';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

function PiMusic() {
    const [digitCount, setDigitCount] = useState(100);
    const [musicStyle, setMusicStyle] = useState('Classical');
    const [audioUrl, setAudioUrl] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioParams, setAudioParams] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    const [error, setError] = useState(null);
    
    const audioContext = useRef(null);
    const midiPlayer = useRef(null);
    const soundfontPlayer = useRef(null);

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    const musicStyles = {
        'Classical': {
            description: 'Traditional harmony with piano',
            instrument: 'acoustic_grand_piano'
        },
        'Jazz': {
            description: 'Blues-based with guitar',
            instrument: 'acoustic_jazz_guitar'
        },
        'Electronic': {
            description: 'Modern synth patterns',
            instrument: 'synth_pad_2_warm'
        },
        'Ambient': {
            description: 'Atmospheric pad sounds',
            instrument: 'pad_3_polysynth'
        }
    };

    useEffect(() => {
        return () => {
            if (midiPlayer.current) {
                midiPlayer.current.stop();
            }
            if (audioContext.current) {
                audioContext.current.close();
            }
        };
    }, []);

    const initAudioContext = async () => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
            const style = musicStyles[musicStyle];
            
            // Initialize soundfont player with full volume
            soundfontPlayer.current = await Soundfont.instrument(
                audioContext.current, 
                style.instrument,
                { 
                    gain: 5.0, // Maximum volume
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 1.0,
                    release: 0.1
                }
            );

            // Initialize MIDI Player with direct note handling
            midiPlayer.current = new MidiPlayer.Player((event) => {
                if (event.name === 'Note on' && event.velocity > 0) {
                    soundfontPlayer.current.play(
                        event.noteName, 
                        audioContext.current.currentTime, 
                        {
                            gain: event.velocity / 100, // Direct velocity mapping
                            duration: event.duration,
                            sustain: 1.0
                        }
                    );
                }
            });

            midiPlayer.current.on('endOfFile', () => {
                setIsPlaying(false);
            });
        }
    };

    const loadMidiFile = async (url) => {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            
            if (midiPlayer.current) {
                midiPlayer.current.loadArrayBuffer(arrayBuffer);
            }
        } catch (error) {
            console.error('Error loading MIDI file:', error);
            setError('Error loading audio file');
        }
    };

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError(null);
            setLoadingStage('Generating musical patterns...');

            const response = await api.post('/generate-music', {
                digit_count: digitCount,
                music_style: musicStyle
            });

            setAudioUrl(response.data.generated_audio_url);
            setAudioParams(response.data.pi_applied_modifications);

            // Initialize audio context and load MIDI
            await initAudioContext();
            await loadMidiFile(response.data.generated_audio_url);

        } catch (error) {
            console.error('Music generation failed:', error);
            setError(error.response?.data?.detail || error.message);
        } finally {
            setLoading(false);
            setLoadingStage('');
        }
    };

    const togglePlay = async () => {
        try {
            if (!midiPlayer.current || !audioContext.current) {
                await initAudioContext();
                await loadMidiFile(audioUrl);
            }

            if (isPlaying) {
                midiPlayer.current.pause();
                setIsPlaying(false);
            } else {
                if (audioContext.current.state === 'suspended') {
                    await audioContext.current.resume();
                }
                midiPlayer.current.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Playback error:', error);
            setError('Error playing audio');
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = `pi_music_${Date.now()}.mid`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getComplexityDescription = (count) => {
        if (count <= 1000) return "Simple melody with basic patterns";
        if (count <= 5000) return "Rich harmonies and textures";
        if (count <= 20000) return "Complex musical structures";
        if (count <= 50000) return "Dense orchestration";
        return "Full symphonic arrangement";
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto p-6 space-y-8"
        >
            <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                        π-Based Music Generator
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Transform π digits into unique musical compositions using AI.
                    </p>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Musical Complexity
                                </label>
                                <div className="text-right">
                                    <span className="text-sm font-mono text-purple-600 dark:text-purple-400 block">
                                        {formatNumber(digitCount)} digits
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {getComplexityDescription(digitCount)}
                                    </span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="100000"
                                step="100"
                                value={digitCount}
                                onChange={(e) => setDigitCount(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                        </div>

                        <div className="space-y-6 text-white">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Music Style
                                </label>
                                <select
                                    value={musicStyle}
                                    onChange={(e) => setMusicStyle(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                                >
                                    {Object.entries(musicStyles).map(([style, info]) => (
                                        <option key={style} value={style}>
                                            {style} - {info.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-md disabled:opacity-50"
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
                                    'Generate Music'
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="text-red-500 dark:text-red-400 text-center p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    {error}
                </div>
            )}

            {audioUrl && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                                Generated Music
                            </h3>
                            <div className="flex space-x-4">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={togglePlay}
                                    className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700"
                                >
                                    {isPlaying ? 
                                        <PauseIcon className="h-6 w-6" /> : 
                                        <PlayIcon className="h-6 w-6" />
                                    }
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleDownload}
                                    className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                    <ArrowDownTrayIcon className="h-6 w-6" />
                                </motion.button>
                            </div>
                        </div>

                        {audioParams && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                    Music Parameters:
                                </h4>
                                <ul className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                                    {Object.entries(audioParams).map(([key, value]) => (
                                        <li key={key} className="flex justify-between">
                                            <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                            <span className="font-mono">{value}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

export default PiMusic; 