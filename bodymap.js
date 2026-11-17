// The body map, drawn for this app: smooth muscle shapes, front and back.
//
// Each figure sits on a 100 x 215 grid. The shapes below are only the LEFT half
// of the body; the right half is a mirror copy, so both sides always match.
//   m  = the muscle (a key in MUSCLES, see exercises.js)
//   d  = a path, r = a rounded box [x, y, width, height, corner], e = an oval [x, y, width/2, height/2]

const FRONT_MUSCLES = [
  { m: "traps", d: "M44 29 C41 32 37 34 31 36 C35 37.5 40 37.5 45 36.5 C45 34 44.5 31.5 44 29Z" },
  { m: "shoulders", d: "M31 37 C25 37 21 42 20.5 49 C20.3 53 21 57 22.5 60 C25 55 28.5 50.5 33 47.5 C34.5 43.5 34 39.5 31 37Z" },
  { m: "chest", d: "M49 39 L49 55.5 C44 58 38 57.5 34.5 54 C32 51 32.5 46 35 42.5 C38.5 39.5 44 38.5 49 39Z" },
  { m: "biceps", d: "M23 61 C21 67 20.5 73 21.5 79 C23.5 81 26.5 81 28.5 79 C30.5 73 31.5 66 32.5 58.5 C29.5 56.5 25.5 57.5 23 61Z" },
  { m: "forearms", d: "M21 83 C18.5 91 16.5 99 16 107 C17.8 108.5 20.2 108.5 22 107 C24.8 99 27 91 28.5 83 C26.5 81 23 81 21 83Z" },
  { m: "core", r: [42.5, 58, 6.5, 9.5, 3] },
  { m: "core", r: [42.5, 69.5, 6.5, 9.5, 3] },
  { m: "core", r: [42.5, 81, 6.5, 9.5, 3] },
  { m: "core", d: "M42.5 92.5 L49 92.5 L49 102 C46 101 43.5 98 42.5 92.5Z" },
  { m: "core", d: "M34.5 57.5 C33.5 65 34 75 36 85 C37.2 91 38.8 95.5 41 99 L41 59.5 C38.8 58.5 36.5 57.8 34.5 57.5Z" },
  { m: "quads", d: "M34.5 104 C31.5 115 31 129 33 141 C34.5 147.5 38.5 151 43 150 C46 140 47 125 47 111 C45 106 40 102.5 34.5 104Z" },
  { m: "quads", d: "M48.3 108 C49.6 113 49.7 123 48.7 133 C47.3 128 46.9 118 48.3 108Z" },
  { m: "calves", d: "M35.5 161 C33.5 171 33.5 182 35.5 193 C37 196.5 40 196.5 41.5 193 C43 182 43 171 41.8 161 C40 158.5 37.3 158.5 35.5 161Z" },
];

const FRONT_BASE = [
  { e: [18.5, 113.5, 4, 6] }, // hand
  { e: [39.5, 155, 4.2, 3.5] }, // knee
  { d: "M33 200 C33 197 36 196 39.5 196.5 C42.5 197 43 200 42 203 C39 205.5 34 205 33 200Z" }, // foot
];

const BACK_MUSCLES = [
  { m: "traps", d: "M50 26 C47 29.5 41 33 31.5 36.5 C36.5 39.5 41.5 43.5 45 49 C47.5 53.5 49 58 50 63Z" },
  { m: "shoulders", d: "M31 37 C25 37 21 42 20.5 49 C20.3 53 21 57 22.5 60 C25 55 28.5 50.5 33 47.5 C34.5 43.5 34 39.5 31 37Z" },
  { m: "triceps", d: "M22.5 59 C20.5 66 20.5 73 21.5 79.5 C24 81.5 27 81 29 79 C31 72 32 65 32.5 57 C29.5 55 25 55.5 22.5 59Z" },
  { m: "forearms", d: "M21 83 C18.5 91 16.5 99 16 107 C17.8 108.5 20.2 108.5 22 107 C24.8 99 27 91 28.5 83 C26.5 81 23 81 21 83Z" },
  { m: "lats", d: "M33.5 48 C32.5 56.5 34 66 38 74.5 C41.5 80.5 45.5 84.5 48.5 86.5 L48.5 66 C46 57 41 50.5 33.5 48Z" },
  { m: "lowerback", d: "M42 84 C44.5 88 46.5 90 48.5 91 L48.5 98 C45 97 42.5 94.5 41 90.5 C40.8 88 41.2 85.8 42 84Z" },
  { m: "glutes", d: "M48.5 99.5 C43 98.5 37.5 100 34.5 105.5 C32.5 112 34 118.5 39.5 121.5 C44 123 48.5 120.5 48.5 115Z" },
  { m: "hamstrings", d: "M34.5 123.5 C32.5 133 33 142.5 35.5 150.5 C38 152.5 42 152.5 44 150 C46 141 47 132 47 124.5 C43 125.5 38.5 125.5 34.5 123.5Z" },
  { m: "calves", d: "M34.5 160 C31.5 168 32 177.5 35 186 C37 190 40.5 190 42.5 186.5 C44.5 178 44.5 168 42.5 160 C40.5 157 36.5 157 34.5 160Z" },
];

