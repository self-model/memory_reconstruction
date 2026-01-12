jsPsych.plugins['testmouse'] = (function () {

        var plugin = {};

        plugin.info = {
            name: 'testmouse',
            parameters: {
                phase: {
                    type: jsPsych.plugins.parameterType.STRING,
                    pretty_name: 'Phase',
                    default: null,
                    description: 'Which phase of the experiment is it: "part1" or "part2"?'
                },
                left_word: {
                    type: jsPsych.plugins.parameterType.STRING,
                    pretty_name: 'Word 1',
                    default: null,
                    description: 'Word on the left hand side'
                },
                middle_word: {
                    type: jsPsych.plugins.parameterType.STRING,
                    pretty_name: 'Word 2',
                    default: null,
                    description: 'Word in the middle'
                },
                right_word: {
                    type: jsPsych.plugins.parameterType.STRING,
                    pretty_name: 'Word 3',
                    default: null,
                    description: 'Word on the right hand side'
                },
                left_number: {
                    type: jsPsych.plugins.parameterType.INT,
                    pretty_name: 'Number 1',
                    default: 0,
                    description: 'Number on the left hand side'
                },
                middle_number: {
                    type: jsPsych.plugins.parameterType.INT,
                    pretty_name: 'Number 2',
                    default: 0,
                    description: 'Number in the middle'
                },
                right_number: {
                    type: jsPsych.plugins.parameterType.INT,
                    pretty_name: 'Number 3',
                    default: 0,
                    description: 'Number on the right hand side'
                },
                is_show_trial: {
                    type: jsPsych.plugins.parameterType.BOOL,
                    pretty_name: 'Is Show Trial',
                    default: false,
                    description: 'In Part 2, when true, participants see the contents of the box.'
                },
                is_catch_trial: {
                    type: jsPsych.plugins.parameterType.BOOL,
                    pretty_name: 'Is Catch Trial',
                    default: false,
                    description: 'In Part 2, when true, participants see the contents of the box.'
                },
                trial_num: {
                    type: jsPsych.plugins.parameterType.INT,
                    pretty_name: 'Trial Number',
                    default: 0,
                    description: 'Trial number'
                },
                progress: {
                    type: jsPsych.plugins.parameterType.FLOAT,
                    pretty_name: 'Progress',
                    default: 0,
                    description: 'Trial progress for the progress bar (0 to 1).'
                },
                correct_choice_position: {
                    type: jsPsych.plugins.parameterType.STRING,
                    pretty_name: 'Correct Choice Position',
                    default: null,
                    description: 'The position of the gems ("left", "middle", or "right").'
                },
                part1_response_position: {
                    type: jsPsych.plugins.parameterType.STRING,
                    pretty_name: 'Part 1 Response Position',
                    default: null,
                    description: 'For Part 2, the response the participant gave in Part 1.'
                },
                rubyposition: {
                    type: jsPsych.plugins.parameterType.STRING,
                    pretty_name: 'Ruby Position',
                    default: null,
                    description: 'Which position holds rubies if correct.'
                },
                emeraldposition: {
                    type: jsPsych.plugins.parameterType.STRING,
                    pretty_name: 'Emerald Position',
                    default: null,
                    description: 'Which position holds emeralds if correct.'
                },
                stoneposition: {
                    type: jsPsych.plugins.parameterType.STRING,
                    pretty_name: 'Stone Position',
                    default: null,
                    description: 'Which position always holds stones'
                },
                feedback_duration: {
                    type: jsPsych.plugins.parameterType.INT,
                    pretty_name: 'Feedback Duration',
                    default: 500,
                    description: 'How long to wait before showing full feedback in Part 1.'
                },
                current_score: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Current Score',
                default: 0,
                description: 'The cumulative score from previous trials.'
            }
            }
        }

        plugin.trial = function (display_element, trial) {
            display_element.innerHTML = '';
            const canvas_container = document.createElement("div");

            display_element.appendChild(canvas_container);

            let sketch = function (p) {
                // variables
                let State = 'waiting';
                let mouse_log = { x: [], y: [], t: [], universal_x: [], universal_y: [] };
                let click_log = { choice: null, rt: null, choice_position: null };
                let startTime;
                let continue_button_dims;
                let boxes = [];
                let images = {};
                const positions = ['left', 'middle', 'right'];
                let chose_gems = false;
                let chose_other = false;
                let chose_onlystones = false;
                let score_for_this_trial = trial.current_score;

                // colors used for experiment
                const colors = {
                    background: p.color(241, 245, 249),
                    box_default: p.color(255),
                    text: p.color(51, 65, 85),
                    progress_bar_bg: p.color(226, 232, 240),
                    progress_bar_fill: p.color(37, 99, 235),
                    feedback_ruby: p.color(239, 68, 68),
                    feedback_emerald: p.color(34, 197, 94),
                    feedback_incorrect: p.color(0)
                };

                // preload images
                p.preload = function () {
                    images.ruby = p.loadImage('assets/ruby.png');
                    images.emerald = p.loadImage('assets/emerald.png');
                    images.stone = p.loadImage('assets/stone.png');
                };

                // setup 
                p.setup = function () {
                    p.createCanvas(p.windowWidth, p.windowHeight).parent(canvas_container);
                    
                    p.textFont('Inter');
                    p.frameRate(60);
                    setupStimuli();
                    startTime = p.millis();
                };

                // create containers for stimuli
                function setupStimuli() {
                    const box_width = 180;
                    const box_height = 120;
                    const total_width = 540+64;

                    const gap = (total_width - 3 * box_width) / 2;

                    const start_x = (p.width - total_width) / 2;
                    const y = p.height / 3;
                    const words = [trial.left_word, trial.middle_word, trial.right_word];
                    const numbers = [trial.left_number, trial.middle_number, trial.right_number];
                    for (let i = 0; i < 3; i++) {
                        boxes.push({ x: start_x + i * (box_width + gap), y: y, w: box_width, h: box_height, word: words[i], number: numbers[i], position: positions[i] });
                    }
                    continue_button_dims = { x: p.width / 2 - 75, y: y + box_height + 250, w: 150, h: 50 };
                }

                // draw 
                p.draw = function () {
                    p.background(colors.background);
                    logMouse();
                    drawProgressBar();
                    drawScoreBoard();
                    drawBoxes();

                    if (trial.phase === 'part1') {
                        if (State === 'feedback' || State === 'finished') {
                            drawFeedbackText();
                        }
                        if (State === 'finished') {
                            drawContinueButton();
                        }
                    }
                
                    let is_interactive_element_hovered = false;

                    if (State === 'waiting') {
                        for (const box of boxes) {
                            if (p.mouseX > box.x && p.mouseX < box.x + box.w && p.mouseY > box.y && p.mouseY < box.y + box.h) {
                                is_interactive_element_hovered = true;
                                break;
                            }
                        }
                    } else if (State === 'finished' && trial.phase === 'part1') {
                        const btn = continue_button_dims;
                        if (p.mouseX > btn.x && p.mouseX < btn.x + btn.w && p.mouseY > btn.y && p.mouseY < btn.y + btn.h) {
                            is_interactive_element_hovered = true;
                        }
                    }

                    if (is_interactive_element_hovered) {
                        p.cursor('pointer');
                    } else {
                        p.cursor(p.ARROW);
                    }
                    
                };

                // convert coordinates to universal coordinates regardless of screen size
                // (0,0) at top left of screen
                function screen_coordinates_to_universal_coordinates(x, y) {
                    const universalX = x / p.displayWidth ;
                    const universalY = y / p.displayHeight ;
                    return { x: universalX, y: universalY };
                }

                function screen_coordinates_to_universal_coordinates(x, y) {
                    const leftBox = boxes[0];
                    const rightBox = boxes[2];

                    const boxX = leftBox.x;
                    const boxY = leftBox.y;

                    const box_width = 180;
                    const box_height = 120;
                    const total_width = 540+64;

                    const gap = (total_width - 3 * box_width) / 2;
                    
                    const translatedX = (x - boxX)/(box_width*3 + gap);
                    const translatedY = (y - boxY)/box_height;

                    return { x: translatedX, y: translatedY };
                }

                // function for recording mouse movements
                function logMouse() {
                    if (p.frameCount > 1) {
                        const universal_coordinates = screen_coordinates_to_universal_coordinates(p.mouseX, p.mouseY);

                        mouse_log.x.push(p.mouseX);
                        mouse_log.y.push(p.mouseY);

                        mouse_log.universal_x.push(universal_coordinates.x);
                        mouse_log.universal_y.push(universal_coordinates.y);

                        //console.log('raw pixels: ', p.mouseX, p.mouseY)
                        //console.log('universal coordinates: ', universal_coordinates)

                        mouse_log.t.push(p.millis() - startTime);
                    }
                }
                

                // drawing progress bar
                function drawProgressBar() {
                    const bar_width = 604;
                    const bar_height = 10;
                    const x = (p.width - bar_width) / 2;
                    const y = p.height / 3 - 80;
                    p.push();
                    p.noStroke();
                    p.fill(colors.progress_bar_bg);
                    p.rect(x, y, bar_width, bar_height, 5);
                    p.fill(colors.progress_bar_fill);
                    p.rect(x, y, bar_width * trial.progress, bar_height, 5);
                    p.pop();
                }

                // drawing boxes 
                function drawBoxes() {
                    for (let i = 0; i < boxes.length; i++) {
                        const box = boxes[i];
                        const is_chosen = (i === click_log.choice);

                        const is_correct = (box.position === trial.correct_choice_position)

                        
                        
                        p.push();
                            p.strokeWeight(3);
                            let border_color = colors.box_default;
                            let show_content = false;
                            if (trial.phase === 'part1') {
                                if (State === 'feedback' && is_chosen) {
                                    border_color = getBorderColor(is_correct);
                                    show_content = true;
                                }
                                if (State === 'finished') {
                                    border_color = getBorderColor(is_correct);
                                    show_content = true;
                                }
                            } else {
                                if (trial.is_show_trial) {
                                    border_color = getBorderColor(is_correct);
                                    show_content = true;
                                }
                            }
                            p.stroke(border_color);
                            p.fill(colors.box_default);
                            p.rect(box.x, box.y, box.w, box.h);
                            p.noStroke();
                            p.fill(colors.text);
                            p.textAlign(p.CENTER, p.CENTER);
                            p.textSize(24);
                            p.textStyle(p.BOLD);
                            const centerX = box.x + box.w / 2;
                            const centerY = box.y + box.h / 2;
                            p.text(box.word, centerX, centerY - 14);
                            p.text(`(${box.number})`, centerX, centerY + 14);
                            p.textStyle(p.NORMAL);
                            if (show_content) {
                                let img_to_draw = is_correct ? (box.position === trial.rubyposition ? images.ruby : images.emerald) : images.stone;
                                drawBoxContent(box, img_to_draw);
                            }
                        p.pop();
                    }
                }

                // function for getting the border color (red/green/black)
                function getBorderColor(is_correct) {
                    if (is_correct) {
                        return (trial.correct_choice_position === trial.rubyposition) ? colors.feedback_ruby : colors.feedback_emerald;
                    }
                    return colors.feedback_incorrect;
                }

                // function for drawing gems and stones
                function drawBoxContent(box, img) {
                    const img_size = 48;
                    const img_y_start = box.y + box.h + 5;
                    for (let i = 0; i < box.number; i++) {
                        p.image(img, box.x + box.w / 2 - img_size / 2, img_y_start + i * (img_size * 1), img_size, img_size);
                    }
                }
                
                // function for drawing the feedback text 
                function drawFeedbackText() {
                    const box = boxes[click_log.choice];
                    if (!box) return;
                    const is_correct = (box.position === trial.correct_choice_position);
                    let txt = is_correct ? `You earned ${box.number} gems!` : `Oh no, you got ${box.number} stones`;
                    let txt_color = is_correct ? getBorderColor(true) : colors.feedback_incorrect;
                    p.push();
                        p.noStroke();
                        p.fill(txt_color);
                        p.textSize(28);
                        p.textAlign(p.CENTER, p.TOP);
                        p.text(txt, p.width / 2, p.height / 3 - 40);
                    p.pop();
                }

                // continue button
                function drawContinueButton() {
                    p.push();
                        p.fill(colors.progress_bar_fill);
                        p.noStroke();
                        p.rect(continue_button_dims.x, continue_button_dims.y, continue_button_dims.w, continue_button_dims.h, 5);
                        p.fill(255);
                        p.textSize(18);
                        p.textAlign(p.CENTER, p.CENTER);
                        p.text("Continue", continue_button_dims.x + continue_button_dims.w / 2, continue_button_dims.y + continue_button_dims.h / 2);
                    p.pop();
                }

                // score board
                function drawScoreBoard() {
                    if (trial.phase !== 'part1') return;
                    const box_width = 150;
                    const box_height = 50;
                    const x = p.width - box_width - 20;
                    const y = 20;
                    p.push();
                    p.fill(255);
                    p.stroke(220);
                    p.rect(x, y, box_width, box_height, 8);
                    p.fill(colors.text);
                    p.noStroke();
                    p.textSize(18);
                    p.textStyle(p.BOLD);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.text(`Points: ${score_for_this_trial}`, x + box_width / 2, y + box_height / 2);
                    p.pop();
                }


                p.mouseClicked = function () {
                    
                    if (State === 'waiting') {
                        
                        for (let i = 0; i < boxes.length; i++) {
                            const box = boxes[i];
                            
                            if (p.mouseX > box.x && p.mouseX < box.x + box.w && p.mouseY > box.y && p.mouseY < box.y + box.h) {

                                const choiceTime = p.millis();
                                click_log = {
                                    choice: i,
                                    rt: choiceTime - startTime,
                                    choice_position: positions[i],
                                    click_position_raw: [p.winMouseX, p.winMouseY],
                                    click_position_universal: screen_coordinates_to_universal_coordinates(p.winMouseX, p.winMouseY)
                                };

                                
                                if (trial.phase === 'part1') {
                                    const is_correct = (click_log.choice_position === trial.correct_choice_position);
                                    if (is_correct) {
                                        score_for_this_trial += box.number;
                                        chose_gems = true;
                                    }
                                    State = 'feedback';
                                    setTimeout(() => {
                                        State = 'finished';
                                    }, trial.feedback_duration);
                                } else { 
                                    State = 'finished';
                                    setTimeout(endTrial, 200);
                                }

                                
                                break;
                            }
                        }
                    }
                    // Handle clicks on the 'Continue' button after feedback is shown
                    else if (State === 'finished' && trial.phase === 'part1') {
                        if (p.mouseX > continue_button_dims.x && p.mouseX < continue_button_dims.x + continue_button_dims.w && p.mouseY > continue_button_dims.y && p.mouseY < continue_button_dims.y + continue_button_dims.h) {
                            endTrial();
                        }
                    }
                };

                // logging data
                function endTrial() {
                    p.noLoop();
                    p.remove();
                    const trial_data = {
                        ...trial, // phase, left/middle/right_word, left/middle/right_number, is_show_trial, is_catch_trial, trial_num, progress, correct_choice_position, part1_response_position, rubyposition, emeraldposition, stoneposition, feedback_duration, current_score
                        response: click_log.choice,
                        response_position: click_log.choice_position,
                        rt: click_log.rt,
                        mouse_log: mouse_log,
                        cumulative_score: score_for_this_trial,
                        is_consistent: (trial.phase === 'part2') ? (click_log.choice_position === trial.part1_response_position) : null,
                        chose_gems: chose_gems,
                        chose_onlystones: click_log.choice_position === trial.stoneposition,
                        chose_other: !(chose_gems || (click_log.choice_position === trial.stoneposition))
                    };
                    if (trial.phase === 'part2') {
                        trial_data.is_consistent = (click_log.choice_position === trial.part1_response_position);
                    }
                    display_element.innerHTML = '';
                    jsPsych.finishTrial(trial_data);
                }
            };
            let myp5 = new p5(sketch);
        };
    
        return plugin;
    
    })();