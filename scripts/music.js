var trackPath = '';
var audioContext;
var audioBuffers = {};

function initSounds(){
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext =  new AudioContext();
}

function playImmediately(buffer){
    playDeferred(buffer, 0);
}
function playDeferred(buffer, time){
    source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(audioContext.currentTime + time / 1000);
}

function loadSong(src) {return new Promise(function(resolve, reject) {
    fetch(src).then(response=>{
    response.blob().then(blob=>{
    readFile(blob).then(result => {
    audioContext.decodeAudioData(result).then(buf=>{
    audioBuffers[src] = buf;
    //playImmediately(buf);
    resolve();
    });
    });
    });
    });
});}