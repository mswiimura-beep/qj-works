(function () {
  const defaultMeasurementId = "G-TB84MESWPF";
  const internalStorageKey = "qj_analytics_internal";
  const searchParams = new URLSearchParams(window.location.search);
  const internalSetting = searchParams.get("qj_internal");

  try {
    if (internalSetting === "1") {
      window.localStorage.setItem(internalStorageKey, "1");
    } else if (internalSetting === "0") {
      window.localStorage.removeItem(internalStorageKey);
    }

    if (window.localStorage.getItem(internalStorageKey) === "1") {
      return;
    }
  } catch (_error) {
    // localStorageが使えない環境でも、通常の計測は続ける。
  }

  const meta = document.querySelector('meta[name="google-analytics-id"]');
  const measurementId = meta && meta.content.trim()
    ? meta.content.trim()
    : defaultMeasurementId;

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

  function classifyDestination(link, url) {
    const href = link.getAttribute("href") || "";
    const hostname = url.hostname.replace(/^www\./, "");
    const pathname = url.pathname;

    if (hostname === "coconala.com") return "coconala";
    if (hostname === "docs.google.com" && pathname.includes("/forms/")) return "inquiry_form";
    if (hostname === "readyfor.jp") return "crowdfunding";
    if (hostname === "note.com") return "note";
    if (hostname === "amazon.co.jp") return "amazon_book";
    if (hostname === "suzuri.jp") return "suzuri";
    if (hostname.includes("gan-soudan-support")) return "cancer_support_app";
    if (pathname.endsWith("/cancer-support.html") || href === "cancer-support.html") return "cancer_support";
    if (pathname.endsWith("/reservation-demo.html") || href.startsWith("reservation-demo.html")) return "business_demo";
    if (href === "#business-support") return "business_support";

    return "";
  }

  document.addEventListener("click", function (event) {
    const target = event.target;
    const link = target instanceof Element ? target.closest("a[href]") : null;

    if (!link) return;

    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (_error) {
      return;
    }

    const destination = classifyDestination(link, url);
    if (!destination) return;

    gtag("event", "qj_sales_path_click", {
      qj_destination: destination,
      link_url: `${url.origin}${url.pathname}`,
      link_text: (link.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80),
      page_path: window.location.pathname,
      transport_type: "beacon"
    });
  });
})();
