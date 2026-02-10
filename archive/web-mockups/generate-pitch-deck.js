const PptxGenJS = require("pptxgenjs");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 16:9

// ─── COLOR PALETTE ───
const C = {
  darkPurple: "2D1B69",
  medPurple: "6B3FA0",
  lightPurple: "9B72CF",
  lavender: "E8DEFF",
  white: "FFFFFF",
  charcoal: "1A1A2E",
  gold: "F5A623",
  cardBorder: "D0C0F0",
};

// ─── REUSABLE HELPERS ───
function shadowOpts() {
  return { type: "outer", blur: 6, offset: 3, color: "000000", opacity: 0.15 };
}

function cardRect(slide, x, y, w, h, fill) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: fill || C.lavender },
    rectRadius: 0.15,
    shadow: shadowOpts(),
    line: { color: C.cardBorder, width: 0.75 },
  });
}

function addTitle(slide, text, opts = {}) {
  slide.addText(text, {
    x: 0.8,
    y: 0.4,
    w: 11.5,
    h: 0.7,
    fontSize: opts.fontSize || 28,
    fontFace: "Georgia",
    bold: true,
    color: opts.color || C.charcoal,
    margin: 0,
    ...opts,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLIDE 1 — TITLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  const slide = pptx.addSlide();
  slide.background = { color: C.darkPurple };

  slide.addText("GLIMPSE", {
    x: 0, y: 2.2, w: "100%", h: 1.2,
    fontSize: 60, fontFace: "Georgia", bold: true,
    color: C.white, align: "center", charSpacing: 6,
    margin: 0,
  });

  slide.addText("Documenting Kindness, Creating Connections", {
    x: 0, y: 3.4, w: "100%", h: 0.6,
    fontSize: 20, fontFace: "Calibri", italic: true,
    color: C.lightPurple, align: "center", margin: 0,
  });

  slide.addText("Derrick Woepking  |  Founder", {
    x: 0, y: 6.4, w: "100%", h: 0.35,
    fontSize: 12, fontFace: "Calibri",
    color: C.white, align: "center", margin: 0,
  });

  slide.addText("Hackathon Submission 2026", {
    x: 0, y: 6.75, w: "100%", h: 0.3,
    fontSize: 10, fontFace: "Calibri",
    color: C.lightPurple, align: "center", margin: 0,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLIDE 2 — THE PROBLEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  const slide = pptx.addSlide();
  slide.background = { color: C.darkPurple };

  slide.addText("The charitable giving industry is broken on both sides.", {
    x: 0.8, y: 0.35, w: 11.5, h: 0.7,
    fontSize: 28, fontFace: "Georgia", bold: true,
    color: C.white, margin: 0,
  });

  // LEFT — Donors card
  cardRect(slide, 0.8, 1.3, 5.5, 3.6, C.lavender);

  slide.addText("DONORS", {
    x: 1.1, y: 1.45, w: 5, h: 0.45,
    fontSize: 16, fontFace: "Calibri", bold: true,
    color: C.darkPurple, margin: 0,
  });

  slide.addText([
    { text: "No transparency into where money goes", options: { bullet: true, breakLine: true } },
    { text: "No connection to the people they help", options: { bullet: true, breakLine: true } },
    { text: "70% never give again", options: { bullet: true, bold: true, breakLine: true } },
    { text: "Source: FEP / Kindsight 2024", options: { fontSize: 9, color: C.medPurple, breakLine: true } },
    { text: "Only 7.2% of new donors are retained", options: { bullet: true, bold: true, breakLine: true } },
    { text: "Source: FEP Q1 2024", options: { fontSize: 9, color: C.medPurple } },
  ], {
    x: 1.1, y: 2.0, w: 4.9, h: 2.6,
    fontSize: 14, fontFace: "Calibri",
    color: C.charcoal, valign: "top", margin: 0,
    lineSpacingMultiple: 1.15,
  });

  // RIGHT — Nonprofits card
  cardRect(slide, 6.8, 1.3, 5.5, 3.6, C.lavender);

  slide.addText("NONPROFITS", {
    x: 7.1, y: 1.45, w: 5, h: 0.45,
    fontSize: 16, fontFace: "Calibri", bold: true,
    color: C.darkPurple, margin: 0,
  });

  slide.addText([
    { text: "20-35% of budget on overhead & fundraising", options: { bullet: true, breakLine: true } },
    { text: "Source: BBB / Giving Compass", options: { fontSize: 9, color: C.medPurple, breakLine: true } },
    { text: "Lose half their donors every year", options: { bullet: true, bold: true, breakLine: true } },
    { text: "Source: Virtuous 2025", options: { fontSize: 9, color: C.medPurple, breakLine: true } },
    { text: "New donor acquisition costs 5x retention", options: { bullet: true, breakLine: true } },
    { text: "Source: Dataro 2024", options: { fontSize: 9, color: C.medPurple, breakLine: true } },
    { text: "No scalable way to close the feedback loop", options: { bullet: true } },
  ], {
    x: 7.1, y: 2.0, w: 4.9, h: 2.6,
    fontSize: 14, fontFace: "Calibri",
    color: C.charcoal, valign: "top", margin: 0,
    lineSpacingMultiple: 1.15,
  });

  // Bottom callout
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.5, y: 5.3, w: 10, h: 0.8,
    fill: { color: C.darkPurple },
    line: { color: C.gold, width: 1.5 },
    rectRadius: 0.12,
  });

  slide.addText("$592.5B industry running on a broken feedback loop", {
    x: 1.5, y: 5.3, w: 10, h: 0.8,
    fontSize: 22, fontFace: "Georgia", bold: true,
    color: C.gold, align: "center", valign: "middle", margin: 0,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLIDE 3 — THE SOLUTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  const slide = pptx.addSlide();
  slide.background = { color: C.lavender };

  addTitle(slide, "Glimpse fixes both sides simultaneously.");

  // LEFT card — For Donors
  cardRect(slide, 0.8, 1.4, 5.5, 3.5, C.white);

  slide.addText("For Donors", {
    x: 1.1, y: 1.55, w: 5, h: 0.45,
    fontSize: 18, fontFace: "Georgia", bold: true,
    color: C.medPurple, margin: 0,
  });

  slide.addText([
    { text: "Give crypto to real causes", options: { bullet: true, breakLine: true } },
    { text: 'Receive a "Glimpse" \u2014 photos, notes, and thank-yous showing your exact impact', options: { bullet: true, breakLine: true } },
    { text: "See where every dollar went, verified on-chain", options: { bullet: true } },
  ], {
    x: 1.1, y: 2.15, w: 4.9, h: 2.4,
    fontSize: 14, fontFace: "Calibri",
    color: C.charcoal, valign: "top", margin: 0,
    lineSpacingMultiple: 1.3,
  });

  // RIGHT card — For Nonprofits
  cardRect(slide, 6.8, 1.4, 5.5, 3.5, C.white);

  slide.addText("For Nonprofits", {
    x: 7.1, y: 1.55, w: 5, h: 0.45,
    fontSize: 18, fontFace: "Georgia", bold: true,
    color: C.medPurple, margin: 0,
  });

  slide.addText([
    { text: "Modern, low-cost platform (1% fee vs 3-10% industry standard)", options: { bullet: true, breakLine: true } },
    { text: "Simple tools to document and share impact", options: { bullet: true, breakLine: true } },
    { text: "Built-in donor retention through the Glimpse feedback loop", options: { bullet: true } },
  ], {
    x: 7.1, y: 2.15, w: 4.9, h: 2.4,
    fontSize: 14, fontFace: "Calibri",
    color: C.charcoal, valign: "top", margin: 0,
    lineSpacingMultiple: 1.3,
  });

  // Bottom tagline
  slide.addText("Not another donation app \u2014 infrastructure for a new model of charity.", {
    x: 0.8, y: 5.4, w: 11.5, h: 0.5,
    fontSize: 15, fontFace: "Calibri", italic: true,
    color: C.medPurple, align: "center", margin: 0,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLIDE 4 — HOW IT WORKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  const slide = pptx.addSlide();
  slide.background = { color: C.white };

  addTitle(slide, "Four steps from donation to human connection.");

  const steps = [
    { num: "1", label: "Choose", desc: "Browse giving tiers\n($20 / $100\u2013$1,000 / Custom)" },
    { num: "2", label: "Connect", desc: "Link your Solana wallet" },
    { num: "3", label: "Give", desc: "Send crypto, verified\non-chain in seconds" },
    { num: "4", label: "Glimpse", desc: "Receive photos, notes &\nthank-yous from the\nperson you helped" },
  ];

  const cardW = 2.6;
  const gap = 0.35;
  const startX = 0.8;

  steps.forEach((s, i) => {
    const x = startX + i * (cardW + gap);
    const isLast = i === 3;
    const borderColor = isLast ? C.gold : C.cardBorder;
    const borderWidth = isLast ? 2 : 0.75;

    // Card background
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.5, w: cardW, h: 3.8,
      fill: { color: isLast ? "FFF8EC" : C.lavender },
      rectRadius: 0.15,
      shadow: shadowOpts(),
      line: { color: borderColor, width: borderWidth },
    });

    // Number circle
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + cardW / 2 - 0.3, y: 1.75, w: 0.6, h: 0.6,
      fill: { color: isLast ? C.gold : C.medPurple },
    });

    slide.addText(s.num, {
      x: x + cardW / 2 - 0.3, y: 1.75, w: 0.6, h: 0.6,
      fontSize: 22, fontFace: "Georgia", bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });

    // Step label
    slide.addText(s.label, {
      x: x + 0.1, y: 2.55, w: cardW - 0.2, h: 0.5,
      fontSize: 20, fontFace: "Georgia", bold: true,
      color: isLast ? C.gold : C.darkPurple, align: "center", margin: 0,
    });

    // Description
    slide.addText(s.desc, {
      x: x + 0.2, y: 3.15, w: cardW - 0.4, h: 1.8,
      fontSize: 13, fontFace: "Calibri",
      color: C.charcoal, align: "center", valign: "top", margin: 0,
      lineSpacingMultiple: 1.2,
    });

    // Arrow between cards
    if (i < 3) {
      slide.addText("\u25B6", {
        x: x + cardW + 0.02, y: 3.0, w: gap - 0.04, h: 0.5,
        fontSize: 16, color: C.medPurple, align: "center", valign: "middle", margin: 0,
      });
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLIDE 5 — COMMUNITY & LEADERBOARDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  const slide = pptx.addSlide();
  slide.background = { color: C.lavender };

  addTitle(slide, "Generosity is better together.");

  // LEFT explanation
  cardRect(slide, 0.8, 1.4, 5.5, 3.6, C.white);

  slide.addText([
    { text: "Connect your X account", options: { bullet: true, breakLine: true } },
    { text: "Represent your community (NFT project, sports team, crypto community)", options: { bullet: true, breakLine: true } },
    { text: "Communities compete to give \u2014 public leaderboard ranked by total donated", options: { bullet: true, breakLine: true } },
    { text: "Turns giving from guilt-driven to social and fun", options: { bullet: true, bold: true } },
  ], {
    x: 1.1, y: 1.6, w: 4.9, h: 3.2,
    fontSize: 14, fontFace: "Calibri",
    color: C.charcoal, valign: "top", margin: 0,
    lineSpacingMultiple: 1.35,
  });

  // RIGHT — Leaderboard
  cardRect(slide, 6.8, 1.4, 5.5, 3.6, C.white);

  slide.addText("COMMUNITY LEADERBOARD", {
    x: 7.1, y: 1.55, w: 5, h: 0.4,
    fontSize: 13, fontFace: "Calibri", bold: true,
    color: C.medPurple, margin: 0,
  });

  const leaders = [
    { rank: "#1", name: "DeGods Community", amount: "$4,820", donors: "23 donors" },
    { rank: "#2", name: "Solana Mobile", amount: "$3,200", donors: "18 donors" },
    { rank: "#3", name: "Mad Wolves", amount: "$2,150", donors: "12 donors" },
  ];

  leaders.forEach((l, i) => {
    const y = 2.15 + i * 0.85;
    const rowColor = i === 0 ? "FFF3DC" : (i === 1 ? "F3ECFF" : C.lavender);

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.1, y, w: 4.9, h: 0.7,
      fill: { color: rowColor },
      rectRadius: 0.1,
      line: { color: C.cardBorder, width: 0.5 },
    });

    // Rank
    slide.addText(l.rank, {
      x: 7.2, y, w: 0.5, h: 0.7,
      fontSize: 18, fontFace: "Georgia", bold: true,
      color: i === 0 ? C.gold : C.medPurple, valign: "middle", margin: 0,
    });

    // Name
    slide.addText(l.name, {
      x: 7.8, y, w: 2.0, h: 0.7,
      fontSize: 13, fontFace: "Calibri", bold: true,
      color: C.charcoal, valign: "middle", margin: 0,
    });

    // Amount
    slide.addText(l.amount, {
      x: 9.9, y, w: 1.0, h: 0.7,
      fontSize: 14, fontFace: "Calibri", bold: true,
      color: C.darkPurple, valign: "middle", align: "right", margin: 0,
    });

    // Donors
    slide.addText(l.donors, {
      x: 11.0, y, w: 0.9, h: 0.7,
      fontSize: 11, fontFace: "Calibri",
      color: C.lightPurple, valign: "middle", align: "right", margin: 0,
    });
  });

  // Bottom callout
  slide.addText("Organic donor acquisition \u2014 nonprofits spend $0 on marketing", {
    x: 0.8, y: 5.4, w: 11.5, h: 0.5,
    fontSize: 15, fontFace: "Calibri", italic: true, bold: true,
    color: C.medPurple, align: "center", margin: 0,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLIDE 6 — MARKET OPPORTUNITY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  const slide = pptx.addSlide();
  slide.background = { color: C.white };

  addTitle(slide, "A massive market ready for disruption.");

  const stats = [
    { num: "$592.5B", label: "U.S. charitable giving\nin 2024", src: "Giving USA 2025" },
    { num: "$1B+", label: "Crypto donated to\nnonprofits in 2024", src: "The Giving Block 2025" },
    { num: "$2.5B", label: "Projected crypto\ngiving in 2025", src: "The Giving Block" },
    { num: "70%", label: "Top 100 U.S. charities\nnow accept crypto", src: "The Giving Block / Infinite Giving" },
  ];

  const statW = 2.7;
  const statGap = 0.2;
  const startX = 0.65;

  stats.forEach((s, i) => {
    const x = startX + i * (statW + statGap);

    cardRect(slide, x, 1.4, statW, 3.2, C.lavender);

    // Big number
    slide.addText(s.num, {
      x, y: 1.6, w: statW, h: 1.2,
      fontSize: 44, fontFace: "Georgia", bold: true,
      color: C.gold, align: "center", valign: "middle", margin: 0,
    });

    // Label
    slide.addText(s.label, {
      x: x + 0.15, y: 2.85, w: statW - 0.3, h: 0.9,
      fontSize: 13, fontFace: "Calibri",
      color: C.charcoal, align: "center", valign: "top", margin: 0,
      lineSpacingMultiple: 1.2,
    });

    // Source
    slide.addText(s.src, {
      x: x + 0.15, y: 3.9, w: statW - 0.3, h: 0.4,
      fontSize: 9, fontFace: "Calibri", italic: true,
      color: C.lightPurple, align: "center", valign: "bottom", margin: 0,
    });
  });

  // Bottom bar
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 5.1, w: 11.5, h: 0.7,
    fill: { color: C.darkPurple },
    rectRadius: 0.1,
  });

  slide.addText("Charity fundraising platform market: $1.09B \u2192 $2.51B by 2033 (9.1% CAGR)", {
    x: 0.8, y: 5.1, w: 11.5, h: 0.7,
    fontSize: 15, fontFace: "Calibri", bold: true,
    color: C.white, align: "center", valign: "middle", margin: 0,
  });

  slide.addText("Source: Business Research Insights", {
    x: 0.8, y: 5.85, w: 11.5, h: 0.3,
    fontSize: 9, fontFace: "Calibri", italic: true,
    color: C.lightPurple, align: "center", margin: 0,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLIDE 7 — REVENUE MODEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  const slide = pptx.addSlide();
  slide.background = { color: C.lavender };

  addTitle(slide, "Simple. Transparent. Aligned.");

  // Center callout — 1%
  slide.addText("1%", {
    x: 0.8, y: 1.3, w: 5.5, h: 1.5,
    fontSize: 80, fontFace: "Georgia", bold: true,
    color: C.gold, align: "center", valign: "middle", margin: 0,
  });

  slide.addText("Flat fee on every donation. That\u2019s it.", {
    x: 0.8, y: 2.7, w: 5.5, h: 0.4,
    fontSize: 15, fontFace: "Calibri",
    color: C.charcoal, align: "center", margin: 0,
  });

  // Comparison bars
  const comparisons = [
    { name: "Glimpse", fee: "1%", barW: 1.2, color: C.gold },
    { name: "GoFundMe", fee: "2.9% + $0.30", barW: 2.8, color: C.lightPurple },
    { name: "The Giving Block", fee: "5% + subscription", barW: 4.0, color: C.medPurple },
    { name: "Traditional processors", fee: "3\u20135%", barW: 3.5, color: C.darkPurple },
  ];

  comparisons.forEach((c, i) => {
    const y = 3.35 + i * 0.55;

    // Label
    slide.addText(c.name, {
      x: 0.8, y, w: 2.2, h: 0.4,
      fontSize: 12, fontFace: "Calibri", bold: true,
      color: C.charcoal, valign: "middle", align: "right", margin: 0,
    });

    // Bar
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 3.1, y: y + 0.05, w: c.barW, h: 0.3,
      fill: { color: c.color },
      rectRadius: 0.06,
    });

    // Fee label
    slide.addText(c.fee, {
      x: 3.2 + c.barW, y, w: 1.8, h: 0.4,
      fontSize: 12, fontFace: "Calibri", bold: true,
      color: C.charcoal, valign: "middle", margin: 0,
    });
  });

  // Right column — Revenue projections
  cardRect(slide, 7.0, 1.3, 5.3, 2.0, C.white);

  slide.addText("Revenue at Scale", {
    x: 7.2, y: 1.4, w: 4.9, h: 0.4,
    fontSize: 15, fontFace: "Georgia", bold: true,
    color: C.darkPurple, margin: 0,
  });

  slide.addText([
    { text: "$2.5M donations \u2192 $25K revenue", options: { bullet: true, breakLine: true } },
    { text: "$25M donations \u2192 $250K revenue", options: { bullet: true, breakLine: true } },
    { text: "$125M donations \u2192 $1.25M revenue", options: { bullet: true, bold: true } },
  ], {
    x: 7.2, y: 1.9, w: 4.9, h: 1.2,
    fontSize: 14, fontFace: "Calibri",
    color: C.charcoal, valign: "top", margin: 0,
    lineSpacingMultiple: 1.3,
  });

  // Bottom
  slide.addText("On a $100 donation, $99 reaches the cause.", {
    x: 0.8, y: 5.4, w: 11.5, h: 0.5,
    fontSize: 16, fontFace: "Calibri", bold: true, italic: true,
    color: C.darkPurple, align: "center", margin: 0,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLIDE 8 — WHY SOLANA / WHY NOW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  const slide = pptx.addSlide();
  slide.background = { color: C.white };

  addTitle(slide, "Built on Solana. Built for Seeker.");

  // CARD 1
  cardRect(slide, 0.8, 1.4, 5.5, 3.3, C.lavender);

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 1.4, w: 5.5, h: 0.6,
    fill: { color: C.medPurple },
    rectRadius: 0,
  });

  slide.addText("Sub-penny fees, sub-second finality", {
    x: 1.0, y: 1.4, w: 5.1, h: 0.6,
    fontSize: 16, fontFace: "Georgia", bold: true,
    color: C.white, valign: "middle", margin: 0,
  });

  slide.addText([
    { text: "Transactions cost fractions of a cent", options: { bullet: true, breakLine: true } },
    { text: "Confirmation in under a second", options: { bullet: true, breakLine: true } },
    { text: "More of every dollar reaches the cause", options: { bullet: true, bold: true } },
  ], {
    x: 1.1, y: 2.2, w: 4.9, h: 2.2,
    fontSize: 14, fontFace: "Calibri",
    color: C.charcoal, valign: "top", margin: 0,
    lineSpacingMultiple: 1.4,
  });

  // CARD 2
  cardRect(slide, 6.8, 1.4, 5.5, 3.3, C.lavender);

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8, y: 1.4, w: 5.5, h: 0.6,
    fill: { color: C.medPurple },
    rectRadius: 0,
  });

  slide.addText("Seeker \u2014 mobile-first crypto", {
    x: 7.0, y: 1.4, w: 5.1, h: 0.6,
    fontSize: 16, fontFace: "Georgia", bold: true,
    color: C.white, valign: "middle", margin: 0,
  });

  slide.addText([
    { text: "Purpose-built for mobile dApps", options: { bullet: true, breakLine: true } },
    { text: "Crypto-native audience ready to give", options: { bullet: true, breakLine: true } },
    { text: "Built for the device people carry everywhere", options: { bullet: true, bold: true } },
  ], {
    x: 7.1, y: 2.2, w: 4.9, h: 2.2,
    fontSize: 14, fontFace: "Calibri",
    color: C.charcoal, valign: "top", margin: 0,
    lineSpacingMultiple: 1.4,
  });

  // Bottom
  slide.addText("Solana surged 100%+ in 2024. Crypto giving doubled. The timing is now.", {
    x: 0.8, y: 5.2, w: 11.5, h: 0.5,
    fontSize: 15, fontFace: "Calibri", italic: true,
    color: C.medPurple, align: "center", margin: 0,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLIDE 9 — ROADMAP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  const slide = pptx.addSlide();
  slide.background = { color: C.lavender };

  addTitle(slide, "The path forward.");

  const phases = [
    {
      title: "PHASE 1",
      subtitle: "MVP (Now)",
      color: C.darkPurple,
      items: [
        "Functional app on Solana Seeker",
        "3 donation tiers with devnet transactions",
        'Glimpse delivery (photos, notes, thank-yous)',
        "Community leaderboard with X integration",
        "Be Heard nonprofit partnership",
      ],
    },
    {
      title: "PHASE 2",
      subtitle: "Beta (2026)",
      color: C.medPurple,
      items: [
        "Become THE giving platform on Seeker",
        "New nonprofit partners and programs",
        "Content push \u2014 build the Glimpse brand",
        "Grow the Seeker donor community",
      ],
    },
    {
      title: "PHASE 3",
      subtitle: "Scale (2027+)",
      color: C.lightPurple,
      items: [
        "Multi-chain expansion",
        "Automated Glimpse delivery tools",
        "Corporate partnerships & sponsorships",
        "Token ecosystem exploration",
      ],
    },
  ];

  const phaseW = 3.6;
  const phaseGap = 0.3;
  const startX = 0.6;

  phases.forEach((p, i) => {
    const x = startX + i * (phaseW + phaseGap);

    // Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.3, w: phaseW, h: 4.3,
      fill: { color: C.white },
      rectRadius: 0.15,
      shadow: shadowOpts(),
      line: { color: C.cardBorder, width: 0.75 },
    });

    // Header bar
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.3, w: phaseW, h: 0.85,
      fill: { color: p.color },
      rectRadius: 0,
    });

    slide.addText(p.title, {
      x, y: 1.3, w: phaseW, h: 0.45,
      fontSize: 12, fontFace: "Calibri", bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });

    slide.addText(p.subtitle, {
      x, y: 1.7, w: phaseW, h: 0.4,
      fontSize: 16, fontFace: "Georgia", bold: true,
      color: C.white, align: "center", valign: "middle", margin: 0,
    });

    // Items
    const bullets = p.items.map((item, idx) => ({
      text: item,
      options: { bullet: true, breakLine: idx < p.items.length - 1 },
    }));

    slide.addText(bullets, {
      x: x + 0.2, y: 2.35, w: phaseW - 0.4, h: 3.0,
      fontSize: 12.5, fontFace: "Calibri",
      color: C.charcoal, valign: "top", margin: 0,
      lineSpacingMultiple: 1.3,
    });

    // Arrow between phases
    if (i < 2) {
      slide.addText("\u25B6", {
        x: x + phaseW + 0.02, y: 3.0, w: phaseGap - 0.04, h: 0.5,
        fontSize: 18, color: C.medPurple, align: "center", valign: "middle", margin: 0,
      });
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLIDE 10 — FOUNDER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  const slide = pptx.addSlide();
  slide.background = { color: C.white };

  addTitle(slide, "Built by a founder who believes giving should feel like something.", {
    fontSize: 24,
  });

  // Central card
  cardRect(slide, 2.5, 1.5, 8, 4.0, C.lavender);

  slide.addText("Derrick Woepking", {
    x: 2.8, y: 1.7, w: 7.4, h: 0.7,
    fontSize: 30, fontFace: "Georgia", bold: true,
    color: C.darkPurple, margin: 0,
  });

  slide.addText("Founder & Solo Builder", {
    x: 2.8, y: 2.35, w: 7.4, h: 0.4,
    fontSize: 16, fontFace: "Calibri", italic: true,
    color: C.medPurple, margin: 0,
  });

  slide.addText([
    { text: "Technical consultant and entrepreneur", options: { bullet: true, breakLine: true } },
    { text: "Built Glimpse from zero to functional MVP", options: { bullet: true, breakLine: true } },
    { text: "Passionate about using blockchain for real-world impact", options: { bullet: true, breakLine: true } },
    { text: "Also runs PCS Consulting and Eve Skin", options: { bullet: true } },
  ], {
    x: 3.0, y: 3.0, w: 7.0, h: 2.2,
    fontSize: 15, fontFace: "Calibri",
    color: C.charcoal, valign: "top", margin: 0,
    lineSpacingMultiple: 1.5,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLIDE 11 — CLOSING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  const slide = pptx.addSlide();
  slide.background = { color: C.darkPurple };

  slide.addText("GLIMPSE", {
    x: 0, y: 2.0, w: "100%", h: 1.2,
    fontSize: 60, fontFace: "Georgia", bold: true,
    color: C.white, align: "center", charSpacing: 6,
    margin: 0,
  });

  slide.addText("Change how the world gives.", {
    x: 0, y: 3.2, w: "100%", h: 0.6,
    fontSize: 22, fontFace: "Georgia", italic: true,
    color: C.gold, align: "center", margin: 0,
  });

  slide.addText("Documenting Kindness, Creating Connections", {
    x: 0, y: 3.8, w: "100%", h: 0.5,
    fontSize: 16, fontFace: "Calibri", italic: true,
    color: C.lightPurple, align: "center", margin: 0,
  });

  slide.addText("Derrick Woepking", {
    x: 0, y: 5.5, w: "100%", h: 0.4,
    fontSize: 14, fontFace: "Calibri",
    color: C.white, align: "center", margin: 0,
  });
}

// ─── GENERATE ───
const outputPath = "/Users/derrickwoepking/Desktop/glimpse-pitch-deck.pptx";
pptx.writeFile({ fileName: outputPath })
  .then(() => console.log("Pitch deck saved to: " + outputPath))
  .catch((err) => console.error("Error generating deck:", err));
