const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Derrick Woepking";
pres.title = "Glimpse — Monolith 2026";

// Brand palette (no # prefix — pptxgenjs requirement)
const PURPLE = "5B5BD6";
const BG = "F0E9FF";
const INK = "1A1A2E";
const TEAL = "40E0D0";
const WHITE = "FFFFFF";
const BLACK = "000000";
const MUTED = "6B6B8D";
const PURPLE_SOFT = "EDE5FF";

// Fonts (Google Slides safe)
const DISPLAY = "Cormorant Garamond";
const MONO = "Space Mono";
const BODY = "Inter";

// Slide dimensions (16:9)
const SW = 10;
const SH = 5.625;

// ── Reusable helpers ──────────────────────────────────────

function addGrid(slide) {
  for (let x = 0; x <= SW; x += 0.4) {
    slide.addShape(pres.shapes.LINE, {
      x, y: 0, w: 0, h: SH,
      line: { color: PURPLE, width: 0.25, transparency: 88 },
    });
  }
  for (let y = 0; y <= SH; y += 0.4) {
    slide.addShape(pres.shapes.LINE, {
      x: 0, y, w: SW, h: 0,
      line: { color: PURPLE, width: 0.25, transparency: 88 },
    });
  }
}

function addFrame(slide) {
  const b = 0.12;
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: SW, h: b, fill: { color: PURPLE } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: SH - b, w: SW, h: b, fill: { color: PURPLE } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: b, h: SH, fill: { color: PURPLE } });
  slide.addShape(pres.shapes.RECTANGLE, { x: SW - b, y: 0, w: b, h: SH, fill: { color: PURPLE } });
}

function addCorners(slide) {
  const L = 0.5, W = 0.04, O = 0.2;
  // TL
  slide.addShape(pres.shapes.RECTANGLE, { x: O, y: O, w: L, h: W, fill: { color: PURPLE } });
  slide.addShape(pres.shapes.RECTANGLE, { x: O, y: O, w: W, h: L, fill: { color: PURPLE } });
  // TR
  slide.addShape(pres.shapes.RECTANGLE, { x: SW-O-L, y: O, w: L, h: W, fill: { color: PURPLE } });
  slide.addShape(pres.shapes.RECTANGLE, { x: SW-O-W, y: O, w: W, h: L, fill: { color: PURPLE } });
  // BL
  slide.addShape(pres.shapes.RECTANGLE, { x: O, y: SH-O-W, w: L, h: W, fill: { color: PURPLE } });
  slide.addShape(pres.shapes.RECTANGLE, { x: O, y: SH-O-L, w: W, h: L, fill: { color: PURPLE } });
  // BR
  slide.addShape(pres.shapes.RECTANGLE, { x: SW-O-L, y: SH-O-W, w: L, h: W, fill: { color: PURPLE } });
  slide.addShape(pres.shapes.RECTANGLE, { x: SW-O-W, y: SH-O-L, w: W, h: L, fill: { color: PURPLE } });
}

function addChrome(slide, num, opts = {}) {
  slide.background = { color: opts.dark ? INK : BG };
  if (!opts.noGrid) addGrid(slide);
  addFrame(slide);
  addCorners(slide);
  const textColor = opts.dark ? WHITE : PURPLE;
  const numColor = opts.dark ? WHITE : INK;
  if (!opts.noLogo) {
    slide.addText("GLIMPSE", {
      x: 0.7, y: 0.35, w: 3.5, h: 0.35,
      fontFace: MONO, fontSize: 14, bold: true, color: textColor,
      charSpacing: 2, margin: 0, transparency: opts.dark ? 80 : 0,
    });
  }
  slide.addText(String(num).padStart(2, "0") + " / 10", {
    x: 7.0, y: 0.35, w: 2.5, h: 0.35,
    fontFace: MONO, fontSize: 10, bold: true, color: numColor,
    align: "right", margin: 0, transparency: 70,
  });
}

function addSectionTag(slide, text) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: 0.9, w: text.length * 0.13 + 0.6, h: 0.38,
    fill: { color: PURPLE },
    shadow: { type: "outer", blur: 0, offset: 3, angle: 135, color: BLACK, opacity: 1.0 },
  });
  slide.addText(text, {
    x: 0.7, y: 0.9, w: text.length * 0.13 + 0.6, h: 0.38,
    fontFace: MONO, fontSize: 10, bold: true, color: WHITE,
    charSpacing: 3, align: "center", valign: "middle", margin: 0,
  });
}

