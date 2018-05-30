
'use strict';

let timeLoad = performance.now(); // before load
let timeStartup;

$.getScript(navigator.language.substr(0, 2).toLowerCase() !== "zh"
  ? "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.3/MathJax.js"
  : "https://cdn.bootcss.com/mathjax/2.7.3/MathJax.js"
  + "?config=TeX-AMS_SVG-full,Safe&locale=en", function () {
  timeStartup = performance.now();
  console.log("MathJax load takes " + (timeStartup - timeLoad).toFixed(2));
});

let urlParams = {};
(window.onpopstate = function () {
  let match,
    pl     = /\+/g,  // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
    query  = window.location.search.substring(1);

  urlParams = {};
  while (match = search.exec(query))
    urlParams[decode(match[1])] = decode(match[2]);
})();

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
  $('.selectpicker').selectpicker('mobile');
}

let $body = $("body");

/*
 * Step 1
 */

if ($body.hasClass("Step1")) {

  let $selectType = $("#slType");
  for (let i = 0; i < typeArr.length; i++)
    $selectType.append(`<option value="${i}">${typeArr[i]}</option>`);

  $selectType.selectpicker('val', 0)
    .selectpicker('refresh')
    .on("loaded.bs.select", clearTitle)
    .on('changed.bs.select', clearTitle);

}

/*
 * Step 2
 */

if ($body.hasClass('Step2')) {

  let type = parseInt(urlParams['Type']); // '', ' ' will be converted to NaN in this process.
  if (isNaN(type) || type > 5 || type < 0)
    location.href = 'Step1.html';

  let $selectP1 = $('#slP1'), $selectP2 = $('#slP2'), $selectType = $('#slType');
  let $selectP1P2 = $('#slP1, #slP2');

  $('#title')[0].innerHTML += ' <small>' + typeArr[type] + '</small>';

  $('#dataTables').find(`.type${type}`).removeClass('hidden');

  // generate options

  for (let i = 0; i < p1Arr.length; i++) {
    if (type >= 3) {
      let threshold = (type === 3 ? 8 : 2);
      if (i >= threshold) break;
    }
    $selectP1P2.append(`<option value="${i}">${p1Arr[i]}</option>`);
  }
  for (let i = 0; i < typeArr.length; i++)
    $selectType.append(`<option value="${i}">${typeArr[i]}</option>`);

  // start recovering

  if ((['P1', 'P2', 'Val1', 'Val2', 'RBM'].every((e) => urlParams[e] !== undefined ))) {

    let params = {
      p1: parseInt(urlParams['P1']), // int
      p2: parseInt(urlParams['P2']), // int
      val1: urlParams['Val1'], // empty-able str
      val2: urlParams['Val2'], // empty-able str
      rbm: urlParams['RBM'] // empty-able str
    };

    let valueBetween = (xy, a, b) => (xy >= a && xy <= b);
    let val1_ = parseFloat(params.val1), val2_ = parseFloat(params.val2), rbm_ = parseFloat(params.rbm);

    let emptyNum = Number(isNaN(val1_)) + Number(isNaN(val2_)) + Number(isNaN(rbm_));
    if (emptyNum >= 2 || isNaN(params.p1) || isNaN(params.p2) ||
      !isNaN(val1_) && !valueBetween(val1_, 0, 4) || !isNaN(val2_) && !valueBetween(val2_, 0, 4) ||
      !isNaN(rbm_) && !valueBetween(rbm_, 30, 500) ||
      !valueBetween(params.p1, 0, 11) || !valueBetween(params.p2, 0, 11)
    )
      location.href = 'Step1.html';

    $selectP1.selectpicker('val', params.p1);
    $selectP2.selectpicker('val', params.p2);
    $('#edVal1').val(params.val1);
    $('#edVal2').val(params.val2);
    $('#edRBM').val(params.rbm);


  } else if ((['P1', 'P2', 'Val1', 'Val2', 'RBM'].every((e) => urlParams[e] !== undefined )))
    location.href = 'Step1.html';

  // end validation and recovering

  $selectType.selectpicker('val', type);
  $('.selectpicker').selectpicker('refresh');

  $('select').on('loaded.bs.select', clearTitle);
  $selectP1.on('changed.bs.select', function (e, index) {
    let i = index - 1;
    clearTitle(); // only when slP1 changes the title have to be cleared; only active select
    $selectP2.find('option').each(function () {
      let value = parseInt($(this).val());
      if (i % 2 === 0 && value === i + 1 || i % 2 === 1 && value === i - 1)
        $selectP2.selectpicker('val', value);
    });
  });

}


/*
 * Step 3
 */

