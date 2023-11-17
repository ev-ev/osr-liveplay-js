var abs=Math.abs;
var ready=0;
var CURSORSZ = 70;

var displayText = '';

var replayData = []; //TimeMS x y keypressed
var replayIdx = 0;
var replayStartTime = 0;
var replayTimeSum = 0;

var assets = {};

function readFile(blob){return new Promise((resolve, reject) => {
    var reader = new FileReader();  
    reader.onload = () => {resolve(reader.result )};
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
})};


function loadImage(src){
    return new Promise(function (resolve,reject){
        const image = new Image();
        image.addEventListener('load', ()=>{
            resolve(image);
        });
        image.src = src;
    });
}

function setup(){

    
    var out = document.getElementById('out');
    var canvas = document.getElementById('canvas');
    w = canvas.getBoundingClientRect().width;
    h = canvas.getBoundingClientRect().height;
    c = canvas.getContext('2d');
    
    
    initSounds();
    
    loadImage('skins/yugen/cursor@2x.png').then(cursorImage => { assets['cursorImage'] = cursorImage;
    loadReplay().then(replayValues => {
    replayData = replayValues['replayData'];
    replayTimeSum = replayValues['replayTimeSum'];
    loadImage(replayValues['bg-src']).then(backgroundImage => {assets['backgroundImage'] = backgroundImage;
    loadSong(replayValues['music-src']).then(()=>{
    console.log(audioBuffers);
    
    replayStartTime = Date.now() - replayTimeSum; //Adjust time to now
    console.log(-replayTimeSum);
    playDeferred(audioBuffers[replayValues['music-src']],-replayTimeSum*2);
    ready = 1; //Start
    });
    });
    });
    });
    
    
    
    renderer = setInterval(function() { render(); },10);
    
}


function drawCursor(x, y) {
    function scaleX(x){ return ( (x) / 512 ) * w; }
    function scaleY(y){ return ( (y) / 384 ) * h; }
    //console.log(scaleX(x),scaleY(y));
    c.drawImage(assets['cursorImage'], scaleX(x) - CURSORSZ / 2, scaleY(y) - CURSORSZ / 2,CURSORSZ,CURSORSZ);
}

function render() {
    if (assets['backgroundImage']){c.drawImage(assets['backgroundImage'], 0, 0, w, h);}
    c.fillStyle = 'rgba(17, 17, 17, 0.7)';
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(195, 195, 195, 0.7)'
    c.fillText(displayText,10,10);
    
    
    if ((replayData.length !== 0) && (replayIdx < replayData.length - 1) && ready){
        if (Date.now() - replayStartTime > replayTimeSum) {
            drawCursor(replayData[replayIdx][1],replayData[replayIdx][2]);
            var i = 0;
            while ((Date.now() - replayStartTime > replayTimeSum) && (replayIdx < replayData.length - 1)) {
                replayTimeSum += abs(replayData[replayIdx][0]);
                replayIdx += 1;
                i += 1;
            }
            displayText = "frames skipped: "+(i-1);
        } else {
            drawCursor(replayData[replayIdx][1],replayData[replayIdx][2]);
        }
    }
    

    
    
    
    //if (Date.now() - replayStartTime > replayData[replayIdx][0]){
    //    drawCursor(replayData[replayIdx][1],replayData[replayIdx][2])
    //    while (Date.now() - replayData[replayIdx][0] > replayData[replayIdx][0]) {replayIdx += 1;}
    //}
    
}

var firstSetup = true;
document.addEventListener('click', function (e) {
    if (firstSetup){setup();firstSetup=false;}
})