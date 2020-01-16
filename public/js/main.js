let songs;
let artists;
let releases;
let audioPlayback;
const player = document.getElementById("audioPlayer");
player.controls = false;

document.addEventListener("DOMContentLoaded", _ => {
    
   //get data
   $.getJSON('../data/all-music.json', function(result) { 
          songs = result.songs;
          artists = result.artists;
          releases = result.releases;
          init();
   });
   
});

const init =_=> {
   switchView(0);
   populateFeed("recent");
   //put something in mini player, but should build off of user data and what they last had playing
   document.getElementById("miniInfo").innerHTML = generateMini(songs.filter(song => song.id == 101)[0]);
}

//all click events
document.addEventListener("click", e => {
   
   //if matches
   if (e.target.matches("#collBtn")) {
      document.getElementById("fullPlayer").classList.remove("active");
   }
   if (e.target.matches("#miniPlayer")) {
      document.getElementById("fullPlayer").classList.add("active");
   }
   //local nav tabs
   if (e.target.parentNode.matches(".local-nav")) {
      populateFeed(e.target.dataset.select);
      [...e.target.parentNode.children].map(elem => elem.classList.remove("active") );
      e.target.classList.add("active");
   }
   
   if (e.target.matches("#menuBtn")) {
      e.target.classList.toggle("active");
      document.querySelector("#theMenu").classList.toggle("active");
   }
   
   if (e.target.parentNode.matches(".main-nav")) {
      switchView(e.target.dataset.select);
      [...e.target.parentNode.children].map(elem => elem.classList.remove("active") );
      e.target.classList.add("active");
   }
   
   if (e.target.dataset.control) {
      controlAudio(e.target.dataset.control, e.target);
   }
   
   if (e.target.matches("#context")) {
      document.getElementById("context").classList.toggle("active");
   }
   
   console.log(e.target);
   
});

if (document.addEventListener) {
   document.addEventListener('contextmenu', function(e) {
     
      if (e.target.parentNode.classList.contains("media-entry-large")) {
         document.getElementById("context").classList.toggle("active");
      }
      
     e.preventDefault();
   }, false);
 } else {
   document.attachEvent('oncontextmenu', function() {
     window.event.returnValue = false;
   });
 }

document.getElementById("feedElem").addEventListener("click", e => {
   //this is stupid
   if (!e.target.dataset.id) {
      if (e.target.parentNode.dataset.id){
         songRequest(Number(e.target.parentNode.dataset.id))
      }
      else {
         if (e.target.parentNode.parentNode.dataset.id){
            songRequest(Number(e.target.parentNode.parentNode.dataset.id))
         }
      }
   }
   else {
      songRequest(Number(e.target.dataset.id));
   }
   
});

const songRequest = id => {
   let set = songs.filter(song => song.id == id)
   set = set[0];
   
   //set mini player
   document.getElementById("miniInfo").innerHTML = generateMini(set);
   //set audio source
   player.setAttribute("src", `audio/${set.artist.slug}/${set.group.slug}/${id}.mp3`);
   //play audio
   player.play();
   audioPlayback = setInterval(() => {animDuration(player)}, 200);
}

const controlAudio = (cmd, evt) => {
   //cmd is the control requested; play, pause, next, back, etc
   //evt is event.target
   if (cmd === "play" || cmd === "pause") {
      //toggle play/pause of audio
      if (!player.paused) {
         player.pause();
         evt.innerHTML = `<img src="img/icons/play.svg">`;
         evt.dataset.control = "play";
      }
      else {
         player.play();
         evt.innerHTML = `<img src="img/icons/pause.svg">`;
         evt.dataset.control = "pause";
      }
   }
   else if (cmd === "prev") {
      //toggle prev song in queue
   }
   else if (cmd === "next") {
      //toggle next song in queue
   }
}

const animDuration = audElm => {
   
   const duraBar = document.getElementById("durationBar");
   
   if ((audElm.currentTime / audElm.duration) && !player.paused) {
      console.log("true");
      
      duraBar.style.width = `${(audElm.currentTime / audElm.duration)*100}%`;
   }
   
}

const switchView = select => {
   //select is an int that dictates which page to show; 0=feed, 1=library
   let obj = {
      title: "Feed",
      options: [
         "Recent", "New", "Discover"
      ]
   }
   
   document.getElementById("navHead").innerHTML = populateView(obj);
}

const populateView = data => {
   return (
      `
      <h1>${data.title}</h1>
      <div class="local-nav">
         ${data.options.map((opt,i) => `<h4 data-select="${opt.toLowerCase()}" class="${(i == 0 ? "active" : null)}">${opt}<div class="active-marker"></div></h4>`).join('')}
      </div>
      `
   )
}

const populateFeed = select => {
   console.log(select);
   
   const feedElem = document.getElementById("feedElem");
   let orderedArr;
   
   if (select == "recent") {
      //recent (needs a user data set to index)
      //at users recently played in their data set and show it
      orderedArr = [...songs];
   }
   else if (select == "new") {
      //new (from users followed artists)
      //get list of artists -> sort through all their releases -> sort x newest by date
      orderedArr = songs.slice().sort((a, b) => (new Date(b.releaseDate) - new Date(a.releaseDate)) );
   }
   else if (select == "discover") {
      //discover
      //some light ml recommendation system
      orderedArr = [...songs];
   }
   
   feedElem.innerHTML = generateFeed(orderedArr);
   
}

const generateFeed = dataArr => {
   //get artwork slug from release
   
   dataArr.map(dat => {
      dat.artwork = releases.filter(rel => rel.id == dat.group.id)[0].slug;
   });
   
   
   return (
      `
      ${dataArr.map(dat => `
      <div class="media-entry-large" data-id="${dat.id}">
         <img src="img/art/${dat.artwork}.jpg">
         <div>
            <h5>${dat.artist.title}</h5>
            <h4 class="secondary">${dat.title}</h4>
         </div>
      </div>`
      ).join('')}
      
      `
   )
}

const generateMini = data => {
   
   return (`
      <div class="song-snapshot" style="background-image: url(../img/art/${data.artwork}.jpg)"></div>
      <div class="song-info">
         <h5>${data.artist.title}</h5>
         <h4 class="secondary">${data.title}</h4>
      </div>
   `)
}