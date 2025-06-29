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

  static async qualifyFreightForwardingLead(conversationText) {
    return this.analyzeSalesConversation(conversationText, {
      maxTokens: 1200,
      temperature: 0.2,
      customPrompt: this.getFreightForwardingQualificationPrompt()
    });
  }

  static getFreightForwardingQualificationPrompt() {
    return `You are a lead qualification specialist for a freight forwarding software platform. Analyze the customer inquiry and provide a qualification assessment.

IDEAL CUSTOMER PROFILE:
- North American freight forwarder (U.S., Canada, or Mexico)
- Handles at least a few hundred shipments per month (100+ shipments/month is promising)
- Primary modes: Air freight, LTL, cartage, linehaul, or small parcel
- U.S. companies must be IAC-certified
- Canada/Mexico companies need IATA accreditation or equivalent certification
- Often SMBs or new IACs looking for their first operational platform
- Value fast quoting, operational efficiency, and excellent support
- Entry typically through operations or sales users

NOT A FIT:
- Direct shippers (not freight forwarders)
- Ocean-only forwarders
- Companies lacking proper certifications for air forwarding

SPECIAL EMPHASIS:
- Referrals from partners (Rippy, CaptainCargo, WorldTrak, other freight forwarders) - give extra weight
- Former users of our platform - very important to highlight
- Companies mentioning they need a "first operational platform" or are new to the business

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

**RATING: [HIGH FIT / MEDIUM FIT / LOW FIT / POOR FIT]**

**SUMMARY:**
[Provide 2-3 paragraph analysis covering:]
- Company background and what they do
- Key fit indicators (shipment volume, modes, certifications, location)
- Any special considerations (referrals, former users, partner mentions)
- Recommended next steps

RATING GUIDELINES:
- HIGH FIT: Strong match on most criteria, especially volume + certification + modes
- MEDIUM FIT: Some good indicators but missing key info or minor concerns - suggest digging deeper
- LOW FIT: Few positive indicators but could have potential - recommend investigation
- POOR FIT: Clear mismatch (direct shipper, ocean-only, no certifications, outside region)

Unless it's obviously a terrible fit, lean toward suggesting we dig deeper as there could be hidden potential.`;
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
      freight_forwarding: this.getFreightForwardingQualificationPrompt(),
      
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

  static async comprehensiveProspectAnalysis(conversationText) {
    return this.analyzeSalesConversation(conversationText, {
      maxTokens: 1500,
      temperature: 0.2,
      customPrompt: this.getGoldProspectorPrompt()
    });
  }

  static getGoldProspectorPrompt() {
    return `🏜️ You are a seasoned sales prospector with a gold miner's eye for valuable leads. Analyze this customer inquiry like you're panning for sales gold - but be RUTHLESS about spotting fool's gold!

IDEAL CUSTOMER PROFILE (Your "Gold Mine"):
- North American freight forwarder (U.S., Canada, or Mexico)
- Handles at least 100+ shipments per month (volume = value!)
- Primary modes: Air freight, LTL, cartage, linehaul, or small parcel
- U.S. companies must be IAC-certified, Canada/Mexico need IATA accreditation
- Often SMBs or new IACs looking for their first operational platform
- Value fast quoting, operational efficiency, and excellent support

🌟 TREASURE SIGNALS (Extra valuable leads):
- Referrals from partners (Rippy, CaptainCargo, WorldTrak, other freight forwarders)
- Former users of our platform returning
- Companies mentioning they need a "first operational platform"
- New to the business and growing fast
- Professional business email addresses (@company.com)
- Specific freight forwarding terminology and knowledge

🚨 FOOL'S GOLD RED FLAGS (Be very suspicious):
- Gmail, Yahoo, Hotmail, or other free email addresses (major red flag!)
- Truckers, trucking companies, or owner-operators (wrong business model!)
- Direct shippers looking to move their own goods
- Ocean-only forwarders
- Companies lacking proper certifications
- Outside North America
- Vague inquiries without freight forwarding specifics
- Individual consumers or small businesses shipping personal items
- Companies that sound like logistics/warehousing only (not freight forwarding)

⚠️ CRITICAL ANALYSIS FRAMEWORK:
1. EMAIL DOMAIN: Professional business domain = good sign. Free email = big red flag.
2. BUSINESS TYPE: True freight forwarder = gold. Trucker/shipper = fool's gold.
3. KNOWLEDGE LEVEL: Uses FF terminology = promising. Vague/basic = suspicious.
4. VOLUME INDICATORS: Mentions shipment volumes = good. No volume info = concerning.
5. CERTIFICATION STATUS: Has or seeking IAC/IATA = positive. No mention = red flag.

FORMAT YOUR COMPREHENSIVE ANALYSIS EXACTLY LIKE THIS:

## 🏆 PROSPECTOR SCORECARD

**⭐ PROSPECT RATING: [GOLD STRIKE! / SILVER NUGGET / COPPER FIND / FOOL'S GOLD]**

**💰 OPPORTUNITY SCORE: [HIGH / MEDIUM / LOW]**

**😊 SENTIMENT: [POSITIVE / NEUTRAL / NEGATIVE]** 

**⚡ URGENCY: [IMMEDIATE / SOON / LONG-TERM / UNKNOWN]**

## ⛏️ PROSPECTOR REPORT

**🔍 PROSPECT PROFILE:**
[2-3 sentences about who they are and what they do. BE SPECIFIC about business type.]

**🚨 RED FLAG ANALYSIS:**
[CRITICAL: Analyze email domain, business type, and other warning signs. Don't be afraid to call out red flags!]

**💎 OPPORTUNITY ASSESSMENT:**
[Analyze the sales potential - volume, growth signs, budget indicators. Be realistic.]

**🤝 SENTIMENT & RELATIONSHIP:**
[How they feel about their current situation and their attitude toward change]

**⏰ URGENCY SIGNALS:**
[Timeline pressures, pain points driving immediate need]

**🎯 GOLD NUGGETS (Key Selling Points):**
- [Bullet point 1: Specific value proposition for this prospect]
- [Bullet point 2: Another compelling reason they should buy]
- [Bullet point 3: Third key benefit]

**📞 PROSPECTOR'S NEXT MOVES:**
- [Immediate action item 1]
- [Follow-up strategy 2]
- [Long-term cultivation plan 3]

**🚨 POTENTIAL HAZARDS:**
[Any red flags, competitor threats, or deal risks to watch out for]

## 🏢 COMPANY INTELLIGENCE

**📋 COMPANY OVERVIEW:**
[Based on available information, provide comprehensive company analysis including business model, size indicators, market position]

**🎯 BUSINESS FOCUS:**
[Primary services, target markets, specializations, geographic coverage]

**📈 GROWTH INDICATORS:**
[Signs of growth, expansion, hiring, new locations, technology adoption]

**🔍 COMPETITIVE LANDSCAPE:**
[Current solutions they might be using, competitors they've mentioned, market position]

**💡 STRATEGIC INSIGHTS:**
[Key business challenges they face, market trends affecting them, opportunities for our solution]

**🎪 DECISION-MAKING PROFILE:**
[Who makes decisions, buying process indicators, budget authority signs]

**⚠️ FINAL VERDICT:**
[One sentence summary: Is this worth pursuing or likely fool's gold?]

RATING GUIDE (BE STRICT):
- GOLD STRIKE!: Perfect fit, strong buying signals, high value, immediate opportunity, professional email domain, clear freight forwarder
- SILVER NUGGET: Good potential, multiple positive indicators, worth significant investment, minor concerns but overall promising
- COPPER FIND: Some promise but notable red flags, needs careful investigation, moderate risk
- FOOL'S GOLD: Poor fit, major red flags (free email, trucker, wrong business type), minimal investment warranted

BE BRUTALLY HONEST! Better to miss a mediocre lead than waste time on fool's gold. If you see red flags like gmail addresses or trucking companies, don't sugarcoat it - call it FOOL'S GOLD! 🏆`;
  }
} 