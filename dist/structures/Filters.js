"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailableFilters = exports.Filters = void 0;
const filtersEqualizers_1 = require("../utils/filtersEqualizers");
class Filters {
    distortion;
    equalizer;
    karaoke;
    player;
    rotation;
    timescale;
    vibrato;
    reverb;
    volume;
    bassBoostlevel;
    filtersStatus;
    constructor(player) {
        this.distortion = null;
        this.equalizer = [];
        this.karaoke = null;
        this.player = player;
        this.rotation = null;
        this.timescale = null;
        this.vibrato = null;
        this.volume = 1.0;
        this.bassBoostlevel = 0;
        // Initialize filter status
        this.filtersStatus = Object.values(AvailableFilters).reduce((acc, filter) => {
            acc[filter] = false;
            return acc;
        }, {});
    }
    /**
     * Updates the player's audio filters.
     *
     * This method sends a request to the player's node to update the filter settings
     * based on the current properties of the `Filters` instance. The filters include
     * distortion, equalizer, karaoke, rotation, timescale, vibrato, and volume. Once
     * the request is sent, it ensures that the player's audio output reflects the
     * changes in filter settings.
     *
     * @returns {Promise<this>} - Returns a promise that resolves to the current instance
     * of the Filters class for method chaining.
     */
    async updateFilters() {
        const { distortion, equalizer, karaoke, rotation, timescale, vibrato, volume } = this;
        await this.player.node.rest.updatePlayer({
            data: {
                filters: {
                    distortion,
                    equalizer,
                    karaoke,
                    rotation,
                    timescale,
                    vibrato,
                    volume,
                },
            },
            guildId: this.player.guildId,
        });
        return this;
    }
    /**
     * Applies a specific filter to the player.
     *
     * This method allows you to set the value of a specific filter property.
     * The filter property must be a valid key of the Filters object.
     *
     * @param {{ property: T; value: Filters[T] }} filter - An object containing the filter property and value.
     * @param {boolean} [updateFilters=true] - Whether to update the filters after applying the filter.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async applyFilter(filter, updateFilters = true) {
        this[filter.property] = filter.value;
        if (updateFilters) {
            await this.updateFilters();
        }
        return this;
    }
    /**
     * Sets the status of a specific filter.
     *
     * This method updates the filter status to either true or false, indicating whether
     * the filter is applied or not. This helps track which filters are active.
     *
     * @param {AvailableFilters} filter - The filter to update.
     * @param {boolean} status - The status to set (true for active, false for inactive).
     * @returns {this} - Returns the current instance of the Filters class for method chaining.
     */
    setFilterStatus(filter, status) {
        this.filtersStatus[filter] = status;
        return this;
    }
    /**
     * Retrieves the status of a specific filter.
     *
     * This method returns whether a specific filter is currently applied or not.
     *
     * @param {AvailableFilters} filter - The filter to check.
     * @returns {boolean} - Returns true if the filter is active, false otherwise.
     */
    getFilterStatus(filter) {
        return this.filtersStatus[filter];
    }
    /**
     * Clears all filters applied to the audio.
     *
     * This method resets all filter settings to their default values and removes any
     * active filters from the player.
     *
     * @returns {this} - Returns the current instance of the Filters class for method chaining.
     */
    async clearFilters() {
        this.filtersStatus = Object.values(AvailableFilters).reduce((acc, filter) => {
            acc[filter] = false;
            return acc;
        }, {});
        this.player.filters = new Filters(this.player);
        await this.setEqualizer([]);
        await this.setDistortion(null);
        await this.setKaraoke(null);
        await this.setRotation(null);
        await this.setTimescale(null);
        await this.setVibrato(null);
        await this.updateFilters();
        return this;
    }
    /**
     * Sets the own equalizer bands on the audio.
     *
     * This method adjusts the equalization curve of the player's audio output,
     * allowing you to control the frequency response.
     *
     * @param {Band[]} [bands] - The equalizer bands to apply (band, gain).
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async setEqualizer(bands) {
        return await this.applyFilter({ property: "equalizer", value: bands });
    }
    /**
     * Sets the own karaoke options to the audio.
     *
     * This method adjusts the audio so that it sounds like a karaoke song, with the
     * original vocals removed. Note that not all songs can be successfully made into
     * karaoke tracks, and some tracks may not sound as good.
     *
     * @param {karaokeOptions} [karaoke] - The karaoke settings to apply (level, monoLevel, filterBand, filterWidth).
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async setKaraoke(karaoke) {
        const result = await this.applyFilter({ property: "karaoke", value: karaoke ?? null });
        return karaoke
            ? result.setFilterStatus(AvailableFilters.SetKaraoke, true)
            : (await this.applyFilter({ property: "karaoke", value: null })).setFilterStatus(AvailableFilters.SetKaraoke, false);
    }
    /**
     * Sets the own timescale options to the audio.
     *
     * This method adjusts the speed and pitch of the audio, allowing you to control the playback speed.
     *
     * @param {timescaleOptions} [timescale] - The timescale settings to apply (speed and pitch).
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async setTimescale(timescale) {
        const result = await this.applyFilter({ property: "timescale", value: timescale ?? null });
        return timescale
            ? result.setFilterStatus(AvailableFilters.SetTimescale, true)
            : (await this.applyFilter({ property: "timescale", value: null })).setFilterStatus(AvailableFilters.SetTimescale, false);
    }
    /**
     * Sets the own vibrato options to the audio.
     *
     * This method applies a vibrato effect to the audio, which adds a wavering,
     * pulsing quality to the sound. The effect is created by rapidly varying the
     * pitch of the audio.
     *
     * @param {vibratoOptions} [vibrato] - The vibrato settings to apply (frequency, depth).
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async setVibrato(vibrato) {
        const result = await this.applyFilter({ property: "vibrato", value: vibrato ?? null });
        return vibrato
            ? result.setFilterStatus(AvailableFilters.Vibrato, true)
            : (await this.applyFilter({ property: "vibrato", value: null })).setFilterStatus(AvailableFilters.Vibrato, false);
    }
    /**
     * Sets the own rotation options effect to the audio.
     *
     * This method applies a rotation effect to the audio, which simulates the sound
     * moving around the listener's head. This effect can create a dynamic and immersive
     * audio experience by altering the directionality of the sound.
     *
     * @param {rotationOptions} [rotation] - The rotation settings to apply (rotationHz).
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async setRotation(rotation) {
        const result = await this.applyFilter({ property: "rotation", value: rotation ?? null });
        return rotation
            ? result.setFilterStatus(AvailableFilters.SetRotation, true)
            : (await this.applyFilter({ property: "rotation", value: null })).setFilterStatus(AvailableFilters.SetRotation, false);
    }
    /**
     * Sets the own distortion options effect to the audio.
     *
     * This method applies a distortion effect to the audio, which adds a rougher,
     * more intense quality to the sound. The effect is created by altering the
     * audio signal to create a more jagged, irregular waveform.
     *
     * @param {distortionOptions} [distortion] - The distortion settings to apply (sinOffset, sinScale, cosOffset, cosScale, tanOffset, tanScale, offset, scale).
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async setDistortion(distortion) {
        const result = await this.applyFilter({ property: "distortion", value: distortion ?? null });
        return distortion
            ? result.setFilterStatus(AvailableFilters.SetDistortion, true)
            : (await this.applyFilter({ property: "distortion", value: null })).setFilterStatus(AvailableFilters.SetDistortion, false);
    }
    /**
     * Sets the bass boost level on the audio.
     *
     * This method scales the gain of a predefined equalizer curve to the specified level.
     * The curve is designed to emphasize or reduce low frequencies, creating a bass-heavy
     * or bass-reduced effect.
     *
     * @param {number} level - The level of bass boost to apply. The value ranges from -3 to 3,
     *                         where negative values reduce bass, 0 disables the effect,
     *                         and positive values increase bass.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     *
     * @example
     * // Apply different levels of bass boost or reduction:
     * await player.bassBoost(3);  // Maximum Bass Boost
     * await player.bassBoost(2);  // Medium Bass Boost
     * await player.bassBoost(1);  // Mild Bass Boost
     * await player.bassBoost(0);  // No Effect (Disabled)
     * await player.bassBoost(-1); // Mild Bass Reduction
     * await player.bassBoost(-2); // Medium Bass Reduction
     * await player.bassBoost(-3); // Maximum Bass Removal
     */
    async bassBoost(stage) {
        // Ensure stage is between -3 and 3
        stage = Math.max(-3, Math.min(3, stage));
        // Map stage (-3 to 3) to range (-1.0 to 1.0)
        const level = stage / 3; // Converts -3 to 3 → -1.0 to 1.0
        // Generate a dynamic equalizer by scaling bassBoostEqualizer
        const equalizer = filtersEqualizers_1.bassBoostEqualizer.map((band) => ({
            band: band.band,
            gain: band.gain * level, // Scale the gain dynamically
        }));
        await this.applyFilter({ property: "equalizer", value: equalizer });
        this.setFilterStatus(AvailableFilters.BassBoost, stage !== 0); // Active if stage is not 0
        this.bassBoostlevel = stage;
        return this;
    }
    /**
     * Toggles the chipmunk effect on the audio.
     *
     * This method applies or removes a chipmunk effect by adjusting the timescale settings.
     * When enabled, it increases the speed, pitch, and rate of the audio, resulting in a high-pitched, fast playback
     * similar to the sound of a chipmunk.
     *
     * @param {boolean} status - Whether to enable or disable the chipmunk effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async chipmunk(status) {
        const result = await this.applyFilter({ property: "timescale", value: status ? { speed: 1.5, pitch: 1.5, rate: 1.5 } : null });
        return status
            ? result.setFilterStatus(AvailableFilters.Chipmunk, true)
            : (await this.applyFilter({ property: "timescale", value: null })).setFilterStatus(AvailableFilters.Chipmunk, false);
    }
    /**
     * Toggles the "China" effect on the audio.
     *
     * This method applies or removes a filter that reduces the pitch of the audio by half,
     * without changing the speed or rate. This creates a "hollow" or "echoey" sound.
     *
     * @param {boolean} status - Whether to enable or disable the "China" effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async china(status) {
        const result = await this.applyFilter({ property: "timescale", value: status ? { speed: 1.0, pitch: 0.5, rate: 1.0 } : null });
        return status
            ? result.setFilterStatus(AvailableFilters.China, true)
            : (await this.applyFilter({ property: "timescale", value: null })).setFilterStatus(AvailableFilters.China, false);
    }
    /**
     * Toggles the 8D audio effect on the audio.
     *
     * This method applies or removes an 8D audio effect by adjusting the rotation settings.
     * When enabled, it creates a sensation of the audio moving around the listener's head,
     * providing an immersive audio experience.
     *
     * @param {boolean} status - Whether to enable or disable the 8D effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async eightD(status) {
        const result = await this.applyFilter({ property: "rotation", value: status ? { rotationHz: 0.2 } : null });
        return status
            ? result.setFilterStatus(AvailableFilters.EightD, true)
            : (await this.applyFilter({ property: "rotation", value: null })).setFilterStatus(AvailableFilters.EightD, false);
    }
    /**
     * Toggles the nightcore effect on the audio.
     *
     * This method applies or removes a nightcore effect by adjusting the timescale settings.
     * When enabled, it increases the speed and pitch of the audio, giving it a more
     * upbeat and energetic feel.
     *
     * @param {boolean} status - Whether to enable or disable the nightcore effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async nightcore(status) {
        const result = await this.applyFilter({ property: "timescale", value: status ? { speed: 1.1, pitch: 1.125, rate: 1.05 } : null });
        return status
            ? result.setFilterStatus(AvailableFilters.Nightcore, true)
            : (await this.applyFilter({ property: "timescale", value: null })).setFilterStatus(AvailableFilters.Nightcore, false);
    }
    /**
     * Toggles the slowmo effect on the audio.
     *
     * This method applies or removes a slowmo effect by adjusting the timescale settings.
     * When enabled, it slows down the audio while keeping the pitch the same, giving it
     * a more relaxed and calming feel.
     *
     * @param {boolean} status - Whether to enable or disable the slowmo effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async slowmo(status) {
        const result = await this.applyFilter({ property: "timescale", value: status ? { speed: 0.7, pitch: 1.0, rate: 0.8 } : null });
        return status
            ? result.setFilterStatus(AvailableFilters.Slowmo, true)
            : (await this.applyFilter({ property: "timescale", value: null })).setFilterStatus(AvailableFilters.Slowmo, false);
    }
    /**
     * Toggles a soft equalizer effect to the audio.
     *
     * This method applies or removes a soft equalizer effect by adjusting the equalizer settings.
     * When enabled, it reduces the bass and treble frequencies, giving the audio a softer and more
     * mellow sound.
     *
     * @param {boolean} status - Whether to enable or disable the soft equalizer effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async soft(status) {
        const result = await this.applyFilter({ property: "equalizer", value: status ? filtersEqualizers_1.softEqualizer : [] });
        return status
            ? result.setFilterStatus(AvailableFilters.Soft, true)
            : (await this.applyFilter({ property: "equalizer", value: [] })).setFilterStatus(AvailableFilters.Soft, false);
    }
    /**
     * Toggles the TV equalizer effect on the audio.
     *
     * This method applies or removes a TV equalizer effect by adjusting the equalizer settings.
     * When enabled, it enhances specific frequency bands to mimic the audio characteristics
     * typically found in television audio outputs.
     *
     * @param {boolean} status - Whether to enable or disable the TV equalizer effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async tv(status) {
        const result = await this.applyFilter({ property: "equalizer", value: status ? filtersEqualizers_1.tvEqualizer : [] });
        return status
            ? result.setFilterStatus(AvailableFilters.TV, true)
            : (await this.applyFilter({ property: "equalizer", value: [] })).setFilterStatus(AvailableFilters.TV, false);
    }
    /**
     * Toggles the treble/bass equalizer effect on the audio.
     *
     * This method applies or removes a treble/bass equalizer effect by adjusting the equalizer settings.
     * When enabled, it enhances the treble and bass frequencies, giving the audio a more balanced sound.
     *
     * @param {boolean} status - Whether to enable or disable the treble/bass equalizer effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async trebleBass(status) {
        const result = await this.applyFilter({ property: "equalizer", value: status ? filtersEqualizers_1.trebleBassEqualizer : [] });
        return status
            ? result.setFilterStatus(AvailableFilters.TrebleBass, true)
            : (await this.applyFilter({ property: "equalizer", value: [] })).setFilterStatus(AvailableFilters.TrebleBass, false);
    }
    /**
     * Toggles the vaporwave effect on the audio.
     *
     * This method applies or removes a vaporwave effect by adjusting the equalizer settings.
     * When enabled, it gives the audio a dreamy and nostalgic feel, characteristic of the vaporwave genre.
     *
     * @param {boolean} status - Whether to enable or disable the vaporwave effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async vaporwave(status) {
        const result = await this.applyFilter({ property: "equalizer", value: status ? filtersEqualizers_1.vaporwaveEqualizer : [] });
        return status
            ? result.setFilterStatus(AvailableFilters.Vaporwave, true)
            : (await this.applyFilter({ property: "equalizer", value: [] })).setFilterStatus(AvailableFilters.Vaporwave, false);
    }
    /**
     * Toggles the distortion effect on the audio.
     *
     * This method applies or removes a distortion effect by adjusting the distortion settings.
     * When enabled, it adds a rougher, more intense quality to the sound by altering the
     * audio signal to create a more jagged, irregular waveform.
     *
     * @param {boolean} status - Whether to enable or disable the distortion effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async distort(status) {
        return status
            ? this.setDistortion({
                sinOffset: 0,
                sinScale: 0.2,
                cosOffset: 0,
                cosScale: 0.2,
                tanOffset: 0,
                tanScale: 0.2,
                offset: 0,
                scale: 1.2,
            }).then((result) => result.setFilterStatus(AvailableFilters.Distort, true))
            : this.setDistortion().then((result) => result.setFilterStatus(AvailableFilters.Distort, false));
    }
    /**
     * Toggles the party effect on the audio.
     *
     * This method applies or removes a party effect by adjusting the equalizer settings.
     * When enabled, it enhances the bass and treble frequencies, providing a more energetic and lively sound.
     *
     * @param {boolean} status - Whether to enable or disable the party effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async pop(status) {
        const result = await this.applyFilter({ property: "equalizer", value: status ? filtersEqualizers_1.popEqualizer : [] });
        return status
            ? result.setFilterStatus(AvailableFilters.Pop, true)
            : (await this.applyFilter({ property: "equalizer", value: [] })).setFilterStatus(AvailableFilters.Pop, false);
    }
    /**
     * Toggles a party effect on the audio.
     *
     * This method applies a party effect to audio.
     * @param {boolean} status - Whether to enable or disable the party effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async party(status) {
        const result = await this.applyFilter({ property: "equalizer", value: status ? filtersEqualizers_1.popEqualizer : [] });
        return status
            ? result.setFilterStatus(AvailableFilters.Party, true)
            : (await this.applyFilter({ property: "equalizer", value: [] })).setFilterStatus(AvailableFilters.Party, false);
    }
    /**
     * Toggles earrape effect on the audio.
     *
     * This method applies earrape effect to audio.
     * @param {boolean} status - Whether to enable or disable the earrape effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async earrape(status) {
        if (status) {
            await this.player.setVolume(200);
            return this.setFilterStatus(AvailableFilters.Earrape, true);
        }
        else {
            await this.player.setVolume(100);
            return this.setFilterStatus(AvailableFilters.Earrape, false);
        }
    }
    /**
     * Toggles electronic effect on the audio.
     *
     * This method applies electronic effect to audio.
     * @param {boolean} status - Whether to enable or disable the electronic effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async electronic(status) {
        const result = await this.applyFilter({ property: "equalizer", value: status ? filtersEqualizers_1.electronicEqualizer : [] });
        return status
            ? result.setFilterStatus(AvailableFilters.Electronic, true)
            : (await this.applyFilter({ property: "equalizer", value: [] })).setFilterStatus(AvailableFilters.Electronic, false);
    }
    /**
     * Toggles radio effect on the audio.
     *
     * This method applies radio effect to audio.
     * @param {boolean} status - Whether to enable or disable the radio effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async radio(status) {
        const result = await this.applyFilter({ property: "equalizer", value: status ? filtersEqualizers_1.radioEqualizer : [] });
        return status
            ? result.setFilterStatus(AvailableFilters.Radio, true)
            : (await this.applyFilter({ property: "equalizer", value: [] })).setFilterStatus(AvailableFilters.Radio, false);
    }
    /**
     * Toggles a tremolo effect on the audio.
     *
     * This method applies a tremolo effect to audio.
     * @param {boolean} status - Whether to enable or disable the tremolo effect.
     * @returns {this} - Returns the current instance of the Filters class for method chaining.
     */
    async tremolo(status) {
        const result = await this.applyFilter({ property: "vibrato", value: status ? { frequency: 5, depth: 0.5 } : null });
        return status
            ? result.setFilterStatus(AvailableFilters.Tremolo, true)
            : (await this.applyFilter({ property: "vibrato", value: null })).setFilterStatus(AvailableFilters.Tremolo, false);
    }
    /**
     * Toggless a darthvader effect on the audio.
     *
     * This method applies a darthvader effect to audio.
     * @param {boolean} status - Whether to enable or disable the darthvader effect.
     * @returns {this} - Returns the current instance of the Filters class for method chaining.
     */
    async darthvader(status) {
        const result = await this.applyFilter({ property: "timescale", value: status ? { speed: 1.0, pitch: 0.5, rate: 1.0 } : null });
        return status
            ? result.setFilterStatus(AvailableFilters.Darthvader, true)
            : (await this.applyFilter({ property: "timescale", value: null })).setFilterStatus(AvailableFilters.Darthvader, false);
    }
    /**
     * Toggles a daycore effect on the audio.
     *
     * This method applies a daycore effect to audio.
     * @param {boolean} status - Whether to enable or disable the daycore effect.
     * @returns {this} - Returns the current instance of the Filters class for method chaining.
     */
    async daycore(status) {
        const result = await this.applyFilter({ property: "timescale", value: status ? { speed: 0.7, pitch: 0.8, rate: 0.8 } : null });
        return status
            ? result.setFilterStatus(AvailableFilters.Daycore, true)
            : (await this.applyFilter({ property: "timescale", value: null })).setFilterStatus(AvailableFilters.Daycore, false);
    }
    /**
     * Toggles a doubletime effect on the audio.
     *
     * This method applies a doubletime effect to audio.
     * @param {boolean} status - Whether to enable or disable the doubletime effect.
     * @returns {this} - Returns the current instance of the Filters class for method chaining
     */
    async doubletime(status) {
        const result = await this.applyFilter({ property: "timescale", value: status ? { speed: 2.0, pitch: 1.0, rate: 2.0 } : null });
        return status
            ? result.setFilterStatus(AvailableFilters.Doubletime, true)
            : (await this.applyFilter({ property: "timescale", value: null })).setFilterStatus(AvailableFilters.Doubletime, false);
    }
    /**
     * Toggles the demon effect on the audio.
     *
     * This method applies or removes a demon effect by adjusting the equalizer,
     * timescale, and reverb settings. When enabled, it creates a deeper and more
     * intense sound by lowering the pitch and adding reverb to the audio.
     *
     * @param {boolean} status - Whether to enable or disable the demon effect.
     * @returns {Promise<this>} - Returns the current instance of the Filters class for method chaining.
     */
    async demon(status) {
        const filters = status
            ? {
                equalizer: filtersEqualizers_1.demonEqualizer,
                timescale: { pitch: 0.8 },
                reverb: { wet: 0.7, dry: 0.3, roomSize: 0.8, damping: 0.5 },
            }
            : {
                equalizer: [],
                timescale: null,
                reverb: null,
            };
        await Promise.all(Object.entries(filters).map(([property, value]) => this.applyFilter({ property: property, value })));
        this.setFilterStatus(AvailableFilters.Demon, status);
        return this;
    }
}
exports.Filters = Filters;
var AvailableFilters;
(function (AvailableFilters) {
    AvailableFilters["BassBoost"] = "bassboost";
    AvailableFilters["Distort"] = "distort";
    AvailableFilters["SetDistortion"] = "setDistortion";
    AvailableFilters["EightD"] = "eightD";
    AvailableFilters["SetKaraoke"] = "setKaraoke";
    AvailableFilters["Nightcore"] = "nightcore";
    AvailableFilters["Slowmo"] = "slowmo";
    AvailableFilters["Soft"] = "soft";
    AvailableFilters["TrebleBass"] = "trebleBass";
    AvailableFilters["SetTimescale"] = "setTimescale";
    AvailableFilters["TV"] = "tv";
    AvailableFilters["Vibrato"] = "vibrato";
    AvailableFilters["Vaporwave"] = "vaporwave";
    AvailableFilters["Pop"] = "pop";
    AvailableFilters["Party"] = "party";
    AvailableFilters["Earrape"] = "earrape";
    AvailableFilters["Electronic"] = "electronic";
    AvailableFilters["Radio"] = "radio";
    AvailableFilters["SetRotation"] = "setRotation";
    AvailableFilters["Tremolo"] = "tremolo";
    AvailableFilters["China"] = "china";
    AvailableFilters["Chipmunk"] = "chipmunk";
    AvailableFilters["Darthvader"] = "darthvader";
    AvailableFilters["Daycore"] = "daycore";
    AvailableFilters["Doubletime"] = "doubletime";
    AvailableFilters["Demon"] = "demon";
})(AvailableFilters || (exports.AvailableFilters = AvailableFilters = {}));
