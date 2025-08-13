import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/api';

const ConnectionDebug = () => {
  const [status, setStatus] = useState('Testing...');
  const [error, setError] = useState(null);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const testUrl = buildApiUrl('/api/test');
        setApiUrl(testUrl);
        
        console.log('🔍 Testing connection to:', testUrl);
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(`✅ Connected! Backend says: ${data.message}`);
          console.log('✅ Connection successful:', data);
        } else {
          setStatus(`❌ HTTP Error: ${response.status} ${response.statusText}`);
          setError(`HTTP ${response.status}: ${response.statusText}`);
          console.error('❌ HTTP Error:', response.status, response.statusText);
        }
      } catch (err) {
        setStatus('❌ Connection failed');
        setError(err.message);
        console.error('❌ Connection error:', err);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🔧 Connection Debug</h3>
      <p><strong>Frontend URL:</strong> {window.location.origin}</p>
      <p><strong>Backend URL:</strong> {apiUrl}</p>
      <p><strong>Status:</strong> {status}</p>
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          padding: '10px', 
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <button 
        onClick={() => window.location.reload()} 
        style={{ 
          marginTop: '10px',
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Retry Test
      </button>
    </div>
  );
};

export default ConnectionDebug;