if ($body.hasClass('Step3')) {

  // check integrity
  if (!(['Type', 'P1', 'P2', 'Val1', 'Val2', 'RBM'].every((e) => urlParams[e] !== undefined )))
    location.href = 'Step1.html';

  let inputParams = {
    type: parseInt(urlParams['Type']), // int
    p1: parseInt(urlParams['P1']), // int
    p2: parseInt(urlParams['P2']), // int
    val1: urlParams['Val1'], // empty-able str
    val2: urlParams['Val2'], // empty-able str
    rbm: urlParams['RBM'] // empty-able str
  };

  let valueBetween = (xy, a, b) => (xy >= a && xy <= b);
  let val1_ = parseFloat(inputParams.val1), val2_ = parseFloat(inputParams.val2), rbm_ = parseFloat(inputParams.rbm);
  // also, '' and ' ' will be converted to NaN in this process.

  let emptyNum = Number(isNaN(val1_)) + Number(isNaN(val2_)) + Number(isNaN(rbm_));
  if (emptyNum >= 2 || isNaN(inputParams.type) || isNaN(inputParams.p1) || isNaN(inputParams.p2) ||
    !isNaN(val1_) && !valueBetween(val1_, 0, 4) || !isNaN(val2_) && !valueBetween(val2_, 0, 4) ||
    !isNaN(rbm_) && !valueBetween(rbm_, 30, 500) || !valueBetween(inputParams.type, 0, 5) ||
    !valueBetween(inputParams.p1, 0, 11) || !valueBetween(inputParams.p2, 0, 11)
  )
    location.href = 'Step1.html';


  $('#title')[0].innerHTML += ' <small>' + typeArr[inputParams.type] + '</small>';

  let plotParams = processOutput(getPlotParams(inputParams));

  $('#resultDiv')
    .addClass(plotParams.ar !== AssignResult.error ? 'alert-success' : 'alert-danger')
    .html(plotParams.resultString);
  $('#yAxisLabel').html(plotParams.yAxisLabel);
  $('#xAxisLabel').html(plotParams.xAxisLabel);
  $('#' + plotParams.pointType + 'Legend').css('display', '');
  if (plotParams.bluePoint !== null)
    $('#blueLegend').css('display', '');

  $(drawPlot('plot-placeholder', plotParams));

}

// functions

function clearTitle() { // used in Step1 and Step2

  $('.bootstrap-select').find('button').removeAttr('title');
}

function validate(form) { // used in Step2

  let $hint = $('#hint');
  let invokeError = (msg) => {
    $hint.addClass('alert-danger')
      .html(`<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> ${msg}`);
    return false;
  };
  let val1_ = parseFloat(form.Val1.value);
  let val2_ = parseFloat(form.Val2.value);
  let rbm_ = parseInt(form.RBM.value);
  let emptyNum = Number(isNaN(val1_)) + Number(isNaN(val2_)) + Number(isNaN(rbm_));
  if (emptyNum >= 2) return invokeError('At least 2 values are required.');
  else {
    if (!isNaN(val1_) && (val1_ < 0 || val1_ > 4) ||
      !isNaN(val2_) && (val2_ < 0 || val2_ > 4) ||
      !isNaN(rbm_) && (rbm_ < 30 || rbm_ > 500))
      return invokeError('Please input valid value.');
    if ($("#slP1").selectpicker('val') === '')
      return invokeError('Please select the type of transition energy.');

    $(".selectpicker").removeAttr('disabled');

    history.replaceState(null, null,
      'Step2.html?' + ['Type', 'P1', 'Val1', 'P2', 'Val2', 'RBM'].map((e) => e + '=' + form[e].value).join('&'));
    return true;
  }
}

function changeEdit(p1_lesser, val1, val2) { // used in Step2
  $("#slP1").selectpicker('val', p1_lesser);
  $("#slP2").selectpicker('val', p1_lesser + 1);
  $("#edVal1").val(val1);
  $("#edVal2").val(val2);
}

