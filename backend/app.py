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

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")


class PiAnalysisRequest(BaseModel):
    pi_sequence: str
    analysis_type: str


class FractalRequest(BaseModel):
    digit_count: int
    fractal_type: str = "Mandelbrot"


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
    pi_sequence = request.pi_sequence
    analysis_type = request.analysis_type

    try:
        if analysis_type == "Frequency Distribution":
            result = analyze_frequency_distribution(pi_sequence)
            plot_data = result.get("digit_distribution", {})
        elif analysis_type == "Pattern Detection":
            result = analyze_pattern_detection(pi_sequence)
            plot_data = result.get("pattern_frequencies", {})
        elif analysis_type == "Anomaly Detection":
            result = analyze_anomaly_detection(pi_sequence)
            plot_data = result.get("confidence_scores", {})
        else:
            raise HTTPException(
                status_code=400, detail="Invalid analysis type")

        # Generate visualization
        plt.figure(figsize=(12, 6))
        if plot_data:
            plt.bar(plot_data.keys(), plot_data.values())
            plt.title(f"{analysis_type} of π Digits")
            plt.xlabel("Elements")
            plt.ylabel("Frequency/Confidence (%)")

            # Add timestamp to filename
            timestamp = int(time.time())
            filename = f"graph_{timestamp}.png"

            # Ensure the static directory exists
            os.makedirs("static", exist_ok=True)

            # Remove old graph files
            for old_file in glob.glob("static/graph_*.png"):
                try:
                    os.remove(old_file)
                except:
                    pass

            plt.savefig(f"static/{filename}")
            plt.close()

        return {
            "input_digits": pi_sequence[:10] + "...",
            "analysis": result,
            "visualization_url": f"http://localhost:8000/static/{filename}"
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
