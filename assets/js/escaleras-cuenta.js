/* FrameCore · la cuenta de la calculadora de escaleras.
 *
 * Es la misma cuenta de la app FrameCore: los risers, la huella, el run, la zanca y la garganta,
 * y las medidas como las escribe la app (al dieciseisavo; el dieciseisavo non va con su «+»:
 * 8+" es 8 1/16", y sin pulgadas enteras va 0+"). Se coteja caso por caso contra la app.
 */
(function (root) {
  'use strict';

  // Los números de la app.
  var MAX_RISER = 7.75;            // maxRiserHeight
  var MIN_THROAT = 3.5;            // minThroat: el mínimo que aguanta la zanca (oficio)
  var IDEAL_THROAT = 5.0;          // idealThroat
  var MIN_HEADROOM = 80.0;         // _ircMinHeadroom
  var MAX_FINISHED_VARIATION = 0.375;

  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  /** La medida en pulgadas, como la escribe la app: al dieciseisavo, con su «+» y su «0+"». */
  function inchFraction(inches, denom) {
    denom = denom || 16;
    var total = Math.round(Math.abs(inches) * denom);
    var neg = inches < 0 && total !== 0 ? '-' : '';
    var whole = Math.floor(total / denom);
    var num = total % denom;
    if (num === 0) return neg + whole + '"';
    if (denom === 16 && num % 2 === 1) {
      var baseNum = num - 1;
      var plusStr;
      if (baseNum === 0) {
        plusStr = '+';
      } else {
        var g0 = gcd(baseNum, 16);
        plusStr = (baseNum / g0) + '/' + (16 / g0) + '+';
      }
      if (whole === 0 && baseNum === 0) return neg + '0+"';   // sin pulgadas enteras: 0+"
      return whole > 0
        ? neg + whole + (baseNum === 0 ? '' : ' ') + plusStr + '"'
        : neg + plusStr + '"';
    }
    var g = gcd(num, denom);
    return whole > 0
      ? neg + whole + ' ' + (num / g) + '/' + (denom / g) + '"'
      : neg + (num / g) + '/' + (denom / g) + '"';
  }

  /** Pies y pulgadas desde un pie para arriba; abajo, nomás pulgadas (como la app). */
  function fmtFt(totalInches, denom) {
    denom = denom || 16;
    var neg = totalInches < 0 ? '-' : '';
    var units = Math.round(Math.abs(totalInches) * denom);
    var perFoot = 12 * denom;
    if (units >= perFoot) {
      var ft = Math.floor(units / perFoot);
      var inch = (units % perFoot) / denom;
      var iStr = inchFraction(inch, denom).replace('"', '');
      return iStr === '0' ? neg + ft + "'" : neg + ft + "' " + iStr + '"';
    }
    return inchFraction(totalInches, denom);
  }

  function bandaDeLaGarganta(throat) {
    return throat >= IDEAL_THROAT ? 'ideal' : throat >= MIN_THROAT ? 'aguas' : 'corta';
  }

  /**
   * La escalera, con la cuenta de la app. Todo en pulgadas.
   * @param {{totalRise:number, targetRiser?:number, treadDepth?:number, openingLength?:number,
   *   headerHeight?:number, flooringDeltaTop?:number, flooringDeltaBottom?:number,
   *   treadThickness?:number, droppedStringer?:boolean, boardDepth?:number,
   *   topLandingFlush?:boolean}} o
   */
  function calcStairs(o) {
    var totalRise = o.totalRise;
    var targetRiser = o.targetRiser == null ? 7.0 : o.targetRiser;
    var treadDepth = o.treadDepth == null ? null : o.treadDepth;
    var dTop = o.flooringDeltaTop || 0;
    var dBottom = o.flooringDeltaBottom || 0;
    var treadThickness = o.treadThickness || 0;
    var dropped = o.droppedStringer == null ? true : !!o.droppedStringer;
    var boardDepth = o.boardDepth == null ? null : o.boardDepth;
    var flush = !!o.topLandingFlush;

    // La escalera TERMINADA es pareja: la cuenta corre sobre el rise terminado.
    var finishedRise = totalRise + dTop - dBottom;
    var nRisers = Math.min(999, Math.max(1, Math.round(finishedRise / targetRiser)));
    var riser = finishedRise / nRisers;
    while (riser > MAX_RISER && nRisers < 200) {
      nRisers++;
      riser = finishedRise / nRisers;
    }
    var codeOk = riser <= MAX_RISER;

    var pos = {};
    [2, 3, 4].forEach(function (d) {
      for (var k = 1; k < d; k++) {
        var s = Math.round(nRisers * k / d);
        if (s > 0 && s < nRisers) pos[s] = true;
      }
    });
    var landingHeights = {};
    Object.keys(pos).map(Number).sort(function (a, b) { return a - b; })
      .forEach(function (s) { landingHeights[s] = s * riser; });

    var alternatives = [];
    for (var n = Math.max(1, nRisers - 2); n <= nRisers + 3; n++) {
      var r = finishedRise / n;
      alternatives.push({ n: n, riser: r, ok: r <= MAX_RISER });
    }

    // La llegada arriba pone cuántas huellas se cortan.
    var treadsCut = flush ? nRisers : nRisers - 1;
    var totalRun = null, stringer = null;
    if (treadDepth != null) {
      totalRun = treadsCut * treadDepth;
      stringer = Math.sqrt(totalRun * totalRun + finishedRise * finishedRise);
    }

    var firstRough = riser + dBottom - (dropped ? treadThickness : 0);
    var lastRough = riser - dTop;

    var throat = null, throatOk = null, throatBand = null;
    if (boardDepth != null && treadDepth != null && treadDepth > 0) {
      var notchPerp = riser * treadDepth / Math.sqrt(riser * riser + treadDepth * treadDepth);
      throat = boardDepth - notchPerp;
      throatOk = throat >= MIN_THROAT;
      throatBand = bandaDeLaGarganta(throat);
    }

    var headroom = null, minOpening = null, headroomOk = null;
    if (treadDepth != null && treadDepth > 0) {
      var hdr = o.headerHeight == null ? 11.25 : o.headerHeight;
      minOpening = (MIN_HEADROOM + hdr) * treadDepth / riser;
      if (o.openingLength != null) {
        headroom = o.openingLength * (riser / treadDepth) - hdr;
        headroomOk = headroom >= MIN_HEADROOM;
      }
    }

    var finishedVariationIn = !dropped && treadThickness > 0 ? treadThickness : 0.0;
    return {
      totalRise: totalRise,
      numRisers: nRisers,
      riserHeight: riser,
      treadDepth: treadDepth,
      totalRun: totalRun,
      stringerLength: stringer,
      codeOk: codeOk,
      landingHeights: landingHeights,
      alternatives: alternatives,
      headroom: headroom,
      minOpening: minOpening,
      headroomOk: headroomOk,
      finishedTotalRise: finishedRise,
      firstRoughRise: firstRough,
      lastRoughRise: lastRough,
      throat: throat,
      throatOk: throatOk,
      throatBand: throatBand,
      treadsCut: treadsCut,
      finishedVariationIn: finishedVariationIn,
      finishedVariationOk: finishedVariationIn <= MAX_FINISHED_VARIATION
    };
  }

  var api = { calcStairs: calcStairs, inchFraction: inchFraction, fmtFt: fmtFt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FrameCoreEscaleras = api;
})(typeof window !== 'undefined' ? window : globalThis);
