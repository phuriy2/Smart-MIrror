const videoContEl = document.querySelector('.video-container');

let stream = null;
let faceMatcher = null;


// Video Element Setup
const video = document.createElement('video');
video.width = 840;
video.height = 630;
video.autoplay = true;
video.muted = true;


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
    document.getElementById('load-desc').textContent = 'Loading face descriptor...';
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
            for (let i = 1; i <= 5; i++) {
                const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/phuriy2/Smart-Mirror/main/prototype/sample_picture/${label}/${i}.jpg`);
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
        video.play();
    } catch (err) {
        console.error(err);
    }
}