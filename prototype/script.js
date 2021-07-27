const camBtnEl = document.getElementById('cam-btn');
const capBtnEl = document.getElementById('cap-btn');
const video = document.getElementById('video');
const imgCanvas = document.getElementById('canvas');
const photo = document.getElementById('photo');
let stream = null;
let videoCanvas = null;

// load all the models before the camera opens
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models'),
]).then(()=> {
    console.log('Models loaded');
});


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
video.addEventListener('canplay', ()=> {
    console.log('Video is playing')
    videoCanvas = faceapi.createCanvasFromMedia(video);
    document.body.append(videoCanvas);
    const displaySize = { width : video.width, height : video.height};
    faceapi.matchDimensions(videoCanvas, displaySize);
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video,
            new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks().withFaceExpressions();
        if (detections.length > 0) console.log('Face detected');
        const resizedDetections = faceapi.resizeResults(detections,displaySize);
        videoCanvas.getContext('2d').clearRect(0,0,videoCanvas.width,videoCanvas.height);
        faceapi.draw.drawDetections(videoCanvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(videoCanvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(videoCanvas, resizedDetections);
    }, 100)
})

// press button to open camera
camBtnEl.addEventListener('click', () => {
    if (camBtnEl.textContent === 'Open Camera') {
        // start the webcam
        startVideo();
        camBtnEl.textContent = 'Close Camera';
        console.log('Open button clicked');
    } else {
        // stop the webcam
        stream.getTracks().forEach( track => {
            if (track.readyState === 'live') {
                track.stop();
            }
        })
        video.srcObject = null;
        videoCanvas.getContext('2d').clearRect(0,0,videoCanvas.width,videoCanvas.height);
        camBtnEl.textContent = 'Open Camera';
        console.log('Close button clicked');
    }
}, false);

// press button to capture
capBtnEl.addEventListener('click', ()=> {
    console.log('Capture button clicked');
    if (video.srcObject) {
        imgCanvas.getContext('2d').drawImage(video,0,0,video.width,video.height);
        let data = imgCanvas.taDataURL('image/png');
        photo.setAttribute('src', data);
    }
})