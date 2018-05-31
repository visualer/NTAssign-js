
'use strict';

let isUnparsable = e => isNaN(parseFloat(e));

/**
 * Get assigned results to be processed for plotting.
 * @param {Object} inputParams - input parameters
 * @param {int} inputParams.p1 - p denoting transition type associated with val1
 * @param {(string|null)} inputParams.val1 - null-able or empty-able string of transition energy 1
 * @param {int} inputParams.p2 - p denoting transition type associated with val2
 * @param {(string|null)} inputParams.val2 - null-able or empty-able string of transition energy 2
 * @param {(string|null)} inputParams.rbm - null-able or empty-able string of RBM frequency
 * @param {int} inputParams.type - environment type
 * @returns {Object} assigned results
*/
function getPlotParams(inputParams) {
  let decimalDigits = (d) => d.split('.')[1].length;

  if (isUnparsable(inputParams.val1) && isUnparsable(inputParams.val2)) {
    throw new Error('Unauthorized Access');
  } else if (isUnparsable(inputParams.val1) || isUnparsable(inputParams.val2)) {
    if (isUnparsable(inputParams.rbm)) throw new Error('Unauthorized Access');
    inputParams.uncertainty = 2.0 / Math.pow(10,
      decimalDigits(isUnparsable(inputParams.val1) ? inputParams.val2 : inputParams.val1 ));
    return E1R1(inputParams);
  } else {
    inputParams.uncertainty = 2.0 / Math.pow(10,
      Math.min(decimalDigits(inputParams.val1), decimalDigits(inputParams.val2))
    );
    return E2(inputParams);
  }
}

/**
 * Get assigned results of 1 energy 1 RBM frequency input.
 * @param {Object} inputParams - input parameters
 * @param {int} inputParams.p1 - p denoting transition type associated with val1
 * @param {(string|null)} inputParams.val1 - null-able or empty-able string of transition energy 1
 * @param {int} inputParams.p2 - p denoting transition type associated with val2
 * @param {(string|null)} inputParams.val2 - null-able or empty-able string of transition energy 2
 * @param {string} inputParams.rbm - parseable string (to float) of RBM frequency
 * @param {int} inputParams.type - environment type
 * @returns {Object} assigned results
 */
function E1R1(inputParams) {

  let p1 = (isUnparsable(inputParams.val1) ? inputParams.p2 : inputParams.p1), type = inputParams.type, p = p1ToP(p1);
  let val = parseFloat(isUnparsable(inputParams.val1) ? inputParams.val2 : inputParams.val1); // float
  let wRBM = parseFloat(inputParams.rbm); // float, integrity checked in getPlotParam

  let dt = wRBM2Dt(wRBM, p, type);
  let cos = getCos3Theta(val, dt, p, type);
  let resultString = '';
  let error = () => Assign({
    bluePoint: null,
    point: [ val, 0.23 ],
    pLesser: pToLesser(p),
    type: type,
    pointType: 'none',
    p1Lesser: p1ToLesser(p1),
    resultString: resultString
  });

  if (cos[0] === -1 && cos[1] === -1) {
    resultString += 'Invalid input: out of range.';
    return error();
  }

  let pAnother, modAnother;
  if (isMetal(p)) {
    if (p1 % 4 - 3 !== (cos[0] === -1 ? 0 : -1)) {
      resultString += `Invalid input: You may have mistaken ${p1Name[p1 + 5 - (p1 % 4) * 2]} for ${p1Name[p1]}.`;
      return error();
    }
    pAnother = p;
    modAnother = cos[0] === -1 ? -1 : 0;
  }
  else {
    pAnother = isMetal(p + 1) ? p - 1 : p + 1;
    modAnother = cos[0] === -1 ? 2 : 1; // === mod1
  }

  let valAnother;
  try {
    valAnother = getEnergyFromCos3Theta(dt, cos[0] === -1 ? cos[1] : cos[0], pAnother, type, modAnother);
  }
  catch (err) {
    if (err.message === 'dt') {
      resultString += 'Invalid input: out of range, diameter too small.';
      return error();
    }
    throw err;
  }
  if ((isMetal(p) && (modAnother === -1)) || (!isMetal(p) && (p > pAnother))) {
    [p, pAnother] = [pAnother, p];
    [val, valAnother] = [valAnother, val];
  }
  let x = (val + valAnother) / 2, y = valAnother - val;
  return Assign({
    bluePoint: null,
    point: [x, y],
    pLesser: p,
    type: type,
    pointType: 'green',
    p1Lesser: p1ToLesser(p1),
    resultString: resultString
  }, modAnother);

}

