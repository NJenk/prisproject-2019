console.log("yeah we have js");

window.setInterval(function(){
    doajax();
  }, 1000);

function doajax()
{
    console.log('were going to getprogress');

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/getprogress');
    xhr.onload = function() {
        var currProg = JSON.parse(xhr.response).prog.trim();
        console.log(currProg+"%");
        if (xhr.status === 200) {
            document.querySelector('#pb').style.width = currProg+"%";
        }
        else {
            alert('Request failed.  Returned status of ' + xhr.status);
        }
    };
    xhr.send();
}