document.getElementById("collBtn").addEventListener("click", () => {
   document.getElementById("fullPlayer").classList.remove("active"); 
});
document.getElementById("miniPlayer").addEventListener("click", () => {
    document.getElementById("fullPlayer").classList.add("active"); 
 });