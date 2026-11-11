import { useEffect, useRef } from "react";
import pcbOff1 from "./assets/pcb-off1.jpeg";
import pcbOn1 from "./assets/pcb-on1.jpeg";
import pcbOff2 from "./assets/pcb-off2.png";
import pcbOn2 from "./assets/pcb-on2.png";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useGSAP } from "@gsap/react";
 
gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);
 
/**
 * Portfolio con estética de PCB + scroll suave con GSAP.
 *
 *   npm i gsap @gsap/react
 *
 * Capas de cada sección:
 *   - off:   la PCB apagada (siempre visible)
 *   - on:    la PCB prendida, con sus colores originales, visible solo a través
 *            de una máscara (halo del cursor + franja de luz)
 *   - bloom: copia más brillante de `on`, con máscara más ancha (resplandor)
 *
 * La franja de luz se define por su posición en la PANTALLA (no en la página):
 *   1. Al principio la página queda quieta (la primera sección está "pineada")
 *      y la franja baja desde arriba hasta la mitad de la pantalla mientras
 *      scrolleás. Cuando llega a la mitad, la página empieza a moverse.
 *   2. Después la franja queda en la mitad de la pantalla, así que recorre la
 *      página al mismo ritmo que el scroll.
 *   3. Al llegar al final de la página, la franja termina de bajar hasta el
 *      borde inferior.
 *
 * Las imágenes deben tener el mismo ancho en píxeles para que las pistas sean
 * continuas entre secciones; cada sección toma su proporción de `ratio`.
 */
const DEFAULT_SECTIONS = [
  {
    id: "inicio",
    label: "Teo Gonzalez",
    off: pcbOff1,
    on: pcbOn1,
    ratio: "1365 / 768",

  },
  {
    id: "proyectos",
    label: "Proyectos",
    off: pcbOff2,
    on: pcbOn2,
    ratio: "3840 / 2004",
  },
];

const PROJECTS = [
  { title: "Proyecto uno", text: "Descripción corta de qué hace y con qué tecnologías." },
  { title: "Proyecto dos", text: "Descripción corta de qué hace y con qué tecnologías." },
  { title: "Proyecto tres", text: "Descripción corta de qué hace y con qué tecnologías." },
];
 

const HIDDEN = -240; // px: la cabeza de la franja queda fuera de pantalla, arriba
 
