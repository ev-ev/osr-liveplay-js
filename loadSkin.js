function loadSkin(src){ return new Promise((resolve, reject) => {
    var assets = {};
    fetch(src+'/Skin.ini').then(response=>{
    response.text().then(text=>{
    text = text.trim().replace('\r','').split('\n');
    
    var skinIni = {};
    var line_data = {};
    var current = "";
    for (var i = 0; i < text.length; i++){
        if (text[i].trim()[0] === '[' && text[i].trim().slice(-1) === ']'){
            if (current.length === 0){ current = text[i].trim().slice(1,-1); }
            else {skinIni[current] = line_data; current = text[i].trim().slice(1,-1);}
            line_data = {};
        } else if (text[i].includes(':')){
            line_data[text[i].split(':')[0].trim()] = text[i].split(':')[1].split('//')[0].trim();
        }
    }
    skinIni[current] = line_data;
    assets['skinIni'] = skinIni;
    loadImage(src+'/cursor@2x.png').then(cursorImage => { assets['cursorImage'] = cursorImage;
    loadImage(src+'/hitcircle@2x.png').then(hitCircleImage => { assets['hitCircle'] = hitCircleImage;
    loadImage(src+'/hitcircleoverlay@2x.png').then(hitCircleOverlayImage => { assets['hitCircleOverlay'] = hitCircleOverlayImage;
    loadImage(src+'/approachcircle.png').then(approachCircleImage => { assets['approachCircle'] = approachCircleImage;
    loadImage(src+'/default-0@2x.png').then(default0Image => { assets['default0'] = default0Image;
    loadImage(src+'/default-1@2x.png').then(default1Image => { assets['default1'] = default1Image;
    loadImage(src+'/default-2@2x.png').then(default2Image => { assets['default2'] = default2Image;
    loadImage(src+'/default-3@2x.png').then(default3Image => { assets['default3'] = default3Image;
    loadImage(src+'/default-4@2x.png').then(default4Image => { assets['default4'] = default4Image;
    loadImage(src+'/default-5@2x.png').then(default5Image => { assets['default5'] = default5Image;
    loadImage(src+'/default-6@2x.png').then(default6Image => { assets['default6'] = default6Image;
    loadImage(src+'/default-7@2x.png').then(default7Image => { assets['default7'] = default7Image;
    loadImage(src+'/default-8@2x.png').then(default8Image => { assets['default8'] = default8Image;
    loadImage(src+'/default-9@2x.png').then(default9Image => { assets['default9'] = default9Image;
    resolve(assets);
    });
    });
    });
    });
    });
    });
    });
    });
    });
    });
    });
    });
    });
    });
    });
    });
})};