# osr-liveplay-js
osu!liveplay is a WIP replay file player made for embedding in html using javascript to parse .osr, .osu and skin files to assemble a replay to show in realtime. The replay files can come from user uploads or stored on a database, and the song can be dynamically downloaded for the replay (not included in this project (probably..)). 

## Using !liveplay
Right now it is still in active development so there is no 'embeddable' version and many values are hardcoded for the specific map and skin I am testing them for, so currently it can either be used with the preset map and skin or a different skin but the hardcoded values all replaced. Some features may not work yet too, for example TimingPoint changes only affect sliderspeed as of now, what may break replays of more complicated maps (as of now).

To start the server simply run ```start.py``` to start the server on port 8000, and connect to ```localhost:8000/displayer.html``` . Click anywhere to start the replay loading process (this is required for the audio to work, as it requires user interaction) and it will immediately start.

## Notes
As I am not used to using JS to make stuff, my code may not be following best practices and such - I would be really happy for opening issues or pull requests, even if it is something really small. Thanks ! :D

## Credits and Licence
Software made by Evgeny ([@ev-ev](https://github.com/ev-ev))

Licenced under Apache License 2.0

Credits and licences for 3rd party stuff are inside [CREDITS.md](CREDITS.md)
