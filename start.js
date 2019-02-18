function isNormalInteger(str) {
  var n = Math.floor(Number(str));
  return n !== Infinity && String(n) === str && n >= 0;
}

const five = require("johnny-five");
const board = new five.Board();
const sleep = require("sleep");

const express = require("express");
const app = new express();

let status = "verbonden";
let ledinterval;
let rgbled;
let leds = [];
let timer_ledindicator;
let http = require("http");
let url = require("url");

board.on("ready", () => {
  console.log("Arduino is er klaar voor [YEAH, LET'S GO!!] {Eats Snickers} ");

  rgbled = new five.Led.RGB({ pins: { red: 3, green: 5, blue: 6 } });
  leds[1] = new five.Led(11);
  leds[2] = new five.Led(13);
  leds[3] = new five.Led(12);
  leds[4] = new five.Led(2);
  leds[5] = new five.Led(10);
  leds[6] = new five.Led(9);
  leds[7] = new five.Led(8);

  nightrider_leds();

  status = "online";
});

function clear_all_leds() {
  leds.forEach((waarde, key) => {
    leds[key].off();
  });
}

function flash_error_leds() {
  clear_all_leds();
  clearTimeout(timer_ledindicator);
  clearInterval(ledinterval);
  ledinterval = setInterval(() => {
    leds.forEach((waarde, key) => {
      leds[key].toggle();
    });
  }, 50);
  rgbled.color("#FF0000");
  rgbled.on();
  timer_ledindicator = setTimeout(() => {
    clearInterval(ledinterval);
    clear_all_leds();
    rgbled.off();
    nightrider_leds();
  }, 3000);
}

function show_number_in_binairy_with_leds(getal, external_input = false) {
  clear_all_leds();
  //Show new number
  tempgetal = getal;
  let lednummer = 0;
  for (let deler = 64; deler >= 1; deler = Math.floor(deler / 2)) {
    lednummer++;
    if (Math.floor(tempgetal / deler) > 0) {
      leds[lednummer].on();
      tempgetal = tempgetal - deler;
    }
  }
  if (external_input) {
    clearTimeout(timer_ledindicator);
    rgbled.color("#0000FF");
    rgbled.on();
    timer_ledindicator = setTimeout(() => {
      rgbled.off();
      clear_all_leds();
      nightrider_leds();
    }, 3000);
  }
}

//Tuntuntuntun tuntuntuntun tuntuntuntuntuntun
function nightrider_leds() {
  let links_naar_rechts = true;
  let huidig_ledje = 0;
  let streep = 0;

  rgbled.off();
  rgbled.color("#00FF00");

  //Counter on interval
  ledinterval = setInterval(() => {
    clear_all_leds();
    let leds_actief_maken = [];
    if (huidig_ledje < leds.length - 1) {
      huidig_ledje++;
      if (streep < 2 && huidig_ledje > 1) {
        streep++;
      }
    } else {
      if (streep > 0) {
        streep--;
      } else {
        if (!links_naar_rechts) {
          sleep.msleep(1100);
        } else {
          sleep.msleep(140);
        }
        links_naar_rechts = !links_naar_rechts;
        huidig_ledje = 1;
      }
    }
    if (links_naar_rechts) {
      leds_actief_maken.push(huidig_ledje);
      for (let teller = 1; teller <= streep; teller++) {
        leds_actief_maken.push(huidig_ledje - teller);
      }
    } else {
      leds_actief_maken.push(leds.length - huidig_ledje);
      for (let teller = 1; teller <= streep; teller++) {
        leds_actief_maken.push(leds.length - huidig_ledje + teller);
      }
    }
    for (let key in leds_actief_maken) {
      leds[leds_actief_maken[key]].on();
    }
  }, 35);
}

function count_up_binairy_on_leds() {
  let getal = 0;
  let tempgetal;

  rgbled.off();
  rgbled.color("#00FF00");

  //Counter on interval
  ledinterval = setInterval(() => {
    if (getal == 64 + 32 + 16 + 8 + 4 + 2 + 1) {
      getal = 1;
    } else {
      getal++;
    }

    show_number_in_binairy_with_leds(getal, false);
  }, 50);
}

app.use(express.static("assets"));

//Normale website
app.get("/", function(request, response) {
  response.sendfile("index.html");
});

//Api call voor status
app.get("/checkstatus/", function(request, response) {
  response.json({ status });
});

//Api call voor getal te tonen
app.get("/:getal/", function(request, response) {
  let getal_doorgegeven = request.params.getal;
  if (
    isNormalInteger(getal_doorgegeven) &&
    Number(getal_doorgegeven) >= 0 &&
    Number(getal_doorgegeven) <= 64 + 32 + 16 + 8 + 4 + 2 + 1
  ) {
    clearInterval(ledinterval);
    show_number_in_binairy_with_leds(getal_doorgegeven, true);
    console.log(`[log] Instructie '${getal_doorgegeven}' uitgevoerd!`);
    response.writeHead(200, {
      "Content-Type": "application/json"
    });
    response.end(
      JSON.stringify({
        message:
          "Uitgevoerd: Ardiuno geeft nu getal " + getal_doorgegeven + " aan"
      })
    );
  } else {
    console.log(`[log] Instructie '${getal_doorgegeven}' niet uitgevoerd!`);
    flash_error_leds();
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        message:
          "Fout: Geen getal (of niet tussen de 0 en de " +
          (64 + 32 + 16 + 8 + 4 + 2 + 1) +
          ")"
      })
    );
  }
});

var server = app.listen(9000, function() {
  var port = server.address().port;
  console.log(
    "API LUISTERT VOOR INPUT. {Hij biedt een luisterend oor!} op poort " + port
  );
});
