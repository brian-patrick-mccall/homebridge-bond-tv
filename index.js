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
  this.log = log;
  this.name = config.name;
  this.revertTimer = null;
  this.powerOnTimer = null;
  this.bond = config.bond;
  this.token = config.token;
  this.freq = config.freq;
  this.bps = config.bps;
  this.reps = config.reps;
  this.modulation = config.modulation;
  this.encoding = config.encoding;
  this.data = config.data;
  this.tv_defined = config.TV ? true : false;
  if (this.tv_defined)
  {
    this.TV = config.TV;
  }
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

  const channelurl = "http://" + this.bond + "/v2/signal/tx";

  var channelRequestBody = JSON.stringify({"freq": this.freq,
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

  if (this.tv_defined)
  {
    const powerurl = "http://" + this.bond + "/v2/devices/" + this.TV + "/state";
    const poweronurl = "http://" + this.bond + "/v2/devices/" + this.TV + "/actions/TurnOn";

    request({method: 'GET', url: powerurl, headers: {'BOND-Token': token, 'Content-Type': 'application/json'}},
      function(error, response, body) {
        var power_state = 0;
        if (error) {
          log("Could not get power state.");
        } else {
          log("Response body is " + body);
	  var body_parsed = JSON.parse(body);
	  log('body["power"] is ' + body_parsed["power"]);
          power_state = body_parsed["power"];
        }

        if (power_state == 0) {
          log("Need to power on the TV.");

          request({method:'PUT', url: poweronurl, headers: {'BOND-Token': token, 'Content-Type': 'application/json'}, body: '{}'},
            function(error, response, body) {
              if (error) {
                log("Error turning on the TV.");
              }

              this.powerOnTimer = setTimeout(function() {

                  request({method:'PUT', url: channelurl, headers: {'BOND-Token': token, 'Content-Type': 'application/json'}, body: channelRequestBody},
                    function(error, response, body) {
                      if (error) {
                        log("Error changing the channel.");
		                    log(response);
                      }
                    }
                  );

                }.bind(this), 10000);

            }
          );

        } else {
              log("No need to power on the TV.");
              request({method:'PUT', url: channelurl, headers: {'BOND-Token': token, 'Content-Type': 'application/json'}, body: channelRequestBody},
                function(error, response, body) {
                  if (error) {
                    log("Error changing the channel.");
                    log(response);
                  }
                }
              );
        }

      }
    );

  }
  else
  {

    request({
      method: 'PUT',
      url: channelurl,
      headers: {
          'BOND-Token': token,
          'Content-Type': 'application/json'
        },
      body: channelRequestBody
    },
    requestCallback
    );
  }

  this.revertTimer = setTimeout(function() {
    this._service.setCharacteristic(Characteristic.On, false);
  }.bind(this), 5000);

  callback();
}
