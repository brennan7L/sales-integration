import React, { useState, useEffect } from 'react';
import { MissiveAPI } from './utils/missiveApi';
import { OpenAIAPI } from './utils/openaiApi';
import './App.css';

function App() {
  const [conversationData, setConversationData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // Check if we're running inside Missive with debug info
  const isMissiveContext = MissiveAPI.checkAvailability();

  useEffect(() => {
    // Debug logging
    console.log('🔍 App Debug Info:');
    console.log('- Window object:', typeof window);
    console.log('- Missive object:', typeof window.Missive);
    console.log('- isMissiveContext:', isMissiveContext);
    console.log('- User Agent:', navigator.userAgent);
    console.log('- Current URL:', window.location.href);
    
    setDebugInfo(`
      Missive Available: ${typeof window.Missive !== 'undefined'}
      Is Missive Context: ${isMissiveContext}
      URL: ${window.location.href}
      Timestamp: ${new Date().toISOString()}
    `);

    if (!isMissiveContext) return;

    // Set up Missive API event listener
    const cleanup = MissiveAPI.addEventListener('conversation_selected', handleConversationChange);
    
    // Get initial conversation if one is selected
    MissiveAPI.getSelectedConversation()
      .then(conversation => {
        console.log('🔍 Initial conversation:', conversation);
        if (conversation) {
          handleConversationChange(conversation);
        }
      })
      .catch(err => console.log('No conversation selected initially:', err));

    return cleanup;
  }, [isMissiveContext]);

  const handleConversationChange = async (conversation) => {
    console.log('🔄 Conversation changed:', conversation);
    if (!conversation) {
      setConversationData(null);
      setAnalysis(null);
      return;
    }

    setConversationData(conversation);
    setAnalysis(null);
    setError(null);
  };

  const analyzeConversation = async () => {
    if (!conversationData) return;

    setLoading(true);
    setError(null);

    try {
      // Get conversation messages
      const messages = await MissiveAPI.getConversationMessages(conversationData.id);
      
      // Format messages for analysis
      const conversationText = MissiveAPI.formatConversationForAnalysis(messages);
      
      // Call OpenAI API
      const analysis = await OpenAIAPI.analyzeSalesConversation(conversationText);
      setAnalysis(analysis);
    } catch (err) {
      setError(err.message || 'Failed to analyze conversation');
    } finally {
      setLoading(false);
    }
  };

  const qualifyFreightLead = async () => {
    if (!conversationData) return;

    setLoading(true);
    setError(null);

    try {
      const messages = await MissiveAPI.getConversationMessages(conversationData.id);
      const conversationText = MissiveAPI.formatConversationForAnalysis(messages);
      const qualification = await OpenAIAPI.qualifyFreightForwardingLead(conversationText);
      setAnalysis(qualification);
    } catch (err) {
      setError(err.message || 'Failed to qualify lead');
    } finally {
      setLoading(false);
    }
  };

  const quickSentiment = async () => {
    if (!conversationData) return;

    setLoading(true);
    setError(null);

    try {
      const messages = await MissiveAPI.getConversationMessages(conversationData.id);
      const conversationText = MissiveAPI.formatConversationForAnalysis(messages);
      const sentiment = await OpenAIAPI.quickSentimentAnalysis(conversationText);
      setAnalysis(sentiment);
    } catch (err) {
      setError(err.message || 'Failed to analyze sentiment');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = async () => {
    if (!conversationData) return;

    setLoading(true);
    setError(null);

    try {
      const messages = await MissiveAPI.getConversationMessages(conversationData.id);
      const conversationText = MissiveAPI.formatConversationForAnalysis(messages);
      const actionItems = await OpenAIAPI.quickActionItems(conversationText);
      setAnalysis(actionItems);
    } catch (err) {
      setError(err.message || 'Failed to extract action items');
    } finally {
      setLoading(false);
    }
  };

  const formatAnalysisContent = (text) => {
    if (!text) return [];
    
    return text.split('\n').map((line, index) => {
      // Check if line is a section header (starts with ** and ends with **)
      if (line.match(/^\*\*.*\*\*$/)) {
        // Special styling for RATING line
        if (line.includes('RATING:')) {
          const rating = line.replace(/\*\*/g, '').replace('RATING: ', '');
          const ratingClass = getRatingClass(rating);
          return (
            <div key={index} className={`rating-badge ${ratingClass}`}>
              <strong>{rating}</strong>
            </div>
          );
        }
        
        return (
          <h5 key={index} className="analysis-section-header">
            {line.replace(/\*\*/g, '')}
          </h5>
        );
      }
      
      // Regular line
      if (line.trim()) {
        return <p key={index}>{line}</p>;
      }
      
      return null;
    }).filter(Boolean);
  };

  const getRatingClass = (rating) => {
    if (rating.includes('HIGH FIT')) return 'high-fit';
    if (rating.includes('MEDIUM FIT')) return 'medium-fit';
    if (rating.includes('LOW FIT')) return 'low-fit';
    if (rating.includes('POOR FIT')) return 'poor-fit';
    return 'unknown-fit';
  };

  if (!isMissiveContext) {
    return (
      <div className="app-container">
        <div className="setup-message">
          <h2>🚀 Missive Sales Assistant</h2>
          <p>This app is designed to run as a Missive sidebar integration.</p>
          
          <div className="debug-info">
            <h3>🔍 Debug Information:</h3>
            <pre>{debugInfo}</pre>
            <p><strong>If you're seeing this in Missive:</strong></p>
            <ul>
              <li>Clear browser cache and restart Missive</li>
              <li>Check browser console for errors</li>
              <li>Try adding <code>?v=3</code> to the integration URL</li>
            </ul>
          </div>
          
          <p><strong>Setup Instructions:</strong></p>
          <ol>
            <li>Deploy this app to Netlify</li>
            <li>In Netlify dashboard, go to <strong>Site settings → Environment variables</strong></li>
            <li>Add environment variable: <code>openAIKey</code> = your OpenAI API key</li>
            <li>In Missive, go to <strong>Settings → Integrations → Add Integration</strong></li>
            <li>Choose <strong>iFrame</strong> and enter your Netlify URL</li>
            <li>Set integration to appear in sidebar</li>
          </ol>
          <p>📧 Your AI-powered sales insights will be ready to use!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="sidebar-header">
        <h1>Sales Assistant</h1>
        <p>AI-powered conversation analysis</p>
      </div>

      <div className="sidebar-content">
        {!conversationData ? (
          <div className="no-conversation">
            <p>👈 Select a conversation to analyze</p>
            <div className="debug-info-small">
              <details>
                <summary>Debug Info</summary>
                <pre>{debugInfo}</pre>
              </details>
            </div>
          </div>
        ) : (
          <div className="conversation-info">
            <div className="conversation-header">
              <h3>{conversationData.subject || 'No Subject'}</h3>
              <span className="participants">
                {conversationData.participants?.length || 0} participants
              </span>
            </div>

            <div className="action-buttons">
              <button 
                className="analyze-btn primary freight-btn"
                onClick={qualifyFreightLead}
                disabled={loading}
              >
                {loading ? 'Qualifying Lead...' : '🚚 Qualify Freight Lead'}
              </button>
              
              <button 
                className="analyze-btn primary"
                onClick={analyzeConversation}
                disabled={loading}
              >
                {loading ? 'Analyzing...' : '🤖 Full Analysis'}
              </button>
              
              <div className="quick-actions">
                <button 
                  className="analyze-btn secondary"
                  onClick={quickSentiment}
                  disabled={loading}
                >
                  😊 Sentiment
                </button>
                <button 
                  className="analyze-btn secondary"
                  onClick={quickActions}
                  disabled={loading}
                >
                  📋 Actions
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <p>❌ {error}</p>
              </div>
            )}

            {analysis && (
              <div className="analysis-results">
                <h4>📊 Analysis Results</h4>
                <div className="analysis-content">
                  {formatAnalysisContent(analysis)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <small>Powered by OpenAI GPT-4</small>
      </div>
    </div>
  );
}

export default App; 