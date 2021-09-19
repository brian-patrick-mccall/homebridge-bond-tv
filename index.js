"use strict";

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

  if (on) {
    this.timer = setTimeout(function() {
      this._service.setCharacteristic(Characteristic.On, false);
    }.bind(this), this.time);
  }
  
  callback();
}
