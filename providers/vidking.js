/**
 * VidKing Provider
 * Provides embed streams from vidking.net
 * Supports movies and TV series with various player features
 * Includes 4K and HDR quality options
 */

const axios = require('axios');

const VIDKING_BASE_URL = 'https://www.vidking.net';

// Quality configurations with their display properties
const QUALITY_OPTIONS = {
    '4k_hdr': {
        label: '4K HDR',
        emoji: '🌟',
        color: 'ffd700', // Gold for HDR
        priority: 1
    },
    '4k': {
        label: '4K',
        emoji: '✨',
        color: '8b5cf6', // Purple for 4K
        priority: 2
    },
    '1080p': {
        label: '1080p',
        emoji: '🎬',
        color: 'a1ff14', // Nuvio lime green
        priority: 3
    },
    '720p': {
        label: '720p',
        emoji: '📺',
        color: '00a3ff', // Blue
        priority: 4
    },
    'auto': {
        label: 'Auto',
        emoji: '⚡',
        color: '00c16e', // Green
        priority: 5
    }
};

/**
 * Player Event Data Structure (for reference):
 * {
 *   "type": "PLAYER_EVENT",
 *   "data": {
 *     "event": "timeupdate|play|pause|ended|seeked",
 *     "currentTime": 120.5,
 *     "duration": 7200,
 *     "progress": 1.6,
 *     "id": "299534",
 *     "mediaType": "movie",
 *     "season": 1,
 *     "episode": 8,
 *     "timestamp": 1640995200000
 *   }
 * }
 */

/**
 * Build VidKing embed URL for movies
 * @param {string} tmdbId - TMDB ID of the movie
 * @param {Object} options - Optional parameters
 * @returns {string} Embed URL
 */
