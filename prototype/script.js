const video = document.getElementById('video');
const videoContEl = document.querySelector('.video-container');
const btnContEl = document.querySelector('.button-container');
const imgCanvas = document.getElementById('img-canvas');

let stream = null;

// Capture Button
const capBtnEl = document.createElement('button');
capBtnEl.id = 'cap-btn';
capBtnEl.textContent = 'Capture';
// Camera Button
const camBtnEl = document.createElement('button');
camBtnEl.id = 'cam-btn';
camBtnEl.textContent = 'Open Camera';
// Face Landmarks Button
const lmBtnEl = document.createElement('button');
lmBtnEl.id = 'lm-btn';
lmBtnEl.textContent = 'Enable Face Landmarks';
// Face Expression Button
const expBtnEl = document.createElement('button');
expBtnEl.id = 'exp-btn';
expBtnEl.textContent = 'Enable Face Expression';

// load all the models before the camera opens
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
]).then(()=> {
    btnContEl.appendChild(capBtnEl);
    btnContEl.appendChild(camBtnEl);
    console.log('Models loaded');
    const labeledFaceDescriptors = await loadLabeledImages();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
    console.log('Face descriptors loaded');
});

function loadLabeledImages() {
    const labels = ['First', 'Mook', 'Prim'];
    return Promise.all(
        labels.map(async label => {
            const img = await faceapi.fetchImage(``)
        })
    )
}


// start video
async function startVideo() {
    try {
        stream = await navigator.mediaDevices.getUserMedia( {video: {}} )
        video.srcObject = stream;
        video.play();
    } catch (err) {
        console.error(err);
    }
}

// face detection
video.addEventListener('playing', ()=> {
    console.log('Video is playing');
    if (video.srcObject) {
        const videoCanvas = faceapi.createCanvasFromMedia(video);
        videoCanvas.id = "video-canvas";
        videoContEl.appendChild(videoCanvas);
        const displaySize = { width : video.width, height : video.height};
        faceapi.matchDimensions(videoCanvas, displaySize);
        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, 
                new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
            if (detections.length > 0) console.log('Face detected');
            const resizedDetections = faceapi.resizeResults(detections,displaySize);
            videoCanvas.getContext('2d').clearRect(0,0,videoCanvas.width,videoCanvas.height);
            faceapi.draw.drawDetections(videoCanvas, resizedDetections);
            if (lmBtnEl.textContent === 'Disable Face Landmarks') faceapi.draw.drawFaceLandmarks(videoCanvas, resizedDetections);
            if (expBtnEl.textContent === 'Disable Face Expression') faceapi.draw.drawFaceExpressions(videoCanvas, resizedDetections);
        }, 100)
    }
})

// press button to open camera
camBtnEl.addEventListener('click', () => {
    if (camBtnEl.textContent === 'Open Camera') {
        // start the webcam
        startVideo();
        camBtnEl.textContent = 'Close Camera';
        console.log('Open button clicked');
        // add option button
        btnContEl.appendChild(lmBtnEl);
        btnContEl.appendChild(expBtnEl);
    } else {
        // stop the webcam
        stream.getTracks().forEach( track => {
            if (track.readyState === 'live') {
                track.stop();
            }
        })
        video.srcObject = null;
        camBtnEl.textContent = 'Open Camera';
        console.log('Close button clicked');
        // remove option button
        btnContEl.removeChild(lmBtnEl);
        btnContEl.removeChild(expBtnEl);

        let tmpCanvas = document.getElementById('video-canvas');
        videoContEl.removeChild(tmpCanvas);
    }
});


// press button to toggle the visibility of face landmarks
lmBtnEl.addEventListener('click', () => {
    if (video.srcObject) {
        if (lmBtnEl.textContent === 'Enable Face Landmarks') {
            lmBtnEl.textContent = 'Disable Face Landmarks';
        } else {
            lmBtnEl.textContent = 'Enable Face Landmarks';
        }
    }  
})

// press button to toggle the visibility of face expression
expBtnEl.addEventListener('click', () => {
    if (video.srcObject) {
        if (expBtnEl.textContent === 'Enable Face Expression') {
            expBtnEl.textContent = 'Disable Face Expression';
        } else {
            expBtnEl.textContent = 'Enable Face Expression';
        }
    }  
})

// press button to capture
capBtnEl.addEventListener('click', ()=> {
    console.log('Capture button clicked');
    if (video.srcObject) {
        imgCanvas.width = video.videoWidth;
        imgCanvas.height = video.videoHeight;
        imgCanvas.getContext('2d').drawImage(video,0,0,imgCanvas.width,imgCanvas.height);
    }
})