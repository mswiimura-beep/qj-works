(function () {
  const meta = document.querySelector('meta[name="google-analytics-id"]');
  const measurementId = meta ? meta.content.trim() : "";

  if (!/^G-[A-Z0-9]+$/.test(measurementId)) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }

  gtag("js", new Date());
  gtag("config", measurementId);
})();
