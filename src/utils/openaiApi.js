// OpenAI API Utilities
export class OpenAIAPI {
  static getApiKey() {
    const apiKey = process.env.REACT_APP_OPENAI_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please set openAIKey in Netlify environment variables.');
    }
    return apiKey;
  }

  static async analyzeSalesConversation(conversationText, options = {}) {
    const {
      model = 'gpt-4o-mini',
      maxTokens = 1000,
      temperature = 0.3,
      customPrompt = null
    } = options;

    const systemPrompt = customPrompt || this.getDefaultSalesPrompt();

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Analyze this email conversation:\n\n${conversationText}`
            }
          ],
          max_tokens: maxTokens,
          temperature
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No analysis available';
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to OpenAI API. Please check your internet connection.');
      }
      throw error;
    }
  }

  static getDefaultSalesPrompt() {
    return `You are an AI sales assistant analyzing customer email conversations. Your role is to provide actionable insights for sales teams.

Please analyze the conversation and provide insights in the following format:

**📊 CONVERSATION SUMMARY**
Brief overview of the conversation

**😊 CUSTOMER SENTIMENT**
Overall sentiment and emotional tone

**💡 KEY INSIGHTS**
Important points, pain points, and opportunities

**🎯 SALES OPPORTUNITIES**
Specific opportunities to move the deal forward

**📋 NEXT STEPS**
Recommended actions for the sales team

**⚠️ RISKS & CONCERNS**
Any red flags or potential issues

Keep your analysis concise, actionable, and focused on sales outcomes. Use bullet points where appropriate for easy scanning.`;
  }

  static getCustomPrompts() {
    return {
      customer_service: `You are analyzing customer service emails. Focus on customer satisfaction, issue resolution, and service improvement opportunities.`,
      
      lead_qualification: `You are analyzing lead qualification emails. Focus on budget, authority, need, timeline (BANT), and lead scoring.`,
      
      deal_progression: `You are analyzing deal progression emails. Focus on deal stage, next steps, decision makers, and closing opportunities.`,
      
      competitor_analysis: `You are analyzing emails mentioning competitors. Focus on competitive threats, differentiators, and positioning opportunities.`,
      
      relationship_building: `You are analyzing relationship-building emails. Focus on rapport, trust-building, and long-term relationship opportunities.`
    };
  }

  static async quickSentimentAnalysis(conversationText) {
    return this.analyzeSalesConversation(conversationText, {
      maxTokens: 200,
      customPrompt: 'Analyze the sentiment of this email conversation. Respond with just: POSITIVE, NEGATIVE, or NEUTRAL, followed by a brief 1-sentence explanation.'
    });
  }

  static async quickActionItems(conversationText) {
    return this.analyzeSalesConversation(conversationText, {
      maxTokens: 300,
      customPrompt: 'Extract the key action items and next steps from this email conversation. List them as bullet points.'
    });
  }
} 