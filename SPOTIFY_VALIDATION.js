// Validation and Testing Guide for Spotify Integration

/**
 * This file demonstrates how to test and validate the Spotify integration.
 * Run this after initialization to ensure all endpoints are working correctly.
 */

const { Manager, SpotifyUtils } = require("./dist/index.js");

/**
 * Test Configuration
 */
const TEST_CONFIG = {
  LAVALINK_HOST: "localhost",
  LAVALINK_PORT: 2333,
  LAVALINK_PASSWORD: "youshallnotpass",
  DISCORD_CLIENT_ID: "YOUR_CLIENT_ID", // Replace with your bot ID
  TEST_SPOTIFY_URL_TRACK: "https://open.spotify.com/track/11dFghVXANMlKmJXsNCQvb",
  TEST_SPOTIFY_URL_ARTIST: "36QJpDe2go2KgaRleHCDkS", // Ariana Grande
  TEST_SEARCH_QUERY: "Never Gonna Give You Up Rick Astley",
  TEST_PLAYLIST_URL: "https://open.spotify.com/playlist/37i9dQZF1DX0XUfTFLu1zZ"
};

/**
 * Initialize Manager
 */
async function initializeManager() {
  const manager = new Manager({
    nodes: [
      {
        host: TEST_CONFIG.LAVALINK_HOST,
        port: TEST_CONFIG.LAVALINK_PORT,
        password: TEST_CONFIG.LAVALINK_PASSWORD,
        identifier: "default",
      },
    ],
    clientName: "SpotifyTestBot",
  });

  // Setup event listeners for debugging
  manager.on("nodeCreate", (node) => {
    console.log(`✓ Node created: ${node.options.identifier}`);
  });

  manager.on("nodeConnect", (node) => {
    console.log(`✓ Node connected: ${node.options.identifier}`);
  });

  manager.on("debug", (message) => {
    console.log(`[DEBUG] ${message}`);
  });

  // Initialize
  await manager.init(TEST_CONFIG.DISCORD_CLIENT_ID);
  return manager;
}

/**
 * Test 1: Spotify Search
 */
