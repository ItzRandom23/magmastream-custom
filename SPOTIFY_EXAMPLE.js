// Example: Complete Discord Bot Integration with Spotify Support

const { Client, GatewayIntentBits } = require("discord.js");
const { Manager } = require("magmastream");

// Initialize Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Initialize Magmastream Manager
const manager = new Manager({
  nodes: [
    {
      host: "localhost",
      port: 2333,
      password: "youshallnotpass",
      identifier: "default",
      retryAmount: 5,
      retryDelay: 30000,
      useSSL: false,
    },
  ],
  clientName: "Magmastream",
  defaultSearchPlatform: "dzsearch",
  enabledPlugins: ["DeezerPlugin", "AppleMusicPlugin"],
});

// Handle manager events
manager.on("nodeCreate", (node) => console.log("Node created:", node.options.identifier));
manager.on("nodeConnect", (node) => console.log("Node connected:", node.options.identifier));
manager.on("playerCreate", (player) => console.log("Player created:", player.guildId));
manager.on("trackStart", (player, track) => console.log("Now playing:", track.title));

// Initialize manager when bot is ready
client.once("ready", async () => {
  await manager.init(client.user.id);
  console.log("Magmastream Manager initialized!");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith("!")) return;

  const args = message.content.slice(1).split(/ +/);
  const command = args.shift().toLowerCase();

  // Spotify Search Command
  // Usage: !spSearch "Never Gonna Give You Up"
  if (command === "spsearch") {
    const query = args.join(" ");
    if (!query) return message.reply("Please provide a search query!");

    try {
      const result = await manager.spotifySearch(query, message.author);
      
      if (result.loadType === "EMPTY") {
        return message.reply("No tracks found!");
      }

      // Get the player or create one
      let player = manager.get(message.guildId);
      if (!player) {
        player = manager.create({
          guildId: message.guildId,
          voiceChannelId: message.member.voice.channelId,
          textChannelId: message.channelId,
        });
      }

      // Add tracks to queue
      result.tracks.forEach(track => player.queue.add(track));

      if (!player.playing) {
        player.play();
      }

      const trackList = result.tracks
        .slice(0, 5)
        .map((t, i) => `${i + 1}. ${t.title} - ${t.author}`)
        .join("\n");

      message.reply(`Added ${result.tracks.length} tracks:\n${trackList}`);
    } catch (error) {
      console.error("Spotify search error:", error);
      message.reply("Error searching Spotify!");
    }
  }

  // Spotify Resolve Command
  // Usage: !spresolve https://open.spotify.com/track/dQw4w9WgXcQ
  if (command === "spresolve") {
    const url = args[0];
    if (!url) return message.reply("Please provide a Spotify URL!");

    try {
      const result = await manager.spotifyResolve(url, null, message.author);

      if (result.loadType === "EMPTY") {
        return message.reply("Could not resolve Spotify URL!");
      }

      // Get the player or create one
      let player = manager.get(message.guildId);
      if (!player) {
        player = manager.create({
          guildId: message.guildId,
          voiceChannelId: message.member.voice.channelId,
          textChannelId: message.channelId,
        });
      }

      // Add tracks to queue
      result.tracks.forEach(track => player.queue.add(track));

      if (!player.playing) {
        player.play();
      }

      if (result.loadType === "PLAYLIST") {
        message.reply(`Added playlist: ${result.playlist.name} (${result.tracks.length} tracks)`);
      } else {
        message.reply(`Added track: ${result.tracks[0].title}`);
      }
    } catch (error) {
      console.error("Spotify resolve error:", error);
      message.reply("Error resolving Spotify URL!");
    }
  }

  // Spotify Playlist Command (with limit)
  // Usage: !spplaylist https://open.spotify.com/playlist/... 50
  if (command === "spplaylist") {
    const url = args[0];
    const limit = parseInt(args[1]) || 50;
    if (!url) return message.reply("Please provide a Spotify playlist URL!");

    try {
      const result = await manager.spotifyResolve(url, limit, message.author);

      if (result.loadType === "EMPTY") {
        return message.reply("Could not resolve playlist!");
      }

      // Get the player or create one
      let player = manager.get(message.guildId);
      if (!player) {
        player = manager.create({
          guildId: message.guildId,
          voiceChannelId: message.member.voice.channelId,
          textChannelId: message.channelId,
        });
      }

      // Add tracks to queue
      result.tracks.forEach(track => player.queue.add(track));

      if (!player.playing) {
        player.play();
      }

      message.reply(
        `Added **${result.playlist.name}**\n` +
        `Tracks: ${result.tracks.length}\n` +
        `Duration: ${Math.floor(result.playlist.duration / 60000)} minutes`
      );
    } catch (error) {
      console.error("Spotify playlist error:", error);
      message.reply("Error loading playlist!");
    }
  }

  // Artist Top Tracks Command
  // Usage: !artop 36QJpDe2go2KgaRleHCDkS
  if (command === "artop") {
    const artistId = args[0];
    if (!artistId) return message.reply("Please provide an artist ID!");

    try {
      const result = await manager.artistTopTracks(artistId, message.author);

      if (result.loadType === "EMPTY") {
        return message.reply("Could not fetch artist top tracks!");
      }

      // Get the player or create one
      let player = manager.get(message.guildId);
      if (!player) {
        player = manager.create({
          guildId: message.guildId,
          voiceChannelId: message.member.voice.channelId,
          textChannelId: message.channelId,
        });
      }

      // Add tracks to queue
      result.tracks.forEach(track => player.queue.add(track));

      if (!player.playing) {
        player.play();
      }

      const trackList = result.tracks
        .slice(0, 5)
        .map((t, i) => `${i + 1}. ${t.title}`)
        .join("\n");

      message.reply(`Added ${result.tracks.length} top tracks:\n${trackList}`);
    } catch (error) {
      console.error("Artist top tracks error:", error);
      message.reply("Error fetching artist tracks!");
    }
  }

  // Recommendations Command
  // Usage: !recommend https://open.spotify.com/track/dQw4w9WgXcQ 10
  if (command === "recommend") {
    const url = args[0];
    const limit = parseInt(args[1]) || 10;
    if (!url) return message.reply("Please provide a Spotify track URL!");

    try {
      const result = await manager.recommendations(url, limit, message.author);

      if (result.loadType === "EMPTY") {
        return message.reply("Could not fetch recommendations!");
      }

      // Get the player or create one
      let player = manager.get(message.guildId);
      if (!player) {
        player = manager.create({
          guildId: message.guildId,
          voiceChannelId: message.member.voice.channelId,
          textChannelId: message.channelId,
        });
      }

      // Add tracks to queue
      result.tracks.forEach(track => player.queue.add(track));

      if (!player.playing) {
        player.play();
      }

      const trackList = result.tracks
        .slice(0, 5)
        .map((t, i) => `${i + 1}. ${t.title} - ${t.author}`)
        .join("\n");

      message.reply(`Added ${result.tracks.length} recommendations:\n${trackList}`);
    } catch (error) {
      console.error("Recommendations error:", error);
      message.reply("Error fetching recommendations!");
    }
  }

  // Help Command
  if (command === "sphelp") {
    message.reply(
      "**Spotify Commands:**\n" +
      "`!spsearch <query>` - Search Spotify\n" +
      "`!spresolve <url>` - Resolve a Spotify track/album\n" +
      "`!spplaylist <url> [limit]` - Load a Spotify playlist\n" +
      "`!artop <artist_id>` - Get artist's top tracks\n" +
      "`!recommend <track_url> [limit]` - Get track recommendations\n"
    );
  }
});

// Login to Discord
client.login("YOUR_DISCORD_BOT_TOKEN");
