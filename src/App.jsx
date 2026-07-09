import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle, Server } from 'lucide-react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking'); // checking, online, offline
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://dikanew-production.up.railway.app';

  useEffect(() => {
    // Check server health on mount
    const checkServer = async () => {
      try {
        await axios.get(`${API_URL}/`);
        setServerStatus('online');
      } catch (error) {
        console.error("Server check failed:", error);
        setServerStatus('offline');
      }
    };
    checkServer();
  }, [API_URL]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    // Check if it's an image
    if (!selectedFile.type.match('image.*')) {
      alert('Please select an image file (.jpg, .png)');
      return;
    }
    
    setFile(selectedFile);
    setResult(null); // Reset previous result
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handlePredict = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setResult(response.data);
    } catch (error) {
      console.error("Prediction failed:", error);
      alert(error.response?.data?.detail || "Failed to connect to the API. Make sure the FastAPI server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Server Status Badge */}
      <div className={`server-status ${serverStatus === 'online' ? 'status-online' : serverStatus === 'offline' ? 'status-offline' : ''} glass-panel`}>
        <div className="status-indicator"></div>
        <span>{serverStatus === 'online' ? 'API Online' : serverStatus === 'offline' ? 'API Offline' : 'Checking API...'}</span>
      </div>

      <header className="header">
        <h1>Apple Quality AI</h1>
        <p>Advanced vision transformer to detect fresh or rotten apples</p>
      </header>

      <main className="main-content">
        {/* Upload Section */}
        <section className="glass-panel upload-card">
          <h2>Upload Image</h2>
          
          <div 
            className={`drop-zone ${isDragging ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg, image/png"
              style={{ display: 'none' }}
            />
            <UploadCloud size={64} className="drop-zone-icon animate-float" />
            <p>Seret dan jatuhkan gambar apel Anda di sini.</p>
            <span>atau klik untuk menjelajahi dari komputer Anda</span>
          </div>

          <button 
            className={`btn ${file && !loading ? 'animate-pulse-btn' : ''}`}
            onClick={handlePredict}
            disabled={!file || loading || serverStatus === 'offline'}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Menganalisis...
              </>
            ) : (
              <>
                <Server size={20} />
                Analisis Kualitas
              </>
            )}
          </button>
        </section>

        {/* Preview & Result Section */}
        <section className="glass-panel preview-card">
          <h2>Hasil Analisis</h2>
          
          <div className="image-preview-container">
            {preview ? (
              <img src={preview} alt="Apple preview" className="image-preview" />
            ) : (
              <div className="empty-preview">
                <ImageIcon size={48} opacity={0.5} />
                <p>Tidak Ada Gambar Yang dipilih.</p>
              </div>
            )}
          </div>

          {result && (
            <div className={`result-container ${
              result.prediction === 'fresh'
                ? 'result-fresh'
                : result.prediction === 'not_apple'
                  ? 'result-not-apple'
                  : 'result-rotten'
            }`}>
              <div className="result-title">
                {result.prediction === 'fresh' ? (
                  <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                    <CheckCircle size={24} />
                    Apel Segar
                  </span>
                ) : result.prediction === 'not_apple' ? (
                  <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                    <AlertCircle size={24} />
                    Ini Bukan Apel
                  </span>
                ) : (
                  <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                    <AlertCircle size={24} />
                    Apel Busuk
                  </span>
                )}
              </div>
              
              {result.confidence && (
                <div className="result-score">
                  Confidence: <strong>{(result.confidence * 100).toFixed(2)}%</strong>
                </div>
              )}
              {result.prediction === 'not_apple' && result.apple_check && (
                <div style={{marginTop: '10px', fontSize: '0.9rem', opacity: 0.8}}>
                  Terdeteksi sebagai: {result.apple_check.top_label}
                </div>
              )}
              {result.probabilities && (
                <div style={{marginTop: '10px', fontSize: '0.9rem', opacity: 0.8}}>
                  Segar: {(result.probabilities.fresh * 100).toFixed(1)}% | 
                  busuk: {(result.probabilities.rotten * 100).toFixed(1)}%
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
