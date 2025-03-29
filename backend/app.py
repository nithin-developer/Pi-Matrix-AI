from fastapi.staticfiles import StaticFiles
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import matplotlib.pyplot as plt
import numpy as np
from dotenv import load_dotenv
import google.generativeai as genai
import json
import time
import glob

load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash', generation_config={"response_mime_type": "application/json"})

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


def get_gemini_response(prompt, pi_sequence):
    try:
        response = model.generate_content(
            prompt + f"\nPi Sequence: {pi_sequence}")
        return json.loads(response.text) if response.text else response
    except Exception as e:
        print(f"Error in Gemini API call: {e}")
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
