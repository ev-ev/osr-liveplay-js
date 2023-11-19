var abs=Math.abs;
var pow=Math.pow;
var arctan=Math.atan;
var pi = Math.PI;
var ready=0;
var CURSORSZ = 70;
var ACSZ = 4;
var SLIDERBODYBASEOPACITY = 0.5;
var SLIDERBORDERSIZE = 5;
var SLIDERSZ = -7; //How much smaller slider elements should be offset than map circle size radius
var COMBONUMSZ = 0.78;

var playfieldScale = 1;
var playfieldTransformX = 0;
var playfieldTransformY = 0;

var displayText = '';
var paused = false;
var pauseTime = 0;

var replayData = []; //TimeMS x y keypressed
var replayIdx = 0;
var replayStartTime = 0;
var replayTimeSum = 0;
var replayCombo = -1;
var currentCombo = 0;
var timingData = [];
var songStart;

var mapHit = [];
var mapHitIdx = 0;
var mapIn = [];
var mapOD3 = 80;
var mapOD1 = 140;
var mapOD5 = 200;
var mapCSr = 54.4;
var mapSliderMul = 100;
var mapARpreempt = 1200;
var mapARfull = 800;
var combosizeX = 1;
var combosizeY = 1;
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
    
    loadSkin('skins/yugen').then(skinAssets=>{ assets = skinAssets;
    loadReplay().then(replayValues => {
    replayData = replayValues['replayData'];
    replayTimeSum = replayValues['replayTimeSum'];
    songStart = -replayTimeSum;
    loadImage(replayValues['bg-src']).then(backgroundImage => {assets['backgroundImage'] = backgroundImage;
    loadMap(replayValues['map-src']).then(mapValues => { console.log(mapValues);
    mapHit = mapValues['HitObjects'].map(e=>{
    if (e.length === 6){
        return [Number(e[0]),Number(e[1]),Number(e[2]),Number(e[3]),Number(e[4]),e[6]];
    } else if (e.length === 7){
        return [256, 192, Number(e[2]), Number(e[3]), Number(e[4]), Number(e[6]),e[7]];
    } else if (e.length === 11){
        return [Number(e[0]),Number(e[1]),Number(e[2]),Number(e[3]),Number(e[4]),e[5],Number(e[6]),Number(e[7]),e[8],e[9],e[10]]
    } else {
        alert(e); 
    }
    });
    //mapHit = mapValues['HitObjects'];
    mapOD3 = 80 - 6 * mapValues['Difficulty']['OverallDifficulty'];
    mapOD1 = 140 - 8 * mapValues['Difficulty']['OverallDifficulty'];
    mapOD5 = 200 - 10 * mapValues['Difficulty']['OverallDifficulty'];
    mapCSr = (54.4 - 4.48 * mapValues['Difficulty']['CircleSize'])*playfieldScale*2; //mul by 2 since its the radius
    SLIDERSZ += mapCSr;
    mapSliderMul = mapValues['Difficulty']['SliderMultiplier'];
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
    combosizeX = mapCSr*(assets['default0'].width/assets['hitCircle'].width) * COMBONUMSZ; //Precalculate commbo number size
    combosizeY = mapCSr*(assets['default0'].height/assets['hitCircle'].height) * COMBONUMSZ; //TODO I am assuming all are same size !
    comboColorCount = comboColors.length;
    
    timingData = mapValues['TimingPoints'];
    timingIdx = -1;
    timingIdxInherited = -1;
    
    promises = [];
    for (var i = 0; i < comboColors.length; i++) {
        promises.push(tintImage(assets['hitCircle'], comboColors[i]));
    }
    
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

function drawSlider(x, y, combo, opacity, current, timing, curveType, curvePoints, slides, length){
    if (curveType === "L"){
        c.beginPath();
        var start = [renderX(x),renderY(y)]
        var end = [renderX(curvePoints.slice(-1)[0][0]),renderY(curvePoints.slice(-1)[0][1])];
        c.moveTo(start[0], start[1]);
        c.lineTo(end[0],end[1]);
        var clength = pow(pow((end[0]-start[0]),2)+pow((end[1]-start[1]),2),0.5);
        if (clength<length){
            c.lineTo((end[0]-start[0])/clength*length,(end[1]-start[1])/clength*length);
        } else {length = clength;}
        c.lineCap = "round";   
        c.lineWidth = SLIDERSZ - SLIDERBORDERSIZE;
        c.strokeStyle = 'rgba('+assets['skinIni']['Colours']['SliderTrackOverride']+','+SLIDERBODYBASEOPACITY*opacity+')';
        c.stroke();
        c.closePath();
        
        
        c.save();
        c.translate(start[0], start[1]);
        if (end[0] > start[0]) { //I don't have enough braincells to figure out why this is a thing
            c.rotate(arctan((end[1]-start[1])/(end[0]-start[0]))-pi/2);
        } else {
            c.rotate(arctan((end[1]-start[1])/(end[0]-start[0]))+pi/2);
        }
        c.beginPath();
        c.moveTo(-SLIDERSZ / 2, 0);
        c.lineTo(-SLIDERSZ / 2, length*playfieldScale);
        c.arc   ( 0, length*playfieldScale, SLIDERSZ / 2, pi, 0, true);
        //c.moveTo( SLIDERSZ / 2, length*playfieldScale);
        c.lineTo( SLIDERSZ / 2, 0);
        c.arc   ( 0, 0, SLIDERSZ / 2, 0, pi, true);
        //c.moveTo(-SLIDERSZ / 2, 0);
        c.lineCap = "butt"; 
        c.lineWidth = SLIDERBORDERSIZE;
        c.strokeStyle = 'rgba('+assets['skinIni']['Colours']['SliderBorder']+','+opacity+')'; //SliderTrackOverride
        //c.strokeRect(-SLIDERSZ / 2,0,SLIDERSZ,length*playfieldScale);
        c.stroke();
        c.closePath();
        c.restore();
        
        
    }
    drawHitCircle(x, y, combo, opacity, current, timing);
}

function drawHitCircle(x, y, combo, opacity, current, timing){
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
    if (combo < 10) {
        c.drawImage(assets['default'+combo], renderX(x) - combosizeX/2, renderY(y)-combosizeY/2, combosizeX, combosizeY);
    } else {
        combo = "" + combo;
        var totalLength = combo.length*(combosizeX - assets['skinIni']['Fonts']['ComboOverlap']) + assets['skinIni']['Fonts']['ComboOverlap'];
        for (var i = 0; i < combo.length; i++) {
            //max length = number*(length - overlap) + overlap
            c.drawImage(assets['default'+combo[i]], renderX(x) - combosizeX/2 + (totalLength / combo.length) * i - totalLength/3, renderY(y) - combosizeY/2, combosizeX, combosizeY);
        }
        
    }

    c.globalAlpha = 1;
}

function pause(){
    if (!paused){
        paused = true;
        pauseTime = Date.now();
    } else {
        replayStartTime += Date.now()-pauseTime;
        paused = false;
    }

}

function render() {
    if (assets['backgroundImage']){c.drawImage(assets['backgroundImage'], 0, 0, w, h);}
    c.fillStyle = 'rgba(17, 17, 17, 0.7)';
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(195, 195, 195, 0.7)'
    c.fillText(displayText,10,10);
    
    if (!paused){
        ctime = Date.now() - replayStartTime;
    }
    adjtime = ctime - songStart;
    
    if ((replayData.length !== 0) && (replayIdx < replayData.length - 1) && ready){
        //TimingPoints loading
        /*if (timingIdxInherited - 1 < timingData.length){
            if (adjtime > timingData[timingIdxInherited + 1]) {
                if (timingData[timingIdxInherited + 1][6]) {
                    timingIdx += 1;
                }
                
                timingIdxInherited += 1;
            }
        }*/
        //Hitobjects render
        if (mapHitIdx < mapHit.length){
            if (adjtime > mapHit[mapHitIdx][2] - mapARpreempt){
                if (mapHit[mapHitIdx][3]&0b100){ //New combo
                    currentCombo = 1;
                }
                mapHit[mapHitIdx].push(currentCombo); currentCombo += 1;
                mapIn.push(mapHit[mapHitIdx]); //Add to list of activly drawn
                mapHitIdx += 1;
            }
        }

        var i = 0;
        while (mapIn.length > 0){ //x,y,time,type
            var timingIdx = 0; var timingIdxInherited = 0;
            for (var j = 0; j < timingData.length; j++) { //This bit goes thru timingData and selects the appropriate one for the hitobject in question. might just tbe the most fucked up thing ive made yet
                if (mapIn[i][2] < timingData[j][0]) {   //TODO this can be impoved regarding the starting position of the variable, start from the timing point that doesnt exist anymore
                    timingIdxInherited = j - 1;
                    break;
                }
                if (timingData[j][6] === "1") {
                    timingIdx = j;
                    timingIdxInherited = j;
                }
            }
            if ((mapIn[i][3]&1) !== 0) { // Hitobject
                if (adjtime > mapIn[i][2]+25){mapIn.splice(i,1); if(i>=mapIn.length){break;} continue;}
                var opacity = 1;
                if (adjtime < (mapIn[i][2] - mapARfull)){
                    opacity = adjtime/(mapARpreempt-mapARfull)+(mapIn[i][2]-mapARpreempt)/(mapARfull-mapARpreempt);
                } else {
                    opacity = 1;
                }
                drawHitCircle(mapIn[i][0],mapIn[i][1], mapIn[i].slice(-1)[0], opacity, adjtime, mapIn[i][2]);
            }
            if ((mapIn[i][3]&2) !== 0){ // Slider x,y,time,type,hitSound,curveType|curvePoints,slides,length,edgeSounds,edgeSets,hitSample
                var duration = 0;
                if (timingIdx === timingIdxInherited) { //Not inherited
                    duration = mapIn[i][7] / (mapSliderMul * 100) * timingData[timingIdx][1];
                } else {
                    duration = mapIn[i][7] / (mapSliderMul * (-timingData[timingIdxInherited][1])) * timingData[timingIdx][1];
                }
                
                if (adjtime > mapIn[i][2] + duration){mapIn.splice(i,1); if(i>=mapIn.length){break;} continue;}
                var opacity = 1;
                if (adjtime < (mapIn[i][2] - mapARfull)){
                    opacity = adjtime/(mapARpreempt-mapARfull)+(mapIn[i][2]-mapARpreempt)/(mapARfull-mapARpreempt);
                } else {
                    opacity = 1;
                }
                //var [curveType, curvePoints] = mapIn[i][5].split("|");
                var curvePoints = mapIn[i][5].split('|');
                curveType = curvePoints.splice(0,1)[0]
                curvePoints = curvePoints.map(x=>x.split(":").map(y=>Number(y)));
                drawSlider(mapIn[i][0],mapIn[i][1], mapIn[i].slice(-1)[0], opacity, adjtime, mapIn[i][2], curveType, curvePoints, Number(mapIn[i][6]), Number(mapIn[i][7]));
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