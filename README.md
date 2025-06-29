# 🚀 Missive Sales Assistant

AI-powered sales conversation analysis for Missive email teams. This sidebar integration uses OpenAI's GPT-4 to provide instant insights, sentiment analysis, and action items from your customer conversations.

## ✨ Features

- **🤖 Full AI Analysis**: Comprehensive sales insights including sentiment, opportunities, and next steps
- **😊 Quick Sentiment**: Fast sentiment analysis for customer conversations  
- **📋 Action Items**: Extract key action items and next steps from conversations
- **⚡ Real-time Integration**: Automatically updates when you select different conversations in Missive
- **🎨 Clean UI**: Professional sidebar design that integrates seamlessly with Missive

## 🚀 Quick Setup

### 1. Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/brennan7L/sales-integration)

Or manually:
1. Fork this repository
2. Connect your GitHub repository to Netlify
3. Deploy with default settings

### 2. Configure Environment Variables

In your Netlify dashboard:
1. Go to **Site settings** → **Environment variables**
2. Add a new variable:
   - **Key**: `openAIKey`
   - **Value**: Your OpenAI API key (starts with `sk-`)

### 3. Set Up in Missive

1. Open Missive
2. Go to **Settings** → **Integrations** → **Add Integration**
3. Choose **iFrame**
4. Enter your Netlify URL (e.g., `https://your-app.netlify.app`)
5. Set the integration to appear in the **sidebar**
6. Save the integration

## 💡 How to Use

1. **Select a Conversation**: Click on any email conversation in Missive
2. **Choose Analysis Type**:
   - **🤖 Full Analysis**: Complete sales insights with sentiment, opportunities, and next steps
   - **😊 Sentiment**: Quick sentiment analysis (positive/negative/neutral)
   - **📋 Actions**: Extract key action items and next steps
3. **Review Results**: View AI-generated insights in organized sections

## 🔧 Technical Details

### Built With
- **React 18** - Modern UI framework
- **Webpack 5** - Build system
- **Missive JavaScript API** - Email conversation access
- **OpenAI GPT-4** - AI analysis engine
- **Netlify** - Hosting and deployment

### API Integration
- Uses Missive's JavaScript API to access conversation data
- Calls OpenAI's Chat Completions API for analysis
- Environment variables for secure API key management

### Security
- API keys stored as environment variables
- HTTPS-only communication
- No conversation data stored permanently

## 🛠️ Development

### Local Development
```bash
# Clone the repository
git clone https://github.com/brennan7L/sales-integration.git
cd sales-integration

# Install dependencies
npm install

# Set up environment variables
echo "REACT_APP_OPENAI_KEY=your_openai_key_here" > .env.local

# Start development server
npm run dev
```

### Build for Production
```bash
npm run build
```

### Testing
```bash
npm test
```

## 📋 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `openAIKey` | Your OpenAI API key | Yes |

## 🔄 Deployment

The app automatically deploys to Netlify when you push to the main branch. Make sure to:

1. Set up the `openAIKey` environment variable in Netlify
2. Verify the build completes successfully
3. Test the integration in Missive

## 🎯 Customization

### Custom Prompts
You can modify the AI analysis prompts in `src/utils/openaiApi.js`:

```javascript
// Example: Add custom analysis type
static async customAnalysis(conversationText) {
  return this.analyzeSalesConversation(conversationText, {
    customPrompt: 'Your custom prompt here...'
  });
}
```

### Styling
Modify the appearance by editing `src/App.css`. The design uses:
- Clean, professional colors
- Responsive layout for different sidebar sizes
- Smooth loading animations
- Custom scrollbars

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary and all rights are reserved. See the repository settings for more details.

## 🆘 Support

### Common Issues

**"OpenAI API key not configured"**
- Verify the `openAIKey` environment variable is set in Netlify
- Check that the API key is valid and has sufficient credits

**"Missive API not available"**
- Ensure the integration is properly added to Missive
- Verify the integration URL is correct
- Check that you're accessing the app through Missive's sidebar

**"Failed to fetch conversation messages"**
- Make sure a conversation is selected in Missive
- Check that the conversation contains messages
- Verify your Missive permissions

### Getting Help

For issues and questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify your environment variables are set correctly
4. Contact support with detailed error information

## 🔮 Roadmap

- [ ] Integration with Zoho CRM
- [ ] Custom analysis templates
- [ ] Bulk conversation analysis
- [ ] Export analysis results
- [ ] Team analytics dashboard
- [ ] Advanced sentiment tracking

---

**Powered by OpenAI GPT-4** | **Built for Missive** | **Deployed on Netlify** 