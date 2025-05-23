"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = nodeCheck;
/**
 * Validates the provided NodeOptions object.
 * @param options - The options to validate.
 * @throws {TypeError} Throws if any required option is missing or invalid.
 */
function nodeCheck(options) {
    // If the options are empty, throw an error.
    if (!options)
        throw new TypeError("NodeOptions must not be empty.");
    // Validate the host option
    // The host option must be present and be a non-empty string.
    const { host, identifier, password, port, enableSessionResumeOption, sessionTimeoutMs, maxRetryAttempts, retryDelayMs, useSSL, nodePriority } = options;
    if (typeof host !== "string" || !/.+/.test(host)) {
        throw new TypeError('Node option "host" must be present and be a non-empty string.');
    }
    // Validate the identifier option
    // The identifier option must be a non-empty string or undefined.
    if (typeof identifier !== "undefined" && typeof identifier !== "string") {
        throw new TypeError('Node option "identifier" must be a non-empty string.');
    }
    // Validate the password option
    // The password option must be a non-empty string or undefined.
    if (typeof password !== "undefined" && (typeof password !== "string" || !/.+/.test(password))) {
        throw new TypeError('Node option "password" must be a non-empty string.');
    }
    // Validate the port option
    // The port option must be a number or undefined.
    if (typeof port !== "undefined" && typeof port !== "number") {
        throw new TypeError('Node option "port" must be a number.');
    }
    // Validate the enableSessionResumeOption option
    // The enableSessionResumeOption option must be a boolean or undefined.
    if (typeof enableSessionResumeOption !== "undefined" && typeof enableSessionResumeOption !== "boolean") {
        throw new TypeError('Node option "enableSessionResumeOption" must be a boolean.');
    }
    // Validate the sessionTimeoutMs option
    // The sessionTimeoutMs option must be a number or undefined.
    if (typeof sessionTimeoutMs !== "undefined" && typeof sessionTimeoutMs !== "number") {
        throw new TypeError('Node option "sessionTimeoutMs" must be a number.');
    }
    // Validate the maxRetryAttempts option
    // The maxRetryAttempts option must be a number or undefined.
    if (typeof maxRetryAttempts !== "undefined" && typeof maxRetryAttempts !== "number") {
        throw new TypeError('Node option "maxRetryAttempts" must be a number.');
    }
    // Validate the retryDelayMs option
    // The retryDelayMs option must be a number or undefined.
    if (typeof retryDelayMs !== "undefined" && typeof retryDelayMs !== "number") {
        throw new TypeError('Node option "retryDelayMs" must be a number.');
    }
    // Validate the useSSL option
    // The useSSL option must be a boolean or undefined.
    if (typeof useSSL !== "undefined" && typeof useSSL !== "boolean") {
        throw new TypeError('Node option "useSSL" must be a boolean.');
    }
    // Validate the nodePriority option
    // The nodePriority option must be a number or undefined.
    if (typeof nodePriority !== "undefined" && typeof nodePriority !== "number") {
        throw new TypeError('Node option "nodePriority" must be a number.');
    }
}