function calculate(form) { // used in Step2

  let $calcHint = $('#calculatorHint');
  let $calcResult = $('#calcResult');

  let invokeError = () => {
    $calcHint.html(`
      <div class="alert-danger hint">
        <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
        No valid result.
      </div>
    `);
    $calcResult.html('');
  };

  let n = parseInt(form.NCalc.value), m = parseInt(form.MCalc.value), t = parseInt(urlParams['Type']);
  if (n < m) [n, m] = [m, n];
  if (isNaN(n) || isNaN(m) || n <= 6 || m <= 0 || 2 * n + m > seriesThreshold) {
    invokeError();
    return false;
  }

  $calcHint.html('');
  let $resultList = $(`<tbody></tbody>`);
  let $plotList = $('<div></div>'); // empty wrapper
  $calcResult.html('')
    .append($('<table class="table table-striped math" id="calcResultList"></table>').append($resultList))
    .append($plotList);

  $resultList.append(`<tr><td>\\(d_t\\)</td><td>\\( ${Dt(n, m, t).toFixed(3).toString()} \\ \\mathrm{nm}\\)</td></tr>`);

  // generate d_t and RBM information

  generateRBMCalculationResult(n, m, t, $resultList);

  // do energy calculation

  let calculatedEnergy = new Array(12);
  for (let p1 = 0; p1 < 12; p1++) {
    if (isMetal(p1ToP[p1]) !== isMetal(n, m)) {
      calculatedEnergy[p1] = -1;
      continue;
    }
    try {
      calculatedEnergy[p1] = getEnergy(Dt(n, m, t), Theta(n, m), p1ToP[p1], t, isMetal(n, m) ? p1 % 2 - 1 : Mod(n, m))
        .toFixed(3).toString();
    }
    catch (err) {
      calculatedEnergy[p1] = -1;
    }
  }

  // apply results to plot

  let validResultNumber = 0;

  for (let p1 = 0; p1 < 12; p1 += 2) {

    // assert that there are results for both P1 = 2k and (2k + 1).
    // note that for (9,7) the S66 doesn't work due to too small d_t which
    // caused 1st derivative issue, but S55 is valid.

    if (calculatedEnergy[p1] === -1 || calculatedEnergy[p1 + 1] === -1)
      continue;

    validResultNumber++;

    $resultList.append(
      $(`<tr><td>${p1Arr[p1]}</td><td>\\(${calculatedEnergy[p1]}\\ \\mathrm{eV}\\)</td></tr>`)
        .click(() => changeEdit(p1, calculatedEnergy[p1], calculatedEnergy[p1 + 1]))
        .css('cursor', 'pointer')
    ).append(
      $(`<tr><td>${p1Arr[p1 + 1]}</td><td>\\(${calculatedEnergy[p1 + 1]}\\ \\mathrm{eV}\\)</td></tr>`)
        .click(() => changeEdit(p1, calculatedEnergy[p1], calculatedEnergy[p1 + 1]))
        .css('cursor', 'pointer')
    );

    let inputParams = {
      type: t, // int
      p1: p1, // int
      p2: p1 + 1, // int
      val1: calculatedEnergy[p1], // empty-able str
      val2: calculatedEnergy[p1 + 1], // empty-able str
      rbm: '' // empty-able str
    };

    let plotParams = processOutput(getPlotParams(inputParams));
    let plotId = `calcPlot${Math.round(p1 / 2)}`;

    let $plot = $(`
      <div class="math calc-plot-container" 
           oncontextmenu="return false" onmousedown="return false">
        <div class="row">
          <div class="col-lg-offset-2 col-md-offset-6 rbmAxisLabel">
            \\(\\omega_{\\mathrm{RBM}}\\ (\\mathrm{cm^{-1}})\\)
          </div>
        </div>
        <br />
        <div class="row" style="position: relative;">
          <div class="yAxisLabel">${plotParams.yAxisLabel}</div>
          <div id="${plotId}" style="width: 400px; height: 290px; font-family: 'Times New Roman', serif;"
               class="col-md-offset-1 col-xs-offset-1"></div>
        </div>
        <div class="row">
          <div class="col-lg-offset-2 col-md-offset-5 xAxisLabel">
               ${plotParams.xAxisLabel}
          </div>
        </div>
      </div>
    `);

    $plotList.append($plot);
    drawPlot(plotId, plotParams);
  }

  if (validResultNumber === 0) {
    invokeError();
  }

  MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
  return false;
}

function generateRBMCalculationResult(n, m, t, $resultList) { // separated function to reduce complexity

  let isAirSuspended = (t === 0);
  let editRBM = (e) => $('#edRBM').val(e);
  if (isAirSuspended) {
    let rbmAS = dt2RBM(Dt(n, m, t), isMetal(n, m) ? 2 : 0, t).toFixed(1).toString();
    $resultList.append(
      $(`
        <tr>
            <td>\\(\\omega_\\mathrm{RBM}\\ ${isMetal(n, m) ? "(p=3)" : "(p=1,2)"} \\)</td>
            <td>\\( ${rbmAS} \\ \\mathrm{cm^{-1}}\\)</td>
        </tr>
      `)
        .click(() => editRBM(rbmAS))
        .css('cursor', 'pointer')
    );
  }

  let rbmGeneral = dt2RBM(Dt(n, m, t), isAirSuspended ? 3 : 0, t).toFixed(1).toString();
  $resultList.append(
    $(`
      <tr>
          <td>\\(\\omega_\\mathrm{RBM}\\ ${isAirSuspended ? "(p>3)" : ""} \\)</td>
          <td>\\( ${rbmGeneral} \\ \\mathrm{cm^{-1}}\\)</td>
      </tr>
    `)
      .click(() => editRBM(rbmGeneral))
      .css('cursor', 'pointer')
  );
}
