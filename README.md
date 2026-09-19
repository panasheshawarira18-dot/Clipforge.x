# ClipForge

A simple YouTube/local-video clip maker using a Node.js backend and FFmpeg.

## What it does
- YouTube URL input (via `yt-dlp`)
- Local video upload
- Fixed-length sequential clips
- 15–90+ second clip options
- 9:16 vertical output
- MP4 downloads

## Requirements
- Node.js 18+
- FFmpeg installed and available as `ffmpeg`
- yt-dlp installed and available as `yt-dlp`

## Run locally

```bash
npm install
node server.js
```

Open `http://localhost:3000`.

## Deploying
GitHub Pages can host the frontend but cannot run this backend. Deploy the whole project to a Node-capable host such as Render, Railway, Fly.io, or your own VPS. The host must also have FFmpeg and yt-dlp installed.

## Important
Only download, edit, and redistribute videos when you have the necessary rights or permission. YouTube's terms and copyright rules may restrict downloading or reuse of some videos.
