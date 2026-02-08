# Spotify Integration Documentation

This document describes the Spotify integration features added to the Magmastream Lavalink wrapper.

## Features

The Spotify integration provides the following endpoints and methods:

1. **Spotify Search** - Search for tracks using Spotify API with Lavalink fallback
2. **Spotify Resolver** - Resolve Spotify URLs (playlist, album, track)
3. **Artist Top Tracks** - Fetch an artist's top tracks
4. **Track Recommendations** - Get recommended tracks based on a seed track

## API Endpoints

All Spotify API calls are made to: `http://eu.leonodes.xyz:2450/api`

### Search Endpoint
- **URL**: `/api/search?q=QUERY`
- **Method**: GET
- **Response**:
```json
{
  "total": 5,
  "items": [
    {
      "id": "...",
      "title": "...",
      "artists": ["..."],
      "duration": 144480,
      "isrc": "..."
    }
  ]
}
```

### Resolve Endpoint
- **URL**: `/api/resolve?url=SPOTIFY_URL` or `/api/resolve?url=SPOTIFY_URL&limit=50`
- **Method**: GET
- **Parameters**:
  - `url` (required): Spotify URL (track, album, or playlist)
  - `limit` (optional): Maximum number of tracks to return

### Artist Top Tracks Endpoint
- **URL**: `/api/artist-top-tracks?id=ARTIST_ID`
- **Method**: GET
- **Parameters**:
  - `id` (required): Spotify artist ID

### Recommendations Endpoint
- **URL**: `/api/recommendations?url=SPOTIFY_TRACK_URL` or `/api/recommendations?url=SPOTIFY_TRACK_URL&limit=10`
- **Method**: GET
- **Parameters**:
  - `url` (required): Spotify track URL
  - `limit` (optional): Maximum number of recommendations to return

## Usage Examples

### Spotify Search
```javascript
const { Manager } = require("magmastream");

const manager = new Manager({
  nodes: [
    {
      host: "your-lavalink-host",
      port: 2333,
      password: "your-password"
    }
  ],
  clientName: "Your Client",
  defaultSearchPlatform: "dzsearch"
});

// Initialize manager with Discord bot
await manager.init("YOUR_CLIENT_ID", 0);

// Search Spotify for a track
const result = await manager.spotifySearch("Never Gonna Give You Up", requester);
// result contains tracks array with Lavalink-resolved tracks
```

### Spotify Resolver - Single Track
```javascript
// Resolve a Spotify track URL
const result = await manager.spotifyResolve(
  "https://open.spotify.com/track/dQw4w9WgXcQ",
  null,  // No limit for single track
  requester
);
```

### Spotify Resolver - Playlist
```javascript
// Resolve a Spotify playlist with limit
const result = await manager.spotifyResolve(
  "https://open.spotify.com/playlist/37i9dQZF1DX0XUfTFLu1zZ",
  50,  // Limit to 50 tracks
  requester
);
// result.loadType will be "PLAYLIST"
// result.playlist will contain playlist info and tracks
```

### Artist Top Tracks
```javascript
// Fetch an artist's top tracks
const result = await manager.artistTopTracks(
  "36QJpDe2go2KgaRleHCDkS",  // Ariana Grande's Spotify ID
  requester
);
```

### Track Recommendations
```javascript
// Get recommendations based on a track
const result = await manager.recommendations(
  "https://open.spotify.com/track/dQw4w9WgXcQ",
  10,  // Get 10 recommendations
  requester
);
```

## Resolution Logic

All methods use the following fallback search logic to resolve tracks in Lavalink:

1. **ISRC Search** (if available): `dzisrc:${isrc}`
   - Most accurate method, prioritizes exact track match
   
2. **Deezer Search**: `dzsearch:${title} ${artists}`
   - Primary provider fallback
   
3. **Apple Music Search**: `amsearch:${title} ${artists}`
   - Secondary provider fallback
   
4. **JioSaavn Search**: `jssearch:${title} ${artists}`
   - Tertiary provider fallback
   
5. **SoundCloud Search**: `scsearch:${title} ${artists}`
   - Final provider fallback

The search stops once a valid track is found in any provider. If a provider fails, the next fallback is attempted.

## Response Format

All methods return a standard response object:

```javascript
{
  loadType: "SEARCH" | "TRACK" | "PLAYLIST" | "EMPTY",
  tracks: [
    {
      track: "encoded_track_data",
      title: "Track Title",
      identifier: "track_id",
      author: "Artist Name",
      duration: 180000,  // milliseconds
      isrc: "ISRC_CODE",
      isSeekable: true,
      isStream: false,
      uri: "http://...",
      artworkUrl: "http://...",
      sourceName: "Deezer",
      thumbnail: "http://...",
      requester: requesterObject,
      pluginInfo: null,
      customData: {}
    }
  ],
  playlist: null  // or playlist object for PLAYLIST loadType
}
```

## Error Handling

All methods include error handling and will emit debug events if errors occur:

```javascript
manager.on("debug", (message) => {
  console.log(message);  // Will contain [SPOTIFY] error messages
});
```

If a search fails at any point, the method will:
1. Log the error via debug event
2. Return an empty result
3. Continue with other fallback providers if applicable

## Integration with Existing Search

The Spotify methods are separate from the existing `manager.search()` method and provide specialized handling for Spotify sources. You can use them for:

- Precise Spotify playlist/album loading
- Artist discovery
- Recommendation-based queue building
- ISRC-based track matching for maximum accuracy

## Performance Considerations

- ISRC searches are the fastest and most accurate
- Fallback searches may take longer as multiple providers are tried
- Consider implementing results caching for frequently requested items
- The API calls are non-blocking and use async/await

## Dependencies

The Spotify integration relies on:
- `axios` - For HTTP requests to Spotify API
- Existing `TrackUtils` from Magmastream
- Lavalink node for final track resolution
