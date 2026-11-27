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
import pcbOff4 from "./assets/pcb-off4.png";
import pcbOn4 from "./assets/pcb-on4.png";
import SAILogo from "./assets/SAI.svg";
import HorusLogo from "./assets/HorusAI.svg";
import NindoLogo from "./assets/Nindo.svg";
import CmasmasLogo from "./assets/Cmasmas.svg";
import ArduinoLogo from "./assets/Arduino.svg";
import LogisimLogo from "./assets/Logisim.svg";
import GitHubLogo from "./assets/GitHub.svg";
import HTMLLogo from "./assets/HTML.svg";
import CSSLogo from "./assets/CSS.svg";
import FigmaLogo from "./assets/Figma.svg";
import JavaScriptLogo from "./assets/JavaScript.svg";
import TypeScriptLogo from "./assets/TypeScript.svg";
import UnityLogo from "./assets/Unity.svg";
import CSharpLogo from "./assets/CSharp.svg";
import BlenderLogo from "./assets/Blender.svg";
import PythonLogo from "./assets/Python.svg";
import PandasLogo from "./assets/Pandas.svg";
import PostgreSQLLogo from "./assets/PostgreSQL.svg";
import yo from "./assets/asciime.png";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);

/**
 * Portfolio con estética de PCB + scroll suave con GSAP.
 *
 *   npm i gsap @gsap/react
 *
 * Archivos: PcbPortfolio.jsx (este), SkillsScreen.jsx, DetailScreen.jsx y
 * SevenSegment.jsx.
 *
 * Mapa de pantallas (una "cámara" se desliza entre ellas):
 *
 *                    [ detalle Proyectos ]
 *   [ 1 y 2 ] ─────→ [ 3: secciones ] ─────→ [ detalle Habilidades ]
 *   (scroll)         [ detalle Cualidades ]   (abajo)
 *
 *  - Pantallas 1 y 2: scroll vertical suave (ScrollSmoother). La primera queda
 *    quieta mientras la franja de luz baja hasta la mitad; después la franja
 *    recorre la página al ritmo del scroll y al final termina de bajar.
 *  - "see more" (pantalla 2) → pantalla 3. La X de la pantalla 3 vuelve a la 2.
 *  - "ver más" (pantalla 3) → detalle de la sección que está prendida:
 *    Proyectos sube, Habilidades va a la derecha y Cualidades baja.
 *    La X del detalle vuelve a la pantalla 3.
 *  - Fuera de las pantallas 1 y 2 no hay franja, solo el foco del cursor.
 *
 * Capas de cada pantalla:
 *   - off:   PCB apagada (siempre visible)
 *   - on:    PCB prendida, visible solo a través de una máscara
 *   - bloom: copia más brillante y desenfocada de `on` (resplandor)
 */

// ---- contenido (placeholders: reemplazalos por los tuyos) -------------------

// Cada ítem: { title, text } y, si querés, `logo` (ruta o import de una imagen).
// Con `logo`, la pantalla de detalle muestra el logo en lugar del título.
// Ejemplo:
//   import logoHorus from "./assets/logos/horus.svg";
//   { title: "HorusAI", logo: logoHorus, text: "Descripción..." }
const PROJECTS = [
  { title: "Horus AI", logo: HorusLogo, text: "Horus AI es una aplicación de escritorio basada en inteligencia artificial que analiza las cámaras de seguridad en tiempo real. Cuando detecta una emergencia, envía inmediatamente una alerta al responsable mediante una notificación o un mensaje al celular, permitiendo una respuesta mucho más rápida." },
  { title: "Nindo", logo: NindoLogo, text: "Nindō es un juego de acción en el que forjás el camino del ninja novato Kaito, enfrentando a los guerreros del dojo que secuestraron a su abuelo. En su lucha por rescatar a su familiar, Kaito deberá dominar el combate y su espíritu, en una travesía donde el verdadero poder nace del lazo que lo une a su meta." },
  { title: "S.A.I", logo: SAILogo, text: "Un periferico para la computadora que permite controlar distintos aspectos de esta con controladores físicos, la funcionalidad principal fue la de crear hardware que controle aspectos del sistema operativo como, volumen, brillo, dispositivo de salida de audio, etc." },
];

const placeholders = (name, n) =>
  Array.from({ length: n }, (_, i) => ({
    title: `${name} ${i + 1}`,
    text: "Descripción corta.",
  }));

