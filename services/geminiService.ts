/// <reference types="vite/client" />

import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, WeatherData, Song } from "../types";

// Robust Key Retrieval
const getApiKey = () => {
  // Try standard Vite env vars first (VITE_GEMINI_API_KEY or VITE_API_KEY)
  const key = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("API Key Missing! Checked: VITE_GEMINI_API_KEY, VITE_API_KEY, process.env.API_KEY");
  }
  return key;
};

// Initialize AI Client
const ai = new GoogleGenAI({ apiKey: getApiKey() });

// Safe Fetch with Retry Logic for 429 Errors
const safeFetchITunes = async (url: string, retries = 3, backoff = 1000): Promise<any> => {
  try {
    const response = await fetch(url);

    // If rate limited (429) or server error (5xx), throw to retry
    if (response.status === 429 || response.status >= 500) {
      throw new Error(`Rate limit hit: ${response.status}`);
    }

    // For other errors (404, etc), return null immediately (don't retry)
    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    if (retries > 0) {
      // Exponential backoff: 1s, 2s, 4s...
      console.warn(`iTunes API Rate Limit/Error. Retrying in ${backoff}ms... (${retries} left)`);
      await new Promise(r => setTimeout(r, backoff));
      return safeFetchITunes(url, retries - 1, backoff * 2);
    }
    console.warn("iTunes API Fetch Failed after retries:", url);
    return null;
  }
};

export const fetchRealTrackData = async (title: string, artist: string) => {
  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const url = `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=1`;

    const data = await safeFetchITunes(url);

    if (data && data.results && data.results.length > 0) {
      const track = data.results[0];
      return {
        isValid: true,
        title: track.trackName,
        artist: track.artistName,
        album: track.collectionName,
        coverUrl: track.artworkUrl100.replace('100x100bb', '600x600bb'),
        previewUrl: track.previewUrl,
        duration: formatDuration(track.trackTimeMillis)
      };
    }
    return { isValid: false };
  } catch (error) {
    return { isValid: false };
  }
};

const formatDuration = (millis: number) => {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (Number(seconds) < 10 ? '0' : '') + seconds;
};

// ... (existing getWeatherDirectives, fetchOpenRouterCandidates functions)

// ... inside generatePlaylist ...

// 3. Verify & Hydrate with iTunes Data (Highly Throttled)



const getWeatherDirectives = (code: number, isDay: boolean): string => {
  // Clear/Sunny
  if (code === 0 || code === 1) {
    return isDay
      ? "UPBEAT, ENERGETIC, POP, FEEL-GOOD. Songs that make you want to drive with windows down."
      : "ROMANTIC, CHILL-POP, SMOOTH. Nice vibes for a clear night.";
  }
  // Partly Cloudy
  if (code === 2) {
    return "CALM, ACOUSTIC, INDIE-FOLK, PEACEFUL. Not too sad, but relaxed. Coffee shop vibes.";
  }
  // Overcast
  if (code === 3) {
    return "INTROSPECTIVE, SOFT-ROCK, INDIE. A bit grey but not depressing.";
  }
  // Fog
  if (code >= 45 && code <= 48) {
    return "MYSTERIOUS, AMBIENT, LO-FI, ETHEREAL. Dreamy and slow.";
  }
  // Rain
  if (code >= 51 && code <= 67) {
    return "MELANCHOLIC, JAZZY, SLOW, EMOTIONAL. Rainy day songs. Piano or slow guitar.";
  }
  // Snow
  if (code >= 71 && code <= 77) {
    return "COZY, WARM, ACOUSTIC, WINTER VIBES. Songs to listen to by a fireplace.";
  }
  // Storm/Heavy Rain
  if (code >= 80 || code >= 95) {
    return "GLOOMY, DARK, INTENSE, CINEMATIC. Deep moods, maybe Post-Rock or moody Alt-Rock.";
  }
  return "BALANCED, ALTERNATIVE, EASY-LISTENING.";
};

