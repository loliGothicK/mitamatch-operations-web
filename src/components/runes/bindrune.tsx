import { Rune, RuneSpec } from "@/domain/character/character";

// 座標系の定義
// L = Left, M = Middle, R = Right
// 0-4 = Top to Bottom
//
// L0 ---- M0 ---- R0
//  |       |       |
// L1 ---- M1 ---- R1
//  |       |       |
// L2 ---- M2 ---- R2
//  |       |       |
// L3 ---- M3 ---- R3
//  |       |       |
// L4 ---- M4 ---- R4
//
type Column = "L" | "M" | "R";
type Row = 0 | 1 | 2 | 3 | 4;
type Point = `${Column}${Row}`;
type LineSegment = [Point, Point];

// ルーン文字のIR定義
interface RuneIR {
  name: string;
  transliteration: string;
  segments: LineSegment[][];
}

// see: https://en.wikipedia.org/wiki/Anglo-Saxon_runes
const RUNE_DEFINITION: Record<Rune, RuneIR> = {
  feh: {
    name: "Feh",
    transliteration: "F",
    segments: [
      [
        ["M0", "M4"],
        ["M1", "R0"],
        ["M2", "R1"],
      ],
    ],
  },
  ur: {
    name: "Ur",
    transliteration: "U",
    segments: [
      [
        ["L0", "L4"],
        ["L0", "M1"],
        ["M1", "M4"],
      ],
    ],
  },
  thorn: {
    name: "Thorn",
    transliteration: "TH",
    segments: [
      [
        ["M0", "M4"],
        ["M1", "R2"],
        ["M3", "R2"],
      ],
      [
        ["L0", "L4"],
        ["L1", "M2"],
        ["L3", "M2"],
      ],
    ],
  },
  os: {
    name: "Os",
    transliteration: "O",
    segments: [
      [
        ["L0", "L4"],
        ["L0", "M1"],
        ["M1", "R0"],
        ["L1", "M2"],
        ["M2", "R1"],
      ],
    ],
  },
  rada: {
    name: "Rada",
    transliteration: "R",
    segments: [
      [
        ["L0", "L4"],
        ["L0", "M1"],
        ["M1", "L2"],
        ["L2", "M3"],
      ],
    ],
  },
  cen: {
    name: "Cen",
    transliteration: "C/K",
    segments: [
      [
        ["M0", "M4"],
        ["M2", "R3"],
      ],
      [
        ["L0", "L4"],
        ["L1", "R3"],
      ],
      [
        ["L0", "L4"],
        ["L2", "M3"],
      ],
    ],
  },
  gyfu: {
    name: "Gyfu",
    transliteration: "G",
    segments: [
      [
        ["L1", "R3"],
        ["L3", "R1"],
      ],
    ],
  },
  wyn: {
    name: "Wyn",
    transliteration: "W",
    segments: [
      [
        ["L0", "L4"],
        ["L0", "M1"],
        ["L2", "M1"],
      ],
    ],
  },
  haegil: {
    name: "Haegil",
    transliteration: "H",
    segments: [
      [
        ["L0", "L4"],
        ["L1", "M2"],
        ["L2", "M3"],
        ["M0", "M4"],
      ],
    ],
  },
  naed: {
    name: "Naed",
    transliteration: "N",
    segments: [
      [
        ["M0", "M4"],
        ["L1", "R3"],
      ],
    ],
  },
  is: {
    name: "Is",
    transliteration: "I",
    segments: [[["M0", "M4"]]],
  },
  gaer: {
    name: "gaer",
    transliteration: "J/Y",
    segments: [
      [
        ["M0", "M4"],
        ["M1", "L2"],
        ["M1", "R2"],
        ["M3", "L2"],
        ["M3", "R2"],
      ],
    ],
  },
  ih: {
    name: "ï",
    transliteration: "I",
    segments: [
      [
        ["L1", "L3"],
        ["L3", "R1"],
        ["R1", "R3"],
      ],
    ],
  },
  eh: {
    name: "Eh",
    transliteration: "EO",
    segments: [
      [
        ["L0", "L4"],
        ["L0", "M1"],
        ["R0", "M1"],
        ["R0", "R4"],
      ],
    ],
  },
  peord: {
    name: "Peord",
    transliteration: "P",
    segments: [
      [
        ["L0", "L4"],
        ["L0", "M1"],
        ["M1", "R0"],
        ["L4", "M3"],
        ["M3", "R4"],
      ],
    ],
  },
  ilcs: {
    name: "Ilcs",
    transliteration: "X",
    segments: [
      [
        ["L0", "M1"],
        ["R0", "M1"],
        ["M0", "M4"],
      ],
    ],
  },
  sygil: {
    name: "Sygil",
    transliteration: "S",
    segments: [
      [
        ["L0", "L3"],
        ["L3", "R1"],
        ["R1", "R4"],
      ],
    ],
  },
  ti: {
    name: "Ti",
    transliteration: "T",
    segments: [
      [
        // variant 0
        ["M1", "R2"],
        ["R2", "R4"],
        ["R2", "L4"],
      ],
      [
        // variant 1
        ["M1", "L2"],
        ["L2", "L4"],
        ["L2", "R4"],
      ],
    ],
  },
  berc: {
    name: "Berc",
    transliteration: "B",
    segments: [
      [
        ["L0", "L4"],
        ["L0", "M1"],
        ["L2", "M1"],
        ["L2", "M3"],
        ["L4", "M3"],
      ],
    ],
  },
  mon: {
    name: "Mon",
    transliteration: "M",
    segments: [
      [
        ["L0", "L4"],
        ["L0", "R2"],
        ["L2", "R0"],
        ["R0", "R4"],
      ],
    ],
  },
  lagu: {
    name: "Lagu",
    transliteration: "L",
    segments: [
      [
        ["L0", "L4"],
        ["L0", "M1"],
      ],
    ],
  },
  ing: {
    name: "Ing",
    transliteration: "NG",
    segments: [
      [
        ["L0", "R2"],
        ["L2", "R0"],
        ["L2", "R4"],
        ["L4", "R2"],
      ],
    ],
  },
  oedil: {
    name: "Oedil",
    transliteration: "OE",
    segments: [
      [
        ["M1", "L2"],
        ["M1", "R2"],
        ["L2", "R4"],
        ["L4", "R2"],
      ],
    ],
  },
  daeg: {
    name: "Daeg",
    transliteration: "D",
    segments: [
      [
        ["L0", "L4"],
        ["L1", "R3"],
        ["L3", "R1"],
        ["R0", "R4"],
      ],
    ],
  },
  ac: {
    name: "Ac",
    transliteration: "A",
    segments: [
      [
        ["M0", "M4"],
        ["M2", "R2"],
        ["M2", "L2"],
      ],
    ], // TODO
  },
  aesc: {
    name: "Aesc",
    transliteration: "AE",
    segments: [
      [
        ["L0", "L4"],
        ["L0", "M1"],
        ["L1", "M2"],
      ],
    ],
  },
  ear: {
    name: "Ear",
    transliteration: "ea",
    segments: [], // TODO
  },
  yr: {
    name: "Yr",
    transliteration: "Y",
    segments: [
      [
        ["M0", "L2"],
        ["M0", "R2"],
        ["M0", "M4"],
      ],
    ], // TODO
  },
};

