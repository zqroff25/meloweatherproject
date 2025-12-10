
import React, { useState, useEffect, useRef } from "react";
import { ViewState, WeatherData, UserPreferences, Song, Playlist } from "./types";
import { fetchWeather, getThemeColors, getWeatherMood } from "./services/weatherService";
import { generatePlaylist, fetchRealTrackData } from "./services/geminiService";
import { getAudioStream } from "./services/youtubeService";
import {
  getUserPreferences,
  saveUserPreferences,
  getLikedSongsDB,
  toggleLikeSongDB,
  getPlaylistsDB,
  savePlaylistDB,
  deletePlaylistDB
} from "./services/dbService";

// --- ANIMATION STYLES (Injected) ---
const AnimationStyles = () => (
  <style>{`
    @keyframes float {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(-20px) translateX(10px); }
    }
    @keyframes float-slow {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes rain {
      0% { transform: translateY(-100%) translateX(0); opacity: 0; }
      50% { opacity: 1; }
      100% { transform: translateY(100vh) translateX(-20px); opacity: 0; }
    }
    @keyframes snow {
      0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
      20% { opacity: 1; }
      100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.2); }
    }
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.1); }
    }
    @keyframes lightning {
      0%, 95%, 98% { opacity: 0; }
      96%, 99% { opacity: 0.3; background-color: #fff; }
      97% { opacity: 0.1; }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
    .animate-rain { animation: rain 1.5s linear infinite; }
    .animate-snow { animation: snow 8s linear infinite; }
    .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
    .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
    .animate-lightning { animation: lightning 5s infinite; }
  `}</style>
);

// --- WEATHER VISUALS COMPONENT ---
const WeatherVisuals = ({ code, isDay }: { code: number, isDay: boolean }) => {
  // 1. Clear / Sunny
  if (code === 0 || code === 1) {
    if (isDay) {
      return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-sky-400 via-blue-300 to-sky-200">
          {/* Sun Glow */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-yellow-300/40 rounded-full blur-[100px] animate-pulse-glow"></div>
          <div className="absolute top-10 right-10 w-40 h-40 bg-yellow-200/60 rounded-full blur-[60px]"></div>
          {/* Subtle Lens Flares */}
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/10 rounded-full blur-xl animate-float"></div>
        </div>
      );
    } else {
      // Clear Night
      return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
          {/* Stars */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-twinkle"
              style={{
                width: Math.random() * 3 + 'px',
                height: Math.random() * 3 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 3 + 's',
                opacity: Math.random()
              }}
            ></div>
          ))}
          {/* Moon Glow */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
        </div>
      );
    }
  }

  // 2. Clouds / Partly Cloudy
  if (code === 2 || code === 3) {
    return (
      <div className={`absolute inset-0 overflow-hidden ${isDay ? 'bg-gradient-to-br from-blue-300 via-slate-200 to-slate-200' : 'bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800'}`}>
        {/* Soft Clouds (Premium) */}
        <div className="absolute top-10 -right-20 w-80 h-80 bg-white/40 dark:bg-white/10 rounded-full blur-[80px] animate-float-slow"></div>
        <div className="absolute -bottom-20 -left-10 w-96 h-96 bg-white/30 dark:bg-white/5 rounded-full blur-[90px] animate-float"></div>
        <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-white/20 rounded-full blur-[50px] animate-pulse-glow"></div>

        {/* Extra Texture for Overcast (Code 3) */}
        {code === 3 && (
          <div className="absolute inset-0 bg-gradient-to-t from-gray-200/20 to-transparent"></div>
        )}
      </div>
    );
  }

  // 3. Fog
  if (code >= 45 && code <= 48) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-300 via-gray-300 to-slate-400">
        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-white/50 to-transparent blur-xl"></div>
      </div>
    );
  }

  // 4. Rain
  if (code >= 51 && code <= 67) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-700 via-blue-900 to-slate-800">
        {/* Rain Drops - Increased Count */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[1px] h-20 bg-blue-200/30 animate-rain"
            style={{
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 1.5 + 's',
              animationDuration: 0.7 + Math.random() * 0.4 + 's'
            }}
          ></div>
        ))}
        <div className="absolute top-0 w-full h-full bg-black/10"></div>
      </div>
    );
  }

  // 5. Snow
  if (code >= 71 && code <= 77) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-blue-100 via-white to-blue-50">
        {/* Snow Flakes - Increased Count & Drift */}
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full blur-[1px] animate-snow"
            style={{
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 8 + 's',
              opacity: Math.random() * 0.9 + 0.3,
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px'
            }}
          ></div>
        ))}
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-white via-white/80 to-transparent blur-xl"></div>
      </div>
    );
  }

  // 6. Storm / Heavy Rain
  if (code >= 80 || code >= 95) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 animate-lightning">
        {/* Heavy Rain */}
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-28 bg-blue-100/50 animate-rain"
            style={{
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 1 + 's',
              animationDuration: 0.4 + Math.random() * 0.2 + 's'
            }}
          ></div>
        ))}
        {/* Dynamic Lightning Flash Overlay */}
        <div className="absolute inset-0 bg-white/20 animate-lightning mix-blend-overlay"></div>
      </div>
    );
  }

  // Default
  return <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-teal-300"></div>;
};

// --- SHARED COMPONENTS ---

