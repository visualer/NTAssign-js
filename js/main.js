
'use strict';

let urlParams;
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

    let n = parseInt(form.NCalc.value), m = parseInt(form.MCalc.value), t = type;
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
                </tr>`
            )
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