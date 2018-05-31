
'use strict';

/**
 * @const max processable (2n + m) limit
 * @type int
 */
const seriesThreshold = 90;

const AssignResult = {
  accurate : 0,
  possible : 1,
  impossible : 2,
  error : 3
};

/**
 * @const names of environments
 * @type {string[]}
 */
const typeName = [
  'Air-suspended SWNTs', 'SWNTs on \\(\\mathrm{SiO_2}/\\mathrm{Si}\\) substrates', 'SWNT arrays on quartz substrates',
  '"Super-growth" SWNTs', 'SDS-dispersed SWNTs', 'ssDNA-dispersed SWNTs'
];


/**
 * @const parameters of air-suspended-like environments: (a, b, c)
 * @type {number[][]}
 */
const type0Params = [
  [ 1.194, 0.179, 0.053 ],
  [ 2.110, 0.388, 0.154 ],
  [ 3.170, 0.764, 0.286 ], //M11
  [ 4.286, 1.230, 0.412 ],
  [ 5.380, 1.922, 0.644 ],
  [ 6.508, 2.768, 0.928 ], //M22
  [ 7.624, 3.768, 1.024 ], //S55
  [ 8.734, 4.921, 1.479 ], //S66
  [ 9.857, 6.228, 1.692 ]  //M33
];

/**
 * @const parameters of super-growth environments: (beta_mod1, beta_mod2) or (beta_-, beta_+)
 * @type {number[][]}
 */
const type3Params =[
  [ 0.09, -0.07 ],
  [ -0.18, 0.14 ],
  [ -0.19, 0.29 ],
  [ 0.49, -0.33 ],
  [ -0.43, 0.59 ],
  [ -0.6, 0.57 ]
];

const p1Name = [
  '\\(S_{11}\\)', '\\(S_{22}\\)', '\\(M_{11}^-\\)', '\\(M_{11}^+\\)', '\\(S_{33}\\)', '\\(S_{44}\\)',
  '\\(M_{22}^-\\)', '\\(M_{22}^+\\)', '\\(S_{55}\\)', '\\(S_{66}\\)', '\\(M_{33}^-\\)', '\\(M_{33}^+\\)'
];

/**
 * @const name of p1 without delimiters
 * @type {string[]}
 */
const p1Name_raw = [
  'S_{11}', 'S_{22}', 'M_{11}^-', 'M_{11}^+', 'S_{33}', 'S_{44}', 'M_{22}^-', 'M_{22}^+', 'S_{55}', 'S_{66}',
  'M_{33}^-', 'M_{33}^+'
];

/**
 * converts p1 (p with + or - for metallic tubes) to correlated p.
 * @param {int} p1 - input p1
 * @returns {int} p
 */
const p1ToP = (p1) => [ 0, 1, 2, 2, 3, 4, 5, 5, 6, 7, 8, 8 ][p1];

/**
 * converts p to its lesser value in a pair (S11 and S22 will be converted to S11, etc.).
 * @param {int} p - input p
 * @returns {int} lesser p
 */
const pToLesser = (p) => [ 0, 0, 2, 3, 3, 5, 6, 6, 9 ][p];

/**
 * converts p1 to its lesser value in a pair (M11+ and M11- will be converted to M11-, etc.).
 * @param {int} p1 - input p1
 * @returns {int} lesser p1
 */
const p1ToLesser = (p1) => p1 % 2 === 0 ? p1 : p1 - 1;


const Dt = (n, m, type) => ((type !== 4) ? 0.142 : 0.144) * Math.sqrt(3 * (n * n + n * m + m * m)) / Math.PI;
const Theta = (n, m) => Math.atan(Math.sqrt(3) * m / (2 * n + m));
const Mod = (n, m) => (2 * n + m) % 3;

/**
 * get if a p value or a pair of (n, m) value is associated to a metallic tube.
 * @returns {boolean} if it is metallic
 */
const isMetal = function () {
  const isMetalP = (p) => (p + 1) % 3 === 0;
  const isMetalNM = (n, m) => Mod(n, m) === 0;
  return arguments.length === 2 ?
    isMetalNM(arguments[0], arguments[1]) :
    isMetalP(arguments[0]);
};