// 1. Navigation Header
const Header = ({
  view,
  setView,
  theme,
  onLogoClick
}: {
  view: ViewState;
  setView: (v: ViewState) => void;
  theme: any;
  onLogoClick?: () => void;
}) => (
  <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200/50 dark:border-slate-700 px-6 sm:px-10 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md fixed top-0 left-0 right-0 z-50 transition-colors duration-500">
    <div
      className={`flex items-center gap-2 cursor-pointer ${theme.text}`}
      onClick={() => {
        if (onLogoClick) onLogoClick();
        else setView(ViewState.HOME);
      }}
    >
      <span className="material-symbols-outlined text-3xl">cloud_circle</span>
      <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        MeloWeather
      </h2>
    </div>

    <nav className="hidden md:flex items-center gap-8">
      {[
        { id: ViewState.HOME, label: "Ana Sayfa" },
        { id: ViewState.LIBRARY, label: "Kütüphanem" },
        { id: ViewState.SETTINGS, label: "Ayarlar" },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`text-sm font-bold transition-all duration-300 ${view === item.id
            ? `text-slate-900 dark:text-white scale-105`
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
        >
          {item.label}
        </button>
      ))}
    </nav>

    <div className="flex items-center gap-4">
      {/* Premium & User Icons Removed */}
    </div>
  </header>
);

// 2. Song List Item
interface SongItemProps {
  song: Song;
  onPlay: () => void;
  isPlaying: boolean;
  isLiked: boolean;
  onLike: () => void;
  onMore: () => void;
  isBuffering: boolean;
}

const SongItem: React.FC<SongItemProps> = ({ song, onPlay, isPlaying, isLiked, onLike, onMore, isBuffering }) => (
  <div
    onClick={onPlay}
    className="group flex items-center gap-4 bg-white/60 dark:bg-slate-800/40 p-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700 relative"
  >
    <div className="relative shrink-0 size-16">
      <img
        src={song.coverUrl}
        alt={song.title}
        className="size-full rounded-lg object-cover shadow-sm"
      />
      <div className={`absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg transition-opacity duration-300 ${isPlaying || isBuffering ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <span className={`material-symbols-outlined text-white text-3xl drop-shadow-lg ${isBuffering ? 'animate-spin' : ''}`}>
          {isBuffering ? 'progress_activity' : isPlaying ? 'graphic_eq' : 'play_arrow'}
        </span>
      </div>
    </div>

    <div className="flex flex-col justify-center flex-1 min-w-0">
      <p className={`text-slate-900 dark:text-white font-bold text-base truncate ${isPlaying ? 'text-primary' : ''}`}>
        {song.title}
      </p>
      <p className="text-slate-500 dark:text-slate-400 text-sm truncate">
        {song.artist}
      </p>
    </div>

    <div className="hidden sm:block text-right">
      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">{song.album}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">{song.duration}</p>
    </div>

    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onLike(); }}
        className={`p-2 rounded-full transition-colors ${isLiked ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'}`}
      >
        <span className={`material-symbols-outlined ${isLiked ? 'filled-icon' : ''}`}>
          favorite
        </span>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onMore(); }}
        className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <span className="material-symbols-outlined">more_horiz</span>
      </button>
    </div>
    <style>{`
        .filled-icon { font-variation-settings: 'FILL' 1; }
      `}</style>
  </div>
);

// 3. Player Component

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  togglePlay: () => void;
  theme: any;
  currentTime: number;
  duration: number;
  volume: number;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  isLiked: boolean;
  onLike: () => void;
  onAddToPlaylist: () => void;
  onNext: () => void;
  onPrev: () => void;
  isBuffering: boolean;
  usingFallback: boolean;
}

