const videoContEl = document.querySelector('.video-container');
const togContEl = document.querySelector('.toggle-container');

let stream = null;
let uiCanvas = null;
let blockCanvas = null;
let faceMatcher = null;
let faceDetected = false;
let camOpen = false;
let blockCalled = false;


// Video Element Setup
const video = document.createElement('video');
video.width = 840;
video.height = 630;
video.autoplay = true;
video.muted = true;

// Camera Toggle Button setup
const toggle = document.createElement('label');
toggle.innerHTML = 
    `<label class="switch">
        <input type="checkbox" onclick="checkToggle()" id="toggle-btn">
        <span class="slider round"></span>
    </label>`;

function checkToggle() {
    if (video.srcObject) {
        const togBtn = document.getElementById('toggle-btn');
        blockCanvas = faceapi.createCanvasFromMedia(video);
        blockCanvas.id = 'block-canvas';
        const displaySize = { width : video.width, height : video.height };
        faceapi.matchDimensions(blockCanvas, displaySize);
        const ctx = blockCanvas.getContext('2d');
        ctx.font = '25px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'red';
        ctx.fillText("Your camera is blocked", blockCanvas.width/2, blockCanvas.height/20);
        if (!togBtn.checked) { 
            videoContEl.appendChild(blockCanvas);
            camOpen = false;
        } else {
            videoContEl.removeChild(document.getElementById('block-canvas'));
            camOpen = true;
        }
    }
}

// load all the models before the camera opens
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
]).then(()=> {
    console.log('Models loaded');
    loadFaceDescriptor();
});


async function loadFaceDescriptor() {
    document.getElementById('load-desc').textContent = 'Loading face descriptors';
    const labeledFaceDescriptors = await loadLabeledImages();
    faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
    document.querySelector('.loader').remove();
    document.getElementById('load-desc').remove();
    console.log('Face descriptors loaded');
    startVideo();
}

