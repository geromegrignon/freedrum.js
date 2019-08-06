let bluetoothLEMidi = '03b80e5a-ede8-4b33-a751-6ce34ec4c700';
let bleMidiCharacteristic = '7772e5db-3868-4112-a1a9-f2669d106bf3';
let numSensors = 0;

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
    numSensors+=1;
    console.log(numSensors);
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
  }

  handleData(event){
      let data = event.target.value;
      let command = data.getUint8(2);
      let note = data.getUint8(3);

      console.log(this.device.id);
  
      if(stickSensors.map(sensor => sensor.device.id).find(id => id === this.device.id) !== undefined){
        if(this.device.id === stickSensors[0].device.id) {
          document.getElementById('stick-sensor-signal-0').style.visibility = 'visible' ;
        setTimeout(() => document.getElementById('stick-sensor-signal-0').style.visibility = 'hidden', 2000);
        }

        if(this.device.id === stickSensors[1].device.id) {
          document.getElementById('stick-sensor-signal-1').style.visibility = 'visible' ;
        setTimeout(() => document.getElementById('stick-sensor-signal-1').style.visibility = 'hidden', 2000);
        }
        
        this.handleDrumSticksEvents(command, note);
      } 
      
      if(this.device.id === "KK/SSgLwFlHSjxZqWDjzbA==" || this.device.id === "Dqr4hgehCfi7hpaxdic6eg=="){
        this.handlePedalEvents(command, note);
      } 
  }

  handleDrumSticksEvents(command, note){
    console.log(command);
    console.log(note);
    if(command === 137){
      if(note === 38){
        drawSquare();
      }

      if(note === 57){
        drawCircle();
      }

      if(note === 41){
        drawLine();
      }

      if(note === 46){
        drawTriangle();
      }
    }
  }

  handlePedalEvents(command, note){
    console.log(command);
    console.log(note);
    if(command === 153){
      if(note === 38){
        // bassDrum.play()
        // bassDrum.volume(volume);
        drawLine();
      }

      if(note ===50){
        // closedHiHat.play()
        // closedHiHat.volume(volume);
        drawTriangle();
      }
    }
  }
}

/* Define FreedrumStick and store them in 2 distincs arrays (for sticks and foot) */
  
var freeDrumStickOne = new FreedrumStick("aid8ioeA+Fvn2c8E66mZXQ=="); // FD2 v8
var freeDrumStickTwo = new FreedrumStick("AZWyVIxNAtV/MDKcJ3VxWw=="); // FD2 v8


var freeDrumFootOne = new FreedrumStick("KK/SSgLwFlHSjxZqWDjzbA=="); // FD2 v9
var freeDrumFootTwo = new FreedrumStick("Dqr4hgehCfi7hpaxdic6eg=="); // FD2 v9

const stickSensors = [freeDrumStickOne, freeDrumStickTwo];
const footSensors = [freeDrumFootOne, freeDrumFootTwo];

/* Connects to bluetooth devices */

document.querySelector('#stick-sensor-add-0').addEventListener('click', event => {
  let currentSensor = getSensorToConnect(stickSensors)
  currentSensor.request()
  .then(_ => currentSensor.connect())
  .then(_ => { 
    currentSensor.getFreedrumData();
    console.log(currentSensor);
    document.getElementById('stick-sensor-container-0').style.display = 'flex';
    document.getElementById('stick-sensor-add-0').style.display = 'none';
  })
  .catch(error => { console.log(error) });
});

document.querySelector('#stick-sensor-add-1').addEventListener('click', event => {
  let currentSensor = getSensorToConnect(stickSensors)
  currentSensor.request()
  .then(_ => currentSensor.connect())
  .then(_ => { 
    currentSensor.getFreedrumData();
    console.log(currentSensor);
    document.getElementById('stick-sensor-container-1').style.display = 'flex';
    document.getElementById('stick-sensor-add-1').style.display = 'none';
  })
  .catch(error => { console.log(error) });
});

const getSensorToConnect = (sensors) => {
  for(sensor of sensors){
    if(sensor.device === null){
      let currentSensor = sensor;
      return currentSensor;
    }
  }
}

document.querySelector('#play-btn').addEventListener('click', event => {
    const button = document.getElementsByTagName('button')[1];
    button.classList.add('fade');
    const title = document.getElementsByTagName('main')[0];
    title.classList.add('fade');
});


document.getElementById('stick-sensor-btn-0').addEventListener('click', event => {
  if(stickSensors[0].device !== null) {
    stickSensors[0].disconnect();
    stickSensors[0].device = null;
  }
});

document.getElementById('stick-sensor-container-0').style.display = 'none';
document.getElementById('stick-sensor-container-1').style.display = 'none';
document.getElementById('foot-sensor-container-0').style.display = 'none';
document.getElementById('foot-sensor-container-1').style.display = 'none';