function addMetric(slide, x, y, w, h, value, label) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: WHITE },
    line: { color: BLACK, width: 2 },
  });
  slide.addText(value, {
    x, y: y + 0.15, w, h: 0.5,
    fontFace: MONO, fontSize: 28, bold: true, color: PURPLE,
    align: "center", valign: "middle", margin: 0,
  });
  slide.addText(label, {
    x, y: y + 0.6, w, h: 0.3,
    fontFace: MONO, fontSize: 8, bold: true, color: MUTED,
    charSpacing: 2, align: "center", valign: "middle", margin: 0,
  });
}

function addCard(slide, x, y, w, h, title, body) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: WHITE },
    line: { color: BLACK, width: 2.5 },
  });
  // Purple top accent
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h: 0.06, fill: { color: PURPLE },
  });
  slide.addText(title, {
    x: x + 0.2, y: y + 0.2, w: w - 0.4, h: 0.3,
    fontFace: MONO, fontSize: 11, bold: true, color: INK,
    charSpacing: 2, margin: 0,
  });
  slide.addText(body, {
    x: x + 0.2, y: y + 0.55, w: w - 0.4, h: h - 0.75,
    fontFace: BODY, fontSize: 11, color: MUTED,
    lineSpacingMultiple: 1.3, margin: 0,
  });
}

// ============================================================
// SLIDE 1: TITLE
// ============================================================
const s1 = pres.addSlide();
addChrome(s1, 1, { noLogo: false });

// Section tag centered
s1.addShape(pres.shapes.RECTANGLE, {
  x: 2.8, y: 1.3, w: 4.4, h: 0.4,
  fill: { color: BG, transparency: 100 },
  line: { color: PURPLE, width: 2.5 },
});
s1.addText("MONOLITH HACKATHON 2026", {
  x: 2.8, y: 1.3, w: 4.4, h: 0.4,
  fontFace: MONO, fontSize: 11, bold: true, color: PURPLE,
  charSpacing: 3, align: "center", valign: "middle", margin: 0,
});

// Main headline
s1.addText("THE OPERATING\nSYSTEM FOR GLOBAL\nGENEROSITY.", {
  x: 0.8, y: 2.0, w: 8.4, h: 2.6,
  fontFace: DISPLAY, fontSize: 48, bold: true, color: INK,
  align: "center", valign: "middle", lineSpacingMultiple: 0.95, margin: 0,
});


// ============================================================
// SLIDE 2: THE PROBLEM
// ============================================================
const s2 = pres.addSlide();
addChrome(s2, 2);
addSectionTag(s2, "THE PROBLEM");

s2.addText("THE $500B\nTRUST GAP.", {
  x: 0.7, y: 1.45, w: 8, h: 1.2,
  fontFace: DISPLAY, fontSize: 44, bold: true, color: INK,
  lineSpacingMultiple: 0.95, margin: 0,
});

s2.addText("Billions flow into charitable giving every year. The system that moves it is slow, opaque, and disconnected from the people it serves.", {
  x: 0.7, y: 2.65, w: 7.5, h: 0.5,
  fontFace: BODY, fontSize: 13, color: MUTED, lineSpacingMultiple: 1.3, margin: 0,
});

// Metrics row
const mY = 3.3;
const mW = 2.1;
const mH = 0.95;
const mGap = 0.13;
const mX = 0.7;
addMetric(s2, mX, mY, mW, mH, "$592.5B", "ANNUAL US GIVING");
addMetric(s2, mX + mW + mGap, mY, mW, mH, "26.3%", "DONOR RETENTION");
addMetric(s2, mX + 2*(mW + mGap), mY, mW, mH, "74%", "NEVER GIVE AGAIN");
addMetric(s2, mX + 3*(mW + mGap), mY, mW, mH, "3-8%", "PLATFORM FEES");

// Quote callout
s2.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 4.45, w: 8.6, h: 0.75,
  fill: { color: WHITE },
  line: { color: BLACK, width: 2.5 },
  shadow: { type: "outer", blur: 0, offset: 3, angle: 135, color: BLACK, opacity: 1.0 },
});
s2.addText([
  { text: '"3 out of 4 donors never give again. Not because they stopped caring. Because nobody showed them what happened."', options: { italic: true } }
], {
  x: 1.0, y: 4.45, w: 8.0, h: 0.75,
  fontFace: BODY, fontSize: 13, color: INK,
  valign: "middle", margin: 0,
});