async function testSpotifySearch(manager) {
  console.log("\n📝 Testing Spotify Search...");
  console.log(`Query: "${TEST_CONFIG.TEST_SEARCH_QUERY}"`);

  try {
    const result = await manager.spotifySearch(
      TEST_CONFIG.TEST_SEARCH_QUERY,
      { id: "test-user", username: "TestBot" }
    );

    console.log(`✓ Result Type: ${result.loadType}`);
    console.log(`✓ Tracks Found: ${result.tracks.length}`);

    if (result.tracks.length > 0) {
      console.log("📋 First 3 Results:");
      result.tracks.slice(0, 3).forEach((track, index) => {
        console.log(
          `  ${index + 1}. ${track.title} - ${track.author} (${track.duration}ms)`
        );
      });
    }

    return result.tracks.length > 0;
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Spotify Resolve (Track)
 */
async function testSpotifyResolveTrack(manager) {
  console.log("\n📝 Testing Spotify Track Resolution...");
  console.log(`URL: ${TEST_CONFIG.TEST_SPOTIFY_URL_TRACK}`);

  try {
    const result = await manager.spotifyResolve(
      TEST_CONFIG.TEST_SPOTIFY_URL_TRACK,
      null,
      { id: "test-user", username: "TestBot" }
    );

    console.log(`✓ Result Type: ${result.loadType}`);
    console.log(`✓ Tracks Found: ${result.tracks.length}`);

    if (result.tracks.length > 0) {
      const track = result.tracks[0];
      console.log(
        `✓ Resolved: ${track.title} - ${track.author} (${track.sourceName})`
      );
    }

    return result.tracks.length > 0;
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Spotify Resolve (Playlist)
 */
async function testSpotifyResolvePlaylist(manager) {
  console.log("\n📝 Testing Spotify Playlist Resolution...");
  console.log(`URL: ${TEST_CONFIG.TEST_PLAYLIST_URL} with limit 10`);

  try {
    const result = await manager.spotifyResolve(
      TEST_CONFIG.TEST_PLAYLIST_URL,
      10,
      { id: "test-user", username: "TestBot" }
    );

    console.log(`✓ Result Type: ${result.loadType}`);
    console.log(`✓ Tracks Found: ${result.tracks.length}`);

    if (result.playlist) {
      console.log(`✓ Playlist: ${result.playlist.name}`);
      console.log(`✓ Total Duration: ${Math.floor(result.playlist.duration / 60000)} minutes`);
    }

    if (result.tracks.length > 0) {
      console.log("📋 First 3 Tracks:");
      result.tracks.slice(0, 3).forEach((track, index) => {
        console.log(`  ${index + 1}. ${track.title} - ${track.author}`);
      });
    }

    return result.tracks.length > 0;
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Artist Top Tracks
 */
async function testArtistTopTracks(manager) {
  console.log("\n📝 Testing Artist Top Tracks...");
  console.log(`Artist ID: ${TEST_CONFIG.TEST_SPOTIFY_URL_ARTIST}`);

  try {
    const result = await manager.artistTopTracks(
      TEST_CONFIG.TEST_SPOTIFY_URL_ARTIST,
      { id: "test-user", username: "TestBot" }
    );

    console.log(`✓ Result Type: ${result.loadType}`);
    console.log(`✓ Tracks Found: ${result.tracks.length}`);

    if (result.tracks.length > 0) {
      console.log("📋 Top Tracks:");
      result.tracks.slice(0, 5).forEach((track, index) => {
        console.log(`  ${index + 1}. ${track.title}`);
      });
    }

    return result.tracks.length > 0;
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Track Recommendations
 */
async function testRecommendations(manager) {
  console.log("\n📝 Testing Track Recommendations...");
  console.log(`Track URL: ${TEST_CONFIG.TEST_SPOTIFY_URL_TRACK} with limit 10`);

  try {
    const result = await manager.recommendations(
      TEST_CONFIG.TEST_SPOTIFY_URL_TRACK,
      10,
      { id: "test-user", username: "TestBot" }
    );

    console.log(`✓ Result Type: ${result.loadType}`);
    console.log(`✓ Recommendations Found: ${result.tracks.length}`);

    if (result.tracks.length > 0) {
      console.log("📋 Recommended Tracks:");
      result.tracks.slice(0, 5).forEach((track, index) => {
        console.log(`  ${index + 1}. ${track.title} - ${track.author}`);
      });
    }

    return result.tracks.length > 0;
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }
}

/**
 * Main Test Suite
 */
async function runTests() {
  console.log("🎵 Spotify Integration Test Suite");
  console.log("==================================\n");

  try {
    // Initialize Manager
    console.log("Initializing Manager...");
    const manager = await initializeManager();
    
    // Wait a moment for nodes to connect
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Run tests
    const results = [];

    results.push(await testSpotifySearch(manager));
    results.push(await testSpotifyResolveTrack(manager));
    results.push(await testSpotifyResolvePlaylist(manager));
    results.push(await testArtistTopTracks(manager));
    results.push(await testRecommendations(manager));

    // Summary
    console.log("\n==================================");
    console.log("📊 Test Summary:");
    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`Passed: ${passed}/${total}`);
    console.log(`Status: ${passed === total ? "✓ All tests passed!" : "✗ Some tests failed"}`);

  } catch (error) {
    console.error("Fatal error during tests:", error);
  }
}

/**
 * Export for use in other files
 */
module.exports = {
  runTests,
  TEST_CONFIG,
  testSpotifySearch,
  testSpotifyResolveTrack,
  testSpotifyResolvePlaylist,
  testArtistTopTracks,
  testRecommendations,
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}
