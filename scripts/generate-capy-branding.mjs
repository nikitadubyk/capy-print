import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

// One vector drawing supplies the Lottie, its still frame and browser icons.
const palette = {
  ink: "#3d241b",
  fur: "#d9aa7f",
  light: "#e7ba8e",
  muzzle: "#a77760",
  ear: "#b9876b",
  green: "#438268",
  mint: "#edf5eb",
};
const fixed = (k) => ({ a: 0, k });
const color = (hex) =>
  [1, 3, 5].map((start) =>
    Number((parseInt(hex.slice(start, start + 2), 16) / 255).toFixed(4))
  );
const animated = (frames) => ({
  a: 1,
  k: frames.map(([t, s], index) => ({
    t,
    s: Array.isArray(s) ? s : [s],
    ...(index < frames.length - 1
      ? { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } }
      : {}),
  })),
});
const transform = (overrides = {}) => ({
  p: fixed([0, 0]),
  a: fixed([0, 0]),
  s: fixed([100, 100]),
  r: fixed(0),
  o: fixed(100),
  ...overrides,
});
const ellipse = (name, x, y, w, h, fill, stroke) => ({
  name,
  geometry: { ty: "el", p: fixed([x, y]), s: fixed([w, h]), d: 1 },
  fill,
  stroke,
});
const path = (name, points, fill, stroke, closed = true) => ({
  name,
  geometry: {
    ty: "sh",
    ks: fixed({
      v: points.map((point) => point.slice(0, 2)),
      i: points.map((point) => point.slice(2, 4)),
      o: points.map((point) => point.slice(4, 6)),
      c: closed,
    }),
  },
  fill,
  stroke,
});
// Trace the supplied upright capybara reference in source coordinates.
// Small ears, a continuous pear-shaped silhouette and a long blunt muzzle.
const point = (x, y) => [48 + (x - 384) / 10, 8 + (y - 360) / 10];
const traced = (name, nodes, fill, stroke, closed = true) =>
  path(
    name,
    nodes.map(([x, y, ix, iy, ox, oy]) => [
      ...point(x, y),
      ix / 10,
      iy / 10,
      ox / 10,
      oy / 10,
    ]),
    fill,
    stroke,
    closed
  );
const oval = (name, x, y, w, h, fill, stroke) =>
  ellipse(name, ...point(x, y), w / 10, h / 10, fill, stroke);
