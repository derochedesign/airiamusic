let songs;
let artists;
let releases;
let userData;
let audioPlayback;
let pagePos = 0;
const mainPages = [
   {
      name: "recent",
      id: 0
   },
   {
      name: "new",
      id: 1
   },
   {
      name: "discover",
      id: 2
   },
   {
      name: "playlists",
      id: 3
   },
   {
      name: "category",
      id: 4
   }
];
const player = document.getElementById("audioPlayer");
player.controls = false;

document.addEventListener("DOMContentLoaded", _ => {
    
   //get data
   $.when(
      $.getJSON('../data/user.json', function(result) { 
            userData = result;
      }),
      $.getJSON('../data/all-music.json', function(result) { 
            songs = result.songs;
            artists = result.artists;
            releases = result.releases;
      })
   ).then(_=> {
      init();
   });
   
   
});

const mc = new Hammer.Manager(document.getElementById("main"), {preventDefault: true});
mc.add( new Hammer.Swipe() );

const init =_=> {
   switchView(0);
   switchPage("recent", null);
   populatePlayer(songs.filter(song => song.id == 101)[0]);
   //put something in mini player, but should build off of user data and what they last had playing
   document.getElementById("miniInfo").innerHTML = generateMini(songs.filter(song => song.id == 101)[0]);
}

mc.on("swipe", e => {
   console.log(e);
   
   if (e.direction === 4) {
      //right - decending
      if (pagePos > 0)  {
         pagePos--;
         if (pagePos === 2) {
            switchView(0);
         }
         switchPage(mainPages[pagePos].name, null);
      }
   }
   else if (e.direction === 2) {
      //left - ascending
      if (pagePos < 4) {
         pagePos++;
         if (pagePos === 3) {
            switchView(1);
         }
         switchPage(mainPages[pagePos].name, null);
      }
   }
   
});

//all click events
document.addEventListener("click", e => {
   
   //if matches
   if (e.target.matches("#collBtn") || e.target.matches("#miniPlayer")) {
      document.getElementById("fullPlayer").classList.toggle("active");
      document.getElementById("miniPlayer").classList.toggle("active");
   }
   //local nav tabs
   if (e.target.parentNode.matches(".local-nav")) {
      pagePos = mainPages.filter(page => (page.name == (e.target.dataset.select)))[0].id;
      switchPage(e.target.dataset.select, e.target);
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

//override right click
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
   //set full player
   populatePlayer(set);
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

const switchPage = (select, evt) => {
   console.log(select);
   console.log(pagePos);
   populateMain(select);
   [...document.getElementById("localNav").children].map(elem => elem.classList.remove("active") );
   if (evt != null) {
      evt.classList.add("active");
   }
   else {
      document.querySelector(`[data-select="${select}"]`).classList.add("active");
   }
}

const switchView = select => {
   //select is an int that dictates which page to show; 0=feed, 1=library
   const screenSpace = document.getElementById("screenSpace");
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
   
   screenSpace.className = "";
   
   if (select == 0) screenSpace.classList.add("feed");
   else if (select == 1) screenSpace.classList.add("library");
   
   document.getElementById("navHead").innerHTML = populateView(data[Number(select)]);
   switchPage(data[Number(select)].options[0], null);
}

const populateView = data => {
   console.log("doing bad");
   
   return (
      `
      <h1>${data.title}</h1>
      <div id="localNav" class="local-nav">
         ${data.options.map((opt,i) => `<h4 data-select="${opt.toLowerCase()}" class="${(i == 0 ? "active" : "")}">${opt}<div class="active-marker"></div></h4>`).join('')}
      </div>
      `
   )
}

const populateMain = select => {
   
   const feedElem = document.getElementById("feedElem");
   let orderedArr;
   
   if (select == "recent") {
      //take the array of song id's from userData and get the entries in songs that match the id
      const recentSongs = userData.recents.map(rec => (songs.filter(song => song.id == rec))).flat();
      console.log([...songs]);
      console.log(recentSongs);
      
      orderedArr = recentSongs;
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
   
   feedElem.innerHTML = generateFeed(orderedArr, select);
   feedElem.animate([
      // keyframes
      { transform: 'scale(0.9)',
      opacity: 0 }, 
      { transform: 'scale(1)',
      opacity: 1 }
    ], { 
      // timing options
      duration: 300,
      easing: "cubic-bezier(0.215, 0.61, 0.355, 1)"
    });
   
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

const populatePlayer = data => {
   console.log(data);
   
   document.getElementById("playerInfo").innerHTML =`
   <div class="topbar">
      <button id="collBtn" class="button icon"><img src="img/icons/collapse.svg"></button>
      <div class="song-info">
         <h2>${data.artist.title}</h2>
         <h1>${data.title}</h1>
      </div>
   </div>
   <div class="song-art">
      <img class="artwork" src="img/art/${data.artwork}.jpg">
      <button class="button icon special variate-btn"><img src="img/icons/variate.svg"></button>
   </div>

   <div class="variation">
      <div class="variate-info">
         <h3>Excited-Tulip</h3>
         <h4>Variation</h4>
      </div>
      <div class="variate-cells">
         <div class="variate-cell"></div>
         <div class="variate-cell"></div>
         <div class="variate-cell"></div>
         <div class="variate-cell"></div>
      </div>
   </div>
   `;
};

const generateFeed = (dataArr, select) => {
   //get artwork slug from release
   console.log(dataArr);
   
   
   dataArr.map(dat => {
      dat.artwork = releases.filter(rel => rel.id == dat.group.id)[0].slug;
   });
   
   
   return (
      `
      <section class="quick-action">
         <button class="button icon special">
            <img src="img/icons/shuffle.svg">
         </button>
         <h2>Shuffle ${select}</h2>
      </section>
      
      <section class="content-entries">
         ${dataArr.map(dat => `
         <div class="media-entry-large" data-id="${dat.id}">
            <img src="img/art/${dat.artwork}.jpg">
            <div>
               <h5>${dat.artist.title}</h5>
               <h4 class="secondary">${dat.title}</h4>
            </div>
         </div>`
         ).join('')}
      </section>
      `
   )
}

const generateLibrary = dataArr => {
   console.log(dataArr);
   
   return (
      `<div>${dataArr.map(dat => `<h3>${dat.name}</h3>`).join('')}</div>`
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