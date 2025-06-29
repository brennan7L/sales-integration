# Sales Integration

A customer service tool that integrates email data with sales insights to help support reps provide better, more contextual customer assistance using Zoho CRM and Missive.

## Features

- **Customer Intelligence**: Display customer profile, purchase history, and account status from Zoho
- **Sales Context**: Show recent deals, subscription info, and customer value metrics
- **Smart Insights**: Identify upsell opportunities and churn risks
- **Performance Tracking**: Monitor customer satisfaction and rep effectiveness
- **Missive Integration**: Seamless integration with Missive email platform

## Project Structure

```
sales-integration/
├── README.md           # Project documentation
├── package.json        # Dependencies and scripts
├── config/            # Configuration files
├── src/               # Source code
│   ├── components/    # UI components
│   ├── services/      # API integrations (Zoho, Missive)
│   └── utils/         # Utility functions
└── docs/              # Additional documentation
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy configuration template:
   ```bash
   cp config/config.example.js config/config.js
   ```

3. Configure your API keys and settings in `config/config.js`:
   - Zoho CRM API credentials
   - Missive API token
   - Other service API keys

4. Start the development server:
   ```bash
   npm run dev
   ```

## Configuration

The application requires API credentials for:
- **Zoho CRM** - Customer data, deals, contacts
- **Missive** - Email platform integration
- **OpenAI** - AI-powered insights (optional)
- **Analytics services** - Performance tracking

## Development

- Run tests: `npm test`
- Build for production: `npm run build`
- Deploy: `npm run deploy`

## License

MIT License 