//load labeled images to get face descriptors
async function loadLabeledImages() {
    const labels = ['Mooktean', 'Prim', 'First'];
    return Promise.all(
        labels.map(async label => {
            const descriptions = [];
            for (let i = 1; i <= 2; i++) {
                const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/phuriy2/Smart-Mirror/main/sample_picture/${label}/${i}.jpg`);
                const loadDetections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                if (!loadDetections) console.log(`Descriptor is undefined at ${label} Picture ${i}`)
                descriptions.push(loadDetections.descriptor);
            }
            
            return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
    )
}

// start video
async function startVideo() {
    try {
        if (navigator.mediaDevices === undefined) {
            navigator.mediaDevices = {};
        }

        if (navigator.mediaDevices.getUserMedia === undefined) {
            navigator.mediaDevices.getUserMedia = constraints => {
                let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

                if (!getUserMedia) {
                    return Promise.reject(new Error('getUserMedia is not implemented in this browser.'));
                }

                return new Promise( (resolve, reject) => {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            }
        }
        stream = await navigator.mediaDevices.getUserMedia( {video: {}} )
        if ("srcObject" in video) {
            video.srcObject = stream;
        } else {
            video.src = window.URL.createObjectURL(stream);
        }
        videoContEl.appendChild(video);
        togContEl.appendChild(toggle);
        video.onloadedmetadata = () => {
            video.play();
        }
    } catch (err) {
        console.error(err);
    }
}

// UI on mirror
function createFrame() {
    uiCanvas = faceapi.createCanvasFromMedia(video);
    uiCanvas.id = 'ui-canvas';
    const displaySize = { width : video.width, height : video.height };
    faceapi.matchDimensions(uiCanvas, displaySize);
    const ctx = uiCanvas.getContext('2d');
    let today = new Date();
    ctx.font = '90px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    let hour = today.getHours();
    let minute = today.getMinutes();
    if (today.getHours() < 10) {
        hour = "0" + hour;
    }
    if (today.getMinutes() < 10) {
        minute = "0" + minute;
    }
    ctx.fillText(hour + ':' + minute, uiCanvas.width/2, uiCanvas.height*0.22);
    ctx.font = '30px sans-serif';
    let day = getDay(today.getDay());
    let month = getMonth(today.getMonth());
    ctx.fillText(day + ', ' + today.getDate() + ' ' + month, uiCanvas.width/2, uiCanvas.height*0.27);
    videoContEl.appendChild(uiCanvas);
}

function resetFrame() {
    videoContEl.removeChild(document.getElementById('ui-canvas'));
    createFrame();
}

function getDay(num) {
    switch (num) {
        case 0: return "Sunday";
        case 1: return "Monday";
        case 2: return "Tuesday";
        case 3: return "Wednesday";
        case 4: return "Thursday";
        case 5: return "Friday";
        case 6: return "Saturday";
    }
}

function getMonth(num) {
    switch (num) {
        case 0: return "January";
        case 1: return "February";
        case 2: return "March";
        case 3: return "April";
        case 4: return "May";
        case 5: return "June";
        case 6: return "July";
        case 7: return "August";
        case 8: return "September";
        case 9: return "October";
        case 10: return "November";
        case 11: return "December";
    }
}


// face recognition
video.addEventListener('playing', () => {
    console.log('Video is playing');
    if (video.srcObject && !faceDetected) {
        let name = 'undefined';
        checkToggle();
        createFrame();
        const frameInterval = setInterval(async () => {
            resetFrame();
            if (!camOpen) {
                if (!blockCalled) {
                    speechSynthesis.speak(new SpeechSynthesisUtterance('Please open your camera to continue'));
                    blockCalled = true;
                }
            } else {
                if (!faceDetected) {
                    faceapi.createCanvasFromMedia(video).toBlob(async blob => {
                        const img = await faceapi.bufferToImage(blob);
                        const canvas = faceapi.createCanvasFromMedia(img);
                        const displaySize = { width : img.width, height : img.height };
                        faceapi.matchDimensions(canvas, displaySize);
                        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceExpressions().withFaceDescriptor();
                        if (detection) {
                            let expArray = Object.values(detection.expressions);
                            let max = Math.max(...expArray);
                            let emotion = Object.keys(detection.expressions).find(key => detection.expressions[key] === max);
                            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                            name = bestMatch.toString().split(" (")[0];
                            if (name != 'undefined' && name != 'unknown' && !faceDetected) {
                                faceDetected = true;
                                greetUser(name, emotion);
                            }
                        }
                    })
                }    
            }
        }, 100);     
    }
})

function greetUser(userName, userEmotion) {
    if (video.srcObject && faceDetected) {
        speechSynthesis.speak(new SpeechSynthesisUtterance('Hello ' + userName));
        if (userEmotion === 'happy' || userEmotion === 'sad' || userEmotion === 'angry') {
            speechSynthesis.speak(new SpeechSynthesisUtterance('You look '+ userEmotion + 'today'));
            speechSynthesis.speak(new SpeechSynthesisUtterance('Is there something you want to share?'));
        } else speechSynthesis.speak(new SpeechSynthesisUtterance('How are you today?'));
        // waitForResponse();
    }
}

// function waitForResponse() {
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (typeof SpeechRecognition != "undefined") {
//         const recognition = new SpeechRecognition();
//         recognition.continuous = true;
//         recognition.start();
//         recognition.onresult = event => {
//             const res = event.results[0];
//             const text = res[0].transcript
//             if (res.isFinal) {
//                 console.log(text);
//                 let textSentiment = 0;
//                 fetch(`/mirror?text=${text}`)
//                 .then(response => response.json())
//                 .then(result => {
//                     if (text.indexOf('*')!= -1) textSentiment -= 5;
//                     textSentiment += result.score;
//                 })
//                 console.log(textSentiment);
//             }
//         }
//     }
// }