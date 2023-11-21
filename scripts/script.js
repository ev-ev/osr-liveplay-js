var abs = Math.abs;
var pow = Math.pow;
var cos = Math.cos;
var sin = Math.sin;
var arctan = Math.atan;
var atan2 = Math.atan2;
var floor = Math.floor;
var ceil = Math.ceil;
var pi = Math.PI;
var ready = 0;
var CURSORSZ = 70;
var ACSZ = 4;
var SLIDERBODYBASEOPACITY = 0.5;
var SLIDERBORDERSIZE = 5;
var SLIDERSZ = - 7; //How much smaller slider elements should be offset than map circle size radius
var COMBONUMSZ = 0.78;
var FADEOUTTIME = 200;

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
var replayCombo = - 1;
var currentCombo = 0;
var timingData = [];
var songStart;

var mapHit = [];
var mapHitIdx = 0;
var mapIn = [];
var mapSliderTickRate = 0;
var mapOD3 = 80;
var mapOD1 = 140;
var mapOD5 = 0; //SHOULD BE 200 TODO. Once I implement judgements I will patch this hotfix out
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
    reader.onload = () => {resolve(reader.result);};
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
});}


function loadImage(src){
    return new Promise(function (resolve, reject){
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
        playfieldScale = (h - 56) / 384;
    } else {
        playfieldScale = (w - 64) / 512;
    }
    playfieldTransformX = (w - 512 * playfieldScale) / 2;
    playfieldTransformY = (h - 384 * playfieldScale) / 2;
    c = canvas.getContext('2d');
    
    
    initSounds();
    
    loadSkin('skins/yugen').then(skinAssets=>{ assets = skinAssets;
    loadReplay().then(replayValues => {
    replayData = replayValues['replayData'];
    replayTimeSum = replayValues['replayTimeSum'];
    songStart = - replayTimeSum;
    loadImage(replayValues['bg-src']).then(backgroundImage => {assets['backgroundImage'] = backgroundImage;
    loadMap(replayValues['map-src']).then(mapValues => { console.log(mapValues);
    mapHit = mapValues['HitObjects'].map(e=>{
    if (e.length === 6){
        return [Number(e[0]), Number(e[1]), Number(e[2]), Number(e[3]), Number(e[4]), e[6]];
    } else if (e.length === 7){
        return [256, 192, Number(e[2]), Number(e[3]), Number(e[4]), Number(e[6]), e[7]];
    } else if (e.length === 11){
        return [Number(e[0]), Number(e[1]), Number(e[2]), Number(e[3]), Number(e[4]), e[5], Number(e[6]), Number(e[7]), e[8], e[9], e[10]];
    } else {
        alert(e); 
    }
    });
    sliderTickRate = mapValues['Difficulty']['SliderTickRate'];
    //mapHit = mapValues['HitObjects'];
    mapOD3 = 80 - 6 * mapValues['Difficulty']['OverallDifficulty'];
    mapOD1 = 140 - 8 * mapValues['Difficulty']['OverallDifficulty'];
    mapOD5 = 200 - 10 * mapValues['Difficulty']['OverallDifficulty'];
    mapCSr = (54.4 - 4.48 * mapValues['Difficulty']['CircleSize']) * playfieldScale * 2; //mul by 2 since its the radius
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
    FADEOUTTIME = (mapARpreempt - mapARfull) / 2;
    var comboColors = [];
    for (var key in mapValues['Colours']){
        if (key.slice(0, 5) === 'Combo'){
            comboColors[Number(key.slice(5)) - 1] = 'rgba(' + mapValues['Colours'][key] + ', 1.0)';
        }
    }
    sliderBallsizeX = mapCSr * (assets['sliderBall'].width / assets['hitCircle'].width);
    sliderBallsizeY = mapCSr * (assets['sliderBall'].height / assets['hitCircle'].width);
    combosizeX = mapCSr * (assets['default0'].width / assets['hitCircle'].width) * COMBONUMSZ; //Precalculate commbo number size
    combosizeY = mapCSr * (assets['default0'].height / assets['hitCircle'].height) * COMBONUMSZ; //TODO I am assuming all are same size !
    comboColorCount = comboColors.length;
    
    timingData = mapValues['TimingPoints'];
    timingIdx = - 1;
    timingIdxInherited = - 1;
    
    promises = [];
    for (var i = 0; i < comboColors.length; i++) {
        promises.push(tintImage(assets['hitCircle'], comboColors[i]));
    }
    
    Promise.all(promises).then(comboColorResults => {
    for (var i = 0; i < comboColorResults.length; i++) {
        assets['hitCircle' + i] = comboColorResults[i];
    }
    console.log(assets);
    var songPath = replayValues['folder-src'] + mapValues['General']['AudioFilename'];
    loadSong(songPath).then(()=>{
    console.log(audioBuffers);
    
    
    //Commence replay
    replayStartTime = Date.now(); //Adjust time to now
    playDeferred(audioBuffers[songPath], songStart); //Song starts at -replayTimeSun (I hope)
    ready = 1;
    });
    });
    });
    });
    });
    });
    
    
    renderer = setInterval(function() { render(); }, 10);
    
}

//function scaleX(x){ return ( (x) / 512 ) * w; } //or 512x384 idk
//function scaleY(y){ return ( (y) / 384 ) * h; }

function renderX(x) { return x * playfieldScale + playfieldTransformX;}
function renderY(y) { return y * playfieldScale + playfieldTransformY;}

function drawCursor(x, y) {
    //console.log(scaleX(x),scaleY(y));
    c.drawImage(assets['cursorImage'], renderX(x) - CURSORSZ / 2, renderY(y) - CURSORSZ / 2, CURSORSZ, CURSORSZ);
}

function drawSlider(x, y, combo, opacity, current, timing, curveType, curvePoints, slides, length, duration, beatLength){
    var slidesDone;
    if (current - timing < 0){
        slidesDone = 0;
    } else {
        slidesDone = floor((current - timing) / duration);
    }
    
    c.globalAlpha = opacity;
    if (curveType === 'L'){
        c.beginPath();
        var start = [renderX(x), renderY(y)];
        var end = [renderX(curvePoints.slice(- 1)[0][0]), renderY(curvePoints.slice(- 1)[0][1])];
        var clength = pow(pow((end[0] - start[0]), 2) + pow((end[1] - start[1]), 2), 0.5);
        if (clength < length * playfieldScale){
            c.lineTo(((end[0] - start[0]) / clength) * length * playfieldScale + start[0], ((end[1] - start[1]) / clength) * length * playfieldScale + start[1]);
            clength = length * playfieldScale;
        }
        c.moveTo(start[0], start[1]);
        c.lineTo(end[0], end[1]);
        c.lineCap = 'round';   
        c.lineWidth = SLIDERSZ - SLIDERBORDERSIZE;
        c.strokeStyle = 'rgb(' + assets['skinIni']['Colours']['SliderTrackOverride'] + ',' + SLIDERBODYBASEOPACITY + ')';//}
        c.stroke();
        c.closePath();
        
        
        c.save();
        c.translate(start[0], start[1]);
        if (end[0] > start[0]) { //I don't have enough braincells to figure out why this is a thing
            c.rotate(arctan((end[1] - start[1]) / (end[0] - start[0])) - pi / 2);
        } else {
            c.rotate(arctan((end[1] - start[1]) / (end[0] - start[0])) + pi / 2);
        }
        c.beginPath();
        c.moveTo(- SLIDERSZ / 2, 0);
        c.lineTo(- SLIDERSZ / 2, clength);
        c.arc   (0, clength, SLIDERSZ / 2, pi, 0, true);
        //c.moveTo( SLIDERSZ / 2, length*playfieldScale);
        c.lineTo(SLIDERSZ / 2, 0);
        c.arc   (0, 0, SLIDERSZ / 2, 0, pi, true);
        //c.moveTo(-SLIDERSZ / 2, 0);
        c.lineCap = 'butt'; 
        c.lineWidth = SLIDERBORDERSIZE;
        c.strokeStyle = 'rgb(' + assets['skinIni']['Colours']['SliderBorder'] + ')'; //SliderTrackOverride
        //c.strokeRect(-SLIDERSZ / 2,0,SLIDERSZ,length*playfieldScale);
        c.stroke();
        c.closePath();
        
        
        
        //console.log(slidesDone);
        if (slidesDone % 2 === 0){
            c.translate(0, clength);
            c.rotate(- pi / 2);
        } else {
            c.rotate(pi / 2);
        }
        
        //Draw sliderend (if any)
        //1 slide is duration long. current-timing is elapsed time. (current-timing)/duration is amount of slides gone thru.
        //therefore, amount of slides left is slides-(current-timing)/duration. But current-timing must be gt 0
        if (current < timing){
            if (slides > 1) {
                c.drawImage(assets['reverseArrow'], - mapCSr / 2, - mapCSr / 2, mapCSr, mapCSr);
            }
        } else {
            if (slides - slidesDone > 1) {
                c.drawImage(assets['reverseArrow'], - mapCSr / 2, - mapCSr / 2, mapCSr, mapCSr);
            }
            if ((slides - slidesDone > 2)) { //TODO, I can't test this right now, but im pretty sure this will render it when it isnt supposed to be 
                c.drawImage(assets['reverseArrow'], - mapCSr / 2, - mapCSr / 2, mapCSr, mapCSr); //REMEMEBER TO EDIT THIS FOR ALL SLIDERS !!
            }
        }
        
        c.restore();
        
        //Draw sliderticks TODO
        var sliderTickCount = floor((duration / beatLength) / sliderTickRate);
        //console.log(sliderTickCount);
        
        
        //Draw sliderball along the path
        if (current >= timing && current < timing + duration * slides) {
            var sliderBall = (current - (timing + duration * slidesDone)) * (clength / duration);
            
            var sliderBallX; var sliderBallY;
            if (slidesDone % 2 === 0){
                sliderBallX = ((end[0] - start[0]) / clength) * sliderBall + start[0];
                sliderBallY = ((end[1] - start[1]) / clength) * sliderBall + start[1];
            } else {
                sliderBallX = ((start[0] - end[0]) / clength) * sliderBall + end[0];
                sliderBallY = ((start[1] - end[1]) / clength) * sliderBall + end[1];
            }
            
            c.drawImage(assets['sliderBall'], sliderBallX - sliderBallsizeX / 2, sliderBallY - sliderBallsizeX / 2, sliderBallsizeX, sliderBallsizeX);
        }
    } // End of L slider
    
    if (curveType === 'P'){
        var start = [renderX(x), renderY(y)];
        var mid = [renderX(curvePoints[0][0]), renderY(curvePoints[0][1])];
        var end = [renderX(curvePoints[1][0]), renderY(curvePoints[1][1])];
        
        var arcMidpoint = [];
        start[0] -= mid[0]; //Translate points so mid is at origin
        start[1] -= mid[1];
        end[0] -= mid[0];
        end[1] -= mid[1];
        var D = 2*(start[0]*end[1]-end[0]*start[1]);
        var z1 = start[0]*start[0] + start[1]*start[1];
        var z2 = end[0]*end[0]+end[1]*end[1];
        arcMidpoint[0] = (z1 * end[1] - z2 * start[1]) / D + mid[0];
        arcMidpoint[1] = (start[0] * z2 - end[0] * z1) / D + mid[1];
        
        start[0] += mid[0];
        start[1] += mid[1];
        end[0] += mid[0];
        end[1] += mid[1];
        
        
        var arcRadius = pow(pow(mid[0]-arcMidpoint[0],2)+pow(mid[1]-arcMidpoint[1],2),0.5);
        //var arcStartAngle = -arctan((arcMidpoint[1]-start[1])/(arcMidpoint[0]-start[0]));
        //var arcEndAngle = -arctan((end[1]-arcMidpoint[1])/(end[0]-arcMidpoint[0]));
        var arcStartAngle = atan2(start[1] - arcMidpoint[1], start[0] - arcMidpoint[0]);
        var arcEndAngle = atan2(end[1] - arcMidpoint[1], end[0] - arcMidpoint[0]);
        var isClockwise = ((end[0] - start[0]) * (mid[1] - start[1]) - (end[1] - start[1]) * (mid[0] - start[0])) >= 0
        var clength = abs(arcEndAngle - arcStartAngle) * arcRadius;
        if (length > clength) {
            arcEndAngle += (length * playfieldScale - clength) / arcRadius;
            end = [arcMidpoint[0] + arcRadius * cos(arcEndAngle),arcMidpoint[1] + arcRadius * sin(arcEndAngle)];
        }
        //console.log(arcMidpoint[0], arcMidpoint[1], arcRadius, arcStartAngle, arcEndAngle)
        
        c.beginPath();
        c.arc(arcMidpoint[0], arcMidpoint[1], arcRadius, arcStartAngle, arcEndAngle, isClockwise);
        c.lineCap = 'round';   
        //c.lineWidth = 10;
        c.lineWidth = SLIDERSZ - SLIDERBORDERSIZE;
        //c.strokeStyle = 'rgb(200,100,100)';
        c.strokeStyle = 'rgb(' + assets['skinIni']['Colours']['SliderTrackOverride'] + ',' + SLIDERBODYBASEOPACITY + ')';//}
        c.stroke();
        c.closePath();  
        
        //Now draw the slider border //This might have just been the most satisfying thing I've made it a while
        c.beginPath();               //its so nice when the math just works out how you calculated it to
        c.arc(arcMidpoint[0], arcMidpoint[1], arcRadius+SLIDERSZ/2, arcStartAngle, arcEndAngle, isClockwise);
        c.arc(end[0], end[1], SLIDERSZ/2, arcEndAngle, arcEndAngle+pi,isClockwise);
        c.arc(arcMidpoint[0], arcMidpoint[1], arcRadius-SLIDERSZ/2, arcEndAngle, arcStartAngle, !isClockwise);
        c.arc(start[0], start[1], SLIDERSZ/2, arcStartAngle+pi, arcStartAngle,isClockwise);
        c.lineCap = 'butt'; 
        c.lineWidth = SLIDERBORDERSIZE;
        c.strokeStyle = 'rgb(' + assets['skinIni']['Colours']['SliderBorder'] + ')';
        c.stroke();
        c.closePath();
        
        //TODO PRIORITY 1 !!!! !!! !!! !!! !!! fix the sliderend, it looks slanted I swear
        c.save();
        if (slidesDone % 2 === 0){
            c.translate(end[0],end[1]);
            //c.rotate(arcEndAngle + pi / 2 + (isClockwise ? 0 : pi)); //This was my first theory on how to rotate the slider
            c.rotate(arcEndAngle + pi / 2 + (isClockwise ? 0.1 : pi-0.1));
        } else {
            c.translate(start[0],start[1]); //TODO cannot test this
            c.rotate(arcStartAngle - pi / 2 + (isClockwise ? pi-0.1 : 0.1));
        }
        
        if (current < timing){
            if (slides > 1) {
                c.drawImage(assets['reverseArrow'], - mapCSr / 2, - mapCSr / 2, mapCSr, mapCSr);
            }
        } else {
            if (slides - slidesDone > 1) {
                c.drawImage(assets['reverseArrow'], - mapCSr / 2, - mapCSr / 2, mapCSr, mapCSr);
            }
            //if ((slides - slidesDone > 2)) { //TODO, I can't test this right now, but im pretty sure this will render it when it isnt supposed to be
            //    c.drawImage(assets['reverseArrow'], end[0] - mapCSr / 2, end[1] - mapCSr / 2, mapCSr, mapCSr);
            //}//TODO THIS WONT WORK AAAAA
        }
        c.restore(); 
        
        //Draw sliderball along the path
        if (current >= timing && current < timing + duration * slides) {
            var angleDt = abs(arcStartAngle-arcEndAngle);
            //This took way too long and I don't even know why it works or if it there is possible bugged behavior
            //If anyone can explain what is happening here or the best practice I would be super thankful
            if ((isClockwise && (arcStartAngle<arcEndAngle)) || (!isClockwise && (arcStartAngle>arcEndAngle))) {angleDt = 2*pi - angleDt;}
            var sliderBall = (isClockwise?-1:1)*(current - (timing + duration * slidesDone)) * (angleDt / duration);
            
            //console.log(combo, sliderBall);

            var sliderBallX; var sliderBallY;
            if (slidesDone % 2 === 0){
                sliderBallX = arcMidpoint[0] + arcRadius * cos(arcStartAngle + sliderBall);
                sliderBallY = arcMidpoint[1] + arcRadius * sin(arcStartAngle + sliderBall);
            } else {
                sliderBallX = arcMidpoint[0] + arcRadius * cos(arcEndAngle - sliderBall);
                sliderBallY = arcMidpoint[1] + arcRadius * sin(arcEndAngle - sliderBall);
            }
            
            c.drawImage(assets['sliderBall'], sliderBallX - sliderBallsizeX / 2, sliderBallY - sliderBallsizeX / 2, sliderBallsizeX, sliderBallsizeX);
        }
        
        /* //Debug anchor points drawing
        var sz = 5;
        c.fillStyle = 'rgb(255,50,50)';
        c.fillRect(start[0]-sz/2,start[1]-sz/2,sz,sz);
        c.fillRect(mid[0]-sz/2,mid[1]-sz/2,sz,sz);
        c.fillRect(end[0]-sz/2,end[1]-sz/2,sz,sz);
        c.fillStyle = 'rgb(100,200,100)';
        c.fillRect(arcMidpoint[0]-sz/2,arcMidpoint[1]-sz/2,sz,sz);
        */
        
    } //End of P slider
    
    c.globalAlpha = 1;
    if (current < timing){
        drawHitCircle(x, y, combo, opacity, current, timing);
    }
}

function drawHitCircle(x, y, combo, opacity, current, timing){
    var tempCSr = mapCSr;
    if (current > timing + mapOD5){ //TODO for judgement
         tempCSr = mapCSr * (4 / 3 - opacity / 3);
    } 
    
    var posX = renderX(x) - tempCSr / 2;
    var posY = renderY(y) - tempCSr / 2;
    c.globalAlpha = opacity;
    //console.log(opacity);
    if (timing - current > 0){
        var AC = linearScale(current, timing - mapARpreempt, mapCSr * ACSZ, timing, mapCSr);
        c.drawImage(assets['approachCircle'], renderX(x) -  AC / 2, renderY(y) - AC / 2, AC, AC);
    }
    c.drawImage(assets['hitCircle'], posX, posY, tempCSr, tempCSr);
    c.drawImage(assets['hitCircleOverlay'], posX, posY, tempCSr, tempCSr);
    if (combo < 10) {
        c.drawImage(assets['default' + combo], renderX(x) - combosizeX / 2, renderY(y) - combosizeY / 2, combosizeX, combosizeY);
    } else {
        combo = '' + combo;
        var totalLength = combo.length * (combosizeX - assets['skinIni']['Fonts']['ComboOverlap']) + assets['skinIni']['Fonts']['ComboOverlap'];
        for (var i = 0; i < combo.length; i++) {
            //max length = number*(length - overlap) + overlap
            c.drawImage(assets['default' + combo[i]], renderX(x) - combosizeX / 2 + (totalLength / combo.length) * i - totalLength / 3, renderY(y) - combosizeY / 2, combosizeX, combosizeY);
        }
        
    }

    c.globalAlpha = 1;
}

var speed = 1;
function changeSpeed(newSpeed){
    replayStartTime += Date.now()*(newSpeed-speed);
    speed = newSpeed;
}
function render() {
    if (assets['backgroundImage']){c.drawImage(assets['backgroundImage'], 0, 0, w, h);}
    c.fillStyle = 'rgba(17, 17, 17, 0.7)';
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(195, 195, 195, 0.7)';
    c.fillText(displayText, 10, 10);
    
    if (! paused){
        ctime = Date.now()*speed - replayStartTime;
        //console.log(ctime);
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
                if (mapHit[mapHitIdx][3] & 0b100){ //New combo
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
                if (timingData[j][6] === '1') {
                    timingIdx = j;
                    timingIdxInherited = j;
                }
            }
            if ((mapIn[i][3] & 1) !== 0) { // Hitobject
                if (adjtime > mapIn[i][2] + mapOD5 + FADEOUTTIME){mapIn.splice(i, 1); if (i >= mapIn.length){break;} continue;}
                var opacity = 1;
                if (adjtime < (mapIn[i][2] - mapARfull)){
                    opacity = adjtime / (mapARpreempt - mapARfull) + (mapIn[i][2] - mapARpreempt) / (mapARfull - mapARpreempt);
                } else if (adjtime > (mapIn[i][2] + mapOD5)){ //See below for T
                    //opacity = 0.1;
                    opacity = linearScale(adjtime, mapIn[i][2] + mapOD5, 1, mapIn[i][2] + mapOD5 + FADEOUTTIME, 0);
                    
                } else {
                    opacity = 1;
                }
                drawHitCircle(mapIn[i][0], mapIn[i][1], mapIn[i].slice(- 1)[0], opacity, adjtime, mapIn[i][2]);
            }
            if ((mapIn[i][3] & 2) !== 0){ // Slider x,y,time,type,hitSound,curveType|curvePoints,slides,length,edgeSounds,edgeSets,hitSample
                var duration = 0;
                if (timingIdx === timingIdxInherited) { //Not inherited
                    duration = mapIn[i][7] / (mapSliderMul * 100) * timingData[timingIdx][1];
                } else { 
                    duration = mapIn[i][7] / (mapSliderMul * (- timingData[timingIdxInherited][1])) * timingData[timingIdx][1];
                } 
                
                if (adjtime > mapIn[i][2] + duration * mapIn[i][6] + FADEOUTTIME){mapIn.splice(i, 1); if (i >= mapIn.length){break;} continue;}
                var opacity = 1;
                if (adjtime < (mapIn[i][2] - mapARfull)){
                    opacity = adjtime / (mapARpreempt - mapARfull) + (mapIn[i][2] - mapARpreempt) / (mapARfull - mapARpreempt);
                } else if (adjtime > (mapIn[i][2] + mapOD5)) { //TODO this should trigger once the player clicks or misses the object
                    //opacity = 0.1;
                    opacity = linearScale(adjtime, mapIn[i][2] + duration * mapIn[i][6], 1, mapIn[i][2] + duration * mapIn[i][6] + FADEOUTTIME, 0);
                } else {
                    opacity = 1;
                }
                
                //var [curveType, curvePoints] = mapIn[i][5].split("|");
                var curvePoints = mapIn[i][5].split('|');
                curveType = curvePoints.splice(0, 1)[0];
                curvePoints = curvePoints.map(x=>x.split(':').map(y=>Number(y)));
                drawSlider(mapIn[i][0], mapIn[i][1], mapIn[i].slice(- 1)[0], opacity, adjtime, mapIn[i][2], curveType, curvePoints, Number(mapIn[i][6]), Number(mapIn[i][7]), duration, timingData[timingIdx][1]);
            }
            i += 1;
            if (i >= mapIn.length){
                break;
            }
        }
            
        //Cursor render
        if (ctime > replayTimeSum) {
            drawCursor(replayData[replayIdx][1], replayData[replayIdx][2]);
            var i = 0;
            while ((ctime > replayTimeSum) && (replayIdx < replayData.length - 1)) {
                replayTimeSum += abs(replayData[replayIdx][0]);
                replayIdx += 1;
                i += 1;
            }
            displayText = 'frames skipped: ' + (i - 1);
        } else {
            drawCursor(replayData[replayIdx][1], replayData[replayIdx][2]);
        }
    }
    


    //if (Date.now() - replayStartTime > replayData[replayIdx][0]){
    //    drawCursor(replayData[replayIdx][1],replayData[replayIdx][2])
    //    while (Date.now() - replayData[replayIdx][0] > replayData[replayIdx][0]) {replayIdx += 1;}
    //}
    
}

var firstSetup = true;
document.addEventListener('click', function (e) {
    if (firstSetup){setup(); firstSetup = false;}
});