const Player = ({
  currentSong, isPlaying, togglePlay, theme, currentTime, duration, volume,
  onSeek, onVolumeChange, isLiked, onLike, onAddToPlaylist, onNext, onPrev, isBuffering, usingFallback
}: PlayerProps) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  if (!currentSong) return null;

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = volume * 100;

  return (
    <>
      <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 z-[70]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 w-1/3 min-w-0">
              <img src={currentSong.coverUrl} className="size-14 rounded-lg object-cover shadow-md" alt="Album Art" />
              <div className="flex flex-col min-w-0">
                <p className="text-slate-900 dark:text-white font-bold text-base truncate">{currentSong.title}</p>
                <div className="flex items-center gap-2">
                  <p className="text-slate-500 dark:text-slate-400 text-sm truncate">{currentSong.artist}</p>
                  {usingFallback && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 rounded dark:bg-yellow-900 dark:text-yellow-100">Önizleme</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button onClick={onLike} className={`p-1.5 rounded-full transition-colors ${isLiked ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-400 hover:text-red-500'}`}>
                  <span className={`material-symbols-outlined text-xl ${isLiked ? 'filled-icon' : ''}`}>favorite</span>
                </button>
                <button onClick={onAddToPlaylist} className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-xl">playlist_add</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 gap-1">
              <div className="flex items-center gap-6">
                <button onClick={onPrev} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><span className="material-symbols-outlined text-2xl">skip_previous</span></button>
                <button onClick={togglePlay} className={`flex items-center justify-center size-10 rounded-full text-white shadow-lg transition-transform active:scale-95`} style={{ backgroundColor: theme.primary }}>
                  <span className={`material-symbols-outlined text-3xl ${isBuffering ? 'animate-spin' : ''}`}>{isBuffering ? "progress_activity" : isPlaying ? "pause" : "play_arrow"}</span>
                </button>
                <button onClick={onNext} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><span className="material-symbols-outlined text-2xl">skip_next</span></button>
              </div>
              <div className="w-full max-w-md flex items-center gap-2 text-xs text-slate-400 font-medium group">
                <span className="min-w-[40px] text-right">{formatTime(currentTime)}</span>
                <div className="relative flex-1 h-4 flex items-center cursor-pointer">
                  <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => onSeek(Number(e.target.value))} className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer z-20 focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 group-hover:[&::-webkit-slider-thumb]:w-3 group-hover:[&::-webkit-slider-thumb]:h-3 group-hover:[&::-webkit-slider-thumb]:rounded-full group-hover:[&::-webkit-slider-thumb]:bg-white group-hover:[&::-webkit-slider-thumb]:shadow-md transition-all" />
                  <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden z-10">
                    <div className="h-full rounded-full transition-all duration-100 ease-linear" style={{ width: `${progress}%`, backgroundColor: theme.primary }}></div>
                  </div>
                </div>
                <span className="min-w-[40px]">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end w-1/3 gap-2 group">
              <button onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><span className="material-symbols-outlined">{volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}</span></button>
              <div className="relative w-24 h-4 flex items-center cursor-pointer">
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer z-20 focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md transition-all" />
                <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden z-10">
                  <div className="h-full rounded-full transition-all duration-100 ease-linear" style={{ width: `${volumePercent}%`, backgroundColor: theme.primary }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`md:hidden fixed bottom-[70px] left-2 right-2 h-14 bg-slate-800/95 backdrop-blur-xl rounded-lg shadow-2xl z-[80] flex items-center px-3 gap-3 cursor-pointer transition-transform duration-300 ${isMobileExpanded ? 'translate-y-[200%]' : 'translate-y-0'}`} onClick={() => setIsMobileExpanded(true)}>
        <img src={currentSong.coverUrl} className="size-10 rounded-full bg-slate-700 object-cover" alt="Mini Art" style={{ animation: isPlaying ? 'spin 5s linear infinite' : 'none' }} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">{currentSong.title}</p>
          <p className="text-slate-400 text-xs truncate">{currentSong.artist}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onLike(); }} className={`${isLiked ? 'text-primary' : 'text-white'}`}><span className={`material-symbols-outlined text-2xl ${isLiked ? 'filled-icon' : ''}`}>favorite</span></button>
        <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white"><span className={`material-symbols-outlined text-3xl ${isBuffering ? 'animate-spin' : ''}`}>{isBuffering ? "progress_activity" : isPlaying ? "pause" : "play_arrow"}</span></button>
        <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-200" style={{ width: `${progress}%` }}></div></div>
      </div>

      <div className={`md:hidden fixed inset-0 z-[100] bg-slate-900 flex flex-col transition-transform duration-300 ${isMobileExpanded ? 'translate-y-0' : 'translate-y-[100%]'}`}>
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${theme.primary}, #0f172a)` }}></div>
        <div className="relative z-10 flex items-center justify-between p-4 pt-8">
          <button onClick={() => setIsMobileExpanded(false)} className="text-white p-2"><span className="material-symbols-outlined text-3xl">keyboard_arrow_down</span></button>
          <span className="text-xs font-bold tracking-widest text-white/70 uppercase">Şimdi Çalıyor</span>
          <button onClick={onAddToPlaylist} className="text-white p-2"><span className="material-symbols-outlined text-2xl">playlist_add</span></button>
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 gap-8">
          <div className="w-full aspect-square max-w-sm bg-slate-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10"><img src={currentSong.coverUrl} className="w-full h-full object-cover" alt="Full Art" /></div>
          <div className="w-full flex items-center justify-between">
            <div className="flex flex-col gap-1 overflow-hidden">
              <h2 className="text-2xl font-bold text-white truncate">{currentSong.title}</h2>
              <div className="flex items-center gap-2">
                <p className="text-lg text-slate-300 truncate">{currentSong.artist}</p>
                {usingFallback && <span className="text-[10px] bg-yellow-500/20 text-yellow-200 px-1.5 py-0.5 rounded border border-yellow-500/30">Önizleme</span>}
              </div>
            </div>
            <button onClick={onLike} className={`p-2 rounded-full ${isLiked ? 'text-primary' : 'text-white'}`}><span className={`material-symbols-outlined text-3xl ${isLiked ? 'filled-icon' : ''}`}>favorite</span></button>
          </div>
          <div className="w-full space-y-2">
            <div className="relative w-full h-1 bg-slate-700/50 rounded-full group cursor-pointer">
              <input type="range" min="0" max={duration || 100} value={currentTime} onChange={(e) => onSeek(Number(e.target.value))} className="absolute w-full h-6 -top-2.5 opacity-0 cursor-pointer z-20" />
              <div className="h-full bg-white rounded-full relative" style={{ width: `${progress}%` }}><div className="absolute right-0 -top-1.5 size-4 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform"></div></div>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-400"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
          </div>
          <div className="flex items-center justify-center gap-8 w-full max-w-xs">
            <button onClick={onPrev} className="text-white hover:scale-110 transition-transform"><span className="material-symbols-outlined text-5xl">skip_previous</span></button>
            <button onClick={togglePlay} className="size-20 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"><span className={`material-symbols-outlined text-5xl fill-current ${isBuffering ? 'animate-spin' : ''}`}>{isBuffering ? "progress_activity" : isPlaying ? "pause" : "play_arrow"}</span></button>
            <button onClick={onNext} className="text-white hover:scale-110 transition-transform"><span className="material-symbols-outlined text-5xl">skip_next</span></button>
          </div>
        </div>
        <div className="h-10"></div>
      </div>
    </>
  );
};

// --- VIEW COMPONENTS & DATA ---