function buildMovieEmbedUrl(tmdbId, options = {}) {
    const baseUrl = `${VIDKING_BASE_URL}/embed/movie/${tmdbId}`;
    const params = new URLSearchParams();

    // Add quality parameter if specified
    if (options.quality) params.append('quality', options.quality);
    if (options.hdr) params.append('hdr', 'true');

    // Add optional parameters
    if (options.color) params.append('color', options.color);
    if (options.autoPlay) params.append('autoPlay', 'true');
    if (options.progress) params.append('progress', options.progress.toString());

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Build VidKing embed URL for TV series
 * @param {string} tmdbId - TMDB ID of the series
 * @param {number} season - Season number
 * @param {number} episode - Episode number
 * @param {Object} options - Optional parameters
 * @returns {string} Embed URL
 */
function buildSeriesEmbedUrl(tmdbId, season, episode, options = {}) {
    const baseUrl = `${VIDKING_BASE_URL}/embed/tv/${tmdbId}/${season}/${episode}`;
    const params = new URLSearchParams();

    // Add quality parameter if specified
    if (options.quality) params.append('quality', options.quality);
    if (options.hdr) params.append('hdr', 'true');

    // Add optional parameters
    if (options.color) params.append('color', options.color);
    if (options.autoPlay) params.append('autoPlay', 'true');
    if (options.nextEpisode) params.append('nextEpisode', 'true');
    if (options.episodeSelector) params.append('episodeSelector', 'true');
    if (options.progress) params.append('progress', options.progress.toString());

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Verify if VidKing embed is available for a given TMDB ID
 * @param {string} tmdbId - TMDB ID
 * @param {string} type - 'movie' or 'series'
 * @returns {Promise<boolean>}
 */
async function verifyEmbedAvailable(tmdbId, type, season = null, episode = null) {
    try {
        let url;
        if (type === 'movie') {
            url = buildMovieEmbedUrl(tmdbId);
        } else {
            url = buildSeriesEmbedUrl(tmdbId, season || 1, episode || 1);
        }

        const response = await axios.head(url, {
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': VIDKING_BASE_URL
            },
            validateStatus: (status) => status < 500
        });

        return response.status === 200;
    } catch (error) {
        console.log(`[VidKing] Verification failed for ${tmdbId}: ${error.message}`);
        return true; // Return true anyway to provide the stream
    }
}

/**
 * Get VidKing streams for a movie with multiple quality options
 * @param {string} tmdbId - TMDB ID of the movie
 * @param {string} imdbId - IMDB ID (optional, for logging)
 * @returns {Promise<Array>} Array of stream objects
 */
async function getVidKingMovieStreams(tmdbId, imdbId = null) {
    console.log(`[VidKing] Fetching movie streams for TMDB: ${tmdbId}${imdbId ? ` (IMDB: ${imdbId})` : ''}`);

    if (!tmdbId) {
        console.log('[VidKing] No TMDB ID provided, skipping');
        return [];
    }

    const streams = [];

    try {
        // 4K HDR Stream (Premium quality)
        const url4kHdr = buildMovieEmbedUrl(tmdbId, {
            quality: '2160',
            hdr: true,
            autoPlay: true,
            color: QUALITY_OPTIONS['4k_hdr'].color
        });
        streams.push({
            name: 'Nuvio | VidKing',
            title: `${QUALITY_OPTIONS['4k_hdr'].emoji} VidKing • 4K HDR • Dolby Vision`,
            quality: '4K HDR',
            externalUrl: url4kHdr,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': VIDKING_BASE_URL
                    }
                }
            }
        });

        // 4K Stream (Ultra HD)
        const url4k = buildMovieEmbedUrl(tmdbId, {
            quality: '2160',
            autoPlay: true,
            color: QUALITY_OPTIONS['4k'].color
        });
        streams.push({
            name: 'Nuvio | VidKing',
            title: `${QUALITY_OPTIONS['4k'].emoji} VidKing • 4K UHD • 2160p`,
            quality: '4K',
            externalUrl: url4k,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': VIDKING_BASE_URL
                    }
                }
            }
        });

        // 1080p Full HD Stream
        const url1080p = buildMovieEmbedUrl(tmdbId, {
            quality: '1080',
            autoPlay: true,
            color: QUALITY_OPTIONS['1080p'].color
        });
        streams.push({
            name: 'Nuvio | VidKing',
            title: `${QUALITY_OPTIONS['1080p'].emoji} VidKing • 1080p • Full HD`,
            quality: '1080p',
            externalUrl: url1080p,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': VIDKING_BASE_URL
                    }
                }
            }
        });

        // 720p HD Stream
        const url720p = buildMovieEmbedUrl(tmdbId, {
            quality: '720',
            autoPlay: true,
            color: QUALITY_OPTIONS['720p'].color
        });
        streams.push({
            name: 'Nuvio | VidKing',
            title: `${QUALITY_OPTIONS['720p'].emoji} VidKing • 720p • HD`,
            quality: '720p',
            externalUrl: url720p,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': VIDKING_BASE_URL
                    }
                }
            }
        });

        // Auto Quality (adaptive streaming)
        const urlAuto = buildMovieEmbedUrl(tmdbId, {
            autoPlay: true,
            color: QUALITY_OPTIONS['auto'].color
        });
        streams.push({
            name: 'Nuvio | VidKing',
            title: `${QUALITY_OPTIONS['auto'].emoji} VidKing • Auto Quality`,
            quality: 'Auto',
            externalUrl: urlAuto,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': VIDKING_BASE_URL
                    }
                }
            }
        });

        console.log(`[VidKing] Found ${streams.length} movie streams (including 4K/HDR options)`);
    } catch (error) {
        console.error(`[VidKing] Error fetching movie streams: ${error.message}`);
    }

    return streams;
}

/**
 * Get VidKing streams for a TV series episode with multiple quality options
 * @param {string} tmdbId - TMDB ID of the series
 * @param {number} season - Season number
 * @param {number} episode - Episode number
 * @param {string} imdbId - IMDB ID (optional, for logging)
 * @returns {Promise<Array>} Array of stream objects
 */
