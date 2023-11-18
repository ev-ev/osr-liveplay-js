var abs=Math.abs;
var ready=0;
var CURSORSZ = 70;

var displayText = '';

var replayData = []; //TimeMS x y keypressed
var replayIdx = 0;
var replayStartTime = 0;
var replayTimeSum = 0;
var songStart;

var mapHit = [];
var mapHitIdx = 0;
var mapIn = [];
var mapOD3 = 80;
var mapOD1 = 140;
var mapOD5 = 200;
var mapARpreempt = 1200;
var mapARfull = 800;

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
    loadImage('skins/yugen/hitcircle@2x.png').then(hitCircleImage => { assets['hitCircle'] = hitCircleImage;
    loadImage('skins/yugen/hitcircleoverlay@2x.png').then(hitCircleOverlayImage => { assets['hitCircleOverlay'] = hitCircleOverlayImage;
    loadReplay().then(replayValues => {
    replayData = replayValues['replayData'];
    replayTimeSum = replayValues['replayTimeSum'];
    songStart = -replayTimeSum;
    loadImage(replayValues['bg-src']).then(backgroundImage => {assets['backgroundImage'] = backgroundImage;
    loadMap(replayValues['map-src']).then(mapValues => { console.log(mapValues);
    mapHit = mapValues['HitObjects'].map(e=>[Number(e[0]),Number(e[1]),Number(e[2]),Number(e[3]),Number(e[4]),e[5],e[6]]);
    mapOD3 = 80 - 6 * mapValues['Difficulty']['OverallDifficulty'];
    mapOD1 = 140 - 8 * mapValues['Difficulty']['OverallDifficulty'];
    mapOD5 = 200 - 10 * mapValues['Difficulty']['OverallDifficulty'];
    var mapAR = Number(mapValues['Difficulty']['ApproachRate']);
    if (mapAR <= 5){
        mapARpreempt = 1200 + 600 * (5 - mapAR) / 5;
        mapARfull = 800 + 400 * (5 - mapAR) / 5;
    } else {
        mapARpreempt = 1200 - 750 * (mapAR - 5) / 5;
        mapARfull = 800 - 500 * (mapAR - 5) / 5;
    }
    var songPath = replayValues['folder-src']+mapValues['General']['AudioFilename'];
    loadSong(songPath).then(()=>{
    console.log(audioBuffers);
    
    
    //Commence replay
    replayStartTime = Date.now(); //Adjust time to now
    playDeferred(audioBuffers[songPath],songStart); //Song starts at -replayTimeSun (I hope)
    ready = 1;
    });
    });
    });
    });
    });
    });
    });
    
    
    
    renderer = setInterval(function() { render(); },10);
    
}

function scaleX(x){ return ( (x) / 512 ) * w; } //or 512x384 idk
function scaleY(y){ return ( (y) / 384 ) * h; }

function drawCursor(x, y) {
    //console.log(scaleX(x),scaleY(y));
    c.drawImage(assets['cursorImage'], scaleX(x) - CURSORSZ / 2, scaleY(y) - CURSORSZ / 2,CURSORSZ,CURSORSZ);
}

function drawHitCircle(x, y, opacity){
    HITCIRCLESZ = 70;
    c.globalAlpha = opacity;
    c.drawImage(assets['hitCircle'], scaleX(x) - HITCIRCLESZ / 2, scaleY(y) - HITCIRCLESZ / 2,HITCIRCLESZ,HITCIRCLESZ);
    c.drawImage(assets['hitCircleOverlay'], scaleX(x) - HITCIRCLESZ / 2, scaleY(y) - HITCIRCLESZ / 2,HITCIRCLESZ,HITCIRCLESZ);
    c.globalAlpha = 1;
}

function render() {
    if (assets['backgroundImage']){c.drawImage(assets['backgroundImage'], 0, 0, w, h);}
    c.fillStyle = 'rgba(17, 17, 17, 0.7)';
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(195, 195, 195, 0.7)'
    c.fillText(displayText,10,10);
    
    ctime = Date.now() - replayStartTime;
    adjtime = ctime - songStart;
    
    if ((replayData.length !== 0) && (replayIdx < replayData.length - 1) && ready){
        //Hitobjects render
        if (adjtime > mapHit[mapHitIdx][2] - mapARpreempt){
            mapIn.push(mapHit[mapHitIdx]); //Add to list of activly drawn
            mapHitIdx += 1;
        }
        var i = 0;
        while (mapIn.length > 0){ //x,y,time,type
            if (adjtime > mapIn[i][2] + mapOD5){mapIn.splice(i,1); if(i>=mapIn.length){break;} continue;} //THIS IS CORRECT CODE
            //if (adjtime > mapIn[i][2]){mapIn.pop(i); i += 1; if(i>=mapIn.length){break;} continue;} //THIS CODE IS WRONG TODO when judgements
            if (mapIn[i][3]&1 !== 0 || 1) { // Hitobject
                var opacity = 1;
                if (adjtime < (mapIn[i][2] - mapARfull)){
                    opacity = adjtime/(mapARpreempt-mapARfull)+(mapIn[i][2]-mapARpreempt)/(mapARfull-mapARpreempt);
                } else {
                    opacity = 1;
                }
                drawHitCircle(mapIn[i][0],mapIn[i][1],opacity); //LAST PARAM IS OPACITY !
            }
            i += 1;
            if (i >= mapIn.length){
                break;
            }
        }
            
        //Cursor render
        if (ctime > replayTimeSum) {
            drawCursor(replayData[replayIdx][1],replayData[replayIdx][2]);
            var i = 0;
            while ((ctime > replayTimeSum) && (replayIdx < replayData.length - 1)) {
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