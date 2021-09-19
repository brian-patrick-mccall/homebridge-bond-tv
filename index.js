"use strict";
import fetch from "node-fetch";

var Service, Characteristic, HomebridgeAPI;

module.exports = function(homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  HomebridgeAPI = homebridge;
  homebridge.registerAccessory("homebridge-bond-tv", "BondTvChannel", BondTvChannel);
}

function BondTvChannel(log, config) {
  log("Hello world!");
  this.log = log;
  this.name = config.name;
  this.time = 100;
  this.timer = null;
  this.bond = config.bond;
  this.token = config.token;
  this._service = new Service.Switch(this.name);
  
  this.cacheDirectory = HomebridgeAPI.user.persistPath();
  this.storage = require('node-persist');
  this.storage.initSync({dir:this.cacheDirectory, forgiveParseErrors: true});
  
  this._service.getCharacteristic(Characteristic.On)
    .on('set', this._setOn.bind(this));
}

BondTvChannel.prototype.getServices = function() {
  return [this._service];
}

BondTvChannel.prototype._setOn = function(on, callback) {

  this.log("Setting switch to " + on);

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
        },
      body: JSON.stringify(body)
      }
    );

  if (on) {
    this.timer = setTimeout(function() {
      this._service.setCharacteristic(Characteristic.On, false);
    }.bind(this), this.time);
  }

  callback();
}
