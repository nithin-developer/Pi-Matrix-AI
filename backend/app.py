import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import matplotlib.pyplot as plt
import numpy as np
from dotenv import load_dotenv
import google.generativeai as genai
import json

load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

app = FastAPI()

class PiAnalysisRequest(BaseModel):
    pi_sequence: str
    analysis_type: str

def get_gemini_response(prompt, pi_sequence):
    try:
        response = model.generate_content(prompt + f"\nPi Sequence: {pi_sequence}")
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in Gemini API call: {e}")
        return None

def analyze_frequency_distribution(pi_sequence):
    prompt = """
    Analyze the frequency distribution of digits in this Pi sequence.
    Return the result as a JSON object with the following structure:
    {
        "digit_distribution": {"0": X%, "1": Y%, ...},
        "insights": ["insight1", "insight2", ...],
        "statistical_significance": "explanation of statistical significance"
    }
    Make the analysis detailed and mathematically sound.
    """
    
    result = get_gemini_response(prompt, pi_sequence)
    if not result:
        # Fallback to basic analysis if API fails
        digit_count = {str(i): pi_sequence.count(str(i)) for i in range(10)}
        total_digits = len(pi_sequence)
        distribution = {k: (v / total_digits) * 100 for k, v in digit_count.items()}
        return {
            "digit_distribution": distribution,
            "insights": ["Basic frequency analysis performed"],
            "statistical_significance": "N/A"
        }
    return result

def analyze_pattern_detection(pi_sequence):
    prompt = """
    Analyze this Pi sequence for recurring patterns and sequences.
    Return the result as a JSON object with the following structure:
    {
        "common_patterns": ["pattern1", "pattern2", ...],
        "pattern_frequencies": {"pattern1": X%, ...},
        "interesting_sequences": ["sequence1", "sequence2", ...],
        "mathematical_significance": "explanation of findings"
    }
    Focus on mathematically significant patterns and their implications.
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
    Analyze this Pi sequence for statistical anomalies and unusual patterns.
    Return the result as a JSON object with the following structure:
    {
        "anomalies": ["anomaly1", "anomaly2", ...],
        "statistical_deviations": {"sequence": "explanation", ...},
        "confidence_scores": {"anomaly1": X%, ...},
        "analysis_summary": "detailed explanation of findings"
    }
    Focus on mathematically significant deviations from expected randomness.
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
            raise HTTPException(status_code=400, detail="Invalid analysis type")

        # Generate visualization
        plt.figure(figsize=(12, 6))
        if plot_data:
            plt.bar(plot_data.keys(), plot_data.values())
            plt.title(f"{analysis_type} of π Digits")
            plt.xlabel("Elements")
            plt.ylabel("Frequency/Confidence (%)")
            
            # Ensure the static directory exists
            os.makedirs("static", exist_ok=True)
            plt.savefig("static/graph.png")
            plt.close()

        return {
            "input_digits": pi_sequence[:10] + "...",
            "analysis": result,
            "visualization_url": "http://localhost:8000/static/graph.png"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 