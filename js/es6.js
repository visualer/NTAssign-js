
var es6SupportFlag = Supports.arrow && Supports.templateString && Supports.letConst;

if (!es6SupportFlag)
  document.write("<script src=\"js/" + "lib/babel.min.js\"></script>");

["Energy.js", "Assign.js", "Plot.js", "main.js"].forEach(function (value) {
  document.write("<script " + (es6SupportFlag ? "" : "type=\"text/babel\" ") + "src=\"js/" + value + "\"></script>")
});

