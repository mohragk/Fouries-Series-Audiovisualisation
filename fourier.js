let waveShape = [];
let contourShape = [];
let time = 0;
let iterations = 30;
let old_iterations = 0;
let frequency = 0.8;
let audioFrequency = 440;
let volume = 0.1;
let angle = 0;
let old_angle = angle;
let deltaAngle = 0;

let shouldRenderSquare = true;
let zoom = 3; // between 1 and 6
let radius = 75.0;
let centreCircle;
let mousedown = false;

let typeText;
let fontSize = 14;
let playBtn;
let shouldStartPlaying = false;

let shouldBeHand = false;
let shouldBeNoCursor = false;

var freqSlider, iterSlider, scalerSlider, volumeSlider, typeSlider;

var audioContext = null;
var gainNode;
var osc;

var waveType = {
    SQUARE: 0,
    SAW: 1,
    TRIANGLE: 2
};


var waveObjects = [];

var currentType = waveType.SQUARE;
var oldType = -1;


function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);

    fontSize = windowHeight / 60;

    let size = 100;
    let v = createVector(width - size, height - size)
    playBtn = new playButton(v, 100);

    centreCircle = createVector(0, 0);

    radius = width / 8;

    waveObjects[0] = new squareWaveObject("SQUARE");
    waveObjects[1] = new sawWaveObject("SAW");
    waveObjects[2] = new triangleWaveObject("TRIANGLE");

    initSliders();
    initAudio();
    
    frequency = freqSlider.value() / 100;

}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    radius = width / 8;

    //resetAudio();
}



function draw() {
    background(15);

    drawText();

    drawPlayButton();


    let margin = iterSlider.y;
    let trans_x = width * 0.25;
    let trans_y = height * 0.5 + margin;

    centreCircle.x = trans_x;
    centreCircle.y = trans_y;
    translate(width * 0.25, height * 0.5 + margin);


    stroke(30);
    line(0, 0, width, 0);

    updateSliders();

    drawWave();




    updateTime();

    updateAudio();

    updateCursor();
}

function updateTime() {
    if (playBtn.isPlaying)
        time += getPhaseInc(frequency * 10);

    while (time >= 2 * PI)
        time -= 2 * PI;
}

function overrideAngle(p) {
    let x_comp = mouseX - p.x;
    let y_comp = p.y - mouseY;
    let angle = atan2(y_comp, x_comp);

    if (angle < 0)
        angle = (2 * PI) + angle;

    return (2 * PI) - angle;
}


function drawPlayButton() {
    let size = 100;
    let v = createVector(width - size, height - size)
    playBtn.setPosition(v);
    playBtn.mouseOver(mouseX, mouseY);
    playBtn.render();
}

function initSliders() {
    freqSlider = createSlider(1, 40, 8, 0);
    freqSlider.position(20, 10);
    freqSlider.input(updateSliderFrequency);

    iterSlider = createSlider(1, 64, 2);
    iterSlider.position(20, 40);
    iterSlider.input(imm_updateAudioWaveform);
    iterations = iterSlider.value();
    //iterSlider.input(updateSliderIterations);


    volumeSlider = createSlider(0, 30, 6, 0);
    volumeSlider.position(
        freqSlider.x + freqSlider.width + 140,
        freqSlider.y
    )
    volumeSlider.input(updateSliderVolume);

    scalerSlider = createSlider(0, 2, 2);
    scalerSlider.position(
        volumeSlider.x,
        volumeSlider.y + 30
    );
    scalerSlider.input(updateSliderFrequency);

    typeSlider = createSlider(0, 2, 0);
    typeSlider.position(
        20, height - 40
    );
    typeSlider.input(changeType);
}


function updateSliders() {
    iterations = iterSlider.value();
}


//AUDIO
function getOrCreateContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
  
}

function initAudio() {
    getOrCreateContext();
    gainNode = audioContext.createGain();
    osc = audioContext.createOscillator();

    let mult = pow(10, 2);
    let f = frequency * mult;
    osc.frequency.setTargetAtTime(f, audioContext.currentTime, 0.05);
    osc.type = 'square';
    osc.start();

    gainNode.gain.value = 0;
    gainNode.gain.setTargetAtTime(0.02, audioContext.currentTime, 0.05);

    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);
    // moogLPF.connect(audioContext.destination);



    imm_updateAudioWaveform();
    print("audio initialized");
}


