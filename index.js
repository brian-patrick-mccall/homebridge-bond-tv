"use strict";
var request = require("request");

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
  this.revertTimer = null;
  this.requestTimer = null;
  this.bond = config.bond;
  this.token = config.token;
  this.freq = config.freq;
  this.bps = config.bps;
  this.reps = config.reps;
  this.modulation = config.modulation;
  this.encoding = config.encoding;
  this.data = config.data;
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

  //this.log("Setting switch to " + on);

  if (!on) {
    callback();
    return;
  }

  var log = this.log;

  const bondurl = "http://" + this.bond + "/v2/signal/tx";

  var body = JSON.stringify({"freq": this.freq,
		"bps": this.bps,
		"reps": this.reps,
		"modulation": this.modulation,
		"encoding": this.encoding,
		"data": this.data});

  var token = this.token;

  var requestCallback = function(error, response, body) {
    if (error) {
      log("Upload failed: " + error);
    } else {
    }
  };

  //this.requestTimer = setTimeout(function() {
    request({
      method: 'PUT',
      url: bondurl,
      headers: {
          'BOND-Token': token,
          'Content-Type': 'application/json'
        },
      body: body
    },
    requestCallback
    );

  //}, 1000);

  this.revertTimer = setTimeout(function() {
    this._service.setCharacteristic(Characteristic.On, false);
  }.bind(this), 2000);

  callback();
}
