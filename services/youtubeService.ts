
// Bu servis, YouTube IFrame API yerine doğrudan SES AKIŞI (Audio Stream) URL'ini çeker.
// Piped API'lerini kullanarak videonun ham ses dosyasına ulaşır.

// En kararlı ve hızlı Piped instance'ları
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://api.piped.otter.sh",
  "https://pipedapi.moomoo.me",
  "https://pipedapi.drgns.space",
  "https://api.piped.privacy.com.de",
  "https://pipedapi.ducks.party",
  "https://pipedapi.leptons.xyz",
  "https://pipedapi.r4fo.com",
  "https://api.piped.projectsegfau.lt"
];

interface AudioStreamResult {
  url: string;
  isFallback: boolean;
}

export const getAudioStream = async (title: string, artist: string): Promise<AudioStreamResult | null> => {
  const query = encodeURIComponent(`${title} ${artist} official audio`);

  // 1. Adım: Şarkıyı Ara ve Video ID'sini Bul
  let videoId: string | null = null;
  let activeInstance: string | null = null;

  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${instance}/search?q=${query}&filter=music_songs`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          videoId = data.items[0].url.replace("/watch?v=", "");
          activeInstance = instance;
          break;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // FALLBACK SEARCH: If strict music search failed, try broad search (maybe it's a "Lyric Video" or just not tagged as music)
  if (!videoId) {
    console.warn("Strict music search failed, trying broad search...");
    const broadQuery = encodeURIComponent(`${title} ${artist}`);

    for (const instance of PIPED_INSTANCES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(`${instance}/search?q=${broadQuery}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            // Filter out playlists/channels, only take streams
            const video = data.items.find((i: any) => i.type === "stream");
            if (video) {
              videoId = video.url.replace("/watch?v=", "");
              activeInstance = instance;
              break;
            }
          }
        }
      } catch (e) { continue; }
    }
  }

  if (!videoId || !activeInstance) {
    console.error("Şarkı Piped ağında bulunamadı.");
    return null;
  }

  // 2. Adım: Video ID'sini kullanarak Ses Akışını (Stream) Çek
  try {
    const streamResponse = await fetch(`${activeInstance}/streams/${videoId}`);
    const streamData = await streamResponse.json();

    if (streamData.audioStreams && streamData.audioStreams.length > 0) {
      // En yüksek kaliteli ses dosyasını bul (m4a öncelikli)
      const bestStream = streamData.audioStreams.find((s: any) => s.mimeType === "audio/mp4")
        || streamData.audioStreams[0];

      return {
        url: bestStream.url,
        isFallback: false
      };
    }
  } catch (error) {
    console.error("Ses dosyası ayıklanamadı:", error);
  }

  return null;
};