function resetAudio() {
    osc.stop();

    gainNode.disconnect();
    osc.disconnect();

    audioContext = new AudioContext();
    gainNode = audioContext.createGain();
    osc = audioContext.createOscillator();



    gainNode.gain.value = 0.22;

    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    let mult = pow(10, 2);
    osc.frequency.value = frequency * mult;
    osc.type = 'square';
    osc.start(0);

    print("audio reset");

}

function changeVolume(vol) {
    
    gainNode.gain.setTargetAtTime(vol, audioContext.currentTime, 0.1);
}

function changeFrequency(f) {
    osc.frequency.setTargetAtTime(f, audioContext.currentTime, 0.01);
}



function updateSliderFrequency() {
    let mult = pow(10, scalerSlider.value());
    audioFrequency = (this.value() / 10) * mult;
    frequency = freqSlider.value() / 100;
    
    changeFrequency(audioFrequency);
}

function updateSliderVolume() {
    var val = this.value() / 100;
    changeVolume(val);
}


function changeFrequencyFromDelta(delta) {
    let f = delta / 100;
    changeFrequency(f);
}


function noteOn(midiVal) {
    let f = getFrequencyForMidiNote(midiVal);
    changeFrequency(f);
}

function getFrequencyForMidiNote(note) {
    return pow(2, (note-69)/12) * 440;
}

function changeType() {
    currentType = this.value();
    imm_updateAudioWaveform();
}

function updateAudio() {

    if (!audioContext)
        console.error("No audio context!");

    if (playBtn.isPlaying) {
        shouldStartPlaying = true;
    }


    if (shouldStartPlaying) {
        var val = volumeSlider.value() / 100;
        gainNode.gain.setTargetAtTime(val, audioContext.currentTime, 0.01);
        shouldStartPlaying = false;
    } else {
        var val = 0;
        gainNode.gain.setTargetAtTime(val, audioContext.currentTime, 0.1);
    }

}


function mouseWheel(event) {

    var OSName = "Unknown";

    if (window.navigator.userAgent.indexOf("Windows NT 6.1") != -1) OSName = "Windows 7";
    if (window.navigator.userAgent.indexOf("Mac") != -1) OSName = "Mac";


    if (playBtn.isPlaying == false) {

        if (OSName != "Mac") {
            time += (event.delta / (1000 * shift_modifier));
        } else if (OSName == "Mac") {
            time -= (event.delta / (1000 * shift_modifier));
        }

        gainNode.gain.setTargetAtTime(volumeSlider.value() / 100, audioContext.currentTime, 0.01);
        changeFrequencyFromDelta(abs(event.delta) * 100);
    }

}




function mousePressed() {
    let d = dist(centreCircle.x, centreCircle.y, mouseX, mouseY);
    if (d < radius * 2) {
        mousedown = true;

    } else {
        mousedown = false;
    }

}

function mouseReleased() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    playBtn.clicked(mouseX, mouseY);

    mousedown = false;
    changeFrequency(audioFrequency);
}


let shift_modifier = 1;

var emulatedKeys = {
    a: 60,
    s: 62,
    d: 64,
    f: 65,
    g: 67,
    h: 69,
    j: 71,
    k: 72,
}


let octave = 0;

function keyPressed() {
    if (keyCode == 32) {
        playBtn.spacebarHit();
    }

    if (keyCode == 16) {
        shift_modifier = 10;
    }
    
    if (key == 'z')
    {
        octave -= 12;
    }
    
    if (key == 'x' )
    {
        octave += 12;
    }
    
    
    if (emulatedKeys.hasOwnProperty(key))
    {
        let note = emulatedKeys[key] + octave; 
        let f = getFrequencyForMidiNote(note);
        
        audioFrequency = f;
        frequency = f / 1000;
        
        noteOn(note);
        
        
    }
    
}


function keyReleased() {

    if (keyCode == 16) {
        shift_modifier = 1;
    }

}

function updateCursor() {
    cursor(ARROW);

    if (shouldBeHand) {
        cursor(HAND);
    }

    if (shouldBeNoCursor) {
        noCursor();
    }

    shouldBeHand = false;
    shouldBeNoCursor = false;
}

function updateAudioWaveform() {

    if (old_iterations != iterations || oldType != currentType) {
        var harmonics = iterations + 1;

        var real = new Float32Array(harmonics);
        var imag = new Float32Array(harmonics);

        for (i = 0; i < harmonics; i++) {
            var n = waveObjects[currentType].getIncrement(i);

            imag[n] = waveObjects[currentType].getTransform(n);

        }

        var waveTable = audioContext.createPeriodicWave(real, imag);
        osc.setPeriodicWave(waveTable);

        old_iterations = iterations;
        oldType = currentType;
    }
}