/**
 * get RBM parameters (A, B) in the formula wRBM = A / dt + B of specific p and type of environment.
 * @param {int} p - specific p
 * @param {int} type - specific type of environment
 * @returns {Object} object of {a: number, b: number}
 */
function getRBMParameters(p, type) {
  class Param {
    constructor(a, b) { this.a = a; this.b = b; }
  }
  switch (type) {
    case 0: switch (p) {
      case 0: case 1: return new Param(204, 27);
      case 2: return new Param(200, 26);
      default: return new Param(228, 0);
    }
    case 1: return new Param(235.9, 5.5);
    case 2: return new Param(217.8, 15.7);
    case 3: return new Param(227.0, 0.3);
    case 4: return new Param(223.5, 12.5);
    case 5: return new Param(218, 18.3);
    default: throw new Error('invalid type');
  }
}

function wRBM2Dt(wRBM, p, type) {
  let ab = getRBMParameters(p, type);
  return ab.a / (wRBM - ab.b);
}

function dt2RBM(dt, p, type) {
  let ab = getRBMParameters(p, type);
  return ab.a / dt + ab.b;
}

const getEnergy = (dt, theta, p, type, mod) => getEnergyFromCos3Theta(dt, Math.cos(3 * theta), p, type, mod);

/**
 * inverse of getCos3Theta, calculates transition energy from tube diameter and Math.cos(3 * chiral_angle)
 * @param {number} dt - tube diameter
 * @param {number} cos3Theta - Math.cos(3 * chiral_angle)
 * @param {int} p - p of transition type
 * @param {int} type - code of environment
 * @param {int} mod - mod of the tube, -1/0 for metallic -/+, 1/2 for semiconducting MOD1/MOD2
 * @returns {number} transition energy
 */
function getEnergyFromCos3Theta(dt, cos3Theta, p, type, mod) {
  let r; // return value
  if (isMetal(p) && mod > 0)
    throw new Error('mod should be in accordance with p');
  if (type <= 2) {

    if (p >= 9)
      throw new Error('higher than S66 not available');
    let derivative = -type0Params[p][0] / (dt * dt) + 2 * type0Params[p][1] / (dt * dt * dt);
    if (derivative > 0) // 1st derivative
      throw new Error('dt');
    if (isMetal(p))
      r = type0Params[p][0] / dt - type0Params[p][1] / (dt * dt) +
        type0Params[p][2] / (dt * dt) * cos3Theta * (mod * 2 + 1);
    // mod * 2 + 1 <==> mod === 0 ? 1 : -1
    else
      r = type0Params[p][0] / dt - type0Params[p][1] / (dt * dt) +
        type0Params[p][2] / (dt * dt) * cos3Theta * (((p % 3) === (mod % 2)) ? -1 : 1);
    r -= (type === 1) ? 0.04 : ((type === 2) ? 0.1 : 0);

  } else if (type === 3) {

    if (p >= 6)
      throw new Error('higher than M22 not available for Super-Growth');
    let a = 1.074, b = 0.467, c = 0.812;
    let sgE = (extMod) => a * (p + 1) / dt * (1 + b * Math.log10(c / ((p + 1) / dt)))
      + type3Params[p][extMod] / (dt * dt) * cos3Theta
      + ((p > 2) ? 0.059 * (p + 1) / dt : 0); // extra for larger than M11; warning: p + 1
    if (isMetal(p))
      r = sgE(mod + 1); // 0(Mii+) -> 1, -1(Mii-) -> 0
    else
      r = sgE(mod - 1); // 1(MOD1) -> 0, 2(MOD2) -> 1

  } else if (type === 4 || type === 5) {

    if (p === 0)
      r = 1 / (0.1270 + 0.8606 * dt) + ((mod === 1) ? 0.04575 : -0.08802) / (dt * dt) * cos3Theta;
    else if (p === 1)
      r = 1 / (0.1174 + 0.4644 * dt) + ((mod === 1) ? -0.1829 : 0.1705) / (dt * dt) * cos3Theta;
    else
      throw new Error('only S11 and S22 are available for SDS-dispersed or ssDNA dispersed');
    r -= (type === 5) ? 0.02 : 0;

  } else throw new Error('invalid type');

  return r;
}

