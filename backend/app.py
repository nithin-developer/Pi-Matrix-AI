from fastapi.staticfiles import StaticFiles
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import matplotlib.pyplot as plt
import numpy as np
from dotenv import load_dotenv
import google.generativeai as genai
import json
import time
import glob
from PIL import Image, ImageEnhance, ImageFilter
import sqlite3
from pathlib import Path
import math
from decimal import Decimal, getcontext
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import matplotlib.pyplot as plt
from scipy.ndimage import zoom
from midiutil import MIDIFile
from scipy.io import wavfile
from fastapi.responses import FileResponse
import mimetypes

load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(
    'gemini-2.0-flash', generation_config={"response_mime_type": "application/json"})

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add MIDI mimetype
mimetypes.add_type('audio/midi', '.mid')
mimetypes.add_type('audio/midi', '.midi')

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add this near the top of the file with other constants
MUSIC_STYLES = {
    'Classical': {
        'tempo': 120,
        'base_note': 60,  # Middle C
        'scale': [0, 2, 4, 5, 7, 9, 11, 12],  # C Major scale
        'duration': 0.5,
        'instrument': 'acoustic_grand_piano',
        'texture': 'orchestral'
    },
    'Jazz': {
        'tempo': 140,
        'base_note': 55,  # G
        'scale': [0, 2, 3, 5, 7, 9, 10, 12],  # G Blues scale
        'duration': 0.25,
        'instrument': 'acoustic_jazz_guitar',
        'texture': 'swing'
    },
    'Electronic': {
        'tempo': 128,
        'base_note': 48,  # C2
        'scale': [0, 3, 5, 7, 10, 12],  # C minor pentatonic
        'duration': 0.125,
        'instrument': 'synth_pad_2_warm',
        'texture': 'arpeggio'
    },
    'Ambient': {
        'tempo': 80,
        'base_note': 65,  # F
        'scale': [0, 2, 5, 7, 9, 12],  # F major pentatonic
        'duration': 1.0,
        'instrument': 'pad_3_polysynth',
        'texture': 'atmospheric'
    }
}


class PiAnalysisRequest(BaseModel):
    digit_count: int
    analysis_type: str


class FractalRequest(BaseModel):
    digit_count: int
    fractal_type: str = "Mandelbrot"


class MusicRequest(BaseModel):
    digit_count: int
    music_style: str


