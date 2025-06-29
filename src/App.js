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

  // Comprehensive Gold Strike Analysis - combines all insights
  const strikeGold = async () => {
    if (!conversationData) return;

    setLoading(true);
    setError(null);

    try {
      console.log('⛏️ Starting comprehensive prospecting analysis for:', conversationData.id);
      
      const messages = await MissiveAPI.getConversationMessages(conversationData);
      const conversationText = MissiveAPI.formatConversationForAnalysis(messages);
      
      // Call comprehensive analysis that combines everything
      const goldStrike = await OpenAIAPI.comprehensiveProspectAnalysis(conversationText);
      setAnalysis(goldStrike);
    } catch (err) {
      console.error('❌ Gold prospecting error:', err);
      setError(err.message || 'Failed to prospect this lead');
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
    if (rating.includes('GOLD STRIKE')) return 'gold-strike';
    if (rating.includes('SILVER NUGGET')) return 'silver-nugget';
    if (rating.includes('COPPER FIND')) return 'copper-find';
    if (rating.includes('FOOL\'S GOLD')) return 'fools-gold';
    // Fallback for old format
    if (rating.includes('HIGH FIT')) return 'gold-strike';
    if (rating.includes('MEDIUM FIT')) return 'silver-nugget';
    if (rating.includes('LOW FIT')) return 'copper-find';
    if (rating.includes('POOR FIT')) return 'fools-gold';
    return 'unknown-fit';
  };

  // Extract key metrics from analysis for scorecard
  const extractScorecard = (analysisText) => {
    if (!analysisText) return null;

    const metrics = {};
    
    // Extract prospect rating (new gold mining format)
    const prospectRatingMatch = analysisText.match(/\*\*⭐\s*PROSPECT RATING:\s*([^*]+)\*\*/i);
    if (prospectRatingMatch) {
      metrics.rating = prospectRatingMatch[1].trim();
    } else {
      // Fallback to old format
      const ratingMatch = analysisText.match(/\*\*RATING:\s*([^*]+)\*\*/i);
      if (ratingMatch) {
        metrics.rating = ratingMatch[1].trim();
      }
    }

    // Extract sentiment from the new format
    const sentimentMatch = analysisText.match(/\*\*😊\s*SENTIMENT & RELATIONSHIP:\s*([^*]+)\*\*/i);
    if (sentimentMatch) {
      const sentimentText = sentimentMatch[1].trim();
      if (sentimentText.toLowerCase().includes('positive') || sentimentText.toLowerCase().includes('excited') || sentimentText.toLowerCase().includes('eager')) {
        metrics.sentiment = 'Positive';
      } else if (sentimentText.toLowerCase().includes('negative') || sentimentText.toLowerCase().includes('frustrated') || sentimentText.toLowerCase().includes('unhappy')) {
        metrics.sentiment = 'Negative';
      } else {
        metrics.sentiment = 'Neutral';
      }
    }

    // Extract opportunity assessment
    const opportunityMatch = analysisText.match(/\*\*💰\s*OPPORTUNITY ASSESSMENT:\s*([^*]+)\*\*/i);
    if (opportunityMatch) {
      const oppText = opportunityMatch[1].trim();
      metrics.opportunity = oppText.substring(0, 50) + (oppText.length > 50 ? '...' : '');
    }

    // Extract urgency signals
    const urgencyMatch = analysisText.match(/\*\*⚡\s*URGENCY SIGNALS:\s*([^*]+)\*\*/i);
    if (urgencyMatch) {
      const urgencyText = urgencyMatch[1].trim();
      if (urgencyText.toLowerCase().includes('immediate') || urgencyText.toLowerCase().includes('urgent') || urgencyText.toLowerCase().includes('asap')) {
        metrics.urgency = 'High';
      } else if (urgencyText.toLowerCase().includes('soon') || urgencyText.toLowerCase().includes('weeks') || urgencyText.toLowerCase().includes('month')) {
        metrics.urgency = 'Medium';
      } else {
        metrics.urgency = 'Low';
      }
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
        <h1>⛏️ Gold Prospector</h1>
        <p>Strike sales gold with AI-powered lead prospecting</p>
      </div>

      <div className="sidebar-content">
        {!conversationData ? (
          <div className="no-conversation">
            <p>👈 Select a lead to prospect for gold</p>
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
                <h4>🏆 Prospector's Scorecard</h4>
                <div className="scorecard-grid">
                  {scorecard.rating && (
                    <div className={`scorecard-item rating ${getRatingClass(scorecard.rating)}`}>
                      <div className="scorecard-label">Prospect Grade</div>
                      <div className="scorecard-value">{scorecard.rating}</div>
                    </div>
                  )}
                  {scorecard.sentiment && (
                    <div className="scorecard-item sentiment">
                      <div className="scorecard-label">Attitude</div>
                      <div className="scorecard-value">{scorecard.sentiment}</div>
                    </div>
                  )}
                  {scorecard.opportunity && (
                    <div className="scorecard-item opportunity">
                      <div className="scorecard-label">Gold Potential</div>
                      <div className="scorecard-value">{scorecard.opportunity}</div>
                    </div>
                  )}
                  {scorecard.urgency && (
                    <div className="scorecard-item urgency">
                      <div className="scorecard-label">Strike Timeline</div>
                      <div className="scorecard-value">{scorecard.urgency}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button 
                className="analyze-btn primary gold-strike-btn"
                onClick={strikeGold}
                disabled={loading}
              >
                {loading ? '⛏️ Prospecting Lead...' : '💰 Strike Gold!'}
              </button>
            </div>

            {error && (
              <div className="error-message">
                <p>❌ {error}</p>
              </div>
            )}

            {analysis && (
              <div className="analysis-results">
                <h4>⛏️ Prospector's Report</h4>
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