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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-white">Dental X-ray Diagnosis</h1>
      <div className="flex gap-4">
        {/* Left */}
        <div className="w-2/5 bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="mb-4 flex items-center space-x-4">
            <label className="flex items-center bg-gray-700 text-gray-100 px-4 py-2 rounded cursor-pointer hover:bg-gray-600">
              <span>Choose File</span>
              <input type="file" onChange={handleFileChange} className="hidden" />
            </label>
            <span className="text-gray-400 text-sm">{file ? file.name : 'No file chosen'}</span>
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-white text-black rounded hover:bg-blue-700 cursor-pointer"
            >
              Predict
            </button>
          </div>

          {loading && (
            <div className="flex justify-center my-4">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {annotatedSrc && (
            <img src={annotatedSrc} alt="Annotated X-ray" className="w-full rounded" />
          ) }
        </div>

        {/* Right */}
        <div className="w-3/5 bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2 text-white">Diagnostic Report</h2>
          <div className="h-[500px] overflow-y-auto border border-gray-700 p-2 rounded bg-gray-700 text-gray-200">
            {typeof report === 'string' && report.trim() !== '' ? (
              <ErrorBoundary>
                <ReactMarkdown>{report}</ReactMarkdown>
              </ErrorBoundary>
            ) : (
              <p className="text-gray-400">No report yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
