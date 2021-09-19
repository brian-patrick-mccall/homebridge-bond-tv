"use strict";
const fetch = require('node-fetch');

var Service, Characteristic, HomebridgeAPI;

module.exports = function(homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  HomebridgeAPI = homebridge;
  homebridge.registerAccessory("homebridge-bond-tv", "BondTvChannel", BondTvChannel);
}

function BondTvChannel(log, config) {
  this.log = log;
  this.name = config.name;
  this.time = 100;
  this.timer = null;
  this.bond = config.bond;
  this.token = config.token;
  this._service = new Service.StatelessProgrammableSwitch(this.name);
  
  this.cacheDirectory = HomebridgeAPI.user.persistPath();
  this.storage = require('node-persist');
  this.storage.initSync({dir:this.cacheDirectory, forgiveParseErrors: true});
  
  this._service.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .on('get', this._get.bind(this));
}

BondTvChannel.prototype.getServices = function() {
  return [this._service];
}

BondTvChannel.prototype._get = function(val, callback) {

  this.log("Setting switch to " + val);

  const bondurl = "http://" + this.bond + "/v2/signal/tx"

  const body = {
    "freq": this.freq,
    "bps": this.bps,
    "reps": this.reps,
    "modulation": this.modulation,
    "encoding": this.encoding,
    "data": this.data
    }

  const response = fetch(bondurl, {
      method: 'PUT',
      headers: {
        'BOND-Token': this.token,
        'Content-Type': 'application/json'
        }
      },
      body: JSON.stringify(body)
    );

  callback();
}
