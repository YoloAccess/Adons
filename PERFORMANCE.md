# 🚀 Performance Optimization Guide

This guide explains how to optimize your Nuvio Streams addon for the **fastest possible streaming response times**.

---

## 📊 Current Performance Architecture

Your addon already uses:
- ✅ **Parallel Provider Fetching** - All 14 providers run simultaneously
- ✅ **Hybrid Caching** - Redis (primary) + File (fallback)
- ✅ **Intelligent Timeouts** - 15 second global timeout
- ✅ **Cached Imports** - Node-fetch is pre-loaded on startup

---

## 🔥 HIGH-PRIORITY Optimizations

### 1. Enable Redis Caching (FREE with Upstash)

**Impact: 10-50x faster cache reads!**

File-based cache = ~100-500ms per read
Redis cache = ~2-10ms per read

**Setup (5 minutes):**

1. Go to [upstash.com](https://upstash.com) and create a free account
2. Create a new Redis database (free tier gives you 10,000 commands/day)
3. Copy your Redis URL
4. Add to your `.env`:

```bash
USE_REDIS_CACHE=true
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
```

### 2. Enable Stream Caching

Make sure this is set in your `.env`:
```bash
DISABLE_STREAM_CACHE=false
```

### 3. Get a TMDB API Key

Without TMDB API key, your addon must do extra IMDb-to-TMDB conversions.

1. Go to [themoviedb.org](https://www.themoviedb.org/settings/api)
2. Create a free account and request an API key
3. Add to `.env`:
```bash
TMDB_API_KEY=your_api_key_here
```

---

## 📈 MEDIUM-PRIORITY Optimizations

### 4. Disable Slow/Broken Providers

If certain providers are consistently slow or broken, disable them:

```bash
# Disable specific providers if they're slow in your region
ENABLE_VIDZEE_PROVIDER=false
ENABLE_TOPMOVIES_PROVIDER=false
```

### 5. Use Provider Proxies (For Geo-Blocked Content)

If you're hosting in a region where some providers are blocked, use proxies:

```bash
SHOWBOX_PROXY_URL_VALUE=http://your-proxy.com:8080
UHDMOVIES_PROXY_URL=http://your-proxy.com:8080
```

### 6. External Provider Microservices

For heavy providers (UHDMovies, MoviesMod), you can offload to separate services:

```bash
USE_EXTERNAL_PROVIDERS=true
EXTERNAL_UHDMOVIES_URL=https://your-uhdmovies-service.com
EXTERNAL_MOVIESMOD_URL=https://your-moviesmod-service.com
```

---

## ⚡ User-Side Performance Tips

Share these tips with your addon users:

### For Users - Select Only Fast Providers

In the addon configuration page, users can select specific providers:
- **Fastest:** ShowBox, VidZee, SoaperTV
- **High Quality but Slower:** UHDMovies, 4KHDHub, MoviesMod
- **Balanced:** MP4Hydra, VidKing

### For Users - Set Minimum Quality

Setting minimum quality (e.g., 720p) filters out low-quality streams faster.

---

## 🖥️ Hosting Recommendations

For best global performance:

| Platform | Cost | Best For |
|----------|------|----------|
| **Render.com** | Free tier | Personal use |
| **Railway.app** | $5/month | Reliable hosting |
| **Fly.io** | Free tier | Global edge deployment |
| **VPS (Contabo)** | $5/month | Full control, no limits |

### Edge Caching with CDN

For global deployment, consider:
1. Deploy to Fly.io with multiple regions
2. Use Upstash Redis with global replication
3. Enable response caching at the CDN level

---

## 🔧 Environment Variables Reference

```bash
# REQUIRED for best performance
TMDB_API_KEY=your_key
USE_REDIS_CACHE=true
REDIS_URL=your_redis_url
DISABLE_STREAM_CACHE=false

# OPTIONAL - for specific use cases
SHOWBOX_PROXY_URL_VALUE=
USE_EXTERNAL_PROVIDERS=false
```

---

## 📝 Performance Metrics

After optimizations, you should see:

| Metric | Before | After |
|--------|--------|-------|
| Cache Read | 100-500ms | 2-10ms |
| Average Response | 10-45s | 5-15s |
| Cache Hit Response | 1-2s | 100-500ms |
| Cold Start | 5s | 2s |

---

## 🐛 Troubleshooting Slow Responses

### Check Redis Connection
```javascript
// In your logs, look for:
[Redis Cache] Successfully connected to Upstash Redis
[Redis Cache] HIT for provider: cacheKey
```

### Check Provider Timings
Look for timing logs:
```
[ShowBox] 2.34s
[VidZee] 1.12s
[UHDMovies] 8.56s <- This is slow!
```

### Check Cache Hit Rate
If you see mostly "Fetching new streams..." instead of "Using X streams from cache", your cache TTL might be too short or cache is disabled.

---

*Created for Nuvio Streams Addon - Optimized by Antigravity AI*
