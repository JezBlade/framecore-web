/* ===========================================================
   FrameCore · diagramas_439.js — el DIBUJO de Escaleras y Roof
   Diseño en vivo sobre la app de HOY (4.22.0+439, main b3024592).
   Seal 015cb320 · 25-oct-2026 · v58: la tabla de marcas (stairBoard) · v59: los rótulos en toda la matriz de obra
   v60 · 9-nov-2026 · N230: el D/4 del asiento manda siempre (R802.7.1), con overhang o a ras; con overhang se suman
   los 3 1/2" que quedan y las 24" (R802.7.1.1). Dos veredictos (endOk y remOk) y un chip que dice el tope que truena.
   v61 · 9-nov-2026 · con overhang, cada tope de la R802.7.1.1 se dice por su nombre: lo que queda contra 3 1/2" (restOk)
   y el overhang contra 24" (overOk). Ningún renglón ni chip afirma una comparación que no es.
   v63 · 16-nov-2026 · N266: en el globo del birdsmouth los círculos numerados se pintan al último, encima de sus rayas.
   Antes la raya de «queda» (③) se pintaba después del círculo ① y le pasaba por encima a 4/12 y 6/12 con 2x6 y 2x8.
   No cambia ninguna cuenta ni ninguna coordenada: solo el orden de pintado dentro de birdsmouthDetail.
   v64 · 27-nov-2026 · N215 al motor JS (como ya está la app desde el 6-nov): en Escaleras sale la diagonal
   rise × run. En stairs2D ya no se pinta la cota «Stringer length», y en stairBoard sale la nota «es de nariz
   a nariz». Se quedan el rise, el run, la garganta y el drop del 1er riser. Con opt.stringerLength = true
   vuelve lo de antes (nomás pa' cotejar). No cambia ninguna cuenta.

   Lo que hace este archivo:
   1. Las CUENTAS son las de la app, portadas tal cual (no se tocan):
      calcStairs (fraction_utils.dart), calculateRafter y
      calculateRafterMeasure (rafter_formula.dart), y el formato B6 de
      fracciones (inchFraction: el 1/16 impar sale como «+»).
   2. El DIBUJO sale de esas cuentas: el stringer dentado con sus cortes,
      la muesca del birdsmouth donde la pone el cálculo, la cola, el ridge.
   3. Dos paletas: PAPER (la hoja de taller clara, la recomendada) y DARK
      (el fondo oscuro de la app hoy), pa' que el Initiate escoja.

   Lo que dc porta a Dart: stairGeom, rafterGeom y las funciones de
   pintado (la geometría y el orden). Los números ya existen en la app.
   =========================================================== */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------
  // 1 · NÚMEROS — el formato de la app (B6: el 1/16 impar = «+»)
  // ---------------------------------------------------------------
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = b; b = a % b; a = t; } return a || 1; }

  /** inchFraction de fraction_utils.dart, letra por letra. */
  /*  N361 (27-nov-2026, palabra del Initiate): «si 1/16" que se escriba 0+"». Sin pulgadas enteras,
      el dieciseisavo solo va «0+"» (y en pies, «3' 0+"»), no «+"». Nada más cambia. */
  function inch(x) {
    const neg = x < 0; x = Math.abs(x);
    const tot = Math.round(x * 16), w = Math.floor(tot / 16), n = tot % 16, s = neg ? '-' : '';
    if (n === 0) return s + w + '"';
    if (n % 2 === 1) {
      const b = n - 1;
      let p;
      if (b === 0) p = '+'; else { const g = gcd(b, 16); p = (b / g) + '/' + (16 / g) + '+'; }
      return w > 0 ? s + w + (b === 0 ? '' : ' ') + p + '"' : s + (b === 0 ? '0' : '') + p + '"';   // N361: sin entero, 1/16 = «0+"»
    }
    const g = gcd(n, 16);
    return w > 0 ? s + w + ' ' + (n / g) + '/' + (16 / g) + '"' : s + (n / g) + '/' + (16 / g) + '"';
  }

  /** fmtFt: redondea primero a 1/16 y luego parte en pies (N70). */
  function ftin(x) {
    const neg = x < 0, u = Math.round(Math.abs(x) * 16);
    if (u >= 192) {
      const ft = Math.floor(u / 192), i = (u % 192) / 16;
      const is = inch(i).replace('"', '');
      return (neg ? '-' : '') + ft + "'" + (is === '0' ? '' : ' ' + is + '"');
    }
    return inch(neg ? -Math.abs(x) : Math.abs(x));
  }
  const deg = (r) => r * 180 / Math.PI;
  const f1 = (v) => v.toFixed(1);

  // ---------------------------------------------------------------
  // 2 · PALETAS — Layer 2.5 (structural_tokens.css del DS, sobre bone)
  // ---------------------------------------------------------------
  const PAPER = {
    name: 'paper',
    bg: '#F8F5F0', grid: '#ECE7DD', ink: '#1F2937', inkSoft: '#4B5563', inkMute: '#736952',
    dim: '#4B5563', dimFaint: '#B6B0A4',
    rafter: '#A98E6B', rafterLine: '#806949', rafterSoft: '#EBE1D2',
    sheathing: '#CBA047', sheathingLine: '#94712C', sheathingSoft: '#F1E4C6',
    header: '#C15E37', headerLine: '#8E3F20', headerSoft: '#F4DBCC',
    plate: '#6F5230', plateLine: '#4F3A20', plateSoft: '#E7DAC4',
    stud: '#3E6E8E', studLine: '#2B4E66', studSoft: '#DCE7EE',
    concrete: '#AEB4B9', concreteLine: '#7C848A', concreteSoft: '#E4E7E9',
    craft: '#B45309', craftSoft: '#FDF0D5',          // ámbar de oficio (info-amber)
    ok: '#15803D', warn: '#B91C1C', warnSoft: '#FDE0E0', okSoft: '#D6F0DD',
    hi: '#C8E600', hiLine: '#3A4200', hiOn: '#1F2937', rafterOn: '#1F2937',
  };
  // DARK: el lienzo que la app trae hoy (#263238); mismas familias, trazos
  // más claros pa' que el contorno pase 3:1 sobre el fondo oscuro.
  const DARK = Object.assign({}, PAPER, {
    name: 'dark',
    bg: '#263238', grid: '#2F3D44', ink: '#ECEFF1', inkSoft: '#B0BEC5', inkMute: '#90A4AE',
    dim: '#B0BEC5', dimFaint: '#546E7A',
    rafterLine: '#D7C3A3', sheathingLine: '#E9C46A', headerLine: '#F08A5D',
    plateLine: '#B08A5E', studLine: '#7FB0D0', concreteLine: '#CFD8DC',
    craft: '#FFB74D', craftSoft: 'rgba(255,183,77,.14)', warnSoft: 'rgba(239,83,80,.16)', okSoft: 'rgba(76,175,80,.16)',
    ok: '#16A34A', warn: '#DC2626', hi: '#C8E600', hiOn: '#1F2937',
  });

  // ---------------------------------------------------------------
  // 3 · SVG — utilidades
  // ---------------------------------------------------------------
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pts = (arr) => arr.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  function poly(arr, fill, stroke, sw, extra) {
    return '<polygon points="' + pts(arr) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + (sw || 1.5) + '" stroke-linejoin="round"' + (extra || '') + '/>';
  }
  function line(a, b, stroke, sw, extra) {
    return '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + stroke + '" stroke-width="' + (sw || 1) + '"' + (extra || '') + '/>';
  }
  function text(p, s, o) {
    o = o || {};
    const a = o.anchor || 'middle', size = o.size || 10.5, w = o.weight || 600, fill = o.fill || '#1F2937';
    const rot = o.rot ? ' transform="rotate(' + o.rot.toFixed(2) + ' ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')"' : '';
    const halo = o.halo ? ' paint-order="stroke" stroke="' + o.halo + '" stroke-width="3.2" stroke-linejoin="round"' : '';
    const fam = o.mono === false ? 'var(--font-body, Inter, system-ui, sans-serif)' : 'var(--font-mono, "JetBrains Mono", ui-monospace, monospace)';
    return '<text x="' + p[0].toFixed(1) + '" y="' + p[1].toFixed(1) + '" text-anchor="' + a + '" font-family=\'' + fam + '\' font-size="' + size + '" font-weight="' + w + '" fill="' + fill + '"' + halo + rot + '>' + esc(s) + '</text>';
  }
  /** Rótulo con su cajita de fondo: el trazo de la cota no lo atraviesa. */
  function label(p, s, P, o) {
    o = o || {};
    const size = o.size || 10, a = o.anchor || 'middle';
    const w = String(s).length * size * (o.mono === false ? 0.56 : 0.61) + 8, h = size + 6;
    const x0 = a === 'middle' ? -w / 2 : a === 'start' ? -3 : -w + 3;
    const tx = a === 'middle' ? 0 : a === 'start' ? 1 : -1;
    return '<g transform="translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ')' + (o.rot ? ' rotate(' + o.rot.toFixed(2) + ')' : '') + '">' +
      '<rect x="' + x0.toFixed(1) + '" y="' + (-h / 2).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h + '" rx="3" fill="' + (o.bg || P.bg) + '" fill-opacity="' + (o.bgOp != null ? o.bgOp : 1) + '"' + (o.box ? ' stroke="' + o.box + '" stroke-width="1"' : '') + '/>' +
      text([tx, size * 0.36], s, { size, weight: o.weight || 700, fill: o.fill || P.ink, anchor: a, mono: o.mono }) + '</g>';
  }
  /** v59 · la caja de un rótulo tal como la pinta label(): centro, ancho, alto, giro y anclaje → 4 esquinas. */
  function labelW(txt, size, mono) { return String(txt).length * (size || 10) * (mono === false ? 0.56 : 0.61) + 8; }
  function boxOf(c, w, h, rot, anchor) {
    const a = anchor || 'middle', x0 = a === 'middle' ? -w / 2 : a === 'start' ? -3 : -w + 3, y0 = -h / 2;
    const r = (rot || 0) * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r);
    return [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]].map((q) => [c[0] + q[0] * cs - q[1] * sn, c[1] + q[0] * sn + q[1] * cs]);
  }
  /** Eje separador entre dos polígonos convexos: la hondura del encime (0 si no se tocan). */
  function overlap(A, Bq) {
    let min = Infinity;
    for (const Q of [A, Bq]) for (let i = 0; i < Q.length; i++) {
      const p1 = Q[i], p2 = Q[(i + 1) % Q.length];
      const ax = [p2[1] - p1[1], p1[0] - p2[0]], L = Math.hypot(ax[0], ax[1]) || 1; ax[0] /= L; ax[1] /= L;
      let a1 = Infinity, b1 = -Infinity, a2 = Infinity, b2 = -Infinity;
      for (const q of A) { const d = q[0] * ax[0] + q[1] * ax[1]; if (d < a1) a1 = d; if (d > b1) b1 = d; }
      for (const q of Bq) { const d = q[0] * ax[0] + q[1] * ax[1]; if (d < a2) a2 = d; if (d > b2) b2 = d; }
      const o = Math.min(b1, b2) - Math.max(a1, a2);
      if (o <= 0) return 0;
      if (o < min) min = o;
    }
    return min;
  }
  const segBox = (a, b, half) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * half, ny = dx / L * half; return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]; };
  const inSheet = (P, W, H, m) => P.every((q) => q[0] >= (m || 1) && q[0] <= W - (m || 1) && q[1] >= (m || 1) && q[1] <= H - (m || 1));
  const clear = (P, obs, tol) => obs.every((o) => overlap(P, o) <= (tol == null ? 0.5 : tol));

  /** Marcador numerado (①, ②…) que amarra el dibujo con su leyenda. */
  function marker(p, n, col, P) {
    return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="8" fill="' + col + '" stroke="' + P.bg + '" stroke-width="1.5"/>' +
      text([p[0], p[1] + 3.6], String(n), { size: 10, weight: 800, fill: '#FFFFFF' });
  }
  let UID = 0;
  /** Cota: línea con remates y su rótulo encajado al centro. */
  function dimLine(a, b, lab, P, o) {
    o = o || {};
    const col = o.color || P.dim;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const nx = -uy * 4, ny = ux * 4;
    let s = line(a, b, col, 1);
    s += line([a[0] - nx, a[1] - ny], [a[0] + nx, a[1] + ny], col, 1.2);
    s += line([b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], col, 1.2);
    if (lab) {
      let ang = Math.atan2(dy, dx) * 180 / Math.PI;
      if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      s += label(m, lab, P, { size: o.size || 10, fill: o.textColor || P.ink, rot: o.flat ? 0 : ang });
    }
    return s;
  }
  function svgWrap(w, h, P, body, title) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w.toFixed(0) + ' ' + h.toFixed(0) + '" width="100%" role="img" aria-label="' + esc(title || '') + '" style="display:block;background:' + P.bg + '">' + body + '</svg>';
  }

  // ===============================================================
  // 4 · ESCALERAS
  // ===============================================================
  /** calcStairs tal como la 439 lo llama (framer_pro_screen.dart:417):
   *  tread 0 y llegada dropped por default → los cortes del motor son
   *  parejos; los dos AJUSTES son oficio (tarjeta «AJUSTES DEL STRINGER»). */
  function calcStairs(o) {
    const rise = o.totalRise;
    let n = Math.max(1, Math.round(rise / (o.targetRiser || 7.0)));
    let r = rise / n;
    while (r > 7.75 && n < 200) { n++; r = rise / n; }
    const t = o.treadDepth;
    const treadsCut = n - 1;                        // llegada dropped: el piso de arriba es el último escalón
    const run = treadsCut * t;
    const stringer = Math.hypot(run, rise);
    const notchPerp = r * t / Math.hypot(r, t);
    const D = o.boardDepth;
    const throat = D - notchPerp;
    const band = throat >= 5 ? 'ideal' : throat >= 3.5 ? 'aguas' : 'corta';
    const hdr = o.headerHeight != null ? o.headerHeight : 11.25;
    return {
      rise, n, r, t, treadsCut, run, stringer, D, board: o.boardLabel || 'Rim 11⅞',
      stepDiag: Math.hypot(r, t), notchPerp, throat, band,
      minOpening: (80 + hdr) * t / r, riserOk: r <= 7.75, treadOk: t >= 10,
    };
  }

  /** Geometría del stringer y de la escalera armada, en pulgadas (y pa' arriba).
   *  craft = los dos ajustes de la tarjeta (#252): tread 1⅛ y riser ¾.
   *  x = 0 en la cara del corte del 1er riser; y = 0 en el piso de abajo. */
  function stairGeom(R, opt) {
    opt = opt || {};
    const on = opt.craft !== false;
    const tt = opt.treadThk != null ? opt.treadThk : 1.125;   // grosor del tread (mide TU tread)
    const rt = opt.riserThk != null ? opt.riserThk : 0.75;    // material del riser
    const nos = opt.nosing != null ? opt.nosing : 1.125;      // nosing en cascadita
    const deck = opt.deckThk != null ? opt.deckThk : 0.875;   // decking de arriba (7/8)
    const joist = opt.joist != null ? opt.joist : 14;          // joist de 14"
    const r = R.r, t = R.t, n = R.n, m = R.treadsCut, D = R.D;
    const d = on ? tt : 0;                                     // el drop baja toda la zanca
    const cut = on ? rt : 0;                                   // el último tread del stringer
    const slope = r / t, cosA = t / Math.hypot(r, t);
    const vOff = D / cosA;                                     // canto medido a plomo
    const top = (x) => (r - d) + slope * x;                    // orilla de arriba (puntas de los dientes)
    const bot = (x) => top(x) - vOff;                          // orilla de abajo
    const xTop = (m - 1) * t + (t - cut);                      // corte a plomo contra la cabecera
    const x0 = (vOff - (r - d)) / slope;                       // donde la orilla de abajo toca el piso
    const prof = [[0, 0], [0, r - d]];
    const teeth = [];
    for (let k = 1; k <= m; k++) {
      const yk = k * r - d, xa = (k - 1) * t, xb = k === m ? xTop : k * t;
      prof.push([xb, yk]);
      teeth.push({ k, xa, xb, y: yk, rise: k === 1 ? r - d : r, run: xb - xa, inner: [xb, yk] });
      if (k < m) prof.push([xb, (k + 1) * r - d]);
    }
    prof.push([xTop, bot(xTop)]);
    prof.push([x0, 0]);
    const treads = [], risers = [];
    for (let k = 1; k <= m; k++) {
      const back = k * t - rt;                                 // contra la cara del riser de atrás (o la cabecera)
      const backX = on ? back : (k === m ? xTop : k * t);
      treads.push({ k, x0: backX - (t + nos) + (on ? 0 : rt), x1: backX, y0: k * r - (on ? tt : 0), y1: k * r + (on ? 0 : tt) });
    }
    for (let k = 1; k <= m; k++) {
      const xf = (k - 1) * t;
      risers.push({ k, x0: xf - rt, x1: xf, y0: k === 1 ? 0 : (k - 1) * r + (on ? 0 : tt), y1: k * r - (on ? tt : 0) });
    }
    const finishTop = R.rise;
    return {
      on, tt, rt, nos, d, cut, r, t, n, m, D, slope, cosA, vOff, top, bot, xTop, x0, prof, teeth, treads, risers,
      header: { x0: xTop, x1: xTop + 1.5, y0: finishTop - deck - joist, y1: finishTop - deck },
      deck: { x0: xTop - nos, x1: xTop + 40, y0: finishTop - deck, y1: finishTop },
      finishTop,
    };
  }

  /** La lista de cortes, amarrada a los números de los dientes del dibujo. */
  function stairCutList(R, G) {
    return G.teeth.map((tt) => ({
      k: tt.k,
      rise: tt.rise, run: tt.run,
      note: tt.k === 1 && G.on ? 'drop: ' + inch(R.r) + ' − ' + inch(G.tt) + ' del tread'
        : tt.k === G.m && G.on ? 'último: ' + inch(R.t) + ' − ' + inch(G.rt) + ' del riser'
          : '',
      craft: G.on && (tt.k === 1 || tt.k === G.m),
    }));
  }

  /** v58 · LA TABLA DE MARCAS. La tabla mínima que contiene la pieza: su extremo de abajo pasa por la
   *  esquina del 1er riser con el piso, y el de arriba por la esquina del último tread con el plomo.
   *  Todo en pulgadas, medido con la cinta enganchada en el extremo de abajo:
   *  - marks[k-1]: la punta del diente k, sobre la orilla de los dientes = (r − d)·sinA + (k − 1)·h;
   *  - length: el largo de la tabla = xTop·cosA + (m·r − d)·sinA;
   *  - floorCut: el corte del piso sobre la orilla lisa, desde el extremo de abajo = x0·cosA;
   *  - topCut: el plomo de arriba sobre la orilla lisa, desde el extremo de ARRIBA.
   *  u = a lo largo de la tabla, v = a lo ancho (0 en la orilla lisa, D en la de los dientes). */
  function stairBoardMarks(R, G) {
    const h = Math.hypot(G.r, G.t), sinA = G.r / h, cosA = G.t / h;
    const u = (p) => p[0] * cosA + p[1] * sinA, v = (p) => -p[0] * sinA + p[1] * cosA;
    const u0 = Math.min.apply(null, G.prof.map(u)), vTop = Math.max.apply(null, G.prof.map(v)), vBot = vTop - G.D;
    const toBoard = (p) => [u(p) - u0, v(p) - vBot];
    const length = Math.max.apply(null, G.prof.map(u)) - u0;
    const marks = G.teeth.map((tt) => (G.r - G.d) * sinA + (tt.k - 1) * h);
    const floorCut = toBoard([G.x0, 0])[0];
    const topCut = length - toBoard([G.xTop, G.bot(G.xTop)])[0];
    return { h, sinA, cosA, length, marks, floorCut, topCut, toBoard };
  }

  /** v58 · La tabla parada, como una cinta: la pieza cortada encima de la tabla, el desperdicio de las
   *  puntas en tono suave, una marca por diente con su medida corrida y su número (los de la lista de
   *  cortes), las marcas de los dos cortes de las puntas en la orilla lisa, y el largo. Una sola
   *  composición pa' todos los anchos. El renglón tocado prende su diente y su marca (marcatextos). */
  function stairBoard(R, opt) {
    opt = opt || {};
    const P = opt.palette || PAPER;
    const G = stairGeom(R, opt);
    const M = stairBoardMarks(R, G);
    const W = opt.width || 360;
    const s = Math.min(W * 0.0062, 620 / M.length);         // px por pulgada: ~27 px por diente a 342
    const padT = 58, padB = 46, xB = Math.round(W * 0.3);   // la tabla, a un tercio de la hoja
    const Lpx = M.length * s, Dpx = G.D * s;
    const H = Math.round(padT + Lpx + padB);
    const yBot = padT + Lpx;
    const X = (vv) => xB + vv * s, Y = (uu) => yBot - uu * s;
    const p = (pt) => { const b = M.toBoard(pt); return [X(b[1]), Y(b[0])]; };
    const onCol = (hex) => {                                 // dígitos: blanco u obscuro según el relleno
      const c = hex.replace('#', ''), f = (i) => { const q = parseInt(c.substr(i, 2), 16) / 255; return q <= 0.03928 ? q / 12.92 : Math.pow((q + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4) > 0.3 ? '#1F2937' : '#FFFFFF';
    };
    let b = '';
    // la tabla entera (el desperdicio queda en suave) y encima la pieza
    b += '<rect x="' + X(0).toFixed(1) + '" y="' + Y(M.length).toFixed(1) + '" width="' + Dpx.toFixed(1) + '" height="' + Lpx.toFixed(1) + '" fill="' + P.rafterSoft + '" stroke="' + P.rafterLine + '" stroke-width="0.8" stroke-dasharray="3 2"/>';
    b += poly(G.prof.map(p), P.rafter, P.rafterLine, 1.6);
    // el diente tocado
    if (opt.step) {
      const tth = G.teeth[opt.step - 1];
      if (tth) {
        const ya = tth.k === 1 ? 0 : (tth.k - 1) * G.r - G.d;
        b += poly([p([tth.xa, ya]), p([tth.xa, tth.y]), p([tth.xb, tth.y])], P.hi, P.hiLine || P.rafterLine, P.hiLine ? 2.2 : 1.4);
      }
    }
    // las marcas, en la orilla de los dientes: tick, número y medida corrida
    const xE = X(G.D), xT = xE + 10, xN = xT + 10;
    G.teeth.forEach((tth, i) => {
      const lit = opt.step === tth.k, craft = G.on && (tth.k === 1 || tth.k === G.m);
      const y = Y(M.marks[i]);
      const fill = lit ? P.hi : craft ? P.craft : P.rafterLine;
      b += line([xE, y], [xT, y], lit ? P.hiLine : fill, lit ? 2 : 1.2);
      b += '<circle cx="' + xN.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="8" fill="' + fill + '"' + (lit ? ' stroke="' + P.hiLine + '" stroke-width="1.5"' : '') + '/>' +
        text([xN, y + 3.6], String(tth.k), { size: 9, weight: 800, fill: lit ? P.hiOn : onCol(fill) });
      b += label([xN + 12, y], inch(M.marks[i]), P, { size: 9.5, anchor: 'start', fill: lit ? P.hiLine : craft ? P.craft : P.ink, weight: lit ? 800 : 700 });
    });
    // los dos cortes de las puntas, en la orilla lisa (desde su extremo)
    const xL = X(0), xK = xL - 7;
    const bracket = (uA, uB, txt, col) => {
      const yA = Y(uA), yB = Y(uB);
      b += line([xK, yA], [xK, yB], col, 1) + line([xK - 3, yA], [xK + 3, yA], col, 1.2) + line([xK - 3, yB], [xK + 3, yB], col, 1.2);
      b += label([xK - 5, (yA + yB) / 2], txt, P, { size: 9.5, anchor: 'end', fill: col });
    };
    bracket(0, M.floorCut, 'piso ' + inch(M.floorCut), P.ink);
    bracket(M.length - M.topCut, M.length, 'plomo ' + inch(M.topCut), P.ink);
    // cabecera (v59: el largo de la tabla va aquí, con su nombre, y el Stringer length de la app con el suyo) y pie
    b += text([8, 15], R.board + ' · la tabla de marcas · mide ' + ftin(M.length), { size: 10.5, weight: 800, fill: P.ink, anchor: 'start', mono: false });
    b += text([8, 30], 'un diente cada ' + inch(M.h) + ' · cinta enganchada en el extremo de abajo', { size: 9, weight: 600, fill: P.inkMute, anchor: 'start', mono: false });
    if (opt.stringerLength === true) b += text([8, 43], 'Stringer length ' + ftin(R.stringer) + ' (la app) es de nariz a nariz', { size: 9, weight: 600, fill: P.inkMute, anchor: 'start', mono: false });   // v64 · N215
    b += text([8, H - 22], 'Las marcas van en la orilla de los dientes.', { size: 9, weight: 600, fill: P.inkMute, anchor: 'start', mono: false });
    b += text([8, H - 9], 'Los cortes de las puntas, en la orilla lisa.', { size: 9, weight: 600, fill: P.inkMute, anchor: 'start', mono: false });
    return svgWrap(W, H, P, b, 'La tabla de marcas: el stringer ' + R.board);
  }

  // --- 4a · 2D: la pieza que se corta, con la escalera armada en fantasma ---
  function stairs2D(R, opt) {
    opt = opt || {};
    const P = opt.palette || PAPER;
    const G = stairGeom(R, opt);
    const W = opt.width || 360;
    const xL = -10, xR = G.xTop + 26;
    const padL = 30, padR = 10, padT = 26;
    const s = (W - padL - padR) / (xR - xL);
    // v57 (F7): la leyenda de oficio parte su renglón en « = » cuando no cabe a lo ancho de la hoja
    const legTxt = G.on ? [
      ['1er riser ' + inch(G.r - G.d), '= ' + inch(R.r) + ' − ' + inch(G.tt) + ' del tread'],
      ['último tread del stringer ' + inch(G.teeth[G.m - 1].run), '= ' + inch(R.t) + ' − ' + inch(G.rt) + ' del riser']] : [];
    const legFits = (pr) => 30 + (pr[0] + ' ' + pr[1]).length * 9.5 * 0.61 <= W - 10;
    const legendH = G.on ? 6 + legTxt.reduce((a, pr) => a + (legFits(pr) ? 19 : 38), 0) : 6;
    const X = (x) => padL + (x - xL) * s, Y = (y) => padT + (G.finishTop + 4 - y) * s;
    const p = (a) => [X(a[0]), Y(a[1])];
    // v59 · el acomodo se decide ANTES de pintar: qué cabe junto a la pieza y qué baja a la banda de cotas
    const kT = Math.max(2, G.m - 3);
    const vT = [kT * G.t, kT * G.r - G.d];
    const nl = Math.hypot(G.slope, 1);
    const footT = [vT[0] + G.slope / nl * R.throat, vT[1] - 1 / nl * R.throat];
    const fp = p(footT);
    const thTxt = 'garganta ' + inch(R.throat) + (R.band === 'ideal' ? ' · como debe ir' : R.band === 'aguas' ? ' · aguas' : ' · corta');
    const thW = labelW(thTxt, 9.5), thH = 15.5;
    const slTxt = 'Stringer length ' + ftin(R.stringer), slW = labelW(slTxt, 9.5), slH = 15.5;
    const runTxt = 'Run total ' + ftin(R.run), runW = labelW(runTxt, 9.5);
    const runA = G.on ? -G.rt : 0, runB = G.on ? G.xTop : R.run;
    const SA = p([0, 0]), SB = p([R.run, R.rise]);
    const Lpx = Math.hypot(SB[0] - SA[0], SB[1] - SA[1]);
    // v59 · la cota del stringer va ARRIBA de la línea de narices (el aire sobre los escalones), a 22 px: nunca baja al piso ni a la banda
    // la línea (0,0)→(run,rise) pasa por el fondo de los risers; las puntas de los dientes están (r − d)·cosA más arriba, y los treads sin ajustes otro tt·cosA
    const tipsIn = (G.r - G.d) * G.cosA + (G.on ? 0 : G.tt * G.cosA);
    const nIn = [-R.rise / R.stringer, R.run / R.stringer], offIn = tipsIn + 26 / s;
    const A2 = p([nIn[0] * offIn, nIn[1] * offIn]), B2 = p([R.run + nIn[0] * offIn, R.rise + nIn[1] * offIn]);
    const slAng = (() => { let a = Math.atan2(B2[1] - A2[1], B2[0] - A2[0]) * 180 / Math.PI; if (a > 90) a -= 180; if (a < -90) a += 180; return a; })();
    const slMid = [(A2[0] + B2[0]) / 2, (A2[1] + B2[1]) / 2];
    const slBox = boxOf(slMid, slW, slH, slAng, 'middle');
    const hdrBox = [p([G.header.x0, G.header.y0]), p([xR, G.header.y0]), p([xR, G.header.y1]), p([G.header.x0, G.header.y1])];
    const floorY = Y(0);
    // la garganta junto al pie: si cabe en la hoja, arriba del piso, sin tocar la cabecera ni el rótulo del stringer
    const thBeside = boxOf([fp[0] + 8, fp[1] + 11], thW, thH, 0, 'start');
    let thAtFoot = fp[0] + 8 + thW <= W - 4 && thBeside.every((q) => q[1] < floorY - 2) && clear(thBeside, [hdrBox]) && clear(thBeside, [slBox]);
    // el stringer a lo largo de su cota: si cabe en la línea y no choca con la garganta junto al pie ni con el run (la banda)
    const runBox0 = boxOf([(X(runA) + X(runB)) / 2, floorY + 14], runW, 15.5, 0, 'middle');
    let slAlong = slW + 16 <= Lpx && (!thAtFoot || clear(slBox, [thBeside])) && clear(slBox, [runBox0]) && inSheet(slBox, W, 1e9, 1) && slBox.every((q) => q[1] >= 28) && A2[1] >= 24 && B2[1] >= 24;   // debajo de la cabecera
    if (slAlong && !thAtFoot && overlap(slBox, segBox([fp[0], fp[1]], [fp[0], floorY + 60], 1.5)) > 0) slAlong = false;   // la guía lo cruzaría
    const conSL = opt.stringerLength === true;          // v64 · N215: la diagonal rise × run salió de la app
    if (!conSL) slAlong = false;
    if (!slAlong && thAtFoot === false && fp[0] + 8 + thW <= W - 4 && thBeside.every((q) => q[1] < floorY - 2) && clear(thBeside, [hdrBox])) thAtFoot = true; // sin el stringer en la línea, la garganta sí cabe junto al pie
    // la banda: renglón 1 el run; renglón 2 la garganta (con su guía); el último, el stringer en plano
    const rows = [];                                     // [qué, y]
    let yRow = floorY + 14;
    rows.push(['run', yRow]);
    let thRow = null, slRow = null, gx = fp[0];
    if (!thAtFoot) { yRow += 18; thRow = yRow; }
    if (!slAlong && conSL) { yRow += 18; slRow = yRow; }
    const below = (yRow - floorY) + 16;
    const H = padT + (G.finishTop + 4) * s + below + 26 + legendH;
    // el rótulo del run: centrado, salvo que la guía de la garganta lo cruce; entonces a la izquierda
    const runMid = [(X(runA) + X(runB)) / 2, floorY + 14];
    let runBox = boxOf(runMid, runW, 15.5, 0, 'middle'), runAnchor = 'middle', runPos = runMid, jog = null;
    if (thRow != null) {
      const cruza = (bx) => gx > bx[0][0] - 4 && gx < bx[1][0] + 4;
      const cands = [[runMid, 'middle'], [[X(runA) + 2, floorY + 14], 'start'], [[X(runB) - 2, floorY + 14], 'end']];
      let ok = false;
      for (const c of cands) { const bx = boxOf(c[0], runW, 15.5, 0, c[1]); if (!cruza(bx)) { runPos = c[0]; runAnchor = c[1]; runBox = bx; ok = true; break; } }
      if (!ok) { const gx2 = Math.min(runBox[1][0] + 8, W - 10); jog = [gx, gx2]; gx = gx2; }
    }
    let b = '';
    // piso de abajo, cabecera (el último riser) y el deck de arriba
    b += poly([p([xL, 0]), p([xR, 0]), p([xR, -1.6]), p([xL, -1.6])], P.concreteSoft, P.concreteLine, 1);
    b += poly([p([G.header.x0, G.header.y0]), p([xR, G.header.y0]), p([xR, G.header.y1]), p([G.header.x0, G.header.y1])], P.headerSoft, P.headerLine, 1.2);
    b += poly([p([G.deck.x0, G.deck.y0]), p([xR, G.deck.y0]), p([xR, G.deck.y1]), p([G.deck.x0, G.deck.y1])], P.sheathing, P.sheathingLine, 1);
    // la escalera armada, en fantasma
    if (opt.ghost !== false) {
      G.risers.forEach((q) => { b += poly([p([q.x0, q.y0]), p([q.x1, q.y0]), p([q.x1, q.y1]), p([q.x0, q.y1])], P.sheathingSoft, P.sheathingLine, 0.8, ' opacity=".9"'); });
      G.treads.forEach((q) => { b += poly([p([q.x0, q.y0]), p([q.x1, q.y0]), p([q.x1, q.y1]), p([q.x0, q.y1])], P.sheathingSoft, P.sheathingLine, 0.8, ' opacity=".9"'); });
    }
    // EL STRINGER — la pieza
    b += poly(G.prof.map(p), P.rafter, P.rafterLine, 1.8);
    if (opt.step) {
      const tth = G.teeth[opt.step - 1];
      if (tth) {
        const ya = tth.k === 1 ? 0 : (tth.k - 1) * G.r - G.d;
        b += poly([p([tth.xa, ya]), p([tth.xa, tth.y]), p([tth.xb, tth.y])], P.hi, P.hiLine || P.rafterLine, P.hiLine ? 2.2 : 1.4);
      }
    }
    // números de los dientes (los de la lista de cortes)
    const every = G.m > 12 ? 2 : 1;
    G.teeth.forEach((tth) => {
      const lit = opt.step === tth.k;
      if (!lit && every > 1 && tth.k !== 1 && tth.k !== G.m && tth.k % every !== 1) return;
      const c = p([tth.xa + tth.run * 0.36, tth.y - G.r * 0.36]);
      b += text([c[0], c[1] + 3.4], String(tth.k), { size: 9, weight: 800, fill: lit ? P.hiOn : P.rafterOn });
    });
    // garganta: del vértice de una muesca, perpendicular a la orilla de abajo
    const thCol = R.band === 'ideal' ? P.ok : R.band === 'aguas' ? P.craft : P.warn;
    b += dimLine(p(vT), fp, '', P, { color: thCol });
    // cota del rise (izquierda) y del run (en la banda, renglón 1)
    b += dimLine([padL - 16, Y(0)], [padL - 16, Y(G.finishTop)], 'Rise ' + ftin(R.rise), P, { size: 9.5 });
    b += dimLine([X(runA), floorY + 14], [X(runB), floorY + 14], '', P, {});
    b += label(runPos, runTxt, P, { size: 9.5, anchor: runAnchor });
    // cota del stringer: paralela a la pieza, 14 px por debajo; el texto en la línea si cabe, si no en la banda
    if (slAlong) {
      const e0 = tipsIn + 8 / s;
      const E1 = p([nIn[0] * e0, nIn[1] * e0]), E2 = p([R.run + nIn[0] * e0, R.rise + nIn[1] * e0]);
      b += line(E1, A2, P.dimFaint, 0.8, ' stroke-dasharray="2 2"') + line(E2, B2, P.dimFaint, 0.8, ' stroke-dasharray="2 2"');
      b += dimLine(A2, B2, slTxt, P, { size: 9.5, color: P.rafterLine });
    }
    if (slRow != null) b += label([X(xL) + 2, slRow], slTxt, P, { size: 9.5, anchor: 'start', fill: P.rafterLine });
    // la garganta: junto al pie, o en la banda con su guía punteada (v59: la guía no cruza ningún rótulo)
    if (thAtFoot) {
      b += label([fp[0] + 8, fp[1] + 11], thTxt, P, { size: 9.5, fill: thCol, anchor: 'start' });
    } else {
      const lxEnd = Math.min(Math.max(gx + 10, W - 6 - thW), W - 6 - thW);
      if (jog) b += line([jog[0], fp[1] + 2], [jog[1], fp[1] + 2], thCol, 0.9, ' stroke-dasharray="2 2"');
      const conH = lxEnd > gx + 6;
      b += line([gx, fp[1] + 2], [gx, thRow - (conH ? 0 : 10)], thCol, 0.9, ' stroke-dasharray="2 2"');
      if (conH) b += line([gx, thRow], [lxEnd - 7, thRow], thCol, 0.9, ' stroke-dasharray="2 2"');
      b += label([lxEnd, thRow], thTxt, P, { size: 9.5, fill: thCol, anchor: 'start' });
    }
    // los dos ajustes de oficio: marcador en el dibujo, leyenda abajo
    if (G.on) {
      b += marker([X(0) - 12, Y((G.r - G.d) / 2)], 1, P.craft, P);
      const tl = G.teeth[G.m - 1];
      b += marker([X((tl.xa + tl.xb) / 2), Y(tl.y) - 13], 2, P.craft, P);
      const ly = H - legendH + 12;
      b += '<rect x="6" y="' + (ly - 12) + '" width="' + (W - 12) + '" height="' + (legendH - 4) + '" rx="7" fill="' + P.craftSoft + '"/>';
      let yy = ly;
      legTxt.forEach((pr, i) => {
        b += marker([18, yy], i + 1, P.craft, P);
        (legFits(pr) ? [pr[0] + ' ' + pr[1]] : pr).forEach((tx) => { b += text([30, yy + 3.5], tx, { size: 9.5, weight: 700, fill: P.ink, anchor: 'start' }); yy += 19; });
      });
    }
    b += text([8, 15], R.board + ' · ' + R.n + ' risers de ' + inch(R.r) + ' · ' + R.treadsCut + ' treads de ' + inch(R.t), { size: 10.5, weight: 800, fill: P.ink, anchor: 'start', mono: false });
    return svgWrap(W, H, P, b, 'Escalera 2D: el stringer ' + R.board);
  }

  // --- 4b · 3D / 3D+: isométrico armado (risers de frente, stringer cercano a la vista) ---
  const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
  function isoMap(x, y, z) { return [(x - z) * C30, (x + z) * S30 + y]; }
  function shade(hex, f) {
    if (!/^#/.test(hex)) return hex;
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const k = (c) => Math.max(0, Math.min(255, Math.round(c * f)));
    return '#' + ((1 << 24) + (k(r) << 16) + (k(g) << 8) + k(b)).toString(16).slice(1);
  }
  /** Caja alineada a ejes: dibuja nomás las caras que ve el ojo (−x, +y, −z). */
  function isoBox(T, b, fill, stroke, sw) {
    const [x0, x1, y0, y1, z0, z1] = b;
    const top = [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    const front = [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]];
    const side = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]];
    return poly(front.map(T), shade(fill, 0.86), stroke, sw || 0.8) + poly(side.map(T), fill, stroke, sw || 0.8) + poly(top.map(T), shade(fill, 1.08), stroke, sw || 0.8);
  }
  function stairsIso(R, opt) {
    opt = opt || {};
    const P = opt.palette || PAPER;
    const G = stairGeom(R, opt);
    const Wd = opt.stairWidth || 36, nStr = opt.stringers || 3;
    const ann = !!opt.annotate;
    // marco de la proyección
    const box = [];
    const add = (x, y, z) => box.push(isoMap(x, y, z));
    [[-24, 0, -8], [G.deck.x1 - 10, 0, -8], [-24, 0, Wd + 8], [G.deck.x1 - 10, 0, Wd + 8], [G.deck.x1 - 10, G.finishTop, Wd + 8], [G.xTop, G.header.y0, -8], [-24, -2, -8]].forEach((q) => add(q[0], q[1], q[2]));
    const minX = Math.min(...box.map((q) => q[0])), maxX = Math.max(...box.map((q) => q[0]));
    const minY = Math.min(...box.map((q) => q[1])), maxY = Math.max(...box.map((q) => q[1]));
    const Wpx = opt.width || 360, pad = ann ? 30 : 16;
    const s = (Wpx - pad * 2) / (maxX - minX);
    // v57 (F7): en la hoja angosta la tira de recibos va en dos renglones, pa' que no se corte la cita
    const chipW = (txt) => 8 + txt.length * 0.61 * 9.5 + 8;
    const chipTxt = [(R.riserOk ? '✓ ' : '✕ ') + 'Riser ' + inch(R.r) + ' ≤ 7 3/4" · R311.7.5.1', (R.treadOk ? '✓ ' : '✕ ') + 'Tread ' + inch(R.t) + ' ≥ 10" · R311.7.5.2'];
    const chips2 = ann && 10 + chipW(chipTxt[0]) + 6 + chipW(chipTxt[1]) > Wpx - 10;
    const H = (maxY - minY) * s + pad * 2 + (ann ? (chips2 ? 58 : 34) : 0);
    const T = (q) => { const m = isoMap(q[0], q[1], q[2]); return [pad + (m[0] - minX) * s, H - pad - (m[1] - minY) * s]; };
    let b = '';
    // piso, cabecera y deck (lo de más atrás primero)
    b += poly([T([-24, 0, -8]), T([G.deck.x1 - 10, 0, -8]), T([G.deck.x1 - 10, 0, Wd + 8]), T([-24, 0, Wd + 8])], P.concreteSoft, P.concreteLine, 1);
    b += isoBox(T, [G.header.x0, G.header.x1, G.header.y0, G.header.y1, -8, Wd + 8], P.header, P.headerLine);
    b += isoBox(T, [G.deck.x0, G.deck.x1 - 10, G.deck.y0, G.deck.y1, -8, Wd + 8], P.sheathing, P.sheathingLine);
    // escalones del de arriba pa' abajo (de lejos a cerca)
    for (let k = G.m; k >= 1; k--) {
      const ri = G.risers[k - 1], tr = G.treads[k - 1];
      const hl = opt.step === k;
      b += isoBox(T, [ri.x0, ri.x1, ri.y0, ri.y1, 0, Wd], hl ? P.hi : P.sheathingSoft, hl && P.hiLine ? P.hiLine : P.sheathingLine, hl && P.hiLine ? 1.6 : 0.7);
      b += isoBox(T, [tr.x0, tr.x1, tr.y0, tr.y1, 0, Wd], hl ? P.hi : P.sheathing, hl && P.hiLine ? P.hiLine : P.sheathingLine, hl && P.hiLine ? 1.6 : 0.8);
    }
    // stringer cercano: la pieza dentada se ve entera (cara −z)
    b += poly(G.prof.map((q) => T([q[0], q[1], 0])), P.rafter, P.rafterLine, 1.6);
    // el grueso del stringer (1½) en el corte de abajo y en el de arriba
    b += poly([T([0, 0, 0]), T([0, 0, 1.5]), T([0, G.r - G.d, 1.5]), T([0, G.r - G.d, 0])], shade(P.rafter, 0.85), P.rafterLine, 1);
    if (ann) {
      // cotas en el plano del stringer cercano (z = 0)
      b += dimLine(T([-10, 0, Wd + 10]), T([-10, G.finishTop, Wd + 10]), 'Rise ' + ftin(R.rise), P, { size: 10 });
      b += dimLine(T([G.on ? -G.rt : 0, 0, -10]), T([G.on ? G.xTop : R.run, 0, -10]), 'Run ' + ftin(R.run), P, { size: 10 });
      const kT = Math.max(2, Math.round(G.m * 0.55));
      const v = [kT * G.t, kT * G.r - G.d];
      const nl = Math.hypot(G.slope, 1), foot = [v[0] + G.slope / nl * R.throat, v[1] - 1 / nl * R.throat];
      b += dimLine(T([v[0], v[1], 0]), T([foot[0], foot[1], 0]), '', P, { color: P.craft });
      const fp = T([foot[0], foot[1], 0]);
      // v59 · las cajas de las cotas ya pintadas (rise y run), pa' que nada se les encime
      const dimBox = (a, bq, txt, size) => { let ang = Math.atan2(bq[1] - a[1], bq[0] - a[0]) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180; return boxOf([(a[0] + bq[0]) / 2, (a[1] + bq[1]) / 2], labelW(txt, size), size + 6, ang, 'middle'); };
      const riseBox = dimBox(T([-10, 0, Wd + 10]), T([-10, G.finishTop, Wd + 10]), 'Rise ' + ftin(R.rise), 10);
      const runBox = dimBox(T([G.on ? -G.rt : 0, 0, -10]), T([G.on ? G.xTop : R.run, 0, -10]), 'Run ' + ftin(R.run), 10);
      const chipsTop = chips2 ? H - 38 - 11 : H - 14 - 11;
      const obs = [riseBox, runBox, [[0, chipsTop], [Wpx, chipsTop], [Wpx, H], [0, H]]];
      const pts0 = G.prof.map((q) => T([q[0], q[1], 0]));
      const stairBox = [[Math.min(...pts0.map((q) => q[0])), Math.min(...pts0.map((q) => q[1]))], [Math.max(...pts0.map((q) => q[0])), Math.min(...pts0.map((q) => q[1]))], [Math.max(...pts0.map((q) => q[0])), Math.max(...pts0.map((q) => q[1]))], [Math.min(...pts0.map((q) => q[0])), Math.max(...pts0.map((q) => q[1]))]];
      const place = (cands, w, h) => {
        for (const soft of [true, false]) for (const c of cands) { const bx = boxOf([c[0], c[1]], w, h, 0, c[2]); if (inSheet(bx, Wpx, H, 1) && clear(bx, obs, 0.2) && (!soft || clear(bx, [stairBox], 0.2))) { obs.push(bx); return c; } }
        return null;
      };
      const gTxt = 'garganta ' + inch(R.throat) + ' · oficio', gW = labelW(gTxt, 9.5);
      const gc = place([[fp[0] + 6, fp[1] + 12, 'start'], [fp[0] - 6, fp[1] + 12, 'end'], [fp[0] + 6, fp[1] - 12, 'start'], [Wpx - 6 - gW, fp[1] + 12, 'start'], [Wpx - 6 - gW, fp[1] + 30, 'start'], [Wpx - 6 - gW, chipsTop - 12, 'start'], [Wpx - 6 - gW, 32, 'start'], [Wpx - 6 - gW, 50, 'start'], [6, 14, 'start']], gW, 15.5);
      if (gc) b += label([gc[0], gc[1]], gTxt, P, { size: 9.5, fill: R.band === 'ideal' ? P.ok : P.craft, anchor: gc[2] });
      const mid = T([G.t * 4, G.r * 4 - G.d, 0]);
      const rtTxt = 'riser ' + inch(R.r) + ' · tread ' + inch(R.t), rtW = labelW(rtTxt, 9.5);
      // v57 (F7): si no tiene lugar libre, no se pinta: la tira de recibos de abajo ya dice el riser y el tread.
      const rc = place([[mid[0] - 8, mid[1] - 10, 'end']], rtW, 15.5);
      if (rc) b += label([rc[0], rc[1]], rtTxt, P, { size: 9.5, anchor: rc[2] });
      const tp = T([G.xTop, G.finishTop + 4, Wd]);
      const stTxt = nStr + ' stringers ' + R.board + ' · ' + ftin(R.stringer), stW = labelW(stTxt, 9.5);
      // v59 · si no cabe arriba del stringer de atrás (la escalera corta), va a la esquina de arriba a la derecha
      const sc = place([[tp[0] - 4, tp[1] - 8, 'end'], [Wpx - 6, 14, 'end'], [Wpx - 6, 32, 'end']], stW, 15.5);
      if (sc) b += label([sc[0], sc[1]], stTxt, P, { size: 9.5, anchor: sc[2] });
      // tira IRC: recibo, no «Aprobado»
      let yS = chips2 ? H - 38 : H - 14;
      const chips = [
        [R.riserOk, 'Riser ' + inch(R.r) + ' ≤ 7 3/4" · R311.7.5.1'],
        [R.treadOk, 'Tread ' + inch(R.t) + ' ≥ 10" · R311.7.5.2'],
      ];
      let cx = 10;
      chips.forEach((c) => {
        const wC = chipW((c[0] ? '✓ ' : '✕ ') + c[1]);
        b += '<rect x="' + cx + '" y="' + (yS - 13) + '" width="' + wC.toFixed(0) + '" height="19" rx="5" fill="' + (c[0] ? P.okSoft : P.warnSoft) + '" stroke="' + (c[0] ? P.ok : P.warn) + '" stroke-width="1"/>';
        b += text([cx + 8, yS + 1], (c[0] ? '✓ ' : '✕ ') + c[1], { size: 9.5, weight: 700, fill: P.ink, anchor: 'start' });
        if (chips2) { cx = 10; yS += 24; } else cx += wC + 6;
      });
    }
    return svgWrap(Wpx, H, P, b, 'Escalera ' + (ann ? '3D+' : '3D'));
  }

  // ===============================================================
  // 5 · ROOF
  // ===============================================================
  const RAFTER_DEPTHS = { '2x6': 5.5, '2x8': 7.25, '2x10': 9.25, '2x12': 11.25 };
  /** calculateRafter + calculateRafterMeasure + el veredicto del notch (rafter_formula.dart). */
  function calcRafter(o) {
    const type = o.type || 'common';
    const pitch = o.pitch, size = o.size, D = RAFTER_DEPTHS[size];
    const seat = o.seat != null ? o.seat : 3.5;
    const over = o.overhang || 0;
    const runIn = o.runFt * 12;
    const eff = (type === 'hip' || type === 'valley') ? 12 * Math.SQRT2 : 12;
    const unitLen = Math.hypot(pitch, eff);
    const plumb = Math.atan(pitch / eff);
    const res = {
      type, pitch, size, D, seat, over, runIn, unitLen,
      plumbDeg: deg(plumb), seatDeg: 90 - deg(plumb),
      cheekDeg: type === 'common' ? null : deg(Math.atan(Math.cos(plumb))),
      birdsmouth: seat * Math.sin(plumb),                        // la muesca, perpendicular al canto
      hapFraming: D / Math.cos(plumb) - seat * Math.tan(plumb),
    };
    if (type === 'common' || type === 'jack') {
      const th = Math.atan2(pitch, 12), unit = Math.hypot(12, pitch) / 12;
      const halfRidge = (o.ridge != null ? o.ridge : 1.5) / 2;
      const plumbDepth = D / Math.cos(th), bmPlumb = seat * pitch / 12;
      const hap = plumbDepth - bmPlumb;
      const longPoint = (runIn - halfRidge + over) * unit;
      const notch = seat * Math.sin(th), remaining = D - notch;
      Object.assign(res, {
        th, unit, halfRidge, ridgeDeduct: halfRidge * unit, plumbDepth, bmPlumb, hap,
        longPoint, shortPoint: longPoint - seat * unit,
        toWall: (runIn - halfRidge) * unit, tail: over * unit,
        notch, remaining,
        flush: over <= 0,
        rule: over <= 0 ? 'R802.7.1' : 'R802.7.1.1',
        endMax: D / 4,
        // v60 · N230: dos veredictos. El D/4 del asiento manda siempre (R802.7.1); con overhang se suman lo que queda y las 24" (R802.7.1.1)
        endOk: notch <= D / 4 + 1e-9,
        remOk: remaining >= 3.5 - 1e-9 && over <= 24,
        // v61: los dos topes de la R802.7.1.1 por separado, pa' que el dibujo diga cuál truena (remOk = restOk && overOk)
        restOk: remaining >= 3.5 - 1e-9,
        overOk: over <= 24,
        ok: notch <= D / 4 + 1e-9 && (over <= 0 || (remaining >= 3.5 - 1e-9 && over <= 24)),
        advicePct: notch / D,
        commonDiff: (o.oc || 16) * unit,
      });
    }
    return res;
  }

  /** Rafter común: x = 0 al centro del ridge, y = 0 arriba de la placa.
   *  Con overhang: la cola sigue la orilla de abajo hasta el corte a plomo.
   *  A ras: el corte va a plomo en la línea de la pared, de la orilla de arriba al asiento. */
  function rafterGeom(M) {
    const m = M.pitch / 12;
    const xi = M.runIn - M.seat, xh = M.runIn;           // cara de adentro y línea de la pared (heel)
    const yb = (x) => -(x - xi) * m;                     // orilla de abajo
    const yt = (x) => yb(x) + M.plumbDepth;              // orilla de arriba
    const xr = M.halfRidge, xe = M.runIn + M.over;       // corte del ridge y corte de la cola
    const prof = M.over > 0
      ? [[xr, yt(xr)], [xe, yt(xe)], [xe, yb(xe)], [xh, yb(xh)], [xh, 0], [xi, 0], [xr, yb(xr)]]
      : [[xr, yt(xr)], [xh, yt(xh)], [xh, 0], [xi, 0], [xr, yb(xr)]];
    const notchTri = [[xi, 0], [xh, 0], [xh, yb(xh)]];   // lo que se quita
    return { m, xi, xh, yb, yt, xr, xe, prof, notchTri };
  }

  function roof2D(M, opt) {
    opt = opt || {};
    const P = opt.palette || PAPER;
    const g = rafterGeom(M);
    const W = opt.width || 360;
    const col = M.ok ? P.ok : P.warn, colSoft = M.ok ? P.okSoft : P.warnSoft;
    const x0 = -8, x1 = g.xe + 8;
    const yMax = g.yt(g.xr) + 10, yMin = Math.min(g.yb(g.xh), g.yb(g.xe)) - 16;
    const padL = 10, padR = 10, padT = 26;
    const s = (W - padL - padR) / (x1 - x0);
    const Hmain = padT + (yMax - yMin) * s + 8;
    const X = (x) => padL + (x - x0) * s, Y = (y) => padT + (yMax - y) * s;
    const p = (q) => [X(q[0]), Y(q[1])];
    let b = '';
    // muro: doble placa y studs (cortados)
    b += poly([p([g.xi, -3]), p([g.xh, -3]), p([g.xh, yMin + 4]), p([g.xi, yMin + 4])], P.stud, P.studLine, 1);
    b += poly([p([g.xi, -3]), p([g.xh, -3]), p([g.xh, 0]), p([g.xi, 0])], P.plate, P.plateLine, 1);
    // ridge (una medida más grande que el rafter)
    const rTop = g.yt(g.xr) + 0.8, rDepth = M.D + 2;
    b += poly([p([-0.75, rTop]), p([0.75, rTop]), p([0.75, rTop - rDepth]), p([-0.75, rTop - rDepth])], P.header, P.headerLine, 1.2);
    // EL RAFTER — la pieza, y la muesca que se le quita (rayada)
    b += poly(g.prof.map(p), P.rafter, P.rafterLine, 1.8);
    b += poly(g.notchTri.map(p), colSoft, col, 1.2, ' stroke-dasharray="3 2"');
    // cotas sobre la orilla de arriba (normal hacia afuera del techo)
    const a = Math.atan(g.m), nU = [Math.sin(a), -Math.cos(a)];
    const sh = (q, k) => [q[0] + nU[0] * k, q[1] + nU[1] * k];
    const A = p([g.xr, g.yt(g.xr)]), Bw = p([g.xh, g.yt(g.xh)]), E = p([g.xe, g.yt(g.xe)]);
    const narrow = W < 420, fs = narrow ? 9 : 9.5;
    const nm = p([(g.xi + g.xh) / 2, -1.5]);
    b += line([nm[0], nm[1] + 11], [nm[0], Hmain + 4], col, 1, ' stroke-dasharray="2 3"');
    b += dimLine(sh(A, 12), sh(Bw, 12), (narrow ? 'Ridge → pared ' : 'Del ridge a la pared ') + ftin(M.toWall), P, { size: fs });
    if (M.over > 0) {
      b += dimLine(sh(Bw, 12), sh(E, 12), '', P, {});
      b += dimLine(sh(A, 28), sh(E, 28), (narrow ? 'Con cola ' : 'Con la cola ') + ftin(M.longPoint), P, { size: fs, color: P.rafterLine });
      const tp = p([g.xe, g.yb(g.xe)]);
      b += label([tp[0] - 4, tp[1] + 13], 'cola ' + ftin(M.tail), P, { size: 9, anchor: 'end', fill: P.inkSoft });
    }
    // pitch y ángulos, pegaditos a la orilla de abajo
    const xq = g.xr + (g.xh - g.xr) * 0.5;
    const pc = p([xq, g.yb(xq)]);
    if (!narrow) b += label([pc[0] - nU[0] * 14, pc[1] - nU[1] * 14], M.pitch + '/12 · plumb ' + f1(M.plumbDeg) + '° · seat ' + f1(M.seatDeg) + '°', P, { size: 9, fill: P.inkSoft, rot: deg(a) });
    const xq2 = g.xr + (g.xh - g.xr) * (narrow ? 0.3 : 0.13);
    const rp = p([xq2, g.yb(xq2)]);
    const rdTxt = 'ridge 1 1/2" · ya descontado', psTxt = M.pitch + '/12 · plumb ' + f1(M.plumbDeg) + '° · seat ' + f1(M.seatDeg) + '°';
    // v59 · si los dos rótulos de la orilla de abajo no caben uno junto al otro, el del ridge baja un renglón (16 px más afuera)
    const spanPx = Math.hypot(Bw[0] - A[0], Bw[1] - A[1]);
    // v62 · el rótulo del ridge no se sale de la hoja: si su caja pasa de la orilla izquierda, se recorre sobre la orilla de abajo, hacia la pared
    const rdW = labelW(rdTxt, 9), rdH = 15, rdUx = Math.cos(a), rdUy = Math.sin(a);
    const rdAt = (off, sl) => [rp[0] - nU[0] * off + rdUx * sl, rp[1] - nU[1] * off + rdUy * sl];
    const rdSlide = (off) => { const c = rdAt(off, 0), left = c[0] - (rdW / 2) * rdUx - (rdH / 2) * rdUy; return left < 2 ? (2 - left) / rdUx : 0; };
    let rdOff = 14, rdSl = rdSlide(14);
    if (!narrow && (rdW + labelW(psTxt, 9)) / 2 + 8 > 0.37 * spanPx - rdSl) { rdOff = 30; rdSl = rdSlide(30); }
    b += label(rdAt(rdOff, rdSl), rdTxt, P, { size: 9, fill: P.inkSoft, rot: deg(a) });
    // marcador de la muesca, y el detalle a escala abajo
    b += '<circle cx="' + nm[0].toFixed(1) + '" cy="' + nm[1].toFixed(1) + '" r="11" fill="none" stroke="' + col + '" stroke-width="1.6"/>';
    b += text([padL, 15], M.size + ' @ ' + (opt.oc || 16) + '" · run ' + ftin(M.runIn) + (M.over > 0 ? ' · overhang ' + inch(M.over) : ' · a ras') + ' · asiento ' + inch(M.seat), { size: 10.5, weight: 800, fill: P.ink, anchor: 'start', mono: false });
    const det = birdsmouthDetail(M, P, W - 16);
    b += '<g transform="translate(8,' + (Hmain + 4).toFixed(1) + ')">' + det.body + '</g>';
    return svgWrap(W, Hmain + det.h + 14, P, b, 'Rafter 2D');
  }

  /** El birdsmouth a escala: a la izquierda el dibujo, a la derecha la leyenda numerada. */
  function birdsmouthDetail(M, P, Wd) {
    const g = rafterGeom(M);
    const col = M.ok ? P.ok : P.warn, colSoft = M.ok ? P.okSoft : P.warnSoft;
    const wx0 = g.xi - 4.5, wx1 = g.xh + (M.over > 0 ? 4 : 2.5);
    const yTop = g.yt(wx0) + 1.2, yBot = Math.min(g.yb(g.xh), -3) - 3.2;
    const drawW = Math.min(Wd * 0.5, 190);
    const s = drawW / (wx1 - wx0);
    const h = (yTop - yBot) * s;
    const ox = 10, oy = 10;
    const X = (x) => ox + (x - wx0) * s, Y = (y) => oy + (yTop - y) * s;
    const p = (q) => [X(q[0]), Y(q[1])];
    const id = 'bm' + (++UID);
    let b = '<rect x="0" y="0" width="' + Wd.toFixed(1) + '" height="' + (h + 20).toFixed(1) + '" rx="10" fill="' + P.bg + '" stroke="' + col + '" stroke-width="1.2"/>';
    b += '<clipPath id="' + id + '"><rect x="' + ox + '" y="' + oy + '" width="' + (drawW).toFixed(1) + '" height="' + h.toFixed(1) + '"/></clipPath><g clip-path="url(#' + id + ')">';
    b += poly([p([g.xi, -3]), p([g.xh, -3]), p([g.xh, yBot - 2]), p([g.xi, yBot - 2])], P.stud, P.studLine, 1);
    b += poly([p([g.xi, -1.5]), p([g.xh, -1.5]), p([g.xh, 0]), p([g.xi, 0])], P.plate, P.plateLine, 1);
    b += poly([p([g.xi, -3]), p([g.xh, -3]), p([g.xh, -1.5]), p([g.xi, -1.5])], P.plate, P.plateLine, 1);
    b += poly(g.prof.map(p), P.rafter, P.rafterLine, 2);
    b += poly(g.notchTri.map(p), colSoft, col, 1.4, ' stroke-dasharray="4 3"');
    b += '</g>';
    // ① HAP a plomo, en la línea de la pared (se marca)
    const xH = g.xh + 0.55;
    b += dimLine(p([xH, 0]), p([xH, g.yt(g.xh)]), '', P, { color: P.ink });
    const m1 = [X(xH) + 11, Y(g.yt(g.xh) * 0.8)];
    // ② la muesca y ③ lo que queda, PERPENDICULAR al canto (lo que juzga el código)
    // v60 · N230: cada marca con su veredicto: ② la muesca contra el D/4, ③ lo que queda contra los 3 1/2" (v61: las 24" van en su renglón)
    const colEnd = M.endOk ? P.ok : P.warn, colRem = M.restOk ? P.ok : P.warn;
    const a = Math.atan(g.m), up = [Math.sin(a), Math.cos(a)];
    const v = [g.xh, 0];
    const onBot = [v[0] - up[0] * M.notch, v[1] - up[1] * M.notch];
    const onTop = [v[0] + up[0] * M.remaining, v[1] + up[1] * M.remaining];
    b += dimLine(p(onBot), p(v), '', P, { color: colEnd });
    const m4 = [X((g.xi + g.xh) / 2), Y(-0.75)];
    const m2 = [X(onBot[0]) - 12, Y(onBot[1]) + 2];
    if (Math.hypot(m2[0] - m4[0], m2[1] - m4[1]) < 18) m2[1] = m4[1] - 18;   // v59: la muesca chica junta los dos marcadores
    let m3 = null;
    if (!M.flush) {
      b += dimLine(p(v), p(onTop), '', P, { color: colRem });
      const mt = [(v[0] + onTop[0]) / 2, (v[1] + onTop[1]) / 2];
      m3 = [X(mt[0]) - 13, Y(mt[1]) - 4];
    }
    // v63 · N266: los círculos numerados al último, en su orden (①, ②, ③ y el del asiento), pa' que ninguna raya les pase por encima
    b += marker(m1, 1, P.ink, P);
    b += marker(m2, 2, colEnd, P);
    if (m3) b += marker(m3, 3, colRem, P);
    b += marker(m4, M.flush ? 3 : 4, P.plateLine, P);
    // la leyenda
    const lx = ox + drawW + 16, rows = [
      [1, P.ink, 'HAP ' + inch(M.hap), 'a plomo · se marca'],
      [2, colEnd, 'muesca ' + inch(M.notch), 'perpendicular al canto'],
    ];
    // v60 · N230: el renglón del D/4 sale siempre; con overhang va antes de lo que queda, y cada uno se pinta con su veredicto
    rows.push([0, colEnd, (M.endOk ? '≤ ' : '> ') + 'D/4 = ' + inch(M.endMax), M.flush ? 'a ras · R802.7.1' : 'R802.7.1']);
    if (!M.flush) rows.push([3, colRem, 'queda ' + inch(M.remaining), (M.restOk ? '≥ ' : '< ') + '3 1/2" · R802.7.1.1']);
    // v61: las 24" del overhang se nombran nomás cuando truenan
    if (!M.flush && !M.overOk) rows.push([0, P.warn, 'overhang ' + inch(M.over), '> 24" · R802.7.1.1']);
    rows.push([M.flush ? 3 : 4, P.plateLine, 'asiento ' + inch(M.seat), M.seat > 4 ? 'plato de 2x6' : 'plato de 2x4']);
    let ly = oy + 12;
    rows.forEach((r) => {
      if (r[0]) b += marker([lx + 8, ly], r[0], r[1], P);
      b += text([lx + 22, ly + 3.6], r[2], { size: 10.5, weight: 800, fill: r[0] === 0 ? r[1] : P.ink, anchor: 'start' });
      b += text([lx + 22, ly + 16], r[3], { size: 8.8, weight: 600, fill: P.inkSoft, anchor: 'start', mono: false });
      ly += 34;
    });
    return { body: b, h: Math.max(h + 20, ly - 6) };
  }

  /** Birdsmouth en 3D: dos rafters a su OC sentados en la doble placa, vistos desde afuera
   *  (proyección espejo: la cola y la cara del muro miran al ojo). */
  function isoBoxM(T, bx, fill, stroke, sw) {
    const [x0, x1, y0, y1, z0, z1] = bx;
    const top = [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    const front = [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]];
    const side = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]];
    return poly(front.map(T), shade(fill, 0.84), stroke, sw || 0.8) + poly(side.map(T), fill, stroke, sw || 0.8) + poly(top.map(T), shade(fill, 1.08), stroke, sw || 0.8);
  }
  function roof3D(M, opt) {
    opt = opt || {};
    const P = opt.palette || PAPER;
    const g = rafterGeom(M);
    const col = M.ok ? P.ok : P.warn, colSoft = M.ok ? P.okSoft : P.warnSoft;
    const oc = opt.oc || 16;
    const xa = g.xh - 20, xEnd = M.over > 0 ? g.xe : g.xh;
    const proj = (x, y, z) => isoMap(-x, y, z);
    const corners = [];
    [[xa, g.yt(xa), -6], [xa, g.yt(xa), oc + 8], [xEnd + 6, -16, -6], [xEnd + 6, -16, oc + 8], [xa, -16, -6], [xEnd, g.yt(xEnd), oc + 8]].forEach((q) => corners.push(proj(q[0], q[1], q[2])));
    const minX = Math.min(...corners.map((q) => q[0])), maxX = Math.max(...corners.map((q) => q[0]));
    const minY = Math.min(...corners.map((q) => q[1])), maxY = Math.max(...corners.map((q) => q[1]));
    const Wpx = opt.width || 360, pad = 18, chipH = 30;
    const s = (Wpx - pad * 2) / (maxX - minX);
    const H = (maxY - minY) * s + pad * 2 + chipH;
    const T = (q) => { const m = proj(q[0], q[1], q[2]); return [pad + (m[0] - minX) * s, H - chipH - pad - (m[1] - minY) * s]; };
    let b = '';
    // muro: studs, doble placa (de atrás pa' delante)
    [oc, 0].forEach((z) => { b += isoBoxM(T, [g.xi, g.xh, -16, -3, z - 0.75, z + 0.75], P.stud, P.studLine); });
    b += isoBoxM(T, [g.xi, g.xh, -3, -1.5, -6, oc + 8], P.plate, P.plateLine);
    b += isoBoxM(T, [g.xi, g.xh, -1.5, 0, -6, oc + 8], P.plate, P.plateLine);
    // rafters (el de atrás primero)
    [oc, 0].forEach((z0) => {
      const z1 = z0 + 1.5;
      const prof = g.prof.filter((q) => q[0] > xa + 0.01);
      const pr = [[xa, g.yt(xa)]].concat(prof).concat([[xa, g.yb(xa)]]);
      // corte de atrás (donde se corta la vista)
      b += poly([T([xa, g.yb(xa), z0]), T([xa, g.yt(xa), z0]), T([xa, g.yt(xa), z1]), T([xa, g.yb(xa), z1])], shade(P.rafter, 0.75), P.rafterLine, 0.8);
      // orilla de arriba
      b += poly([T([xa, g.yt(xa), z0]), T([xEnd, g.yt(xEnd), z0]), T([xEnd, g.yt(xEnd), z1]), T([xa, g.yt(xa), z1])], shade(P.rafter, 1.1), P.rafterLine, 0.9);
      // corte de la cola (o el corte a ras), que mira al ojo
      const yLow = M.over > 0 ? g.yb(xEnd) : 0;
      b += poly([T([xEnd, yLow, z0]), T([xEnd, g.yt(xEnd), z0]), T([xEnd, g.yt(xEnd), z1]), T([xEnd, yLow, z1])], shade(P.rafter, 0.88), P.rafterLine, 0.9);
      if (M.over > 0) b += poly([T([g.xh, g.yb(g.xh), z0]), T([g.xh, 0, z0]), T([g.xh, 0, z1]), T([g.xh, g.yb(g.xh), z1])], shade(P.rafter, 0.88), P.rafterLine, 0.9);
      // el costado con la muesca
      b += poly(pr.map((q) => T([q[0], q[1], z0])), P.rafter, P.rafterLine, 1.4);
      b += poly(g.notchTri.map((q) => T([q[0], q[1], z0])), colSoft, col, 1.1, ' stroke-dasharray="3 2"');
    });
    // v59 · cada rótulo busca su lugar libre, sin salirse de la hoja ni encimarse con los otros ni con el recibo
    const chipTop = H - 16 - 11;
    const obs3 = [[[0, chipTop], [Wpx, chipTop], [Wpx, H], [0, H]]];
    const place3 = (cands, w, h) => { for (const c of cands) { const bx = boxOf([c[0], c[1]], w, h, 0, c[2]); if (inSheet(bx, Wpx, H, 1) && clear(bx, obs3)) { obs3.push(bx); return c; } } return null; };
    const hp = T([g.xh, g.yt(g.xh), 0]);
    const hapTxt = 'HAP ' + inch(M.hap) + ' a plomo', hapW = labelW(hapTxt, 9.5);
    const hc = place3([[hp[0] + 6, hp[1] - 10, 'start'], [Math.min(hp[0] + 6, Wpx - 6 - hapW), hp[1] - 10, 'start'], [hp[0] - 6, hp[1] - 10, 'end'], [Wpx - 6 - hapW, hp[1] - 28, 'start']], hapW, 15.5);
    if (hc) b += label([hc[0], hc[1]], hapTxt, P, { size: 9.5, anchor: hc[2] });
    const np = T([(g.xi + g.xh) / 2, -1.5, 0]);
    const nTxt = 'muesca ' + inch(M.notch) + ' ⊥ · asiento ' + inch(M.seat), nW = labelW(nTxt, 9.5);
    const nc = place3([[np[0] + 10, np[1] + 16, 'start'], [Math.min(np[0] + 10, Wpx - 6 - nW), np[1] + 16, 'start'], [Math.min(np[0] + 10, Wpx - 6 - nW), np[1] + 34, 'start'], [np[0] - 10, np[1] + 16, 'end'], [6, chipTop - 12, 'start']], nW, 15.5);
    if (nc) b += label([nc[0], nc[1]], nTxt, P, { size: 9.5, anchor: nc[2], fill: col });
    const op = T([g.xh, 0.5, oc / 2 + 0.75]);
    const ocTxt = oc + '" OC', ocW = labelW(ocTxt, 9);
    const occ = place3([[op[0] + 8, op[1] - 6, 'start'], [op[0] - 8, op[1] - 6, 'end'], [op[0] + 8, op[1] + 12, 'start'], [op[0] + 8, op[1] - 24, 'start'], [Math.min(op[0] + 8, Wpx - 6 - ocW), op[1] + 30, 'start']], ocW, 15);
    if (occ) b += label([occ[0], occ[1]], ocTxt, P, { size: 9, anchor: occ[2], fill: P.inkSoft });
    // v60 · N230: el chip dice el tope que truena. Primero el D/4 del asiento (con overhang o a ras); si ése pasa, con overhang, lo que queda;
    // v61: y si lo que queda pasa, las 24" del overhang
    const chip = !M.endOk
      ? '✕ AGUAS: muesca ' + inch(M.notch) + ' > D/4 ' + inch(M.endMax) + ' · R802.7.1'
      : M.flush
        ? '✓ muesca ≤ D/4 · R802.7.1'
        : !M.restOk
          ? '✕ queda ' + inch(M.remaining) + ' < 3 1/2" ⊥ · R802.7.1.1'
          : !M.overOk
            ? '✕ AGUAS: overhang ' + inch(M.over) + ' > 24" · R802.7.1.1'
            : '✓ queda ' + inch(M.remaining) + ' ≥ 3 1/2" ⊥ · R802.7.1.1';
    b += label([10, H - 16], chip, P, { size: 9.5, anchor: 'start', bg: colSoft, bgOp: 1, box: col });
    return svgWrap(Wpx, H, P, b, 'Birdsmouth 3D');
  }

  // --- 5b · Hip, Valley y Jack: lo que la app SÍ da, en planta ---
  function hipPlan(M, opt) {
    opt = opt || {};
    const P = opt.palette || PAPER;
    const W = opt.width || 360, H = 230;
    let b = '';
    // planta de la esquina: dos muros y el hip a 45°
    const o = [40, 196], L = 150;
    b += poly([[o[0], o[1]], [o[0] + L + 30, o[1]], [o[0] + L + 30, o[1] + 6], [o[0] - 6, o[1] + 6], [o[0] - 6, o[1] - L - 20], [o[0], o[1] - L - 20]], P.plate, P.plateLine, 1);
    const ridgeEnd = [o[0] + L * 0.72, o[1] - L * 0.72];
    // commons y jacks (líneas finas), el hip grueso
    for (let i = 1; i <= 5; i++) {
      const d = i * 22;
      b += line([o[0] + d, o[1]], [o[0] + d, o[1] - d], P.rafterLine, 1.2, ' opacity=".8"');
      b += line([o[0], o[1] - d], [o[0] + d, o[1] - d], P.rafterLine, 1.2, ' opacity=".8"');
    }
    b += line(o, ridgeEnd, P.rafterLine, 6, ' stroke-linecap="round"');
    b += line(o, ridgeEnd, P.rafter, 3.6, ' stroke-linecap="round"');
    b += line(ridgeEnd, [ridgeEnd[0] + 80, ridgeEnd[1]], P.headerLine, 4);
    b += text([o[0] + 64, o[1] - 70], 'HIP', { size: 10, weight: 800, fill: P.ink, rot: -45, halo: P.bg });
    b += text([o[0] + 118, o[1] - 6], 'jacks @ OC', { size: 9, weight: 600, fill: P.inkSoft, anchor: 'start', halo: P.bg });
    // el corte de cachete (cheek) doble, arriba del hip, en grande
    const cx = W - 92, cy = 70;
    const hw = 9, len = 54;
    const ch = M.cheekDeg * Math.PI / 180;
    const tip = [cx, cy - len / 2 - hw / Math.tan(ch)];
    b += poly([[cx - hw, cy + len / 2], [cx - hw, cy - len / 2], tip, [cx + hw, cy - len / 2], [cx + hw, cy + len / 2]], P.rafter, P.rafterLine, 1.6);
    b += text([cx, cy + len / 2 + 16], 'cheek ' + f1(M.cheekDeg) + '° contra la orilla', { size: 9.5, weight: 800, fill: P.ink, halo: P.bg });
    b += text([cx, cy + len / 2 + 28], '(' + f1(90 - M.cheekDeg) + '° desde la escuadra)', { size: 8.5, weight: 600, fill: P.inkSoft, halo: P.bg });
    b += text([cx, W < 440 ? cy + len / 2 + 42 : 20], 'arriba, visto de planta', { size: 8.5, weight: 600, fill: P.inkSoft, halo: P.bg });
    b += text([12, 18], 'HIP ' + M.pitch + '/12 · unit ' + inch(M.unitLen) + ' · plumb ' + f1(M.plumbDeg) + '° · seat ' + f1(M.seatDeg) + '°', { size: 10, weight: 800, fill: P.ink, anchor: 'start', mono: false });
    b += text([12, H - 8], 'HAP, birdsmouth, overhang y medida: la app no los modela (no se dibujan).', { size: 9, weight: 600, fill: P.inkSoft, anchor: 'start', mono: false });
    return svgWrap(W, H, P, b, 'Hip en planta');
  }

  function valleyPlan(V, opt) {
    opt = opt || {};
    const P = opt.palette || PAPER;
    const W = opt.width || 360, H = W < 480 ? 252 : 240;
    let b = '';
    // el valley corre donde las dos aguas tienen la misma altura:
    // (p_menor/12)·x = (p_mayor/12)·y  →  llega al ridge menor en x = run menor
    const xm = V.runMinorFt, ym = V.runMinorFt * V.pMinor / V.pMajor;      // 10' y 7.5'
    const sc = Math.min((W < 480 ? W - 150 - 52 : W * 0.52) / xm, 150 / ym);   // v59: en la hoja angosta la planta no se mete debajo del recibo
    const o = [34, H - (W < 480 ? 52 : 40)];
    const P2 = (x, y) => [o[0] + x * sc, o[1] - y * sc];
    // muros de la esquina de adentro
    b += poly([P2(-0.3, -0.3), P2(xm + 2.2, -0.3), P2(xm + 2.2, 0), P2(0, 0), P2(0, ym + 2.2), P2(-0.3, ym + 2.2)], P.plate, P.plateLine, 1);
    // ridge menor (llega al valley) en línea punteada
    b += line(P2(xm, ym), P2(xm, ym + 2.2), P.headerLine, 3);
    b += line(P2(0, 0), P2(xm, ym), P.rafterLine, 6, ' stroke-linecap="round"');
    b += line(P2(0, 0), P2(xm, ym), P.rafter, 3.6, ' stroke-linecap="round"');
    // cotas en planta
    b += dimLine([P2(0, 0)[0], o[1] + 16], [P2(xm, 0)[0], o[1] + 16], ftin(xm * 12) + ' (run menor)', P, { size: 9, flat: true });
    b += dimLine([o[0] - 16, P2(0, 0)[1]], [o[0] - 16, P2(0, ym)[1]], ftin(ym * 12), P, { size: 9 });
    const mid = P2(xm * 0.5, ym * 0.5);
    b += label([mid[0] + 6, mid[1] - 12], 'VALLEY · planRun ' + V.planRun, P, { size: 9.5, rot: -deg(Math.atan2(ym, xm)) });
    // v59 · la MAYOR va arriba del valley a la izquierda, lejos de la cabecera; la MENOR a la izquierda del ridge menor
    const mayP = W < 480 ? P2(xm * 0.27, ym * 0.86) : P2(xm * 0.22, ym * 0.72);
    b += label([mayP[0], Math.max(mayP[1], 32)], 'agua MAYOR ' + V.pMajor + '/12', P, { size: 9, fill: P.inkSoft });
    b += label(P2(xm - 0.35, ym * 0.3), 'MENOR ' + V.pMinor + '/12', P, { size: 9, fill: P.inkSoft, anchor: 'end' });
    // el recibo de la app
    const rx = W - 150, ry = 30;
    b += '<rect x="' + rx + '" y="' + ry + '" width="140" height="132" rx="9" fill="' + P.craftSoft + '" stroke="' + P.craft + '"/>';
    [['largo', V.length], ['pitch', V.pitchDeg + '°'], ['asiento', V.seat], ['HAP mayor', V.hapMajor], ['HAP menor', V.hapMinor], ['grooving', V.grooving + '°'], ['drop', V.drop]].forEach((r, i) => {
      b += text([rx + 9, ry + 19 + i * 16.5], r[0], { size: 9, weight: 600, fill: P.inkSoft, anchor: 'start', mono: false });
      b += text([rx + 131, ry + 19 + i * 16.5], r[1], { size: 9.5, weight: 800, fill: P.ink, anchor: 'end' });
    });
    b += text([10, 16], 'VALLEY irregular · ' + V.pMajor + '/12 + ' + V.pMinor + '/12 · birdsmouth cóncavo', { size: 10, weight: 800, fill: P.ink, anchor: 'start', mono: false });
    if (W < 480) {
      b += text([10, H - 17], 'Recibo de la pantalla Valley irregular de la 439;', { size: 8.3, weight: 600, fill: P.inkSoft, anchor: 'start', mono: false });
      b += text([10, H - 6], 'el asiento cóncavo se dibuja cuando la app lo modele.', { size: 8.3, weight: 600, fill: P.inkSoft, anchor: 'start', mono: false });
    } else b += text([10, H - 6], 'Recibo de la pantalla Valley irregular de la 439; el asiento cóncavo se dibuja cuando la app lo modele.', { size: 8.3, weight: 600, fill: P.inkSoft, anchor: 'start', mono: false });
    return svgWrap(W, H, P, b, 'Valley irregular en planta');
  }

  function jackPlan(M, opt) {
    opt = opt || {};
    const P = opt.palette || PAPER;
    const W = opt.width || 360, H = W < 480 ? 222 : 210;
    const total = (M.runIn) * M.unit, diff = M.commonDiff;
    const jacks = []; let len = total - diff; while (len > 0) { jacks.push(len); len -= diff; }
    let b = '';
    const ox = 30, oy = 176, sc = 132 / M.runIn;
    b += line([ox, oy], [ox + M.runIn * sc, oy - M.runIn * sc], P.rafterLine, 6, ' stroke-linecap="round"');
    b += line([ox, oy], [ox + M.runIn * sc, oy - M.runIn * sc], P.rafter, 3.6, ' stroke-linecap="round"');
    b += line([ox - 4, oy + 3], [ox + M.runIn * sc + 150, oy + 3], P.plateLine, 5);
    // v59 · si los rótulos girados quedan a menos de 12 px, se enseña un jack sí y uno no
    const stepJ = (M.commonDiff / M.unit) * sc < 12 ? 2 : 1;
    const show = jacks.filter((_, i) => i % stepJ === 0).slice(0, 8);
    show.forEach((jl, i0) => {
      const i = i0 * stepJ;
      const x = ox + (M.runIn - (i + 1) * (M.commonDiff / M.unit)) * sc;
      const runJ = jl / M.unit;
      const yTop = oy - runJ * sc;
      void yTop;
      const xx = ox + (M.runIn * sc) - (i + 1) * (M.commonDiff / M.unit) * sc;
      b += line([xx, oy], [xx, oy - (M.runIn - (i + 1) * (M.commonDiff / M.unit)) * sc], P.rafterLine, 2.2);
      b += text([xx + 16, oy - 6 - (i0 % 2) * 10 + 0], ftin(jl), { size: 8.5, weight: 700, fill: P.ink, anchor: 'start', halo: P.bg, rot: -90 });
      void x;
    });
    b += text([12, 18], 'JACKS ' + M.pitch + '/12 @ ' + (opt.oc || 16) + '" · diferencia común ' + ftin(diff), { size: 10, weight: 800, fill: P.ink, anchor: 'start', mono: false });
    b += text([12, 32], 'cada jack sale ' + ftin(diff) + ' más corto que el de al lado (' + (opt.oc || 16) + '" × ' + M.unit.toFixed(4) + ')', { size: 9, weight: 600, fill: P.inkSoft, anchor: 'start', mono: false });
    if (W < 480) {
      b += text([12, H - 19], 'Ejemplo con el run de la casa de 28\' (14\');', { size: 8.5, weight: 600, fill: P.inkSoft, anchor: 'start', mono: false });
      b += text([12, H - 8], 'los largos salen de jackLengths de la app.', { size: 8.5, weight: 600, fill: P.inkSoft, anchor: 'start', mono: false });
    } else b += text([12, H - 8], 'Ejemplo con el run de la casa de 28\' (14\'); los largos salen de jackLengths de la app.', { size: 8.5, weight: 600, fill: P.inkSoft, anchor: 'start', mono: false });
    return { svg: svgWrap(W, H, P, b, 'Jacks en planta'), jacks };
  }

  root.FC439 = {
    inch, ftin, PAPER, DARK,
    calcStairs, stairGeom, stairCutList, stairBoardMarks, stairBoard, stairs2D, stairsIso,
    calcRafter, rafterGeom, roof2D, roof3D, birdsmouthDetail, hipPlan, valleyPlan, jackPlan,
  };
})(typeof window !== 'undefined' ? window : globalThis);
