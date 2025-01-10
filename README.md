A simple Telegram bot that allows you to send a supported link from yt-dlp, and it will respond with the video.

# Prerequisites

Make sure you have node 18+ and ffmpeg installed.

Set up [Telegram bot](https://core.telegram.org/bots/api) and get an access token.

# Usage

First, download the latest version of `yt-dlp`:

```bash
npm run download
```

Then make sure `yt-dlp` is executable:

```
chmod 700 yt-dlp
```

Finally, run the bot:

```
TELEGRAM_BOT_TOKEN=<token> npm start
```
