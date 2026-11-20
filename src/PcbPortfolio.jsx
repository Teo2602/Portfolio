import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useGSAP } from "@gsap/react";
import SkillsScreen from "./SkillsScreen";
import DetailScreen from "./DetailScreen";
import pcbOff1 from "./assets/pcb-off1.jpeg";
import pcbOn1 from "./assets/pcb-on1.jpeg";
import pcbOff2 from "./assets/pcb-off2.png";
import pcbOn2 from "./assets/pcb-on2.png";
import pcbOff3 from "./assets/pcb-off3.png";
import pcbOn3 from "./assets/pcb-on3.png";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);

/**
 * Portfolio con estética de PCB + scroll suave con GSAP.
 *
 *   npm i gsap @gsap/react
 *
 * Archivos: PcbPortfolio.jsx (este), SkillsScreen.jsx y SevenSegment.jsx.
 *
 * Pantallas 1 y 2: scroll vertical suave (ScrollSmoother). La primera queda
 * quieta mientras la franja de luz baja hasta la mitad; después la franja
 * recorre la página al ritmo del scroll y al final termina de bajar.
 *
 * Pantalla 3 (`panel: true`): vive a la derecha de la segunda. Se llega con el
 * botón "see more" de la pantalla 2: todo se desliza hacia la izquierda con
 * la misma suavidad. Ahí no hay franja, solo el foco de luz del cursor.
 *
 * Capas de cada pantalla:
 *   - off:   PCB apagada (siempre visible)
 *   - on:    PCB prendida, visible solo a través de una máscara
 *   - bloom: copia más brillante y desenfocada de `on` (resplandor)
 */
const PROJECTS = [
  { title: "Proyecto uno", text: "Descripción corta de qué hace y con qué tecnologías." },
  { title: "Proyecto dos", text: "Descripción corta de qué hace y con qué tecnologías." },
  { title: "Proyecto tres", text: "Descripción corta de qué hace y con qué tecnologías." },
];

// placeholders: reemplazalos por los tuyos. El display de la pantalla 3
// muestra la cantidad de ítems de cada lista.
const QUALITIES = [
  { title: "Trabajo en equipo", text: "Capacidad de colaborar con otras personas." },
  { title: "Responsabilidad", text: "Compromiso con las tareas y objetivos." },
  { title: "Creatividad", text: "Búsqueda de soluciones e ideas originales." },
  { title: "Adaptabilidad", text: "Capacidad de aprender y adaptarse." },
];

const SKILLS = [
  { title: "React", text: "Desarrollo de interfaces utilizando React." },
  { title: "JavaScript", text: "Programación y lógica." },
  { title: "Python", text: "Desarrollo de soluciones y backend." },
  { title: "Diseño", text: "Diseño de interfaces y elementos visuales." },
  { title: "Git", text: "Control de versiones y trabajo colaborativo." },
  { title: "Arduino", text: "Programación e integración de hardware." },
];


const SECTION_ITEMS = [
  { id: "proyectos", label: "PROYECTOS", count: PROJECTS.length },
  { id: "habilidades", label: "HABILIDADES", count: SKILLS.length },
  { id: "cualidades", label: "CUALIDADES", count: QUALITIES.length },
];

const DETAIL_DATA = {
  proyectos: PROJECTS,
  habilidades: SKILLS,
  cualidades: QUALITIES,
};

const DETAIL_DIRECTIONS = {
  proyectos: { x: 0, y: 100 },
  habilidades: { x: -100, y: 0 },
  cualidades: { x: 0, y: -100 },
};

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
  {
    // pantalla a la derecha de la 2. Imágenes SIN texto, dígitos ni botones.
    id: "habilidades",
    label: "Habilidades",
    off: pcbOff3,
    on: pcbOn3,
    panel: true,
  },
];

const HIDDEN = -240; // px: la cabeza de la franja queda fuera de pantalla, arriba