const SKILLS = [
  { title: "C++", logo: CmasmasLogo, text: "Programación de alto rendimiento ideal para motores gráficos, sistemas embebidos y optimización de recursos." },
  { title: "Assembler", text: "Programación a bajo nivel con control directo sobre el hardware, registros y arquitectura del procesador." },
  { title: "Arduino", logo: ArduinoLogo, text: "Prototipado electrónico y programación de microcontroladores para interactuar con sensores y actuadores físicos." },
  { title: "Logisim", logo: LogisimLogo, text: "Diseño y simulación de circuitos lógicos digitales y arquitectura de computadoras." },
  { title: "GitHub", logo: GitHubLogo, text: "Gestión de repositorios, control de versiones con Git y trabajo colaborativo en proyectos de software." },
  { title: "HTML", logo: HTMLLogo, text: "Estructura y maquetación semántica de páginas y aplicaciones web." },
  { title: "CSS", logo: CSSLogo, text: "Diseño visual, estilos, animaciones y adaptación responsive para distintos dispositivos." },
  { title: "Figma", logo: FigmaLogo, text: "Diseño de interfaces de usuario (UI), prototipado interactivo y sistemas de diseño colaborativos antes de pasar a código." },
  { title: "JavaScript", logo: JavaScriptLogo, text: "Programación de interactividad, lógica del lado del cliente y dinamismo en la web." },
  { title: "TypeScript", logo: TypeScriptLogo, text: "Desarrollo web escalable y seguro mediante tipado estático sobre JavaScript." },
  { title: "Unity", logo: UnityLogo, text: "Motor de desarrollo para crear videojuegos y experiencias interactivas en 2D y 3D." },
  { title: "C#", logo: CSharpLogo, text: "Lenguaje principal para programar mecánicas, físicas y lógica de juego dentro de Unity." },
  { title: "Blender", logo: BlenderLogo, text: "Modelado 3D, texturizado, animación y renderizado de assets para juegos o visualización." },
  { title: "Python", logo: PythonLogo, text: "Lenguaje versátil utilizado para automatización, scripting, desarrollo backend y análisis de datos." },
  { title: "Pandas", logo: PandasLogo, text: "Biblioteca de Python para limpieza, manipulación y análisis eficiente de grandes volúmenes de datos." },
  { title: "PostgreSQL", logo: PostgreSQLLogo, text: "Sistema de gestión de bases de datos relacionales para almacenar, consultar y estructurar información de forma robusta." },
];
const QUALITIES = [
  { title: "Creativo", text: "Capacidad para diseñar soluciones originales y abordar problemas técnicos desde distintas perspectivas." },
  { title: "Perseverante", text: "Constancia para depurar errores complejos, superar obstáculos técnicos y llevar cada proyecto hasta su finalización." },
  { title: "Sociable", text: "Facilidad para construir buenas relaciones laborales, comunicar ideas con claridad y generar un ambiente de trabajo positivo." },
  { title: "Optimista", text: "Actitud constructiva frente a los desafíos, manteniendo la motivación propia y del equipo ante imprevistos." },
  { title: "Centrado", text: "Enfoque y disciplina para priorizar tareas críticas, gestionar el tiempo y cumplir con los objetivos sin perder de vista los detalles." },
  { title: "Decidido", text: "Iniciativa para tomar decisiones técnicas fundamentadas y asumir responsabilidades en momentos clave del desarrollo." },
  { title: "Cooperativo", text: "Disposición para el trabajo en equipo, el intercambio de conocimientos y la colaboración activa en proyectos multidisciplinarios." },
];

// lo que se recorre con las flechas de cada pantalla de detalle
const DETAILS = {
  proyectos: { label: "Proyectos", items: PROJECTS },
  habilidades: { label: "Habilidades", items: SKILLS },
  cualidades: { label: "Cualidades", items: QUALITIES },
};

// los 3 textos de la pantalla 3; el display muestra `count` (cantidad de ítems)
const SECTION_ITEMS = [
  { id: "proyectos", label: "PROYECTOS", count: PROJECTS.length },
  { id: "habilidades", label: "HABILIDADES", count: SKILLS.length },
  { id: "cualidades", label: "CUALIDADES", count: QUALITIES.length },
];

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
    // pantalla a la derecha de la 2. Imágenes SIN texto ni dígitos, pero con la X dibujada.
    id: "secciones",
    label: "Secciones",
    off: pcbOff3,
    on: pcbOn3,
    panel: true,
  },
  {
    // pantalla de detalle: se usa la misma imagen para las tres secciones
    id: "detalle",
    label: "Detalle",
    off: pcbOff4,
    on: pcbOn4,
    detail: true,
  },
];

