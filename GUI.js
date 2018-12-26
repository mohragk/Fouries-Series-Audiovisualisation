//var freqSlider, iterSlider, scalerSlider, volumeSlider;

class GUIComponent {
  
  constructor() {
  	var freqSlider;
    var harmonicsSlider;
    var audioSpeedSlider;
    var volumeSlider;
    
    this.width = 800; this.height = 400;
    
    initSliders();
  }
  
  initSliders() {
    freqSlider = createSlider(1, 40, 8);
  	freqSlider.position(20, 10);

  	harmonicsSlider = createSlider(1, 64, 2);
  	harmonicsSlider.position(20, 40);



  	volumeSlider = createSlider(0, 30, 6);
  	volumeSlider.position(
    	freqSlider.x + freqSlider.width + 140,
    	freqSlider.y
  	)

  	audioSpeedSlider = createSlider(0, 2, 2);
  	audioSpeedSlider.position(
    	volumeSlider.x,
   	 	volumeSlider.y + 30
 	 	);
    
    print("sliders initialised");
  }
  
  updateText() {
    
  }
  
  setSize(w, h) {
  	this.width = w;
    this.height = h;
  }
  
  
}