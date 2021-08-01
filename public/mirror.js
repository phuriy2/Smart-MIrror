const videoContEl = document.querySelector('.video-container');
const togContEl = document.querySelector('.toggle-container');

let stream = null;
let canvas = null;
let faceMatcher = null;
let faceDetected = false;
let canvasOpen = false;


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
        if (togBtn.checked != true) {
            canvas = faceapi.createCanvasFromMedia(video);
            const displaySize = { width : video.width, height : video.height };
            faceapi.matchDimensions(canvas, displaySize);
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'red';
            ctx.fillText("Your camera is blocked.", canvas.width/2, canvas.height/8);

            if (!canvasOpen) {
                videoContEl.appendChild(canvas);
                canvasOpen = true;
            }
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
        stream = await navigator.mediaDevices.getUserMedia( {video: {}} )
        video.srcObject = stream;
        videoContEl.appendChild(video);
        togContEl.appendChild(toggle);
        video.play();
    } catch (err) {
        console.error(err);
    }
}

// face recognition
video.addEventListener('playing', () => {
    console.log('Video is playing');
    if (video.srcObject && !faceDetected) {
        let name = 'undefined';
        const recInterval = setInterval(async () => {
            faceapi.createCanvasFromMedia(video).toBlob(async blob => {
                const img = await faceapi.bufferToImage(blob);
                canvas = faceapi.createCanvasFromMedia(img);
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
                        clearInterval(recInterval);
                    }
                }
            })
        }, 100)
    }
})

function greetUser(userName, userEmotion) {
    if (video.srcObject && faceDetected) {
        speechSynthesis.speak(new SpeechSynthesisUtterance('Hello ' + userName));
        if (userEmotion === 'happy' || userEmotion === 'sad') {
            speechSynthesis.speak(new SpeechSynthesisUtterance('You look '+ userEmotion));
        }
        speechSynthesis.speak(new SpeechSynthesisUtterance('How are you doing?'));
        // const canvas = faceapi.createCanvasFromMedia(video);
        // const displaySize = { width : video.width, height : video.height};
        // faceapi.matchDimensions(canvas, displaySize);
        // const ctx = canvas.getContext("2d");
        // ctx.font = "30px sans-serif";
        // ctx.textAlign = "center";
        // ctx.fillStyle = "white";
        // ctx.fillText("Hello, " + userName, canvas.width/2, canvas.height/2);
        // ctx.fillText("You look " + userEmotion, canvas.width/2, canvas.height*9/16);
        // videoContEl.appendChild(canvas);
    }
}