/**
 * inverse of getEnergyFromCos3Theta(), get Math.cos(3 * chiral_angle) from transition energy and tube diameter.
 * @param {number} dt - tube diameter
 * @param {number} val - transition energy
 * @param {int} p - p of transition type
 * @param {int} type - code of environment
 * @returns {number[]} cos3Theta as [val_MOD1, val_MOD2] or [val_-, val_+]
 */
function getCos3Theta(val, dt, p, type) {

  let r = [-1, -1];

  if (type <= 2) {

    if (p >= 9)
      throw new Error('higher than S66 not available');
    val += (type === 1) ? 0.04 : ((type === 2) ? 0.1 : 0);
    if (isMetal(p)) {
      r[0] = (type0Params[p][0] / dt - type0Params[p][1] / (dt * dt) - val) / type0Params[p][2] * (dt * dt);
      r[1] = (-(type0Params[p][0] / dt - type0Params[p][1] / (dt * dt) - val)) / type0Params[p][2] * (dt * dt);
    } else {
      r[0] = (-(type0Params[p][0] / dt - type0Params[p][1] / (dt * dt) - val))
        / type0Params[p][2] * (dt * dt) * (((p % 3) === (1 % 2)) ? -1 : 1);
      r[1] = (-(type0Params[p][0] / dt - type0Params[p][1] / (dt * dt) - val))
        / type0Params[p][2] * (dt * dt) * (((p % 3) === (2 % 2)) ? -1 : 1);
    }

  } else if (type === 3) {

    if (p >= 6)
      throw new Error('higher than M22 not available for Super-Growth');
    let a = 1.074, b = 0.467, c = 0.812;
    let calc = (extMod) => (val - a * (p + 1) / dt * (1 + b * Math.log10(c / ((p + 1) / dt))) -
      ((p > 2) ? 0.059 * (p + 1) / dt : 0)) / type3Params[p][extMod] * (dt * dt);
    r[0] = calc(0); //Mii- or MOD1
    r[1] = calc(1);

  } else if (type === 4 || type === 5) {

    val += (type === 5) ? 0.02 : 0;
    if (p === 0) {
      r[0] = (val - 1 / (0.1270 + 0.8606 * dt)) / 0.04575 * (dt * dt); // MOD1
      r[1] = (val - 1 / (0.1270 + 0.8606 * dt)) / (-0.08802) * (dt * dt);
    } else if (p === 1) {
      r[0] = (val - 1 / (0.1174 + 0.4644 * dt)) / (-0.1829) * (dt * dt); // MOD1
      r[1] = (val - 1 / (0.1174 + 0.4644 * dt)) / 0.1705 * (dt * dt);
    } else throw new Error('only S11 and S22 are available for SDS-disp. or ssDNA disp.');

  } else throw new Error('invalid type');

  r[0] = parseFloat(r[0].toFixed(4)); // 4 digits
  r[1] = parseFloat(r[1].toFixed(4));
  if (r[0] > 1 || r[0] < 0)
    r[0] = -1;
  if (r[1] > 1 || r[1] < 0)
    r[1] = -1;
  return r;

}

/**
 * get sum of paired transition energies from their splitting and RBM frequency.
 * @param {number} splitting - (S22 - S11) or (M11+ - M11-), or something similar
 * @param {number} wRBM - RBM frequency
 * @param {int} pLesser - the smaller one of the p value of the 2 transition energies
 * @param {int} type - environment
 * @returns {(number|null)} average or null if invalid
 */