export default function PcbPortfolio({
  sections = DEFAULT_SECTIONS,
  // luz
  radius = 200, // radio del halo del cursor (px)
  waveStrength = 1, // intensidad de la franja (0 a 1)
  trail = 0.9, // largo de la estela, como fracción del alto de pantalla
  bloom = 1, // intensidad del resplandor (0 lo apaga)
  bloomBlur = 4, // desenfoque del resplandor en px (0 si va lento)
  // scroll
  smooth = 1.2, // segundos que tarda el scroll en "alcanzar" al dedo/rueda
  introScroll = 0.7, // scroll (en alturas de pantalla) que dura el tramo con la página quieta
  introDelay = 0.15, // parte inicial de ese tramo (0 a 1) en la que la franja todavía no aparece
  endDuration = 1.4, // segundos que tarda la franja en terminar de bajar al final
  // nombre
  nameSize = 191, // tamaño del nombre en tu diseño (px)...
  designWidth = 1920, // ...sobre un lienzo de este ancho (px); se escala con la pantalla
}) {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const sectionRefs = useRef([]);
  // estado compartido entre GSAP y el render de la luz:
  // intro: 0 → 1 (franja baja hasta la mitad), end: 0 → 1 (franja baja hasta el borde)
  const shared = useRef({ band: { intro: 0, end: 0 }, dirty: true });
 
  // ---- scroll suave, tramo inicial quieto y llegada al final ---------------
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const secs = sectionRefs.current.filter(Boolean);
      if (!secs.length) return;
      const { band } = shared.current;
      const mark = () => (shared.current.dirty = true);
 
      // ScrollSmoother tiene que crearse antes que los ScrollTrigger
      ScrollSmoother.create({
        wrapper: wrapperRef.current,
        content: contentRef.current,
        smooth,
        effects: true, // activa data-speed y data-lag
        onUpdate: mark,
      });
 
      // 1) La primera sección queda quieta mientras la franja baja hasta la mitad.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: secs[0],
            start: "top top",
            end: () => "+=" + Math.round(window.innerHeight * introScroll),
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        .to(band, { intro: 1, duration: 1 - introDelay, ease: "power1.inOut", onUpdate: mark }, introDelay);
 
      // 2) Al llegar al final de la página, la franja termina de bajar.
      let endTween;
      const toEnd = (v) => {
        endTween?.kill();
        endTween = gsap.to(band, { end: v, duration: endDuration, ease: "power2.out", onUpdate: mark });
      };
      ScrollTrigger.create({
        trigger: secs[secs.length - 1],
        start: "bottom bottom+=6",
        end: "max",
        onEnter: () => toEnd(1),
        onLeaveBack: () => toEnd(0),
      });
    },
    { scope: wrapperRef, dependencies: [smooth, introScroll, introDelay, endDuration] }
  );
 
  // ---- luz: cursor + franja ------------------------------------------------
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { band } = shared.current;
    const mark = () => (shared.current.dirty = true);
    const c = { tx: -99999, ty: -99999, x: -99999, y: -99999, r: 0, tr: 0 };
    let prev = { top: NaN, vy: NaN, vh: NaN };
 
    const tick = (time, deltaTime) => {
      const dt = Math.min(deltaTime || 16, 64);
      const kc = reduce ? 1 : 1 - Math.exp(-dt / 75); // inercia del cursor
 
      // al entrar por primera vez, el halo aparece directo bajo el cursor
      if (c.x < -9000 && c.tx > -9000) {
        c.x = c.tx;
        c.y = c.ty;
      }
      c.x += (c.tx - c.x) * kc;
      c.y += (c.ty - c.y) * kc;
      c.r += (c.tr - c.r) * kc;
      const cursorMoving =
        Math.abs(c.tx - c.x) > 0.5 || Math.abs(c.ty - c.y) > 0.5 || Math.abs(c.tr - c.r) > 0.5;
 
      const secs = sectionRefs.current;
      if (!secs[0]) return;
      const vh = window.innerHeight;
      const top0 = secs[0].getBoundingClientRect().top; // cambia al scrollear (suavizado incluido)
      // posición de la cabeza de la franja, en px desde el borde superior de la pantalla
      const mid = vh * 0.5;
      const vy = reduce ? HIDDEN : HIDDEN + (mid - HIDDEN) * band.intro + (vh - mid) * band.end;
 
      if (!shared.current.dirty && !cursorMoving && top0 === prev.top && vy === prev.vy && vh === prev.vh) {
        return; // nada cambió: no se toca el DOM
      }
      prev = { top: top0, vy, vh };
      shared.current.dirty = cursorMoving;
 
      const r = Math.max(c.r, 0);
      for (const el of secs) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) continue; // fuera de pantalla
        const st = el.style;
        st.setProperty("--x", `${c.x - rect.left}px`);
        st.setProperty("--y", `${c.y - rect.top}px`);
        st.setProperty("--r", `${r}px`);
        st.setProperty("--r2", `${r * 1.45}px`);
        st.setProperty("--wave", `${vy - rect.top}px`);
        st.setProperty("--trail", `${trail * vh}px`);
        st.setProperty("--ws", reduce ? "0" : String(waveStrength));
        st.setProperty("--bs", reduce ? "0" : String(bloom));
        st.setProperty("--bsc", String(bloom)); // resplandor del cursor
      }
    };
 
    const onMove = (e) => {
      c.tx = e.clientX;
      c.ty = e.clientY;
      c.tr = radius;
      mark();
    };
    const onLeave = () => {
      c.tr = 0;
      mark();
    };
    const onUp = (e) => {
      if (e.pointerType === "touch") onLeave();
    };
 
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("resize", mark);
    document.documentElement.addEventListener("mouseleave", onLeave);
    gsap.ticker.add(tick);
    mark();
 
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", mark);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [radius, waveStrength, trail, bloom]);
 
  return (
    <div id="smooth-wrapper" ref={wrapperRef}>
      <main id="smooth-content" ref={contentRef} style={styles.page}>
        <style>{CSS}</style>
 
        {sections.map((sec, i) => (
          <section
            key={sec.id}
            id={sec.id}
            aria-label={sec.label}
            ref={(el) => (sectionRefs.current[i] = el)}
            style={{
              ...styles.section,
              aspectRatio: sec.ratio,
              backgroundImage: `url(${sec.off})`,
            }}
          >
            {/* PCB prendida con sus colores originales */}
            <div
              aria-hidden="true"
              style={{ ...styles.layer, ...styles.lit, backgroundImage: `url(${sec.on})` }}
            />
 
            {/* resplandor: más brillante, con máscara más ancha */}
            {bloom > 0 && (
              <div
                aria-hidden="true"
                style={{
                  ...styles.layer,
                  ...styles.bloom,
                  backgroundImage: `url(${sec.on})`,
                  filter: `blur(${bloomBlur}px) brightness(1.7) saturate(1.3)`,
                }}
              />
            )}
 
            {sec.id === "inicio" && (
              // Texto real sobre el nombre dibujado en la imagen. Cambiale el
              // color y la tipografía en `styles.name` para que coincida.
              <h1 className="pcb-name" style={{ ...styles.name, "--k": nameSize / designWidth }}>
                TEO GONZALEZ
              </h1>
            )}
 
            {sec.id === "proyectos" && <ProjectsScreen />}
          </section>
        ))}
      </main>
    </div>
  );
}
 