function imm_updateAudioWaveform() {


    var harmonics = iterations + 1;

    var real = new Float32Array(harmonics);
    var imag = new Float32Array(harmonics);

    for (i = 0; i < harmonics; i++) {
        var n = waveObjects[currentType].getIncrement(i);

        imag[n] = waveObjects[currentType].getTransform(n);

    }

    var waveTable = audioContext.createPeriodicWave(real, imag);
    osc.setPeriodicWave(waveTable);

}

function drawText() {
    noStroke();
    fill(255);
    textAlign(LEFT);
    textSize(fontSize);

    let spacing = 20;
    text("frequency", freqSlider.x + freqSlider.width + spacing, freqSlider.y + 14);
    text("harmonics", iterSlider.x + iterSlider.width + spacing, iterSlider.y + 14);
    text("volume", volumeSlider.x + volumeSlider.width + spacing, volumeSlider.y + 14);
    text("audio speed (1x, 10x, 100x)", scalerSlider.x + scalerSlider.width + spacing, scalerSlider.y + 14)

    text(waveObjects[currentType].getName(), typeSlider.x + typeSlider.width + spacing, typeSlider.y + 14);

    textAlign(CENTER);
    text("number of waves: " + iterations, width / 2, height - 24);
}


function clearShapes() {
    contourShape = [];
    waveShape = [];
}

function mouseInRange(v, rad) {



    let d = abs(dist(mouseX, mouseY, v.x, v.y));
    if (d < rad * 2) {
        shouldBeHand = true;
    }


}

function drawWave() {
    let x = 0.0;
    let y = 0.0;

    mouseInRange(centreCircle, radius);

    if (mousedown) {
        time = overrideAngle(centreCircle);

        shouldBeNoCursor = true;

        let a = time;
        let delta_a = abs(old_angle - a) * 1000;
        old_angle = a;

        if (deltaAngle > 0) {
            changeVolume(volumeSlider.value() / 100);
            
        }

        
		changeFrequencyFromDelta(delta_a);

        let d = dist(centreCircle.x, centreCircle.y, mouseX, mouseY);
        stroke(120);
        noFill();
        //ellipse(0, 0, d*2)
        line(0, 0, mouseX - centreCircle.x, mouseY - centreCircle.y);
        ellipse(mouseX - centreCircle.x, mouseY - centreCircle.y, 8);
    }



    strokeWeight(1);

    for (i = 0; i < iterations; i++) {
        let old_x = x;
        let old_y = y;

        let n = waveObjects[currentType].getIncrement(i);

        let rad = radius * waveObjects[currentType].getTransform(n);

        x += (rad * getX(n));
        y += (rad * getY(n));

        drawEllipseAt(old_x, old_y, rad);

        stroke(255);
        line(old_x, old_y, x, y);

    }

    addAndInterpolateShape(y, zoom);

    let trans = radius + radius;

    translate(trans, 0);
    strokeWeight(1)
    line(x - trans, y, 0, y);
    drawWaveshape();

}



function getPhaseInc(freq) {
    return (freq / 60) * 2 * PI;
}


function addAndInterpolateShape(y, zoomFactor) {
    waveShape.unshift(y);

    for (i = 1; i < zoomFactor; i++) {
        let interp = waveShape[i] + y / zoomFactor;
        waveShape.unshift(interp);
    }
}

// depricated
function drawContourShape() {
    //fill(100);
    stroke(100);
    beginShape();
    for (i = 0; i < contourShape.length; i++) {
        curveVertex(contourShape[i].x, contourShape[i].y);
    }
    endShape();
    if (contourShape.length > 60 / frequency)
        contourShape.shift();
}

function drawWaveshape() {
    strokeWeight(1);
    beginShape();
    for (let i = 0; i < waveShape.length; i++) {
        vertex(i, waveShape[i]);
    }
    endShape();

    while (waveShape.length > width - 300)
        waveShape.pop();
}


function drawEllipseAt(x, y, radius) {
    stroke(255);
    noFill();
    ellipse(x, y, radius * 2);
}

function getX(n) {
    return cos(n * time);
}

function getY(n, rad) {
    return sin(n * time);
}

class waveObject {
    constructor(type) {
        this.type = type;
    }

