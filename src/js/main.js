
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

if ($body.hasClass("Step1")) {

  let $selectType = $("#slType");
  for (let i = 0; i < typeArr.length; i++)
    $selectType.append(`<option value="${i}">${typeArr[i]}</option>`);

  $selectType.selectpicker('val', 0)
    .selectpicker('refresh')
    .on("loaded.bs.select", clearTitle)
    .on('changed.bs.select', clearTitle);

} else if ($body.hasClass("Step2")) {

  let type = parseInt(urlParams['Type']);
  if (isNaN(type) || type > 5 || type < 0)
    location.href = "Step1.html";

  $("#title")[0].innerHTML += '<small>' + typeArr[type] + '</small>';
  $("#dataTables").find("table")[type].style.display = "";

  let $selectP1 = $("#slP1"), $selectP2 = $("#slP2"), $selectType = $("#slType");
  let $selectP1P2 = $("#slP1, #slP2");

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

  $selectType.selectpicker('val', type);
  $(".selectpicker").selectpicker('refresh');

  $("select").on("loaded.bs.select", clearTitle);
  $selectP1.on('changed.bs.select', function (e, index) {
    let i = index - 1;
    clearTitle(); // only when slP1 changes the title have to be cleared; only active select
    $selectP2.find("option").each(function () {
      let value = parseInt($(this).val());
      if (i % 2 === 0 && value === i + 1 || i % 2 === 1 && value === i - 1)
        $selectP2.selectpicker('val', value);
    });
  });

} else if ($body.hasClass("Step3")) {

  // check integrity
  for (let i of ['Type', 'P1', 'P2', 'Val1', 'Val2', 'RBM']) {
    if (urlParams[i] === undefined) {
      location.href = 'Step1.html';
      break;
    }
  }

  let params = {
    type: parseInt(urlParams['Type']), // int
    p1: parseInt(urlParams['P1']), // int
    p2: parseInt(urlParams['P2']), // int
    val1: urlParams['Val1'], // empty-able str
    val2: urlParams['Val2'], // empty-able str
    rbm: urlParams['RBM'] // empty-able str
  };

  let valueBetween = (xy, a, b) => (xy >= a || xy <= b);
  let val1_ = parseFloat(params.val1), val2_ = parseFloat(params.val2), rbm_ = parseFloat(params.rbm);
  let emptyNum = Number(isNaN(val1_)) + Number(isNaN(val2_)) + Number(isNaN(rbm_));
  if (emptyNum >= 2 || isNaN(params.type) || isNaN(params.p1) || isNaN(params.p2) ||
    !isNaN(val1_) && (val1_ < 0 || val1_ > 4) || !isNaN(val2_) && (val2_ < 0 || val2_ > 4) ||
    !isNaN(rbm_) && (rbm_ < 30 || rbm_ > 500) || !valueBetween(params.type, 0, 5) ||
    !valueBetween(params.p1, 0, 11) || !valueBetween(params.p2, 0, 11)
  )
    location.href = 'Step1.html';

  // end validation

  $("#title")[0].innerHTML += '<small>' + typeArr[params.type] + '</small>';

  let plotParams = processOutput(getPlotParams(params));

  $("#resultDiv")
    .addClass(plotParams.ar !== AssignResult.error ? "alert-success" : "alert-danger")
    .html(plotParams.resultString);
  $("#yAxisLabel").html(plotParams.yAxisLabel);
  $("#xAxisLabel").html(plotParams.xAxisLabel);
  $("#" + plotParams.pointType + "Legend").css("display", "");
  if (plotParams.bluePoint !== null)
    $("#blueLegend").css("display", "");

  $(drawPlot("plot-placeholder", plotParams));

}





function clearTitle() { // used in Step1 and Step2

    $(".bootstrap-select").find("button").removeAttr("title");
}

function validate(form) { // used in Step2

    let $hint = $("#hint");
    let invokeError = (msg) => {
        $hint.addClass("alert-danger")
            .html("<span class=\"glyphicon glyphicon-exclamation-sign\" " +
                "aria-hidden=\"true\"></span> " + msg);
        return false;
    };
    let val1_ = parseInt(form.Val1.value);
    let val2_ = parseInt(form.Val2.value);
    let rbm_ = parseInt(form.RBM.value);
    let emptyNum = Number(isNaN(val1_)) + Number(isNaN(val2_)) + Number(isNaN(rbm_));
    if (emptyNum >= 2) return invokeError("At least 2 values are required.");
    else {
        if (!isNaN(val1_) && (val1_ < 0 || val1_ > 4) ||
            !isNaN(val2_) && (val2_ < 0 || val2_ > 4) ||
            !isNaN(rbm_) && (rbm_ < 30 || rbm_ > 500))
            return invokeError("Please input valid value.");
        if ($("#slP1").selectpicker("val") === "")
            return invokeError("Please select the type of transition energy.");

        $(".selectpicker").removeAttr("disabled");
        return true;
    }
}