export default function PcbPortfolio({
  sections = DEFAULT_SECTIONS,
  items = SECTION_ITEMS, // los 3 textos de la pantalla 3
  onSeeMoreSection, // se llama con el ítem activo al tocar "ver más" en la pantalla 3
  // luz
  radius = 200, // radio del halo del cursor (px)
  waveStrength = 1, // intensidad de la franja (0 a 1)
  trail = 0.9, // largo de la estela, como fracción del alto de pantalla
  bloom = 1, // intensidad del resplandor (0 lo apaga)
  bloomBlur = 4, // desenfoque del resplandor en px (0 si va lento)
  // scroll
  smooth = 1.2, // segundos que tarda el scroll en "alcanzar" al dedo/rueda
  introScroll = 0.7, // scroll (en alturas de pantalla) con la página quieta al principio
  introDelay = 0.15, // parte inicial de ese tramo (0 a 1) sin franja
  endDuration = 1.4, // segundos que tarda la franja en terminar de bajar al final
  slideDuration = 1.6, // segundos que dura el deslizamiento a la pantalla 3
  // nombre
  nameSize = 191, // tamaño del nombre en tu diseño (px)...
  designWidth = 1920, // ...sobre un lienzo de este ancho (px); se escala con la pantalla
}) {
  const flow = sections.filter((s) => !s.panel); // pantallas del scroll vertical
  const panelSec = sections.find((s) => s.panel); // pantalla de la derecha
  const [detailSection, setDetailSection] = useState(null);
  const detailRef = useRef(null);
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const sectionRefs = useRef([]);
  const panelRef = useRef(null);
  const frameRef = useRef(null);
  const shared = useRef({ band: { intro: 0, end: 0 }, dirty: true });
  const viewRef = useRef("main"); // "main" | "skills"
  const busy = useRef(false);
  const [view, setView] = useState("main");
  const [lit, setLit] = useState(false); // prende textos y displays de la pantalla 3

  // ---- scroll suave, tramo inicial quieto, llegada al final y slide --------
  const { contextSafe } = useGSAP(
    () => {
      // la pantalla 3 espera fuera de la vista, a la derecha
      if (panelRef.current) gsap.set(panelRef.current, { xPercent: 100 });

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

  // Desliza todo hacia la pantalla 3 (o de vuelta a la 2).
  const goTo = contextSafe((to) => {
    if (busy.current || viewRef.current === to || !panelRef.current) return;
    busy.current = true;
    const toSkills = to === "skills";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const smoother = ScrollSmoother.get();
    const panel = panelRef.current;

    setLit(false); // al irse (o antes de llegar) todo apagado
    if (toSkills) {
      panel.style.visibility = "visible";
      smoother?.paused(true); // la página no scrollea mientras estás en la pantalla 3
    }

    gsap
      .timeline({
        defaults: { duration: reduce ? 0.01 : slideDuration, ease: "power3.inOut" },
        onUpdate: () => (shared.current.dirty = true),
        onComplete: () => {
          busy.current = false;
          viewRef.current = to;
          setView(to);
          if (toSkills) {
            setLit(true); // se prenden con transición al terminar de entrar
          } else {
            panel.style.visibility = "hidden";
            smoother?.paused(false);
          }
        },
      })
      .to(wrapperRef.current, { xPercent: toSkills ? -100 : 0 }, 0)
      .to(panel, { xPercent: toSkills ? 0 : 100 }, 0);
  });

  // Escape vuelve a la pantalla 2
  const goToRef = useRef(goTo);
  goToRef.current = goTo;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && viewRef.current === "skills") goToRef.current("main");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // lo que no se ve no se puede enfocar con el teclado
  useEffect(() => {
    wrapperRef.current?.toggleAttribute("inert", view === "skills");
    panelRef.current?.toggleAttribute("inert", view !== "skills");
  }, [view]);

  const openDetail = (sectionId) => {
    if (!DETAIL_DATA[sectionId]) return;
  
    setDetailSection(sectionId);
  };

  const closeDetail = () => {
    if (!detailRef.current || !detailSection) return;
  
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  
    const direction = DETAIL_DIRECTIONS[detailSection];
  
    gsap.to(detailRef.current, {
      xPercent: direction.x,
      yPercent: direction.y,
      duration: reduce ? 0.01 : 0.8,
      ease: "power3.inOut",
      onComplete: () => setDetailSection(null),
    });
  };

  // ---- luz: cursor + franja ------------------------------------------------
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { band } = shared.current;
    const mark = () => (shared.current.dirty = true);
    const c = { tx: -99999, ty: -99999, x: -99999, y: -99999, r: 0, tr: 0 };
    let prev = { top: NaN, vy: NaN, vh: NaN, vw: NaN };

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
      const vw = window.innerWidth;
      const top0 = secs[0].getBoundingClientRect().top; // cambia al scrollear (suavizado incluido)
      // posición de la cabeza de la franja, en px desde el borde superior de la pantalla
      const mid = vh * 0.5;
      const vy = reduce ? HIDDEN : HIDDEN + (mid - HIDDEN) * band.intro + (vh - mid) * band.end;

      if (
        !shared.current.dirty &&
        !cursorMoving &&
        top0 === prev.top &&
        vy === prev.vy &&
        vh === prev.vh &&
        vw === prev.vw
      ) {
        return; // nada cambió: no se toca el DOM
      }
      prev = { top: top0, vy, vh, vw };
      shared.current.dirty = cursorMoving;

      const r = Math.max(c.r, 0);
      // las pantallas del scroll llevan franja; la pantalla 3 solo el foco del cursor
      const targets = [...secs.map((el) => ({ el, band: true })), { el: frameRef.current, band: false }];
      for (const { el, band: hasBand } of targets) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) continue; // fuera de pantalla
        const st = el.style;
        st.setProperty("--x", `${c.x - rect.left}px`);
        st.setProperty("--y", `${c.y - rect.top}px`);
        st.setProperty("--r", `${r}px`);
        st.setProperty("--r2", `${r * 1.45}px`);
        st.setProperty("--wave", `${vy - rect.top}px`);
        st.setProperty("--trail", `${trail * vh}px`);
        st.setProperty("--ws", reduce || !hasBand ? "0" : String(waveStrength));
        st.setProperty("--bs", reduce || !hasBand ? "0" : String(bloom));
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

  useEffect(() => {
    if (!detailSection || !detailRef.current) return;
  
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  
    const direction = DETAIL_DIRECTIONS[detailSection];
  
    gsap.fromTo(
      detailRef.current,
      {
        xPercent: direction.x,
        yPercent: direction.y,
      },
      {
        xPercent: 0,
        yPercent: 0,
        duration: reduce ? 0.01 : 1,
        ease: "power3.inOut",
      }
    );
  }, [detailSection]);

  return (
    <>
      <div id="smooth-wrapper" ref={wrapperRef}>
        <main id="smooth-content" ref={contentRef} style={styles.page}>
          <style>{CSS}</style>

          {flow.map((sec, i) => (
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
              <PcbLayers sec={sec} bloom={bloom} bloomBlur={bloomBlur} />

              {sec.id === "inicio" && (
                // Texto real sobre el nombre dibujado en la imagen. Cambiale el
                // color y la tipografía en `styles.name` para que coincida.
                <h1 className="pcb-name" style={{ ...styles.name, "--k": nameSize / designWidth }}>
                  TEO GONZALEZ
                </h1>
              )}

              {sec.id === "proyectos" && (
                <ProjectsScreen onSeeMore={panelSec ? () => goTo("skills") : undefined} />
              )}
            </section>
          ))}
        </main>
      </div>

      {/* pantalla 3: a la derecha de la 2, fuera de la vista hasta que se desliza */}
      {panelSec && (
        <div ref={panelRef} aria-label={panelSec.label} style={styles.panel}>
          <div
            ref={frameRef}
            style={{ ...styles.frame, backgroundImage: `url(${panelSec.off})` }}
          >
            <PcbLayers sec={panelSec} bloom={bloom} bloomBlur={bloomBlur} />
            <SkillsScreen items={items} lit={lit} onSeeMore={(item) => openDetail(item.id)} />
          </div>

          {/* provisorio: volver a la pantalla 2 (también con Escape) */}
          <button type="button" className="pcb-back" onClick={() => goTo("main")}>
            ← volver
          </button>
        </div>
      )}
    </>
  );
}

