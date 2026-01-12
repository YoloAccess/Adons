/**
 * Torrent Provider
 * Aggregates torrent streams from multiple sources:
 * - YTS (Movies - High Quality)
 * - EZTV (TV Shows)
 * - 1337x (General - via scraping)
 * 
 * For Stremio, returns streams with infoHash for direct torrent playback
 */

const axios = require('axios');
const cheerio = require('cheerio');

// API Base URLs
const YTS_API_URL = 'https://yts.mx/api/v2';
const EZTV_API_URL = 'https://eztv.re/api';

// Quality emoji mapping
const QUALITY_EMOJI = {
    '2160p': '🌟',
    '4K': '🌟',
    '1080p': '🎬',
    '720p': '📺',
    '480p': '📱',
    'default': '🎞️'
};

/**
 * Get quality emoji
 */
function getQualityEmoji(quality) {
    if (!quality) return QUALITY_EMOJI['default'];
    const q = quality.toUpperCase();
    if (q.includes('2160') || q.includes('4K')) return QUALITY_EMOJI['2160p'];
    if (q.includes('1080')) return QUALITY_EMOJI['1080p'];
    if (q.includes('720')) return QUALITY_EMOJI['720p'];
    if (q.includes('480')) return QUALITY_EMOJI['480p'];
    return QUALITY_EMOJI['default'];
}

/**
 * Format file size
 */
function formatSize(sizeBytes) {
    if (!sizeBytes) return '';
    const gb = sizeBytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = sizeBytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
}

/**
 * Create magnet link from infoHash with Super-Charged Trackers
 * Includes 20+ best open trackers for 2024 to ensure fast mobile connection
 */
function createMagnetLink(infoHash, title) {
    const trackers = [
        // Best Open Trackers 2024
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://open.tracker.cl:1337/announce',
        'udp://9.rarbg.com:2810/announce',
        'udp://tracker.openbittorrent.com:80/announce',
        'udp://opentracker.i2p.rocks:6969/announce',
        'udp://tracker.internetwarriors.net:1337/announce',
        'udp://tracker.leechers-paradise.org:6969/announce',
        'udp://coppersurfer.tk:6969/announce',
        'udp://tracker.zer0day.to:1337/announce',
        'udp://tracker.tiny-vps.com:6969/announce',
        'udp://open.stealth.si:80/announce',
        'udp://tracker.torrent.eu.org:451/announce',
        'udp://exodus.desync.com:6969/announce',
        'udp://yourbittorrent.com:80/announce',
        'udp://ipv4.tracker.harry.lu:80/announce',
        'udp://tracker.moeking.me:6969/announce',
        'https://tracker.tamersunion.org:443/announce',
        'https://tracker.lilithraws.org:443/announce',
        'http://tracker.bt4g.com:2095/announce',
        'udp://tracker.cyberia.is:6969/announce'
    ];

    const encodedTitle = encodeURIComponent(title || 'Unknown');
    const trackerParams = trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');

    return `magnet:?xt=urn:btih:${infoHash}&dn=${encodedTitle}${trackerParams}`;
}

/**
 * Search YTS for movie torrents
 * @param {string} imdbId - IMDB ID (e.g., tt1234567)
 * @param {string} title - Movie title for fallback search
 * @returns {Promise<Array>} Array of torrent streams
 */