/**
 * Get assigned results of 2 energy (with/without RBM frequency) input.
 * @param {Object} inputParams - input parameters
 * @param {int} inputParams.p1 - p denoting transition type associated with val1
 * @param {string} inputParams.val1 - parseable string (to float) of transition energy 1
 * @param {int} inputParams.p2 - p denoting transition type associated with val2
 * @param {string} inputParams.val2 - parseable string (to float) of transition energy 2
 * @param {(string|null)} inputParams.rbm - null-able or empty-able string of RBM frequency
 * @param {int} inputParams.type - environment type
 * @returns {Object} assigned results
 */
function E2(inputParams) {

  let resultString = '';
  let p1 = inputParams.p1, p2 = inputParams.p2, type = inputParams.type;
  let val1 = parseFloat(inputParams.val1), val2 = parseFloat(inputParams.val2);
  let p_1 = p1ToP(p1), p_2 = p1ToP(p2);
  let rbm = inputParams.rbm; // string

  // don't use 'with' block
  if (p1 > p2) {
    [p_1, p_2] = [p_2, p_1];
    [val1, val2] = [val2, val1];
    [p1, p2] = [p2, p1];
  }

  if (isMetal(p_2) !== isMetal(p_1)) {
    throw new Error('invalid form submission');
  }

  if (p2 - p1 === 1) {
    let bluePoint = null;
    if (!isUnparsable(rbm)) {
      let average = getAverage(val2 - val1, parseFloat(rbm), p_1, type);
      if (average !== null) {
        bluePoint = [average, val2 - val1];
      }
      else {
        resultString += 'Invalid input: RBM value out of range. Only transition energies are processed. <br/ >';
      }
    }
    return Assign({
      point: [ (val1 + val2) / 2, val2 - val1 ],
      pLesser: p_1,
      type: type,
      pointType: 'red',
      bluePoint: bluePoint,
      p1Lesser: p1,
      resultString: resultString
    });
  }

}

/**
 * Get assigned results of pre-processed parameters.
 * @param {Object} params - pre-processed parameters
 * @param {int} mod=-1 - transferred pre-processed mod in E1R1()
 * @param {array} params.point - point
 * @param {string} params.pointType - type of the point, 'red' or 'green'
 * @param {int} params.pLesser - smaller one of the p in the plot
 * @param {int} params.p1Lesser - smaller one of the p1 in the plot
 * @param {int} params.type - environment type
 * @param {string} params.resultString - output result
 * @param {string} params.bluePoint blue point if exists
 * @returns {Object} assigned results
 */
function Assign(params, mod = -1) {

  // params: plotParams
  // x: average y: splitting

  let uncertainty = params.uncertainty;
  let dxMin = -1, dxMax = -1, dyMin = -1, dyMax = -1;
  let Dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) * 25);
  let Dist_ = (e) => Dist(e[2], e[3], params.point[0], params.point[1]);
  let deltaX = 0.6,
    maxY = isMetal(params.pLesser) ? 0.6 : params.point[1] + 0.6,
    minY = isMetal(params.pLesser) ? -0.1 : params.point[1] - 0.6;

  function setBounds(dxMin_, dxMax_, dyMin_, dyMax_) {
    dxMin = dxMin_;
    dxMax = dxMax_;
    dyMin = dyMin_;
    dyMax = dyMax_;
  }

  // https://github.com/mihaifm/linq, many thanks to you!

  params.all = Enumerable.from(getList(params.pLesser, params.type))
    .where(e => (e[2] >= params.point[0] - deltaX && e[2] <= params.point[0] + deltaX &&
      e[3] <= maxY && e[3] >= minY))
    .toArray();

  let query = Enumerable.from(params.all)
    .where(e => (
      (mod === -1 || isMetal(params.pLesser) || mod === Mod(e[0], e[1])) &&
      params.point[0] - e[2] >= dxMin && params.point[0] - e[2] <= dxMax &&
      params.point[1] - e[3] >= dyMin && params.point[1] - e[3] <= dyMax
    ));

  setBounds(-uncertainty, uncertainty, -uncertainty, uncertainty);
  let uc = query.toArray(); // query once to get uncertainty range

  function processOutput() {
    params.result = query.orderBy(Dist_).toArray();
    for (let i = 0; i < params.result.length; i++)
      params.resultString += `
        <b>(${Math.round(params.result[i][0])},${Math.round(params.result[i][1])})</b>
        ${i !== params.result.length - 1 ? ', ' : ''}`;
    params.resultString += '</span>';
  }

  if (params.pointType === 'none') {
    params.ar = AssignResult.error;
    params.result = [];
    return params;
  }

  if (uncertainty > 0.2) {
    params.resultString = 'Input uncertainty too large. Please give more significant figures.';
    params.ar = AssignResult.error;
    params.result = [];
    return params;
  }

  if (params.pointType === 'red') {
    if (params.bluePoint != null) {
      if (params.bluePoint[0] - params.point[0] < 0.02) setBounds(-0.008, 0.008, -0.015, 0.015);
      else setBounds(-0.030, -0.005, -0.015, 0.015); // don't change at this moment
    } else setBounds(-0.020, 0.008, -0.015, 0.015);

    if (query.count() === 1 && uc.length <= 1) {
      params.ar = AssignResult.accurate;
      params.resultString += 'The assignment result is:<br /><span style="font-size: 28px;">';
      processOutput();
      return params;
    }
    setBounds(-0.040, 0.0126, -0.030, 0.030);
  } else setBounds(-0.070, 0.070, -0.040, 0.040);

  query.union(uc);

  if (query.count() > 0) {
    params.ar = AssignResult.possible;
    params.resultString += 'The likely assignments include:<br /><span style="font-size: 28px;">';
    processOutput();
    return params;
  }

  /*
  * use the green criteria and query again for no match.
  * and it's easy to see that green point, if not returned in the previous step,
  * will not give results in this step.
  */

  setBounds(-0.070, 0.070, -0.040, 0.040);
  let tmp = Enumerable.from(params.all).orderBy(Dist_).toArray();
  if (Dist_(tmp[0]) / Dist_(tmp[1]) <= 0.5 && query.count() !== 0) {
    params.ar = AssignResult.impossible;
    query = Enumerable.from([ tmp[0] ]);
    params.resultString += 'No match. The most possible assignment result is:<br /><span style="font-size: 28px;">';
    processOutput();
    return params;
  }

  params.ar = AssignResult.error;
  params.resultString = 'Invalid input: out of range. Please check your input.';
  params.result = [];
  return params;
}

