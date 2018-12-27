let waveShape = [];
let contourShape = [];
let time = 0;
let iterations = 30;
let old_iterations = 0;
let frequency = 0.8;
let volume = 0.1;

let shouldRenderSquare = true;
let zoom = 3; // between 1 and 6
let radius = 75.0;

let typeText;
let fontSize = 14;
let playBtn;
let shouldStartPlaying = false;

var freqSlider, iterSlider, scalerSlider, volumeSlider, typeSlider;

var audioContext;
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

var it = 0;

document.addEventListener("click", function(){
   // if (audioContext.state === 'suspended')
    //{ audioContext.resume(); }
    
    console.log(audioContext.state);
    if(audioContext.state === 'suspended') {
    	audioContext.resume();
  	}
});


function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);

    fontSize = windowHeight / 60;

    let size = 100;
    let v = createVector(width - size, height - size)
    playBtn = new playButton(v, 100);

    radius = width / 8;

    waveObjects[0] = new squareWaveObject("SQUARE");
    waveObjects[1] = new sawWaveObject("SAW");
    waveObjects[2] = new triangleWaveObject("TRIANGLE");

    initSliders();
    initAudio();

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
    translate(width * 0.25, height * 0.5 + margin);

    stroke(30);
    line(0, 0, width, 0);

    updateSliders();

    drawWave();


    updateTime();

    updateAudio();
}

function updateTime() {
    if (playBtn.isPlaying)
        time += getPhaseInc(frequency *10);

    while (time >= 2 * PI)
        time -= 2 * PI;
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
    freqSlider.input(changeFrequency);

    iterSlider = createSlider(1, 64, 2);
    iterSlider.position(20, 40);
	iterSlider.input(imm_updateAudioWaveform);
    iterations = iterSlider.value();


    volumeSlider = createSlider(0, 30, 6, 0);
    volumeSlider.position(
        freqSlider.x + freqSlider.width + 140,
        freqSlider.y
    )
    volumeSlider.input(changeVolume);

    scalerSlider = createSlider(0, 2, 2);
    scalerSlider.position(
        volumeSlider.x,
        volumeSlider.y + 30
    );
    scalerSlider.input(changeFrequency);

    typeSlider = createSlider(0, 2, 0);
    typeSlider.position(
        20, height - 40
    );
    typeSlider.input(changeType);
}


function updateSliders() {
  


    iterations = iterSlider.value();
    frequency = freqSlider.value() / 100;
}


//AUDIO

function initAudio() {
    audioContext = new AudioContext();
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

function changeVolume() {
    var val = volumeSlider.value() / 100;
    gainNode.gain.setTargetAtTime(val, audioContext.currentTime, 0.1);
}

function changeFrequency() {
    let mult = pow(10, scalerSlider.value());
    var val = (freqSlider.value() / 10) * mult;
    osc.frequency.setTargetAtTime(val, audioContext.currentTime, 0.05);
}

function changeType() {
    //osc.stop(audioContext.currentTime);
    let newType = this.value();
    if (currentType != newType) {
        currentType = newType;
    }
    imm_updateAudioWaveform();
    //osc.start(audioContext.currentTime +1);

}

function updateAudio() {

   // updateAudioWaveform();

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

function mouseReleased() {
    playBtn.clicked(mouseX, mouseY);
}




function keyPressed() {
    if (keyCode == 32) {
        playBtn.spacebarHit();
    }
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
    text("audio speed (1x, 2x, 4x)", scalerSlider.x + scalerSlider.width + spacing, scalerSlider.y + 14)

    text(waveObjects[currentType].getName(), typeSlider.x + typeSlider.width + spacing, typeSlider.y + 14);

    textAlign(CENTER);
    text("number of waves: " + iterations, width / 2, height - 24);
}


function clearShapes() {
    contourShape = [];
    waveShape = [];
}

function drawWave() {
    let x = 0.0;
    let y = 0.0;

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
    strokeWeight(2);
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
        this.isPlaying = true;

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
            cursor(HAND);
        } else {
            cursor(ARROW);
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
    }


    render() {
        var c = color(122, 200, 0); // Define color 'c'


        //this.clicked();
        fill(255);
        noStroke();

        if (!this.isPlaying) {
            fill(c);
            ellipse(this.position.x, this.position.y, this.size);
            fill(255);
            this.calculateTriangle();
        } else {
            c = color(255, 12, 0);
            fill(c);
            ellipse(this.position.x, this.position.y, this.size);
            fill(255);
            let margin = 64;
            let s = (this.size) - margin;
            let x = this.position.x - s / 2;
            let y = this.position.y - s / 2;
            rect(x, y, s, s);
        }
    }
}