async function getYTSTorrents(imdbId, title = null) {
    console.log(`[YTS] Searching for movie: ${imdbId || title}`);

    const streams = [];

    try {
        let url;
        if (imdbId) {
            url = `${YTS_API_URL}/list_movies.json?query_term=${imdbId}`;
        } else if (title) {
            url = `${YTS_API_URL}/list_movies.json?query_term=${encodeURIComponent(title)}`;
        } else {
            return [];
        }

        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log(`[YTS] Response status: ${response.status}`);
        if (response.data && response.data.data && response.data.data.movies) {
            // console.log(`[YTS] Found ${response.data.data.movies.length} movies`);
        } else {
            console.log(`[YTS] API Response structure invalid or empty:`, JSON.stringify(response.data).substring(0, 100));
        }

        if (response.data?.status !== 'ok' || !response.data?.data?.movies) {
            console.log('[YTS] No movies found in response data');
            return [];
        }

        const movies = response.data.data.movies;

        for (const movie of movies) {
            if (!movie.torrents) continue;

            for (const torrent of movie.torrents) {
                const quality = torrent.quality || '720p';
                const emoji = getQualityEmoji(quality);
                const size = torrent.size || formatSize(torrent.size_bytes);
                const seeds = torrent.seeds || 0;
                const peers = torrent.peers || 0;

                streams.push({
                    name: 'Nuvio | YTS',
                    title: `${emoji} YTS • ${quality} • ${torrent.type || 'BluRay'}\n📦 ${size} • 🌱 ${seeds} seeds`,
                    quality: quality,
                    infoHash: torrent.hash,
                    url: createMagnetLink(torrent.hash, `${movie.title} (${movie.year})`),
                    seeds: seeds,
                    peers: peers,
                    size: size,
                    type: 'torrent',
                    behaviorHints: {
                        bingeGroup: `yts-${movie.imdb_code}`
                    }
                });
            }
        }

        // Sort by quality (4K first) then by seeds
        streams.sort((a, b) => {
            const qualityOrder = { '2160p': 4, '1080p': 3, '720p': 2, '480p': 1 };
            const qA = qualityOrder[a.quality] || 0;
            const qB = qualityOrder[b.quality] || 0;
            if (qB !== qA) return qB - qA;
            return (b.seeds || 0) - (a.seeds || 0);
        });

        console.log(`[YTS] Found ${streams.length} torrents`);
    } catch (error) {
        console.error(`[YTS] Error: ${error.message}`);
    }

    return streams;
}

/**
 * Search EZTV for TV show torrents
 * @param {string} imdbId - IMDB ID (without 'tt' prefix)
 * @param {number} season - Season number
 * @param {number} episode - Episode number
 * @returns {Promise<Array>} Array of torrent streams
 */
async function getEZTVTorrents(imdbId, season, episode) {
    console.log(`[EZTV] Searching for: ${imdbId} S${season}E${episode}`);

    const streams = [];

    try {
        // Remove 'tt' prefix if present
        const cleanImdbId = imdbId ? imdbId.replace('tt', '') : null;

        if (!cleanImdbId) {
            console.log('[EZTV] No IMDB ID provided');
            return [];
        }

        const url = `${EZTV_API_URL}/get-torrents?imdb_id=${cleanImdbId}&limit=100`;

        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log(`[EZTV] Response status: ${response.status}`);
        if (!response.data || !response.data.torrents) {
            console.log(`[EZTV] No torrents in response. Data:`, JSON.stringify(response.data).substring(0, 100));
        }

        if (!response.data?.torrents || response.data.torrents.length === 0) {
            console.log('[EZTV] No torrents found');
            return [];
        }

        const torrents = response.data.torrents;

        // Filter for the specific episode
        const seasonPadded = String(season).padStart(2, '0');
        const episodePadded = String(episode).padStart(2, '0');
        const episodePattern = new RegExp(`S${seasonPadded}E${episodePadded}`, 'i');

        const matchingTorrents = torrents.filter(t => {
            return episodePattern.test(t.title) || episodePattern.test(t.filename);
        });

        for (const torrent of matchingTorrents) {
            // Parse quality from title
            let quality = '720p';
            const title = torrent.title || torrent.filename || '';
            if (/2160p|4K|UHD/i.test(title)) quality = '2160p';
            else if (/1080p/i.test(title)) quality = '1080p';
            else if (/720p/i.test(title)) quality = '720p';
            else if (/480p/i.test(title)) quality = '480p';

            const emoji = getQualityEmoji(quality);
            const size = formatSize(torrent.size_bytes);
            const seeds = torrent.seeds || 0;
            const peers = torrent.peers || 0;

            streams.push({
                name: 'Nuvio | EZTV',
                title: `${emoji} EZTV • ${quality}\n📦 ${size} • 🌱 ${seeds} seeds`,
                quality: quality,
                infoHash: torrent.hash,
                url: torrent.magnet_url || createMagnetLink(torrent.hash, title),
                seeds: seeds,
                peers: peers,
                size: size,
                type: 'torrent',
                behaviorHints: {
                    bingeGroup: `eztv-${imdbId}-${season}`
                }
            });
        }

        // Sort by quality then seeds
        streams.sort((a, b) => {
            const qualityOrder = { '2160p': 4, '1080p': 3, '720p': 2, '480p': 1 };
            const qA = qualityOrder[a.quality] || 0;
            const qB = qualityOrder[b.quality] || 0;
            if (qB !== qA) return qB - qA;
            return (b.seeds || 0) - (a.seeds || 0);
        });

        console.log(`[EZTV] Found ${streams.length} torrents for S${season}E${episode}`);
    } catch (error) {
        console.error(`[EZTV] Error: ${error.message}`);
    }

    return streams;
}