function getAverage(splitting, wRBM, pLesser, type) {

  let cos3ThetaMax = 1.5;

  let dt = wRBM2Dt(wRBM, pLesser, type);

  if (isMetal(pLesser + 1)) throw new Error('p should be the smaller one');
  if (type <= 2) {
    if (pLesser >= 9)
      throw new Error('higher than S66 not available');

    if (isMetal(pLesser)) {

      let cos3Theta = dt * dt * splitting / 2 * type0Params[pLesser][2];
      if (cos3Theta < 0 || cos3Theta > cos3ThetaMax) return null;
      try {
        return (
          getEnergyFromCos3Theta(dt, cos3Theta, pLesser, type, -1) +
          getEnergyFromCos3Theta(dt, cos3Theta, pLesser, type, 0)
        ) / 2;
      } catch (err) {
        if (err.message === 'dt')
          return null;
        else throw err;
      }
    } else {
      let pLarger = pLesser + 1;
      let delta = (x) => type0Params[pLarger][x] - type0Params[pLesser][x];
      let mod = 1;
      let cos3Theta = (splitting * dt * dt - delta(0) * dt + delta(1)) / (
        type0Params[pLarger][2] * (((pLarger % 3) === (mod % 2)) ? -1 : 1) -
        type0Params[pLesser][2] * (((pLesser % 3) === (mod % 2)) ? -1 : 1)
      );
      if (cos3Theta < 0) {
        mod = 2;
        cos3Theta = -cos3Theta;
      }
      if (cos3Theta > cos3ThetaMax) return null;
      try {
        return (
          getEnergyFromCos3Theta(dt, cos3Theta, pLarger, type, mod) +
          getEnergyFromCos3Theta(dt, cos3Theta, pLesser, type, mod)
        ) / 2;
      } catch (err) {
        if (err.message === 'dt')
          return null;
        else throw err;
      }
    }
  } else if (type === 3) {
    let a = 1.074, b = 0.467, c = 0.812;
    let sgE = (p) => a * (p + 1) / dt * (1 + b * Math.log10(c / ((p + 1) / dt))) +
      ((p > 2) ? 0.059 * (p + 1) / dt : 0);

    if (isMetal(pLesser)) {

      let cos3Theta = (splitting) * dt * dt / (type3Params[pLesser][1] - type3Params[pLesser][0]);
      if (cos3Theta < 0 || cos3Theta > cos3ThetaMax)
        return null;
      return (
        getEnergyFromCos3Theta(dt, cos3Theta, pLesser, type, -1) +
        getEnergyFromCos3Theta(dt, cos3Theta, pLesser, type, 0)
      ) / 2;

    } else {

      let pLarger = pLesser + 1;
      let mod = 1;
      if (pLesser >= 6)
        throw new Error('higher than M22 not available for Super-Growth');
      let cos3Theta = (splitting + sgE(pLesser) - sgE(pLarger)) * dt * dt / (
        type3Params[pLarger][mod - 1] - type3Params[pLesser][mod - 1]
      );
      if (cos3Theta < 0 || cos3Theta > cos3ThetaMax) {
        mod = 2;
        cos3Theta = (splitting + sgE(pLesser) - sgE(pLarger)) * dt * dt / (
          type3Params[pLarger][mod - 1] - type3Params[pLesser][mod - 1]);
      }
      if (cos3Theta < 0 || cos3Theta > cos3ThetaMax)
        return null;
      return (
        getEnergyFromCos3Theta(dt, cos3Theta, pLarger, type, mod) +
        getEnergyFromCos3Theta(dt, cos3Theta, pLesser, type, mod)
      ) / 2;
    }

  } else if (type === 4 || type === 5) {

    if (pLesser !== 0)
      throw new Error('only S11 and S22 are available for SDS-disp. or ssDNA disp.');
    let mod = 1;
    let cos3Theta = (splitting - (1 / (0.1174 + 0.4644 * dt) - 1 / (0.1270 + 0.8606 * dt)))
      * dt * dt / (-0.1829 - 0.04575);

    if (cos3Theta > cos3ThetaMax || cos3Theta < 0) {
      mod = 2;
      cos3Theta = (splitting - (1 / (0.1174 + 0.4644 * dt) - 1 / (0.1270 + 0.8606 * dt)))
        * dt * dt / (0.1705 - -0.08802);
    }
    if (cos3Theta > cos3ThetaMax || cos3Theta < 0)
      return null;

    return (
      getEnergyFromCos3Theta(dt, cos3Theta, 1, type, mod) +
      getEnergyFromCos3Theta(dt, cos3Theta, 0, type, mod)
    ) / 2;
  }
  else throw new Error('invalid type');
}

/**
 * get a list of standard dots in a plot of a certain p (the smaller in a pair) and type
 * @param {int} pLesser - the smaller p in a pair
 * @param {int} type - type of the environment
 * @returns {number[][]} array of [n, m, x, y] where (n, m) is the chiral index and (x, y) is the coordinates
 */