const ears = [
  traced(
    "Far ear",
    [
      [439, 399, 0, 0, 1, -45],
      [477, 368, -26, -6, 27, 7],
      [501, 414, 4, -22, -18, -10],
    ],
    palette.ear,
    palette.ink
  ),
  traced(
    "Near ear",
    [
      [288, 463, 0, 0, -64, 9],
      [224, 415, -13, 25, 17, -44],
      [276, 395, -22, -7, 24, 8],
      [312, 437, -12, -20, -12, 15],
    ],
    palette.fur,
    palette.ink
  ),
  traced(
    "Ear fold",
    [
      [255, 425, 0, 0, 9, 13],
      [279, 443, -10, -4, 0, 0],
    ],
    null,
    palette.ink,
    false
  ),
];
const outline = [
  [290, 437, -36, 34, 52, -47],
  [407, 394, -48, -4, 80, -3],
  [564, 450, -37, -29, 47, 33],
  [633, 557, -9, -35, 14, 45],
  [634, 653, 8, -28, -10, 32],
  [594, 719, 20, -17, 0, 14],
  [620, 792, -12, -34, 20, 51],
  [660, 932, 0, -49, 1, 70],
  [610, 1035, 34, -24, -40, 28],
  [472, 1070, 58, -2, -62, 10],
  [311, 1088, 55, 0, -105, 0],
  [141, 1051, 31, 25, -41, -30],
  [83, 942, 1, 52, -2, -85],
  [141, 747, -25, 56, 26, -64],
  [201, 586, -20, 43, 23, -46],
];
const body = traced("Pear-shaped body", outline, palette.fur, palette.ink);
const face = [
  oval("Long muzzle", 550, 604, 153, 194, palette.muzzle),
  oval("Left nostril", 536, 570, 24, 14, palette.ink),
  oval("Right nostril", 584, 565, 20, 15, palette.ink),
  traced(
    "Mouth",
    [
      [559, 592, 0, 0, 3, 25],
      [557, 652, 3, -24, -5, 9],
      [537, 674, 9, -9, 0, 0],
    ],
    null,
    palette.ink,
    false
  ),
  traced(
    "Mouth corner",
    [
      [557, 652, 0, 0, 6, 8],
      [571, 670, -4, -3, 0, 0],
    ],
    null,
    palette.ink,
    false
  ),
  oval("Blush", 335, 562, 53, 29, "#d79c7c"),
];
const details = [
  traced(
    "Lower warm shadow",
    [
      [87, 956, 0, 0, 23, 74],
      [243, 1060, -81, -6, 120, 18],
      [547, 1040, -106, 27, 79, -30],
      [649, 974, -15, 36, -18, 71],
      [559, 1056, 51, -18, -83, 26],
      [311, 1082, 100, 0, -151, 8],
      [125, 1027, 61, 53, -20, -29],
    ],
    "#c48e67"
  ),
  ...[
    [215, 640],
    [188, 713],
    [286, 710],
    [157, 878],
    [525, 917],
    [566, 950],
    [510, 1006],
  ].map(([x, y], index) => oval("Fur mark " + index, x, y, 8, 20, "#c99870")),
  traced(
    "Crown tuft",
    [
      [336, 397, 0, 0, 8, 1],
      [358, 400, -4, -2, -1, -6],
      [354, 389, 0, 0, 8, 8],
      [377, 397, -8, -2, 0, 0],
    ],
    null,
    palette.ink,
    false
  ),
];
const feet = [
  traced(
    "Near foot",
    [
      [302, 1082, 0, 0, 20, -51],
      [376, 1049, -26, -10, 35, 8],
      [418, 1087, 1, -18, -2, 25],
      [384, 1098, 21, 3, -3, -2],
      [381, 1086, 0, 0, -1, 5],
      [375, 1101, 3, -3, -36, 3],
    ],
    palette.muzzle,
    palette.ink
  ),
  traced(
    "Far foot",
    [
      [535, 1064, 0, 0, 18, -27],
      [592, 1030, -24, -3, 30, 1],
      [645, 1064, -8, -20, 10, 35],
      [615, 1077, 29, 8, -4, -2],
      [613, 1069, 0, 0, -4, 8],
      [602, 1081, 6, -1, -29, -3],
    ],
    palette.muzzle,
    palette.ink
  ),
];
const arms = [
  traced(
    "Left forepaw",
    [
      [362, 748, 0, 0, 50, 14],
      [447, 775, -34, -11, 25, 11],
      [484, 811, -1, -17, 3, 20],
      [466, 819, 17, 8, -5, -3],
      [460, 813, 0, 0, 0, 9],
      [470, 832, -9, -6, -1, 15],
      [368, 847, 35, 0, 20, -21],
      [399, 759, -1, 33, -12, -5],
    ],
    palette.muzzle
  ),
  traced(
    "Forepaw contour",
    [
      [362, 748, 0, 0, 50, 14],
      [447, 775, -34, -11, 25, 11],
      [484, 811, -1, -17, 3, 20],
      [466, 819, 17, 8, -5, -3],
      [460, 813, 0, 0, 0, 9],
      [470, 832, -9, -6, -1, 15],
      [368, 847, 35, 0, 0, 0],
    ],
    null,
    palette.ink,
    false
  ),
  traced(
    "Right forepaw",
    [
      [585, 737, 0, 0, -22, 12],
      [537, 775, 15, -20, -13, 16],
      [527, 811, -4, -10, 0, 14],
      [546, 811, -10, 11, 0, 0],
      [543, 826, 0, 0, 12, 11],
      [603, 829, -22, 11, 28, -14],
      [628, 787, 7, 16, -3, -24],
    ],
    palette.muzzle,
    palette.ink
  ),
  traced(
    "Right fingers",
    [
      [548, 819, 0, 0, 7, -3],
      [555, 812, -1, 5, 0, 0],
    ],
    null,
    palette.ink,
    false
  ),
];
const shapes = [...ears, body, ...details, ...face, ...feet];
const eyes = [oval("Sleepy eye", 368, 519, 48, 14, palette.ink)];
const head = traced(
  "Favicon head",
  [
    ...outline.slice(0, 6),
    [493, 756, 48, -5, -67, 1],
    [303, 722, 67, 29, -58, -22],
    [195, 637, 20, 43, 22, -73],
  ],
  palette.fur,
  palette.ink
);
const iconShapes = [...ears, head, ...face, ...eyes];
const group = ({ name, geometry, fill, stroke }) => ({
  ty: "gr",
  nm: name,
  it: [
    geometry,
    ...(stroke
      ? [
          {
            ty: "st",
            c: fixed([...color(stroke), 1]),
            o: fixed(100),
            w: fixed(1.45),
            lc: 2,
            lj: 2,
          },
        ]
      : []),
    ...(fill
      ? [{ ty: "fl", c: fixed([...color(fill), 1]), o: fixed(100), r: 1 }]
      : []),
    { ty: "tr", ...transform() },
  ],
});
const layer = (ind, name, items, overrides = {}) => ({
  ddd: 0,
  ind,
  ty: 4,
  nm: name,
  sr: 1,
  ks: transform(overrides),
  ao: 0,
  shapes: items,
  ip: 0,
  op: 96,
  st: 0,
  bm: 0,
});
const eyeGroup = {
  ty: "gr",
  nm: "Blink",
  it: [
    ...eyes.toReversed().map(group),
    {
      ty: "tr",
      ...transform({
        a: fixed(point(368, 519)),
        p: fixed(point(368, 519)),
        s: animated([
          [0, [100, 100]],
          [41, [100, 100]],
          [44, [100, 8]],
          [47, [100, 100]],
          [96, [100, 100]],
        ]),
      }),
    },
  ],
};
const pawGroup = {
  ty: "gr",
  nm: "Gentle paw movement",
  it: [
    ...arms.toReversed().map(group),
    {
      ty: "tr",
      ...transform({
        a: fixed(point(495, 790)),
        p: animated([
          [0, point(495, 790)],
          [24, point(495, 780)],
          [48, point(495, 790)],
          [72, point(495, 780)],
          [96, point(495, 790)],
        ]),
        r: animated([
          [0, 0],
          [24, -3],
          [48, 0],
          [72, -3],
          [96, 0],
        ]),
      }),
    },
  ],
};
const dots = [37, 48, 59].map((x, index) => {
  const peak = 12 + index * 16;
  return layer(
    index + 2,
    "Loading dot " + (index + 1),
    [group(ellipse("Dot", 0, 0, 3, 3, palette.green))],
    {
      p: animated([
        [0, [x, 92]],
        [peak - 8, [x, 92]],
        [peak, [x, 90]],
        [peak + 8, [x, 92]],
        [96, [x, 92]],
      ]),
      o: animated([
        [0, 35],
        [peak - 8, 35],
        [peak, 100],
        [peak + 8, 35],
        [96, 35],
      ]),
    }
  );
});
const shadow = ellipse("Ground shadow", 48, 83, 66, 7, "#e6e4df");
const animation = {
  v: "5.12.2",
  fr: 30,
  ip: 0,
  op: 96,
  w: 96,
  h: 96,
  nm: "Capy Print — upright capybara",
  ddd: 0,
  assets: [],
  layers: [
    layer(
      1,
      "Capybara",
      [pawGroup, eyeGroup, ...shapes.toReversed().map(group)],
      {
        a: fixed([48, 82]),
        p: fixed([48, 82]),
        s: animated([
          [0, [100, 100]],
          [24, [100.8, 101.5]],
          [48, [100, 100]],
          [72, [100.8, 101.5]],
          [96, [100, 100]],
        ]),
      }
    ),
    ...dots,
    layer(5, "Ground shadow", [group(shadow)]),
  ],
  markers: [],
};
const svgShape = ({ geometry, fill, stroke }) => {
  const style = `fill="${fill ?? "none"}"${stroke ? ` stroke="${stroke}" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"` : ""}`;
  if (geometry.ty === "el") {
    const [x, y] = geometry.p.k;
    const [w, h] = geometry.s.k;
    return `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" ${style}/>`;
  }
  const { v, i, o, c } = geometry.ks.k;
  const segments = v.slice(1).map((end, offset) => {
    const start = v[offset];
    return `C${start[0] + o[offset][0]} ${start[1] + o[offset][1]} ${end[0] + i[offset + 1][0]} ${end[1] + i[offset + 1][1]} ${end[0]} ${end[1]}`;
  });
  if (c) {
    const last = v.length - 1;
    segments.push(
      `C${v[last][0] + o[last][0]} ${v[last][1] + o[last][1]} ${v[0][0] + i[0][0]} ${v[0][1] + i[0][1]} ${v[0][0]} ${v[0][1]}Z`
    );
  }
  return `<path d="M${v[0].join(" ")}${segments.join("")}" ${style}/>`;
};
const drawing = [...shapes, ...eyes, ...arms].map(svgShape).join("");
const svg = (contents) =>
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><title>Капибара Capy Print</title>' +
  contents +
  "</svg>\n";
