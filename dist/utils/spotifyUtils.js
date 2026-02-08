"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotifyUtils = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const { fetch } = require("undici");

/**
 * Utility class for handling Spotify API interactions
 */
class SpotifyUtils {
    static SPOTIFY_API_ENDPOINT = "http://eu.leonodes.xyz:2450/api";
    static manager;

    /**
     * Initializes the SpotifyUtils class with a manager instance
     * @param manager The manager instance
     */
    static init(manager) {
        this.manager = manager;
    }

    /**
     * Searches for tracks using the Spotify search endpoint
     * @param query The search query
     * @param requester The user who requested the search
     * @returns The search result
     */
    static async spotifySearch(query, requester) {
        if (!query) {
            return {
                loadType: "EMPTY",
                tracks: [],
                playlist: null,
            };
        }

        try {
            // Search Spotify API for the query
            const spotifyResponse = await this.fetchSpotifySearch(query);
            if (!spotifyResponse || !spotifyResponse.items || spotifyResponse.items.length === 0) {
                return {
                    loadType: "EMPTY",
                    tracks: [],
                    playlist: null,
                };
            }

            // Try fallback searches for each result
            const tracks = [];
            for (const item of spotifyResponse.items) {
                const artistString = item.artists ? item.artists.join(", ") : "";
                
                // Try ISRC search first
                if (item.isrc) {
                    const isrcTrack = await this.searchLavalink(`dzisrc:${item.isrc}`, requester);
                    if (isrcTrack) {
                        tracks.push(isrcTrack);
                        continue;
                    }
                }

                // Fallback to title + artists searches
                const searchQueries = [
                    `dzsearch:${item.title} ${artistString}`,
                    `amsearch:${item.title} ${artistString}`,
                    `jssearch:${item.title} ${artistString}`,
                    `scsearch:${item.title} ${artistString}`,
                ];

                let found = false;
                for (const searchQuery of searchQueries) {
                    const track = await this.searchLavalink(searchQuery, requester);
                    if (track) {
                        tracks.push(track);
                        found = true;
                        break;
                    }
                }

                // If no track found through fallback, store basic info
                if (!found && this.manager) {
                    this.manager.emit("debug", `[SPOTIFY] Could not find Lavalink track for: ${item.title} by ${artistString}`);
                }
            }

            return {
                loadType: tracks.length > 0 ? "SEARCH" : "EMPTY",
                tracks: tracks,
                playlist: null,
            };
        } catch (error) {
            if (this.manager) {
                this.manager.emit("debug", `[SPOTIFY] Search error: ${error.message}`);
            }
            return {
                loadType: "EMPTY",
                tracks: [],
                playlist: null,
            };
        }
    }

    /**
     * Resolves a Spotify URL (playlist, album, or track)
     * @param url The Spotify URL to resolve
     * @param limit Optional limit for number of tracks (for playlists/albums)
     * @param requester The user who requested the resolution
     * @returns The resolved tracks
     */
    static async spotifyResolve(url, limit, requester) {
        if (!url) {
            return {
                loadType: "EMPTY",
                tracks: [],
                playlist: null,
            };
        }

        try {
            const resolveResponse = await this.fetchSpotifyResolve(url, limit);
            if (!resolveResponse) {
                return {
                    loadType: "EMPTY",
                    tracks: [],
                    playlist: null,
                };
            }

            // If it's a single track
            if (resolveResponse.type === "track" && resolveResponse.title) {
                const artisti = resolveResponse.artists ? resolveResponse.artists.join(", ") : "";
                const searchQueries = [
                    `dzisrc:${resolveResponse.isrc}`,
                    `dzsearch:${resolveResponse.title} ${artisti}`,
                    `amsearch:${resolveResponse.title} ${artisti}`,
                    `jssearch:${resolveResponse.title} ${artisti}`,
                    `scsearch:${resolveResponse.title} ${artisti}`,
                ];

                for (const searchQuery of searchQueries) {
                    const track = await this.searchLavalink(searchQuery, requester);
                    if (track) {
                        return {
                            loadType: "TRACK",
                            tracks: [track],
                            playlist: null,
                        };
                    }
                }
            }

            // If it's a playlist or album
            if (resolveResponse.tracks && Array.isArray(resolveResponse.tracks)) {
                const tracks = [];
                for (const item of resolveResponse.tracks) {
                    const artistString = item.artists ? item.artists.join(", ") : "";
                    
                    if (item.isrc) {
                        const isrcTrack = await this.searchLavalink(`dzisrc:${item.isrc}`, requester);
                        if (isrcTrack) {
                            tracks.push(isrcTrack);
                            continue;
                        }
                    }

                    const searchQueries = [
                        `dzsearch:${item.title} ${artistString}`,
                        `amsearch:${item.title} ${artistString}`,
                        `jssearch:${item.title} ${artistString}`,
                        `scsearch:${item.title} ${artistString}`,
                    ];

                    for (const searchQuery of searchQueries) {
                        const track = await this.searchLavalink(searchQuery, requester);
                        if (track) {
                            tracks.push(track);
                            break;
                        }
                    }
                }

                const playlist = {
                    name: resolveResponse.name || "Spotify Playlist",
                    playlistInfo: null,
                    requester: requester,
                    tracks: tracks,
                    duration: tracks.reduce((acc, cur) => acc + (cur.duration || 0), 0),
                };

                return {
                    loadType: "PLAYLIST",
                    tracks: tracks,
                    playlist: playlist,
                };
            }

            return {
                loadType: "EMPTY",
                tracks: [],
                playlist: null,
            };
        } catch (error) {
            if (this.manager) {
                this.manager.emit("debug", `[SPOTIFY] Resolve error: ${error.message}`);
            }
            return {
                loadType: "EMPTY",
                tracks: [],
                playlist: null,
            };
        }
    }

