const outdoorbtn = document.getElementById("outdoor");
const potsbtn = document.getElementById("pots");
const fertiliserbtn = document.getElementById("fertiliser");
const indoorbtn = document.getElementById("indoor");
const otherbtn = document.getElementById("others");

function indoor(){
    indoorbtn.classList.toggle("nonvisible");

}

function outdoor(){
    outdoorbtn.classList.toggle("nonvisible");
}

function pots(){
    potsbtn.classList.toggle("nonvisible");
}   

function fertiliser(){
    fertiliserbtn.classList.toggle("nonvisible");
}

function others(){
    otherbtn.classList.toggle("nonvisible");
}