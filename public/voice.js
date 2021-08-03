const startBtn = document.getElementById('start');
const result = document.getElementById('result');
const processing = document.getElementById('processing');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
let grammar = '#JSGF V1.0';

if (typeof SpeechRecognition === "undefined") {
    startBtn.remove();
    result.innerHTML = '<b>Browser does not support Speech API</b>';
}

const recognition = new SpeechRecognition();
const grammarList = new SpeechGrammarList();
const speechSynth = window.speechSynthesis;
grammarList.addFromString(grammar, 1);
recognition.grammars = grammarList;
recognition.continuous = true;
recognition.interimResults = true;

let listening = false;
toggleBtn = () => {
    if (listening) {
        recognition.stop();
        startBtn.textContent = "Start listening";
    } else {
        recognition.start();
        startBtn.textContent = "Stop listening";
    }
    listening = !listening;
}

startBtn.addEventListener("click", toggleBtn);

recognition.onresult = event => {
    const last = event.results.length - 1;
    const res = event.results[last];
    const text = res[0].transcript;
    if (res.isFinal) {
        processing.innerHTML = "Processing...";
        const response = process(text);

        const p = document.createElement('p');
        p.innerHTML = `You said ${text}`;


        fetch(`/voice?text=${text}`)
        .then(response => response.json())
        .then(result => {
            if (text.indexOf('*')!= -1) result.score -= 5;
            if (result.score < 0) {
                p.innerHTML += `<br>Your sentence was negative!`;
            } else if (result.score > 0) {
                p.innerHTML += `<br>Your sentence was positive!`;
            }
        })

        p.innerHTML += `<br>Siri said ${response}`;


        processing.innerHTML = "";
        result.appendChild(p);
        synthResponse = new SpeechSynthesisUtterance(response);
        speechSynth.speak(synthResponse);
        
        synthResponse.onstart = () => {
            if (listening) {
                recognition.abort();
                console.log('Recognition aborted');
            }
        }

        synthResponse.onend = () => {
            if (listening) {
                recognition.start();
                console.log('Recognition started');
            }
        }
    } else {
        processing.innerHTML = `listening: ${text}`;
    }
}

function process(rawText) {
    // remove space and lowercase text
   let text = rawText.replace(/\s/g, "");
   text = text.toLowerCase();
   let response = null;
   switch(text) {
      case "hello":
         response = "hi, how are you doing?"; break;
      case "what'syourname":
         response = "My name's Siri.";  break;
      case "howareyou":
         response = "I'm good."; break;
      case "whattimeisit":
         response = new Date().toLocaleTimeString(); break;
      case "stop":
         response = "Bye!!";
         toggleBtn(); // stop listening
   }
   if (!response) {
      window.open(`http://google.com/search?q=${rawText.replace("search", "")}`, "_blank");
      return "I found some information for " + rawText;
   }
   return response;

}

