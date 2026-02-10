# Food App

[![E2E Tests](https://github.com/anicolao/food/actions/workflows/e2e.yml/badge.svg)](https://github.com/anicolao/food/actions/workflows/e2e.yml)

A food logging application that uses AI to estimate nutrition facts from photos. Built with SvelteKit and powered by Google's Gemini AI.

## Features

- 📸 **Photo-based Logging**: Capture or select food photos to log meals
- 🤖 **AI Nutrition Estimation**: Automatic nutrition facts estimation using Gemini Flash
- 📊 **Google Sheets Backend**: Your data stored in your own Google Sheets (event sourcing pattern)
- 🔒 **Privacy First**: All data stays in your Google account. [Read our Privacy Policy](PRIVACY.md) or [view it online](https://anicolao.github.io/food/privacy).
- 📱 **Mobile Friendly**: Progressive web app with native iOS wrapper

## Technology Stack

- **Frontend**: SvelteKit (Svelte 5)
- **State Management**: Redux (Event Sourcing Pattern)
- **AI**: Google Gemini Flash API
- **Storage**: Google Drive & Google Sheets
- **Testing**: Playwright (E2E tests)
- **Package Manager**: npm/bun
- **Environment**: Nix

## Getting Started

### Prerequisites

- Node.js 20+
- Google API credentials (for Gemini AI, Drive, and Sheets access)

### Installation

1. Clone the repository:
```sh
git clone https://github.com/anicolao/food.git
cd food
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
```sh
cp .env.example .env
# Edit .env with your Google API credentials
```

4. Start the development server:
```sh
npm run dev

# or start and open in browser
npm run dev -- --open
```

The app will be available at http://localhost:5174

## Building for Production

To create a production build:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## Deployment

The app is automatically deployed to GitHub Pages:

- **Production**: Push to `main` branch deploys to https://anicolao.github.io/food/
- **PR Previews**: Each pull request automatically deploys to https://anicolao.github.io/food/pr{number}/

PR preview URLs are posted as comments on the pull request for easy access.

### OAuth Configuration

OAuth credentials are required for the deployed application to work. See [OAUTH_SETUP.md](OAUTH_SETUP.md) for detailed instructions on:
- Setting up Google Cloud Console credentials
- Configuring GitHub Secrets
- Managing OAuth Client IDs and API keys

## Architecture

This app follows an Event Sourcing pattern using Redux. The Google Sheets backend contains:
- **Events sheet**: Append-only log of all actions (source of truth)
- **Log sheet**: Projection of confirmed meal entries
- **Products sheet**: Reusable database for common items
- **DailyStats sheet**: Aggregated daily nutrition totals

See [MVP_DESIGN.md](MVP_DESIGN.md) for detailed architecture documentation.

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for development standards and guidelines.

## Testing

Run E2E tests:
```sh
npx playwright test
```

View test report:
```sh
npx playwright show-report
```

## License

See [LICENSE](LICENSE) file for details.
