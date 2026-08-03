(() => {
  const selector = [
    "main h1",
    "main h2",
    "main h3",
    "main p",
    "main li",
    "main small",
    ".footer p",
  ].join(",");

  const keepTogether = 6;

  const protectEnding = (element) => {
    if (element.querySelector(".noOrphan")) return;

    const fullText = element.textContent.trim();
    if (Array.from(fullText).length < keepTogether + 4) return;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let currentNode;

    while ((currentNode = walker.nextNode())) {
      if (currentNode.nodeValue.trim()) textNodes.push(currentNode);
    }

    const lastNode = textNodes.at(-1);
    if (!lastNode) return;

    const rawText = lastNode.nodeValue;
    const trailingSpace = rawText.match(/\s*$/u)?.[0] ?? "";
    const visibleText = rawText.slice(0, rawText.length - trailingSpace.length);
    const characters = Array.from(visibleText);
    if (characters.length < keepTogether) return;

    const protectedText = characters.slice(-keepTogether).join("");
    const startOffset = visibleText.length - protectedText.length;
    const range = document.createRange();
    range.setStart(lastNode, startOffset);
    range.setEnd(lastNode, visibleText.length);

    const span = document.createElement("span");
    span.className = "noOrphan";
    range.surroundContents(span);
  };

  const protectPage = () => {
    document.querySelectorAll(selector).forEach(protectEnding);
  };

  const start = () => {
    protectPage();

    const main = document.querySelector("main");
    if (!main) return;

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        protectPage();
      });
    });

    observer.observe(main, { childList: true, subtree: true, characterData: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
