let waveShape = [];
let contourShape = [];
let time = 0;
let iterations = 30;
let old_iterations = 0;
let frequency = 0.3;
let shouldRenderSquare = true;

let typeText;

var freqSlider, iterSlider, scalerSlider, volumeSlider;

var bufferSize = 4096;
var audioContext = new AudioContext();
var gainNode;
var osc;


function setup() {
  createCanvas(800, 400);

  frameRate(60);

  freqSlider = createSlider(1, 40, 1);
  freqSlider.position(20, 10);

  iterSlider = createSlider(1, 70, 2);
  iterSlider.position(20, 40);

 
  
  volumeSlider = createSlider(0, 30, 8);
  volumeSlider.position(
    freqSlider.x + freqSlider.width + 140,
    freqSlider.y
  )
  
  scalerSlider = createSlider(0, 2, 0);
  scalerSlider.position(
    volumeSlider.x,
    volumeSlider.y + 30
  );

  initAudio();

}


function windowResized(){
  resizeCanvas(800, 400);
  
  //resetAudio();
}



function draw() {
  background(15);

	updateText();
  

  translate(width * 0.25, height * 0.6);

  stroke(30);
  line(0, 0, width, 0);



  frequency = freqSlider.value() / 10;
  iterations = iterSlider.value();



  if (shouldRenderSquare)
    drawSquareWave();
  else
    drawSawWave();


  time += getPhaseInc(frequency);

  if (time >= 2 * PI)
    time -= 2 * PI;


  updateAudio();
}


//AUDIO

function initAudio() {
  
  
  gainNode = audioContext.createGain();
  osc = audioContext.createOscillator();
  
  osc.frequency.value = frequency;
  osc.type = 'square';
  osc.start(0);

  gainNode.gain.value = 0.22;

  osc.connect(gainNode);
  gainNode.connect(audioContext.destination);
  // moogLPF.connect(audioContext.destination);
  
  print("audio initialized");
}


function resetAudio()
{
  osc.stop();
 
  gainNode.disconnect();
  osc.disconnect();
  
  audioContext = new AudioContext();
  gainNode = audioContext.createGain();
  osc = audioContext.createOscillator();
  
  osc.frequency.value = frequency;
  osc.type = 'square';
  osc.start(0);

  gainNode.gain.value = 0.22;

  osc.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  print("audio reset");
  
}

function updateAudio() {
 
  let mult = pow(10, scalerSlider.value());
  osc.frequency.value = frequency * mult;
  
  gainNode.gain.value = volumeSlider.value() / 100;

  updateAudioWaveform();
}

function updateAudioWaveform() {
  if (old_iterations != iterations) {
    var n = iterations + 1;

    var real = new Float32Array(n);
    var imag = new Float32Array(n);

    if (shouldRenderSquare) {
      for (var x = 1; x < n; x += 2) {
        imag[x] = 4.0 / (Math.PI * x);
      }
    } else {
      for (var x = 1; x < n; x++) {
        imag[x] = 1.0 / (Math.PI * x);
      }
    }

    var waveTable = audioContext.createPeriodicWave(real, imag);
    osc.setPeriodicWave(waveTable);
    old_iterations = iterations;
    
  }
}

function imm_updateAudioWaveform() {
  

  var n = iterations + 1;

  var real = new Float32Array(n);
  var imag = new Float32Array(n);

  if (shouldRenderSquare) {
    for (var x = 1; x < n; x += 2) {
      imag[x] = 4.0 / (Math.PI * x);
    }
  } else {
    for (var x = 1; x < n; x++) {
      imag[x] = 1.0 / (Math.PI * x);
    }
  }

  var waveTable = audioContext.createPeriodicWave(real, imag);
  osc.setPeriodicWave(waveTable);
}

function updateText() {
  textAlign(RIGHT);
  textSize(12);
  text(getCurrentTypeName(), width - 20, 30);
  textSize(9);
  text("(double click to switch between square and saw)", width-20, 50);
	textSize(12);
  textAlign(LEFT);
  
  //stroke(200);
  let spacing = 20;
  text("frequency", freqSlider.x + freqSlider.width + spacing, freqSlider.y + 14);
  text("harmonics", iterSlider.x + iterSlider.width + spacing, iterSlider.y + 14);
  text("volume",    volumeSlider.x + volumeSlider.width + spacing, volumeSlider.y + 14);
  text("audio speed (1x, 2x, 4x)", scalerSlider.x + scalerSlider.width + spacing, scalerSlider.y + 14)
}


function getCurrentTypeName() {
  let t = "";

  if (shouldRenderSquare) {
    t = "SQUARE";
  } else {
    t = "SAW";
  }

  return t;
}

function doubleClicked() {
  clearShapes();

  if (shouldRenderSquare)
    shouldRenderSquare = false;
  else
    shouldRenderSquare = true;

  imm_updateAudioWaveform();
}


function clearShapes() {
  contourShape = [];
  waveShape = [];
}



function drawSawWave() {
  let x = 0.0;
  let y = 0.0;

  for (i = 0; i < iterations; i++) {
    let old_x = x;
    let old_y = y;

    let n = i + 1;

    let radius = 75 * (4 / (n * PI));

    x += (radius * getX(n));
    y += (radius * getY(n));

    drawEllipseAt(old_x, old_y, radius);

    stroke(255);
    line(old_x, old_y, x, y);
  }

  let v = createVector(x, y);

  contourShape.push(v);

  waveShape.unshift(y);


  translate(200, 0);
  line(x - 200, y, 0, waveShape[0]);
  drawWaveshape();
}

function drawSquareWave() {
  let x = 0.0;
  let y = 0.0;

  for (i = 0; i < iterations; i++) {
    let old_x = x;
    let old_y = y;

    let n = i * 2 + 1;
    let radius = 75 * getTransform(n);
    x += radius * getX(n);
    y += radius * getY(n);

    drawEllipseAt(old_x, old_y, radius);


    stroke(255);
    line(old_x, old_y, x, y);
  }
  let v = createVector(x, y);

  contourShape.push(v);

  waveShape.unshift(y);

  translate(200, 0);
  line(x - 200, y, 0, y);
  drawWaveshape();
}

function getPhaseInc(freq) {
  return (freq / 60) * 2 * PI;
}


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
  noFill();
  for (let i = 0; i < waveShape.length; i++) {
    vertex(i, waveShape[i]);
  }
  endShape();

  if (waveShape.length > width - 200 - (width * 0.25))
    waveShape.pop();
}

function getTransform(n) {
  return (4 / (n * PI));
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