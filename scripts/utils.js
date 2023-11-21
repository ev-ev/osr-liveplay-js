var BYTE = 1;
var SHORT = 2;
var INT = 4;
var LONG = 8;
var enc = new TextDecoder('utf-8');

var MODS = {
    '': 0,
    'NF': 1,
    'EZ': 2,
    'TouchDevice': 4,
    'HD': 8,
    'HR': 16,
    'SD': 32,
    'DT': 64,
    'RX': 128,
    'HT': 256,
    'NC': 512, // Only set along with DoubleTime. i.e: NC only gives 576
    'FL': 1024,
    'AP': 2048,
    'SO': 4096,
    'Relax2': 8192,    // Autopilot
    'PF': 16384, // Only set along with SuddenDeath. i.e: PF only gives 16416  
    'Key4': 32768,
    'Key5': 65536,
    'Key6': 131072,
    'Key7': 262144,
    'Key8': 524288,
    'FadeIn': 1048576,
    'Random': 2097152,
    'Cinema': 4194304,
    'Target': 8388608,
    'Key9': 16777216,
    'KeyCoop': 33554432,
    'Key1': 67108864,
    'Key3': 134217728,
    'Key2': 268435456,
    'ScoreV2': 536870912,
    'Mirror': 1073741824,
};
function getMods(val){
    result = '';
    for (const [key, value] of Object.entries(MODS)) {
        if (val & value !== 0) {
            result += key;
        }
    }
    return (result === '') ? 'none' : result;
}

function tintImage(imgElement, tintColor) {  return new Promise((resolve) => {
        // create hidden canvas (using image dimensions)
        var canvas = document.createElement('canvas');
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        

        var ctx = canvas.getContext('2d');
        ctx.drawImage(imgElement, 0, 0);

        var map = ctx.getImageData(0, 0, 320, 240);
        var imdata = map.data;

        // convert image to grayscale
        var r, g, b, avg;
        for (var p = 0, len = imdata.length; p < len; p += 4) {
            r = imdata[p];
            g = imdata[p + 1];
            b = imdata[p + 2];
            
            avg = Math.floor((r + g + b) / 3);

            imdata[p] = imdata[p + 1] = imdata[p + 2] = avg;
        }

        ctx.putImageData(map, 0, 0);

        // overlay filled rectangle using lighter composition
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = tintColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // replace image source with canvas data
        //console.log("meow");
        //console.log(canvas.toDataURL());
        loadImage(canvas.toDataURL()).then(tintedImage => {
            resolve(tintedImage);
        });
    
});}

function unpackUnitData(bytes, offset, sz){
    switch (sz){
    case BYTE:
        var view = new Int8Array(bytes.slice(offset, offset + sz));
        return view[0];
    break;
    case SHORT:
        var view = new Int16Array(bytes.slice(offset, offset + sz));
        return view[0];
    break;
    case INT:
        var view = new Int32Array(bytes.slice(offset, offset + sz));
        return view[0];
    break;
    case LONG:
        var view = new BigInt64Array(bytes.slice(offset, offset + sz));
        return view[0];
    }
}



function unpackULEB128(bytes, offset){
    view = new Int8Array(bytes.slice(offset));
    var sz = 0;
    var result = 0;
    var shift = 0;
    while (true) {
        var b = view[sz]; sz += BYTE;
        result |= (b & 0x7f) << shift;
        if ((0x80 & b) === 0) { break; }
        shift += 7;
    }
    return [sz, result];
}

function unpackString(bytes, offset){
    var sz = 0;
    var content = '';
    var has_content = unpackUnitData(bytes, offset, BYTE); sz += BYTE;
    if (has_content === 11) {
        var values = unpackULEB128(bytes, offset + sz); sz += values[0];
        var view = new Uint8Array(bytes.slice(offset + sz, offset + sz + values[1])); sz += values[1];
        content = enc.decode(view);
    }
    return [sz, content];
}

function linearScale(x, x0, y0, x1, y1){
    return x * ((y0 - y1) / (x0 - x1)) + y1 - x1 * ((y0 - y1) / (x0 - x1));
}

function pause(){
    if (! paused){
        paused = true;
        pauseTime = Date.now();
    } else {
        replayStartTime += (Date.now() - pauseTime)/speed;
        paused = false;
    }

}