const initialSongs: Song[] = [];

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// UPDATED HOME VIEW WITH DYNAMIC WEATHER HERO
const HomeView = ({ weather, theme, playlist, loading, onGenerate, currentSong, isPlaying, onPlay, onLike, isLiked, onMore, loadingSongId }: any) => {
  if (!weather) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div></div>;

  const dateMatch = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }); // e.g., "5 Eylül Pazartesi"
  const [day, month, weekday] = dateMatch.split(' '); // This might need adjustment depending on locale output, but let's stick to full string for now.

  // Robust Date Formatting
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }); // "Monday" -> "Pazartesi" (if locale was TR)
  // Let's use hardcoded TR for safety if locale isn't set, or just English/User locale. 
  // Given user speaks Turkish:
  const dayNameTR = now.toLocaleDateString('tr-TR', { weekday: 'long' });
  const dayNum = now.getDate();
  const monthNameTR = now.toLocaleDateString('tr-TR', { month: 'long' });

  const heroTextColor = "text-white";

  return (
    <div className="w-full max-w-6xl mx-auto pb-32">
      {/* Ultra Premium Weather Card - Complete Redesign */}
      <div className="relative overflow-hidden rounded-3xl md:rounded-[2.5rem] min-h-[450px] md:min-h-[480px] shadow-2xl transition-all duration-500 mb-6 md:mb-8">

        {/* Animated Background Layer */}
        <WeatherVisuals code={weather.conditionCode} isDay={weather.isDay} />

        {/* Multi-layer Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-black/5 to-transparent"></div>
        <div className="absolute inset-0 backdrop-blur-[2px]"></div>

        {/* Content Grid */}
        <div className="relative z-10 h-full p-5 sm:p-6 md:p-10 lg:p-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 h-full">

            {/* Left Column - Main Temperature Display */}
            <div className="md:col-span-7 flex flex-col justify-between">

              {/* Top Section - Date & Location */}
              <div className="flex flex-col md:flex-row md:items-start  gap-3 md:gap-4">
                {/* Date Card */}
                <div className="inline-flex flex-col bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl px-5 py-3 shadow-lg hover:bg-white/25 transition-all">
                  <span className="text-xs uppercase tracking-wider font-bold text-white/70">Bugün</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl md:text-4xl font-bold text-white">{dayNum}</span>
                    <span className="text-lg md:text-xl font-medium text-white/90">{monthNameTR}</span>
                    <span className="text-sm text-white/70 ml-1">{dayNameTR}</span>
                  </div>
                </div>

                {/* Location Badge */}
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-4 py-2 shadow-lg hover:bg-white/25 transition-all">
                  <span className="material-symbols-outlined text-base text-white">location_on</span>
                  <span className="font-bold text-sm uppercase tracking-wide text-white">{weather.locationName}</span>
                </div>
              </div>

              {/* Center - Temperature Display */}
              <div className="flex items-end gap-4 md:gap-6 my-6 md:my-0">
                {/* Temperature */}
                <div className="relative">
                  <h1 className="text-[6rem] sm:text-[7rem] md:text-[8rem] lg:text-[9rem] leading-none font-extralight tracking-tighter text-white drop-shadow-2xl">
                    {weather.temperature}°
                  </h1>
                  {/* Animated glow ring */}
                  <div className="absolute -inset-4 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                </div>

                {/* Condition */}
                <div className="flex flex-col gap-2 mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 bg-white rounded-full animate-pulse shadow-lg"></div>
                    <p className="text-2xl md:text-3xl font-bold text-white capitalize drop-shadow-lg">{weather.conditionText}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column - Info Cards & Actions */}
            <div className="md:col-span-5 flex flex-col gap-4 md:gap-5">

              {/* Mood Card */}
              <div className="relative group">
                {/* Animated gradient border */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-500 animate-gradient-xy"></div>
                <div className="relative bg-white/25 backdrop-blur-2xl border border-white/40 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider font-bold text-white/80">Önerilen Mod</span>
                    <span className="text-2xl grayscale brightness-200">✨</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white/90">
                    {getWeatherMood(weather.conditionCode, weather.isDay)}
                  </p>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Feels Like */}
                <div className="bg-white/20 backdrop-blur-xl border border-black/30 rounded-xl p-4 hover:bg-white/25 transition-all">
                  <span className="text-xs uppercase tracking-wider font-bold text-black/70 block mb-1">Hissedilen</span>
                  <span className="text-2xl font-bold text-black">{weather.temperature}°</span>
                </div>

                {/* Precipitation Chance */}
                <div className="bg-white/20 backdrop-blur-xl border border-black/30 rounded-xl p-4 hover:bg-white/25 transition-all">
                  <span className="text-xs uppercase tracking-wider font-bold text-black/70 block mb-1">Yağış İhtimali</span>
                  <span className="text-xl font-bold text-black">
                    {(() => {
                      const code = weather.conditionCode;
                      if (code === 0) return '0%';
                      if (code >= 1 && code <= 3) return '15%';
                      if (code >= 45 && code <= 48) return '5%';
                      if (code >= 51 && code <= 57) return '65%';
                      if (code >= 61 && code <= 67) return '85%';
                      if (code >= 71 && code <= 77) return '75%';
                      if (code >= 80 && code <= 82) return '90%';
                      if (code >= 85 && code <= 86) return '80%';
                      if (code >= 95) return '95%';
                      return '10%';
                    })()}
                  </span>
                </div>
              </div>

              {/* CTA Button - Redesigned */}
              <button
                onClick={() => onGenerate(false)}
                disabled={loading}
                className="relative group/btn overflow-hidden bg-white text-slate-900 rounded-2xl p-5 font-bold shadow-2xl hover:shadow-white/50 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-500"></div>

                <div className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
                      <span className="text-base md:text-lg">Müzik Seçiliyor...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-2xl group-hover/btn:rotate-12 transition-transform">music_note</span>
                      <div className="flex flex-col items-start">
                        <span className="text-base md:text-lg">Yeni Liste Oluştur</span>
                        <span className="text-xs text-slate-600 font-normal">AI ile kişiselleştirilmiş</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
              </button>

            </div>

          </div>
        </div>
      </div>

      {/* Playlist */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {playlist.length > 0 ? "Sizin İçin Seçtiklerimiz" : "Müzik Listesi Oluşturun"}
          </h2>
          {playlist.length > 0 && <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI ✦ </span>}
        </div>

        {playlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-70">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">queue_music</span>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-sm">
              Şu an listeniz boş. Yukarıdaki butona tıklayarak hava durumuna özel bir çalma listesi oluşturun.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playlist.map((song: Song) => (
              <SongItem
                key={song.id}
                song={song}
                onPlay={() => onPlay(song)}
                isPlaying={currentSong?.id === song.id && isPlaying}
                isLiked={isLiked(song.id)}
                onLike={() => onLike(song)}
                onMore={() => onMore(song)}
                isBuffering={loadingSongId === song.id}
              />
            ))}
          </div>
        )}

        {playlist.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => onGenerate(true)} // append = true
              disabled={loading}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-full font-bold transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                  <span>Yükleniyor...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">add_circle</span>
                  <span>Daha Fazla Şarkı Yükle</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const DiscoverView = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
    <span className="material-symbols-outlined text-6xl mb-4 opacity-50">explore</span>
    <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-300 mb-2">Keşfet</h2>
    <p className="max-w-md mx-auto">Çok yakında! Dünyadan popüler listeler ve trendler burada olacak.</p>
  </div>
);

