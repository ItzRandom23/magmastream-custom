"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackSourceTypes = exports.SeverityTypes = exports.TrackEndReasonTypes = exports.StateTypes = exports.LoadTypes = exports.Structure = exports.TrackUtils = void 0;
const Manager_1 = require("./Manager");
/** @hidden */
const SIZES = ["0", "1", "2", "3", "default", "mqdefault", "hqdefault", "maxresdefault"];
class TrackUtils {
    static trackPartial = null;
    static manager;
    /**
     * Initializes the TrackUtils class with the given manager.
     * @param manager The manager instance to use.
     * @hidden
     */
    static init(manager) {
        // Set the manager instance for TrackUtils.
        this.manager = manager;
    }
    /**
     * Sets the partial properties for the Track class. If a Track has some of its properties removed by the partial,
     * it will be considered a partial Track.
     * @param {TrackPartial} partial The array of string property names to remove from the Track class.
     */
    static setTrackPartial(partial) {
        if (!Array.isArray(partial) || !partial.every((str) => typeof str === "string"))
            throw new Error("Provided partial is not an array or not a string array.");
        const defaultProperties = [
            Manager_1.TrackPartial.Track,
            Manager_1.TrackPartial.Title,
            Manager_1.TrackPartial.Identifier,
            Manager_1.TrackPartial.Author,
            Manager_1.TrackPartial.Duration,
            Manager_1.TrackPartial.Isrc,
            Manager_1.TrackPartial.IsSeekable,
            Manager_1.TrackPartial.IsStream,
            Manager_1.TrackPartial.Uri,
            Manager_1.TrackPartial.ArtworkUrl,
            Manager_1.TrackPartial.SourceName,
            Manager_1.TrackPartial.ThumbNail,
            Manager_1.TrackPartial.Requester,
            Manager_1.TrackPartial.PluginInfo,
            Manager_1.TrackPartial.CustomData,
        ];
        /** The array of property names that will be removed from the Track class */
        this.trackPartial = Array.from(new Set([...defaultProperties, ...partial]));
        /** Make sure that the "track" property is always included */
        if (!this.trackPartial.includes(Manager_1.TrackPartial.Track))
            this.trackPartial.unshift(Manager_1.TrackPartial.Track);
    }
    /**
     * Checks if the provided argument is a valid Track.
     * If provided an array then every element will be checked.
     * @param trackOrTracks The Track or array of Tracks to check.
     * @returns {boolean} Whether the provided argument is a valid Track.
     */
    static validate(trackOrTracks) {
        if (typeof trackOrTracks !== "object" || trackOrTracks === null) {
            return false;
        }
        const isValidTrack = (track) => {
            if (typeof track !== "object" || track === null) {
                return false;
            }
            const t = track;
            return (typeof t.track === "string" && typeof t.title === "string" && typeof t.identifier === "string" && typeof t.isrc === "string" && typeof t.uri === "string");
        };
        if (Array.isArray(trackOrTracks)) {
            return trackOrTracks.every(isValidTrack);
        }
        return isValidTrack(trackOrTracks);
    }
    /**
     * Builds a Track from the raw data from Lavalink and a optional requester.
     * @param data The raw data from Lavalink to build the Track from.
     * @param requester The user who requested the track, if any.
     * @returns The built Track.
     */
    static build(data, requester) {
        if (typeof data === "undefined")
            throw new RangeError('Argument "data" must be present.');
        try {
            const sourceNameMap = {
                applemusic: "AppleMusic",
                bandcamp: "Bandcamp",
                deezer: "Deezer",
                jiosaavn: "Jiosaavn",
                soundcloud: "SoundCloud",
                spotify: "Spotify",
                tidal: "Tidal",
                youtube: "YouTube",
                vkmusic: "VKMusic",
            };
            const track = {
                track: data.encoded,
                title: data.info.title,
                identifier: data.info.identifier,
                author: data.info.author,
                duration: data.info.length,
                isrc: data.info?.isrc,
                isSeekable: data.info.isSeekable,
                isStream: data.info.isStream,
                uri: data.info.uri,
                artworkUrl: data.info?.artworkUrl,
                sourceName: sourceNameMap[data.info?.sourceName?.toLowerCase() ?? ""] ?? data.info?.sourceName,
                thumbnail: data.info.uri.includes("youtube") ? `https://img.youtube.com/vi/${data.info.identifier}/default.jpg` : null,
                displayThumbnail(size = "default") {
                    const finalSize = SIZES.find((s) => s === size) ?? "default";
                    return this.uri.includes("youtube") ? `https://img.youtube.com/vi/${data.info.identifier}/${finalSize}.jpg` : null;
                },
                requester: requester,
                pluginInfo: data.pluginInfo,
                customData: {},
            };
            track.displayThumbnail = track.displayThumbnail.bind(track);
            if (this.trackPartial) {
                for (const key of Object.keys(track)) {
                    if (this.trackPartial.includes(key))
                        continue;
                    delete track[key];
                }
            }
            return track;
        }
        catch (error) {
            throw new RangeError(`Argument "data" is not a valid track: ${error.message}`);
        }
    }
}
exports.TrackUtils = TrackUtils;
/** Gets or extends structures to extend the built in, or already extended, classes to add more functionality. */
class Structure {
    /**
     * Extends a class.
     * @param name
     * @param extender
     */
    static extend(name, extender) {
        if (!structures[name])
            throw new TypeError(`"${name} is not a valid structure`);
        const extended = extender(structures[name]);
        structures[name] = extended;
        return extended;
    }
    /**
     * Get a structure from available structures by name.
     * @param name
     */
    static get(name) {
        const structure = structures[name];
        if (!structure)
            throw new TypeError('"structure" must be provided.');
        return structure;
    }
}
exports.Structure = Structure;
const structures = {
    Player: require("./Player").Player,
    Queue: require("./Queue").Queue,
    Node: require("./Node").Node,
    Filters: require("./Filters").Filters,
    Manager: require("./Manager").Manager,
    Plugin: require("./Plugin").Plugin,
    Rest: require("./Rest").Rest,
    Utils: require("./Utils"),
};
var LoadTypes;
(function (LoadTypes) {
    LoadTypes["Track"] = "track";
    LoadTypes["Playlist"] = "playlist";
    LoadTypes["Search"] = "search";
    LoadTypes["Empty"] = "empty";
    LoadTypes["Error"] = "error";
})(LoadTypes || (exports.LoadTypes = LoadTypes = {}));
var StateTypes;
(function (StateTypes) {
    StateTypes["Connected"] = "CONNECTED";
    StateTypes["Connecting"] = "CONNECTING";
    StateTypes["Disconnected"] = "DISCONNECTED";
    StateTypes["Disconnecting"] = "DISCONNECTING";
    StateTypes["Destroying"] = "DESTROYING";
})(StateTypes || (exports.StateTypes = StateTypes = {}));
var TrackEndReasonTypes;
(function (TrackEndReasonTypes) {
    TrackEndReasonTypes["Finished"] = "finished";
    TrackEndReasonTypes["LoadFailed"] = "loadFailed";
    TrackEndReasonTypes["Stopped"] = "stopped";
    TrackEndReasonTypes["Replaced"] = "replaced";
    TrackEndReasonTypes["Cleanup"] = "cleanup";
})(TrackEndReasonTypes || (exports.TrackEndReasonTypes = TrackEndReasonTypes = {}));
var SeverityTypes;
(function (SeverityTypes) {
    SeverityTypes["Common"] = "common";
    SeverityTypes["Suspicious"] = "suspicious";
    SeverityTypes["Fault"] = "fault";
})(SeverityTypes || (exports.SeverityTypes = SeverityTypes = {}));
var TrackSourceTypes;
(function (TrackSourceTypes) {
    TrackSourceTypes["AppleMusic"] = "applemusic";
    TrackSourceTypes["Bandcamp"] = "bandcamp";
    TrackSourceTypes["Deezer"] = "deezer";
    TrackSourceTypes["Jiosaavn"] = "jiosaavn";
    TrackSourceTypes["SoundCloud"] = "soundcloud";
    TrackSourceTypes["Spotify"] = "spotify";
    TrackSourceTypes["Tidal"] = "tidal";
    TrackSourceTypes["VKMusic"] = "vkmusic";
    TrackSourceTypes["YouTube"] = "youtube";
})(TrackSourceTypes || (exports.TrackSourceTypes = TrackSourceTypes = {}));