function getList(pLesser, type) {

  let li = [];
  const nMin = 5, nMax = 50;

  if (!isMetal(pLesser)) {
    if (isMetal(pLesser + 1)) throw new Error('p should be the smaller one, e.g. S11 rather than S22');
    for (let n = nMin; n < nMax; n++)
      for (let m = 0; m <= n; m++) {

        if (2 * n + m > seriesThreshold) break;
        try {
          if (!isMetal(n, m)) {
            let dl = getEnergy(Dt(n, m, type), Theta(n, m), pLesser, type, Mod(n, m));
            let dh = getEnergy(Dt(n, m, type), Theta(n, m), pLesser + 1, type, Mod(n, m));
            li.push([ n, m, (dh + dl) / 2, (dh - dl) ]);
          }
        } catch (err) {
          if (err.message !== 'dt') throw err;
        }
      }
  } else {
    for (let n = nMin; n < nMax; n++)
      for (let m = 0; m <= n; m++) {

        if (2 * n + m > seriesThreshold) break;
        try {
          if (isMetal(n, m)) {
            let dl = getEnergy(Dt(n, m, type), Theta(n, m), pLesser, type, -1);
            let dh = getEnergy(Dt(n, m, type), Theta(n, m), pLesser, type, 0);
            li.push([ n, m, (dh + dl) / 2, (dh - dl) ]);
          }
        } catch (err) {
          if (err.message !== 'dt') throw err;
        }
      }
  }
  return li;
}

/**
 * get an parameter array used to plot RBM contour lines
 * @param {int} pLesser - the smaller p in a pair
 * @param {int} type - type of the environment
 * @return {{rbmLabel: number[], rbm: number[][][]}} rbm: RBM points array, rbmLabel: associated RBM value array
 */
function getRBMArray(pLesser, type) {

  let d = { rbmLabel: [], rbm: [] }; // return

  const cos3ThetaMax = 60;
  const wRBMMin = 70, wRBMMax = 350;
  if (!isMetal(pLesser) && isMetal(pLesser + 1))
    throw new Error('p should be the smaller one, e.g. S11 rather than S22');

  for (let rbmFreq = wRBMMin; rbmFreq <= wRBMMax; rbmFreq += 10) {

    let dt = wRBM2Dt(rbmFreq, pLesser, type);
    let t = [];
    try {
      if (isMetal(pLesser)) {
        let plus = getEnergyFromCos3Theta(dt, cos3ThetaMax, pLesser, type, 0);
        let minus = getEnergyFromCos3Theta(dt, cos3ThetaMax, pLesser, type, -1);
        t.push([ (plus + minus) / 2, plus - minus ]);
        plus = getEnergyFromCos3Theta(dt, -cos3ThetaMax, pLesser, type, 0);
        minus = getEnergyFromCos3Theta(dt, -cos3ThetaMax, pLesser, type, -1);
        t.push([ (plus + minus) / 2, plus - minus ]);
        d.rbmLabel.push(rbmFreq);
        d.rbm.push(t);
      } else {
        let plus = getEnergyFromCos3Theta(dt, cos3ThetaMax, pLesser + 1, type, 1); //should it be higher?
        let minus = getEnergyFromCos3Theta(dt, cos3ThetaMax, pLesser, type, 1);
        t.push([ (plus + minus) / 2, plus - minus ]);
        plus = getEnergyFromCos3Theta(dt, 0, pLesser + 1, type, 2);
        minus = getEnergyFromCos3Theta(dt, 0, pLesser, type, 2);
        t.push([ (plus + minus) / 2, plus - minus ]);
        plus = getEnergyFromCos3Theta(dt, cos3ThetaMax, pLesser + 1, type, 2);
        minus = getEnergyFromCos3Theta(dt, cos3ThetaMax, pLesser, type, 2);
        t.push([ (plus + minus) / 2, plus - minus ]);
        d.rbmLabel.push(rbmFreq);
        d.rbm.push(t);
      }
    }
    catch (err)
    {
      if (err.message === 'dt') break;
      else throw err;
    }
  }

  return d;
}
