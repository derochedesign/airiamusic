const synthPatch = {
	
        "volume": -12,
        "detune": 0,
        "portamento": 0,
        "envelope": {
            "attack": 0.05,
            "attackCurve": "linear",
            "decay": 0.6,
            "decayCurve": "exponential",
            "release": 1.2,
            "releaseCurve": "exponential",
            "sustain": 0.4
        },
        "oscillator": {
            "detune": 0,
            "frequency": 440,
            "partialCount": 8,
            "partials": [
                1.2732395447351628,
                0,
                0.4244131815783876,
                0,
                0.25464790894703254,
                0,
                0.18189136353359467,
                0
            ],
            "phase": 1,
            "type": "sine8"
        }
    
}

const notes = {
    CM:{
        O5:[72,74,76,77,79,81,83],
        O4:[60,62,64,65,67,69,71],
        O3:[48,50,52,53,55,57,59]
    }
}

const clairo_whiteflag = {
    artist:"clairo",
    song:"106",
    group:"immunity",
    bpm: 104,
    key:"CM",
    tags:{
        timbre:"dark",
        energy: "low"
    }
}

const randomRangesTimbre = {
    dark: {
        reverb: {
            min:0.5,
            max:2
        },
        speed: {
            min:0.85,
            max:1
        },
        eq3: {
            low:{
                min:0,
                max:0.5
            },
            mid:{
                min:-1,
                max:1
            },
            high:{
                min:-2,
                max:0
            }
        },
        distortion: {
            min:0,
            max:0.03
        }
    },
    bright: {
        reverb: {
            min:0.1,
            max:1
        },
        speed: {
            min:1,
            max:1
        },
        eq3: {
            low:{
                min:-1,
                max:0.5
            },
            mid:{
                min:-1,
                max:1
            },
            high:{
                min:0,
                max:1.5
            }
        },
        distortion: {
            min:0,
            max:0.01
        }
    }
}

//this code is really thrown together

const rnn = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv');
const synth = new Tone.MonoSynth(synthPatch).toDestination();
const synthSignal = new Tone.Signal({
    value:0,
    units:"cents"
}).connect(synth.detune);

//effects
const m_eq = new Tone.EQ3(0,0,0);
let m_distortion;
const reverb = new Tone.Reverb({
	"wet": 1,
	"decay": 20,
	"preDelay": 0.01
});
let m_reverb;
const wide = new Tone.StereoWidener(1);
const lowpass = new Tone.Filter(800, "lowpass");

//math...
let speedAdjust = 1;
let pitchAdjust;
let randNotes = [];

const transp = Tone.Transport;

const getRandomFromRange = (min, max) => {
    return Math.random() * (max - min) + min;
}

const genSongParams = _ => {
    speedAdjust = getRandomFromRange(randomRangesTimbre.dark.speed.min, randomRangesTimbre.dark.speed.max);
    pitchAdjust = (12 * Math.log(speedAdjust)) / Math.log(2);
    
    m_distortion = new Tone.Distortion(getRandomFromRange(randomRangesTimbre.dark.distortion.min, randomRangesTimbre.dark.distortion.max));
    m_reverb = new Tone.Reverb({
        "wet": getRandomFromRange(randomRangesTimbre.dark.reverb.min, randomRangesTimbre.dark.reverb.max) / 4, //0.5 - 2
        "decay": getRandomFromRange(randomRangesTimbre.dark.reverb.min, randomRangesTimbre.dark.reverb.max) * 3.5,
        "preDelay": getRandomFromRange(randomRangesTimbre.dark.reverb.min, randomRangesTimbre.dark.reverb.max) / 50
    });
    
    for (let i = 0; i < 5; i++) {
        randNotes.push(Math.floor(getRandomFromRange(0,6)));
    }
    console.log(randNotes);
    document.getElementById("stats").innerHTML = `
    <p>speed adjust: ${speedAdjust}</p>
    <p>distortion: ${m_distortion._distortion}</p>
    <p>reverb(decay): ${m_reverb.decay}</p>
    <h3>Notes</h3>
    <p>${notes.CM.O4[randNotes[0]]}</p>
    <p>${notes.CM.O4[randNotes[1]]}</p>
    <p>${notes.CM.O4[randNotes[2]]}</p>
    <p>${notes.CM.O4[randNotes[3]]}</p>
    <p>${notes.CM.O4[randNotes[4]]}</p>
    `
}
genSongParams();

