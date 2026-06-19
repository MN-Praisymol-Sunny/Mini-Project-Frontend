import { useEffect, useState } from "react";
import "./index.css";

const API_KEY = "8987ea13243f9861559697c54414ae1d";

const getWeatherState = (weather) => {
  const main = weather?.weather?.[0]?.main?.toLowerCase() || "sunny";
  if (main.includes("thunder") || main.includes("storm")) return "thunderstorm";
  if (main.includes("rain") || main.includes("drizzle")) return "rainy";
  if (main.includes("cloud")) return "cloudy";
  if (main.includes("snow")) return "snowy";
  if (main.includes("mist") || main.includes("fog") || main.includes("haze")) return "cloudy";
  return "sunny";
};

const parseResponse = async (res) => {
  const data = await res.json();
  if (!res.ok || (data.cod && data.cod !== 200 && data.cod !== "200")) {
    throw new Error(data.message || "Unable to load weather data.");
  }
  return data;
};

 function WeatherApp() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");

  const fetchForecast = async (url) => {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || (data.cod && data.cod !== "200")) {
      throw new Error(data.message || "Unable to load forecast.");
    }
    const hourly = data.list.slice(0, 12);
    const daily = data.list.filter((item, index) => index % 8 === 0);
    return { hourly, daily };
  };

  const updateForecastState = (forecastData) => {
    setForecast(forecastData.daily);
    setHourlyForecast(forecastData.hourly);
  };

  const getWeather = async (cityName) => {
    if (!cityName) {
      setError("Please enter a city name.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const weatherData = await parseResponse(
        await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
        )
      );
      setWeather(weatherData);
      const forecastData = await fetchForecast(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      updateForecastState(forecastData);
    } catch (err) {
      setError(err.message);
      setWeather(null);
      setForecast([]);
      setHourlyForecast([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocationWeather = () => {
    setError("");
    setIsLoading(true);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const weatherData = await parseResponse(
            await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
            )
          );
          setWeather(weatherData);
          const forecastData = await fetchForecast(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
          );
          updateForecastState(forecastData);
        } catch (err) {
          setError(err.message);
          setWeather(null);
          setForecast([]);
          setHourlyForecast([]);
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setError("Location access denied or unavailable.");
        setIsLoading(false);
      },
      { timeout: 15000 }
    );
  };

  useEffect(() => {
    const fetchLocationWeather = async () => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const weatherData = await parseResponse(
              await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
              )
            );
            setWeather(weatherData);
            const forecastData = await fetchForecast(
              `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
            );
            updateForecastState(forecastData);
          } catch (err) {
            setError(err.message);
            setWeather(null);
            setForecast([]);
            setHourlyForecast([]);
          } finally {
            setIsLoading(false);
          }
        },
        () => {
          setError("Location access denied or unavailable.");
          setIsLoading(false);
        },
        { timeout: 15000 }
      );
    };

    fetchLocationWeather();
  }, []);

  const currentWeather = getWeatherState(weather);
  const pageClass = darkMode ? "dark-mode" : "light-mode";

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setVoiceStatus("Listening...");

    recognition.onresult = (event) => {
      const spokenCity = event.results[0][0].transcript;
      setCity(spokenCity);
      setVoiceStatus(`Searching for ${spokenCity}`);
      getWeather(spokenCity);
    };

    recognition.onerror = () => {
      setVoiceStatus("Could not recognize speech. Try again.");
    };

    recognition.onend = () => {
      if (!voiceStatus.startsWith("Searching")) {
        setVoiceStatus("Voice search ended.");
      }
    };

    recognition.start();
  };

  return (
    <div className={`weather-page ${currentWeather} ${pageClass}`}>
      <div className="weather-scene">
        {(currentWeather === "sunny" || currentWeather === "cloudy" || currentWeather === "thunderstorm") && <div className="cloud-layer" />}
        {(currentWeather === "rainy" || currentWeather === "thunderstorm") && <div className="rain-layer" />}
        {currentWeather === "snowy" && <div className="snow-layer" />}
        {(currentWeather === "sunny" || currentWeather === "cloudy") && <div className="sun-layer" />}
        {(currentWeather === "thunderstorm") && <div className="lightning-layer" />}
        {weather?.wind?.speed > 8 && <div className="wind-layer" />}
      </div>

      <div className="weather-card">
        <h1>🌤 WeatherVista</h1>

        <div className="controls">
          <input
            type="text"
            placeholder="Enter city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="text-input"
          />
          <button className="button primary" onClick={() => getWeather(city)}>
            Search
          </button>
          <button className="button secondary" onClick={getLocationWeather}>
            📍 My Location
          </button>
          <button className="button accent" onClick={startVoiceSearch}>
            🎙 Voice Search
          </button>
          <button className="button tertiary" onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {voiceStatus && <div className="message voice">{voiceStatus}</div>}
        {error && <div className="message error">{error}</div>}
        {isLoading && !weather && <div className="message loading">Loading weather...</div>}

        {weather && (
          <div className="weather-info">
            <h2>
              {weather.name}, {weather.sys.country}
            </h2>
            <img
              src={`https://openweathermap.org/img/wn/${weather.weather?.[0]?.icon}@2x.png`}
              alt={weather.weather?.[0]?.description || "weather icon"}
              className="weather-icon"
            />
            <h1>{Math.round(weather.main.temp)}°C</h1>
            <p className="description">{weather.weather?.[0]?.description}</p>
            <div className="stats">
              <div>
                <h3>Humidity</h3>
                <p>{weather.main.humidity}%</p>
              </div>
              <div>
                <h3>Pressure</h3>
                <p>{weather.main.pressure} hPa</p>
              </div>
              <div>
                <h3>Wind</h3>
                <p>{weather.wind.speed} m/s</p>
              </div>
            </div>
          </div>
        )}

        {hourlyForecast.length > 0 && (
          <>
            <h2 className="forecast-title">Hourly Forecast</h2>
            <div className="hourly-row">
              {hourlyForecast.map((hour, index) => (
                <div key={index} className="hourly-card">
                  <p>{new Date(hour.dt_txt).toLocaleTimeString("en-US", { hour: "numeric", hour12: true })}</p>
                  <img
                    src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png`}
                    width="54"
                    alt={hour.weather[0].main}
                  />
                  <strong>{Math.round(hour.main.temp)}°</strong>
                  <span>{hour.weather[0].main}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="forecast-title">5 Day Forecast</h2>
        <div className="forecast-row">
          {forecast.length === 0 && !isLoading && (
            <p className="forecast-empty">Search a city or use location to see forecast.</p>
          )}
          {forecast.map((day, index) => (
            <div key={index} className="forecast-card">
              <h3>{new Date(day.dt_txt).toLocaleDateString("en-US", { weekday: "short" })}</h3>
              <img
                src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                width="70"
                alt={day.weather[0].main}
              />
              <h2>{Math.round(day.main.temp)}°C</h2>
              <p>{day.weather[0].main}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
 export default WeatherApp;