// ============================================================
// SLIDE 3: SOLUTION (merged A-3 + A-4)
// ============================================================
const s3 = pres.addSlide();
addChrome(s3, 3);
addSectionTag(s3, "THE SOLUTION");

s3.addText("SEE WHAT YOUR\nMONEY DID.", {
  x: 0.7, y: 1.45, w: 8, h: 1.2,
  fontFace: DISPLAY, fontSize: 44, bold: true, color: INK,
  lineSpacingMultiple: 0.95, margin: 0,
});

// Three value cards
const cW = 2.7;
const cH = 1.6;
const cY = 2.8;
const cGap = 0.2;
addCard(s3, 0.7, cY, cW, cH, "ZERO FEES", "Every dollar goes forward. No platform cut. No processing fee. No middleman.");
addCard(s3, 0.7 + cW + cGap, cY, cW, cH, "ON-CHAIN PROOF", "Permanent Solana receipt. Wallet, amount, timestamp — immutable and publicly verifiable.");
addCard(s3, 0.7 + 2*(cW + cGap), cY, cW, cH, "REAL CONNECTION", "A conversation opens after every donation. You see what happened. That's what makes someone give again.");

// Flow strip at bottom
const fY = 4.65;
const fW = 2.0;
const fH = 0.45;
const fGap = 0.15;
const fX = 1.5;

function addFlowStep(slide, x, y, w, h, text, isPurple) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: isPurple ? PURPLE : WHITE },
    line: { color: isPurple ? PURPLE : INK, width: 2 },
  });
  slide.addText(text, {
    x, y, w, h,
    fontFace: MONO, fontSize: 10, bold: true,
    color: isPurple ? WHITE : INK,
    charSpacing: 2, align: "center", valign: "middle", margin: 0,
  });
}

addFlowStep(s3, fX, fY, fW, fH, "CONNECT", true);
s3.addText("\u2192", { x: fX + fW, y: fY, w: fGap + 0.15, h: fH, fontFace: MONO, fontSize: 18, color: PURPLE, align: "center", valign: "middle", margin: 0 });
addFlowStep(s3, fX + fW + fGap + 0.15, fY, fW, fH, "GIVE USDC", false);
s3.addText("\u2192", { x: fX + 2*fW + fGap + 0.15, y: fY, w: fGap + 0.15, h: fH, fontFace: MONO, fontSize: 18, color: PURPLE, align: "center", valign: "middle", margin: 0 });
addFlowStep(s3, fX + 2*(fW + fGap + 0.15), fY, fW, fH, "SEE PROOF", true);


// ============================================================
// SLIDE 4: SEEKER OPPORTUNITY
// ============================================================
const s4 = pres.addSlide();
addChrome(s4, 4);
addSectionTag(s4, "THE OPPORTUNITY");

s4.addText("116,000 DEVICES.\n50+ COUNTRIES.", {
  x: 0.7, y: 1.45, w: 8, h: 1.2,
  fontFace: DISPLAY, fontSize: 44, bold: true, color: INK,
  lineSpacingMultiple: 0.95, margin: 0,
});

s4.addText("68% of Seeker devices are outside the Americas. This isn't a US product. This is a world mission.", {
  x: 0.7, y: 2.7, w: 7.5, h: 0.45,
  fontFace: BODY, fontSize: 13, color: MUTED, lineSpacingMultiple: 1.3, margin: 0,
});

// Regional metrics
const rY = 3.35;
const rW = 2.1;
const rH = 0.95;
addMetric(s4, mX, rY, rW, rH, "37,115", "AMERICAS \u2022 32%");
addMetric(s4, mX + rW + mGap, rY, rW, rH, "32,047", "EUROPE \u2022 28%");
addMetric(s4, mX + 2*(rW + mGap), rY, rW, rH, "24,095", "ASIA-PACIFIC \u2022 21%");
addMetric(s4, mX + 3*(rW + mGap), rY, rW, rH, "22,801", "OTHER \u2022 20%");

