import { useEffect, useRef } from "react";
import pcbOff1 from "./assets/pcb-off1.jpeg";
import pcbOn1 from "./assets/pcb-on1.jpeg";
import pcbOff2 from "./assets/pcb-off2.png";
import pcbOn2 from "./assets/pcb-on2.png";
/**
 * Portfolio con estética de PCB.
 *
 * Cada sección tiene 2 capas de imagen:
 *   - off: la PCB apagada (siempre visible)
 *   - on:  la PCB prendida en celeste (solo se ve a través de una máscara)
 * La máscara combina:
 *   1) un círculo que sigue al cursor
 *   2) una franja que baja con el scroll (la "electricidad")
 *
 * Si una sección no tiene `on`, se genera una versión celeste a partir de `off`
 * con filtros CSS (aproximada). Lo ideal es exportar el PNG con transparencia.
 */

const PCB_RATIO = "2576 / 1448"; // proporción de tus imágenes

const DEFAULT_SECTIONS = [
  {
    id: "inicio",
    label: "Teo Gonzalez",
    off: pcbOff1,
    on: pcbOn1,
  },
  {
    id: "proyectos",
    label: "Proyectos",
    off: "/assets/pcb-off2.png",
    on: "/assets/pcb-on2.png",
  },
];

const PROJECTS = [
  { title: "Proyecto uno", text: "Descripción corta de qué hace y con qué tecnologías." },
  { title: "Proyecto dos", text: "Descripción corta de qué hace y con qué tecnologías." },
  { title: "Proyecto tres", text: "Descripción corta de qué hace y con qué tecnologías." },
];

const FALLBACK_FILTER =
  "brightness(2.6) contrast(1.7) sepia(1) hue-rotate(145deg) saturate(5)";

export default function PcbPortfolio({
  sections = DEFAULT_SECTIONS,
radius = 80, // radio del halo del cursor (px)
  waveStrength = 1, // intensidad de la ola (0 a 1)
  trail = 0.9, // largo de la estela, como fracción del alto de pantalla
}) {
  const litRefs = useRef([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = { tx: -99999, ty: -99999, x: -99999, y: -99999, r: 0, tr: 0 };
    let raf = 0;

    const frame = () => {
      raf = 0;
      const k = reduce ? 1 : 0.2;

      // al entrar por primera vez, el halo aparece directo bajo el cursor
      if (s.x < -9000 && s.tx > -9000) {
        s.x = s.tx;
        s.y = s.ty;
      }
      s.x += (s.tx - s.x) * k;
      s.y += (s.ty - s.y) * k;
      s.r += (s.tr - s.r) * k;

      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      const progress = max > 0 ? window.scrollY / max : 0;
      // el frente de la ola siempre está dentro de la pantalla:
      // arriba al empezar, abajo al terminar
      const front = window.scrollY + progress * vh;

      for (const el of litRefs.current) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) continue; // fuera de pantalla
        el.style.setProperty("--x", `${s.x - rect.left}px`);
        el.style.setProperty("--y", `${s.y - rect.top}px`);
        el.style.setProperty("--r", `${Math.max(s.r, 0)}px`);
        el.style.setProperty("--wave", `${front - (rect.top + window.scrollY)}px`);
        el.style.setProperty("--trail", `${trail * vh}px`);
        el.style.setProperty("--ws", reduce ? "0" : String(waveStrength));
      }

      const moving =
        Math.abs(s.tx - s.x) > 0.5 ||
        Math.abs(s.ty - s.y) > 0.5 ||
        Math.abs(s.tr - s.r) > 0.5;
      if (moving && !reduce) raf = requestAnimationFrame(frame);
    };

    const request = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e) => {
      s.tx = e.clientX;
      s.ty = e.clientY;
      s.tr = radius;
      request();
    };
    const onLeave = () => {
      s.tr = 0;
      request();
    };
    const onUp = (e) => {
      if (e.pointerType === "touch") onLeave();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    document.documentElement.addEventListener("mouseleave", onLeave);

    request(); // primer pintado (posiciona la ola)

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [radius, waveStrength, trail]);

  return (
    <main style={styles.page}>
      {sections.map((sec, i) => {
        const hasOn = Boolean(sec.on);
        return (
          <section
            key={sec.id}
            id={sec.id}
            aria-label={sec.label}
            style={{ ...styles.section, backgroundImage: `url(${sec.off})` }}
          >
            {/* capa prendida: se ve solo donde la máscara lo permite */}
            <div
              aria-hidden="true"
              ref={(el) => (litRefs.current[i] = el)}
              style={{
                ...styles.lit,
                backgroundImage: `url(${hasOn ? sec.on : sec.off})`,
                filter: hasOn ? "none" : FALLBACK_FILTER,
                mixBlendMode: hasOn ? "normal" : "screen",
              }}
            />

            {sec.id === "inicio" && (
              // el nombre ya está dibujado en la imagen; esto es para lectores
              // de pantalla y buscadores
              <h1 style={styles.srOnly}>Teo Gonzalez, portfolio</h1>
            )}

            {sec.id === "proyectos" && <ProjectsScreen />}
          </section>
        );
      })}
    </main>
  );
}

