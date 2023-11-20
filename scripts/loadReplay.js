function decompress(compressed){return new Promise((resolve, reject) => {
    result = LZMA.decompress(compressed);
    resolve(result);

});}
function loadReplay(){ return new Promise((resolve) => {
    
    fetch('rply.osr').then(response=>{
    response.blob().then(blob=>{
    readFile(blob).then(result => {
    var values;
    var view;
    
    var buffer = result;
    var idx = 0;
    gamemode = unpackUnitData(buffer, idx, BYTE); idx += BYTE;
    out.innerText += 'Gamemode: ';
    switch (gamemode){
    case 0:
        out.innerText += 'osu!standard';
    break;
    case 1:
        out.innerText += 'osu!taiko';
    break;
    case 2:
        out.innerText += 'osu!ctb';
    break;
    case 3:
        out.innerText += 'osu!mania';
    } out.innerText += '\t';
    version = unpackUnitData(buffer, idx, INT); idx += INT;
    out.innerText += 'Version: ' + version + '\t';
    values = unpackString (buffer, idx); idx += values[0];
    out.innerText += 'Beatmap hash: ' + values[1] + '\t';
    values = unpackString (buffer, idx); idx += values[0];
    out.innerText += 'Username: ' + values[1] + '\t';
    values = unpackString (buffer, idx); idx += values[0];
    out.innerText += 'Replay hash: ' + values[1] + '\n';
    
    //Process and determine correct map to load here, probably return out of the promice as a resolve
    
    
    view = new Int16Array(buffer.slice(idx, idx + SHORT * 6)); idx += SHORT * 6;//6 shorts
    out.innerText += '300s: ' + view[0] + '\t';
    out.innerText += '100s: ' + view[1] + '\t';
    out.innerText += '50s: ' + view[2] + '\t';
    out.innerText += 'Gekis: ' + view[3] + '\t';
    out.innerText += 'Katus: ' + view[4] + '\t';
    out.innerText += 'Xs: ' + view[5] + '\t';
    score = unpackUnitData(buffer, idx, INT); idx += INT;
    out.innerText += 'Score: ' + score + '\t';
    combo = unpackUnitData(buffer, idx, SHORT); idx += SHORT;
    out.innerText += 'Combo: ' + combo + '\t';
    FC = unpackUnitData(buffer, idx, BYTE); idx += BYTE;
    out.innerText += 'FC: ' + ((FC === 1) ? 'yes' : 'no') + '\t';
    mods = unpackUnitData(buffer, idx, INT); idx += INT;
    out.innerText += 'Mods: ' + getMods(mods) + '\t';
    values = unpackString (buffer, idx); idx += values[0];
    console.log('Lifebar graph: ' + values[1]); // Lifebar graph
    timestamp = unpackUnitData(buffer, idx, LONG); idx += LONG;
    out.innerText += 'Replay Timestamp: ' + timestamp + '\n'; // Not really useful tbh
    compressed_length = unpackUnitData(buffer, idx, INT); idx += INT;
    var replayData = []; var replayStartTime = 0; var replayTimeSum = 0;
    decompress(new Uint8Array(buffer.slice(idx, idx + compressed_length))).then(result=>{
    console.log(result);
    replayData = result.split(',').map(function(e){return e.split('|').map(Number);}).slice(0, - 1); //Get rid of RNGseed
    //while (replayData[replayIdx][0] < 0) {replayIdx += 1;}
        
    //I am going to make the assumption that all replays have a negative start time, assert this first
    if ((replayData[0][0] !== 0) || (replayData[1][0] > 0)){
        alert('CODE RED THIS MAP IS WEIRRDDD EWWWWWWWWWWW');
    }
    if (replayData[0][0] === 0){
        replayData = replayData.slice(1); // Get rid of first empty row
    }
    
        
    var i = 0; while (replayData[i][0] <= 0) {
        replayTimeSum += replayData[i][0]; i += 1;
    }
        
    //replayStartTime =  -replayTimeSum //Start in minimally 0 seconds + weirdness
    //LZMA.decompress(new Uint8Array( buffer.slice(idx, idx+compressed_length)),function(result, error){
    idx += compressed_length;
    scoreid = unpackUnitData(buffer, idx, LONG); idx += LONG;
    out.innerText += 'Score ID: ' + scoreid + '\t';
    
    //All is loaded
    sp = 'songs/962088 MIMI feat. Hatsune Miku - Marshmary/';
    resolve({'replayData': replayData,
             //'replayStartTime':replayStartTime,
             'replayTimeSum': replayTimeSum,
             'folder-src': sp,
             'bg-src': sp + 'marshmary.jpg',
             'map-src': sp + 'MIMI feat. Hatsune Miku - Marshmary (Log Off Now) [Horizon].osu'});
    });
    });
    });
    });
    
    
    
});}