def get_pi_digits(count: int) -> str:
    """Fetch pi digits from database or compute them if not available"""
    if count < 100 or count > 10_000_000:
        raise ValueError("Digit count must be between 100 and 10,000,000")

    conn = sqlite3.connect("pi_digits.db")
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT digit FROM pi
            WHERE id <= ? ORDER BY id ASC
        """, (count,))
        result = cursor.fetchall()
        if not result:
            raise ValueError("No pi digits found in database")

        digits = [str(d[0]) for d in result]
        return "3" + "".join(digits)[:count-1]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error computing π digits: {str(e)}"
        )
    finally:
        conn.close()


def get_gemini_response(prompt, pi_sequence):
    try:
        response = model.generate_content(
            prompt + f"\nPi Sequence: {pi_sequence}")
        return json.loads(response.text) if response.text else response
    except Exception as e:

        return None


def analyze_frequency_distribution(pi_sequence):
    prompt = """
    You are a mathematical data analyst specializing in probability and number theory.

    TASK: Analyze the frequency distribution of digits in the given Pi sequence and provide a detailed statistical report.

    INSTRUCTIONS:
    1. Count occurrences of each digit (0-9).
    2. Calculate percentage frequency of each digit.
    3. Compare with expected uniform distribution in an **infinite random sequence**.
    4. Identify **any deviations** and explain their statistical significance.
    5. Provide insights about the randomness of Pi based on the observed distribution.

    OUTPUT FORMAT (JSON):
    {
        "digit_distribution": {"0": X%, "1": Y%, ..., "9": Z%},
        "observed_vs_expected": {"0": {"observed": X%, "expected": 10%}, ...},
        "insights": ["Observation 1", "Observation 2", ...],
        "statistical_significance": "Explain whether observed deviations are significant."
    }
    """

    result = get_gemini_response(prompt, pi_sequence)
    if not result:
        # Fallback to basic analysis if API fails
        digit_count = {str(i): pi_sequence.count(str(i)) for i in range(10)}
        total_digits = len(pi_sequence)
        distribution = {k: (v / total_digits) * 100 for k,
                        v in digit_count.items()}
        return {
            "digit_distribution": distribution,
            "insights": ["Basic frequency analysis performed"],
            "statistical_significance": "N/A"
        }
    return result


def analyze_pattern_detection(pi_sequence):
    prompt = """
    You are an expert in number sequences and pattern recognition.

    TASK: Identify and analyze **patterns** in the given Pi sequence.

    INSTRUCTIONS:
    1. Detect **frequent recurring digit patterns** (e.g., repeated sequences).
    2. Identify **mathematically significant patterns** (e.g., Fibonacci, prime sequences).
    3. Calculate **occurrence frequency** of these patterns.
    4. Determine if these patterns are expected in a random sequence.
    5. Provide a **mathematical explanation** of findings.

    OUTPUT FORMAT (JSON):
    {
        "common_patterns": ["pattern1", "pattern2", ...],
        "pattern_frequencies": {"pattern1": X%, ...},
        "interesting_sequences": ["sequence1", "sequence2", ...],
        "mathematical_significance": "Explain why these patterns matter."
    }

    """

    result = get_gemini_response(prompt, pi_sequence)
    if not result:
        return {
            "common_patterns": ["1415"],
            "pattern_frequencies": {"1415": "N/A"},
            "interesting_sequences": [],
            "mathematical_significance": "Basic pattern detection only"
        }
    return result


def analyze_anomaly_detection(pi_sequence):
    prompt = """
    You are an advanced statistical anomaly detection AI.

    TASK: Identify **statistical anomalies** in the given Pi sequence.

    INSTRUCTIONS:
    1. Detect **unexpected deviations** from uniform randomness.
    2. Identify regions where digit distribution differs significantly from expected.
    3. Look for **clusters or gaps** that indicate non-random behavior.
    4. Compute **statistical confidence** in detected anomalies.
    5. Provide a **detailed explanation** of findings.

    OUTPUT FORMAT (JSON):
    {
        "anomalies": ["anomaly1", "anomaly2", ...],
        "statistical_deviations": {"sequence": "Explanation", ...},
        "confidence_scores": {"anomaly1": X%, ...},
        "analysis_summary": "Detailed explanation of findings."
    }

    """

    result = get_gemini_response(prompt, pi_sequence)
    if not result:
        return {
            "anomalies": ["No significant anomalies detected"],
            "statistical_deviations": {},
            "confidence_scores": {},
            "analysis_summary": "Basic anomaly detection only"
        }
    return result


@app.post("/analyze-pi")
async def analyze_pi(request: PiAnalysisRequest):
    try:
        if request.digit_count < 100 or request.digit_count > 10_000_000:
            raise HTTPException(
                status_code=400, 
                detail="Digit count must be between 100 and 10,000,000"
            )

        pi_sequence = get_pi_digits(request.digit_count)
        
        if request.analysis_type == "Frequency Distribution":
            result = analyze_frequency_distribution(pi_sequence)
            plot_data = result.get("digit_distribution", {})
        elif request.analysis_type == "Pattern Detection":
            result = analyze_pattern_detection(pi_sequence)
            plot_data = result.get("pattern_frequencies", {})
        elif request.analysis_type == "Anomaly Detection":
            result = analyze_anomaly_detection(pi_sequence)
            plot_data = result.get("confidence_scores", {})
        else:
            raise HTTPException(
                status_code=400, 
                detail="Invalid analysis type"
            )

        # Generate visualization
        plt.figure(figsize=(12, 6))
        if plot_data:
            plt.bar(plot_data.keys(), plot_data.values())
            plt.title(f"{request.analysis_type} of π Digits")
            plt.xlabel("Elements")
            plt.ylabel("Frequency/Score")
            
            # Save plot
            timestamp = int(time.time())
            filename = f"analysis_{timestamp}.png"
            plt.savefig(f"static/{filename}", bbox_inches='tight', dpi=300)
            plt.close()

            return {
                "analysis": result,
                "visualization_url": f"/static/{filename}"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Function to generate unique Mandelbrot fractals using π digits


def generate_mandelbrot(pi_digits, width=800, height=600, max_iter=200):
    x_min, x_max = -2, 1
    y_min, y_max = -1.5, 1.5

    # Dynamically adjust range using π digits
    if len(pi_digits) > 10:
        x_min += int(pi_digits[5]) * 0.1
        x_max -= int(pi_digits[6]) * 0.1
        y_min += int(pi_digits[7]) * 0.1
        y_max -= int(pi_digits[8]) * 0.1

    x = np.linspace(x_min, x_max, width)
    y = np.linspace(y_min, y_max, height)
    c = x[:, np.newaxis] + 1j * y
    z = c
    divtime = max_iter + np.zeros(z.shape, dtype=int)

    # Use multiple π digits for more unique colors
    color_factors = [int(d) for d in pi_digits[:5]]

    for i in range(max_iter):
        z = z**2 + c
        diverge = z*np.conj(z) > 2**2
        div_now = diverge & (divtime == max_iter)
        divtime[div_now] = i
        z[diverge] = 2

    # Create color mapping using π digits
    r = (divtime * color_factors[0]) % 256
    g = (divtime * color_factors[1]) % 256
    b = (divtime * color_factors[2]) % 256

    return np.dstack((r, g, b))

# Function to generate unique Julia fractals using π digits


def generate_julia(pi_digits, width=800, height=600, max_iter=200):
    x = np.linspace(-1.5, 1.5, width)
    y = np.linspace(-1.5, 1.5, height)
    X, Y = np.meshgrid(x, y)
    Z = X + Y*1j

    # Use π digits to generate complex parameter for the Julia set
    c = complex(float(pi_digits[:2])/50 - 1, float(pi_digits[2:4])/50 - 1)

    # Initialize output array
    output = np.zeros((height, width, 3), dtype=np.uint8)

    # Use π digits for coloring
    color_factors = [int(d) for d in pi_digits[4:9]]

    for i in range(max_iter):
        mask = np.abs(Z) <= 2
        Z[mask] = Z[mask]**2 + c

        # Color based on iteration count and π digits
        output[mask] = np.array([
            (i * color_factors[0]) % 256,
            (i * color_factors[1]) % 256,
            (i * color_factors[2]) % 256
        ])

    # Add zoom effect based on π digits
    if len(pi_digits) > 9:
        zoom_factor = float(pi_digits[9:11]) / 50 + 1
        output = zoom(output, (zoom_factor, zoom_factor, 1), order=0)

        # Crop to original size
        h, w = output.shape[:2]
        start_h = (h - height) // 2
        start_w = (w - width) // 2
        output = output[start_h:start_h+height, start_w:start_w+width]

    return output

# Function to enhance and save images


def enhance_and_save(image_array, filename):
    image = Image.fromarray(np.uint8(image_array))

    # Apply enhancements
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.5)  # Increase contrast

    enhancer = ImageEnhance.Color(image)
    image = enhancer.enhance(1.3)  # Boost colors

    enhancer = ImageEnhance.Sharpness(image)
    image = enhancer.enhance(2.0)  # Sharpen details

    # Remove old fractal files
    for old_file in glob.glob("static/fractal_*.png"):
        try:
            os.remove(old_file)
        except:
            pass

    # Save enhanced image
    os.makedirs("static", exist_ok=True)
    image.save(f"static/{filename}")
    return filename


@app.post("/generate-fractal")
async def generate_fractal(request: FractalRequest):
    try:
        if request.digit_count < 100 or request.digit_count > 10_000_000:
            raise HTTPException(
                status_code=400,
                detail="Digit count must be between 100 and 10,000,000"
            )
        try:
            # Get pi digits with progress tracking
            pi_digits = get_pi_digits(request.digit_count)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error computing π digits: {str(e)}"
            )

        # Generate fractal
        if request.fractal_type == "Mandelbrot":
            fractal_array = generate_mandelbrot(pi_digits)
        elif request.fractal_type == "Julia":
            fractal_array = generate_julia(pi_digits)
        else:
            raise HTTPException(status_code=400, detail="Invalid fractal type")

        # Save and enhance image
        timestamp = int(time.time())
        filename = f"fractal_{timestamp}.png"
        saved_filename = enhance_and_save(fractal_array, filename)

        return {
            "input_digits": f"First {request.digit_count:,} digits of π",
            "fractal_type": request.fractal_type,
            "pi_applied_parameters": {
                "color_map": f"RGB factors: {pi_digits[:3]}",
                "iteration_depth": len(pi_digits),
                "zoom_effect": f"Zoom factor: {float(pi_digits[12:14])/50 + 1:.2f}x" if len(pi_digits) > 13 else "1.00x",
                "complexity": f"{request.digit_count:,} digits used"
            },
            "generated_image_url": f"http://localhost:8000/static/{saved_filename}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def generate_midi_from_pi(pi_digits: str, style: str) -> str:
    midi = MIDIFile(3)  # 3 tracks: melody, harmony, and texture
    track = 0
    harmony_track = 1
    texture_track = 2
    current_time = 0

    params = MUSIC_STYLES[style]

    # Initialize all tracks
    for t in range(3):
        midi.addTrackName(t, current_time, f"Pi {style} Track {t+1}")
        midi.addTempo(t, current_time, params['tempo'])

    # Calculate complexity factors
    complexity = min(len(pi_digits) / 100000, 1.0)  # 0.0 to 1.0
    pattern_length = max(2, int(4 * complexity))
    texture_density = max(0.2, complexity)

    # Calculate maximum duration in seconds (limit to 3 minutes)
    MAX_DURATION = 180  # 3 minutes
    total_notes = min(
        int(MAX_DURATION / params['duration']),  # Max notes based on duration
        len(pi_digits) // pattern_length  # Max notes based on available digits
    )

    # Adjust base velocity for louder sound
    BASE_VELOCITY = 90  # Increased from 60
    HARMONY_REDUCTION = 10  # Reduced from 20-30

    # Process digits in segments for different musical elements
    for i in range(0, total_notes * pattern_length, pattern_length):
        if current_time >= MAX_DURATION:
            break

        segment = pi_digits[i:i + pattern_length]
        if len(segment) < pattern_length:
            break

        segment_value = int(segment)
        base_position = segment_value % len(params['scale'])
        base_note = params['base_note'] + params['scale'][base_position]

        # Dynamic parameters with increased velocity
        velocity = BASE_VELOCITY + (segment_value % 30)  # Increased range
        note_duration = params['duration'] * (0.5 + (segment_value % 3) * 0.25)

        # Add main melody with full velocity
        midi.addNote(track, 0, base_note, current_time,
                     note_duration, velocity)

        # Style-specific textures and harmonies with adjusted velocities
        if style == 'Classical':
            if segment_value % 4 < 2:
                for interval in [4, 7]:  # Third and fifth
                    midi.addNote(harmony_track, 0, base_note + interval,
                                 current_time, note_duration, velocity - HARMONY_REDUCTION)
                if segment_value % 3 == 0:
                    midi.addNote(texture_track, 0, base_note - 12,
                                 current_time, note_duration * 2, velocity - HARMONY_REDUCTION)

        elif style == 'Jazz':
            # Add jazz voicings
            if segment_value % 3 == 0:
                for interval in [7, 10, 14]:  # Seventh, ninth, thirteenth
                    midi.addNote(harmony_track, 0, base_note + interval,
                                 current_time, note_duration * 1.5, velocity - 15)
            # Add walking bass texture
            bass_note = base_note - 24
            midi.addNote(texture_track, 0, bass_note,
                         current_time, note_duration, velocity - 10)

        elif style == 'Electronic':
            # Add electronic arpeggios
            for step in range(4):
                if segment_value % (step + 2) == 0:
                    arp_note = base_note + \
                        params['scale'][(base_position + step) %
                                        len(params['scale'])]
                    midi.addNote(harmony_track, 0, arp_note,
                                 current_time + step * note_duration * 0.25,
                                 note_duration * 0.25, velocity - 10)
            # Add rhythmic texture
            if segment_value % 4 == 0:
                midi.addNote(texture_track, 0, base_note + 12,
                             current_time, note_duration * 0.5, velocity - 20)

        elif style == 'Ambient':
            # Add atmospheric pads
            if segment_value % 5 == 0:
                for interval in [7, 12, 16]:  # Fifth, octave, and fourth above
                    midi.addNote(harmony_track, 0, base_note + interval,
                                 current_time, note_duration * 2, velocity - 25)
            # Add subtle texture
            if segment_value % 6 == 0:
                midi.addNote(texture_track, 0, base_note + 24,
                             current_time, note_duration * 4, velocity - 40)

        current_time += note_duration
        if current_time >= MAX_DURATION:
            break

    # Save MIDI file
    timestamp = int(time.time())
    midi_filename = f"static/pi_music_{timestamp}.mid"
    os.makedirs("static", exist_ok=True)

    with open(midi_filename, "wb") as f:
        midi.writeFile(f)

    return midi_filename


@app.post("/generate-music")
async def generate_music(request: MusicRequest):
    try:
        if request.digit_count < 100 or request.digit_count > 100000:
            raise HTTPException(
                status_code=400,
                detail="Digit count must be between 100 and 100,000"
            )

        # Get pi digits
        pi_digits = get_pi_digits(request.digit_count)

        # Generate MIDI file
        midi_file = generate_midi_from_pi(pi_digits, request.music_style)

        style_config = MUSIC_STYLES.get(
            request.music_style, MUSIC_STYLES['Classical'])

        # Calculate actual duration (limited to 3 minutes)
        total_duration = min(180, (len(pi_digits) / 2)
                             * style_config['duration'])

        return {
            "generated_audio_url": f"http://localhost:8000/static/{os.path.basename(midi_file)}",
            "pi_applied_modifications": {
                "note_sequence": f"Using {request.digit_count:,} digits",
                "style": request.music_style,
                "tempo": f"{style_config['tempo']} BPM",
                "scale": f"{request.music_style} Scale",
                "instrument": style_config['instrument'].replace('_', ' ').title(),
                "duration": f"{(total_duration / 60):,.1f} minutes"
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/static/{filename}")
async def get_static_file(filename: str):
    file_path = f"static/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        file_path,
        media_type=mimetypes.guess_type(
            filename)[0] or 'application/octet-stream'
    )
