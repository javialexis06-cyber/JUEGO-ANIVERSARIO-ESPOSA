System.register(["./application.js"], function (_export, _context) {
  "use strict";

  var Application, canvas, $p, bcr, application;
  function topLevelImport(url) {
    return System["import"](url);
  }
  return {
    setters: [function (_applicationJs) {
      Application = _applicationJs.Application;
    }],
    execute: function () {
      canvas = document.getElementById('GameCanvas');
      $p = canvas.parentElement;
      bcr = $p.getBoundingClientRect();
      canvas.width = bcr.width;
      canvas.height = bcr.height;
      application = new Application();
      topLevelImport('cc').then(function (engine) {
        return application.init(engine);
      }).then(function () {
        return application.start().then(function(){ window.semillaMotor.avisar("listo"); });
      })["catch"](function (err) {
        document.getElementById("fallo").hidden=false; window.semillaMotor.avisar("error","No se pudo cargar PvZ 2. Revisa la conexión y pulsa Reintentar."); console.error(err);
      });
    }
  };
});