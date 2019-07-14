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
//I can't check the code, but incase the top doesn't work I think this bottom code will.
//I just don't know where exactly we are storing the images. That location needs to be added instead of the placeholders
//The bottom code is another possible way to do it and it should produce something like a table for the POIs
//We can change the names to the poi id number or whatever, but I think we could make a table to display the images

//function createNode(element) {
 //   return document.createElement(element);
//}

//function append(parent, el) {
//  return parent.appendChild(el);
//}

//const ul = document.getElementById('poi');
//const url = 'https://randomuser.me/api/?results=10';
//fetch(url) 
//.then((resp) => resp.json()) //transform the data into json
//.then(function(data) { //create and apend the li's to the ul
//  let poi = data.results;
//  return poi.map(function(author) {
//    let li = createNode('li'),
//       img = createNode('img'),
//       span = createNode('span');
//    img.src = apoi.picture.medium;
//    span.innerHTML = `${poi.name.first} ${poi.name.last}`;
//    append(li, img);
//    append(li, span);
//    append(ul, li);
//  })
//})
//.catch(function(error) {
//  console.log(error);
//});   