    /**
     * Fetches artist's top tracks
     * @param artistId The Spotify artist ID
     * @param requester The user who requested the tracks
     * @returns The artist's top tracks
     */
    static async artistTopTracks(artistId, requester) {
        if (!artistId) {
            return {
                loadType: "EMPTY",
                tracks: [],
                playlist: null,
            };
        }

        try {
            const topTracksResponse = await this.fetchArtistTopTracks(artistId);
            if (!topTracksResponse || !topTracksResponse.items || topTracksResponse.items.length === 0) {
                return {
                    loadType: "EMPTY",
                    tracks: [],
                    playlist: null,
                };
            }

            const tracks = [];
            for (const item of topTracksResponse.items) {
                const artistString = item.artists ? item.artists.join(", ") : "";
                
                if (item.isrc) {
                    const isrcTrack = await this.searchLavalink(`dzisrc:${item.isrc}`, requester);
                    if (isrcTrack) {
                        tracks.push(isrcTrack);
                        continue;
                    }
                }

                const searchQueries = [
                    `dzsearch:${item.title} ${artistString}`,
                    `amsearch:${item.title} ${artistString}`,
                    `jssearch:${item.title} ${artistString}`,
                    `scsearch:${item.title} ${artistString}`,
                ];

                for (const searchQuery of searchQueries) {
                    const track = await this.searchLavalink(searchQuery, requester);
                    if (track) {
                        tracks.push(track);
                        break;
                    }
                }
            }

            return {
                loadType: tracks.length > 0 ? "SEARCH" : "EMPTY",
                tracks: tracks,
                playlist: null,
            };
        } catch (error) {
            if (this.manager) {
                this.manager.emit("debug", `[SPOTIFY] Artist top tracks error: ${error.message}`);
            }
            return {
                loadType: "EMPTY",
                tracks: [],
                playlist: null,
            };
        }
    }