/**
 * Search 1337x for torrents (scraping - fallback)
 * @param {string} query - Search query
 * @param {string} type - 'movie' or 'series'
 * @returns {Promise<Array>} Array of torrent streams
 */
async function get1337xTorrents(query, type = 'movie') {
    console.log(`[1337x] Searching for: ${query}`);

    const streams = [];

    try {
        const category = type === 'movie' ? 'Movies' : 'TV';
        const url = `https://1337x.to/category-search/${encodeURIComponent(query)}/${category}/1/`;

        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const rows = $('tbody tr').slice(0, 10); // Limit to first 10 results

        for (let i = 0; i < rows.length; i++) {
            const row = $(rows[i]);
            const titleLink = row.find('td.name a:nth-child(2)');
            const title = titleLink.text().trim();
            const detailUrl = titleLink.attr('href');
            const seeds = parseInt(row.find('td.seeds').text()) || 0;
            const leeches = parseInt(row.find('td.leeches').text()) || 0;
            const size = row.find('td.size').text().replace(/[^\d.GBMBTK\s]/g, '').trim();

            if (!detailUrl) continue;

            // Parse quality from title
            let quality = '720p';
            if (/2160p|4K|UHD/i.test(title)) quality = '2160p';
            else if (/1080p/i.test(title)) quality = '1080p';
            else if (/720p/i.test(title)) quality = '720p';
            else if (/480p/i.test(title)) quality = '480p';

            // Get magnet link from detail page
            try {
                const detailResponse = await axios.get(`https://1337x.to${detailUrl}`, {
                    timeout: 8000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                const detail$ = cheerio.load(detailResponse.data);
                const magnetLink = detail$('a[href^="magnet:"]').attr('href');

                if (magnetLink) {
                    // Extract infoHash from magnet link
                    const hashMatch = magnetLink.match(/btih:([a-fA-F0-9]{40})/i);
                    const infoHash = hashMatch ? hashMatch[1] : null;

                    const emoji = getQualityEmoji(quality);

                    streams.push({
                        name: 'Nuvio | 1337x',
                        title: `${emoji} 1337x • ${quality}\n📦 ${size} • 🌱 ${seeds} seeds`,
                        quality: quality,
                        infoHash: infoHash,
                        url: magnetLink,
                        seeds: seeds,
                        peers: leeches,
                        size: size,
                        type: 'torrent',
                        behaviorHints: {
                            bingeGroup: `1337x-${query}`
                        }
                    });
                }
            } catch (err) {
                // Skip this result if we can't get details
                console.log(`[1337x] Failed to get details for: ${title}`);
            }
        }

        console.log(`[1337x] Found ${streams.length} torrents`);
    } catch (error) {
        console.error(`[1337x] Error: ${error.message}`);
    }

    return streams;
}

/**
 * Search APIBay (The Pirate Bay) - Robust Fallback
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of torrent streams
 */
async function getAPIBayTorrents(query) {
    console.log(`[APIBay] Searching for: ${query}`);
    const streams = [];
    try {
        const url = `https://apibay.org/q.php?q=${encodeURIComponent(query)}`;
        const response = await axios.get(url, { timeout: 10000 });

        if (response.data && Array.isArray(response.data) && response.data.length > 0 && response.data[0].name !== 'No results returned') {
            const torrents = response.data.slice(0, 10); // Top 10
            for (const torrent of torrents) {
                const title = torrent.name;
                const seeds = parseInt(torrent.seeders) || 0;
                const peers = parseInt(torrent.leechers) || 0;
                const size = formatSize(torrent.size);
                const infoHash = torrent.info_hash;

                // Simple quality guess
                let quality = '720p';
                if (/2160p|4K|UHD/i.test(title)) quality = '2160p';
                else if (/1080p/i.test(title)) quality = '1080p';

                const emoji = getQualityEmoji(quality);

                streams.push({
                    name: 'Nuvio | TPB',
                    title: `${emoji} TPB • ${quality}\n📦 ${size} • 🌱 ${seeds} seeds`,
                    quality: quality,
                    infoHash: infoHash,
                    url: createMagnetLink(infoHash, title),
                    seeds: seeds,
                    peers: peers,
                    size: size,
                    type: 'torrent',
                    behaviorHints: {
                        bingeGroup: `tpb-${infoHash}`
                    }
                });
            }
            console.log(`[APIBay] Found ${streams.length} torrents`);
        } else {
            console.log(`[APIBay] No results.`);
        }
    } catch (e) {
        console.error(`[APIBay] Error: ${e.message}`);
    }
    return streams;
}

/**
 * Get torrent streams for a movie
 * @param {string} imdbId - IMDB ID
 * @param {string} title - Movie title
 * @param {number} year - Release year
 * @returns {Promise<Array>} Array of torrent streams
 */
async function getMovieTorrents(imdbId, title, year) {
    console.log(`[Torrents] Fetching movie torrents for: ${title} (${year})`);

    const streams = [];

    // 1. YTS
    const ytsStreams = await getYTSTorrents(imdbId, title);
    streams.push(...ytsStreams);

    // 2. APIBay (TPB) - Very reliable fallback
    if (streams.length < 3) {
        const searchQuery = year ? `${title} ${year}` : title;
        const tpbStreams = await getAPIBayTorrents(searchQuery);
        streams.push(...tpbStreams);
    }

    // 3. 1337x
    if (streams.length < 3) {
        const searchQuery = year ? `${title} ${year}` : title;
        const fallbackStreams = await get1337xTorrents(searchQuery, 'movie');
        streams.push(...fallbackStreams);
    }

    // Remove duplicates by infoHash
    const uniqueStreams = [];
    const seenHashes = new Set();
    for (const stream of streams) {
        if (stream.infoHash && !seenHashes.has(stream.infoHash.toLowerCase())) {
            seenHashes.add(stream.infoHash.toLowerCase());
            uniqueStreams.push(stream);
        } else if (!stream.infoHash) {
            uniqueStreams.push(stream);
        }
    }
    console.log(`[Torrents] Total movie torrents: ${uniqueStreams.length}`);
    return uniqueStreams;
}

/**
 * Get torrent streams for a TV episode
 * @param {string} imdbId - IMDB ID
 * @param {string} title - Show title
 * @param {number} season - Season number
 * @param {number} episode - Episode number
 * @returns {Promise<Array>} Array of torrent streams
 */
async function getSeriesTorrents(imdbId, title, season, episode) {
    console.log(`[Torrents] Fetching series torrents for: ${title} S${season}E${episode}`);

    const streams = [];

    // 1. EZTV
    const eztvStreams = await getEZTVTorrents(imdbId, season, episode);
    streams.push(...eztvStreams);

    // 2. APIBay (TPB)
    if (streams.length < 3) {
        const seasonPadded = String(season).padStart(2, '0');
        const episodePadded = String(episode).padStart(2, '0');
        const searchQuery = `${title} S${seasonPadded}E${episodePadded}`;
        const tpbStreams = await getAPIBayTorrents(searchQuery);
        streams.push(...tpbStreams);
    }

    // 3. 1337x
    if (streams.length < 3) {
        const seasonPadded = String(season).padStart(2, '0');
        const episodePadded = String(episode).padStart(2, '0');
        const searchQuery = `${title} S${seasonPadded}E${episodePadded}`;
        const fallbackStreams = await get1337xTorrents(searchQuery, 'series');
        streams.push(...fallbackStreams);
    }

    // Remove duplicates
    const uniqueStreams = [];
    const seenHashes = new Set();
    for (const stream of streams) {
        if (stream.infoHash && !seenHashes.has(stream.infoHash.toLowerCase())) {
            seenHashes.add(stream.infoHash.toLowerCase());
            uniqueStreams.push(stream);
        } else if (!stream.infoHash) {
            uniqueStreams.push(stream);
        }
    }
    console.log(`[Torrents] Total series torrents: ${uniqueStreams.length}`);
    return uniqueStreams;
}

/**
 * Main function to get torrent streams
 * @param {string} imdbId - IMDB ID
 * @param {string} title - Movie/Show title
 * @param {string} type - 'movie' or 'series'
 * @param {number} year - Release year (for movies)
 * @param {number} season - Season number (for series)
 * @param {number} episode - Episode number (for series)
 * @returns {Promise<Array>} Array of torrent stream objects
 */
async function getTorrentStreams(imdbId, title, type, year = null, season = null, episode = null) {
    if (type === 'movie') {
        return getMovieTorrents(imdbId, title, year);
    } else if ((type === 'series' || type === 'tv') && season && episode) {
        return getSeriesTorrents(imdbId, title, season, episode);
    }

    console.log(`[Torrents] Invalid request: type=${type}`);
    return [];
}

module.exports = {
    getTorrentStreams,
    getMovieTorrents,
    getSeriesTorrents,
    getYTSTorrents,
    getEZTVTorrents,
    getAPIBayTorrents,
    get1337xTorrents,
    createMagnetLink
};
