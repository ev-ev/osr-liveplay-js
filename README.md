# osr-liveplay-js
osu!liveplay is a WIP replay file player made for embedding in html using javascript to parse .osr, .osu and skin files to assemble a replay to show in realtime. The replay files can come from user uploads or stored on a database, and the song can be dynamically downloaded for the replay (not included in this project (probably..)). 

## Using !liveplay
Right now it is still in active development so there is no 'embeddable' version and many values are hardcoded for the specific map and skin I am testing them for, so currently it can either be used with the preset map and skin or a different skin but the hardcoded values all replaced. Some features may not work yet too, for example TimingPoint changes only affect sliderspeed as of now, what may break replays of more complicated maps (as of now).

To start the server simply run ```start.py``` to start the server on port 8000, and connect to ```localhost:8000/displayer.html``` . Click anywhere to start the replay loading process (this is required for the audio to work, as it requires user interaction) and it will immediately start.

## Notes
As I am not used to using JS to make stuff, my code may not be following best practices and such - I would be really happy for opening issues or pull requests, even if it is something really small. Thanks ! :D

## Currently implemented features
- Loading replay data (.osr) and displaying cursor movement with time
- Loading map data (.osu)
  - Hitobjects
  - Timingpoints (for slider speed only as of now)
  - Map difficulty (e.g. scale circles with CS and approach rate with AR)
  - Combo colors (does not work! The "tining" procedure makes the entire rect of the images tinted, not just the images themselves, haven't figured it out yet)
- Loading skin assets to show as hitobjects (while not fully hardcoded, it seems that osu!skins have a lot of varations that I am not accounting for as the skin I am using does not have these features, so trying to use a different skin may result in broken textures)
- Showing hitobjects! (fun)
  - Hitcircle (with the fadeout and explosion animation*)
  - Linear sliders (Sliderhead, body, border, reverse arrow and ball only)
  - Fade in and approach circles based on AR

*I had to take some creative liberties with some constants to what they should be compared to in osu!stable (for example hitobject fade out time and behavior of the fadeout, they like expand somehow too). The actual values should be in the osu!lazer source but I am not good enough to read it or know where to look...

## Screenshots
<img src="https://github.com/ev-ev/osr-liveplay-js/assets/27211692/407ecbf6-e4a5-401e-be16-a77d0285a024" width="400" height="225" />
<img src="https://github.com/ev-ev/osr-liveplay-js/assets/27211692/00a83eb6-1528-4707-bb25-e69906d790f1" width="400" height="225" />


## Credits and Licence
Software made by Evgeny ([@ev-ev](https://github.com/ev-ev))

Licenced under Apache License 2.0

Credits and licences for 3rd party stuff are inside [CREDITS.md](CREDITS.md)