/**
 * Contenido que se apoya sobre los "chips" dibujados en la imagen de proyectos.
 * Las posiciones son % de la imagen (3838 x 2004), medidas en píxeles sobre
 * pcb-on2.png. Si cambiás el tamaño de la imagen, recalculá:
 *   left = x / ancho * 100,  top = y / alto * 100
 *   width = (x2 - x1) / ancho * 100,  height = (y2 - y1) / alto * 100
 */
function ProjectsScreen() {
  return (
    <>
      {/* chip gris grande: x 150-1555, y 163-1894 */}
      <div style={{ ...styles.box, left: "3.91%", top: "8.13%", width: "36.63%", height: "86.43%" }}>
        <h2 style={styles.h2}>Proyectos</h2>
        <ul style={styles.list}>
          {PROJECTS.map((p, i) => (
            // data-lag: cada proyecto se "arrastra" un poco al scrollear (efecto de ScrollSmoother).
            // Si no te gusta, borrá el atributo.
            <li key={p.title} data-lag={0.15 + i * 0.12} style={styles.item}>
              <h3 style={styles.h3}>{p.title}</h3>
              <p style={styles.p}>{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
 
      {/* pantalla del display: x 2235-3320, y 308-1082 */}
      <div
        style={{
          ...styles.box,
          left: "58.23%",
          top: "15.37%",
          width: "28.27%",
          height: "38.62%",
          padding: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        {/* acá va una captura o video del proyecto seleccionado */}
        <span style={{ ...styles.p, opacity: 0.45 }}>Vista previa</span>
      </div>
 
      {/* botón "see more" dibujado en la imagen: x 2540-3005, y 1538-1713 */}
      <a
        href="#contacto"
        className="pcb-btn"
        aria-label="Ver más proyectos"
        style={styles.button}
      />
    </>
  );
}
 
// ---- máscaras --------------------------------------------------------------
 
// Luz nítida: núcleo 100% opaco para que se vean los colores reales de la
// imagen prendida, y borde suave solo al final.
const MASK_LIT = [
  "radial-gradient(circle var(--r, 0px) at var(--x, -9999px) var(--y, -9999px), #000 0%, #000 52%, rgba(0,0,0,.55) 78%, transparent 100%)",
  "linear-gradient(to bottom, transparent calc(var(--wave, -9999px) - var(--trail, 600px)), rgba(0,0,0,calc(var(--ws, 0) * .35)) calc(var(--wave, -9999px) - 90px), rgba(0,0,0,var(--ws, 0)) calc(var(--wave, -9999px) - 14px), rgba(0,0,0,var(--ws, 0)) calc(var(--wave, -9999px) + 10px), transparent calc(var(--wave, -9999px) + 70px))",
].join(", ");
 
// Resplandor: más ancho y más suave, concentrado en la cabeza de la franja
// y en el centro del halo.
const MASK_BLOOM = [
  "radial-gradient(circle var(--r2, 0px) at var(--x, -9999px) var(--y, -9999px), rgba(0,0,0,calc(var(--bsc, 0) * .85)) 0%, rgba(0,0,0,calc(var(--bsc, 0) * .4)) 45%, transparent 100%)",
  "linear-gradient(to bottom, transparent calc(var(--wave, -9999px) - 130px), rgba(0,0,0,calc(var(--bs, 0) * .5)) calc(var(--wave, -9999px) - 30px), rgba(0,0,0,calc(var(--bs, 0) * .9)) var(--wave, -9999px), transparent calc(var(--wave, -9999px) + 140px))",
].join(", ");
 
const CSS = `
  .pcb-btn { cursor: pointer; border-radius: 999px; transition: background .2s, box-shadow .2s; }
  .pcb-btn:hover { background: rgba(62, 224, 240, .12); box-shadow: 0 0 24px rgba(62, 224, 240, .45); }
  .pcb-btn:focus-visible { outline: 2px solid #3ee0f0; outline-offset: 4px; }
  /* tamaño del nombre: nameSize px sobre un lienzo de designWidth px, escalado al ancho real */
  .pcb-name { font-size: calc(100vw * var(--k)); font-size: calc(100cqw * var(--k)); }
`;
 
const styles = {
  page: { background: "#000", margin: 0 },
  section: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#000",
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    containerType: "inline-size", // permite usar cqw (ancho de la sección) en el texto
  },
  layer: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    WebkitMaskComposite: "source-over",
    maskComposite: "add",
  },
  lit: {
    WebkitMaskImage: MASK_LIT,
    maskImage: MASK_LIT,
  },
  bloom: {
    WebkitMaskImage: MASK_BLOOM,
    maskImage: MASK_BLOOM,
    mixBlendMode: "screen",
  },
  name: {
    position: "absolute",
    left: "51.4%", // centro del nombre dibujado en la imagen
    top: "47.7%",
    transform: "translate(-50%, -50%)",
    margin: 0,
    whiteSpace: "nowrap",
    lineHeight: 1,
    textAlign: "center",
    // cambiá estos para que coincida con tu diseño
    color: "#9fc4cb",
    fontFamily: "Rajdhani, system-ui, sans-serif",
    fontWeight: 300,
  },
  box: {
    position: "absolute",
    boxSizing: "border-box",
    padding: "clamp(16px, 2.4vw, 44px)",
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
  item: { borderLeft: "2px solid #3ee0f0", paddingLeft: "1em" },
  h3: { margin: 0, fontSize: "clamp(14px, 1.6vw, 30px)", fontWeight: 500 },
  p: { margin: "0.3em 0 0", fontSize: "clamp(11px, 1.1vw, 20px)", lineHeight: 1.45, color: "#9fc4cb" },
  button: {
    position: "absolute",
    left: "66.18%",
    top: "76.75%",
    width: "12.11%",
    height: "8.73%",
  },
};