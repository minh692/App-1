import React, { useState, useCallback, useMemo } from 'react';
import { analyzeVideo } from './services/geminiService';
import Loader from './components/Loader';

interface TableRow {
  timestamp: string;
  action: string;
  notes: string;
}

interface ParsedAnalysis {
  globalCohesionBlock: string;
  sceneBreakdown: TableRow[];
  technicalAnalysis: string;
}

const parseAnalysisResult = (text: string): ParsedAnalysis | null => {
  try {
    const globalCohesionBlockMatch = text.match(/GLOBAL COHESION BLOCK([\s\S]*?)DETAILED SCENE BREAKDOWN TABLE/);
    const globalCohesionBlock = globalCohesionBlockMatch ? globalCohesionBlockMatch[1].trim() : '';

    const tableMatch = text.match(/DETAILED SCENE BREAKDOWN TABLE([\s\S]*?)TECHNICAL STYLE ANALYSIS/);
    const tableString = tableMatch ? tableMatch[1].trim() : '';
    
    const sceneBreakdown: TableRow[] = tableString
      .split('\n')
      .slice(2) // Skip header and separator line
      .map(row => {
        const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length === 3) {
          return {
            timestamp: cells[0],
            action: cells[1],
            notes: cells[2],
          };
        }
        return null;
      })
      .filter((row): row is TableRow => row !== null);

    const technicalAnalysisMatch = text.match(/TECHNICAL STYLE ANALYSIS([\s\S]*)/);
    const technicalAnalysis = technicalAnalysisMatch ? technicalAnalysisMatch[1].trim() : '';

    if (!globalCohesionBlock && sceneBreakdown.length === 0 && !technicalAnalysis) {
        return null;
    }

    return { globalCohesionBlock, sceneBreakdown, technicalAnalysis };
  } catch (e) {
    console.error("Failed to parse analysis result:", e);
    return null;
  }
};

const AnalysisDisplay: React.FC<{ analysis: ParsedAnalysis }> = ({ analysis }) => (
    <div className="space-y-8 text-gray-300">
        <div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 border-b-2 border-cyan-500 pb-2">GLOBAL COHESION BLOCK</h2>
            <p className="whitespace-pre-wrap leading-relaxed">{analysis.globalCohesionBlock}</p>
        </div>

        <div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 border-b-2 border-cyan-500 pb-2">Detailed Scene Breakdown</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-800 border border-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="py-3 px-4 text-left font-semibold text-gray-200">Timestamp Range (Start - End)</th>
                            <th className="py-3 px-4 text-left font-semibold text-gray-200">Core Action & Emotional Beat</th>
                            <th className="py-3 px-4 text-left font-semibold text-gray-200">Visual, Technical & Sound Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analysis.sceneBreakdown.map((row, index) => (
                            <tr key={index} className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors">
                                <td className="py-3 px-4 align-top">{row.timestamp}</td>
                                <td className="py-3 px-4 align-top">{row.action}</td>
                                <td className="py-3 px-4 align-top">{row.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        <div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 border-b-2 border-cyan-500 pb-2">Technical Style Analysis</h2>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{analysis.technicalAnalysis}</pre>
            </div>
        </div>
    </div>
);

const App: React.FC = () => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAnalysisResult(null);
            setError(null);
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoPreviewUrl(url);
        }
    };
    
    const handleAnalyzeVideo = useCallback(async () => {
        if (!videoFile) {
            setError("Please select a video file first.");
            return;
        }

        setIsLoading(true);
        setAnalysisResult(null);
        setError(null);

        try {
            const result = await analyzeVideo(videoFile);
            if (result.startsWith('Error:')) {
                throw new Error(result);
            }
            setAnalysisResult(result);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [videoFile]);

    const parsedResult = useMemo(() => {
        if (!analysisResult) return null;
        return parseAnalysisResult(analysisResult);
    }, [analysisResult]);


    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                        Veo Source Analyzer AI
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">Upload a video to generate a detailed analysis for Veo 3.1 prompts.</p>
                </header>

                <main className="bg-gray-800/50 border border-gray-700 rounded-xl shadow-2xl p-6 space-y-6">
                    <div>
                        <label htmlFor="video-upload" className="block text-lg font-medium text-gray-300 mb-2">Upload Video</label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="video-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-gray-500">MP4, MOV, WEBM, etc. (up to 15 mins)</p>
                                </div>
                                <input id="video-upload" type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    {videoPreviewUrl && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-300">Video Preview:</h3>
                            <video controls src={videoPreviewUrl} className="w-full rounded-lg shadow-lg border border-gray-700 max-h-[400px]">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )}

                    <div className="flex justify-center">
                        <button 
                            onClick={handleAnalyzeVideo}
                            disabled={!videoFile || isLoading}
                            className="px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-md hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                        >
                            {isLoading ? 'Analyzing...' : 'Analyze Video'}
                        </button>
                    </div>
                </main>
                
                <section className="mt-8">
                    {isLoading && <Loader />}
                    {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">{error}</div>}
                    {analysisResult && (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl shadow-2xl p-6">
                           {parsedResult ? <AnalysisDisplay analysis={parsedResult} /> : <pre className="whitespace-pre-wrap font-mono text-sm">{analysisResult}</pre>}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default App;
