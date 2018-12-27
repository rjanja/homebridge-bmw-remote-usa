var request = require("request");
var Service, Characteristic;
// require('request-debug')(request);

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-bmw-remote-usa", "BMWRemoteUSA", bmwremote);
};

function bmwremote(log, config) {
  this.log = log;
  this.name = config["name"];
  this.vin = config["vin"];
  this.username = config["username"];
  this.password = config["password"];
  this.authBasic = config["authBasic"];
  this.securityQuestionSecret = config["securityQuestionSecret"];
  this.currentState = Characteristic.LockCurrentState.SECURED;
  this.currentStateDescription = "locked";

  this.refreshToken = "";
  this.refreshTime = 0;
  this.authToken = "";
  this.lastUpdate = 0;

  this.lockservice = new Service.LockMechanism(this.name);

  this.lockservice
    .getCharacteristic(Characteristic.LockCurrentState)
    .on('get', this.getState.bind(this));

  this.lockservice
    .getCharacteristic(Characteristic.LockTargetState)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this));

  this.stateRequest(function(err, state) {
    if (err) {
      this.log("Auth Error: " + err);
    } else {
      this.currentState = state;
      this.currentStateDescription = (this.currentState == Characteristic.LockTargetState.SECURED) ? "locked" : "unlocked";
      this.lockservice.setCharacteristic(Characteristic.LockCurrentState, this.currentState);
    }
    this.log("Current lock state is " + this.currentStateDescription);
  }.bind(this));
}

bmwremote.prototype.getState = function(callback) {
  this.log("Current lock state is " + this.currentStateDescription);
  callback(null, this.currentState);
}

bmwremote.prototype.setState = function(state, callback) {
  var lockState = (state == Characteristic.LockTargetState.SECURED) ? "lock" : "unlock";
  this.log("Set state to", lockState);

  this.lockRequest(state, function() {
    this.log("Success", (lockState == "lock" ? "locking" : "unlocking"));
    this.currentState = (state == Characteristic.LockTargetState.SECURED) ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;
    this.currentStateDescription = (this.currentState == Characteristic.LockTargetState.SECURED) ? "locked" : "unlocked";

    this.lockservice.setCharacteristic(Characteristic.LockCurrentState, this.currentState);
    callback(null); // success
  }.bind(this), function(err) {
    return callback(null);
  });
}

bmwremote.prototype.lockRequest = function(state, onSuccess, onFailure) {
  this.getAuth(function(err) {
    if (err) {
      onFailure(err);
    }

    var callServiceType = (state == Characteristic.LockCurrentState.SECURED) ? "DOOR_LOCK" : "DOOR_UNLOCK";

    request.post({
      url: 'https://b2vapi.bmwgroup.us/webapi/v1/user/vehicles/' + this.vin + '/executeService',
      headers: {
        'User-Agent': 'MCVApp/1.5.2 (iPhone; iOS 9.1; Scale/2.00)',
        'Authorization': 'Bearer ' + this.authToken,
      },
      form : {
        'serviceType': callServiceType,
        'bmwSkAnswer': this.securityQuestionSecret,
      }
    }, function(err, response, body) {
      if (!err && response.statusCode == 200) {
        onSuccess(null);
      }
      else {
        console.log('ERROR REQUEST RESULTS: ', err, response.statusCode, body);
        onFailure(response.statusCode);
      }
    }.bind(this));
  }.bind(this));
}

bmwremote.prototype.stateRequest = function(callback) {
  this.getAuth(function(err) {
    if (err) {
      callback(err,this.currentState);
    }

    request.get({
      url: 'https://b2vapi.bmwgroup.us/webapi/v1/user/vehicles/' + this.vin +"/status",
      headers: {
        'User-Agent': 'MCVApp/1.5.2 (iPhone; iOS 9.1; Scale/2.00)',
        'Authorization': 'Bearer ' + this.authToken,
      },
      qs: {
        dlat: '1',
        dlon: '1'
      },
    }, function(err, response, body) {
      if (!err && response.statusCode == 200) {
      //  console.log(' resp', err, response.statusCode, body);
        var state = JSON.parse(body);
        var cState = (state["vehicleStatus"]["doorLockState"] == "UNLOCKED") ? Characteristic.LockCurrentState.UNSECURED  : Characteristic.LockCurrentState.SECURED;
        callback(null,cState);
      }
      else {
        callback( new Error(response.statusCode),this.currentState);
        console.log('ERROR REQUEST RESULTS:', err, response.statusCode, body);
      }
    }.bind(this));
  }.bind(this));
}

bmwremote.prototype.getServices = function() {
  return [this.lockservice];
}

bmwremote.prototype.getAuth = function(callback) {
  if (this.needsAuthRefresh() !== true) {
    return callback(null);
  }

  this.log ('Getting Auth Token');
    request.post({
      url: 'https://b2vapi.bmwgroup.us/webapi/oauth/token/',
      headers: {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'User-Agent': 'MCVApp/1.5.2 (iPhone; iOS 9.1; Scale/2.00)',
        'Authorization': 'Basic ' + this.authBasic,
      },
      form: {
        'username': this.username,
        'password': this.password,
        'scope':'remote_services vehicle_data',
        'grant_type':'password'
      }
    }, function(err, response, body) {
      if (!err && response.statusCode == 200) {
        var tokens = JSON.parse(body);
        var d = new Date();
        var n = d.getTime();

        this.refreshToken = tokens["refresh_token"];
        this.authToken = tokens["access_token"];
        this.refreshTime =  n + tokens["expires_in"] * 1000;
        this.log ('Got Auth Token: ' + this.authToken.substr(0,5));
        callback(null);
      }
      else{
        callback(response.statusCode);
      }
    }.bind(this));
}

bmwremote.prototype.needsAuthRefresh = function () {
  var currentDate = new Date();
  var now = currentDate.getTime();
  // console.log("Now   :" + now);
  // console.log("Later :" + this.refreshtime);
  return now > this.refreshTime;
}