const LibraryView = ({ savedSongs, userPlaylists, activeTab, setActiveTab, currentSong, isPlaying, onPlay, onLike, onMore, onCreatePlaylist, onOpenPlaylistDetail, loadingSongId }: any) => {
  return (
    <div className="w-full max-w-5xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Kütüphanem</h2>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('songs')}
          className={`px-4 py-2 font-bold text-sm transition-colors relative ${activeTab === 'songs' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Beğenilen Şarkılar
          {activeTab === 'songs' && <div className="absolute bottom-[-5px] left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('playlists')}
          className={`px-4 py-2 font-bold text-sm transition-colors relative ${activeTab === 'playlists' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Çalma Listelerim
          {activeTab === 'playlists' && <div className="absolute bottom-[-5px] left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'songs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedSongs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">favorite_border</span>
              <p>Henüz beğenilen şarkı yok.</p>
            </div>
          ) : (
            savedSongs.map((song: Song) => (
              <SongItem
                key={song.id}
                song={song}
                onPlay={() => onPlay(song)}
                isPlaying={currentSong?.id === song.id && isPlaying}
                isLiked={true}
                onLike={() => onLike(song)}
                onMore={() => onMore(song)}
                isBuffering={loadingSongId === song.id}
              />
            ))
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={onCreatePlaylist}
            className="w-full sm:w-auto mb-6 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-bold transition-colors"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Yeni Liste Oluştur
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {userPlaylists.map((pl: any) => (
              <div
                key={pl.id}
                onClick={() => onOpenPlaylistDetail(pl)}
                className="group bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
              >
                <div className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
                  {pl.songs.length > 0 ? (
                    <img src={pl.songs[0].coverUrl} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-slate-400">music_note</span>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-4xl drop-shadow-lg">play_circle</span>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white truncate">{pl.name}</h3>
                <p className="text-xs text-slate-500">{pl.songs.length} Şarkı</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsView = ({ preferences, setPreferences, theme, onSave }: any) => {
  const genres = ["Pop", "Rock", "Indie", "Jazz", "Classical", "Hip Hop", "Electronic", "R&B", "Alternative", "Türkü", "Rap"];
  const languages = ["Türkçe", "İngilizce", "İspanyolca", "Fransızca", "Korece", "Japonca"];

  return (
    <div className="w-full max-w-2xl mx-auto pb-32">
      <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-8">Tercihler</h2>

      <div className="space-y-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
        {/* Genres */}
        <div>
          <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Sevdiğin Türler</label>
          <div className="flex flex-wrap gap-2">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => {
                  if (preferences.genres.includes(genre)) {
                    setPreferences({ ...preferences, genres: preferences.genres.filter((g: string) => g !== genre) });
                  } else {
                    setPreferences({ ...preferences, genres: [...preferences.genres, genre] });
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${preferences.genres.includes(genre)
                  ? `bg-slate-900 text-white shadow-lg scale-105`
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Tercih Ettiğin Diller</label>
          <div className="flex flex-wrap gap-2">
            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => {
                  if (preferences.languages.includes(lang)) {
                    setPreferences({ ...preferences, languages: preferences.languages.filter((l: string) => l !== lang) });
                  } else {
                    setPreferences({ ...preferences, languages: [...preferences.languages, lang] });
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${preferences.languages.includes(lang)
                  ? `bg-slate-900 text-white shadow-lg scale-105`
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Mood Input */}
        <div>
          <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Genel Ruh Halin</label>
          <input
            type="text"
            value={preferences.mood}
            onChange={(e) => setPreferences({ ...preferences, mood: e.target.value })}
            className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 focus:border-primary outline-none font-medium text-slate-900 dark:text-white transition-colors"
            placeholder="Örn: Enerjik, Sakin, Odaklanmış..."
          />
        </div>

        <button
          onClick={onSave}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          style={{ backgroundColor: theme.primary }}
        >
          Kaydet ve Uygula
        </button>
      </div>
    </div>
  );
};

import { LandingView } from "./LandingView";

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.HOME);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({ genres: ["Pop", "Indie"], activity: "Relaxing", mood: "Happy", languages: ["Türkçe", "İngilizce"] });

  // Landing State
  const [showLanding, setShowLanding] = useState(true);

  // Mouse Position for Background Effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePos({ x, y });
    }
  };

  // ... (previous state declarations: savedSongs, userPlaylists, etc.)
  const [savedSongs, setSavedSongs] = useState<Song[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [libraryTab, setLibraryTab] = useState<'songs' | 'playlists'>('songs');

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Modal States
  const [modalMode, setModalMode] = useState<'none' | 'addToPlaylist' | 'createPlaylist' | 'playlistDetail'>('none');
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<Song | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [suggestedHistory, setSuggestedHistory] = useState<Set<string>>(new Set());

  // Location Permission State
  const [locationError, setLocationError] = useState<string | null>(null);

  // Audio State (Pure HTML5 Audio)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const theme = weather ? getThemeColors(weather.conditionCode, weather.isDay) : { primary: '#13b6ec', bg: 'bg-sky-50', text: 'text-sky-600' };

  // --- DB LOADING & INIT ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const prefs = await getUserPreferences();
        if (prefs) setPreferences(prefs);
        setSavedSongs(await getLikedSongsDB());
        setUserPlaylists(await getPlaylistsDB());
      } catch (e) { console.error("DB Load Error", e); }
    };
    loadData();
  }, []);

  // Init Weather with Permission Handling
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const data = await fetchWeather(position.coords.latitude, position.coords.longitude);
            setWeather(data);
            setLocationError(null); // Clear any previous errors
          } catch (e) {
            console.error("Weather fetch error:", e);
            // Fallback weather data
            setWeather({
              temperature: 20,
              conditionCode: 1,
              conditionText: "Parçalı Bulutlu",
              isDay: true,
              locationName: "Varsayılan Konum"
            });
          }
        },
        (error) => {
          // Handle geolocation errors
          console.error("Geolocation error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError("Konum izni reddedildi. Lütfen tarayıcı ayarlarınızdan konum erişimini açın.");
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationError("Konum bilgisi alınamadı. Lütfen GPS'inizi kontrol edin.");
          } else if (error.code === error.TIMEOUT) {
            setLocationError("Konum isteği zaman aşımına uğradı. Lütfen tekrar deneyin.");
          } else {
            setLocationError("Konum alınırken bir hata oluştu.");
          }
        }
      );
    } else {
      setLocationError("Tarayıcınız konum hizmetlerini desteklemiyor.");
    }
  }, []);

  // Hydrate Default Songs
  useEffect(() => {
    const hydrateSongs = async () => {
      const updatedSongs = await Promise.all(initialSongs.map(async (song) => {
        const realData = await fetchRealTrackData(song.title, song.artist);
        if (realData && realData.isValid) {
          return { ...song, previewUrl: realData.previewUrl, coverUrl: realData.coverUrl };
        }
        return song;
      }));
      setPlaylist(updatedSongs);
      setCurrentSong(prev => {
        if (!prev) return updatedSongs[0];
        const updated = updatedSongs.find(s => s.id === prev.id);
        return updated || prev;
      });
    };
    hydrateSongs();
  }, []);

  // --- AUDIO LOGIC ---

  // Sync Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Media Session
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      const artworkSrc = currentSong.coverUrl || 'https://via.placeholder.com/512';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album,
        artwork: [
          { src: artworkSrc, sizes: '512x512', type: 'image/png' },
        ]
      });
      navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play());
      navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
      navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
    }
  }, [currentSong]);

  // Audio Effect Listeners (TimeUpdate, Ended, Error)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => handleNext();
    const onCanPlay = () => setIsBuffering(false);
    const onError = (e: any) => {
      console.error("Audio Error", e);
      setIsBuffering(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
  }, [currentSong]); // Re-bind if currentSong changes (though ref stays same, best practice)


  // --- DB ACTIONS ---
  const savePreferences = async () => {
    await saveUserPreferences(preferences);
    setView(ViewState.HOME);
  };

  const playSong = async (song: Song) => {
    // Toggle if same song
    if (currentSong?.id === song.id && audioRef.current) {
      if (audioRef.current.paused) audioRef.current.play();
      else audioRef.current.pause();
      return;
    }

    // Reset State
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setCurrentSong(song);
    setIsPlaying(false);
    setIsBuffering(true);
    setLoadingSongId(song.id);
    setUsingFallback(false);

    try {
      // Check for streamUrl (Piped) first, then previewUrl
      let streamUrl = song.streamUrl;

      // If no valid streamUrl, try fetching fresh from Piped
      if (!streamUrl) {
        try {
          const ytData = await getAudioStream(song.title, song.artist);
          if (ytData && ytData.url) streamUrl = ytData.url;
        } catch (e) { console.error("YT Stream Error", e); }
      }

      // If still no stream, fallback to iTunes preview
      if (!streamUrl) streamUrl = song.previewUrl;

      if (streamUrl && audioRef.current) {
        audioRef.current.src = streamUrl;
        audioRef.current.load();

        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (playError) {
          console.error("Play Failed", playError);
          setIsPlaying(false);
        }
      } else {
        // Fallback
        alert("Bu şarkı için önizleme bulunamadı.");
        setIsBuffering(false);
      }
    } catch (error) {
      console.error("Song Load Error", error);
      setIsBuffering(false);
    }
    setLoadingSongId(null);
  };

  const handleNext = () => {
    if (!currentSong) return;
    const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextSong = playlist[nextIndex];
    if (nextSong) playSong(nextSong);
  };

  const handlePrev = () => {
    if (!currentSong) return;
    const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    const prevSong = playlist[prevIndex];
    if (prevSong) playSong(prevSong);
  };

  // Revised Generate Logic
  const handleGenerate = async (append: boolean = false) => {
    if (!weather) return;
    setLoading(true);

    const currentArtists = append ? playlist.map(s => s.artist) : [];

    // Pass session history to service
    const excludeContext = {
      artistNames: currentArtists,
      songTitles: Array.from(suggestedHistory) as string[]
    };

    const songs = await generatePlaylist(weather, preferences, excludeContext);

    if (songs.length > 0) {
      if (append) {
        setPlaylist(prev => [...prev, ...songs]);
      } else {
        setPlaylist(songs);
      }

      // Update History
      setSuggestedHistory(prev => {
        const newSet = new Set(prev);
        songs.forEach(s => newSet.add(s.title));
        return newSet;
      });
    }
    setLoading(false);
  };

  const handleLike = async (song: Song) => {
    try {
      const added = await toggleLikeSongDB(song);
      if (added) {
        setSavedSongs(prev => [...prev, song]);
      } else {
        setSavedSongs(prev => prev.filter(s => s.id !== song.id));
      }
    } catch (error) { console.error("Like error", error); }
  };

  // Library & Playlist Actions
  const addToPlaylist = async (playlistId: string, song?: Song) => {
    const targetSong = song || selectedSongForPlaylist;
    if (!targetSong) return;

    const updatedPlaylists = userPlaylists.map(pl => {
      if (pl.id === playlistId) {
        const exists = pl.songs.find(s => s.id === targetSong.id);
        if (!exists) {
          const newSongs = [...pl.songs, targetSong];
          savePlaylistDB({ ...pl, songs: newSongs }); // Async save
          return { ...pl, songs: newSongs };
        }
      }
      return pl;
    });
    setUserPlaylists(updatedPlaylists);
    setModalMode('none');
    setSelectedSongForPlaylist(null);
  };

  const createPlaylist = async () => {
    if (!newPlaylistName) return;
    const newPl: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      songs: [],
      createdAt: Date.now()
    };
    await savePlaylistDB(newPl);
    setUserPlaylists(prev => [...prev, newPl]);
    setNewPlaylistName("");
    setModalMode('none');
  };

  const removeFromPlaylist = async (playlistId: string, songId: string) => {
    const updatedPlaylists = userPlaylists.map(pl => {
      if (pl.id === playlistId) {
        const newSongs = pl.songs.filter(s => s.id !== songId);
        savePlaylistDB({ ...pl, songs: newSongs });
        return { ...pl, songs: newSongs };
      }
      return pl;
    });
    setUserPlaylists(updatedPlaylists);

    // Update active playlist view if open
    if (activePlaylist && activePlaylist.id === playlistId) {
      setActivePlaylist(updatedPlaylists.find(p => p.id === playlistId) || null);
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (confirm("Bu listeyi silmek istediğinize emin misiniz?")) {
      await deletePlaylistDB(playlistId);
      setUserPlaylists(prev => prev.filter(p => p.id !== playlistId));
      setModalMode('none');
      setActivePlaylist(null);
    }
  };

  const openAddToPlaylist = (song: Song) => {
    setSelectedSongForPlaylist(song);
    setModalMode('addToPlaylist');
  };

  const openCreatePlaylistModal = () => setModalMode('createPlaylist');
  const openPlaylistDetail = (pl: Playlist) => {
    setActivePlaylist(pl);
    setModalMode('playlistDetail');
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const handleSeek = (t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const isLiked = (id: string) => savedSongs.some(s => s.id === id);


  // Render Landing View if visible
  if (showLanding) {
    return <LandingView onStart={() => setShowLanding(false)} />;
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`flex flex-col min-h-screen font-inter ${theme.bg || 'bg-slate-50'} transition-colors duration-500 relative overflow-hidden`}
    >
      {/* Soft Interactive Background Layer */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none transition-transform duration-100 ease-out will-change-transform z-0"
        style={{
          background: `
            radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(19, 182, 236, 0.3) 0%, transparent 40%),
            radial-gradient(circle at ${100 - mousePos.x * 100}% ${100 - mousePos.y * 100}%, rgba(168, 85, 247, 0.3) 0%, transparent 40%)
          `
        }}
      />

      {/* Hidden Audio Element */}
      <audio ref={audioRef} crossOrigin="anonymous" />

      <AnimationStyles />

      {/* Location Error Screen */}
      {locationError && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="relative">
              {/* Animated gradient border */}
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl opacity-75 blur-lg animate-pulse"></div>

              <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-full p-6">
                      <span className="material-symbols-outlined text-6xl text-red-400">location_off</span>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                  Konum İzni Gerekli
                </h2>

                {/* Error Message */}
                <p className="text-lg text-white/80 text-center mb-8">
                  {locationError}
                </p>

                {/* Instructions */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400">info</span>
                    Konum İznini Nasıl Açarım?
                  </h3>
                  <ol className="space-y-3 text-white/70">
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-400">1.</span>
                      <span>Tarayıcınızın adres çubuğundaki <strong className="text-white">kilit</strong> veya <strong className="text-white">bilgi</strong> ikonuna tıklayın</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-400">2.</span>
                      <span><strong className="text-white">Konum</strong> ayarını bulun ve <strong className="text-white">"İzin Ver"</strong> seçeneğini seçin</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-blue-400">3.</span>
                      <span>Sayfayı yenileyin veya aşağıdaki butona tıklayın</span>
                    </li>
                  </ol>
                </div>

                {/* Retry Button */}
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined text-2xl">refresh</span>
                  <span>Tekrar Dene</span>
                </button>

                {/* Alternative Note */}
                <p className="text-sm text-white/50 text-center mt-6">
                  Konum izni vermek istemiyorsanız, varsayılan hava durumu ile devam edebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Header view={view} setView={setView} theme={theme} onLogoClick={() => setShowLanding(true)} />

      <main className="flex-1 flex px-4 sm:px-6 md:px-8 mt-4 pt-24 min-h-screen relative z-10">
        {view === ViewState.HOME && (
          <HomeView
            weather={weather}
            theme={theme}
            playlist={playlist}
            loading={loading}
            onGenerate={handleGenerate}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={playSong}
            onLike={handleLike}
            isLiked={isLiked}
            onMore={openAddToPlaylist}
            loadingSongId={loadingSongId}
          />
        )}
        {/* Discover View Removed */}
        {view === ViewState.LIBRARY && (
          <LibraryView
            savedSongs={savedSongs}
            userPlaylists={userPlaylists}
            activeTab={libraryTab}
            setActiveTab={setLibraryTab}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={playSong}
            onLike={handleLike}
            onMore={openAddToPlaylist}
            onCreatePlaylist={openCreatePlaylistModal}
            onOpenPlaylistDetail={openPlaylistDetail}
            loadingSongId={loadingSongId}
          />
        )}
        {view === ViewState.SETTINGS && (
          <SettingsView
            preferences={preferences}
            setPreferences={setPreferences}
            theme={theme}
            onSave={savePreferences}
          />
        )}
      </main>

      {/* ... Modals and Mobile Nav ... */}
      <Modal
        isOpen={modalMode === 'addToPlaylist'}
        onClose={() => setModalMode('none')}
        title="Çalma Listesine Ekle"
      >
        <div className="flex flex-col gap-4">
          {userPlaylists.length > 0 ? (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {userPlaylists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => addToPlaylist(pl.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400">queue_music</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{pl.name}</p>
                      <p className="text-xs text-slate-500">{pl.songs.length} Şarkı</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">Henüz bir çalma listen yok.</p>
          )}
          <button
            onClick={() => setModalMode('createPlaylist')}
            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Yeni Liste Oluştur
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={modalMode === 'createPlaylist'}
        onClose={() => setModalMode('none')}
        title="Yeni Çalma Listesi"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Liste Adı</label>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Örn: Gece Sürüşü"
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white font-medium"
              autoFocus
            />
          </div>
          <button
            onClick={createPlaylist}
            disabled={!newPlaylistName.trim()}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Oluştur
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={modalMode === 'playlistDetail' && activePlaylist !== null}
        onClose={() => setModalMode('none')}
        title={activePlaylist?.name || "Detaylar"}
      >
        <div className="flex flex-col h-[60vh]">
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {activePlaylist && activePlaylist.songs.length === 0 && (
              <p className="text-slate-500 text-center py-10">Bu listede henüz şarkı yok.</p>
            )}
            {activePlaylist?.songs.map(song => (
              <div
                key={song.id}
                onClick={() => playSong(song)}
                className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative size-10 flex-shrink-0">
                    <img src={song.coverUrl} className="size-10 rounded object-cover" />
                    {currentSong?.id === song.id && (isPlaying || isBuffering) && (
                      <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center">
                        <span className={`material-symbols-outlined text-white text-lg ${isBuffering ? 'animate-spin' : 'animate-pulse'}`}>
                          {isBuffering ? 'progress_activity' : 'graphic_eq'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate ${currentSong?.id === song.id ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{song.title}</p>
                    <p className="text-xs text-slate-500 truncate">{song.artist}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromPlaylist(activePlaylist.id, song.id); }}
                  className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Listeden Çıkar"
                >
                  <span className="material-symbols-outlined text-xl">do_not_disturb_on</span>
                </button>
              </div>
            ))}
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <p className="text-xs text-slate-400">{activePlaylist?.songs.length} Şarkı</p>
            <button
              onClick={() => deletePlaylist(activePlaylist!.id)}
              className="text-red-500 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              Listeyi Sil
            </button>
          </div>
        </div>
      </Modal>

      <Player
        currentSong={currentSong}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        togglePlay={togglePlay}
        theme={theme}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        isLiked={currentSong ? isLiked(currentSong.id) : false}
        onLike={() => currentSong && handleLike(currentSong)}
        onAddToPlaylist={() => currentSong && openAddToPlaylist(currentSong)}
        onNext={handleNext}
        onPrev={handlePrev}
        usingFallback={usingFallback}
      />

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-[90]">
        {[
          { id: ViewState.HOME, icon: "home", label: "Ana Sayfa" },
          { id: ViewState.LIBRARY, icon: "library_music", label: "Kütüphane" },
          { id: ViewState.SETTINGS, icon: "person", label: "Profil" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${view === item.id ? 'text-primary scale-105' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <span className={`material-symbols-outlined text-2xl mb-0.5 ${view === item.id ? 'filled-icon' : ''}`}>{item.icon}</span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
