# Slack Bot

A Slack bot built with the Bolt framework.

## Setup

1. Create a new Slack App at https://api.slack.com/apps
2. Under "OAuth & Permissions", add the following bot token scopes:
   - `chat:write`
   - `app_mentions:read`
   - `channels:history`
   - `groups:history`
   - `im:history`
   - `mpim:history`

3. Install the app to your workspace
4. Copy the following tokens from your Slack App settings:
   - Bot User OAuth Token (starts with `xoxb-`) → `SLACK_BOT_TOKEN`
   - Signing Secret → `SLACK_SIGNING_SECRET`
   - App-Level Token (starts with `xapp-`) → `SLACK_APP_TOKEN`

5. Create a `.env` file and add your tokens:
   ```
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_APP_TOKEN=xapp-your-app-token
   ```

## Installation

```bash
npm install
```

## Running the Bot

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Features

- Responds to "hello" messages with a friendly greeting
- More features coming soon! 