const still = svg(
  svgShape(shadow) +
    drawing +
    [37, 48, 59]
      .map(
        (x) =>
          '<circle cx="' +
          x +
          '" cy="92" r="1.5" fill="' +
          palette.green +
          '" opacity=".35"/>'
      )
      .join("")
);
const icon = svg(
  '<rect width="96" height="96" rx="23" fill="' +
    palette.mint +
    '"/><g transform="translate(48 49) scale(1.65) translate(-49 -28)">' +
    iconShapes.map(svgShape).join("") +
    "</g>"
);
const json = JSON.stringify(animation);
if (Buffer.byteLength(json + "\n") > 24_000)
  throw new Error("VK loader exceeds 24 KB");
await mkdir("public/branding", { recursive: true });
await writeFile("public/branding/capy-loader.json", json + "\n");
await writeFile("public/branding/capy-loader.svg", still);
await writeFile("app/icon.svg", icon);
await sharp(Buffer.from(still))
  .resize(384, 384)
  .png()
  .toFile("public/branding/capy-loader-preview.png");
await sharp(Buffer.from(icon))
  .resize(192, 192)
  .png()
  .toFile("public/branding/capy-icon-192.png");

// PNG-backed ICO, with native small sizes for desktop browser tabs.
const sizes = [16, 32, 48, 64, 128, 256];
const images = await Promise.all(
  sizes.map((size) =>
    sharp(Buffer.from(icon)).resize(size, size).png().toBuffer()
  )
);
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((png, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index] === 256 ? 0 : sizes[index];
  header[entry + 1] = header[entry];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeFile("app/favicon.ico", Buffer.concat([header, ...images]));
console.log(
  `Lottie: ${Buffer.byteLength(json + "\n")} bytes, 96×96, 30 fps, 3.2 s. ICO: ${sizes.join(", ")} px.`
);
