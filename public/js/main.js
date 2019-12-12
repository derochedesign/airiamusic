let songs;
let artists;
let releases;

document.addEventListener("DOMContentLoaded", _ => {
    
   //get data
   $.getJSON('../data/all-music.json', function(result) { 
          songs = result.songs;
          artists = result.artists;
          releases = result.releases;
   });
   
});

//all click events
document.addEventListener("click", e => {
   
   //if matches
   if (e.target.matches("#collBtn")) {
      document.getElementById("fullPlayer").classList.remove("active");
   }
   if (e.target.matches("#miniPlayer")) {
      document.getElementById("fullPlayer").classList.add("active");
   }
   if (e.target.parentNode.matches(".local-nav")) {
      populateFeed(Number(e.target.dataset.select));
      [...e.target.parentNode.children].map(elem => elem.classList.remove("active") );
      e.target.classList.add("active");
   }
   
});

const populateFeed = select => {
   const feedElem = document.getElementById("feedElem");
   let orderedArr;
   
   if (select == 0) {
      //recent (needs a user data set to index)
      //at users recently played in their data set and show it
      orderedArr = [...songs];
   }
   else if (select == 1) {
      //new (from users followed artists)
      //get list of artists -> sort through all their releases -> sort x newest by date
      orderedArr = songs.slice().sort((a, b) => (new Date(b.releaseDate) - new Date(a.releaseDate)) );
   }
   else if (select == 2) {
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