"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonEqualizer = exports.radioEqualizer = exports.electronicEqualizer = exports.popEqualizer = exports.vaporwaveEqualizer = exports.trebleBassEqualizer = exports.tvEqualizer = exports.softEqualizer = exports.bassBoostEqualizer = void 0;
exports.bassBoostEqualizer = [
    { band: 0, gain: 0.2 },
    { band: 1, gain: 0.15 },
    { band: 2, gain: 0.1 },
    { band: 3, gain: 0.05 },
    { band: 4, gain: 0.0 },
    { band: 5, gain: -0.05 },
    { band: 6, gain: -0.1 },
    { band: 7, gain: -0.1 },
    { band: 8, gain: -0.1 },
    { band: 9, gain: -0.1 },
    { band: 10, gain: -0.1 },
    { band: 11, gain: -0.1 },
    { band: 12, gain: -0.1 },
    { band: 13, gain: -0.1 },
    { band: 14, gain: -0.1 },
];
exports.softEqualizer = [
    { band: 0, gain: 0 },
    { band: 1, gain: 0 },
    { band: 2, gain: 0 },
    { band: 3, gain: 0 },
    { band: 4, gain: 0 },
    { band: 5, gain: 0 },
    { band: 6, gain: 0 },
    { band: 7, gain: 0 },
    { band: 8, gain: -0.25 },
    { band: 9, gain: -0.25 },
    { band: 10, gain: -0.25 },
    { band: 11, gain: -0.25 },
    { band: 12, gain: -0.25 },
    { band: 13, gain: -0.25 },
];
exports.tvEqualizer = [
    { band: 0, gain: 0 },
    { band: 1, gain: 0 },
    { band: 2, gain: 0 },
    { band: 3, gain: 0 },
    { band: 4, gain: 0 },
    { band: 5, gain: 0 },
    { band: 6, gain: 0 },
    { band: 7, gain: 0.65 },
    { band: 8, gain: 0.65 },
    { band: 9, gain: 0.65 },
    { band: 10, gain: 0.65 },
    { band: 11, gain: 0.65 },
    { band: 12, gain: 0.65 },
    { band: 13, gain: 0.65 },
];
exports.trebleBassEqualizer = [
    { band: 0, gain: 0.6 },
    { band: 1, gain: 0.67 },
    { band: 2, gain: 0.67 },
    { band: 3, gain: 0 },
    { band: 4, gain: -0.5 },
    { band: 5, gain: 0.15 },
    { band: 6, gain: -0.45 },
    { band: 7, gain: 0.23 },
    { band: 8, gain: 0.35 },
    { band: 9, gain: 0.45 },
    { band: 10, gain: 0.55 },
    { band: 11, gain: 0.6 },
    { band: 12, gain: 0.55 },
    { band: 13, gain: 0 },
];
exports.vaporwaveEqualizer = [
    { band: 0, gain: 0 },
    { band: 1, gain: 0 },
    { band: 2, gain: 0 },
    { band: 3, gain: 0 },
    { band: 4, gain: 0 },
    { band: 5, gain: 0 },
    { band: 6, gain: 0 },
    { band: 7, gain: 0 },
    { band: 8, gain: 0.15 },
    { band: 9, gain: 0.15 },
    { band: 10, gain: 0.15 },
    { band: 11, gain: 0.15 },
    { band: 12, gain: 0.15 },
    { band: 13, gain: 0.15 },
];
exports.popEqualizer = [
    { band: 0, gain: 0.5 },
    { band: 1, gain: 1.5 },
    { band: 2, gain: 2 },
    { band: 3, gain: 1.5 },
];
exports.electronicEqualizer = [
    { band: 0, gain: 1.0 },
    { band: 1, gain: 2.0 },
    { band: 2, gain: 3.0 },
    { band: 3, gain: 2.5 },
];
exports.radioEqualizer = [
    { band: 0, gain: 3.0 },
    { band: 1, gain: 3.0 },
    { band: 2, gain: 1.0 },
    { band: 3, gain: 0.5 },
];
exports.demonEqualizer = [
    { band: 1, gain: -0.6 },
    { band: 3, gain: -0.6 },
    { band: 5, gain: -0.6 },
];
