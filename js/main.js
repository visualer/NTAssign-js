
function validate(form) {
    let $hint = $("#hint");
    if (form.Val1.value === "" && form.Val2.value === "" ||
        form.Val1.value === "" && form.RBM.value === "" ||
        form.Val2.value === "" && form.RBM.value === "") {
        $hint.addClass("alert-danger");
        $hint.html("<span class=\"glyphicon glyphicon-exclamation-sign\" " +
            "aria-hidden=\"true\"></span> At least 2 values are required.");
        return false;
    }
    else {
        let val1_ = parseInt(form.Val1.value);
        let val2_ = parseInt(form.Val2.value);
        let rbm_ = parseInt(form.RBM.value);
        if (!isNaN(val1_) && (val1_ < 0 || val1_ > 4) ||
            !isNaN(val2_) && (val2_ < 0 || val2_ > 4) ||
            !isNaN(rbm_) && (rbm_ < 30 || rbm_ > 500)) {
            $hint.addClass("alert-danger");
            $hint.html("<span class=\"glyphicon glyphicon-exclamation-sign\" " +
                "aria-hidden=\"true\"></span> Please input valid value.");
            return false;
        }
        if ($("#slP1").selectpicker("val") === "") {
            $hint.addClass("alert-danger");
            $hint.html("<span class=\"glyphicon glyphicon-exclamation-sign\" " +
                "aria-hidden=\"true\"></span> Please select the type of transition energy.");
            return false;
        }
        $(".selectpicker").removeAttr("disabled");
        return true;
    }
}


function clearTitle() {
    $(".bootstrap-select").find("button").removeAttr("title");
}
