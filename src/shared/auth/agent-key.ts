/** Starts every agent key, so a leaked one is easy to spot in logs and scanners. */
export const AGENT_KEY_PREFIX = "csops_";

/** Each key may make this many requests a minute. Matches the plugin's rateLimit. */
export const AGENT_KEY_REQUESTS_PER_MINUTE = 30;
