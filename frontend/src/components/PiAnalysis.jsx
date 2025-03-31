import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

function PiAnalysis() {
  const [digitCount, setDigitCount] = useState(1000);
  const [analysisType, setAnalysisType] = useState("Frequency Distribution");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [visualizationUrl, setVisualizationUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentAnalysisType, setCurrentAnalysisType] = useState(
    "Frequency Distribution"
  );

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/analyze-pi", {
        digit_count: digitCount,
        analysis_type: analysisType,
      });

      if (response.data.analysis) {
        setAnalysisResult(response.data.analysis);
      }

      // Ensure the visualization URL is properly formatted
      if (response.data.visualization_url) {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const fullUrl = response.data.visualization_url.startsWith("http")
          ? response.data.visualization_url
          : `${baseUrl}${response.data.visualization_url}`;
        setVisualizationUrl(fullUrl);
      }

      setCurrentAnalysisType(analysisType);
    } catch (error) {
      console.error("Analysis failed:", error);
      setError(
        error.response?.data?.detail ||
          error.message ||
          "An error occurred during analysis"
      );
      setAnalysisResult(null);
      setVisualizationUrl("");
    } finally {
      setLoading(false);
    }
  };

  const renderFrequencyDistribution = (data) => {
    if (!data?.digit_distribution) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(data.digit_distribution).map(([digit, frequency]) => {
            // Ensure frequency is a number and handle potential string values
            const numericFrequency = parseFloat(frequency);

            return (
              <div
                key={digit}
                className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-mono font-semibold text-gray-700 dark:text-gray-300">
                    Digit {digit}
                  </span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono">
                    {!isNaN(numericFrequency)
                      ? numericFrequency.toFixed(2)
                      : "0.00"}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        !isNaN(numericFrequency)
                          ? Math.min(100, Math.max(0, numericFrequency))
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {data.insights && data.insights.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Insights
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              {data.insights.map((insight, index) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </div>
        )}

        {data.statistical_significance &&
          data.statistical_significance !== "N/A" && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Statistical Significance
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {data.statistical_significance}
              </p>
            </div>
          )}
      </div>
    );
  };

  const renderPatternDetection = (data) => {
    if (!data) return null;

    return (
      <div className="space-y-4">
        {data.common_patterns && data.common_patterns.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Common Patterns
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {data.pattern_frequencies &&
                Object.entries(data.pattern_frequencies).map(
                  ([pattern, frequency]) => (
                    <div
                      key={pattern}
                      className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-gray-700 dark:text-gray-300">
                          {pattern}
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 font-mono">
                          {frequency}
                        </span>
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>
        )}

        {/* Rest of the pattern detection rendering remains the same */}
      </div>
    );
  };

  const renderAnomalyDetection = (data) => {
    const {
      anomalies,
      statistical_deviations,
      confidence_scores,
      analysis_summary,
    } = data;

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
                      {statistical_deviations[
                        anomaly.split(" ").join("_").toLowerCase()
                      ] || ""}
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
                <div
                  key={key}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                >
                  <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 capitalize mb-2">
                    {key.split("_").join(" ")}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">{value}</p>
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
          π Digit Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Analyze the structure of π digits and detect anomalies and patterns.
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
          {/* Analysis Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Analysis Type
            </label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 dark:text-gray-200"
            >
              <option value="Frequency Distribution">
                Frequency Distribution
              </option>
              <option value="Pattern Detection">Pattern Detection</option>
              <option value="Anomaly Detection">Anomaly Detection</option>
            </select>
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAnalyze}
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
                <span>Analyzing...</span>
              </div>
            ) : (
              "Analyze Pi Digits"
            )}
          </motion.button>

          {/* Loading Stage Indicator */}
          {loading && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Processing {formatNumber(digitCount)} digits...
            </div>
          )}
        </div>
      </div>

      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Analysis Results
          </h2>
          {currentAnalysisType === "Pattern Detection" ? (
            renderPatternDetection(analysisResult)
          ) : currentAnalysisType === "Frequency Distribution" ? (
            renderFrequencyDistribution(analysisResult)
          ) : currentAnalysisType === "Anomaly Detection" ? (
            renderAnomalyDetection(analysisResult)
          ) : (
            <div className="space-y-4">
              {Object.entries(analysisResult).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/_/g, " ")}
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    {Array.isArray(value) ? (
                      <ul className="list-disc list-inside space-y-2">
                        {value.map((item, index) => (
                          <li
                            key={index}
                            className="text-gray-600 dark:text-gray-300"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : typeof value === "object" ? (
                      <pre className="text-sm text-gray-600 dark:text-gray-300 overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-300">
                        {value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {visualizationUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            Visualization
          </h2>
          <img
            src={`${visualizationUrl}?t=${Date.now()}`}
            alt="Analysis Graph"
            className="w-full rounded-lg shadow-md"
            onError={(e) => {
              console.error("Image failed to load:", e);
              setError("Failed to load visualization");
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

export default PiAnalysis;
