const WEATHER_ENDPOINT =
  "https://www.jma.go.jp/bosai/forecast/data/forecast/020000.json";

function applyTimeTheme() {
  const hour = new Date().getHours();
  let theme = "night";

  if (hour >= 4 && hour < 6) theme = "dawn";
  else if (hour >= 6 && hour < 10) theme = "morning";
  else if (hour >= 10 && hour < 17) theme = "day";
  else if (hour >= 17 && hour < 20) theme = "evening";

  document.documentElement.dataset.timeTheme = theme;
}

function dateKeyInJapan(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function tomorrowKeyInJapan() {
  const now = new Date();
  const japanParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const values = Object.fromEntries(japanParts.map(({ type, value }) => [type, value]));
  const tomorrowAtNoonUtc = new Date(
    Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + 1, 3)
  );
  return dateKeyInJapan(tomorrowAtNoonUtc);
}

function weatherIcon(code) {
  const firstDigit = String(code || "")[0];
  if (firstDigit === "1") return "☀️";
  if (firstDigit === "2") return "☁️";
  if (firstDigit === "3") return "🌧️";
  if (firstDigit === "4") return "🌨️";
  return "🌤️";
}

function compactWeatherText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/所により.*$/, "")
    .trim();
}

function valueForDate(timeDefines, values, targetDate, hour) {
  const index = timeDefines.findIndex((value) => {
    const date = String(value).slice(0, 10);
    const forecastHour = Number(String(value).slice(11, 13));
    return date === targetDate && (hour === undefined || forecastHour === hour);
  });
  return index >= 0 ? values[index] : "";
}

async function loadTomorrowWeather() {
  const summary = document.getElementById("weatherSummary");
  const temperatures = document.getElementById("weatherTemps");
  const icon = document.getElementById("weatherIcon");
  if (!summary || !temperatures || !icon) return;

  try {
    const response = await fetch(WEATHER_ENDPOINT, { cache: "no-store" });
    if (!response.ok) throw new Error("Forecast request failed");

    const forecasts = await response.json();
    const shortForecast = forecasts[0];
    const targetDate = tomorrowKeyInJapan();

    const weatherSeries = shortForecast.timeSeries[0];
    const tsugaru = weatherSeries.areas.find((item) => item.area.code === "020010");
    const weatherText = compactWeatherText(
      valueForDate(weatherSeries.timeDefines, tsugaru.weathers, targetDate)
    );
    const code = valueForDate(weatherSeries.timeDefines, tsugaru.weatherCodes, targetDate);

    const temperatureSeries = shortForecast.timeSeries.find((series) =>
      series.areas?.some((item) => item.area.code === "31312")
    );
    const aomori = temperatureSeries?.areas.find((item) => item.area.code === "31312");
    const minimum = aomori
      ? valueForDate(temperatureSeries.timeDefines, aomori.temps, targetDate, 0)
      : "";
    const maximum = aomori
      ? valueForDate(temperatureSeries.timeDefines, aomori.temps, targetDate, 9)
      : "";

    if (!weatherText) throw new Error("Tomorrow forecast unavailable");

    icon.textContent = weatherIcon(code);
    summary.textContent = weatherText;
    temperatures.textContent =
      minimum && maximum ? `最高 ${maximum}℃ / 最低 ${minimum}℃` : "気温は発表待ちです";
  } catch {
    icon.textContent = "—";
    summary.textContent = "現在、予報を取得できません";
    temperatures.textContent = "気象庁の予報をご確認ください";
  }
}

applyTimeTheme();
loadTomorrowWeather();
setInterval(applyTimeTheme, 60 * 1000);
