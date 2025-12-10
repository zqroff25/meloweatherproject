
import { WeatherData } from '../types';

// Helper to get detailed location name (District, City)
const fetchLocationName = async (lat: number, lng: number): Promise<string> => {
  try {
    // Using OpenStreetMap Nominatim API for reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12`
    );
    const data = await response.json();
    
    const address = data.address;
    if (!address) return 'Bilinmiyor';

    // Try to find the most relevant administrative levels
    const district = address.suburb || address.district || address.neighbourhood || address.town;
    const city = address.province || address.city || address.state || address.region;

    if (district && city) {
      return `${district}, ${city}`;
    } else if (city) {
      return city;
    }
    return 'Konumunuz';
  } catch (error) {
    console.warn("Location reverse geocoding failed:", error);
    return 'Konumunuz';
  }
};

export const fetchWeather = async (lat: number, lng: number): Promise<WeatherData> => {
  try {
    // 1. Fetch Weather Data
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,is_day,weather_code&timezone=auto`
    );
    const weatherData = await weatherResponse.json();
    
    // 2. Fetch Location Name concurrently
    const locationName = await fetchLocationName(lat, lng);

    const code = weatherData.current.weather_code;
    const isDay = weatherData.current.is_day === 1;
    const temp = weatherData.current.temperature_2m;

    let conditionText = 'Bilinmiyor';
    
    // Simple WMO code mapping
    if (code === 0) conditionText = 'Açık';
    else if (code === 1) conditionText = 'Az Bulutlu';
    else if (code === 2) conditionText = 'Parçalı Bulutlu';
    else if (code === 3) conditionText = 'Kapalı';
    else if (code >= 45 && code <= 48) conditionText = 'Sisli';
    else if (code >= 51 && code <= 67) conditionText = 'Yağmurlu';
    else if (code >= 71 && code <= 77) conditionText = 'Karlı';
    else if (code >= 80 && code <= 82) conditionText = 'Sağanak Yağış';
    else if (code >= 95) conditionText = 'Fırtına';

    return {
      temperature: Math.round(temp),
      conditionCode: code,
      conditionText,
      isDay,
      locationName: locationName
    };
  } catch (error) {
    console.error("Weather fetch error:", error);
    throw error;
  }
};

// UI İçin Türkçe Mod Tanımı
export const getWeatherMood = (code: number, isDay: boolean): string => {
  // Açık / Güneşli
  if (code === 0 || code === 1) {
    return isDay ? "Enerjik & Canlı" : "Keyifli & Romantik";
  }
  
  // Parçalı Bulutlu (Kullanıcı isteği: Daha sakin olmalı)
  if (code === 2) {
    return "Huzurlu & Sakin";
  }

  // Kapalı / Bulutlu
  if (code === 3) {
    return "Düşünceli & Dingin";
  }

  // Sisli
  if (code >= 45 && code <= 48) {
    return "Gizemli & Lo-Fi";
  }

  // Yağmurlu / Çiseleme
  if (code >= 51 && code <= 67) {
    return "Melankolik & Duygusal";
  }

  // Karlı
  if (code >= 71 && code <= 77) {
    return "Sıcak & Akustik"; // Karlı havada sıcak kahve modu
  }

  // Sağanak / Fırtına (Kullanıcı isteği: Kasvetli ve düşük mod)
  if (code >= 80 || code >= 95) {
    return "Kasvetli & Derin";
  }
  
  return "Karışık & Alternatif";
};

export const getThemeColors = (code: number, isDay: boolean) => {
  // Sunny / Clear
  if (code === 0 || code === 1) {
    return {
      primary: '#f59e0b', // Amber/Orange
      bg: 'bg-orange-50', 
      text: 'text-orange-600',
      accent: 'bg-orange-500'
    };
  }
  // Partly Cloudy / Cloudy
  if (code === 2 || code === 3) {
    return {
      primary: '#64748b', // Slate
      bg: 'bg-slate-50', 
      text: 'text-slate-600',
      accent: 'bg-slate-500'
    };
  }
  // Rain / Storm / Fog
  if (code >= 45) {
    return {
      primary: '#3b82f6', // Blue
      bg: 'bg-blue-50', 
      text: 'text-blue-600',
      accent: 'bg-blue-500'
    };
  }
  
  // Default
  return {
    primary: '#13b6ec',
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    accent: 'bg-primary'
  };
};