/** Capas prendida y de resplandor de una pantalla. */
function PcbLayers({ sec, bloom, bloomBlur }) {
  return (
    <>
      {/* PCB prendida con sus colores originales */}
      <div aria-hidden="true" style={{ ...styles.layer, ...styles.lit, backgroundImage: `url(${sec.on})` }} />

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
    </>
  );
}

/**
 * Contenido que se apoya sobre los "chips" dibujados en la imagen de proyectos.
 * Las posiciones son % de la imagen (3838 x 2004), medidas en píxeles sobre
 * pcb-on2.png. Si cambiás el tamaño de la imagen, recalculá:
 *   left = x / ancho * 100,  top = y / alto * 100
 *   width = (x2 - x1) / ancho * 100,  height = (y2 - y1) / alto * 100
 */
function ProjectsScreen({ onSeeMore }) {
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

      {/* botón "see more" dibujado en la imagen: x 2540-3005, y 1538-1713.
          Desliza la vista hacia la pantalla 3. */}
      <button
        type="button"
        className="pcb-btn"
        aria-label="Ver más"
        onClick={onSeeMore}
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
  .pcb-btn { cursor: pointer; border: 0; padding: 0; background: transparent; border-radius: 999px; transition: background .2s, box-shadow .2s; }
  .pcb-btn:hover { background: rgba(62, 224, 240, .12); box-shadow: 0 0 24px rgba(62, 224, 240, .45); }
  .pcb-btn:focus-visible { outline: 2px solid #3ee0f0; outline-offset: 4px; }
  .pcb-back { position: absolute; left: 24px; bottom: 24px; padding: 8px 14px; border: 1px solid rgba(174, 246, 255, .35); border-radius: 999px; background: rgba(0, 0, 0, .6); color: #aef6ff; font: inherit; cursor: pointer; }
  .pcb-back:hover { background: rgba(174, 246, 255, .12); }
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
  // pantalla 3: ocupa toda la ventana; el "marco" mantiene la proporción 16:9 de la imagen
  panel: {
    position: "fixed",
    inset: 0,
    overflow: "hidden",
    background: "#000",
    visibility: "hidden", // se muestra al deslizar
  },
  frame: {
    position: "absolute",
    left: "50%",
    bottom: 0,
    width: "max(100vw, 177.7778vh)",
    aspectRatio: "16 / 9",
    transform: "translateX(-50%)",
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    containerType: "inline-size",
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
