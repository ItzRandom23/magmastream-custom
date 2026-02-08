<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=300&section=header&text=Magmastream&fontSize=90&fontAlignY=35&animation=twinkling&fontColor=gradient&desc=Next-Generation%20Lavalink%20Wrapper&descSize=25&descAlignY=60" />
</div>

---

## 🎵 Overview

**Magmastream** is a next-gen Lavalink wrapper built for performance, flexibility, and simplicity. Power your Discord music bots with ease.

---

## ✨ Features

- 🎯 Simple API  
- ⚡ High Performance  
- 🎚️ Audio Filters  
- 🔌 Plugin Support  
- 🎵 **NEW: Advanced Spotify Integration**
  - Spotify search with Lavalink fallback
  - Resolve Spotify playlists, albums, and tracks
  - Fetch artist top tracks
  - Get track recommendations

---

## 🎵 Spotify Integration

The new Spotify integration provides unified track resolution through Lavalink with multiple provider fallbacks:

### Quick Start

```javascript
const { Manager } = require("magmastream");

const manager = new Manager({
  nodes: [{ host: "localhost", port: 2333, password: "password" }],
  clientName: "MyBot"
});

// Search Spotify
const results = await manager.spotifySearch("Never Gonna Give You Up", user);

// Resolve Spotify URL
const tracks = await manager.spotifyResolve(
  "https://open.spotify.com/track/...",
  limit,
  user
);

// Get artist top tracks
const topTracks = await manager.artistTopTracks("artist_id", user);

// Get recommendations
const recommendations = await manager.recommendations(
  "https://open.spotify.com/track/...",
  limit,
  user
);
```

### Features

- 🔍 ISRC-based track matching for maximum accuracy
- 🔄 Automatic provider fallback (Deezer → Apple Music → JioSaavn → SoundCloud)
- 📋 Playlist and album support with configurable limits
- 🎸 Artist discovery with top tracks
- 🎲 Smart recommendations based on seed tracks
- 🛡️ Robust error handling with debug events

For detailed documentation, see [SPOTIFY_INTEGRATION.md](./SPOTIFY_INTEGRATION.md)

---

Forked with ❤️ by <a href="https://github.com/ItzRandom23">Itz Random</a> | Based on original work by the Magmastream Team

