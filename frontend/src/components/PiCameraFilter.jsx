import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const PI_SYMBOLS = ["π", "𝜋", "𝛑", "𝝅", "𝞹"];
const PI_FACTS = [
    "Pi has been calculated to over 31.4 trillion digits",
    "Pi is an irrational and transcendental number",
    "March 14 (3/14) is celebrated as Pi Day",
    "The first 144 digits of Pi add up to 666",
    "Pi appears in many fundamental physics equations"
];

function PiCameraFilter() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [currentFact, setCurrentFact] = useState(0);
    const [error, setError] = useState(null);
    const [fallingSymbols, setFallingSymbols] = useState([]);

    // Initialize camera
    useEffect(() => {
        async function setupCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'user',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    } 
                });
                setStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => videoRef.current.play();
                }
            } catch (err) {
                console.error('Camera error:', err);
                setError('Camera access denied. Please enable camera permissions.');
            }
        }
        setupCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Rotate Pi facts
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentFact(prev => (prev + 1) % PI_FACTS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Animation loop for falling symbols
    useEffect(() => {
        let lastTime = performance.now();

        function animate(currentTime) {
            if (!canvasRef.current || !videoRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            const { width, height } = canvasRef.current;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Draw video
            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                ctx.save();
                ctx.scale(-1, 1); // Mirror for selfie mode
                ctx.translate(-width, 0);
                ctx.drawImage(videoRef.current, 0, 0, width, height);
                ctx.restore();
            }

            // Add new falling symbols randomly
            if (currentTime - lastTime > 200) {
                setFallingSymbols(prev => [
                    ...prev,
                    {
                        x: Math.random() * width,
                        y: -30,
                        symbol: PI_SYMBOLS[Math.floor(Math.random() * PI_SYMBOLS.length)],
                        speed: 1 + Math.random() * 2.5,
                        rotation: Math.random() * Math.PI * 2,
                        scale: 0.8 + Math.random(),
                        opacity: 0.9
                    }
                ]);
                lastTime = currentTime;
            }

            // Draw falling symbols
            setFallingSymbols(prev => 
                prev
                .map(symbol => ({ ...symbol, y: symbol.y + symbol.speed, rotation: symbol.rotation + 0.02 }))
                .filter(symbol => symbol.y < height) // Remove symbols that go out of view
            );

            fallingSymbols.forEach(symbol => {
                ctx.save();
                ctx.translate(symbol.x, symbol.y);
                ctx.rotate(symbol.rotation);
                ctx.globalAlpha = symbol.opacity;
                
                // Draw glow
                ctx.shadowColor = 'white';
                ctx.shadowBlur = 15;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                
                // Draw Pi symbol
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.font = `${40 * symbol.scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.strokeText(symbol.symbol, 0, 0);
                ctx.fillText(symbol.symbol, 0, 0);

                ctx.restore();
            });

            // Draw bottom banner
            const bannerHeight = 80;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, height - bannerHeight, width, bannerHeight);
            
            ctx.fillStyle = 'white';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Happy Pi Day!', width / 2, height - bannerHeight + 30);
            
            ctx.font = '16px Arial';
            ctx.fillText(PI_FACTS[currentFact], width / 2, height - bannerHeight + 60);

            animationRef.current = requestAnimationFrame(animate);
        }

        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, [currentFact]);

    const captureImage = () => {
        if (!canvasRef.current) return;
        setIsCapturing(true);
        setTimeout(() => {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `pi_day_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            setIsCapturing(false);
        }, 100);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto p-6 space-y-8"
        >
            <div className="relative">
                <video ref={videoRef} autoPlay playsInline muted className="hidden" />
                <canvas ref={canvasRef} width={640} height={480} className="w-full rounded-xl shadow-lg" />

                <div className="absolute bottom-4 right-4 flex space-x-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={captureImage}
                        disabled={isCapturing}
                        className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700"
                    >
                        {isCapturing ? 
                            <ArrowDownTrayIcon className="h-6 w-6 animate-pulse" /> :
                            <CameraIcon className="h-6 w-6" />
                        }
                    </motion.button>
                </div>
            </div>

            {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>}
        </motion.div>
    );
}

export default PiCameraFilter;
