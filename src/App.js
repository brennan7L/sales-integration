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

    console.log('🔗 Setting up Missive conversation listener...');

    // Set up Missive API event listener for conversation changes
    const cleanup = MissiveAPI.onConversationChange(handleConversationChange);
    
    return cleanup;
  }, [isMissiveContext]);

  const handleConversationChange = async (conversation) => {
    console.log('🔄 App received conversation change:', conversation);
    if (!conversation) {
      console.log('📭 No conversation selected, clearing data');
      setConversationData(null);
      setAnalysis(null);
      return;
    }

    console.log('📨 New conversation selected:', {
      id: conversation.id,
      subject: conversation.subject,
      messageCount: conversation.messages_count
    });

    setConversationData(conversation);
    setAnalysis(null);
    setError(null);
  };

  const analyzeConversation = async () => {
    if (!conversationData) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting full analysis for conversation:', conversationData.id);
      
      // Get conversation messages using the updated API
      const messages = await MissiveAPI.getConversationMessages(conversationData);
      console.log('📨 Retrieved messages:', messages.length);
      
      // Format messages for analysis
      const conversationText = MissiveAPI.formatConversationForAnalysis(messages);
      console.log('📝 Formatted conversation text length:', conversationText.length);
      
      // Call OpenAI API
      const analysis = await OpenAIAPI.analyzeSalesConversation(conversationText);
      setAnalysis(analysis);
    } catch (err) {
      console.error('❌ Analysis error:', err);
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
      console.log('🚛 Starting freight lead qualification for:', conversationData.id);
      
      const messages = await MissiveAPI.getConversationMessages(conversationData);
      const conversationText = MissiveAPI.formatConversationForAnalysis(messages);
      const qualification = await OpenAIAPI.qualifyFreightForwardingLead(conversationText);
      setAnalysis(qualification);
    } catch (err) {
      console.error('❌ Freight qualification error:', err);
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
      console.log('😊 Starting sentiment analysis for:', conversationData.id);
      
      const messages = await MissiveAPI.getConversationMessages(conversationData);
      const conversationText = MissiveAPI.formatConversationForAnalysis(messages);
      const sentiment = await OpenAIAPI.quickSentimentAnalysis(conversationText);
      setAnalysis(sentiment);
    } catch (err) {
      console.error('❌ Sentiment analysis error:', err);
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
      console.log('📋 Extracting action items for:', conversationData.id);
      
      const messages = await MissiveAPI.getConversationMessages(conversationData);
      const conversationText = MissiveAPI.formatConversationForAnalysis(messages);
      const actionItems = await OpenAIAPI.quickActionItems(conversationText);
      setAnalysis(actionItems);
    } catch (err) {
      console.error('❌ Action items error:', err);
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

  // Extract key metrics from analysis for scorecard
  const extractScorecard = (analysisText) => {
    if (!analysisText) return null;

    const metrics = {};
    
    // Extract rating
    const ratingMatch = analysisText.match(/\*\*RATING:\s*([^*]+)\*\*/i);
    if (ratingMatch) {
      metrics.rating = ratingMatch[1].trim();
    }

    // Extract sentiment
    const sentimentMatch = analysisText.match(/\*\*SENTIMENT:\s*([^*]+)\*\*/i);
    if (sentimentMatch) {
      metrics.sentiment = sentimentMatch[1].trim();
    } else if (analysisText.toLowerCase().includes('positive')) {
      metrics.sentiment = 'Positive';
    } else if (analysisText.toLowerCase().includes('negative')) {
      metrics.sentiment = 'Negative';
    } else if (analysisText.toLowerCase().includes('neutral')) {
      metrics.sentiment = 'Neutral';
    }

    // Extract opportunity score
    const opportunityMatch = analysisText.match(/\*\*OPPORTUNITY:\s*([^*]+)\*\*/i);
    if (opportunityMatch) {
      metrics.opportunity = opportunityMatch[1].trim();
    }

    // Extract urgency
    const urgencyMatch = analysisText.match(/\*\*URGENCY:\s*([^*]+)\*\*/i);
    if (urgencyMatch) {
      metrics.urgency = urgencyMatch[1].trim();
    }

    return Object.keys(metrics).length > 0 ? metrics : null;
  };

  const scorecard = extractScorecard(analysis);

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
              <li>Make sure you're using the correct integration URL: <code>https://salesintegration.netlify.app/</code></li>
              <li>Clear browser cache and restart Missive</li>
              <li>Check browser console for errors (F12)</li>
              <li>Verify the Missive JavaScript API is loading</li>
            </ul>
            
            <p><strong>Technical Status:</strong></p>
            <ul>
              <li>Missive Script: {typeof window.Missive !== 'undefined' ? '✅ Loaded' : '❌ Not loaded'}</li>
              <li>Integration URL: {window.location.href}</li>
              <li>Running in iframe: {window.parent !== window ? '✅ Yes' : '❌ No'}</li>
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
            {/* Scorecard */}
            {scorecard && (
              <div className="scorecard">
                <h4>📊 Analysis Scorecard</h4>
                <div className="scorecard-grid">
                  {scorecard.rating && (
                    <div className={`scorecard-item rating ${getRatingClass(scorecard.rating)}`}>
                      <div className="scorecard-label">Lead Rating</div>
                      <div className="scorecard-value">{scorecard.rating}</div>
                    </div>
                  )}
                  {scorecard.sentiment && (
                    <div className="scorecard-item sentiment">
                      <div className="scorecard-label">Sentiment</div>
                      <div className="scorecard-value">{scorecard.sentiment}</div>
                    </div>
                  )}
                  {scorecard.opportunity && (
                    <div className="scorecard-item opportunity">
                      <div className="scorecard-label">Opportunity</div>
                      <div className="scorecard-value">{scorecard.opportunity}</div>
                    </div>
                  )}
                  {scorecard.urgency && (
                    <div className="scorecard-item urgency">
                      <div className="scorecard-label">Urgency</div>
                      <div className="scorecard-value">{scorecard.urgency}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

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