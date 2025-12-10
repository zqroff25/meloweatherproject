export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  coverUrl: string;
  previewUrl?: string; // iTunes preview (backup)
  youtubeId?: string; // YouTube Video ID
  streamUrl?: string; // High quality direct audio stream from Piped
  mood?: string;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
}

export interface WeatherData {
  temperature: number;
  conditionCode: number; // WMO Weather interpretation codes
  conditionText: string;
  isDay: boolean;
  locationName: string;
}

export interface UserPreferences {
  genres: string[];
  languages: string[];
  mood: string;
}

export enum ViewState {
  HOME = 'HOME',
  DISCOVER = 'DISCOVER',
  LIBRARY = 'LIBRARY',
  SETTINGS = 'SETTINGS'
}

export enum WeatherType {
  SUNNY = 'SUNNY',
  CLOUDY = 'CLOUDY',
  RAINY = 'RAINY',
  SNOWY = 'SNOWY',
  UNKNOWN = 'UNKNOWN'
}