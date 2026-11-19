/**
 * Display de 7 segmentos dibujado en SVG.
 *
 * Cada segmento (a, b, c, d, e, f, g y el punto) es un <polygon>/<circle>
 * independiente, así que cada uno cambia de color por separado según el
 * número que reciba el componente.
 *
 *     a
 *    ───
 *  f│   │b
 *    ─g─
 *  e│   │c
 *    ───  • dp
 *     d
 *
 * Uso:
 *   <SevenSegmentDigit value={7} />                   // un dígito
 *   <SevenSegmentDisplay value={12} digits={2} />     // varios dígitos
 *   <SevenSegmentDisplay value={null} />              // todo apagado
 */

// qué segmentos se prenden para cada número
const DIGITS = {
  0: "abcdef",
  1: "bc",
  2: "abdeg",
  3: "abcdg",
  4: "bcfg",
  5: "acdfg",
  6: "acdefg",
  7: "abc",
  8: "abcdefg",
  9: "abcdfg",
};

// geometría (unidades del viewBox)
const W = 52; // ancho del cuerpo del dígito
const H = 104; // alto
const T = 9; // grosor de los segmentos
const h = T / 2;
const GAP = 1.4; // separación entre segmentos
const VIEW_W = 61; // ancho total, con lugar para el punto

const pts = (arr) => arr.map(([x, y]) => `${x},${y}`).join(" ");

// segmento horizontal con puntas, de x1 a x2, centrado en y
const hSeg = (x1, x2, y) =>
  pts([[x1, y], [x1 + h, y - h], [x2 - h, y - h], [x2, y], [x2 - h, y + h], [x1 + h, y + h]]);

// segmento vertical con puntas, de y1 a y2, centrado en x
const vSeg = (y1, y2, x) =>
  pts([[x, y1], [x + h, y1 + h], [x + h, y2 - h], [x, y2], [x - h, y2 - h], [x - h, y1 + h]]);

const SEGMENTS = {
  a: hSeg(h + GAP, W - h - GAP, h),
  b: vSeg(h + GAP, H / 2 - GAP, W - h),
  c: vSeg(H / 2 + GAP, H - h - GAP, W - h),
  d: hSeg(h + GAP, W - h - GAP, H - h),
  e: vSeg(H / 2 + GAP, H - h - GAP, h),
  f: vSeg(h + GAP, H / 2 - GAP, h),
  g: hSeg(h + GAP, W - h - GAP, H / 2),
};

const DEFAULT_ON = "#aef6ff"; // celeste claro
const DEFAULT_OFF = "#1c1c1c"; // oscuro

/** Un dígito. `value`: 0 a 9, o null/undefined para apagarlo del todo. */
export function SevenSegmentDigit({
  value = null,
  dot = false, // punto decimal prendido
  onColor = DEFAULT_ON,
  offColor = DEFAULT_OFF,
  glow = true, // resplandor en los segmentos prendidos
  style,
  className,
}) {
  const lit = value == null ? "" : DIGITS[value] ?? "";

  const segStyle = (on) => ({
    fill: on ? onColor : offColor,
    filter: on && glow ? `drop-shadow(0 0 4px ${onColor})` : "none",
    transition: "fill .25s ease, filter .25s ease",
  });

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${H}`}
      role="img"
      aria-label={value == null ? "apagado" : String(value)}
      style={{ display: "block", overflow: "visible", ...style }}
      className={className}
    >
      {Object.entries(SEGMENTS).map(([name, points]) => (
        <polygon key={name} data-seg={name} points={points} style={segStyle(lit.includes(name))} />
      ))}
      <circle data-seg="dp" cx={W + 5} cy={H - 4.5} r={3.6} style={segStyle(dot)} />
    </svg>
  );
}

/**
 * Varios dígitos juntos. `value` es un número entero; null apaga todos los
 * segmentos. Si el número no entra, muestra el máximo (por ejemplo 99).
 * Ocupa el 100% del ancho y alto de su contenedor.
 */
export function SevenSegmentDisplay({
  value = null,
  digits = 2,
  padZero = true, // 5 → "05" (si es false, el dígito de la izquierda queda apagado)
  onColor = DEFAULT_ON,
  offColor = DEFAULT_OFF,
  glow = true,
  style,
  className,
}) {
  const max = 10 ** digits - 1;
  const hasValue = value != null && Number.isFinite(value);
  const text = hasValue
    ? String(Math.min(Math.max(Math.round(value), 0), max)).padStart(digits, padZero ? "0" : " ")
    : "";

  // separación entre dígitos: 0.62 veces el ancho de un dígito
  const g = 0.62;
  const basis = 100 / (digits + (digits - 1) * g);

  return (
    <div
      className={className}
      style={{ display: "flex", gap: `${basis * g}%`, alignItems: "stretch", ...style }}
    >
      {Array.from({ length: digits }, (_, i) => {
        const ch = text[i];
        const v = ch === undefined || ch === " " ? null : Number(ch);
        return (
          <SevenSegmentDigit
            key={i}
            value={v}
            onColor={onColor}
            offColor={offColor}
            glow={glow}
            style={{ flex: `0 0 ${basis}%`, width: `${basis}%`, height: "100%" }}
          />
        );
      })}
    </div>
  );
}

export default SevenSegmentDisplay;
