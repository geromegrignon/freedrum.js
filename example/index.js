let bluetoothLEMidi = '03b80e5a-ede8-4b33-a751-6ce34ec4c700';
let bleMidiCharacteristic = '7772e5db-3868-4112-a1a9-f2669d106bf3';
let noteToSet = undefined;
let mode = 'test';
let audio;

let sensors = [];

$ = document.getElementById;

var cowbell = new Howl({src: ['./assets/cowbell.wav']});
var kick = new Howl({src: ['./assets/kick.wav']});
var snare = new Howl({src: ['./assets/snare.wav']});
var closedHiHat = new Howl({src: ['./assets/closed-hi-hat.wav']});
var bassDrum = new Howl({src: ['./assets/bass-drum.wav']});
var hiHatCymbal = new Howl({src: ['./assets/hi-hat-cymbal.mp3']});
var heavySnare = new Howl({src: ['./assets/heavy-snare.wav']});

class Shape {
  constructor(name, draw, note, audio) {
    this.name = name;
    this.note = note;
    this.draw = draw;
    this.audio = audio
  }
}

var squareShape = new Shape('square', drawSquare, 38, (volume) => {bassDrum.play();bassDrum.volume(volume);});
var circleShape = new Shape('circle', drawCircle, 50, (volume) => {hiHatCymbal.play();hiHatCymbal.volume(volume);});
var lineShape = new Shape('line', drawLine, 36, (volume) => {heavySnare.play();heavySnare.volume(volume);});
var triangleShape = new Shape('triangle', drawTriangle, 44, (volume) => {kick.play();kick.volume(volume);});

const shapes = [squareShape, circleShape, lineShape, triangleShape];

class FreedrumStick {
  constructor(name) {
    this.device = null;
    this.onDisconnected = this.onDisconnected.bind(this);
    this.handleData = this.handleData.bind(this);
    this.name = name;
  }
  
  request() {
    let options = {
      "filters": [
          {"name": this.name},
          {services: [bluetoothLEMidi]}
      ],
    };
    return navigator.bluetooth.requestDevice(options)
    .then(device => {
      this.device = device;
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
    });
  }
    
  connect() {
    if (!this.device) {
      return Promise.reject('Device is not connected.');
    }
    return this.device.gatt.connect();
  }
  
  getFreedrumData() {
    return this.device.gatt.getPrimaryService(bluetoothLEMidi)
    .then(service => service.getCharacteristic(bleMidiCharacteristic))
    .then(characteristic => characteristic.startNotifications())
    .then(characteristic => {
      characteristic.addEventListener('characteristicvaluechanged', this.handleData);
    })
  }

  disconnect() {
    if (!this.device) {
      return Promise.reject('Device is not connected.');
    }
    return this.device.gatt.disconnect();
  }

  onDisconnected() {
    console.log('Device is disconnected.');
    let sensorName = sensors.find(sensor => sensor.device === this.device).name;
    hideSensorInfo(sensorName);
    let id = sensors.findIndex(sensor => sensor.device === this.device);
    sensors.splice(id, 1);
  }

  handleData(event){
      let data = event.target.value;
      let command = data.getUint8(2);
      let note = data.getUint8(3);
      let volume = data.getUint8(4);

      // The volume property in Howler.js is normalize (between 0 - 1)
      // The velocity value in MIDI ranges from 0 - 127
      // To normalize, here's the equation:
      // z = (x - min(x)) / (max(x) - min(x))
      // z = (volume - Math.min(0,127)) / (Math.max(0,127) - Math.min(0,127));
      let normalizedVolume = (volume - Math.min(0,127)) / (Math.max(0,127) - Math.min(0,127));

      sensors.forEach(sensor => {
        if(this.device.id === sensor.device.id) {
          displayLight(sensor.name);
          this.handleDrumEvents(command, note, normalizedVolume);
        }
      });
  }

  handleDrumEvents(command, note, volume){
    if(command === 153){
      if(mode === 'test') {
        if(noteToSet !== undefined) {
          resetShape(note);
          changeShape(note); 
        } else {
          testShape(note);
        }
      } else {
        play(note, volume);
      }
    }
  }
}

/* handle data */

function play(note, volume) {
  shapes.forEach(shape => {
    if(note === shape.note) {
      shape.draw();
      shape.audio(volume);
    }
  });
}

