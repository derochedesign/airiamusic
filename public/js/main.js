let songs;
let artists;
let releases;
let userData;
let audioPlayback;
const player = document.getElementById("audioPlayer");
player.controls = false;

document.addEventListener("DOMContentLoaded", _ => {
    
   //get data
   $.getJSON('../data/user.json', function(result) { 
         userData = result;
   });
   $.getJSON('../data/all-music.json', function(result) { 
          songs = result.songs;
          artists = result.artists;
          releases = result.releases;
          init();
   });
   
});

const init =_=> {
   switchView(0);
   populateMain("recent");
   //put something in mini player, but should build off of user data and what they last had playing
   document.getElementById("miniInfo").innerHTML = generateMini(songs.filter(song => song.id == 101)[0]);
}

//all click events
document.addEventListener("click", e => {
   
   //if matches
   if (e.target.matches("#collBtn") || e.target.matches("#miniPlayer")) {
      document.getElementById("fullPlayer").classList.toggle("active");
      document.getElementById("miniPlayer").classList.toggle("active");
   }
   //local nav tabs
   if (e.target.parentNode.matches(".local-nav")) {
      populateMain(e.target.dataset.select);
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
      controlAudio(e.target.dataset.control);
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
      populateContext(e.target);
      
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

const getMediaInfo = id => {
   let set = songs.filter(song => song.id == id)
   
   if (set.length === 0) {
      set = artists.filter(song => song.id == id)
   }
   if (set.length === 0) {
      set = releases.filter(song => song.id == id)
   }
   if (set.length === 0) {
      return null;
   }
   set = set[0];
   return set;
}

const songRequest = id => {
   let set = getMediaInfo(id);
   
   //set mini player
   document.getElementById("miniInfo").innerHTML = generateMini(set);
   //set audio source
   player.setAttribute("src", `audio/${set.artist.slug}/${set.group.slug}/${id}.mp3`);
   //play audio
   controlAudio("toggle-play");
   audioPlayback = setInterval(() => {animDuration(player)}, 400);
}

const controlAudio = (cmd) => {
   //cmd is the control requested; play, pause, next, back, etc
   //evt is event.target
   if (cmd === "toggle-play") {
      //toggle play/pause of audio
      const evt = document.querySelectorAll(`[data-control="toggle-play"]`);
      
      if (!player.paused) {
         player.pause();
  
         Array.from(evt).map(ev => {
            ev.innerHTML = `<img src="img/icons/play.svg">`;
         });
      }
      else {
         player.play();
         
         Array.from(evt).map(ev => {
            ev.innerHTML = `<img src="img/icons/pause.svg">`;
         });
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
   
   const duraBar = document.getElementsByClassName("duration-bar");
   const tempTime = document.getElementById("tempTime");
   
   if ((audElm.currentTime / audElm.duration) && !player.paused) {
      console.log("audio playing");
      
      Array.from(duraBar).map(bar => {
         bar.style.width = `${(audElm.currentTime / audElm.duration)*100}%`;
      });
      //tempTime.innerHTML = Math.round(player.currentTime * 100) / 100;
      const secs = Math.ceil(player.currentTime - (Math.floor(player.currentTime / 60)) * 60);
      const mins = Math.floor(player.currentTime / 60);
      tempTime.innerHTML = `${ mins }:${(secs < 10) ? ("0") : ""}${ secs }`;
   }
   
}

const switchView = select => {
   //select is an int that dictates which page to show; 0=feed, 1=library
   const data = [{
      title: "Feed",
      options: [
         "recent", "new", "discover"
      ]
   },
   {
      title: "Library",
      options: [
         "playlists", "category"
      ]
   }];
   
   document.getElementById("navHead").innerHTML = populateView(data[Number(select)]);
   populateMain(data[Number(select)].options[0]);
}

const populateView = data => {
   
   return (
      `
      <h1>${data.title}</h1>
      <div class="local-nav">
         ${data.options.map((opt,i) => `<h4 data-select="${opt.toLowerCase()}" class="${(i == 0 ? "active" : "")}">${opt}<div class="active-marker"></div></h4>`).join('')}
      </div>
      `
   )
}

const populateMain = select => {
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
   else if (select == "playlists") {
      orderedArr = Array.from(userData.playlists);
      feedElem.innerHTML = generateLibrary(orderedArr);
      return;
      
   }
   
   feedElem.innerHTML = generateFeed(orderedArr);
   
}

const populateContext = evt => {
   
   const data = getMediaInfo(Number(evt.parentNode.dataset.id));
   const playlistData = Array.from(userData.playlists);
   
   document.getElementById("contextInfo").innerHTML =`
   <img class="artwork" src="img/art/${data.artwork}.jpg">
   <div>
      <h5>${data.artist.title}</h5>
      <h4 class="secondary">${data.title}</h4>
   </div>
   `;
   
   document.getElementById("contextPlaylists").innerHTML =`
   <button class="quickshot playlist">
      <div class="shot"><h1 class="thumb">+</h1></div>
      <div class="label"><h4>Create</h4></div>
   </button>
   ${playlistData.map(pla => `
   <button class="quickshot playlist">
      <div class="shot">
         <h1 class="thumb">${(pla.name).slice(0,2)}</h1>
      </div>
      <div class="label">
         <h4>${pla.name}</h4>
      </div>
   </button>
   `).join("")}
   `
};

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

const generateLibrary = dataArr => {
   console.log(dataArr);
   
   return (
      `<div>${dataArr.map(dat => `<div>${dat.name}</div>`).join('')}</div>`
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