async function startIt() {
    await rnn.initialize();

    let seedSeq = {
        totalQuantizedSteps: 7,
        quantizationInfo: { stepsPerQuarter: 1},
        notes: [
            //this is something i need to figure out how to generate rather than hardcode
            { pitch: notes.CM.O4[randNotes[0]], quantizedStartStep: 0, quantizedEndStep: 1 },
            { pitch: notes.CM.O3[randNotes[1]], quantizedStartStep: 6, quantizedEndStep: 7 },
            { pitch: notes.CM.O4[randNotes[2]], quantizedStartStep: 4, quantizedEndStep: 5 },
            { pitch: notes.CM.O5[randNotes[3]], quantizedStartStep: 2, quantizedEndStep: 3 },
            { pitch: notes.CM.O4[randNotes[4]], quantizedStartStep: 1, quantizedEndStep: 2 }
        ]
    }
    
    //generate two sets for more variation -- again, should be a better way to do this (ie in one call)
    let resultSeq = await rnn.continueSequence( seedSeq, 15, 0.8, ['CM']);
    let resultSeqSec = await rnn.continueSequence( seedSeq, 15, 0.5, ['CM']);
    
    let resultSeqMore = await rnn.continueSequence( seedSeq, 22, 0.5, ['CM']);
    
    console.log(resultSeq);
    console.log(resultSeqSec);
    
    document.getElementById("pausePlay").classList.remove("disabled");

    let tick = 0;
    let oTick = 0;
    let augment = 1;
    let rotate = false;
    let currNotes = resultSeq.notes;
    transp.scheduleRepeat(time => {
        if (tick >= 8) {
            tick = 0;
            console.log("reset");
            if (rotate) currNotes = resultSeq.notes;
            else currNotes = resultSeqSec.notes;
             
            rotate = !rotate;
        }
        
        if (oTick >= 24) {
            oTick = 0;
            currNotes = resultSeqMore.notes;
        }
        
        //just cut out some notes 
        if (tick == 3 || tick == 6) augment = 0;
        else augment = 1;
        
        let notes = currNotes.filter(n => n.quantizedStartStep === tick);
        for (let note of notes) {
            console.log(note);
            synth.triggerAttack(Tone.Frequency(((note.pitch) * augment) , "midi"), time);
        }
        tick++;
        oTick++;
    }, '8n');
}

// const player = document.getElementById("audioPlayerTest");
// player.controls = false;
// player.setAttribute("src", `audio/${clairo_whiteflag.artist}/${clairo_whiteflag.group}/${clairo_whiteflag.song}.m4a`);
const staticPlayer = new Tone.Player(`audio/${clairo_whiteflag.artist}/${clairo_whiteflag.group}/${clairo_whiteflag.song}.m4a`).toDestination();
staticPlayer.sync().start(0);
staticPlayer.playbackRate = speedAdjust;
synthSignal.rampTo(pitchAdjust * 100);

transp.bpm.value = clairo_whiteflag.bpm;
synth.chain(reverb, wide, Tone.Destination);
Tone.Destination.chain(m_distortion, m_reverb);

startIt();

let playing = false;

document.addEventListener("click", e => {

    if (e.target.dataset.control) {
        controlAudio(e.target.dataset.control);
    }
    
    if (e.target.matches("#variateBtn")) {
        console.log("variate it!");
        generateVariation();
    }
    
});

const generateVariation = _ => {
    //bad
    location.reload();
}

const controlAudio = (cmd) => {
    //cmd is the control requested; play, pause, next, back, etc
    //evt is event.target
    if (cmd === "toggle-play") {
       //toggle play/pause of audio
       const evt = document.querySelectorAll(`[data-control="toggle-play"]`);
       
       if (playing) {
          //player.pause();
          transp.pause();
          synth.triggerRelease();
          Array.from(evt).map(ev => {
             ev.innerHTML = `<img src="img/icons/play.svg">`;
          });
       }
       else {
          //player.play();
          transp.start();
          Array.from(evt).map(ev => {
             ev.innerHTML = `<img src="img/icons/pause.svg">`;
          });
       }
       playing = !playing;
    }
    else if (cmd === "prev") {
       //toggle prev song in queue
    }
    else if (cmd === "next") {
       //toggle next song in queue
    }
}

const generateMini = _ => {
   
    return (`
       <div class="song-snapshot" style="background-image: url(../img/art/immunity-clairo.jpg)"></div>
       <div class="song-info">
          <h5>Clairo</h5>
          <h4 class="secondary">White Flag</h4>
       </div>
    `)
}

document.getElementById("miniInfoTest").innerHTML = generateMini();