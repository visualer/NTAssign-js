
if (!Supports.arrow || !Supports.templateString || !Supports.letConst) {
    document.write("<div id=\"es6Dimmer\" class=\"modal fade\" role=\"dialog\" style=\"top: 30%;\" aria-hidden=\"true\">" +
        "<div class=\"modal-dialog\"><div class=\"modal-content\"><div class=\"modal-body\">" +
        "<h3 style=\"text-align: center;\">" +
        "Your browser doesn't support ECMAScript 6 (ES2015), and the program can't work properly." +
        "<br /><br /> IE-based browsers are deprecated now. " +
        "Using Edge, Chrome, Firefox will be better.</h3></div><div class=\"modal-footer\">" +
        "<a type=\"button\" href=\"https://www.google.com/chrome/\" class=\"btn btn-primary\" >Download Chrome</a>" +
        "<a type=\"button\" href=\"https://www.firefox.com.cn/\" class=\"btn btn-primary\" >Download Firefox</a>" +
        "</div></div></div></div>");
    $("#es6Dimmer").modal({backdrop: "static"});
}