const BACK_BASE = [
  { e: [18.5, 113.5, 4, 6] }, // hand
  { e: [39.5, 155, 4, 3] }, // back of the knee
  { d: "M37.5 189 L41.5 189 L41 197 L38 197Z" }, // heel tendon
  { d: "M33.5 200 C33.5 197 36 196.5 39.5 196.5 C42.5 196.5 43 199.5 42 202.5 C39 205 34.5 204.5 33.5 200Z" }, // heel
];

// Head and neck sit in the middle, so they are not mirrored
const HEAD = '<ellipse class="base" cx="50" cy="15" rx="8.5" ry="10.5"/><path class="base" d="M45 23 L55 23 L56 31 L44 31Z"/>';

function shapeSvg(shape, className) {
  const attrs = 'class="' + className + '"' + (shape.m ? ' data-m="' + shape.m + '"' : "");
  if (shape.d) return "<path " + attrs + ' d="' + shape.d + '"/>';
  if (shape.r) {
    const [x, y, w, h, rx] = shape.r;
    return "<rect " + attrs + ' x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '"/>';
  }
  const [cx, cy, rx, ry] = shape.e;
  return "<ellipse " + attrs + ' cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"/>';
}

// One figure: the left half, then the same half flipped to make the right side
function figureSvg(muscles, base, label, offsetX) {
  const half = base.map((s) => shapeSvg(s, "base")).join("") + muscles.map((s) => shapeSvg(s, "m")).join("");
  return (
    '<g transform="translate(' + offsetX + ' 0)">' +
    HEAD +
    half +
    '<g transform="matrix(-1 0 0 1 100 0)">' + half + "</g>" +
    '<text class="map-label" x="50" y="217" text-anchor="middle">' + label + "</text>" +
    "</g>"
  );
}

const BODY_SVG =
  '<svg viewBox="0 0 210 222" role="img" aria-label="Body map">' +
  figureSvg(FRONT_MUSCLES, FRONT_BASE, "FRONT", 0) +
  figureSvg(BACK_MUSCLES, BACK_BASE, "BACK", 110) +
  "</svg>";

// How bright a muscle glows, from 0 (off) to 4 (full volt).
// Workout maps: 2 = main muscle, 1 = helper. Set maps: the number of sets.
function heatLevel(value, countsSets) {
  if (!value) return 0;
  if (!countsSets) return value >= 2 ? 4 : 2;
  if (value >= 10) return 4;
  if (value >= 6) return 3;
  if (value >= 3) return 2;
  return 1;
}

// Draw the body map in an element and light up the muscles.
//   levels   { chest: 2, triceps: 1 }  (or set counts when options.sets is true)
//   options  { sets, tired: ["chest"], selected: "chest", onTap: (muscle) => {} }
function drawBodyMap(element, levels, options) {
  const opts = options || {};

  // Only draw the figure the first time, so colours can fade when they change
  if (!element.querySelector("svg")) {
    element.innerHTML = BODY_SVG;
    element.addEventListener("click", (event) => {
      const shape = event.target.closest("[data-m]");
      if (shape && element.onMuscleTap) element.onMuscleTap(shape.dataset.m);
    });
  }

  element.onMuscleTap = opts.onTap || null;
  element.classList.toggle("tappable", Boolean(opts.onTap));

  const tired = opts.tired || [];
  element.querySelectorAll("[data-m]").forEach((shape) => {
    const muscle = shape.dataset.m;
    const heat = heatLevel(levels[muscle], opts.sets);
    for (let i = 1; i <= 4; i++) shape.classList.toggle("h" + i, heat === i);
    shape.classList.toggle("tired", tired.includes(muscle));
    shape.classList.toggle("sel", opts.selected === muscle);
  });
}