// Supporting callout to fill bottom
s4.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 4.55, w: 8.6, h: 0.65,
  fill: { color: WHITE },
  line: { color: BLACK, width: 2.5 },
  shadow: { type: "outer", blur: 0, offset: 3, angle: 135, color: BLACK, opacity: 1.0 },
});
s4.addText("Built for Seeker. Deployed globally. The easiest path to your first 10,000 paying users on mobile crypto.", {
  x: 1.0, y: 4.55, w: 8.0, h: 0.65,
  fontFace: BODY, fontSize: 13, color: INK, italic: true,
  valign: "middle", margin: 0,
});


// ============================================================
// SLIDE 5: DEMO
// ============================================================
const s5 = pres.addSlide();
addChrome(s5, 5);
addSectionTag(s5, "LIVE DEMO");

s5.addText("SEE IT WORK.", {
  x: 0.7, y: 1.45, w: 8, h: 0.6,
  fontFace: DISPLAY, fontSize: 44, bold: true, color: INK,
  margin: 0,
});

// Demo placeholder frame
s5.addShape(pres.shapes.RECTANGLE, {
  x: 1.5, y: 2.2, w: 7, h: 3.0,
  fill: { color: WHITE, transparency: 80 },
  line: { color: PURPLE, width: 2, dashType: "dash" },
});

// Play button circle
s5.addShape(pres.shapes.OVAL, {
  x: 4.55, y: 3.0, w: 0.9, h: 0.9,
  fill: { color: BG, transparency: 50 },
  line: { color: PURPLE, width: 3 },
});

s5.addText("\u25B6", {
  x: 4.55, y: 3.0, w: 0.9, h: 0.9,
  fontFace: BODY, fontSize: 24, color: PURPLE,
  align: "center", valign: "middle", margin: 0,
});

s5.addText("SCREEN RECORDING GOES HERE", {
  x: 1.8, y: 4.05, w: 6.4, h: 0.4,
  fontFace: MONO, fontSize: 10, bold: true, color: PURPLE,
  charSpacing: 3, align: "center", valign: "middle", margin: 0,
  transparency: 50,
});

s5.addText("20-30 sec  \u2022  Seeker screen  \u2022  Voiceover", {
  x: 2.5, y: 4.4, w: 5, h: 0.3,
  fontFace: MONO, fontSize: 8, color: MUTED,
  charSpacing: 1, align: "center", valign: "middle", margin: 0,
  transparency: 40,
});


// ============================================================
// SLIDE 6: BUSINESS MODEL
// ============================================================
const s6 = pres.addSlide();
addChrome(s6, 6);
addSectionTag(s6, "BUSINESS MODEL");

s6.addText("THE TRUST LAYER\nFOR GIVING.", {
  x: 0.7, y: 1.45, w: 8, h: 1.2,
  fontFace: DISPLAY, fontSize: 44, bold: true, color: INK,
  lineSpacingMultiple: 0.95, margin: 0,
});

s6.addText("Glimpse is the infrastructure that proves a dollar did what it was supposed to do. Zero fees on donations. Revenue from business partnerships.", {
  x: 0.7, y: 2.65, w: 7.5, h: 0.45,
  fontFace: BODY, fontSize: 13, color: MUTED, lineSpacingMultiple: 1.3, margin: 0,
});

// Business flow
const bfY = 3.3;
const bfW = 2.0;
const bfH = 0.55;
const bfGap = 0.12;
const bfX = 0.7;

addFlowStep(s6, bfX, bfY, bfW, bfH, "PARTNER FUNDS", false);
s6.addText("\u2192", { x: bfX + bfW, y: bfY, w: bfGap + 0.15, h: bfH, fontFace: MONO, fontSize: 18, color: PURPLE, align: "center", valign: "middle", margin: 0 });
addFlowStep(s6, bfX + bfW + bfGap + 0.15, bfY, bfW, bfH, "GLIMPSE VERIFIES", true);
s6.addText("\u2192", { x: bfX + 2*(bfW) + bfGap + 0.15, y: bfY, w: bfGap + 0.15, h: bfH, fontFace: MONO, fontSize: 18, color: PURPLE, align: "center", valign: "middle", margin: 0 });
addFlowStep(s6, bfX + 2*(bfW + bfGap + 0.15), bfY, bfW, bfH, "PROOF ON-CHAIN", false);
s6.addText("\u2192", { x: bfX + 3*(bfW) + 2*(bfGap + 0.15), y: bfY, w: bfGap + 0.15, h: bfH, fontFace: MONO, fontSize: 18, color: PURPLE, align: "center", valign: "middle", margin: 0 });
addFlowStep(s6, bfX + 3*(bfW + bfGap + 0.15), bfY, bfW, bfH, "EVERYONE SEES IT", true);

