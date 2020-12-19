const synthPatch = {
	
        "volume": -8,
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

const rnn = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv');
const synth = new Tone.MonoSynth(synthPatch).toDestination();

const eq = new Tone.EQ3(2,4,-10);
const distortion = new Tone.Distortion(0.02);
const reverb = new Tone.Reverb({
	"wet": 1,
	"decay": 20,
	"preDelay": 0.01
});
const wide = new Tone.StereoWidener(1);


const transp = Tone.Transport;
async function startIt() {
    await rnn.initialize();

    let seedSeq = {
        totalQuantizedSteps: 7,
        quantizationInfo: { stepsPerQuarter: 1},
        notes: [
            { pitch: 62, quantizedStartStep: 0, quantizedEndStep: 1 },
            { pitch: 60, quantizedStartStep: 6, quantizedEndStep: 7 },
            { pitch: 59, quantizedStartStep: 4, quantizedEndStep: 5 },
            { pitch: 57, quantizedStartStep: 2, quantizedEndStep: 3 },
            { pitch: 55, quantizedStartStep: 1, quantizedEndStep: 2 }
        ]
    }

    let resultSeq = await rnn.continueSequence( seedSeq, 15, 0.8, ['CM']);
    let resultSeqSec = await rnn.continueSequence( seedSeq, 15, 0.5, ['CM']);
    
    console.log(resultSeq);
    console.log(resultSeqSec);

    let tick = 0;
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
        
        if (tick == 3 || tick == 6) augment = 0;
        else augment = 1;
        
        let notes = currNotes.filter(n => n.quantizedStartStep === tick);
        for (let note of notes) {
            console.log(note);
            synth.triggerAttack(Tone.Frequency((note.pitch) * augment, "midi"), time);
        }
        tick++;
    }, '8n');
}

const player = document.getElementById("audioPlayerTest");
player.controls = false;
player.setAttribute("src", `audio/clairo/immunity/106.m4a`);
transp.bpm.value = 104;
const lowpass = new Tone.Filter(800, "lowpass");
Tone.Destination.chain(eq, distortion,lowpass, wide, reverb);

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
    
}

const controlAudio = (cmd) => {
    //cmd is the control requested; play, pause, next, back, etc
    //evt is event.target
    if (cmd === "toggle-play") {
       //toggle play/pause of audio
       const evt = document.querySelectorAll(`[data-control="toggle-play"]`);
       
       if (playing) {
          player.pause();
          transp.pause();
          synth.triggerRelease();
          Array.from(evt).map(ev => {
             ev.innerHTML = `<img src="img/icons/play.svg">`;
          });
       }
       else {
          player.play();
        
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