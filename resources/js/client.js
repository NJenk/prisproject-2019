window.setInterval(function(){
    getProgress();
  }, 500);

//Creates a hopefully unique id for every user.
if(!document.cookie)
{
    var id = (Date.now().toString()).substring(6) + (Math.floor(Math.random() * 10)).toString() + (Math.floor(Math.random() * 10)).toString() + (Math.floor(Math.random() * 10)).toString();;
    document.cookie = "id= "+ id+"; path=/";
}

function getProgress()
{
    fetch('/getprogress').then(function(response) {
            return response.json();
        })
        .then( function(data) {
                var prog_object = data.prog;
                var outer_div = document.querySelector('#pbar');

                //Need to make sure this is a page with progress bar
                if(outer_div) {
                    //Get progress based on our cookie.
                    var user_id = document.cookie.substring(3, document.cookie.length);
                    var our_progress = prog_object[user_id];
                    
                    if(our_progress) {
                        our_progress.forEach( function(upload) {

                            var existing_progress_bar = document.querySelector('#pb'+upload.temp_name);

                            //For each progress in this array, make a progress bar.
                            //If the progress bar doesn't exist, create and append it. if it does exist, just update the current progress.
                            if(existing_progress_bar) {

                                //checks to see if the upload is finished processing.
                                if(upload.current_frames+1 === upload.total_frames) { 
                                    var percent_done = 100;
                                }
                                else{
                                    var percent_done = Math.ceil((upload.current_frames/upload.total_frames) * 100);
                                }
                            
                                setStyle(existing_progress_bar, percent_done, user_id, upload, outer_div);
                            }
                            else {
                                var inner_div = document.createElement("div");
                                inner_div.id = "innerpb"+upload.temp_name;
                                inner_div.classList.add('progress');

                                var prog_bar = createProgressBar(upload);
                                inner_div.appendChild(prog_bar);

                                if(upload.total_frames === 1) {
                                    var new_alert = createAlert(user_id, upload.temp_name);
                                    new_alert.appendChild(inner_div);
                                    outer_div.appendChild(new_alert);
                                }
                                else {
                                    outer_div.appendChild(inner_div);
                                }
                            }
                        });
                    }
            }
        });
}

function createProgressBar(upload)
{
    var prog_bar = document.createElement("div")

    prog_bar.classList.add('progress-bar');
    prog_bar.classList.add('progress-bar-striped');
    prog_bar.classList.add('progress-bar-animated');
    prog_bar.setAttribute('role', 'progressbar');
    prog_bar.setAttribute('aria-valuenow', '10');
    prog_bar.setAttribute('aria-valuemin', '0');
    prog_bar.setAttribute('aria-valuemax', '100');

    prog_bar.id = "pb"+upload.temp_name;
    prog_bar.style = "width: 0%";
    prog_bar.innerHTML = upload.original_name;

    return prog_bar;
}

function createAlert(user_id, temp_name)
{
    var alert_base_div = document.createElement('div');
    alert_base_div.classList.add("alert");
    alert_base_div.classList.add("alert-dismissible");
    alert_base_div.classList.add("bg-secondary");

    var alert_close_button = document.createElement('button');
    alert_close_button.setAttribute('type', 'button');
    alert_close_button.classList.add("close");
    alert_close_button.setAttribute('data-dismiss', 'alert');
    alert_close_button.innerHTML = '×';

    //Append an onclick function that callls ajax for removing the clicked file from uploads.
    alert_close_button.addEventListener('click', function(e){
        fetch('/removeupload', {method: 'post', headers: {'content-type': 'application/json'}, body: JSON.stringify({'user_id': user_id, 'temp_name': temp_name})});
    })

    alert_base_div.appendChild(alert_close_button);

    return alert_base_div;
}

function setStyle(progress_bar_element, percent_done, user_id, upload, outer_div)
{
    progress_bar_element.style = "width: "+percent_done+"%";
    if(percent_done < 2){
        progress_bar_element.classList.add('progress-bar');
       
    }
    else if(percent_done < 33){
        progress_bar_element.classList.add('progress-bar-1');
    }
    else if(percent_done >= 33 && percent_done < 67){
        progress_bar_element.classList.remove('progress-bar-1');
        progress_bar_element.classList.add('progress-bar-33');
    }
    else if(percent_done >= 67 && percent_done < 99){
        progress_bar_element.classList.remove('progress-bar-33');
        progress_bar_element.classList.add('progress-bar-67');
    }
    else if(percent_done >= 99){
        progress_bar_element.classList.remove('progress-bar-67');
        progress_bar_element.classList.add('progress-bar');  

        if(upload.total_frames !== 1 && !progress_bar_element.classList.contains('done'))
        {
            progress_bar_element.classList.add('done');
            
            var existing_div = progress_bar_element.parentElement;
            var new_alert = createAlert(user_id, upload.temp_name);    
            new_alert.appendChild(existing_div);
            outer_div.prepend(new_alert);  
        }
    }
}