// Revenue callout
s6.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 4.15, w: 8.6, h: 1.1,
  fill: { color: WHITE },
  line: { color: BLACK, width: 2.5 },
  shadow: { type: "outer", blur: 0, offset: 3, angle: 135, color: BLACK, opacity: 1.0 },
});

s6.addText("HOW WE MAKE MONEY", {
  x: 1.0, y: 4.25, w: 3, h: 0.25,
  fontFace: MONO, fontSize: 9, bold: true, color: PURPLE,
  charSpacing: 2, margin: 0,
});

s6.addText("Business partnerships and sponsored campaigns. Donors never pay. Every dollar given goes forward. Revenue comes from companies who want to invest in their community through verified, on-chain impact.", {
  x: 1.0, y: 4.55, w: 8.0, h: 0.55,
  fontFace: BODY, fontSize: 12, color: MUTED, lineSpacingMultiple: 1.3, margin: 0,
});


// ============================================================
// SLIDE 7: VISION (abstract — no "Barstool", no "creators")
// ============================================================
const s7 = pres.addSlide();
addChrome(s7, 7);
addSectionTag(s7, "THE VISION");

s7.addText("CONTENT DRIVES DONATIONS.\nPROOF DRIVES MORE.", {
  x: 0.7, y: 1.4, w: 8, h: 0.85,
  fontFace: DISPLAY, fontSize: 34, bold: true, color: INK,
  lineSpacingMultiple: 0.95, margin: 0,
});

s7.addText("Glimpse turns every dollar into a story. Impact content is inherently viral. Proof creates trust. Trust creates donors. Donors fund more impact.", {
  x: 0.7, y: 2.35, w: 7.5, h: 0.4,
  fontFace: BODY, fontSize: 12, color: MUTED, lineSpacingMultiple: 1.3, margin: 0,
});

// Flywheel — 4 items (merged "MORE CONTENT" into loop symbol)
const fwY = 3.05;
const fwW = 1.8;
const fwH = 0.45;
const fwGap = 0.08;
const fwX = 0.7;

addFlowStep(s7, fwX, fwY, fwW, fwH, "CONTENT", true);
s7.addText("\u2192", { x: fwX + fwW, y: fwY, w: fwGap + 0.15, h: fwH, fontFace: MONO, fontSize: 18, color: PURPLE, align: "center", valign: "middle", margin: 0 });
addFlowStep(s7, fwX + fwW + fwGap + 0.15, fwY, fwW, fwH, "DONATIONS", false);
s7.addText("\u2192", { x: fwX + 2*fwW + fwGap + 0.15, y: fwY, w: fwGap + 0.15, h: fwH, fontFace: MONO, fontSize: 18, color: PURPLE, align: "center", valign: "middle", margin: 0 });
addFlowStep(s7, fwX + 2*(fwW + fwGap + 0.15), fwY, fwW, fwH, "PROOF", true);
s7.addText("\u2192", { x: fwX + 3*fwW + 2*(fwGap + 0.15), y: fwY, w: fwGap + 0.15, h: fwH, fontFace: MONO, fontSize: 18, color: PURPLE, align: "center", valign: "middle", margin: 0 });
addFlowStep(s7, fwX + 3*(fwW + fwGap + 0.15), fwY, fwW + 0.3, fwH, "\u21BA FLYWHEEL", true);

// Vision cards
const vY = 3.75;
const vW = 2.7;
const vH = 1.4;
addCard(s7, 0.7, vY, vW, vH, "IMPACT AT SCALE", "Any person, any country, any cause. Global giving infrastructure on Solana.");
addCard(s7, 0.7 + vW + cGap, vY, vW, vH, "ZERO-FEE RAILS", "Stablecoin transfers. On-chain receipts. Direct giver-to-impact connection.");
addCard(s7, 0.7 + 2*(vW + cGap), vY, vW, vH, "GOVERNANCE", "$GLIMPSE holders vote on capital allocation. Efficient operators win.");


// ============================================================
// SLIDE 8: ROADMAP (Phase Rollout from GTM-6)
// ============================================================
const s8 = pres.addSlide();
addChrome(s8, 8);
addSectionTag(s8, "ROADMAP");

