const camBtnEl = document.getElementById('cam-btn');
const video = document.getElementById('video');
let stream = null;

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
    } catch (err) {
        console.error(err);
    }
}

// press button to open camera
camBtnEl.addEventListener('click', () => {
    if (camBtnEl.textContent === 'Open Camera') {
        // start the webcam
        startVideo();
        camBtnEl.textContent = 'Close Camera';
        openCam = true;
        console.log('Open button clicked');
    } else {
        // stop the webcam
        stream.getTracks().forEach( track => {
            if (track.readyState === 'live') {
                track.stop();
            }
        })
        video.srcObject = null;
        camBtnEl.textContent = 'Open Camera';
        openCam = false;
        console.log('Close button clicked');
    }
});

// face detection
video.addEventListener('playing', ()=> {
    console.log('Video is playing')
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width : video.width, height : video.height};
    faceapi.matchDimensions(canvas, displaySize);
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video,
            new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks().withFaceExpressions();
        const resizedDetections = faceapi.resizeResults(detections,displaySize);
        canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }, 100)
})