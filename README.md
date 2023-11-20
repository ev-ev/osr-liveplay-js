# osu-liveplay-js

[![GitHub Pages](https://img.shields.io/badge/github%20pages-release-8A2BE2.svg)](https://ev-ev.github.io/osu-liveplay-js/displayer.html)

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
<img src="https://github.com/ev-ev/osr-liveplay-js/assets/27211692/88cd84a0-1d85-4cdd-b874-1eb3eaf3d47e" width="400" height="225" />
<img src="https://github.com/ev-ev/osr-liveplay-js/assets/27211692/3c6110fb-7715-4cfe-ab14-51026cca6670" width="400" height="225" />


## Credits and Licence
Software made by Evgeny ([@ev-ev](https://github.com/ev-ev))

Licenced under Apache License 2.0

Credits and licences for 3rd party stuff are inside [CREDITS.md](CREDITS.md)
