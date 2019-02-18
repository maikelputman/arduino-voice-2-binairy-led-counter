//Is een getal wel een normale integer (positief getal)
function isNormalInteger(str) {
  var n = Math.floor(Number(str));
  return n !== Infinity && String(n) === str && n >= 0;
}

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent =
  SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
var spraakherkenning = new SpeechRecognition();
spraakherkenning.lang = "nl-NL";
spraakherkenning.interimResults = true;
spraakherkenning.maxAlternatives = 1;
var timeout_status;
var timeout_start;
let timeout_einde_woorden;
let timeout_response;

//Spraakherkenning staat nu meteen aan
spraakherkenning.start();

//Als er een resultaat is.
spraakherkenning.onresult = function(geluid) {
  if ($("body").hasClass("online")) {
    let onthouden_getal = "";
    let onthouden_somteken = "";
    let tonen_op_arduino = false;
    let uiteindelijke_getal = "";
    //Timeout verwijderen, omdat er nieuwe woorden komen die weer tot de zin horen.
    clearTimeout(timeout_einde_woorden);
    //Aangeven dat er een opdracht wordt verwerkt
    $("body").addClass("verwerken");
    $(".statusbalk .status").html("verwerken");
    //Ontvangen geluid omzetten in woorden (getrimmed en lowercase)
    let omgezettespraak = geluid.results[
      geluid.results.length - 1
    ][0].transcript
      .trim()
      .toLowerCase();
    let woorden = omgezettespraak.trim().split(" ");
    //Timeout om midden in de zin tegen te houden
    timeout_einde_woorden = setTimeout(() => {
      //Alle woorden langs om een getal of simpele som te vinden
      $.each(woorden, (index, value) => {
        if (isNormalInteger(value) && Number(value) >= 0) {
          onthouden_getal = value;
          if (onthouden_somteken != "" && uiteindelijke_getal != "") {
            switch (onthouden_somteken) {
              case "+":
                uiteindelijke_getal =
                  parseInt(uiteindelijke_getal) + parseInt(onthouden_getal);
                break;
              case "-":
                uiteindelijke_getal =
                  parseInt(uiteindelijke_getal) - parseInt(onthouden_getal);
                break;
              case "*":
                uiteindelijke_getal =
                  parseInt(uiteindelijke_getal) * parseInt(onthouden_getal);
                break;
            }
            onthouden_somteken = "";
          } else {
            uiteindelijke_getal = onthouden_getal;
          }
          tonen_op_arduino = true;
        }
        switch (value) {
          case "plus":
            onthouden_somteken = "+";
            break;
          case "min":
          case "minus":
            onthouden_somteken = "-";
            break;
          case "keer":
          case "maal":
            onthouden_somteken = "*";
            break;
        }
      });

      $("body").removeClass("verwerken");
      //Als er een getal of som met uitkomst was gevonden, deze doorgeven aan de arduino.
      if (tonen_op_arduino) {
        $.ajax({
          url: "http://localhost:9000/" + uiteindelijke_getal + "/",
          success: data => {
            console.log(data.message);
            clearTimeout(timeout_response);
            console.log($(".statusbalk .response"));
            $(".statusbalk .response").html(data.message);
            timeout_response = setTimeout(() => {
              $(".statusbalk .response").html("");
            }, 3000);
          }
        });
      }
    }, 500);
  }
};

//Als het geluid is afgelopen, dan recordericoon inactief maken
spraakherkenning.onsoundend = function() {
  $("#recorder").removeClass("actief");
  spraakherkenning.stop();
};

//Als er iets wordt opgepikt icoontje kleuren voor gebruiker aan te geven dat er wordt geluisterd
spraakherkenning.onsoundstart = function() {
  clearTimeout(timeout_status);
  $("#recorder")
    .addClass("actief")
    .addClass("analyseren")
    .removeClass("statustonen")
    .removeClass("geldig")
    .removeClass("ongeldig");
};

//Opnieuw starten van de recorder als deze stopt
spraakherkenning.onend = function() {
  spraakherkenning.start();
};

//Error met recorder, opnieuw starten van de recorder
spraakherkenning.onerror = function(geluid) {
  clearTimeout(timeout_start);
  spraakherkenning.stop();
};

//Interval checken van verbinding met Arduino en deze tonen
setInterval(() => {
  $.ajax({
    url: "http://localhost:9000/checkstatus/",
    timeout: 2500,
    success: data => {
      $("body")
        .removeClass("verbonden")
        .removeClass("online");
      $("body").addClass(data.status);
      if (!$("body").hasClass("verwerken")) {
        $(".statusbalk .status").html(data.status);
      }
    },
    error: () => {
      console.log("error");
      $("body")
        .removeClass("verbonden")
        .removeClass("online");
      $(".statusbalk .status").html("offline");
    }
  });
}, 100);
