function set_background_image(){
    let date = new Date();
    let current_hour = date.getHours() 
    if(current_hour <= 8 || current_hour >= 20){
        var photo = "night.jpg"
    } else if(current_hour <= 10 || current_hour > 17){
        var photo = "change.jpg"
    } else {
        var photo = "day.jpg"
    }
    let btn = document.getElementById("loadBtn")
    if(btn){
        btn.remove()
    }
    if(!document.getElementById("backgroundId")){
        document.body.style.backgroundImage = `url('/res/${photo}')`; 
        let desc = document.createElement("p")
        desc.id = "backgroundId"
        desc.innerHTML = "Background images in the public domain, painted by <a href=\"https://artvee.com/artist/ivan-konstantinovich-aivazovsky/\">Ivan Konstantinovich Aivazovsky.</a>"
        footer.appendChild(desc)
    }
}
let el = document.createElement("a")
el.id = "loadBtn"
el.innerText = "load background"
el.onclick = set_background_image
let footer = document.getElementsByTagName("footer")[0]
footer.appendChild(el)

