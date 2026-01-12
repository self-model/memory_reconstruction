var jsCollision = (function (jspsych) {
  "use strict";

  const info = {
		name: 'p5sketch',
		parameters: {
			  balls_matrix: {
                type: jspsych.ParameterType.FLOAT,
                pretty_name: "ball parameter matrix ",
                default: [[100, 200, -2,-2,15,0,1000], [200, 100,2,2,15,500,1500]]
        },
        sound_interval: {
            type: jspsych.ParameterType.FLOAT,
                pretty_name: "sound interval",
                default: [0,10000]
        },
        trial_duration: {type: jspsych.ParameterType.FLOAT,
        default: 10000},
        draw_occluders: {type: jspsych.ParameterType.BOOL, default: true}
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
  class collisionPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    trial(display_element, trial) {

      //open a p5 sketch
      let sketch = (p) => {

        const du = p.min([window.innerWidth, window.innerHeight, 600])*7/10 //drawing unit



        class Ball {
            constructor(parameters) {
              this.position = new p5.Vector(parameters[0], parameters[1]);
              this.velocity = new p5.Vector(parameters[2], parameters[3]);
              this.r = parameters[4];
              this.m = parameters[4] * 0.1;
              this.appear = parameters[5];
              this.disappear = parameters[6];
            }
            update() {
              this.position.add(this.velocity);
            }

            checkBoundaryCollision() {
              if (this.position.x > p.width - this.r) {
                this.position.x = p.width - this.r;
                this.velocity.x *= -1;
              } else if (this.position.x < this.r) {
                this.position.x = this.r;
                this.velocity.x *= -1;
              } else if (this.position.y > p.height - this.r) {
                this.position.y = p.height - this.r;
                this.velocity.y *= -1;
              } else if (this.position.y < this.r) {
                this.position.y = this.r;
                this.velocity.y *= -1;
              }
            }

            checkCollision(other) {
              // Get distances between the balls components
              let distanceVect = p5.Vector.sub(other.position, this.position);

              // Calculate magnitude of the vector separating the balls
              let distanceVectMag = distanceVect.mag();

              // Minimum distance before they are touching
              let minDistance = this.r + other.r;

              if (distanceVectMag < minDistance) {
                console.log(trial.sound_interval)
                if (p.millis()-window.start_time > trial.sound_interval[0] & p.millis()-window.start_time < trial.sound_interval[1]) {
                    window.hitSound.play();
                }
                let distanceCorrection = (minDistance - distanceVectMag) / 2.0;
                let d = distanceVect.copy();
                let correctionVector = d.normalize().mult(distanceCorrection);
                other.position.add(correctionVector);
                this.position.sub(correctionVector);

                // get angle of distanceVect
                let theta = distanceVect.heading();
                // precalculate trig values
                let sine = p.sin(theta);
                let cosine = p.cos(theta);

                /* bTemp will hold rotated ball this.positions. You
                 just need to worry about bTemp[1] this.position*/
                let bTemp = [new p5.Vector(), new p5.Vector()];

                /* this ball's this.position is relative to the other
                 so you can use the vector between them (bVect) as the
                 reference point in the rotation expressions.
                 bTemp[0].this.position.x and bTemp[0].this.position.y will initialize
                 automatically to 0.0, which is what you want
                 since b[1] will rotate around b[0] */
                bTemp[1].x = cosine * distanceVect.x + sine * distanceVect.y;
                bTemp[1].y = cosine * distanceVect.y - sine * distanceVect.x;

                // rotate Temporary velocities
                let vTemp = [new p5.Vector(), new p5.Vector()];

                vTemp[0].x = cosine * this.velocity.x + sine * this.velocity.y;
                vTemp[0].y = cosine * this.velocity.y - sine * this.velocity.x;
                vTemp[1].x = cosine * other.velocity.x + sine * other.velocity.y;
                vTemp[1].y = cosine * other.velocity.y - sine * other.velocity.x;

                /* Now that velocities are rotated, you can use 1D
                 conservation of momentum equations to calculate
                 the final this.velocity along the x-axis. */
                let vFinal = [new p5.Vector(), new p5.Vector()];

                // final rotated this.velocity for b[0]
                vFinal[0].x =
                  ((this.m - other.m) * vTemp[0].x + 2 * other.m * vTemp[1].x) /
                  (this.m + other.m);
                vFinal[0].y = vTemp[0].y;

                // final rotated this.velocity for b[0]
                vFinal[1].x =
                  ((other.m - this.m) * vTemp[1].x + 2 * this.m * vTemp[0].x) /
                  (this.m + other.m);
                vFinal[1].y = vTemp[1].y;

                // hack to avoid clumping
                bTemp[0].x += vFinal[0].x;
                bTemp[1].x += vFinal[1].x;

                /* Rotate ball this.positions and velocities back
                 Reverse signs in trig expressions to rotate
                 in the opposite direction */
                // rotate balls
                let bFinal = [new p5.Vector(), new p5.Vector()];

                bFinal[0].x = cosine * bTemp[0].x - sine * bTemp[0].y;
                bFinal[0].y = cosine * bTemp[0].y + sine * bTemp[0].x;
                bFinal[1].x = cosine * bTemp[1].x - sine * bTemp[1].y;
                bFinal[1].y = cosine * bTemp[1].y + sine * bTemp[1].x;

                // update balls to screen this.position
                other.position.x = this.position.x + bFinal[1].x;
                other.position.y = this.position.y + bFinal[1].y;

                this.position.add(bFinal[0]);

                // update velocities
                this.velocity.x = cosine * vFinal[0].x - sine * vFinal[0].y;
                this.velocity.y = cosine * vFinal[0].y + sine * vFinal[0].x;
                other.velocity.x = cosine * vFinal[1].x - sine * vFinal[1].y;
                other.velocity.y = cosine * vFinal[1].y + sine * vFinal[1].x;
              }
            }

            display() {
              p.noStroke();
              p.fill(204);
              p.ellipse(this.position.x, this.position.y, this.r * 2, this.r * 2);
            }
          }

          let balls = [];
          trial.balls_matrix.forEach((balls_vec)=>
            {
                balls.push(new Ball(balls_vec))
            }
          )
          console.log(balls);

        //sketch setup

        window.frame_number=0;

        p.preload = () => {
            window.hitSound = p.loadSound('assets/hit_short.mp3');
            window.beepSound = p.loadSound('assets/3beep.wav');
        }

        p.setup = () => {
          p.createCanvas(400, 300);
          p.rectMode(p.CENTER)
          window.start_time=p.millis();
        }

        p.draw = () => {
          p.fill(255); //white
          if (p.millis()-window.start_time < trial.trial_duration) {
            if (window.frame_number==0) {
              window.beepSound.play([],[],0)
            }
            window.frame_number++
            p.background(p.color('#41ab34'));
            let visible_balls = balls.filter(function(ball) {return(p.millis()-window.start_time>ball.appear & p.millis()-window.start_time<ball.disappear)})
            visible_balls.forEach((ball, i_ball)=>{
                ball.update()
                ball.display();
                ball.checkBoundaryCollision();
                visible_balls.slice(i_ball+1).forEach((other)=>{ball.checkCollision(other)});
           })
          } else {
            p.remove()
            // end trial
            this.jsPsych.finishTrial(window.trial_data);
          }

        // draw occluders
        if (trial.draw_occluders) {
          p.push()
          p.rotate(p.PI/4)
          p.fill(0)
          p.rect(0,0,p.width*1.9,p.height*2)
          p.pop()
        }
        }

    };


      let myp5 = new p5(sketch);
    }
  }
  collisionPlugin.info = info;

  return collisionPlugin;
})(jsPsychModule);
