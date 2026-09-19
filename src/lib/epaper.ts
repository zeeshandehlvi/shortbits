import { getSafeImageBase64 } from "./articles.functions";

// ShortBits E-Paper Multi-Column Newspaper Engine

export type EPaperStory = {
  id: number;
  source: string;
  city?: string;
  topic: "Politics" | "Sports" | "Tech" | "Business" | "Crime" | string;
  age: string;
  title: string;
  image: string;
  category: string;
  likes?: string;
  comments?: string;
  views?: string;
  date?: string;
  author: string;
  body: string[];
  publishedAt?: number;
};

export async function loadSafeImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;

  // 1. Data URL or local relative path (always safe and same-origin)
  if (src.startsWith("data:") || src.startsWith("/")) {
    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = src;
      await image.decode();
      return image.width ? image : null;
    } catch {
      return null;
    }
  }

  // 2. Fetch safe base64 via server proxy to prevent canvas tainting
  try {
    const base64 = await getSafeImageBase64({ data: { url: src } });
    if (base64) {
      const image = new Image();
      image.src = base64;
      await image.decode();
      return image.width ? image : null;
    }
  } catch {
    // server proxy failed or timed out, try client fallback
  }

  // 3. Fallback: direct anonymous crossOrigin
  try {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = src;
    await image.decode();
    return image.width ? image : null;
  } catch {
    return null;
  }
}

