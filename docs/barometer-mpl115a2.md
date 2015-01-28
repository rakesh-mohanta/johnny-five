<!--remove-start-->

# Barometer - MPL115A2



Run with:
```bash
node eg/barometer-mpl115a2.js
```

<!--remove-end-->

```javascript
var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function() {
  var barometer = new five.Barometer({
    controller: "MPL115A2"
  });

  barometer.on("data", function() {
    console.log("barometer");
    console.log("  pressure : ", this.pressure);
    console.log("--------------------------------------");
  });
});


```


## Illustrations / Photos


### Breadboard for "Barometer - MPL115A2"



![docs/breadboard/barometer-mpl115a2.png](breadboard/barometer-mpl115a2.png)<br>

&nbsp;





## Additional Notes
- [MPL115A2 - I2C Barometric Pressure/Temperature Sensor](https://www.adafruit.com/product/992)

&nbsp;

<!--remove-start-->

## License
Copyright (c) 2012, 2013, 2014 Rick Waldron <waldron.rick@gmail.com>
Licensed under the MIT license.
Copyright (c) 2014, 2015 The Johnny-Five Contributors
Licensed under the MIT license.

<!--remove-end-->
