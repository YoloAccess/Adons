/**
 * AutoEmbed Provider
 * Provides Hindi and multi-language embed streams from autoembed.cc
 * Supports movies and TV series with Hindi dubbing options
 */

const axios = require('axios');

const AUTOEMBED_BASE_URL = 'https://player.autoembed.cc';

// Language configurations with display properties
const LANGUAGE_OPTIONS = {
    'hindi': {
        label: 'Hindi',
        emoji: '🇮🇳',
        code: 'hi',
        priority: 1
    },
    'english': {
        label: 'English',
        emoji: '🇺🇸',
        code: 'en',
        priority: 2
    },
    'tamil': {
        label: 'Tamil',
        emoji: '🇮🇳',
        code: 'ta',
        priority: 3
    },
    'telugu': {
        label: 'Telugu',
        emoji: '🇮🇳',
        code: 'te',
        priority: 4
    }
};

/**
 * Build AutoEmbed URL for movies
 * @param {string} tmdbId - TMDB ID of the movie
 * @param {Object} options - Optional parameters
 * @returns {string} Embed URL
 */
function buildMovieEmbedUrl(tmdbId, options = {}) {
    let baseUrl = `${AUTOEMBED_BASE_URL}/embed/movie/${tmdbId}`;
    const params = new URLSearchParams();

    // Add language parameter for Hindi
    if (options.language) params.append('language', options.language);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Build AutoEmbed URL for TV series
 * @param {string} tmdbId - TMDB ID of the series
 * @param {number} season - Season number
 * @param {number} episode - Episode number
 * @param {Object} options - Optional parameters
 * @returns {string} Embed URL
 */
function buildSeriesEmbedUrl(tmdbId, season, episode, options = {}) {
    let baseUrl = `${AUTOEMBED_BASE_URL}/embed/tv/${tmdbId}/${season}/${episode}`;
    const params = new URLSearchParams();

    // Add language parameter for Hindi
    if (options.language) params.append('language', options.language);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Get AutoEmbed movie streams with Hindi and other language options
 * @param {string} tmdbId - TMDB ID of the movie
 * @returns {Promise<Array>} Array of stream objects
 */
async function getAutoEmbedMovieStreams(tmdbId) {
    console.log(`[AutoEmbed] Fetching Hindi/multi-language movie streams for TMDB: ${tmdbId}`);

    if (!tmdbId) {
        console.log('[AutoEmbed] No TMDB ID provided, skipping');
        return [];
    }

    const streams = [];

    try {
        // Hindi Stream (Priority)
        const urlHindi = buildMovieEmbedUrl(tmdbId, { language: 'hi' });
        streams.push({
            name: 'Nuvio | AutoEmbed',
            title: `${LANGUAGE_OPTIONS['hindi'].emoji} AutoEmbed • Hindi Dubbed • HD`,
            quality: '1080p',
            language: 'Hindi',
            externalUrl: urlHindi,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': AUTOEMBED_BASE_URL
                    }
                }
            }
        });

        // English Stream
        const urlEnglish = buildMovieEmbedUrl(tmdbId, { language: 'en' });
        streams.push({
            name: 'Nuvio | AutoEmbed',
            title: `${LANGUAGE_OPTIONS['english'].emoji} AutoEmbed • English • HD`,
            quality: '1080p',
            language: 'English',
            externalUrl: urlEnglish,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': AUTOEMBED_BASE_URL
                    }
                }
            }
        });

        // Tamil Stream
        const urlTamil = buildMovieEmbedUrl(tmdbId, { language: 'ta' });
        streams.push({
            name: 'Nuvio | AutoEmbed',
            title: `${LANGUAGE_OPTIONS['tamil'].emoji} AutoEmbed • Tamil • HD`,
            quality: '1080p',
            language: 'Tamil',
            externalUrl: urlTamil,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': AUTOEMBED_BASE_URL
                    }
                }
            }
        });

        // Telugu Stream
        const urlTelugu = buildMovieEmbedUrl(tmdbId, { language: 'te' });
        streams.push({
            name: 'Nuvio | AutoEmbed',
            title: `${LANGUAGE_OPTIONS['telugu'].emoji} AutoEmbed • Telugu • HD`,
            quality: '1080p',
            language: 'Telugu',
            externalUrl: urlTelugu,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': AUTOEMBED_BASE_URL
                    }
                }
            }
        });

        // Default/Auto Stream (best available)
        const urlAuto = buildMovieEmbedUrl(tmdbId);
        streams.push({
            name: 'Nuvio | AutoEmbed',
            title: `⚡ AutoEmbed • Auto (Best Available)`,
            quality: '1080p',
            language: 'Multi',
            externalUrl: urlAuto,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': AUTOEMBED_BASE_URL
                    }
                }
            }
        });

        console.log(`[AutoEmbed] Found ${streams.length} movie streams (Hindi, English, Tamil, Telugu)`);
    } catch (error) {
        console.error(`[AutoEmbed] Error fetching movie streams: ${error.message}`);
    }

    return streams;
}

