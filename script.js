var abs=Math.abs;
var ready=0;
var CURSORSZ = 70;
var ACSZ = 4;

var playfieldScale = 1;
var playfieldTransformX = 0;
var playfieldTransformY = 0;

var displayText = '';

var replayData = []; //TimeMS x y keypressed
var replayIdx = 0;
var replayStartTime = 0;
var replayTimeSum = 0;
var replayCombo = -1;
var songStart;

var mapHit = [];
var mapHitIdx = 0;
var mapIn = [];
var mapOD3 = 80;
var mapOD1 = 140;
var mapOD5 = 200;
var mapCSr = 54.4;
var mapARpreempt = 1200;
var mapARfull = 800;
var comboColorCount = 1;

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
    //osu playfield should be 512x384, figure out scale and transform
    if (w > h) { 
        playfieldScale = (h-56)/384;
    } else {
        playfieldScale = (w-64)/512;
    }
    playfieldTransformX = (w - 512*playfieldScale)/2;
    playfieldTransformY = (h - 384*playfieldScale)/2;
    c = canvas.getContext('2d');
    
    
    initSounds();
    
    loadImage('skins/yugen/cursor@2x.png').then(cursorImage => { assets['cursorImage'] = cursorImage;
    loadImage('skins/yugen/hitcircle@2x.png').then(hitCircleImage => { assets['hitCircle'] = hitCircleImage;
    loadImage('skins/yugen/hitcircleoverlay@2x.png').then(hitCircleOverlayImage => { assets['hitCircleOverlay'] = hitCircleOverlayImage;
    loadImage('skins/yugen/approachcircle.png').then(approachCircleImage => { assets['approachCircle'] = approachCircleImage;
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
    mapCSr = (54.4 - 4.48 * mapValues['Difficulty']['CircleSize'])*playfieldScale*2; //mul by 2 since its the radius
    var mapAR = Number(mapValues['Difficulty']['ApproachRate']);
    //var mapAR = 1;
    if (mapAR <= 5){
        mapARpreempt = 1200 + 600 * (5 - mapAR) / 5;
        mapARfull = 800 + 400 * (5 - mapAR) / 5;
    } else {
        mapARpreempt = 1200 - 750 * (mapAR - 5) / 5;
        mapARfull = 800 - 500 * (mapAR - 5) / 5;
    }
    var comboColors = [];
    for (var key in mapValues['Colours']){
        if (key.slice(0,5) === "Combo"){
            comboColors[Number(key.slice(5))-1] = 'rgba('+mapValues['Colours'][key]+', 1.0)';
        }
    }
    comboColorCount = comboColors.length;
    promises = [];
    for (var i = 0; i < comboColors.length; i++) {
        promises.push(tintImage(hitCircleImage, comboColors[i]));
    }
    //console.log(promises);
    Promise.all(promises).then(comboColorResults => {
    for (var i = 0; i < comboColorResults.length; i++) {
        assets['hitCircle'+i] = comboColorResults[i];
    }
    console.log(assets);
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
    });
    });
    
    
    renderer = setInterval(function() { render(); },10);
    
}

//function scaleX(x){ return ( (x) / 512 ) * w; } //or 512x384 idk
//function scaleY(y){ return ( (y) / 384 ) * h; }

function renderX(x) { return x*playfieldScale+playfieldTransformX;}
function renderY(y) { return y*playfieldScale+playfieldTransformY;}

function drawCursor(x, y) {
    //console.log(scaleX(x),scaleY(y));
    c.drawImage(assets['cursorImage'], renderX(x) - CURSORSZ / 2, renderY(y) - CURSORSZ / 2,CURSORSZ,CURSORSZ);
}

function drawHitCircle(x, y, image, opacity, current, timing){
    var posX = renderX(x) - mapCSr / 2;
    var posY = renderY(y) - mapCSr / 2;
    c.globalAlpha = opacity;
    //console.log(opacity);
    if (timing - current > 0){
        var AC = linearScale(current, timing - mapARpreempt, mapCSr*ACSZ, timing, mapCSr);
        c.drawImage(assets['approachCircle'], renderX(x) -  AC / 2, renderY(y) - AC / 2, AC, AC);
    }
    c.drawImage(assets['hitCircle'], posX, posY, mapCSr, mapCSr);
    c.drawImage(assets['hitCircleOverlay'], posX, posY, mapCSr, mapCSr);
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
        if (mapHitIdx < mapHit.length){
            if (adjtime > mapHit[mapHitIdx][2] - mapARpreempt){
                mapIn.push(mapHit[mapHitIdx]); //Add to list of activly drawn
                mapHitIdx += 1;
            }
        }

        var i = 0;
        while (mapIn.length > 0){ //x,y,time,type
            //if (adjtime > mapIn[i][2] + mapOD5){mapIn.splice(i,1); if(i>=mapIn.length){break;} continue;} //THIS IS CORRECT CODE
            if (adjtime > mapIn[i][2]+25){mapIn.splice(i,1); if(i>=mapIn.length){break;} continue;} //THIS CODE IS WRONG TODO when judgements
            if (mapIn[i][3]&0b100) { //New combo
                replayCombo += 1;
            }
            if (mapIn[i][3]&1 !== 0 || 1) { // Hitobject
                var opacity = 1;
                var approach = 1;
                if (adjtime < (mapIn[i][2] - mapARfull)){
                    opacity = adjtime/(mapARpreempt-mapARfull)+(mapIn[i][2]-mapARpreempt)/(mapARfull-mapARpreempt);
                } else {
                    opacity = 1;
                }
                drawHitCircle(mapIn[i][0],mapIn[i][1], assets['hitCircle'+replayCombo%comboColorCount], opacity, adjtime, mapIn[i][2]);
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