async function getVidKingSeriesStreams(tmdbId, season, episode, imdbId = null) {
    console.log(`[VidKing] Fetching series streams for TMDB: ${tmdbId} S${season}E${episode}${imdbId ? ` (IMDB: ${imdbId})` : ''}`);

    if (!tmdbId) {
        console.log('[VidKing] No TMDB ID provided, skipping');
        return [];
    }

    const streams = [];
    const episodeTag = `S${season}E${episode}`;

    try {
        // 4K HDR Stream with all features
        const url4kHdr = buildSeriesEmbedUrl(tmdbId, season, episode, {
            quality: '2160',
            hdr: true,
            autoPlay: true,
            nextEpisode: true,
            episodeSelector: true,
            color: QUALITY_OPTIONS['4k_hdr'].color
        });
        streams.push({
            name: 'Nuvio | VidKing',
            title: `${QUALITY_OPTIONS['4k_hdr'].emoji} VidKing • 4K HDR • ${episodeTag}`,
            quality: '4K HDR',
            externalUrl: url4kHdr,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': VIDKING_BASE_URL
                    }
                }
            }
        });

        // 4K UHD Stream
        const url4k = buildSeriesEmbedUrl(tmdbId, season, episode, {
            quality: '2160',
            autoPlay: true,
            nextEpisode: true,
            episodeSelector: true,
            color: QUALITY_OPTIONS['4k'].color
        });
        streams.push({
            name: 'Nuvio | VidKing',
            title: `${QUALITY_OPTIONS['4k'].emoji} VidKing • 4K UHD • ${episodeTag}`,
            quality: '4K',
            externalUrl: url4k,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': VIDKING_BASE_URL
                    }
                }
            }
        });

        // 1080p Full HD Stream
        const url1080p = buildSeriesEmbedUrl(tmdbId, season, episode, {
            quality: '1080',
            autoPlay: true,
            nextEpisode: true,
            episodeSelector: true,
            color: QUALITY_OPTIONS['1080p'].color
        });
        streams.push({
            name: 'Nuvio | VidKing',
            title: `${QUALITY_OPTIONS['1080p'].emoji} VidKing • 1080p • ${episodeTag}`,
            quality: '1080p',
            externalUrl: url1080p,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': VIDKING_BASE_URL
                    }
                }
            }
        });

        // 720p HD Stream
        const url720p = buildSeriesEmbedUrl(tmdbId, season, episode, {
            quality: '720',
            autoPlay: true,
            nextEpisode: true,
            episodeSelector: true,
            color: QUALITY_OPTIONS['720p'].color
        });
        streams.push({
            name: 'Nuvio | VidKing',
            title: `${QUALITY_OPTIONS['720p'].emoji} VidKing • 720p • ${episodeTag}`,
            quality: '720p',
            externalUrl: url720p,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': VIDKING_BASE_URL
                    }
                }
            }
        });

        // Auto Quality with full features
        const urlAuto = buildSeriesEmbedUrl(tmdbId, season, episode, {
            autoPlay: true,
            nextEpisode: true,
            episodeSelector: true,
            color: QUALITY_OPTIONS['auto'].color
        });
        streams.push({
            name: 'Nuvio | VidKing',
            title: `${QUALITY_OPTIONS['auto'].emoji} VidKing • Auto • ${episodeTag}`,
            quality: 'Auto',
            externalUrl: urlAuto,
            behaviorHints: {
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        'Referer': VIDKING_BASE_URL
                    }
                }
            }
        });

        console.log(`[VidKing] Found ${streams.length} series streams (including 4K/HDR options)`);
    } catch (error) {
        console.error(`[VidKing] Error fetching series streams: ${error.message}`);
    }

    return streams;
}

/**
 * Main function to get VidKing streams
 * @param {string} tmdbId - TMDB ID
 * @param {string} type - 'movie' or 'series'
 * @param {number} season - Season number (for series)
 * @param {number} episode - Episode number (for series)
 * @param {string} imdbId - IMDB ID (optional)
 * @returns {Promise<Array>} Array of stream objects
 */
async function getVidKingStreams(tmdbId, type, season = null, episode = null, imdbId = null) {
    if (type === 'movie') {
        return getVidKingMovieStreams(tmdbId, imdbId);
    } else if ((type === 'series' || type === 'tv') && season && episode) {
        return getVidKingSeriesStreams(tmdbId, season, episode, imdbId);
    }

    console.log(`[VidKing] Invalid request: type=${type}, season=${season}, episode=${episode}`);
    return [];
}

module.exports = {
    getVidKingStreams,
    getVidKingMovieStreams,
    getVidKingSeriesStreams,
    buildMovieEmbedUrl,
    buildSeriesEmbedUrl,
    verifyEmbedAvailable,
    VIDKING_BASE_URL,
    QUALITY_OPTIONS
};
