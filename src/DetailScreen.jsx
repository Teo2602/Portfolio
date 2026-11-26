import { useCallback, useEffect, useState } from "react";

/**
 * Pantalla de detalle de una sección (Proyectos, Habilidades o Cualidades).
 * Muestra un ítem a la vez dentro del display; las flechas de abajo cambian de
 * ítem (dan la vuelta en los extremos) y la X vuelve a la pantalla anterior.
 *
 * Se posiciona en % sobre una imagen de 3840 x 2160, medidos en píxeles:
 *   left = x / 3840 * 100,  top = y / 2160 * 100
 *
 * Props:
 *   label:  nombre de la sección (para lectores de pantalla)
 *   items:  [{ title, logo?, text }]  los ítems que se recorren con las flechas.
 *           Si el ítem tiene `logo`, se muestra el logo en lugar del título
 *           (el título queda como texto alternativo para lectores de pantalla).
 *           `logo` puede ser la ruta/import de una imagen (svg, png...) o un
 *           elemento de React, por ejemplo un <svg>. Sin `logo`, se muestra el título.
 *   active: true cuando esta pantalla es la que se está viendo (habilita ← →)
 *   onBack: se llama al tocar la X
 */

// interior negro del display: x 1074-2841, y 286-1507
const SCREEN = { left: 27.97, top: 13.24, w: 46.02, h: 56.53 };
const PREV = { left: 37.71, top: 80.46, w: 6.04, h: 9.03 }; // x 1448-1680, y 1738-1933
const NEXT = { left: 56.2, top: 80.46, w: 6.04, h: 9.03 }; // x 2158-2390
const CLOSE = { left: 89.17, top: 11.48, w: 6.04, h: 9.03 }; // x 3424-3656, y 248-443

const place = ({ left, top, w, h }) => ({
  position: "absolute",
  left: `${left}%`,
  top: `${top}%`,
  width: `${w}%`,
  height: `${h}%`,
});

export default function DetailScreen({ label, items, active = false, onBack }) {
  const [index, setIndex] = useState(0);
  const n = items.length;

  // da la vuelta en los extremos
  const step = useCallback((d) => setIndex((i) => (i + d + n) % n), [n]);

  // flechas del teclado (solo cuando esta pantalla es la visible)
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, step]);

  const item = items[index];

  return (
    <>
      <style>{CSS}</style>

      {/* contenido del ítem dentro del display. Sin tipografía ni color definitivos. */}
      <section
        aria-label={label}
        aria-live="polite"
        style={{
          position: "absolute",
          left: `${SCREEN.left}%`,
          top: `${SCREEN.top}%`,
          width: `${SCREEN.w}%`,
          height: `${SCREEN.h}%`,
          boxSizing: "border-box",
          padding: "3cqw",
          overflow: "hidden",
        }}
      >
        {/* key: al cambiar de ítem se vuelve a montar y se repite la entrada suave */}
        <div key={index} className="dt-item">
          {item?.logo ? (
            <>
              {typeof item.logo === "string" ? (
                <img className="dt-logo" src={item.logo} alt="" draggable={false} decoding="async" />
              ) : (
                <div className="dt-logo" aria-hidden="true">
                  {item.logo}
                </div>
              )}
              {/* el título sigue estando para lectores de pantalla */}
              <h2 className="dt-sr">{item.title}</h2>
            </>
          ) : (
            <h2 className="dt-title">{item?.title}</h2>
          )}
          <p className="dt-text">{item?.text}</p>
        </div>
      </section>

      <button
        type="button"
        className="dt-btn"
        aria-label="Anterior"
        onClick={() => step(-1)}
        style={place(PREV)}
      />
      <button
        type="button"
        className="dt-btn"
        aria-label="Siguiente"
        onClick={() => step(1)}
        style={place(NEXT)}
      />
      <button
        type="button"
        className="dt-btn"
        aria-label="Volver"
        onClick={onBack}
        style={place(CLOSE)}
      />
    </>
  );
}

const CSS = `
  .dt-item { animation: dt-in .35s ease both; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 100%; gap: 1.6cqw; box-sizing: border-box; }
  .dt-title { margin: 0 0 .6em; font-weight: 300; font-size: 3.2cqw; line-height: 1.1; color: var(--detail-title, #aef6ff); }
  /* logo: alto fijo y ancho automático; --logo-height cambia el tamaño */
  .dt-logo { display: block; height: var(--logo-height, 9cqw); width: auto; max-width: 100%; object-fit: contain; margin: 0 0 1.6cqw; }
  .dt-logo svg, .dt-logo img { display: block; height: 100%; width: auto; }
  .dt-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .dt-text { margin: 0; font-size: 1.6cqw; line-height: 1.5; color: var(--detail-text, #9fc4cb); }
  @keyframes dt-in { from { opacity: 0; transform: translateY(1.2cqw); } to { opacity: 1; transform: none; } }

  .dt-btn { padding: 0; border: 0; background: transparent; cursor: pointer; border-radius: 14%; transition: background .2s, box-shadow .2s; }
  .dt-btn:hover { background: rgba(174, 246, 255, .1); box-shadow: 0 0 24px rgba(174, 246, 255, .35); }
  .dt-btn:focus-visible { outline: 2px solid #aef6ff; outline-offset: 4px; }

  @media (prefers-reduced-motion: reduce) { .dt-item { animation: none; } }
`;