    getName() {
        return this.type;
    }

}

class squareWaveObject extends waveObject {

    getTransform(n) {
        return (4 / (n * PI));
    }

    getIncrement(i) {
        return (i * 2 + 1);
    }
}

class sawWaveObject extends waveObject {
    getTransform(n) {
        return (2 / (n * PI));
    }

    getIncrement(n) {
        return (n + 1);
    }
}

class triangleWaveObject extends waveObject {
    getTransform(n) {
        return (
            (8 / (PI * PI)) *
            (pow(-1, (n - 1) / 2)) /
            (n * n)
        );
    }

    getIncrement(n) {
        return n * 2 + 1;
    }
}


class smoothParameter {
    constructor(name) {
        this.targetVal = 0.0;
        this.curVal = 0.0;
        this.countdown = 0;

        this.stepsToTarget = 1;
        this.step = 0;

        this.name = name;

        print("smoothParameter created: " + name);
    }

    getSmoothed() {
        if (this.countdown <= 0)
            return this.targetVal;

        --this.countdown;
        this.curVal += this.step;
        return this.curVal;
    }

    setValue(value) {
        if (this.targetVal != value) {
            this.targetVal = value;
            this.countdown = this.stepsToTarget;

            if (this.countdown <= 0)
                this.curVal = this.targetVal;
            else
                this.step = (this.targetVal - this.curVal) / this.countdown;
        }

    }

    reset(time, fps) {
        this.stepsToTarget = (time / 1000) * fps;
        this.countdown = 0;
    }
}


class playButton {
    constructor(position, size) {
        this.size = size;
        this.position = position;
        this.isPlaying = false;
        this.mouseDown = false;

        this.triShape = [];

        this.updateCentre();
    }

    setPosition(newPosition) {
        this.position = newPosition;
        this.updateCentre();
    }

    updateCentre() {
        this.centreX = this.position.x;
        this.centreY = this.position.y;

    }

    clicked(mX, mY) {
        let x = this.position.x;
        let y = this.position.y;
        let rad = this.size / 2;

        let distance = dist(mX, mY, x, y);

        if (distance <= rad) {
            if (this.isPlaying == true)
                this.isPlaying = false;

            else if (this.isPlaying == false)
                this.isPlaying = true;
        }
    }

    mouseOver(mX, mY) {

        let x = this.position.x;
        let y = this.position.y;
        let rad = this.size / 2;

        let distance = dist(mX, mY, x, y);

        if (distance <= rad) {
            this.renderBorder();
            shouldBeHand = true;

            this.mouseDown = false;

            if (mouseIsPressed) {
                this.mouseDown = true;
            }
        }
    }

    spacebarHit() {
        if (this.isPlaying == true)
            this.isPlaying = false;

        else if (this.isPlaying == false)
            this.isPlaying = true;
    }

    calculateTriangle() {
        let rad = (this.size / 2) - 24;
        let twoPI = 2 * PI;


        let x1 = cos(2 / 3 * twoPI) * rad;

        let y1 = sin(2 / 3 * twoPI) * rad;
        let y2 = sin(4 / 3 * twoPI) * rad;

        triangle(
            this.centreX + x1,
            this.centreY + y1,
            this.centreX + x1,
            this.centreY + y2,
            this.centreX + rad,
            this.centreY
        );

    }


    renderBorder() {
        noFill();
        stroke(255);
        strokeWeight(4);
        ellipse(this.position.x, this.position.y, this.size + 3);
        strokeWeight(1);
    }

    drawStopSymbol(c) {
        fill(c);
        ellipse(this.position.x, this.position.y, this.size);
        fill(255);
        let margin = 64;
        let s = (this.size) - margin;
        let x = this.position.x - s / 2;
        let y = this.position.y - s / 2;
        rect(x, y, s, s);
    }

    drawPlaySymbol(c) {
		fill(c);
        ellipse(this.position.x, this.position.y, this.size);
        fill(255);
        this.calculateTriangle();
    }


    render() {
        var c;
         // Define color 'c'
		var downColour = color(0, 153, 255);
        var playColour = color(0, 204, 153);
        var stopColour = color(255, 0, 0);
        
        //this.clicked();
        fill(255);
        noStroke();

        if (!this.isPlaying) {
            c = this.mouseDown ? downColour : playColour;
			this.drawPlaySymbol(c);
        } else {
            c =  this.mouseDown ? downColour : stopColour;
			this.drawStopSymbol(c);

        }
    }
}