s8.addText("GROWTH IS\nPURPOSEFUL.", {
  x: 0.7, y: 1.4, w: 8, h: 0.95,
  fontFace: DISPLAY, fontSize: 44, bold: true, color: INK,
  lineSpacingMultiple: 0.95, margin: 0,
});

// Timeline blocks
const tY = 2.6;
const tW = 2.8;
const tH = 1.7;
const tGap = 0.2;

function addTimelineBlock(slide, x, y, w, h, phase, date, body, altShadow) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: WHITE },
    line: { color: BLACK, width: 2.5 },
    shadow: { type: "outer", blur: 0, offset: 4, angle: 135, color: altShadow ? BLACK : PURPLE, opacity: 1.0 },
  });
  slide.addText(phase, {
    x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.25,
    fontFace: MONO, fontSize: 11, bold: true, color: PURPLE,
    charSpacing: 2, margin: 0,
  });
  slide.addText(date, {
    x: x + 0.2, y: y + 0.4, w: w - 0.4, h: 0.2,
    fontFace: MONO, fontSize: 8, color: MUTED, margin: 0, transparency: 50,
  });
  slide.addText(body, {
    x: x + 0.2, y: y + 0.7, w: w - 0.4, h: h - 0.85,
    fontFace: BODY, fontSize: 11, color: MUTED, lineSpacingMultiple: 1.3, margin: 0,
  });
}

addTimelineBlock(s8, 0.7, tY, tW, tH, "PHASE 1", "Now \u2013 June 2026",
  "One city. Muscatine. Prove the loop works. Win the hackathon. Close first brand partnerships. Build the content engine.", false);
addTimelineBlock(s8, 0.7 + tW + tGap, tY, tW, tH, "PHASE 2", "June 2026",
  "2\u20135 more cities. Funded by raise. Deployed to highest-density Seeker regions. Content flywheel begins.", true);
addTimelineBlock(s8, 0.7 + 2*(tW + tGap), tY, tW, tH, "PHASE 3+", "Each raise funds the next wave",
  "Expand city by city. Token governance decides which regions grow next. Revenue + raises fund growth.", false);

// The Model callout
s8.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 4.45, w: 8.6, h: 0.85,
  fill: { color: WHITE },
  line: { color: BLACK, width: 2.5 },
  shadow: { type: "outer", blur: 0, offset: 3, angle: 135, color: BLACK, opacity: 1.0 },
});

s8.addText("THE MODEL", {
  x: 1.0, y: 4.5, w: 2, h: 0.25,
  fontFace: MONO, fontSize: 9, bold: true, color: PURPLE,
  charSpacing: 2, margin: 0,
});

s8.addText("Each raise funds the next wave of expansion. Revenue from brand partnerships sustains existing cities. The flywheel is self-reinforcing: content drives donations, donations fund proof, proof drives more content.", {
  x: 1.0, y: 4.78, w: 8.0, h: 0.45,
  fontFace: BODY, fontSize: 11, color: MUTED, lineSpacingMultiple: 1.3, margin: 0,
});


// ============================================================
// SLIDE 9: FOUNDER
// ============================================================
const s9 = pres.addSlide();
addChrome(s9, 9);
addSectionTag(s9, "THE FOUNDER");

s9.addText("FOUR YEARS\nOF CONVICTION.", {
  x: 0.7, y: 1.45, w: 5, h: 1.0,
  fontFace: DISPLAY, fontSize: 40, bold: true, color: INK,
  lineSpacingMultiple: 0.95, margin: 0,
});

s9.addText("NFT project, partner search, traditional fundraising \u2014 none of it worked. Now I built it myself.", {
  x: 0.7, y: 2.5, w: 5, h: 0.4,
  fontFace: BODY, fontSize: 13, color: MUTED, lineSpacingMultiple: 1.3, margin: 0,
});

// Founder card
s9.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 3.1, w: 5.2, h: 2.1,
  fill: { color: WHITE },
  line: { color: BLACK, width: 2.5 },
  shadow: { type: "outer", blur: 0, offset: 4, angle: 135, color: PURPLE, opacity: 1.0 },
});

s9.addText("DERRICK WOEPKING", {
  x: 1.0, y: 3.25, w: 4, h: 0.3,
  fontFace: MONO, fontSize: 16, bold: true, color: INK,
  charSpacing: 2, margin: 0,
});