// OpenRouter Fallback Fetcher
const fetchOpenRouterCandidates = async (prompt: string): Promise<any[]> => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = import.meta.env.VITE_OPENROUTER_MODEL || "google/gemini-2.0-flash-001"; //google/gemini-2.0-flash-001

  if (!apiKey) {
    throw new Error("OpenRouter API Key is missing. Check .env.local");
  }

  console.log("Attempting fallback to OpenRouter...");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.href, // Dynamic origin
      "X-Title": "MeloWeather",
    },
    body: JSON.stringify({
      "model": model,
      "messages": [
        {
          "role": "system",
          "content": "You are a JSON-only API. You must return ONLY a raw JSON array of objects. No markdown formatting, no explanations."
        },
        {
          "role": "user",
          "content": prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenRouter Error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || "[]";

  console.log("OpenRouter Raw Response:", rawContent);

  // Clean Markdown
  const cleanedContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

  return JSON.parse(cleanedContent);
};

export const generatePlaylist = async (
  weather: WeatherData,
  preferences: UserPreferences,
  excludeContext: { artistNames?: string[], songTitles?: string[] } = {}
): Promise<Song[]> => {

  const randomSeed = Date.now();
  const musicalVibe = getWeatherDirectives(weather.conditionCode, weather.isDay);

  const excludeSongsStr = excludeContext.songTitles?.length
    ? `Do NOT include these specific songs (I already have them): ${excludeContext.songTitles.slice(0, 20).join(", ")}.`
    : "";

  const favoriteArtistsStr = preferences.favoriteArtists && preferences.favoriteArtists.trim()
    ? `IMPORTANT: The user loves these artists: ${preferences.favoriteArtists}. Include 3-5 songs from these artists in the playlist, but ONLY if they match the weather mood and vibe.`
    : "";

  const prompt = `
    Act as a professional music curator. I need a playlist of REAL, EXISTING songs that can be found on Apple Music.
    
    Context:
    - Weather Condition: ${weather.conditionText} (${weather.isDay ? 'Daytime' : 'Nighttime'}).
    - Musical Vibe Target (STRICT): ${musicalVibe}
    - User Preferences (Genres): ${preferences.genres.join(", ")}.
    - User Preferences (Languages): ${preferences.languages.join(", ")}.
    - Random Seed: ${randomSeed}.

    Directives:
    1. Generate a list of **40 candidate songs** (I will filter them later).
    2. **CRITICAL**: The songs MUST match the "Musical Vibe Target" defined above.
    3. **VARIETY RULE**: Do NOT repeat the same artist more than once.
    4. **DISCOVERY RULE**: Include at least 40% "Hidden Gems" (lesser known but great songs) and 60% Popular Hits.
    5. ACCURACY: Only suggest songs that actually exist.
    6. If "Türkçe" is preferred, prioritize high-quality Turkish Alternative/Indie (e.g., **Dedublüman**, Yüzyüzeyken Konuşuruz, Adamlar, Madrigal, Mabel Matiz) strictly matching the weather mood. Also specifically include Dedublüman hits like 'Gamzedeyim Deva Bulmam' or 'Belki'.
    
    ${favoriteArtistsStr}
    
    Exclusions:
    ${excludeSongsStr}
    
    Return a valid JSON array of objects with fields: title, artist.
  `;

  let candidateSongs: any[] = [];

  // 1. Try Primary Gemini API
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
            },
            required: ["title", "artist"]
          }
        }
      }
    });
    candidateSongs = JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.warn("Primary Gemini API Failed. Switching to Fallback...", error);

    // 2. Fallback to OpenRouter
    try {
      candidateSongs = await fetchOpenRouterCandidates(prompt);
    } catch (fallbackError: any) {
      console.error("All AI Generation Failed:", fallbackError);
      alert("Müzik listesi oluşturulamadı. (Hata: API Limit veya Bağlantı Sorunu)");
      return [];
    }
  }

  // 3. Verify & Hydrate with iTunes Data (Batched to avoid Rate Limiting)
  const validSongs: Song[] = [];
  const chunkSize = 5;

  for (let i = 0; i < candidateSongs.length; i += chunkSize) {
    const chunk = candidateSongs.slice(i, i + chunkSize);

    // Process chunk in parallel
    const chunkResults = await Promise.all(
      chunk.map(async (candidate: any) => {
        const realData = await fetchRealTrackData(candidate.title, candidate.artist);
        if (realData.isValid) {
          const safeId = btoa(unescape(encodeURIComponent(`${realData.title}-${realData.artist}`))).replace(/[^a-zA-Z0-9]/g, '');
          return {
            id: safeId,
            title: realData.title,
            artist: realData.artist,
            album: realData.album,
            duration: realData.duration,
            coverUrl: realData.coverUrl,
            previewUrl: realData.previewUrl,
            mood: preferences.mood
          } as Song;
        }
        return null;
      })
    );

    // Collect valid songs
    validSongs.push(...chunkResults.filter((s): s is Song => s !== null));

    // Small delay between chunks to be nice to the API
    if (i + chunkSize < candidateSongs.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // 4. Filter Duplicates
  const uniqueArtistSongs: Song[] = [];
  const seenArtists = new Set<string>();
  const seenTitles = new Set<string>();

  for (const song of validSongs) {
    // Check for duplicate Artists OR duplicate Titles (to be safe)
    if (!seenArtists.has(song.artist) && !seenTitles.has(song.title)) {
      uniqueArtistSongs.push(song);
      seenArtists.add(song.artist);
      seenTitles.add(song.title);
    }
  }

  // Ensure we have enough songs, if not, we return what we have
  return uniqueArtistSongs.slice(0, 10);
};

