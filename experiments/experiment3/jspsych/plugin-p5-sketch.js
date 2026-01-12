var jsP5sketch = (function (jspsych) {
  "use strict";

  const info = {
		name: 'p5sketch',
		parameters: {
			  size: {
        type: jspsych.ParameterType.FLOAT,
        pretty_name: "size",
        default: 20,
      }
		}
	}

  /**
   * **P5 plugin**
   *
   * A basic template for a p5-based trial
   *
   * @author MATAN MAZOR
   * @see {@link https://DOCUMENTATION_URL DOCUMENTATION LINK TEXT}
   */
  class p5Plugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    trial(display_element, trial) {

      //open a p5 sketch
      let sketch = (p) => {

        const du = p.min([window.innerWidth, window.innerHeight, 600])*7/10 //drawing unit

        //sketch setup
        p.setup = () => {
          p.createCanvas(window.innerWidth, window.innerHeight);
          p.fill(255); //white
          trial.response  = NaN;
          trial.RT = Infinity;
          window.start_time=p.millis();

        }

        p.draw = () => {
          if (p.millis()-window.start_time < trial.RT) {
            p.background(128); //gray
            p.fill(0)
            p.translate(p.width/2,p.height/2)
            let x1 = 100 * p.noise(0.005 * p.frameCount);
            let y1 = 100 * p.noise(0.005 * p.frameCount + 10000);
            p.ellipse(x1,y1,trial.size);
            p.fill(255)
            let x2 = 100 * p.noise(0.005 * p.frameCount+20000);
            let y2 = 100 * p.noise(0.005 * p.frameCount + 30000);
            p.ellipse(x2,y2,trial.size/3);
          } else {
            p.remove()
            // end trial
            this.jsPsych.finishTrial(window.trial_data);
          }
        }

        p.keyReleased = () => {
          // it's only possible to query the key code once for each key press,
          // so saving it as a variable here:
          var key_code = p.keyCode
          var key = String.fromCharCode(key_code).toLowerCase();
          if (trial.RT==Infinity) {
            // only regard relevant key presses during the response phase
              trial.response = key;
              trial.RT = p.millis()-window.start_time;
              // data saving
              window.trial_data = {
                RT: trial.RT,
                response: trial.response
              };
            }
        }

    };


      let myp5 = new p5(sketch);
    }
  }
  p5Plugin.info = info;

  return p5Plugin;
})(jsPsychModule);