// 座標変換関数
function pointToCoords(point: Point, width: number, height: number): [number, number] {
  const col = point[0] as Column;
  const row = parseInt(point[1]);

  const x = col === "L" ? 0 : col === "M" ? width / 2 : width;
  const y = (row / 4) * height;

  return [x, y];
}

interface BindRuneProps {
  first: RuneSpec;
  second: RuneSpec;
  strokeWidth?: number;
  width?: number;
  height?: number;
}

/**
 * BindRune Component
 * @param first - The first rune name to bind (colorized as blue)
 * @param second - The second rune name to bind (colorized as pink)
 * @param strokeWidth - The width of the stroke (default: 6)
 * @param width - The width of the canvas (default: 100)
 * @param height - The height of the canvas (default: 50)
 */
export const BindRune = ({
  first,
  second,
  strokeWidth = 10,
  width = 100,
  height = 50,
}: BindRuneProps) => {
  const rune1 = RUNE_DEFINITION[first.rune];
  const rune2 = RUNE_DEFINITION[second.rune];

  if (!rune1 || !rune2) {
    return <div>Invalid rune selection</div>;
  }

  const renderLines = (segments: LineSegment[], color: string, strokeWidth: number) => {
    return segments.map((segment) => {
      const [p1, p2] = segment;
      const [x1, y1] = pointToCoords(p1, width, height);
      const [x2, y2] = pointToCoords(p2, width, height);
      return (
        <line
          key={segment.join("-")}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ mixBlendMode: "hard-light" }}
        />
      );
    });
  };

  const def = [
    [rune1, first.variant, "#00ecfe"],
    [rune2, second.variant, "#ff83ff"],
  ] as const;

  return (
    <div style={{ background: "#000", padding: "10px", textAlign: "center" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ background: "#000" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feColorMatrix type="saturate" values="5" result="saturated" />
            <feColorMatrix
              type="matrix"
              in="saturated"
              result="brightened"
              values="1 0 0 0 0.1   <-- R
                0 1 0 0 0.1   <-- G
                0 0 1 0 0.1   <-- B
                0 0 0 1 0   <-- A"
            />

            <feGaussianBlur in="brightened" stdDeviation="5" result="blur" />

            <feColorMatrix
              type="matrix"
              in="blur"
              result="neonColor"
              values="0 0 0 0 0.1   <-- Rを低く
                0 0 0 0 0.5   <-- Gを中程度に
                0 0 0 0 1     <-- Bを高く
                0 0 0 1 0"
            />

            <feComposite
              in="neonColor"
              in2="SourceGraphic"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="combinedGlow"
            />
          </filter>
        </defs>

        <g
          transform={`translate(${width * 0.1}, ${height * 0.1}) scale(${0.8})`}
          filter={"url(#glow)"}
        >
          {def.map(([ir, variant, color]) => renderLines(ir.segments[variant], color, strokeWidth))}
        </g>
      </svg>
    </div>
  );
};
