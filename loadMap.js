function loadMap(src){ return new Promise((resolve) => {
    
    fetch( src ).then(response=>{
    response.text().then(text=>{
    text = text.trim().replace('\r','').split('\n');
    
    var map_data = {};
    var line_data = {};
    var current = "";
    for (var i = 0; i < text.length; i++){
        if (text[i].trim()[0] === '[' && text[i].trim().slice(-1) === ']'){
            if (current.length === 0){ current = text[i].trim().slice(1,-1); }
            else {map_data[current] = line_data; current = text[i].trim().slice(1,-1);}
            if (current === "Events" || current === "TimingPoints" || current === "HitObjects"){line_data = [];}
            else {line_data = {};}
        } else if ((current === "Events" || current === "TimingPoints" || current === "HitObjects") && (text[i].split('\\\\')[0].includes(','))) {
            line_data.push(text[i].trim().split(','));
        } else if (text[i].includes(':')){
            line_data[text[i].split(':')[0].trim()] = text[i].split(':')[1].trim();
        }
    }
    map_data[current] = line_data;
    
    if (map_data['General']['AudioLeadIn'] !== "0") { alert ("GRRR why is your AudioLeadIn not zero??");}
    
    //Important stuff?
    //General -> OverlayPosition, EpilepsyWarning, CountdownOffset, SamplesMatchPlaybackRate
    //Difficulty -> CircleSize, OverallDifficulty, ApproachRate, SliderMultiplier, SliderTickRate
    //Events: eventType,startTime(from beginning of audio),eventParams
    //Timing points: time,beatLength,meter,sampleSet,sampleIndex,volume,uninherited,effects
    //Hitobjects: x,y,time,type,hitSound,objectParams,hitSample
    
    resolve(map_data);
    
    });
    });
    
})};