export async function downloadStoryClip(story: EPaperStory): Promise<boolean> {
  const image = await loadSafeImage(story.image);

  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  if (!measureContext) return false;

  const wrapText = (text: string, maxWidth: number, font: string) => {
    measureContext.font = font;
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (measureContext.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const titleFont = "800 60px Manrope, sans-serif";
  const bodyFont = "400 34px Manrope, sans-serif";
  const titleLines = wrapText(story.title, 920, titleFont);
  const bodyLines = story.body.map((paragraph) => wrapText(paragraph, 920, bodyFont));
  const bodyHeight = bodyLines.reduce((total, lines) => total + lines.length * 52 + 42, 0);
  const contentStart = 820;
  const metadataHeight = 170;
  const footerHeight = 150;

  const renderCanvas = (withImage: boolean): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = contentStart + titleLines.length * 74 + metadataHeight + bodyHeight + footerHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D Context not available");

    // Background
    context.fillStyle = "#faf8f3";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Masthead Banner
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, 132);
    context.fillStyle = "#012c6c";
    context.font = "900 58px 'Space Grotesk', Manrope, sans-serif";
    context.fillText("ShortBits", 58, 84);
    const logoWidth = context.measureText("ShortBits").width;
    context.fillStyle = "#24febf";
    context.fillText(".", 58 + logoWidth, 84);

    context.fillStyle = "#56667a";
    context.font = "600 24px Manrope, sans-serif";
    context.textAlign = "right";
    context.fillText("e-Clip  •  theshortbits.com", 1022, 80);
    context.textAlign = "left";

    const imageTop = 132;
    const imageHeight = 548;

    if (withImage && image) {
      const scale = Math.max(canvas.width / image.width, imageHeight / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.save();
      context.beginPath();
      context.rect(0, imageTop, canvas.width, imageHeight);
      context.clip();
      context.drawImage(image, (canvas.width - width) / 2, imageTop + (imageHeight - height) / 2, width, height);
      context.restore();
    } else {
      // Elegant editorial gradient header fallback
      const grad = context.createLinearGradient(0, imageTop, canvas.width, imageTop + imageHeight);
      grad.addColorStop(0, "#012c6c");
      grad.addColorStop(0.5, "#0b244d");
      grad.addColorStop(1, "#030f24");
      context.fillStyle = grad;
      context.fillRect(0, imageTop, canvas.width, imageHeight);

      // Gold/Cyan accent line
      context.strokeStyle = "#24febf";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(58, imageTop + 70);
      context.lineTo(160, imageTop + 70);
      context.stroke();

      context.fillStyle = "#24febf";
      context.font = "800 28px Manrope, sans-serif";
      context.fillText(story.topic.toUpperCase(), 58, imageTop + 130);

      context.fillStyle = "#ffffff";
      context.font = "900 56px 'Space Grotesk', Manrope, sans-serif";
      context.fillText("ShortBits e-Clip", 58, imageTop + 215);

      context.fillStyle = "rgba(255, 255, 255, 0.8)";
      context.font = "500 28px Manrope, sans-serif";
      context.fillText("Daily Digital Edition  •  Verified News", 58, imageTop + 280);
    }

    // Story metadata & title
    context.fillStyle = "#012c6c";
    context.font = "700 27px Manrope, sans-serif";
    context.fillText(
      `${story.topic.toUpperCase()}  •  ${story.city ? `${story.city}, ` : ""}${story.source}  •  ${story.age}`,
      58,
      730
    );

    context.fillStyle = "#10213a";
    context.font = titleFont;
    titleLines.forEach((text, index) => context.fillText(text, 58, contentStart + index * 74));

    let cursorY = contentStart + titleLines.length * 74 + 38;
    context.fillStyle = "#56667a";
    context.font = "500 27px Manrope, sans-serif";
    context.fillText(`${story.date ?? "Daily Edition"}  •  By ${story.author}`, 58, cursorY);
    if (story.likes || story.comments || story.views) {
      context.fillText(
        `${story.likes ?? "1.2k"} likes  •  ${story.comments ?? "84"} comments  •  ${story.views ?? "5.4k"} views`,
        58,
        cursorY + 52
      );
      cursorY += 108;
    } else {
      cursorY += 72;
    }

    context.strokeStyle = "#ddd8cd";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(58, cursorY);
    context.lineTo(1022, cursorY);
    context.stroke();
    cursorY += 64;

    context.fillStyle = "#263548";
    context.font = bodyFont;
    for (const paragraphLines of bodyLines) {
      paragraphLines.forEach((text, index) => context.fillText(text, 58, cursorY + index * 52));
      cursorY += paragraphLines.length * 52 + 42;
    }

    context.strokeStyle = "#ddd8cd";
    context.beginPath();
    context.moveTo(58, cursorY + 10);
    context.lineTo(1022, cursorY + 10);
    context.stroke();
    context.fillStyle = "#012c6c";
    context.font = "700 27px Manrope, sans-serif";
    context.fillText("Read full stories at theshortbits.com  •  Daily E-Paper & Live Feed", 58, cursorY + 72);

    return canvas;
  };

  const saveCanvas = async (c: HTMLCanvasElement): Promise<boolean> => {
    return new Promise((resolve) => {
      c.toBlob(async (blob) => {
        if (!blob) {
          try {
            const dataUrl = c.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `shortbits-clip-${story.id}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            resolve(true);
          } catch {
            resolve(false);
          }
          return;
        }

        const filename = `shortbits-clip-${story.id}.png`;
        const file = new File([blob], filename, { type: "image/png" });

        if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: story.title,
              text: `${story.title} - ShortBits e-Clip`,
              files: [file],
            });
            resolve(true);
            return;
          } catch (shareErr: any) {
            if (shareErr?.name === "AbortError") {
              resolve(true);
              return;
            }
          }
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 1200);
        resolve(true);
      }, "image/png");
    });
  };

  try {
    const canvas = renderCanvas(true);
    const success = await saveCanvas(canvas);
    if (success) return true;
  } catch (err) {
    console.warn("Primary e-clip render failed, retrying with fallback header:", err);
  }

  // Guaranteed fallback: Render without external image to prevent tainted canvas SecurityError
  try {
    const fallbackCanvas = renderCanvas(false);
    return await saveCanvas(fallbackCanvas);
  } catch (fallbackErr) {
    console.error("All e-clip export methods failed:", fallbackErr);
    return false;
  }
}

export function storyHoursAgo(story: EPaperStory): number {
  const match = /(\d+)\s*(minute|hour|day)/i.exec(story.age);
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2]!.toLowerCase();
  if (unit === "minute") return value / 60;
  if (unit === "day") return value * 24;
  return value;
}

export function formatEditionDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getStoriesForDate(targetDate: Date, allStories: EPaperStory[]): EPaperStory[] {
  if (!allStories || allStories.length === 0) return [];

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Stories published on that specific day
  const onDay = allStories.filter((s) => {
    if (!s.publishedAt) return false;
    return s.publishedAt >= startOfDay.getTime() && s.publishedAt <= endOfDay.getTime();
  });

  if (onDay.length >= 3) return onDay;

  const now = new Date();
  const isToday = now.toDateString() === targetDate.toDateString();
  if (isToday) {
    const recent = allStories.filter((s) => storyHoursAgo(s) <= 24);
    if (recent.length) return recent;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.toDateString() === targetDate.toDateString();
  if (isYesterday) {
    const yestStories = allStories.filter((s) => {
      const diff = s.publishedAt ? now.getTime() - s.publishedAt : storyHoursAgo(s) * 3600000;
      return diff >= 12 * 3600000 && diff <= 48 * 3600000;
    });
    if (yestStories.length >= 2) return yestStories;
  }

  // Stable pseudo-random permutation based on date seed so every past date has a consistent edition
  const dayOfYear = Math.floor((targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / 86400000);
  const offset = dayOfYear % allStories.length;
  return [...allStories.slice(offset), ...allStories.slice(0, offset)];
}

export async function renderEpaperCanvases(
  targetDate: Date,
  allStories: EPaperStory[],
  onlyFirstPage = false
): Promise<{ canvases: HTMLCanvasElement[]; pageCount: number; leadStory: EPaperStory; edition: EPaperStory[]; dateLabel: string }> {
  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  if (!measureContext) {
    throw new Error("Canvas 2D context not available");
  }

  const wrap = (text: string, maxWidth: number, font: string) => {
    measureContext.font = font;
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (measureContext.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const edition = getStoriesForDate(targetDate, allStories);
  if (edition.length === 0) {
    throw new Error("No stories available to generate E-Paper");
  }

  const lead = edition[0]!;
  const rest = edition.slice(1);

  const imageCache = new Map<string, HTMLImageElement | null>();
  const imagesToLoad = Array.from(new Set(edition.map((story) => story.image)));
  await Promise.all(
    imagesToLoad.map(async (src) => {
      imageCache.set(src, await loadSafeImage(src));
    })
  );

  // Page geometry (A3 portrait ratio: 1680x2376)
  const W = 1680;
  const H = 2376;
  const M = 72;
  const colGap = 40;
  const COLS = 3;
  const colWidth = (W - M * 2 - colGap * (COLS - 1)) / COLS;
  const footerHeight = 96;
  const bottomLimit = H - footerHeight;

  const leadTitleFont = "800 74px Manrope, sans-serif";
  const leadBodyFont = "400 28px Manrope, sans-serif";
  const itemTitleFont = "800 36px Manrope, sans-serif";
  const itemBodyFont = "400 25px Manrope, sans-serif";

  const mastheadHeight = 250;
  const leadImageHeight = 620;
  const leadTitleLines = wrap(lead.title, W - M * 2, leadTitleFont);
  const leadBodyWidth = (W - M * 2 - colGap) / 2;
  const leadBodyAll = wrap(lead.body.join(" "), leadBodyWidth, leadBodyFont);
  const leadBodyRows = Math.min(Math.ceil(leadBodyAll.length / 2), 7);
  const leadLeft = leadBodyAll.slice(0, leadBodyRows);
  const leadRight = leadBodyAll.slice(leadBodyRows, leadBodyRows * 2);
  const leadBlockHeight =
    leadImageHeight + 48 + leadTitleLines.length * 86 + 44 + leadBodyRows * 44 + 48;

  type Item = {
    story: EPaperStory;
    title: string[];
    body: string[];
    imageHeight: number;
    height: number;
  };

  const items: Item[] = rest.map((story) => {
    const title = wrap(story.title, colWidth, itemTitleFont);
    const body = wrap(story.body.join(" "), colWidth, itemBodyFont);
    const imageHeight = Math.round(colWidth * 0.62);
    const clamped =
      body.length > 12
        ? [...body.slice(0, 11), `${body[11]!.replace(/[ ,.;:]+$/, "")}…`]
        : body;
    return {
      story,
      title,
      body: clamped,
      imageHeight,
      height: imageHeight + 26 + 34 + title.length * 44 + 18 + clamped.length * 38 + 46,
    };
  });

  type Placement = { item: Item; page: number; column: number; y: number };
  const placements: Placement[] = [];
  let page = 0;
  let column = 0;
  let cursor = mastheadHeight + leadBlockHeight;
  const columnTopFor = (p: number) => (p === 0 ? mastheadHeight + leadBlockHeight : M + 40);
  const chromeHeight = (item: Item) =>
    item.imageHeight + 26 + 34 + item.title.length * 44 + 18 + 46;
  const MIN_BODY_LINES = 4;

  for (const item of items) {
    let available = bottomLimit - cursor;
    const minHeight = chromeHeight(item) + MIN_BODY_LINES * 38;
    if (available < minHeight) {
      column += 1;
      if (column >= COLS) {
        page += 1;
        column = 0;
      }
      cursor = columnTopFor(page);
      available = bottomLimit - cursor;
    }
    const maxBodyLines = Math.max(
      MIN_BODY_LINES,
      Math.floor((available - chromeHeight(item)) / 38)
    );
    if (item.body.length > maxBodyLines) {
      item.body = [
        ...item.body.slice(0, maxBodyLines - 1),
        `${item.body[maxBodyLines - 1]!.replace(/[ ,.;:]+$/, "")}…`,
      ];
    }
    item.height = chromeHeight(item) + item.body.length * 38;
    placements.push({ item, page, column, y: cursor });
    cursor += item.height;
  }

  const pageCount = page + 1;
  const dateLabel = formatEditionDate(targetDate);
  const now = new Date();
  const isToday = now.toDateString() === targetDate.toDateString();
  const isYesterday =
    new Date(now.setDate(now.getDate() - 1)).toDateString() === targetDate.toDateString();

  const editionSubtitle = isToday
    ? "TODAY'S E-PAPER  •  theshortbits.com"
    : isYesterday
    ? "YESTERDAY'S E-PAPER  •  theshortbits.com"
    : `DAILY E-PAPER ARCHIVE  •  theshortbits.com`;

  const renderPage = (pageIndex: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#faf8f3";
    ctx.fillRect(0, 0, W, H);

    if (pageIndex === 0) {
      ctx.fillStyle = "#012c6c";
      ctx.font = "900 104px 'Space Grotesk', Manrope, sans-serif";
      ctx.textAlign = "center";
      const brand = "ShortBits";
      const brandWidth = ctx.measureText(brand).width;
      ctx.fillText(brand, W / 2 - 16, 118);
      ctx.textAlign = "left";
      ctx.fillStyle = "#24febf";
      ctx.fillText(".", W / 2 - 16 + brandWidth / 2, 118);

      ctx.textAlign = "center";
      ctx.fillStyle = "#56667a";
      ctx.font = "700 28px Manrope, sans-serif";
      ctx.fillText(editionSubtitle, W / 2, 166);
      ctx.fillText(dateLabel, W / 2, 208);
      ctx.textAlign = "left";

      ctx.strokeStyle = "#012c6c";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(M, 232);
      ctx.lineTo(W - M, 232);
      ctx.stroke();

      // Lead Story
      let y = mastheadHeight;
      const leadImage = imageCache.get(lead.image) ?? null;
      if (leadImage) {
        const scale = Math.max((W - M * 2) / leadImage.width, leadImageHeight / leadImage.height);
        const iw = leadImage.width * scale;
        const ih = leadImage.height * scale;
        ctx.save();
        ctx.beginPath();
        ctx.rect(M, y, W - M * 2, leadImageHeight);
        ctx.clip();
        ctx.drawImage(leadImage, M + (W - M * 2 - iw) / 2, y + (leadImageHeight - ih) / 2, iw, ih);
        ctx.restore();
      }
      y += leadImageHeight + 48;

      ctx.fillStyle = "#10213a";
      ctx.font = leadTitleFont;
      leadTitleLines.forEach((line, index) => ctx.fillText(line, M, y + index * 86));
      y += leadTitleLines.length * 86 + 10;

      ctx.fillStyle = "#012c6c";
      ctx.font = "700 25px Manrope, sans-serif";
      ctx.fillText(
        `${lead.topic.toUpperCase()}  •  ${lead.city ? `${lead.city}, ` : ""}${lead.source}  •  ${lead.age}  •  ${lead.author}`,
        M,
        y
      );
      y += 40;

      ctx.fillStyle = "#263548";
      ctx.font = leadBodyFont;
      leadLeft.forEach((line, index) => ctx.fillText(line, M, y + index * 44));
      leadRight.forEach((line, index) =>
        ctx.fillText(line, M + leadBodyWidth + colGap, y + index * 44)
      );
      y += leadBodyRows * 44 + 26;

      ctx.strokeStyle = "#d8d2c5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(M, y);
      ctx.lineTo(W - M, y);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#012c6c";
      ctx.font = "900 40px 'Space Grotesk', Manrope, sans-serif";
      ctx.fillText("ShortBits", M, M + 4);
      ctx.fillStyle = "#56667a";
      ctx.font = "700 22px Manrope, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(dateLabel.toUpperCase(), W - M, M + 4);
      ctx.textAlign = "left";
      ctx.strokeStyle = "#012c6c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(M, M + 22);
      ctx.lineTo(W - M, M + 22);
      ctx.stroke();
    }

    // Column Rules
    ctx.strokeStyle = "#e3ded3";
    ctx.lineWidth = 1.5;
    for (let c = 1; c < COLS; c += 1) {
      const x = M + c * (colWidth + colGap) - colGap / 2;
      ctx.beginPath();
      ctx.moveTo(x, columnTopFor(pageIndex) - 24);
      ctx.lineTo(x, bottomLimit - 24);
      ctx.stroke();
    }

    for (const placement of placements.filter((entry) => entry.page === pageIndex)) {
      const { item } = placement;
      const x = M + placement.column * (colWidth + colGap);
      let cy = placement.y;

      const image = imageCache.get(item.story.image) ?? null;
      if (image) {
        const scale = Math.max(colWidth / image.width, item.imageHeight / image.height);
        const iw = image.width * scale;
        const ih = image.height * scale;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, cy, colWidth, item.imageHeight);
        ctx.clip();
        ctx.drawImage(image, x + (colWidth - iw) / 2, cy + (item.imageHeight - ih) / 2, iw, ih);
        ctx.restore();
      }
      cy += item.imageHeight + 26;

      ctx.fillStyle = "#012c6c";
      ctx.font = "700 22px Manrope, sans-serif";
      ctx.fillText(
        `${item.story.topic.toUpperCase()}  •  ${item.story.city ? `${item.story.city}, ` : ""}${item.story.source}  •  ${item.story.age}`,
        x,
        cy
      );
      cy += 34;

      ctx.fillStyle = "#10213a";
      ctx.font = itemTitleFont;
      item.title.forEach((line, index) => ctx.fillText(line, x, cy + index * 44));
      cy += item.title.length * 44 + 18;

      ctx.fillStyle = "#263548";
      ctx.font = itemBodyFont;
      item.body.forEach((line, index) => ctx.fillText(line, x, cy + index * 38));
      cy += item.body.length * 38 + 22;

      ctx.strokeStyle = "#e3ded3";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, cy);
      ctx.lineTo(x + colWidth, cy);
      ctx.stroke();
    }

    const footerY = H - 44;
    ctx.strokeStyle = "#012c6c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(M, footerY - 38);
    ctx.lineTo(W - M, footerY - 38);
    ctx.stroke();
    ctx.fillStyle = "#012c6c";
    ctx.font = "700 24px Manrope, sans-serif";
    ctx.fillText("Read more at theshortbits.com", M, footerY);
    ctx.textAlign = "center";
    ctx.fillText(`${edition.length} stories · ${dateLabel}`, W / 2, footerY);
    ctx.textAlign = "right";
    ctx.fillText(`Page ${pageIndex + 1} of ${pageCount}`, W - M, footerY);
    ctx.textAlign = "left";

    return canvas;
  };

  const canvases: HTMLCanvasElement[] = [];
  const limit = onlyFirstPage ? 1 : pageCount;
  for (let i = 0; i < limit; i++) {
    const c = renderPage(i);
    if (c) canvases.push(c);
  }

  return {
    canvases,
    pageCount,
    leadStory: lead,
    edition,
    dateLabel,
  };
}

export async function downloadEpaperPDF(targetDate: Date, allStories: EPaperStory[]): Promise<void> {
  const { canvases, pageCount } = await renderEpaperCanvases(targetDate, allStories, false);
  const W = 1680;
  const H = 2376;

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [W * 0.36, H * 0.36] });

  for (let index = 0; index < pageCount; index += 1) {
    const canvas = canvases[index];
    if (!canvas) continue;
    if (index > 0) pdf.addPage([W * 0.36, H * 0.36], "portrait");
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, W * 0.36, H * 0.36);
  }

  const dateStr = targetDate.toISOString().slice(0, 10);
  pdf.save(`shortbits-epaper-${dateStr}.pdf`);
}

export async function getFrontPagePreview(
  targetDate: Date,
  allStories: EPaperStory[]
): Promise<{ dataUrl: string; pageCount: number; leadStory: EPaperStory; edition: EPaperStory[]; dateLabel: string }> {
  const { canvases, pageCount, leadStory, edition, dateLabel } = await renderEpaperCanvases(targetDate, allStories, true);
  const frontCanvas = canvases[0];
  if (!frontCanvas) {
    throw new Error("Unable to render front page");
  }
  return {
    dataUrl: frontCanvas.toDataURL("image/jpeg", 0.85),
    pageCount,
    leadStory,
    edition,
    dateLabel,
  };
}
