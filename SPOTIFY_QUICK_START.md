# Spotify Integration - Quick Start Guide

## What's New

Your Magmastream Lavalink wrapper now supports complete Spotify integration with:

✅ **Spotify Search** - Search tracks with ISRC accuracy and provider fallback
✅ **Spotify Resolve** - Load individual tracks, albums, and playlists
✅ **Artist Discovery** - Fetch top tracks from any artist
✅ **Recommendations** - Get similar tracks based on a seed track

## Installation

No additional installation needed! All Spotify features are built into the updated wrapper.

## Quick Example

```javascript
const { Manager } = require("magmastream");

const manager = new Manager({
  nodes: [{
    host: "localhost",
    port: 2333,
    password: "youshallnotpass"
  }]
});

await manager.init("YOUR_BOT_ID");

// Search Spotify
const results = await manager.spotifySearch(
  "Never Gonna Give You Up",
  requirerUser
);

// Resolve a playlist
const playlist = await manager.spotifyResolve(
  "https://open.spotify.com/playlist/...",
  50, // limit to 50 tracks
  requesterUser
);
```

## Available Methods

### 1. spotifySearch(query, requester)
Searches Spotify for tracks and resolves them through Lavalink

**Parameters:**
- `query` (string): Search query
- `requester` (object): User object requesting the search

**Returns:** Search result object with tracks array

**Example:**
```javascript
const result = await manager.spotifySearch("Blinding Lights", user);
// result.tracks contains array of resolved tracks
```

### 2. spotifyResolve(url, limit, requester)
Resolves a Spotify URL (track, album, or playlist)

**Parameters:**
- `url` (string): Spotify URL
- `limit` (number | null): Max tracks to load (optional)
- `requester` (object): User object

**Returns:** Resolved tracks with playlist info if applicable

**Example:**
```javascript
// Resolve single track
const result = await manager.spotifyResolve(
  "https://open.spotify.com/track/dQw4w9WgXcQ",
  null,
  user
);

// Resolve playlist with limit
const result = await manager.spotifyResolve(
  "https://open.spotify.com/playlist/...",
  50,
  user
);
```

### 3. artistTopTracks(artistId, requester)
Fetches an artist's top tracks

**Parameters:**
- `artistId` (string): Spotify artist ID
- `requester` (object): User object

**Returns:** Top tracks array

**Example:**
```javascript
const result = await manager.artistTopTracks(
  "36QJpDe2go2KgaRleHCDkS", // Ariana Grande
  user
);
```

### 4. recommendations(url, limit, requester)
Gets recommended tracks based on a seed track

**Parameters:**
- `url` (string): Spotify track URL
- `limit` (number): Number of recommendations
- `requester` (object): User object

**Returns:** Recommended tracks array

**Example:**
```javascript
const result = await manager.recommendations(
  "https://open.spotify.com/track/dQw4w9WgXcQ",
  10,
  user
);
```

## How It Works

### Search Logic
1. Search Spotify API for matching tracks
2. For each result, attempt to resolve through Lavalink:
   - Try ISRC search first (most accurate)
   - Fall back to: Deezer → Apple Music → JioSaavn → SoundCloud
   - Use first successful match
3. Return resolved tracks array

### Resolution Process
1. Send Spotify URL to Spotify API
2. Get track metadata (title, artists, ISRC, etc.)
3. Resolve each track through Lavalink with fallback logic
4. Return complete track data with Lavalink encoding

## Response Format

All methods return this structure:

```javascript
{
  loadType: "SEARCH" | "TRACK" | "PLAYLIST" | "EMPTY",
  tracks: [
    {
      track: "...", // Lavalink encoded data
      title: "Track Name",
      author: "Artist Name",
      duration: 180000, // milliseconds
      uri: "https://...",
      isrc: "ISRC code",
      sourceName: "Deezer", // provider name
      requester: userobject,
      // ... more properties
    }
  ],
  playlist: {
    name: "Playlist Name",
    tracks: [...],
    duration: 3600000, // total duration
    requester: userobject
  } // only for PLAYLIST loadType
}
```

## Integration with Your Bot

See `SPOTIFY_EXAMPLE.js` for a complete Discord bot example using all features.

Key integration points:

```javascript
// 1. Create/get player
let player = manager.get(guildId);
if (!player) {
  player = manager.create({
    guildId: guildId,
    voiceChannelId: voiceChannelId,
    textChannelId: textChannelId
  });
}

// 2. Get Spotify tracks
const result = await manager.spotifySearch(query, requester);

// 3. Add to queue
result.tracks.forEach(track => player.queue.add(track));

// 4. Play
if (!player.playing) player.play();
```

## Error Handling

All methods include built-in error handling:

```javascript
// Subscribe to debug events for error logging
manager.on("debug", (message) => {
  if (message.includes("[SPOTIFY]")) {
    console.log(message); // Log Spotify-related events
  }
});

// Methods return empty results on error, never throw
const result = await manager.spotifySearch("query", user);
if (result.loadType === "EMPTY") {
  console.log("Search failed or found nothing");
}
```

## Documentation Files

- `SPOTIFY_INTEGRATION.md` - Complete API documentation
- `SPOTIFY_EXAMPLE.js` - Full Discord bot example
- `SPOTIFY_VALIDATION.js` - Testing and validation suite
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details

## Common Use Cases

### Building a Playlist from Spotify
```javascript
const playlistUrl = "https://open.spotify.com/playlist/...";
const result = await manager.spotifyResolve(playlistUrl, 100, user);
const player = manager.create({...});
result.tracks.forEach(track => player.queue.add(track));
player.play();
```

### Creating a Discovery Queue with Recommendations
```javascript
const seedTrack = "https://open.spotify.com/track/...";
const recommendations = await manager.recommendations(seedTrack, 20, user);
player.queue.clear();
recommendations.tracks.forEach(track => player.queue.add(track));
```

### Building Artist Radio
```javascript
const artistId = "36QJpDe2go2KgaRleHCDkS";
const topTracks = await manager.artistTopTracks(artistId, user);
topTracks.tracks.forEach(track => player.queue.add(track));
```

## Troubleshooting

### No tracks found
- Check Spotify URL format
- Verify Lavalink nodes are connected (`manager.nodes` collection)
- Check debug events for API errors
- Verify with `SPOTIFY_VALIDATION.js`

### Wrong tracks resolved
- ISRC matching failed (normal, falls back to search)
- Providers not returning correct matches
- Try adjusting search query

### Debug events not showing
```javascript
manager.on("debug", (message) => {
  console.log(message); // All events
});
```

## Performance Tips

- Cache results for frequently requested items
- Limit playlist loads (use the `limit` parameter)
- Batch recommendations instead of per-user
- Monitor debug events for slow queries

## API Endpoint

All Spotify requests use: `http://eu.leonodes.xyz:2450/api`

Endpoints used:
- `/search?q=QUERY` - Search endpoint
- `/resolve?url=URL&limit=LIMIT` - Resolution endpoint
- `/artist-top-tracks?id=ID` - Artist tracks
- `/recommendations?url=URL&limit=LIMIT` - Recommendations

## Support

For issues or questions:
1. Check `SPOTIFY_INTEGRATION.md` for detailed documentation
2. Run `SPOTIFY_VALIDATION.js` to test functionality
3. Review `SPOTIFY_EXAMPLE.js` for implementation patterns
4. Enable debug events for detailed logging

## Next Steps

1. Update your bot's code to use the new Spotify methods
2. Test with `SPOTIFY_VALIDATION.js`
3. Implement Spotify commands in your Discord bot
4. Monitor `debug` events for any issues