s9.addText("FOUNDER & SOLO BUILDER \u2014 MUSCATINE, IOWA", {
  x: 1.0, y: 3.55, w: 4, h: 0.2,
  fontFace: MONO, fontSize: 8, bold: true, color: PURPLE,
  charSpacing: 2, margin: 0,
});

// Founder facts
const facts = [
  "Built the entire product solo \u2014 app, backend, on-chain integration",
  "4 years of conviction before AI tooling made it possible to build alone",
  "Personally knows nonprofit founders \u2014 has seen the system from the inside",
];
facts.forEach((fact, i) => {
  const fy = 3.95 + i * 0.38;
  // Divider line
  s9.addShape(pres.shapes.LINE, {
    x: 1.0, y: fy, w: 4.6, h: 0,
    line: { color: PURPLE, width: 0.5, transparency: 75 },
  });
  s9.addText(fact, {
    x: 1.0, y: fy + 0.05, w: 4.6, h: 0.3,
    fontFace: BODY, fontSize: 11, color: MUTED, margin: 0,
  });
});

// Colosseum screenshot placeholder (right side)
s9.addShape(pres.shapes.RECTANGLE, {
  x: 6.2, y: 1.8, w: 3.3, h: 3.4,
  fill: { color: WHITE, transparency: 80 },
  line: { color: PURPLE, width: 2, dashType: "dash" },
});

s9.addText("DROP\nSCREENSHOT\nHERE", {
  x: 6.2, y: 2.6, w: 3.3, h: 1.4,
  fontFace: MONO, fontSize: 11, bold: true, color: PURPLE,
  align: "center", valign: "middle", margin: 0,
  transparency: 50,
});


// ============================================================
// SLIDE 10: CLOSE (dark slide)
// ============================================================
const s10 = pres.addSlide();
addChrome(s10, 10, { dark: true });

s10.addText("GIVE.\nSEE THE PROOF.\nSTART A CONVERSATION.", {
  x: 1.0, y: 1.2, w: 8, h: 2.2,
  fontFace: DISPLAY, fontSize: 44, bold: true, color: WHITE,
  align: "center", valign: "middle", lineSpacingMultiple: 1.1, margin: 0,
});

// Purple accent bar
s10.addShape(pres.shapes.RECTANGLE, {
  x: 4.4, y: 3.4, w: 1.2, h: 0.06,
  fill: { color: PURPLE },
});

s10.addText("Every nonprofit in the world is a leaky bucket. Glimpse replaces the plumbing. Any person, any country, any cause, any time. Zero fees. On-chain proof. Direct connection to impact.", {
  x: 1.5, y: 3.6, w: 7, h: 0.6,
  fontFace: BODY, fontSize: 12, color: WHITE, transparency: 50,
  align: "center", lineSpacingMultiple: 1.3, margin: 0,
});

// CTA chips
const chips = ["116K+ DEVICES", "50+ COUNTRIES", "ZERO FEES", "ON MAINNET"];
const chipW = 2.1;
const chipH = 0.38;
const chipGap = 0.15;
const chipTotalW = chips.length * chipW + (chips.length - 1) * chipGap;
const chipStartX = (SW - chipTotalW) / 2;

chips.forEach((text, i) => {
  const cx = chipStartX + i * (chipW + chipGap);
  s10.addShape(pres.shapes.RECTANGLE, {
    x: cx, y: 4.4, w: chipW, h: chipH,
    fill: { color: PURPLE, transparency: 75 },
    line: { color: PURPLE, width: 1.5, transparency: 50 },
  });
  s10.addText(text, {
    x: cx, y: 4.4, w: chipW, h: chipH,
    fontFace: BODY, fontSize: 9, bold: true, color: WHITE, transparency: 30,
    align: "center", valign: "middle", margin: 0,
  });
});

// Contact row
s10.addText("giveglimpse.com  \u2022  derrick@giveglimpse.com  \u2022  @DerrickWKing  \u2022  @GiveGlimpse", {
  x: 0.5, y: 4.95, w: 9, h: 0.3,
  fontFace: BODY, fontSize: 9, color: WHITE, transparency: 70,
  align: "center", valign: "middle", margin: 0,
});


// ── Write file ────────────────────────────────────────────
const outPath = "/Users/derrickwoepking/Desktop/SeekerDApp/docs/pitch/glimpse-monolith-v3.pptx";
pres.writeFile({ fileName: outPath })
  .then(() => console.log("v3 deck created: " + outPath))
  .catch(err => console.error(err));
