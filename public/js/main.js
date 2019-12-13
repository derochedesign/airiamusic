let songs;
let artists;
let releases;
let audioPlayback;

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
   document.getElementById("miniPlayer").innerHTML = generateMini(songs.filter(song => song.id == 101)[0]);
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
   
   console.log(e.target);
   
});

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
   document.getElementById("miniPlayer").innerHTML = generateMini(set);
   //set audio source
   document.getElementById("audioPlayer").setAttribute("src", `audio/${set.artist.slug}/${set.group.slug}/${id}.mp3`);
   //play audio
   document.getElementById("audioPlayer").play();
   audioPlayback = setInterval(() => {animDuration(document.getElementById("audioPlayer"))}, 200);
}

const animDuration = audElm => {
   
   const duraBar = document.getElementById("durationBar");
   console.log(duraBar.style.width);
   console.log(`${audElm.currentTime / audElm.duration}%`);
   
   if (audElm.currentTime / audElm.duration) {
      duraBar.style.width = `${(audElm.currentTime / audElm.duration)*100}%`;
   }
   
}

const switchView = select => {
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
   
   console.log(data);
   
   return (`
      <div class="song-snapshot" style="background-image: url(../img/art/${data.artwork}.jpg)"></div>
      <div class="song-info">
         <h5>${data.artist.title}</h5>
         <h4 class="secondary">${data.title}</h4>
      </div>
      <div class="song-controls">
         <button class="icon"><img src="img/icons/prev.svg"></button>
         <button class="icon"><img src="img/icons/next.svg"></button>
         <button class="icon"><img src="img/icons/pause.svg"></button>
      </div>
      <div id="durationBar" class="duration-bar"></div>
   `)
}