const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Derrick Woepking";
pres.title = "Glimpse — Monolith 2026";

// Brand palette
const PURPLE = "5B5BD6";
const BG = "F0E9FF";
const INK = "1A1A2E";
const TEAL = "40E0D0";
const WHITE = "FFFFFF";
const BLACK = "000000";
const MUTED = "6B6B8D";

// Fonts (Google Slides safe)
const DISPLAY = "Cormorant Garamond";
const MONO = "Space Mono";
const BODY = "Inter";

// Helper: fresh shadow factory (pptxgenjs mutates options)
const cardShadow = () => ({
  type: "outer",
  blur: 4,
  offset: 3,
  angle: 135,
  color: BLACK,
  opacity: 1.0,
});

// ============================================================
// SLIDE 1: TITLE
// ============================================================
const s1 = pres.addSlide();
s1.background = { color: BG };

// Subtle grid pattern via thin lines
for (let x = 0; x <= 10; x += 0.4) {
  s1.addShape(pres.shapes.LINE, {
    x: x, y: 0, w: 0, h: 5.625,
    line: { color: PURPLE, width: 0.25, transparency: 88 },
  });
}
for (let y = 0; y <= 5.625; y += 0.4) {
  s1.addShape(pres.shapes.LINE, {
    x: 0, y: y, w: 10, h: 0,
    line: { color: PURPLE, width: 0.25, transparency: 88 },
  });
}

// Purple border (4 rectangles simulating a frame)
const borderW = 0.12;
s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: borderW, fill: { color: PURPLE } }); // top
s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.625 - borderW, w: 10, h: borderW, fill: { color: PURPLE } }); // bottom
s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: borderW, h: 5.625, fill: { color: PURPLE } }); // left
s1.addShape(pres.shapes.RECTANGLE, { x: 10 - borderW, y: 0, w: borderW, h: 5.625, fill: { color: PURPLE } }); // right

// Corner accents (L-shaped brackets at corners)
const cLen = 0.5;
const cW = 0.04;
const cOff = 0.2;

// Top-left
s1.addShape(pres.shapes.RECTANGLE, { x: cOff, y: cOff, w: cLen, h: cW, fill: { color: PURPLE } });
s1.addShape(pres.shapes.RECTANGLE, { x: cOff, y: cOff, w: cW, h: cLen, fill: { color: PURPLE } });
// Top-right
s1.addShape(pres.shapes.RECTANGLE, { x: 10 - cOff - cLen, y: cOff, w: cLen, h: cW, fill: { color: PURPLE } });
s1.addShape(pres.shapes.RECTANGLE, { x: 10 - cOff - cW, y: cOff, w: cW, h: cLen, fill: { color: PURPLE } });
// Bottom-left
s1.addShape(pres.shapes.RECTANGLE, { x: cOff, y: 5.625 - cOff - cW, w: cLen, h: cW, fill: { color: PURPLE } });
s1.addShape(pres.shapes.RECTANGLE, { x: cOff, y: 5.625 - cOff - cLen, w: cW, h: cLen, fill: { color: PURPLE } });
// Bottom-right
s1.addShape(pres.shapes.RECTANGLE, { x: 10 - cOff - cLen, y: 5.625 - cOff - cW, w: cLen, h: cW, fill: { color: PURPLE } });
s1.addShape(pres.shapes.RECTANGLE, { x: 10 - cOff - cW, y: 5.625 - cOff - cLen, w: cW, h: cLen, fill: { color: PURPLE } });

// "GLIMPSE" logo watermark top-left
s1.addText("GLIMPSE", {
  x: 0.7,
  y: 0.35,
  w: 2,
  h: 0.35,
  fontFace: MONO,
  fontSize: 14,
  bold: true,
  color: PURPLE,
  charSpacing: 4,
  margin: 0,
});

// Slide number top-right
s1.addText("01 / 10", {
  x: 7.5,
  y: 0.35,
  w: 2,
  h: 0.35,
  fontFace: MONO,
  fontSize: 11,
  bold: true,
  color: INK,
  transparency: 70,
  charSpacing: 3,
  align: "right",
  margin: 0,
});

// Section tag
s1.addShape(pres.shapes.RECTANGLE, {
  x: 2.5,
  y: 1.3,
  w: 5,
  h: 0.4,
  fill: { color: BG, transparency: 100 },
  line: { color: PURPLE, width: 2.5 },
});
s1.addText("MONOLITH HACKATHON 2026", {
  x: 2.5,
  y: 1.3,
  w: 5,
  h: 0.4,
  fontFace: MONO,
  fontSize: 11,
  bold: true,
  color: PURPLE,
  charSpacing: 3,
  align: "center",
  valign: "middle",
  margin: 0,
});

// Main headline
s1.addText("THE OPERATING\nSYSTEM FOR GLOBAL\nGENEROSITY.", {
  x: 0.8,
  y: 2.0,
  w: 8.4,
  h: 2.6,
  fontFace: DISPLAY,
  fontSize: 48,
  bold: true,
  color: INK,
  align: "center",
  valign: "middle",
  lineSpacingMultiple: 0.95,
  margin: 0,
});


pres.writeFile({ fileName: "/Users/derrickwoepking/Desktop/SeekerDApp/docs/pitch/title-test.pptx" })
  .then(() => console.log("Title test slide created."))
  .catch(err => console.error(err));