function processOutput(params) {

  // process RBM

  const yMax = isMetal(params.pLesser) ? 0.51 : params.point[1] + 0.4;
  const xMin = params.point[0] - 0.5, xMax = params.point[0] + 0.5;
  let s = getRBMArray(params.pLesser, params.type); // {rbm, rbmLabel}
  let rbm = [];
  let rbmLabel = [];
  let rbmPos = [];
  let between = (xy, r1, r2) => (xy >= r1 && xy <= r2) || (xy >= r2 && xy <= r1);
  for (let i = 0 ; i < s.rbm.length; i++) {
    let a = s.rbm[i];
    let t;
    if (a.length === 2)
      t = (a[0][0] - a[1][0]) * (yMax - a[1][1]) / (a[0][1] - a[1][1]) + a[1][0];
    else {
      let u;
      if (between(yMax, a[1][1], a[0][1]))
        u = 0;
      else // if between(a[1][1], a[2][1])
        u = 2;
      t = (a[u][0] - a[1][0]) * (yMax - a[1][1]) / (a[u][1] - a[1][1]) + a[1][0];
    }
    if (between(t, xMax, xMin)) {
      rbm.push(s.rbm[i]);
      rbmLabel.push(s.rbmLabel[i]);
      rbmPos.push(t);
    }
  }
  params.rbm = rbm;
  params.rbmLabel = rbmLabel;
  params.rbmPos = rbmPos;

  // process all

  let all = params.all; // you know, lazy evaluation
  let q = Enumerable.from(all)
    .groupBy(
      e => 2 * e[0] + e[1], // key
      e => e, // group element
      (key, group) => ({ key: key, value: group.orderBy(e => e[0]).toArray() })
    ); // use default compare method

  params.all = q.select(e => e.value.map(ee => [ee[2], ee[3]])).toArray();
  params.allLabel = q.select(e => e.value.map(ee => [ee[0], ee[1]])).toArray();

  // process result

  let result = params.result;
  params.result = result.map(e => [e[2], e[3]]);
  params.resultLabel = result.map(e => [e[0], e[1]]);

  params.isMetal = isMetal(params.pLesser);
  params.yAxisLabel = `\\(${p1Name_raw[params.p1Lesser + 1]}-${p1Name_raw[params.p1Lesser]}\\ (\\mathrm{eV})\\)`;
  params.xAxisLabel = `\\((${p1Name_raw[params.p1Lesser + 1]}+${p1Name_raw[params.p1Lesser]})/2\\ (\\mathrm{eV})\\)`;


  // select g.OrderBy(elem => elem[0]);
  // note that average energy may not increase monotonously as n in (n,m) increases.
  // thus elem => elem[2] is wrong.
  // test: S11 = 1.420, S22 = 2.134 as (6,4), see branch 2n + m = 16


  return params;
}