function testShape(note) {
  shapes.forEach(shape => {
    if(note === shape.note) {
      var id = 'shape-' + shape.name;
      $(id).style.background = 'orange';
      setTimeout(() => $(id).style.background = 'white', 300);
    }
  });
}

function changeShape(note) {
  shapes.forEach(shape => {
    if(shape.name === noteToSet) {
      shape.note = note;
    }
  });
  noteToSet = undefined; 
}

function resetShape(note) {
  shapes.forEach(shape => {
    if(shape.note === note) {
      shape.note = undefined;
      var id = 'shape-' + shape.name;
      $(id).style.background = 'grey';
    }
  });
}


/* Event listeners */

document.querySelector('#sensor-add-stick-0').addEventListener('click', event => {
  audio = new AudioContext();
  audio.resume().then(() => {
    console.log('Playback resumed successfully');
  });
  let currentSensor = new FreedrumStick('stick-0');
  sensors = [...sensors, currentSensor];
  currentSensor.request()
  .then(_ => currentSensor.connect())
  .then(_ => { 
    currentSensor.getFreedrumData();
    displaySensorInfo(currentSensor);
  })
  .catch(error => { console.log(error) });
});

document.querySelector('#sensor-add-stick-1').addEventListener('click', event => {
  let currentSensor = new FreedrumStick('stick-1');
  sensors = [...sensors, currentSensor];
  currentSensor.request()
  .then(_ => currentSensor.connect())
  .then(_ => { 
    currentSensor.getFreedrumData();
    displaySensorInfo(currentSensor);
  })
  .catch(error => { console.log(error) });
});

document.querySelector('#sensor-add-foot-0').addEventListener('click', event => {
  let currentSensor = new FreedrumStick('foot-0');
  sensors = [...sensors, currentSensor];
  currentSensor.request()
  .then(_ => currentSensor.connect())
  .then(_ => { 
    currentSensor.getFreedrumData();
    console.log(currentSensor);
    displaySensorInfo(currentSensor);
  })
  .catch(error => { console.log(error) });
});

document.querySelector('#sensor-add-foot-1').addEventListener('click', event => {
  let currentSensor = new FreedrumStick('foot-1');
  sensors = [...sensors, currentSensor];
  currentSensor.request()
  .then(_ => currentSensor.connect())
  .then(_ => { 
    currentSensor.getFreedrumData();
    displaySensorInfo(currentSensor);
  })
  .catch(error => { console.log(error) });
});

$('play-btn').addEventListener('click', event => {
  fadeContent();
});

$('sensor-btn-stick-0').addEventListener('click', event => {
  let sensor = sensors.find(sensor => sensor.name === 'stick-0');
    sensor.disconnect();
});

$('sensor-btn-stick-1').addEventListener('click', event => {
  let sensor = sensors.find(sensor => sensor.name === 'stick-1');
    sensor.disconnect();
});

$('sensor-btn-foot-0').addEventListener('click', event => {
  let sensor = sensors.find(sensor => sensor.name === 'foot-0');
    sensor.disconnect();
});

$('sensor-btn-foot-1').addEventListener('click', event => {
  let sensor = sensors.find(sensor => sensor.name === 'foot-1');
    sensor.disconnect();
});

$('shape-square').addEventListener('click', event => noteToSet = 'square');
$('shape-circle').addEventListener('click', event => noteToSet = 'circle');
$('shape-line').addEventListener('click', event => noteToSet = 'line');
$('shape-triangle').addEventListener('click', event => noteToSet = 'triangle');

/* Utilities */

function displaySensorInfo(sensor) {
  $('sensor-container-' + sensor.name).style.display = 'flex';
  $('sensor-add-' + sensor.name).style.display = 'none';
  $('sensor-name-' + sensor.name).innerHTML = sensor.device.name;
}

function displayLight(sensorName) {
  let id = 'sensor-signal-' + sensorName;
  $(id).style.visibility = 'visible' ;
  setTimeout(() => $(id).style.visibility = 'hidden', 500);
}

function hideSensorInfo(sensorName) {
  $('sensor-container-' + sensorName).style.display = 'none';
  $('sensor-add-' + sensorName).style.display = 'flex';
}

function fadeContent() {
  const title = document.getElementsByTagName('main')[0];
  title.classList.add('fade');
  const footer = document.getElementsByTagName('footer')[0];
  footer.classList.add('fade');
  mode = 'play';
}
