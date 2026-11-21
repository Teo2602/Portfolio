import { useCallback, useEffect, useState } from "react";
import { SevenSegmentDisplay } from "./SevenSegment";

/**
 * Contenido de la tercera pantalla (Proyectos / Habilidades / Cualidades).
 *
 * Se posiciona en % sobre una imagen de 3716 x 2032. Las posiciones salen de
 * medir tu diseño en píxeles. Si cambia la proporción de la imagen, recalculá:
 *   left = x / 3716 * 100,  top = y / 2032 * 100
 * (si solo la reescalás manteniendo la proporción, no hace falta tocar nada)
 *
 * Props:
 *   items:     [{ id, label, count }] con exactamente 3 elementos. `count` es la
 *              cantidad de ítems de esa sección y es lo que muestra el display.
 *   lit:       false apaga todo (textos y displays). Pasa a true cuando la
 *              pantalla ya terminó de entrar.
 *   onSeeMore: se llama con el ítem activo al tocar el botón del medio.
 *   onBack:    se llama al tocar la X (arriba a la derecha): vuelve a la pantalla 2.
 *              La X tiene que estar dibujada en la imagen de esta pantalla, en la
 *              misma posición que en la pantalla de detalle (ver POS.close).
 */

// Una fila por cada texto. Cada uno se mueve por separado:
//   digitsTop: posición vertical del display (en %)
//   textMid:   centro vertical del texto (en %)  → más alto = más abajo
//   textLeft:  borde izquierdo del texto (en %)  → más alto = más a la derecha
// (si omitís textLeft usa POS.textLeft, el valor común)
const ROWS = [
  { digitsTop: 4.04, textMid: 10.54, textLeft: 22.8 }, // PROYECTOS
  { digitsTop: 41.0, textMid: 47, textLeft: 22.8 }, // HABILIDADES
  { digitsTop: 77.95, textMid: 82.9, textLeft: 22.8 }, // CUALIDADES
];

const POS = {
  // los dos dígitos: x 376-750 (carcasas en x 344-548 y 578-782)
  digitsLeft: 10.32,
  digitsW: 10.06,
  digitsH: 11.66,
  digitsGap: 0.67,
  textLeft: 23.3,
  up: { left: 79.23, top: 29.23, w: 6.3, h: 9.65 }, // x 2944-3178, y 594-790
  mid: { left: 75.4, top: 41.44, w: 13.99, h: 10.83 }, // x 2802-3322, y 842-1062
  down: { left: 79.23, top: 54.72, w: 6.3, h: 9.65 }, // x 2944-3178, y 1112-1308
  close: { left: 89.17, top: 11.48, w: 6.04, h: 9.03 }, // arriba a la derecha (la X tiene que estar dibujada en la imagen)
};

const placeBox = ({ left, top, w, h }) => ({
  position: "absolute",
  left: `${left}%`,
  top: `${top}%`,
  width: `${w}%`,
  height: `${h}%`,
});

export default function SkillsScreen({ items, lit = true, onSeeMore, onBack }) {
  const [active, setActive] = useState(0);
  const n = items.length;

  // da la vuelta en los extremos
  const step = useCallback((d) => setActive((a) => (a + d + n) % n), [n]);

  // flechas del teclado (solo cuando la pantalla está activa)
  useEffect(() => {
    if (!lit) return;
    const onKey = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lit, step]);

  return (
    <>
      <style>{CSS}</style>

      {items.slice(0, ROWS.length).map((item, i) => {
        const row = ROWS[i];
        const on = lit && i === active;
        return (
          <div key={item.id}>
            <SevenSegmentDisplay
              value={on ? item.count : null}
              digits={2}
              gap={POS.digitsGap}
              style={{
                position: "absolute",
                left: `${POS.digitsLeft}%`,
                top: `${row.digitsTop}%`,
                width: `${POS.digitsW}%`,
                height: `${POS.digitsH}%`,
              }}
            />
            <h2
              className="sk-label"
              data-lit={on}
              aria-current={i === active ? "true" : undefined}
              style={{
                position: "absolute",
                left: `${row.textLeft ?? POS.textLeft}%`,
                top: `${row.textMid}%`,
                transform: "translateY(-50%)",
              }}
            >
              {item.label}
            </h2>
          </div>
        );
      })}

      <button
        type="button"
        className="sk-btn"
        aria-label="Sección anterior"
        onClick={() => step(-1)}
        style={placeBox(POS.up)}
      />
      <button
        type="button"
        className="sk-btn"
        aria-label={`Ver más de ${items[active]?.label ?? ""}`}
        onClick={() => onSeeMore?.(items[active])}
        style={placeBox(POS.mid)}
      />
      <button
        type="button"
        className="sk-btn"
        aria-label="Sección siguiente"
        onClick={() => step(1)}
        style={placeBox(POS.down)}
      />
      <button
        type="button"
        className="sk-btn"
        aria-label="Volver"
        onClick={onBack}
        style={placeBox(POS.close)}
      />
    </>
  );
}

const CSS = `
  /* Texto: sin tipografía ni color definitivos. Cambiá --label-off / --label-on y la fuente. */
  .sk-label {
    margin: 0;
    white-space: nowrap;
    line-height: 1;
    font-weight: 300;
    letter-spacing: 0.015em;
    font-family: "potra";
    font-size: 6.7cqw; /* altura de letra parecida a la de tu diseño; ajustala con tu tipografía */
    color: var(--label-off, #24383b);
    transition: color .35s ease, text-shadow .35s ease;
  }
  .sk-label[data-lit="true"] {
    color: var(--label-on, #00E7F8);
    text-shadow: 0 0 .25em rgba(174, 246, 255, .55);
  }
  .sk-btn {
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    border-radius: 14%;
    transition: background .2s, box-shadow .2s;
  }
  .sk-btn:hover { background: rgba(174, 246, 255, .1); box-shadow: 0 0 24px rgba(174, 246, 255, .35); }
  .sk-btn:focus-visible { outline: 2px solid #aef6ff; outline-offset: 4px; }
`;
