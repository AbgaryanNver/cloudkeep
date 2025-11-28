import React, { useState, useEffect } from 'react';
import './App.css';
import { FiUpload, FiDownload, FiTrash2, FiShare2, FiFile } from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function App() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fetch(`${API_URL}/files`, {
        headers: {
          'x-user-id': 'demo-user'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Error loading files:', err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = e.target.result.split(',')[1];

        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'demo-user'
          },
          body: JSON.stringify({
            fileName: file.name,
            fileContent: base64Content,
            contentType: file.type,
            fileSize: file.size
          })
        });

        if (response.ok) {
          await loadFiles();
        } else {
          const data = await response.json();
          setError(data.error || 'Upload failed');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Upload failed: ' + err.message);
      setUploading(false);
    }
  };

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Delete ${fileName}?`)) return;

    try {
      const response = await fetch(`${API_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': 'demo-user'
        }
      });

      if (response.ok) {
        await loadFiles();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>CloudKeep</h1>
        <p>Secure Cloud Storage Solution</p>
      </header>

      <main className="App-main">
        <div className="upload-section">
          <label htmlFor="file-upload" className="upload-button">
            <FiUpload /> {uploading ? 'Uploading...' : 'Upload File'}
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="files-section">
          <h2>Your Files ({files.length})</h2>
          {files.length === 0 ? (
            <div className="empty-state">
              <FiFile size={64} />
              <p>No files yet. Upload your first file to get started!</p>
            </div>
          ) : (
            <div className="files-grid">
              {files.map((file) => (
                <div key={file.fileId} className="file-card">
                  <div className="file-icon">
                    <FiFile size={32} />
                  </div>
                  <div className="file-info">
                    <h3>{file.fileName}</h3>
                    <p className="file-meta">
                      {formatFileSize(file.fileSize)} • {formatDate(file.uploadDate)}
                    </p>
                  </div>
                  <div className="file-actions">
                    <button
                      className="action-button delete"
                      onClick={() => handleDelete(file.fileId, file.fileName)}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="App-footer">
        <p>CloudKeep v1.0.0 - Secure, Simple, Scalable</p>
      </footer>
    </div>
  );
}

export default App;
