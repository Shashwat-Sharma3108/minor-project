const navigation = document.querySelector(".navigation");
const loginContainer = document.querySelector(".loginContainer");
const contact = document.querySelector("#contacts");
const loginForm = document.querySelector(".loginForm");

const t1 = new TimelineMax();

t1.fromTo
( navigation , 
    1,
    {opacity : "0"},
    {opacity : "1" ,ease : Power2.easeInOut},
    "-=1"    
)
.fromTo(
    loginContainer,
    1.2,
    {x:"-100%"},
    {x : "0%" , ease : Power2.easeInOut}
)
.fromTo(
    loginForm,
    1,
    {x:"200%" , opacity : "0"},
    {x: "0%", opacity:"1", ease : Power2.easeInOut}
);