    /**
     * Fetches recommendations for a track
     * @param url The Spotify track URL
     * @param limit Optional limit for number of recommended tracks
     * @param requester The user who requested the recommendations
     * @returns The recommended tracks
     */
    static async recommendations(url, limit, requester) {
        if (!url) {
            return {
                loadType: "EMPTY",
                tracks: [],
                playlist: null,
            };
        }

        try {
            const recommendationsResponse = await this.fetchRecommendations(url, limit);
            if (!recommendationsResponse || !recommendationsResponse.items || recommendationsResponse.items.length === 0) {
                return {
                    loadType: "EMPTY",
                    tracks: [],
                    playlist: null,
                };
            }

            const tracks = [];
            for (const item of recommendationsResponse.items) {
                const artistString = item.artists ? item.artists.join(", ") : "";
                
                if (item.isrc) {
                    const isrcTrack = await this.searchLavalink(`dzisrc:${item.isrc}`, requester);
                    if (isrcTrack) {
                        tracks.push(isrcTrack);
                        continue;
                    }
                }

                const searchQueries = [
                    `dzsearch:${item.title} ${artistString}`,
                    `amsearch:${item.title} ${artistString}`,
                    `jssearch:${item.title} ${artistString}`,
                    `scsearch:${item.title} ${artistString}`,
                ];

                for (const searchQuery of searchQueries) {
                    const track = await this.searchLavalink(searchQuery, requester);
                    if (track) {
                        tracks.push(track);
                        break;
                    }
                }
            }

            return {
                loadType: tracks.length > 0 ? "SEARCH" : "EMPTY",
                tracks: tracks,
                playlist: null,
            };
        } catch (error) {
            if (this.manager) {
                this.manager.emit("debug", `[SPOTIFY] Recommendations error: ${error.message}`);
            }
            return {
                loadType: "EMPTY",
                tracks: [],
                playlist: null,
            };
        }
    }

    /**
     * Fetches data from Spotify search endpoint
     * @param query The search query
     * @returns The Spotify search response
     */
    static async fetchSpotifySearch(query) {
        try {
            const response = await (0, axios_1.default)({
                method: "GET",
                url: `${this.SPOTIFY_API_ENDPOINT}/search`,
                params: { q: query },
            });
            return response.data;
        } catch (error) {
            if (this.manager) {
                this.manager.emit("debug", `[SPOTIFY] Fetch search error: ${error.message}`);
            }
            return null;
        }
    }

    /**
     * Fetches data from Spotify resolve endpoint
     * @param url The Spotify URL
     * @param limit Optional limit
     * @returns The Spotify resolve response
     */
    static async fetchSpotifyResolve(url, limit) {
        try {
            const params = { url };
            if (limit) {
                params.limit = limit;
            }
            const response = await (0, axios_1.default)({
                method: "GET",
                url: `${this.SPOTIFY_API_ENDPOINT}/resolve`,
                params: params,
            });
            return response.data;
        } catch (error) {
            if (this.manager) {
                this.manager.emit("debug", `[SPOTIFY] Fetch resolve error: ${error.message}`);
            }
            return null;
        }
    }

    /**
     * Fetches artist's top tracks from Spotify
     * @param artistId The artist ID
     * @returns The top tracks response
     */
    static async fetchArtistTopTracks(artistId) {
        try {
            const response = await (0, axios_1.default)({
                method: "GET",
                url: `${this.SPOTIFY_API_ENDPOINT}/artist-top-tracks`,
                params: { id: artistId },
            });
            return response.data;
        } catch (error) {
            if (this.manager) {
                this.manager.emit("debug", `[SPOTIFY] Fetch artist top tracks error: ${error.message}`);
            }
            return null;
        }
    }

    /**
     * Fetches recommendations from Spotify
     * @param url The Spotify track URL
     * @param limit Optional limit
     * @returns The recommendations response
     */
    static async fetchRecommendations(url, limit) {
        try {
            const params = { url };
            if (limit) {
                params.limit = limit;
            }
            const response = await (0, axios_1.default)({
                method: "GET",
                url: `${this.SPOTIFY_API_ENDPOINT}/recommendations`,
                params: params,
            });
            return response.data;
        } catch (error) {
            if (this.manager) {
                this.manager.emit("debug", `[SPOTIFY] Fetch recommendations error: ${error.message}`);
            }
            return null;
        }
    }

    /**
     * Searches Lavalink for a track
     * @param query The search query (with prefix)
     * @param requester The requester
     * @returns The found track or null
     */
    static async searchLavalink(query, requester) {
        if (!this.manager) {
            return null;
        }

        try {
            const node = this.manager.useableNode;
            if (!node) {
                return null;
            }

            const res = await node.rest.get(`/v4/loadtracks?identifier=${encodeURIComponent(query)}`);
            if (!res || !res.data || res.data.length === 0) {
                return null;
            }

            const Utils = require("../structures/Utils");
            return Utils.TrackUtils.build(res.data[0], requester);
        } catch (error) {
            if (this.manager) {
                this.manager.emit("debug", `[SPOTIFY] Lavalink search error for ${query}: ${error.message}`);
            }
            return null;
        }
    }
}

exports.SpotifyUtils = SpotifyUtils;