/**
 * Contenido que se apoya sobre los "chips" dibujados en la imagen de proyectos.
 * Las posiciones están en % de la imagen (2576 x 1448).
 */
function ProjectsScreen() {
  return (
    <>
      <div style={{ ...styles.chip, left: "3.9%", top: "14.8%", width: "36.7%", height: "80.2%" }}>
        <h2 style={styles.h2}>Proyectos</h2>
        <ul style={styles.list}>
          {PROJECTS.map((p) => (
            <li key={p.title} style={styles.item}>
              <h3 style={styles.h3}>{p.title}</h3>
              <p style={styles.p}>{p.text}</p>
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          ...styles.chip,
          left: "55.5%",
          top: "19%",
          width: "35%",
          height: "42%",
          background: "#000",
          display: "grid",
          placeItems: "center",
        }}
      >
        {/* acá va una captura o video del proyecto seleccionado */}
        <span style={{ ...styles.p, opacity: 0.5 }}>Vista previa</span>
      </div>

      <a href="#contacto" style={styles.button}>
        ver más
      </a>
    </>
  );
}

// máscara: círculo del cursor + franja de la ola (se suman)
const MASK = [
  "radial-gradient(circle var(--r, 0px) at var(--x, -9999px) var(--y, -9999px), rgba(0,0,0,1) 0%, rgba(0,0,0,.55) 40%, transparent 100%)",
  "linear-gradient(to bottom, transparent calc(var(--wave, -9999px) - var(--trail, 600px)), rgba(0,0,0,calc(var(--ws, 0) * .45)) calc(var(--wave, -9999px) - 40px), rgba(0,0,0,var(--ws, 0)) var(--wave, -9999px), transparent calc(var(--wave, -9999px) + 60px))",
].join(", ");

const styles = {
  page: {
    background: "#000",
    margin: 0,
  },
  section: {
    position: "relative",
    width: "100%",
    aspectRatio: PCB_RATIO,
    overflow: "hidden",
    backgroundColor: "#000",
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
  },
  lit: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    WebkitMaskImage: MASK,
    maskImage: MASK,
    WebkitMaskComposite: "source-over",
    maskComposite: "add",
  },
  chip: {
    position: "absolute",
    boxSizing: "border-box",
    padding: "clamp(16px, 2.4vw, 44px)",
    borderRadius: 14,
    background: "#0a0a0a",
    color: "#cfeff3",
    fontFamily: "Rajdhani, system-ui, sans-serif", // importá la fuente que uses en el título
    overflow: "hidden",
  },
  h2: {
    margin: "0 0 1.2em",
    fontSize: "clamp(20px, 2.6vw, 48px)",
    fontWeight: 300,
    letterSpacing: "0.06em",
  },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "1.4em" },
  item: { borderLeft: "2px solid #4c7f8a", paddingLeft: "1em" },
  h3: { margin: 0, fontSize: "clamp(14px, 1.6vw, 30px)", fontWeight: 500 },
  p: { margin: "0.3em 0 0", fontSize: "clamp(11px, 1.1vw, 20px)", lineHeight: 1.45, color: "#9fc4cb" },
  button: {
    position: "absolute",
    left: "66.2%",
    top: "78.4%",
    width: "11.8%",
    height: "8.4%",
    display: "grid",
    placeItems: "center",
    borderRadius: 999,
    background: "#0e0e0e",
    color: "#d8d8d8",
    fontFamily: "system-ui, sans-serif",
    fontSize: "clamp(11px, 1.6vw, 30px)",
    textDecoration: "none",
  },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
  },
};