// posición de cada pantalla en la grilla (x hacia la derecha, y hacia abajo)
const LAYOUT = {
  main: [0, 0], // pantallas 1 y 2
  list: [1, 0], // pantalla 3
  proyectos: [1, -1], // arriba de la 3
  habilidades: [2, 0], // a la derecha de la 3
  cualidades: [1, 1], // abajo de la 3
};
const DETAIL_KEYS = ["proyectos", "habilidades", "cualidades"];
// a dónde lleva la X (y la tecla Escape) desde cada pantalla
const BACK = { list: "main", proyectos: "list", habilidades: "list", cualidades: "list" };

const HIDDEN = -240; // px: la cabeza de la franja queda fuera de pantalla, arriba

/** Lee la proporción real (ancho / alto) de una imagen, así el marco siempre calza. */
function useImageRatio(src, fallback) {
  const [ratio, setRatio] = useState(fallback);
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => img.naturalHeight && setRatio(img.naturalWidth / img.naturalHeight);
    img.src = src;
  }, [src]);
  return ratio;
}

/**
 * Marco de las pantallas fijas (3 y detalle), con la proporción de su imagen.
 *  - "contain": se ve la imagen completa; si la ventana es más ancha o más alta
 *    quedan franjas negras a los costados o arriba y abajo.
 *  - "cover": llena la ventana y puede recortar los bordes de la imagen.
 */
const frameStyle = (ratio, fit) =>
  fit === "cover"
    ? {
        left: "50%",
        bottom: 0,
        width: `max(100vw, calc(100vh * ${ratio}))`,
        aspectRatio: String(ratio),
        transform: "translateX(-50%)",
      }
    : {
        left: "50%",
        top: "50%",
        width: `min(100vw, calc(100vh * ${ratio}))`,
        aspectRatio: String(ratio),
        transform: "translate(-50%, -50%)",
      };

