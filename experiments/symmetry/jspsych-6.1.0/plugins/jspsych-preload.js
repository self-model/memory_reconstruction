jsPsych.plugins["preload"] = (function () {
  var plugin = {};

  plugin.info = {
    name: "preload",
    parameters: {
      images: {
        type: jsPsych.plugins.parameterType.IMAGE,
        array: true,
        default: [],
      }
    }
  };

  plugin.trial = function (display_element, trial, on_finish) {
    jsPsych.pluginAPI.preloadImages(trial.images, function () {
      on_finish();
    });
  };

  return plugin;
})();
