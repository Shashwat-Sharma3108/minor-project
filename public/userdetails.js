
 function patch(){

    let cookie = document.cookie;
    cookie=cookie.split(";");

    cookie=cookie[1].split("=");
    cookie = cookie[1];
    

    const url = "/userdetails";
    const userData = document.getElementsByClassName("form-control");

    var xhr = new XMLHttpRequest();
    xhr.open("PATCH", url, true);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.withCredentials = true;

    
    
    var data = {
        username : userData[0].value,
        firstName : userData[1].value,
        lastName :userData[2].value,
        email :userData[3].value,
        contact:userData[4].value,
        address:userData[5].value
    }
    
    xhr.send(JSON.stringify(data));
 }