export default function PcbPortfolio({
  sections = DEFAULT_SECTIONS,
  items = SECTION_ITEMS, // los 3 textos de la pantalla 3
  details = DETAILS, // contenido de las pantallas de detalle
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
  slideDuration = 1.6, // segundos que dura cada deslizamiento entre pantallas
  panelFit = "contain", // pantallas 3 y de detalle: "contain" (se ve entera) o "cover" (llena la ventana)
  // nombre
  nameSize = 191, // tamaño del nombre en tu diseño (px)...
  designWidth = 1920, // ...sobre un lienzo de este ancho (px); se escala con la pantalla
}) {
  const flow = sections.filter((s) => !s.panel && !s.detail); // pantallas del scroll vertical
  const panelSec = sections.find((s) => s.panel); // pantalla 3
  const detailSec = sections.find((s) => s.detail); // pantalla de detalle
  const panelRatio = useImageRatio(panelSec?.off, 3716 / 2032);
  const detailRatio = useImageRatio(detailSec?.off, 3840 / 2160);

  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const sectionRefs = useRef([]);
  const layerRefs = useRef({}); // list, proyectos, habilidades, cualidades → contenedor fijo
  const frameRefs = useRef({}); // lo mismo, pero el marco 16:9 (para la luz del cursor)
  const cam = useRef({ x: 0, y: 0 }); // "cámara": en qué pantalla de la grilla estamos
  const shared = useRef({ band: { intro: 0, end: 0 }, dirty: true });
  const viewRef = useRef("main"); // main | list | proyectos | habilidades | cualidades
  const busy = useRef(false);
  const [view, setView] = useState("main");
  const [lit, setLit] = useState(false); // prende textos y displays de la pantalla 3

  // Coloca cada pantalla según la posición de la cámara.
  const applyCam = (includeMain = true) => {
    const layers = { ...layerRefs.current };
    if (includeMain) layers.main = wrapperRef.current;
    for (const [key, el] of Object.entries(layers)) {
      if (!el) continue;
      const [gx, gy] = LAYOUT[key];
      gsap.set(el, { xPercent: (gx - cam.current.x) * 100, yPercent: (gy - cam.current.y) * 100 });
    }
  };

  // ---- scroll suave, tramo inicial quieto y llegada al final ---------------
  const { contextSafe } = useGSAP(
    () => {
      applyCam(false); // las pantallas 3 y de detalle esperan fuera de la vista

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

  // Desliza la cámara hacia otra pantalla de la grilla.
  const goTo = contextSafe((to) => {
    const from = viewRef.current;
    if (busy.current || from === to || !LAYOUT[to]) return;
    busy.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const smoother = ScrollSmoother.get();
    const [tx, ty] = LAYOUT[to];

    // se muestran la pantalla de la que salimos y a la que vamos
    for (const key of [from, to]) {
      if (layerRefs.current[key]) layerRefs.current[key].style.visibility = "visible";
    }
    if (from === "main") smoother?.paused(true); // la página no scrollea fuera de las pantallas 1 y 2
    if (from === "list") setLit(false);

    gsap.to(cam.current, {
      x: tx,
      y: ty,
      duration: reduce ? 0.01 : slideDuration,
      ease: "power3.inOut",
      onUpdate: () => {
        applyCam();
        shared.current.dirty = true;
      },
      onComplete: () => {
        busy.current = false;
        viewRef.current = to;
        setView(to);
        // solo queda visible la pantalla actual
        for (const [key, el] of Object.entries(layerRefs.current)) {
          if (el) el.style.visibility = key === to ? "visible" : "hidden";
        }
        if (to === "main") smoother?.paused(false);
        if (to === "list") setLit(true); // se prenden con transición al terminar de entrar
      },
    });
  });

  // Escape = lo mismo que la X
  const goToRef = useRef(goTo);
  goToRef.current = goTo;
  useEffect(() => {
    const onKey = (e) => {
      const back = BACK[viewRef.current];
      if (e.key === "Escape" && back) goToRef.current(back);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // lo que no se ve no se puede enfocar con el teclado
  useEffect(() => {
    wrapperRef.current?.toggleAttribute("inert", view !== "main");
    for (const [key, el] of Object.entries(layerRefs.current)) {
      el?.toggleAttribute("inert", key !== view);
    }
  }, [view]);

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
      // las pantallas del scroll llevan franja; el resto solo el foco del cursor
      const targets = [
        ...secs.map((el) => ({ el, band: true })),
        ...Object.values(frameRefs.current).map((el) => ({ el, band: false })),
      ];
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
                <ProjectsScreen onSeeMore={panelSec ? () => goTo("list") : undefined} />
              )}
            </section>
          ))}
        </main>
      </div>

      {/* pantalla 3: a la derecha de la 2 */}
      {panelSec && (
        <div
          ref={(el) => (layerRefs.current.list = el)}
          aria-label={panelSec.label}
          style={styles.panel}
        >
          <div
            ref={(el) => (frameRefs.current.list = el)}
            style={{ ...styles.frame, ...frameStyle(panelRatio, panelFit), backgroundImage: `url(${panelSec.off})` }}
          >
            <PcbLayers sec={panelSec} bloom={bloom} bloomBlur={bloomBlur} />
            <SkillsScreen
              items={items}
              lit={lit}
              onSeeMore={(item) => goTo(item.id)} // el id coincide con la pantalla de detalle
              onBack={() => goTo("main")}
            />
          </div>
        </div>
      )}

      {/* pantallas de detalle: Proyectos arriba, Habilidades a la derecha, Cualidades abajo */}
      {detailSec &&
        DETAIL_KEYS.map((key) => (
          <div
            key={key}
            ref={(el) => (layerRefs.current[key] = el)}
            aria-label={details[key].label}
            style={styles.panel}
          >
            <div
              ref={(el) => (frameRefs.current[key] = el)}
              style={{ ...styles.frame, ...frameStyle(detailRatio, panelFit), backgroundImage: `url(${detailSec.off})` }}
            >
              <PcbLayers sec={detailSec} bloom={bloom} bloomBlur={bloomBlur} />
              <DetailScreen
                label={details[key].label}
                items={details[key].items}
                active={view === key}
                onBack={() => goTo("list")}
              />
            </div>
          </div>
        ))}
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
        <h3 style={styles.h2}>Hola, mi nombre es Teo Gonzalez. Siempre me interesé en el funcionamiento de las cosas y desde chico que me apasiona la tecnología y sus constantes innovaciones. Mi objetivo es algún día poder contribuir, mejorando los dispositivos electrónicos que hacen mas fácil nuestra vida. </h3>
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
        <img src={yo} alt="imagen del creador de la web" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* botón "see more" dibujado en la imagen: x 2540-3005, y 1538-1713.
          Desliza la vista hacia la pantalla 3. */}
      <button
        type="button"
        className="pcb-btn"
        aria-label="continuar"
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
  // pantallas 3 y de detalle: ocupan toda la ventana; el "marco" mantiene la proporción de su imagen
  panel: {
    position: "fixed",
    inset: 0,
    overflow: "hidden",
    background: "#000",
    visibility: "hidden", // se muestra al deslizar
  },
  frame: {
    position: "absolute", // tamaño y posición: ver frameStyle()
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
    left: "49.8%", // centro del nombre dibujado en la imagen
    top: "47%",
    transform: "translate(-50%, -50%)",
    margin: 0,
    whiteSpace: "nowrap",
    textAlign: "center",
    // cambiá estos para que coincida con tu diseño
    color: "#00E7F8",
    fontFamily: "potra",
    fontWeight: 300,
    letterSpacing: -1,
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
    fontSize: "clamp(20px, 2.3vw, 48px)",
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
