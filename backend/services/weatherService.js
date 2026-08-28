// backend/services/weatherService.js
const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    // IIT Guwahati coordinates
    this.lat = 26.1879;
    this.lon = 91.6912;
  }

  async checkWeatherForBooking(startTime, endTime) {
    try {
      if (!this.apiKey || this.apiKey === 'your_api_key_here') {
        return {
          checked: false,
          suitable: true,
          conditions: 'Weather check unavailable',
          warning: 'API key not configured - proceeding without check'
        };
      }

      const response = await axios.get(
        'https://api.openweathermap.org/data/2.5/forecast',
        {
          params: {
            lat: this.lat,
            lon: this.lon,
            appid: this.apiKey,
            units: 'metric'
          }
        }
      );

      const forecasts = response.data.list;
      const startTimestamp = startTime.getTime() / 1000;
      const endTimestamp = endTime.getTime() / 1000;

      const relevantForecast = forecasts.find(f =>
        f.dt * 1000 >= startTimestamp && f.dt * 1000 <= endTimestamp
      ) || forecasts[0];

      const { main, weather, wind, rain } = relevantForecast;
      const temperature = main.temp;
      const conditions = weather[0].main;
      const windSpeed = wind.speed;
      const humidity = main.humidity;
      const warnings = [];
      let suitable = true;

      if (rain && rain['3h'] > 0) {
        warnings.push(`Rain expected: ${rain['3h']}mm`);
        suitable = false;
      }

      if (['Thunderstorm', 'Snow', 'Extreme'].includes(conditions)) {
        warnings.push(`Dangerous conditions: ${weather[0].description}`);
        suitable = false;
      }

      if (temperature < 10) {
        warnings.push(`Very cold: ${temperature}°C`);
        suitable = false;
      } else if (temperature > 40) {
        warnings.push(`Very hot: ${temperature}°C`);
        suitable = false;
      }

      if (windSpeed > 10) {
        warnings.push(`High winds: ${windSpeed} m/s`);
        suitable = false;
      }

      return {
        checked: true,
        suitable,
        conditions: `${conditions} (${weather[0].description})`,
        temperature: Math.round(temperature),
        windSpeed: Math.round(windSpeed * 10) / 10,
        humidity,
        warning: warnings.length > 0 ? warnings.join('; ') : 'Conditions are suitable for outdoor sports',
        details: {
          feelsLike: Math.round(main.feels_like),
          temp: Math.round(temperature)
        }
      };
    } catch (error) {
      console.error('Weather API error:', error.message);
      return {
        checked: false,
        suitable: true,
        conditions: 'Unable to fetch weather',
        warning: 'Weather check failed - proceeding with booking'
      };
    }
  }
}

module.exports = new WeatherService();