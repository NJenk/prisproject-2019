function LoadImg(filename) {
    var xmlhttp;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else { // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {     
            document.getElementById("documentHolder").src = "data:image/png;base64," + xmlhttp.responseText;
        }
    };    
    xmlhttp.open("GET", 'load.php?LoadImg='+filename );
    xmlhttp.send(null);
}
//I haven't been able to test this but I believe it'll work if they have the id number assigned to the profile