function changeEdit(mainP1, val1, val2) { // used in Step2

    $("#slP1").selectpicker('val', mainP1);
    $("#slP2").selectpicker('val', mainP1 + 1);
    $("#edVal1").val(val1);
    $("#edVal2").val(val2);
}

function calculate(form) { // used in Step2

    let n = parseInt(form.NCalc.value), m = parseInt(form.MCalc.value), t = parseInt(urlParams['Type']);
    if (n < m) [n, m] = [m, n];
    if (isNaN(n) || isNaN(m) || n <= 6 || m <= 0) return;

    let $result = $("<tbody></tbody>");
    $result.append(`<tr><td>\\(d_t\\)</td><td>\\( ${Dt(n, m, t).toFixed(3).toString()} \\ \\mathrm{nm}\\)</td></tr>`);


    let isAirSuspended = (t === 0);
    let editRBM = (e) => $('#edRBM').val(e);
    if (isAirSuspended) {

        let rbmAS = dt2RBM(Dt(n, m, t), isMetal(n, m) ? 2 : 0, t).toFixed(1).toString();

        $result.append(
            $(`
                <tr>
                    <td>\\(\\omega_\\mathrm{RBM}\\ ${isMetal(n, m) ? "(p=3)" : "(p=1,2)"} \\)</td>
                    <td>\\( ${rbmAS} \\ \\mathrm{cm^{-1}}\\)</td>
                </tr>
            `)
                .click(() => editRBM(rbmAS))
                .css("cursor", "pointer")
        );
    }

    let rbmGeneral = dt2RBM(Dt(n, m, t), isAirSuspended ? 3 : 0, t).toFixed(1).toString();
    $result.append(
        $(`
            <tr>
                <td>\\(\\omega_\\mathrm{RBM}\\ ${isAirSuspended ? "(p>3)" : ""} \\)</td>
                <td>\\( ${rbmGeneral} \\ \\mathrm{cm^{-1}}\\)</td>
            </tr>
        `)
            .click(() => editRBM(rbmGeneral))
            .css("cursor", "pointer")
    );


    let keyArr = [];
    let valArr = [];
    for (let i = 0; i < 12; i++) {
        try {
            if (isMetal(p1ToP[i]) !== isMetal(n, m))
                continue;
            let val = getEnergy(Dt(n, m, t), Theta(n, m), p1ToP[i], t, isMetal(n, m) ? i % 2 - 1 : Mod(n, m))
                .toFixed(3).toString();
            keyArr.push(i);
            valArr.push(val);
        } catch (err) {
            // pass
        }
    }
    for (let i = 0; i < keyArr.length; i++) {
        let i1 = (i % 2 === 0 ? i : i - 1);

        $result.append(
            $(`<tr><td>${p1Arr[keyArr[i]]}</td><td>\\(${valArr[i]}\\ \\mathrm{eV}\\)</td></tr>`)
                .click(() => changeEdit(keyArr[i1], valArr[i1], valArr[i1 + 1]))
                .css("cursor", "pointer")
        );
    }

    let $calcResult = $("#calcResult");
    $calcResult.html(
        $("<table class=\"table table-striped math\" id=\"calcResultList\"></table>").append($result)
    );

    for (let i = 0; i < keyArr.length; i += 2) {
        let params = {
            type: t, // int
            p1: keyArr[i], // int
            p2: keyArr[i + 1], // int
            val1: valArr[i], // empty-able str
            val2: valArr[i + 1], // empty-able str
            rbm: "" // empty-able str
        };
        let plotParams = processOutput(getPlotParams(params));
        let plotId = "calcPlot" + Math.round(i / 2);
        let containerId = "calcPlotContainer" + Math.round(i / 2);


        let $container = $("#containerTemplate").clone();
        $container.css("display", "").attr("id", containerId);
        $container.find("#plotPlaceholder").attr("id", plotId);
        $calcResult.append($container);
        $container.find(".yAxisLabel").html(plotParams.yAxisLabel);
        $container.find(".xAxisLabel").html(plotParams.xAxisLabel);
        $container.find(".rbmAxisLabel").html("\\(\\omega_{\\mathrm{RBM}}\\ (\\mathrm{cm^{-1}})\\)");
        drawPlot(plotId, plotParams);
    }

    MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
    return false;
}
