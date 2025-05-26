import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <p className="text-red-400">Error loading report content.</p>;
    }
    return this.props.children;
  }
}

export default function DentalXrayApp() {
  const [file, setFile] = useState(null);
  // const [imageSrc, setImageSrc] = useState(null);
  const [annotatedSrc, setAnnotatedSrc] = useState(null);
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/process`, formData);

      // setImageSrc(res.data.original_image_url);
      setAnnotatedSrc(res.data.annotated_image_url);

      setReport(res.data.report || '');
    } catch (error) {
      console.error('Error uploading file:', error);
      setReport('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 p-4 sm:p-6">
  <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-white">Dental X-ray Diagnosis</h1>
  
  <div className="flex flex-col lg:flex-row gap-6">
    
    {/* Left */}
    <div className="lg:w-2/5 w-full bg-gray-800 p-4 rounded-xl shadow-lg">
      <div className="mb-6 space-y-4">
        <label className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm rounded-md cursor-pointer 
  w-full sm:w-60 px-4 py-2 transition">
          <span>Choose File</span>
          <input type="file" onChange={handleFileChange} className="hidden" />
        </label>

        <div className="text-center text-sm text-gray-400">
          {file ? file.name : 'No file chosen'}
        </div>

        <button
          onClick={handleUpload}
          className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer"
        >
          Predict
        </button>
      </div>

      {loading && (
        <div className="flex justify-center my-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {annotatedSrc && (
        <img src={annotatedSrc} alt="Annotated X-ray" className="w-full rounded-lg mt-4 shadow" />
      )}
    </div>

    {/* Right */}
    <div className="lg:w-3/5 w-full bg-gray-800 p-4 rounded-xl shadow-lg">
      <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-white text-center lg:text-left">📝 Diagnostic Report</h2>
      <div className="h-[400px] sm:h-[500px] overflow-y-auto border border-gray-700 p-3 rounded-lg bg-gray-700 text-gray-200">
        {typeof report === 'string' && report.trim() !== '' ? (
          <ErrorBoundary>
            <ReactMarkdown>{report}</ReactMarkdown>
          </ErrorBoundary>
        ) : (
          <p className="text-gray-400 text-center">No report yet.</p>
        )}
      </div>
    </div>
  </div>
</div>

  );
}