/**
 * Get AutoEmbed series streams with Hindi and other language options
 * @param {string} tmdbId - TMDB ID of the series
 * @param {number} season - Season number
 * @param {number} episode - Episode number
 * @returns {Promise<Array>} Array of stream objects
 */
async function getAutoEmbedSeriesStreams(tmdbId, season, episode) {
    console.log(`[AutoEmbed] Fetching Hindi/multi-language series streams for TMDB: ${tmdbId} S${season}E${episode}`);

    if (!tmdbId) {
        console.log('[AutoEmbed] No TMDB ID provided, skipping');
        return [];
    }

    const streams = [];
    const episodeTag = `S${season}E${episode}`;

    try {
        // Hindi Stream (Priority)
        const urlHindi = buildSeriesEmbedUrl(tmdbId, season, episode, { language: 'hi' });
        streams.push({
            name: 'Nuvio | AutoEmbed',
            title: `${LANGUAGE_OPTIONS['hindi'].emoji} AutoEmbed • Hindi • ${episodeTag}`,
            quality: '1080p',
            language: 'Hindi',
            externalUrl: urlHindi,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': AUTOEMBED_BASE_URL
                    }
                }
            }
        });

        // English Stream
        const urlEnglish = buildSeriesEmbedUrl(tmdbId, season, episode, { language: 'en' });
        streams.push({
            name: 'Nuvio | AutoEmbed',
            title: `${LANGUAGE_OPTIONS['english'].emoji} AutoEmbed • English • ${episodeTag}`,
            quality: '1080p',
            language: 'English',
            externalUrl: urlEnglish,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': AUTOEMBED_BASE_URL
                    }
                }
            }
        });

        // Tamil Stream
        const urlTamil = buildSeriesEmbedUrl(tmdbId, season, episode, { language: 'ta' });
        streams.push({
            name: 'Nuvio | AutoEmbed',
            title: `${LANGUAGE_OPTIONS['tamil'].emoji} AutoEmbed • Tamil • ${episodeTag}`,
            quality: '1080p',
            language: 'Tamil',
            externalUrl: urlTamil,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': AUTOEMBED_BASE_URL
                    }
                }
            }
        });

        // Telugu Stream
        const urlTelugu = buildSeriesEmbedUrl(tmdbId, season, episode, { language: 'te' });
        streams.push({
            name: 'Nuvio | AutoEmbed',
            title: `${LANGUAGE_OPTIONS['telugu'].emoji} AutoEmbed • Telugu • ${episodeTag}`,
            quality: '1080p',
            language: 'Telugu',
            externalUrl: urlTelugu,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': AUTOEMBED_BASE_URL
                    }
                }
            }
        });

        // Default/Auto Stream
        const urlAuto = buildSeriesEmbedUrl(tmdbId, season, episode);
        streams.push({
            name: 'Nuvio | AutoEmbed',
            title: `⚡ AutoEmbed • Auto • ${episodeTag}`,
            quality: '1080p',
            language: 'Multi',
            externalUrl: urlAuto,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': AUTOEMBED_BASE_URL
                    }
                }
            }
        });

        console.log(`[AutoEmbed] Found ${streams.length} series streams (Hindi, English, Tamil, Telugu)`);
    } catch (error) {
        console.error(`[AutoEmbed] Error fetching series streams: ${error.message}`);
    }

    return streams;
}

/**
 * Main function to get AutoEmbed streams
 * @param {string} tmdbId - TMDB ID
 * @param {string} type - 'movie' or 'series'
 * @param {number} season - Season number (for series)
 * @param {number} episode - Episode number (for series)
 * @returns {Promise<Array>} Array of stream objects
 */
async function getAutoEmbedStreams(tmdbId, type, season = null, episode = null) {
    if (type === 'movie') {
        return getAutoEmbedMovieStreams(tmdbId);
    } else if ((type === 'series' || type === 'tv') && season && episode) {
        return getAutoEmbedSeriesStreams(tmdbId, season, episode);
    }

    console.log(`[AutoEmbed] Invalid request: type=${type}, season=${season}, episode=${episode}`);
    return [];
}

module.exports = {
    getAutoEmbedStreams,
    getAutoEmbedMovieStreams,
    getAutoEmbedSeriesStreams,
    buildMovieEmbedUrl,
    buildSeriesEmbedUrl,
    AUTOEMBED_BASE_URL,
    LANGUAGE_OPTIONS
};
