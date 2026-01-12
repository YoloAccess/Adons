const { getTorrentStreams } = require('./providers/torrent.js');

async function testTorrent() {
    console.log('--- Testing Movie (Deadpool) ---');
    // Deadpool 2016 - tt1431045
    const movieStreams = await getTorrentStreams('tt1431045', 'Deadpool', 'movie', 2016);
    console.log('Result:', movieStreams.length > 0 ? 'SUCCESS' : 'FAILED');
    if (movieStreams.length > 0) {
        console.log('First Stream:', movieStreams[0].title);
        console.log('First InfoHash:', movieStreams[0].infoHash);
    }

    console.log('\n--- Testing TV Show (Breaking Bad S01E01) ---');
    // Breaking Bad - tt0903747
    const seriesStreams = await getTorrentStreams('tt0903747', 'Breaking Bad', 'series', 2008, 1, 1);
    console.log('Result:', seriesStreams.length > 0 ? 'SUCCESS' : 'FAILED');
    if (seriesStreams.length > 0) {
        console.log('First Stream:', seriesStreams[0].title);
    }
}

testTorrent();
