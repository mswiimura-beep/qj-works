(() => {
  const list = document.getElementById("noteHighlightsList");
  const news = document.getElementById("noteNews");

  if (!list || !news) return;

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date).replaceAll("/", ".");
  };

  const appendArticle = (item) => {
    const link = document.createElement("a");
    const date = document.createElement("time");
    const title = document.createElement("span");
    const formattedDate = formatDate(item.publishedAt);

    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener";
    date.dateTime = item.publishedAt;
    date.textContent = formattedDate;
    title.textContent = item.title;
    link.append(date, title);
    list.append(link);
  };

  fetch("data/note-highlights.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("note feed unavailable");
      return response.json();
    })
    .then((feed) => {
      const articles = Array.isArray(feed.articles) ? feed.articles : [];
      if (!articles.length) throw new Error("note feed empty");

      list.replaceChildren();
      articles.slice(0, 3).forEach(appendArticle);

      const latest = articles[0];
      const date = document.getElementById("noteNewsDate");
      const title = document.getElementById("noteNewsTitle");
      const link = document.getElementById("noteNewsLink");

      date.dateTime = latest.publishedAt;
      date.textContent = formatDate(latest.publishedAt);
      title.textContent = `noteを更新しました: ${latest.title}`;
      link.href = latest.url;
      news.hidden = false;
    })
    .catch(() => {
      list.replaceChildren();
      const message = document.createElement("p");
      message.className = "noteLoading";
      message.textContent = "最新の記事はnoteでご覧いただけます。";
      list.append(message);
    });
})();
