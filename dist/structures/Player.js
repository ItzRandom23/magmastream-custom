"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const tslib_1 = require("tslib");
const Filters_1 = require("./Filters");
const Manager_1 = require("./Manager");
const Node_1 = require("./Node");
const Queue_1 = require("./Queue");
const Utils_1 = require("./Utils");
const _ = tslib_1.__importStar(require("lodash"));
const playerCheck_1 = tslib_1.__importDefault(require("../utils/playerCheck"));
class Player {
    options;
    /** The Queue for the Player. */
    queue;
    /** The filters applied to the audio. */
    filters;
    /** Whether the queue repeats the track. */
    trackRepeat = false;
    /** Whether the queue repeats the queue. */
    queueRepeat = false;
    /**Whether the queue repeats and shuffles after each song. */
    dynamicRepeat = false;
    /** The time the player is in the track. */
    position = 0;
    /** Whether the player is playing. */
    playing = false;
    /** Whether the player is paused. */
    paused = false;
    /** The volume for the player */
    volume = 100;
    /** The Node for the Player. */
    node;
    /** The guild ID for the player. */
    guildId;
    /** The voice channel for the player. */
    voiceChannelId = null;
    /** The text channel for the player. */
    textChannelId = null;
    /**The now playing message. */
    nowPlayingMessage;
    /** The current state of the player. */
    state = Utils_1.StateTypes.Disconnected;
    /** The equalizer bands array. */
    bands = new Array(15).fill(0.0);
    /** The voice state object from Discord. */
    voiceState;
    /** The Manager. */
    manager;
    /** The autoplay state of the player. */
    isAutoplay = false;
    /** The number of times to try autoplay before emitting queueEnd. */
    autoplayTries = 3;
    static _manager;
    data = {};
    dynamicLoopInterval = null;
    dynamicRepeatIntervalMs = null;
    /**
     * Creates a new player, returns one if it already exists.
     * @param options The player options.
     * @see https://docs.magmastream.com/main/introduction/getting-started
     */
    constructor(options) {
        this.options = options;
        // If the Manager is not initiated, throw an error.
        if (!this.manager)
            this.manager = Utils_1.Structure.get("Player")._manager;
        if (!this.manager)
            throw new RangeError("Manager has not been initiated.");
        // If a player with the same guild ID already exists, return it.
        if (this.manager.players.has(options.guildId)) {
            return this.manager.players.get(options.guildId);
        }
        // Check the player options for errors.
        (0, playerCheck_1.default)(options);
        // Set the guild ID and voice state.
        this.guildId = options.guildId;
        this.voiceState = Object.assign({
            op: "voiceUpdate",
            guild_id: options.guildId,
        });
        // Set the voice and text channels if they exist.
        if (options.voiceChannelId)
            this.voiceChannelId = options.voiceChannelId;
        if (options.textChannelId)
            this.textChannelId = options.textChannelId;
        // Set the node to use, either the specified node or the first available node.
        const node = this.manager.nodes.get(options.node);
        this.node = node || this.manager.useableNode;
        // If no node is available, throw an error.
        if (!this.node)
            throw new RangeError("No available nodes.");
        // Initialize the queue with the guild ID and manager.
        this.queue = new Queue_1.Queue(this.guildId, this.manager);
        this.queue.previous = new Array();
        // Add the player to the manager's player collection.
        this.manager.players.set(options.guildId, this);
        // Set the initial volume.
        this.setVolume(options.volume ?? 100);
        // Initialize the filters.
        this.filters = new Filters_1.Filters(this);
        // Emit the playerCreate event.
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerCreate, this);
    }
    /**
     * Set custom data.
     * @param key - The key to set the data for.
     * @param value - The value to set the data to.
     */
    set(key, value) {
        // Store the data in the data object using the key.
        this.data[key] = value;
    }
    /**
     * Retrieves custom data associated with a given key.
     * @template T - The expected type of the data.
     * @param {string} key - The key to retrieve the data for.
     * @returns {T} - The data associated with the key, cast to the specified type.
     */
    get(key) {
        // Access the data object using the key and cast it to the specified type T.
        return this.data[key];
    }
    /**
     * Initializes the static properties of the Player class.
     * @hidden
     * @param manager The Manager to use.
     */
    static init(manager) {
        // Set the Manager to use.
        this._manager = manager;
    }

    /**
   * Same as Manager#search() but a shortcut on the player itself.
   * @param query
   * @param requester
   * @param sourcePlatforms
   */
    async search(query, requester, sourcePlatforms) {
        return await this.manager.search(query, requester, sourcePlatforms);
    }
    /**
     * Connects the player to the voice channel.
     * @throws {RangeError} If no voice channel has been set.
     * @returns {void}
     */
    connect() {
        // Check if the voice channel has been set.
        if (!this.voiceChannelId) {
            throw new RangeError("No voice channel has been set. You must use the `setVoiceChannelId()` method to set the voice channel before connecting.");
        }
        // Set the player state to connecting.
        this.state = Utils_1.StateTypes.Connecting;
        // Clone the current player state for comparison.
        const oldPlayer = this ? { ...this } : null;
        // Send the voice state update to the gateway.
        this.manager.options.send(this.guildId, {
            op: 4,
            d: {
                guild_id: this.guildId,
                channel_id: this.voiceChannelId,
                self_mute: this.options.selfMute || false,
                self_deaf: this.options.selfDeafen || false,
            },
        });
        // Set the player state to connected.
        this.state = Utils_1.StateTypes.Connected;
        // Emit the player state update event.
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerStateUpdate, oldPlayer, this, {
            changeType: Manager_1.PlayerStateEventTypes.ConnectionChange,
            details: {
                changeType: "connect",
                previousConnection: oldPlayer?.state === Utils_1.StateTypes.Connected,
                currentConnection: true,
            },
        });
    }
    /**
     * Disconnects the player from the voice channel.
     * @throws {TypeError} If the player is not connected.
     * @returns {this} - The current instance of the Player class for method chaining.
     */
    async disconnect() {
        // Set the player state to disconnecting.
        this.state = Utils_1.StateTypes.Disconnecting;
        // Clone the current player state for comparison.
        const oldPlayer = this ? { ...this } : null;
        // Pause the player.
        await this.pause(true);
        // Send the voice state update to the gateway.
        this.manager.options.send(this.guildId, {
            op: 4,
            d: {
                guild_id: this.guildId,
                channel_id: null,
                self_mute: false,
                self_deaf: false,
            },
        });
        // Set the player voice channel to null.
        this.voiceChannelId = null;
        // Set the player state to disconnected.
        this.state = Utils_1.StateTypes.Disconnected;
        // Emit the player state update event.
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerStateUpdate, oldPlayer, this, {
            changeType: Manager_1.PlayerStateEventTypes.ConnectionChange,
            details: {
                changeType: "disconnect",
                previousConnection: oldPlayer.state === Utils_1.StateTypes.Connected,
                currentConnection: false,
            },
        });
        return this;
    }
    /**
     * Destroys the player and clears the queue.
     * @param {boolean} disconnect - Whether to disconnect the player from the voice channel.
     * @returns {Promise<boolean>} - Whether the player was successfully destroyed.
     * @emits {PlayerDestroy} - Emitted when the player is destroyed.
     * @emits {PlayerStateUpdate} - Emitted when the player state is updated.
     */
    async destroy(disconnect = true) {
        const oldPlayer = this ? { ...this } : null;
        this.state = Utils_1.StateTypes.Destroying;

        if (disconnect) {
            await this.pause(true).catch(() => { });
            await this.disconnect().catch(() => { });
        }

        // Stop any intervals or loops
        if (this.dynamicLoopInterval) {
            clearInterval(this.dynamicLoopInterval);
            this.dynamicLoopInterval = null;
        }

        if (this.isAutoplay) {
            this.isAutoplay = false;
        }

        // Clear filters, queue, data
        await this.node.rest.destroyPlayer(this.guildId).catch(() => { });
        this.queue.clear();
        this.filters = null;
        this.queue.current = null;
        this.queue.previous = [];

        // Emit events
        this.manager.emit(
            Manager_1.ManagerEventTypes.PlayerStateUpdate,
            oldPlayer,
            null,
            {
                changeType: Manager_1.PlayerStateEventTypes.PlayerDestroy,
            }
        );

        this.manager.emit(Manager_1.ManagerEventTypes.PlayerDestroy, this);

        // Safe delete
        let deleted = false;
        if (this.manager.players.has(this.guildId)) {
            deleted = this.manager.players.delete(this.guildId);
            if (!deleted) {
                console.warn(
                    `[Player] Deletion failed despite existence in map for guild: ${this.guildId}`
                );
            }
        }

        return deleted;
    }
    /**
     * Sets the player voice channel.
     * @param {string} channel - The new voice channel ID.
     * @returns {this} - The player instance.
     * @throws {TypeError} If the channel parameter is not a string.
     */
    setVoiceChannelId(channel) {
        // Validate the channel parameter
        if (typeof channel !== "string")
            throw new TypeError("Channel must be a non-empty string.");
        // Clone the current player state for comparison
        const oldPlayer = this ? { ...this } : null;
        // Update the player voice channel
        this.voiceChannelId = channel;
        this.connect();
        // Emit a player state update event
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerStateUpdate, oldPlayer, this, {
            changeType: Manager_1.PlayerStateEventTypes.ChannelChange,
            details: {
                changeType: "voice",
                previousChannel: oldPlayer.voiceChannelId || null,
                currentChannel: this.voiceChannelId,
            },
        });
        return this;
    }
    /**
     * Sets the player text channel.
     *
     * This method updates the text channel associated with the player. It also
     * emits a player state update event indicating the change in the channel.
     *
     * @param {string} channel - The new text channel ID.
     * @returns {this} - The player instance for method chaining.
     * @throws {TypeError} If the channel parameter is not a string.
     */
    setTextChannelId(channel) {
        // Validate the channel parameter
        if (typeof channel !== "string")
            throw new TypeError("Channel must be a non-empty string.");
        // Clone the current player state for comparison
        const oldPlayer = this ? { ...this } : null;
        // Update the text channel property
        this.textChannelId = channel;
        // Emit a player state update event with channel change details
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerStateUpdate, oldPlayer, this, {
            changeType: Manager_1.PlayerStateEventTypes.ChannelChange,
            details: {
                changeType: "text",
                previousChannel: oldPlayer.textChannelId || null,
                currentChannel: this.textChannelId,
            },
        });
        // Return the player instance for chaining
        return this;
    }
    /**
     * Sets the now playing message.
     *
     * @param message - The message of the now playing message.
     * @returns The now playing message.
     */
    setNowPlayingMessage(message) {
        if (!message) {
            throw new TypeError("You must provide the message of the now playing message.");
        }
        this.nowPlayingMessage = message;
        return this.nowPlayingMessage;
    }
    async play(optionsOrTrack, playOptions) {
        if (typeof optionsOrTrack !== "undefined" && Utils_1.TrackUtils.validate(optionsOrTrack)) {
            this.queue.current = optionsOrTrack;
        }
        if (!this.queue.current)
            throw new RangeError("No current track.");
        const finalOptions = playOptions
            ? playOptions
            : ["startTime", "endTime", "noReplace"].every((v) => Object.keys(optionsOrTrack || {}).includes(v))
                ? optionsOrTrack
                : {};
        await this.node.rest.updatePlayer({
            guildId: this.guildId,
            data: {
                encodedTrack: this.queue.current?.track,
                ...finalOptions,
            },
        });
        this.playing = true;
        this.position = 0;
        return this;
    }
    /**
     * Sets the autoplay-state of the player.
     *
     * Autoplay is a feature that makes the player play a recommended
     * track when the current track ends.
     *
     * @param {boolean} autoplayState - Whether or not autoplay should be enabled.
     * @param {object} botUser - The user-object that should be used as the bot-user.
     * @param {number} [tries=3] - The number of times the player should try to find a
     * recommended track if the first one doesn't work.
     * @returns {this} - The player instance.
     */
    setAutoplay(autoplayState, botUser, tries) {
        if (typeof autoplayState !== "boolean") {
            throw new Error("autoplayState must be a boolean.");
        }
        if (autoplayState) {
            if (!botUser) {
                throw new Error("botUser must be provided when enabling autoplay.");
            }
            if (!["ClientUser", "User"].includes(botUser.constructor.name)) {
                throw new Error("botUser must be a user-object.");
            }
            this.autoplayTries = tries && typeof tries === "number" && tries > 0 ? tries : 3; // Default to 3 if invalid
            this.isAutoplay = true;
            this.set("Internal_BotUser", botUser);
        }
        else {
            this.isAutoplay = false;
            this.autoplayTries = null;
            this.set("Internal_BotUser", null);
        }
        const oldPlayer = { ...this };
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerStateUpdate, oldPlayer, this, {
            changeType: Manager_1.PlayerStateEventTypes.AutoPlayChange,
            details: {
                previousAutoplay: oldPlayer.isAutoplay,
                currentAutoplay: this.isAutoplay,
            },
        });
        return this;
    }
    /**
     * Gets recommended tracks and returns an array of tracks.
     * @param {Track} track - The track to find recommendations for.
     * @returns {Promise<Track[]>} - Array of recommended tracks.
     */
    async getRecommendedTracks(track) {
        const tracks = await Utils_1.AutoPlayUtils.getRecommendedTracks(track);
        return tracks;
    }
    /**
     * Sets the volume of the player.
     * @param {number} volume - The new volume. Must be between 0 and 1000.
     * @returns {Promise<Player>} - The updated player.
     * @throws {TypeError} If the volume is not a number.
     * @throws {RangeError} If the volume is not between 0 and 1000.
     * @emits {PlayerStateUpdate} - Emitted when the volume is changed.
     * @example
     * player.setVolume(50);
     */
    async setVolume(volume) {
        if (isNaN(volume))
            throw new TypeError("Volume must be a number.");
        if (volume < 0 || volume > 1000)
            throw new RangeError("Volume must be between 0 and 1000.");
        const oldPlayer = this ? { ...this } : null;
        await this.node.rest.updatePlayer({
            guildId: this.options.guildId,
            data: {
                volume,
            },
        });
        this.volume = volume;
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerStateUpdate, oldPlayer, this, {
            changeType: Manager_1.PlayerStateEventTypes.VolumeChange,
            details: { previousVolume: oldPlayer.volume || null, currentVolume: this.volume },
        });
        return this;
    }
    /**
     * Sets the sponsorblock for the player. This will set the sponsorblock segments for the player to the given segments.
     * @param {SponsorBlockSegment[]} segments - The sponsorblock segments to set. Defaults to `[SponsorBlockSegment.Sponsor, SponsorBlockSegment.SelfPromo]` if not provided.
     * @returns {Promise<void>} The promise is resolved when the operation is complete.
     */
    async setSponsorBlock(segments = [Node_1.SponsorBlockSegment.Sponsor, Node_1.SponsorBlockSegment.SelfPromo]) {
        return this.node.setSponsorBlock(this, segments);
    }
    /**
     * Gets the sponsorblock for the player.
     * @returns {Promise<SponsorBlockSegment[]>} The sponsorblock segments.
     */
    async getSponsorBlock() {
        return this.node.getSponsorBlock(this);
    }
    /**
     * Deletes the sponsorblock for the player. This will remove all sponsorblock segments that have been set for the player.
     * @returns {Promise<void>}
     */
    async deleteSponsorBlock() {
        return this.node.deleteSponsorBlock(this);
    }
    /**
     * Sets the track repeat mode.
     * When track repeat is enabled, the current track will replay after it ends.
     * Disables queueRepeat and dynamicRepeat modes if enabled.
     *
     * @param repeat - A boolean indicating whether to enable track repeat.
     * @returns {this} - The player instance.
     * @throws {TypeError} If the repeat parameter is not a boolean.
     */
    setTrackRepeat(repeat) {
        // Ensure the repeat parameter is a boolean
        if (typeof repeat !== "boolean")
            throw new TypeError('Repeat can only be "true" or "false".');
        // Clone the current player state for event emission
        const oldPlayer = this ? { ...this } : null;
        if (repeat) {
            // Enable track repeat and disable other repeat modes
            this.trackRepeat = true;
            this.queueRepeat = false;
            this.dynamicRepeat = false;
        }
        else {
            // Disable all repeat modes
            this.trackRepeat = false;
            this.queueRepeat = false;
            this.dynamicRepeat = false;
        }
        // Emit an event indicating the repeat mode has changed
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerStateUpdate, oldPlayer, this, {
            changeType: Manager_1.PlayerStateEventTypes.RepeatChange,
            detail: {
                changeType: "track",
                previousRepeat: this.getRepeatState(oldPlayer),
                currentRepeat: this.getRepeatState(this),
            },
        });
        return this;
    }
    /**
     * Sets the queue repeat.
     * @param repeat Whether to repeat the queue or not
     * @returns {this} - The player instance.
     * @throws {TypeError} If the repeat parameter is not a boolean
     */
    setQueueRepeat(repeat) {
        // Ensure the repeat parameter is a boolean
        if (typeof repeat !== "boolean")
            throw new TypeError('Repeat can only be "true" or "false".');
        // Get the current player state
        const oldPlayer = this ? { ...this } : null;
        // Update the player state
        if (repeat) {
            this.trackRepeat = false;
            this.queueRepeat = true;
            this.dynamicRepeat = false;
        }
        else {
            this.trackRepeat = false;
            this.queueRepeat = false;
            this.dynamicRepeat = false;
        }
        // Emit the player state update event
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerStateUpdate, oldPlayer, this, {
            changeType: Manager_1.PlayerStateEventTypes.RepeatChange,
            detail: {
                changeType: "queue",
                previousRepeat: this.getRepeatState(oldPlayer),
                currentRepeat: this.getRepeatState(this),
            },
        });
        return this;
    }
    /**
     * Sets the queue to repeat and shuffles the queue after each song.
     * @param repeat "true" or "false".
     * @param ms After how many milliseconds to trigger dynamic repeat.
     * @returns {this} - The player instance.
     * @throws {TypeError} If the repeat parameter is not a boolean.
     * @throws {RangeError} If the queue size is less than or equal to 1.
     */
    setDynamicRepeat(repeat, ms) {
        // Validate the repeat parameter
        if (typeof repeat !== "boolean") {
            throw new TypeError('Repeat can only be "true" or "false".');
        }
        // Ensure the queue has more than one track for dynamic repeat
        if (this.queue.size <= 1) {
            throw new RangeError("The queue size must be greater than 1.");
        }
        // Clone the current player state for comparison
        const oldPlayer = this ? { ...this } : null;
        if (repeat) {
            // Disable other repeat modes when dynamic repeat is enabled
            this.trackRepeat = false;
            this.queueRepeat = false;
            this.dynamicRepeat = true;
            // Set an interval to shuffle the queue periodically
            this.dynamicLoopInterval = setInterval(() => {
                if (!this.dynamicRepeat)
                    return;
                // Shuffle the queue and replace it with the shuffled tracks
                const shuffled = _.shuffle(this.queue);
                this.queue.clear();
                shuffled.forEach((track) => {
                    this.queue.add(track);
                });
            }, ms);
            // Store the ms value
            this.dynamicRepeatIntervalMs = ms;
        }
        else {
            // Clear the interval and reset repeat states
            clearInterval(this.dynamicLoopInterval);
            this.dynamicRepeatIntervalMs = null;
            this.trackRepeat = false;
            this.queueRepeat = false;
            this.dynamicRepeat = false;
        }
        // Emit a player state update event
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerStateUpdate, oldPlayer, this, {
            changeType: Manager_1.PlayerStateEventTypes.RepeatChange,
            detail: {
                changeType: "dynamic",
                previousRepeat: this.getRepeatState(oldPlayer),
                currentRepeat: this.getRepeatState(this),
            },
        });
        return this;
    }
    /**
     * Restarts the currently playing track from the beginning.
     * If there is no track playing, it will play the next track in the queue.
     * @returns {Promise<Player>} The current instance of the Player class for method chaining.
     */
    async restart() {
        // Check if there is a current track in the queue
        if (!this.queue.current?.track) {
            // If the queue has tracks, play the next one
            if (this.queue.length)
                await this.play();
            return this;
        }
        // Reset the track's position to the start
        await this.node.rest.updatePlayer({
            guildId: this.guildId,
            data: {
                position: 0,
                encodedTrack: this.queue.current?.track,
            },
        });
        return this;
    }
    /**
     * Stops the player and optionally removes tracks from the queue.
     * @param {number} [amount] The amount of tracks to remove from the queue. If not provided, removes the current track if it exists.
     * @returns {Promise<this>} - The player instance.
     * @throws {RangeError} If the amount is greater than the queue length.
     */
    async stop(amount) {
        const oldPlayer = { ...this };
        let removedTracks = [];
        if (typeof amount === "number" && amount > 1) {
            if (amount > this.queue.length)
                throw new RangeError("Cannot skip more than the queue length.");
            removedTracks = this.queue.slice(0, amount - 1);
            this.queue.splice(0, amount - 1);
        }
        this.node.rest.updatePlayer({
            guildId: this.guildId,
            data: {
                encodedTrack: null,
            },
        });
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerStateUpdate, oldPlayer, this, {
            changeType: Manager_1.PlayerStateEventTypes.QueueChange,
            details: {
                changeType: "remove",
                tracks: removedTracks,
            },
        });
        return this;
    }
    /**
     * Skips the current track.
     * @returns {this} - The player instance.
     * @throws {Error} If there are no tracks in the queue.
     * @emits {PlayerStateUpdate} - With {@link PlayerStateEventTypes.TrackChange} as the change type.
     */
    async pause(pause) {
        // Validate the pause parameter to ensure it's a boolean.
        if (typeof pause !== "boolean")
            throw new RangeError('Pause can only be "true" or "false".');
        // If the pause state is already as desired or there are no tracks, return early.
        if (this.paused === pause || !this.queue.totalSize)
            return this;
        // Create a copy of the current player state for event emission.
        const oldPlayer = this ? { ...this } : null;
        // Update the playing and paused states.
        this.playing = !pause;
        this.paused = pause;
        // Send an update to the backend to change the pause state of the player.
        await this.node.rest.updatePlayer({
            guildId: this.guildId,
            data: {
                paused: pause,
            },
        });
        // Emit an event indicating the pause state has changed.
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerStateUpdate, oldPlayer, this, {
            changeType: Manager_1.PlayerStateEventTypes.PauseChange,
            details: {
                previousPause: oldPlayer.paused,
                currentPause: this.paused,
            },
        });
        return this;
    }
    /**
 * Skips to the previous track in the queue.
 * @returns {this} - The player instance.
 * @throws {Error} If there are no previous tracks in the queue.
 * @emits {PlayerStateUpdate} - With {@link PlayerStateEventTypes.TrackChange} as the change type.
 */
    async previous() {
        if (!this.queue.previous.length) {
            throw new Error("There is no previous track.");
        }

        const current = this.queue.current;
        const previousTrack = this.queue.previous.pop();

        // ✅ Only push current to queue if it's NOT the same as the previous one already there
        if (
            current &&
            (!this.queue[0] || this.queue[0].identifier !== current.identifier)
        ) {
            this.queue.unshift(current);
        }

        this.queue.current = previousTrack;

        await this.play();
    }



    /**
     * Seeks to a given position in the currently playing track.
     * @param position - The position in milliseconds to seek to.
     * @returns {this} - The player instance.
     * @throws {Error} If the position is invalid.
     * @emits {PlayerStateUpdate} - With {@link PlayerStateEventTypes.TrackChange} as the change type.
     */
    async seek(position) {
        if (!this.queue.current)
            return undefined;
        position = Number(position);
        // Check if the position is valid.
        if (isNaN(position)) {
            throw new RangeError("Position must be a number.");
        }
        // Get the old player state.
        const oldPlayer = this ? { ...this } : null;
        // Clamp the position to ensure it is within the valid range.
        if (position < 0 || position > this.queue.current.duration) {
            position = Math.max(Math.min(position, this.queue.current.duration), 0);
        }
        // Update the player's position.
        this.position = position;
        // Send the seek request to the node.
        await this.node.rest.updatePlayer({
            guildId: this.guildId,
            data: {
                position: position,
            },
        });
        // Emit an event to notify the manager of the track change.
        this.manager.emit(Manager_1.ManagerEventTypes.PlayerStateUpdate, oldPlayer, this, {
            changeType: Manager_1.PlayerStateEventTypes.TrackChange,
            details: {
                changeType: "timeUpdate",
                previousTime: oldPlayer.position,
                currentTime: this.position,
            },
        });
        return this;
    }
    /**
     * Returns the current repeat state of the player.
     * @param player The player to get the repeat state from.
     * @returns The repeat state of the player, or null if it is not repeating.
     */
    getRepeatState(player) {
        // If the queue is repeating, return the queue repeat state.
        if (player.queueRepeat)
            return "queue";
        // If the track is repeating, return the track repeat state.
        if (player.trackRepeat)
            return "track";
        // If the dynamic repeat is enabled, return the dynamic repeat state.
        if (player.dynamicRepeat)
            return "dynamic";
        // If none of the above conditions are met, return null.
        return null;
    }
    /**
     * Automatically moves the player to a usable node.
     * @returns {Promise<Player | void>} - The player instance or void if not moved.
     */
    async autoMoveNode() {
        // Get a usable node from the manager
        const node = this.manager.useableNode;
        // Move the player to the usable node and return the result
        return await this.moveNode(node.options.identifier);
    }
    /**
     * Moves the player to another node.
     * @param {string} identifier - The identifier of the node to move to.
     * @returns {Promise<Player>} - The player instance after being moved.
     */
    async moveNode(identifier) {
        const node = this.manager.nodes.get(identifier);
        if (!node)
            throw new Error(`Node with identifier ${identifier} not found`);
        if (node.options.identifier === this.node.options.identifier) {
            return this;
        }
        try {
            const playerPosition = this.position;
            const { sessionId, event: { token, endpoint }, } = this.voiceState;
            const currentTrack = this.queue.current ? this.queue.current : null;
            await this.node.rest.destroyPlayer(this.guildId).catch(() => { });
            this.manager.players.delete(this.guildId);
            this.node = node;
            this.manager.players.set(this.guildId, this);
            await this.node.rest.updatePlayer({
                guildId: this.guildId,
                data: { paused: this.paused, volume: this.volume, position: playerPosition, encodedTrack: currentTrack?.track, voice: { token, endpoint, sessionId } },
            });
            await this.filters.updateFilters();
        }
        catch (error) {
            throw new Error(`Failed to move player to node ${identifier}: ${error}`);
        }
    }
    /**
     * Transfers the player to a new server. If the player already exists on the new server
     * and force is false, this method will return the existing player. Otherwise, a new player
     * will be created and the current player will be destroyed.
     * @param {PlayerOptions} newOptions - The new options for the player.
     * @param {boolean} force - Whether to force the creation of a new player.
     * @returns {Promise<Player>} - The new player instance.
     */
    async switchGuild(newOptions, force = false) {
        if (!newOptions.guildId)
            throw new Error("guildId is required");
        if (!newOptions.voiceChannelId)
            throw new Error("Voice channel ID is required");
        if (!newOptions.textChannelId)
            throw new Error("Text channel ID is required");
        // Check if a player already exists for the new guild
        let newPlayer = this.manager.players.get(newOptions.guildId);
        // If the player already exists and force is false, return the existing player
        if (newPlayer && !force)
            return newPlayer;
        const oldPlayerProperties = {
            paused: this.paused,
            selfMute: this.options.selfMute,
            selfDeafen: this.options.selfDeafen,
            volume: this.volume,
            position: this.position,
            queue: {
                current: this.queue.current,
                tracks: [...this.queue],
                previous: [...this.queue.previous],
            },
            trackRepeat: this.trackRepeat,
            queueRepeat: this.queueRepeat,
            dynamicRepeat: this.dynamicRepeat,
            dynamicRepeatIntervalMs: this.dynamicRepeatIntervalMs,
            ClientUser: this.get("Internal_BotUser"),
            filters: this.filters,
            nowPlayingMessage: this.nowPlayingMessage,
            isAutoplay: this.isAutoplay,
        };
        // If force is true, destroy the existing player for the new guild
        if (force && newPlayer) {
            await newPlayer.destroy();
        }
        newOptions.node = newOptions.node ?? this.options.node;
        newOptions.selfDeafen = newOptions.selfDeafen ?? oldPlayerProperties.selfDeafen;
        newOptions.selfMute = newOptions.selfMute ?? oldPlayerProperties.selfMute;
        newOptions.volume = newOptions.volume ?? oldPlayerProperties.volume;
        // Deep clone the current player
        const clonedPlayer = this.manager.create(newOptions);
        // Connect the cloned player to the new voice channel
        clonedPlayer.connect();
        // Update the player's state on the Lavalink node
        await clonedPlayer.node.rest.updatePlayer({
            guildId: clonedPlayer.guildId,
            data: {
                paused: oldPlayerProperties.paused,
                volume: oldPlayerProperties.volume,
                position: oldPlayerProperties.position,
                encodedTrack: oldPlayerProperties.queue.current?.track,
            },
        });
        clonedPlayer.queue.current = oldPlayerProperties.queue.current;
        clonedPlayer.queue.previous = oldPlayerProperties.queue.previous;
        clonedPlayer.queue.add(oldPlayerProperties.queue.tracks);
        clonedPlayer.filters = oldPlayerProperties.filters;
        clonedPlayer.isAutoplay = oldPlayerProperties.isAutoplay;
        clonedPlayer.nowPlayingMessage = oldPlayerProperties.nowPlayingMessage;
        clonedPlayer.trackRepeat = oldPlayerProperties.trackRepeat;
        clonedPlayer.queueRepeat = oldPlayerProperties.queueRepeat;
        clonedPlayer.dynamicRepeat = oldPlayerProperties.dynamicRepeat;
        clonedPlayer.dynamicRepeatIntervalMs = oldPlayerProperties.dynamicRepeatIntervalMs;
        clonedPlayer.set("Internal_BotUser", oldPlayerProperties.ClientUser);
        clonedPlayer.paused = oldPlayerProperties.paused;
        // Update filters for the cloned player
        await clonedPlayer.filters.updateFilters();
        // Debug information
        const debugInfo = {
            success: true,
            message: `Transferred ${clonedPlayer.queue.length} tracks successfully to <#${newOptions.voiceChannelId}> bound to <#${newOptions.textChannelId}>.`,
            player: {
                guildId: clonedPlayer.guildId,
                voiceChannelId: clonedPlayer.voiceChannelId,
                textChannelId: clonedPlayer.textChannelId,
                volume: clonedPlayer.volume,
                playing: clonedPlayer.playing,
                queueSize: clonedPlayer.queue.size,
            },
        };
        this.manager.emit(Manager_1.ManagerEventTypes.Debug, `[PLAYER] Transferred player to a new server: ${JSON.stringify(debugInfo)}.`);
        // Return the cloned player
        return clonedPlayer;
    }
    /**
     * Retrieves the current lyrics for the playing track.
     * @param skipTrackSource - Indicates whether to skip the track source when fetching lyrics.
     * @returns {Promise<Lyrics>} - The lyrics of the current track.
     * @throws {RangeError} - If the 'lavalyrics-plugin' is not available on the Lavalink node.
     */
    async getCurrentLyrics(skipTrackSource = false) {
        // Check if the 'lavalyrics-plugin' is available on the node
        const hasLyricsPlugin = this.node.info.plugins.some((plugin) => plugin.name === "lavalyrics-plugin");
        if (!hasLyricsPlugin) {
            throw new RangeError(`There is no lavalyrics-plugin available in the Lavalink node: ${this.node.options.identifier}`);
        }
        // Fetch the lyrics for the current track from the Lavalink node
        let result = (await this.node.getLyrics(this.queue.current, skipTrackSource));
        // If no lyrics are found, return a default empty lyrics object
        if (!result) {
            result = {
                source: null,
                provider: null,
                text: null,
                lines: [],
                plugin: [],
            };
        }
        return result;
    }
}
exports.Player = Player;
