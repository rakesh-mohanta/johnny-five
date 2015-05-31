var Board = require("../lib/board.js");
var Pins = Board.Pins;
var __ = require("../lib/fn.js");
var events = require("events");
var util = require("util");

// Button instance private data
var priv = new Map(),
  aliases = {
    down: ["down", "press", "tap", "impact", "hit"],
    up: ["up", "release"]
  };


var Controllers = {
  DEFAULT: {
    initialize: {
      value: function(opts, dataHandler) {

        var isFirmata = Pins.isFirmata(this);

        if (isFirmata && typeof opts.pinValue === "string" && opts.pinValue[0] === "A") {
          opts.pinValue = this.io.analogPins[+opts.pinValue.slice(1)];
        }

        this.pin = +opts.pinValue;

        // Set the pin to INPUT mode
        this.mode = this.io.MODES.INPUT;

        // Option to enable the built-in pullup resistor
        this.isPullup = opts.isPullup || false;

        this.io.pinMode(this.pin, this.mode);

        // Enable the pullup resistor after setting pin mode
        if (this.isPullup) {
          this.io.digitalWrite(this.pin, this.io.HIGH);
        }

        this.io.digitalRead(this.pin, dataHandler);
      }
    },
    toBoolean: {
      value: function(raw) {
        return raw === this.downValue;
      }
    }
  }
};

/**
 * Button
 * @constructor
 *
 * five.Button();
 *
 * five.Button({
 *   pin: 10
 * });
 *
 *
 * @param {Object} opts [description]
 *
 */

function Button(opts) {
  if (!(this instanceof Button)) {
    return new Button(opts);
  }

  var pinValue;
  var raw;
  var controller = null;
  var state = {
    previous: null,
    held: null
  };

  // Create a 5 ms debounce boundary on event triggers
  // this avoids button events firing on
  // press noise and false positives
  var trigger = __.debounce(function(key) {
    aliases[key].forEach(function(type) {
      this.emit(type, null);
    }, this);
  }, 7);

  pinValue = typeof opts === "object" ? opts.pin : opts;

  Board.Component.call(
    this, opts = Board.Options(opts)
  );

  opts.pinValue = pinValue;

  if (opts.controller && typeof opts.controller === "string") {
    controller = Controllers[opts.controller.toUpperCase()];
  } else {
    controller = opts.controller;
  }

  if (controller == null) {
    controller = Controllers["DEFAULT"];
  }

  Object.defineProperties(this, controller);

  // Turns out some button circuits will send
  // 0 for up and 1 for down, and some the inverse,
  // so we can invert our function with this option.
  // Default to invert in pullup mode, but use opts.invert
  // if explicitly defined (even if false)
  this.invert = typeof opts.invert !== "undefined" ?
    opts.invert : (this.isPullup || false);

  this.downValue = this.invert ? 0 : 1;
  this.upValue = this.invert ? 1 : 0;

  // Button instance properties
  this.holdtime = opts.holdtime || 500;

  // Create a "state" entry for privately
  // storing the state of the button
  priv.set(this, state);

  Object.defineProperties(this, {
    value: {
      get: function() {
        return Number(this.isDown);
      }
    },
    isDown: {
      get: function() {
        return this.toBoolean(raw);
      }
    }
  });

  if (typeof this.initialize === "function") {
    this.initialize(opts, function(data) {
      var err = null;

      state.previous = raw;

      raw = data;

      // data = upValue, this.isDown = true
      // indicates that the button has been released
      // after previously being pressed
      if (state.previous !== raw && !this.isDown) {
        trigger.call(this, "up");
        state.held = null;
      }

      // data = downValue, this.isDown = false
      // indicates that the button has been pressed
      // after previously being released
      if (this.isDown) {
        if (state.previous === raw &&
            (state.held !== null && Date.now() > state.held + this.holdtime)) {
          this.emit("hold", err);
        }

        if (state.previous !== raw) {
          // Call debounced event trigger for given "key"
          // This will trigger all event aliases assigned
          // to "key"
          trigger.call(this, "down" /* key */ );

          if (state.held === null) {
            state.held = Date.now();
          }
        }
      }
    }.bind(this));
  }
}

util.inherits(Button, events.EventEmitter);


/**
 * Fired when the button is pressed down
 *
 * @event
 * @name down
 * @memberOf Button
 */

/**
 * Fired when the button is held
 *
 * @event
 * @name hold
 * @memberOf Button
 */

/**
 * Fired when the button is released
 *
 * @event
 * @name up
 * @memberOf Button
 */


module.exports = Button;
