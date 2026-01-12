jsPsych.plugins["findSquares"] = (function () {

	var plugin = {};

	plugin.info = {
		name: 'findSquares',

		parameters: {
			grid: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: "Grid",
				default: [

					['0', '0', '0', '0', '0', '0'],
					['0', '1', '0', '0', '0', '0'],
					['0', '1', '0', '0', '0', '0'],
					['0', '1', '0', '0', '0', '0'],
					['0', '1', '0', '0', '0', '0'],
					['0', '0', '0', '0', '0', '0']
				],
				description: "Grid. 0 means white, 1 is a hit."
			},
			cheat: {
				type: jsPsych.plugins.parameterType.BOOL,
				pretty_name: 'cheat',
				default: false,
				description: 'When true, participants see the position of the ships.'
			},
			end_screen_time: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'end screen time',
				default: 2000,
				description: 'For how many milliseconds is the end screen presented?'
			},
			draw_attention_to_instructions_time: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: 'draw attention to instructions time',
				default: 0,
				description: 'For how many milliseconds is will the instructions be flashing?'
			},
			already_clicked: {
				type: jsPsych.plugins.parameterType.INT,
				pretty_name: "Already clicked cells",
				default: [],
				description: "For half games. List of tuples of i,j that have been clicked. [] for fresh start."
			}
		}
	}

	plugin.trial = function (display_element, trial) {

		display_element.innerHTML = '';

		let sketch = function (p) {

			const du = p.min([window.innerWidth, window.innerHeight, 500]) * 7 / 10 //drawing unit
			const left_margin = p.round((window.innerWidth - du) / 2); // white space left to the grid
			const right_edge = left_margin + du;
			const top_margin = p.round((window.innerHeight - du) / 3);
			const square_size = Math.floor(du / trial.grid.length);
			const colors = {
				'white': p.color(255),
				'unknown': p.color(255, 230, 166),
				'black': p.color(0, 0, 0)
			}


			var grid_state = trial.grid.map(([...rest]) => rest.map(x => 'unknown'));

			// console.log(trial.already_clicked);

			var click_log = { i: [], j: [], t: [], hit: [], b: [] };
			var hover_log = { i: [], j: [], x: [], y: [], t: [] };
			const num_nonzero = trial.grid.flat().reduce((a, b) => a + (b == '0' ? 0 : 1), 0);
			const num_zero = trial.grid.flat().reduce((a, b) => a + (b == '0' ? 1 : 0), 0);
			window.round_points = trial.grid.flat().reduce((a, b) => a + (b == '0' ? 1 : 0), 0);
			window.pointsColor = 'rgb(0, 0, 0)'

			var hits = 0;;
			var last_click_time = p.millis()


			for (var i_click = 0; i_click < trial.already_clicked.length; i_click++) {
				i = trial.already_clicked[i_click][0];
				j = trial.already_clicked[i_click][1];
				value = trial.grid[i][j] == '0' ? 'white' : 'black'
				grid_state[i][j] = value;
				if (value == 'black') {
					hits++
				}
			}

			function grid_coordinates_to_screen_coordinates(i, j) {
				x = left_margin + j * square_size + Math.round(square_size / 2);
				y = top_margin + i * square_size + Math.round(square_size / 2);
				return ({ x: x, y: y })
			}

			function screen_coordinates_to_grid_coordinates(x, y) {
				i = Math.floor((y - top_margin) / square_size);
				j = Math.floor((x - left_margin) / square_size);
				return ({ i: i, j: j })
			}

			const origin = grid_coordinates_to_screen_coordinates(0, 0)
			const endpoint = grid_coordinates_to_screen_coordinates(trial.grid.length - 1, trial.grid.length - 1);

			function screen_coordinates_to_universal_coordinates(x, y) {
				new_x = (x - origin.x) / (endpoint.x - origin.x);
				new_y = (y - origin.y) / (endpoint.y - origin.y);
				return ({ x: new_x, y: new_y })
			}

			//sketch setup
			p.setup = function () {

				p.createCanvas(p.windowWidth, p.windowHeight);
				p.strokeWeight(0);
				p.frameRate(trial.frame_rate);
				p.rectMode(p.CENTER);
				p.imageMode(p.CENTER);
			}

			//organize everything in one sequence
			p.draw = function () {

				p.background(255);

				p.push()
				p.rectMode(p.CORNERS)
				p.fill(colors.unknown);
				p.noStroke()
				p.rect(left_margin+du*1.1,top_margin+du/3+15,left_margin+du*1.6,top_margin+du/3+41)
				p.textSize(15)
				p.textAlign(p.CENTER, p.CENTER)
				p.fill(0);
				p.strokeWeight(0)
				p.text(`Unclicked white squares:`,left_margin+du*1.1,top_margin+du/3,du/2);

				p.textSize(25);
				p.fill(window.pointsColor)
				p.text(`${window.round_points}`,
					left_margin+du*1.1,top_margin+du/3+30,du/2);

				p.pop();

				if (hits < num_nonzero | p.millis() - last_click_time < trial.end_screen_time) {

					for (var i = 0; i < trial.grid.length; i++) {
						for (var j = 0; j < trial.grid.length; j++) {
							xy = grid_coordinates_to_screen_coordinates(i, j);
							p.fill(colors[grid_state[i][j]]);
							p.stroke(127, 182, 177);
							p.strokeWeight(1)
							p.square(xy.x, xy.y, square_size);

							if (grid_state[i][j] == 'white') {
								console.log('white square', i, j);
								p.fill(255, 0, 0);
								p.textAlign(p.CENTER, p.CENTER);
								p.textSize(20);
								p.text('-1', xy.x, xy.y);
							}
						}
					}

					if (trial.cheat) {
						//mark ships with a cross
						for (var i = 0; i < trial.grid.length; i++) {
							for (var j = 0; j < trial.grid.length; j++) {
								if (trial.grid[i][j] != '0') {
									xy = grid_coordinates_to_screen_coordinates(i, j);
									p.line(xy.x - square_size / 2, xy.y - square_size / 2,
										xy.x + square_size / 2, xy.y + square_size / 2);
									p.line(xy.x + square_size / 2, xy.y - square_size / 2,
										xy.x - square_size / 2, xy.y + square_size / 2)
								}
							}
						};


					}

					p.push()

					if (hits < num_nonzero) {
						p.rectMode(p.CORNERS)
						p.textSize(20)
						p.textAlign(p.CENTER, p.CENTER)
						p.fill(0);
						p.strokeWeight(trial.strokeWeight || 0);
						trial.text = `Find the remaining ${num_nonzero-hits} black squares`
						p.text(trial.text, left_margin, top_margin - 45, du);

						if (trial.cheat) {
							// Description
							text = `Remember, your real task is to play like you did in the first round!`;
							p.text(text, left_margin, top_margin + du + 20, du);

							if (p.millis() < trial.draw_attention_to_instructions_time) {
								p.push()
								p.textSize(50);
								var red_value = 128 + p.sin(p.millis() / 200) * 127
								p.fill([255, 255 - red_value, 255 - red_value]);
								p.text('!', left_margin - 20, top_margin + du + 40, 20)
								p.pop()
							}
						}
						p.pop();


					} else {


						for (var i = 0; i < trial.grid.length; i++) {
							for (var j = 0; j < trial.grid.length; j++) {
								if (trial.grid[i][j] == '0') {
									xy = grid_coordinates_to_screen_coordinates(i, j);
									opacity = p.min(1, (p.millis() - last_click_time) / (trial.end_screen_time / 2));
									p.push()
									p.fill([(1 - opacity) * colors[grid_state[i][j]].levels[0] + (opacity) * colors['white'].levels[0],
									(1 - opacity) * colors[grid_state[i][j]].levels[1] + (opacity) * colors['white'].levels[1],
									(1 - opacity) * colors[grid_state[i][j]].levels[2] + (opacity) * colors['white'].levels[2]]);
									p.stroke(127, 182, 177, (1 - opacity) * 255);
									p.square(xy.x, xy.y, square_size);
									p.pop()
								}
							}
						}
					}
				}

				else { //trial ended
					p.remove()
					// data saving
					var trial_data = {
						grid: trial.grid,
						already_clicked: trial.already_clicked,
						click_log: click_log,
						hover_log: hover_log,
						final_grid_state: grid_state,
						num_clicks: click_log.t.length,
						cheat: trial.cheat,
						round_points: window.round_points,
						misses: window.misses

					};
					// end trial
					jsPsych.finishTrial(trial_data);

				}
				var cur_x = p.mouseX;
				var cur_y = p.mouseY;

				ij = screen_coordinates_to_grid_coordinates(cur_x, cur_y)
				hover_log.i.push(ij.i);
				hover_log.j.push(ij.j);

				xy = screen_coordinates_to_universal_coordinates(cur_x, cur_y);
				hover_log.x.push(xy.x);
				hover_log.y.push(xy.y);
			}

			p.mouseClicked = function () {
				ij = screen_coordinates_to_grid_coordinates(p.mouseX, p.mouseY)
				// click is on the board?
				if (ij.i >= 0 &
					ij.i < trial.grid.length &
					ij.j >= 0 &
					ij.j < trial.grid.length &
					hits < num_nonzero &
					grid_state[ij.i][ij.j] == 'unknown'
				) {
					if (trial.grid[ij.i][ij.j] == '0') {
						grid_state[ij.i][ij.j] = 'white';
						window.pointsColor = 'rgb(251, 0, 0)';
						window.round_points--
						window.misses++
						setTimeout(function () { window.pointsColor = 'rgb(0, 0, 0)'; }, 500);

					} else {
						grid_state[ij.i][ij.j] = 'black';
						hits += 1;
					}
					click_log.i.push(ij.i);
					click_log.j.push(ij.j);
					click_log.t.push(p.millis())
					click_log.hit.push((trial.grid[ij.i][ij.j]))
					last_click_time = p.millis();
				}

			}

		};

		// start sketch!
		let myp5 = new p5(sketch);

	}

	//Return plugin object which contains the trial
	return plugin;
})();
