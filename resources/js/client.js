window.setInterval(function(){
    getProgress();
  }, 1000);

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
                if(outer_div)
                {
                    //Get progress based on our cookie.
                    var user_id = document.cookie.substring(3, document.cookie.length);
                    var our_progress = prog_object[user_id];

                    //For all the data in the data object, we need to parse a bunch of stuff out and do a bunch of DOM manip.
                    if(our_progress)
                    {
                        our_progress.forEach( function(upload) {
                            var inner_div = document.createElement("div");
                            inner_div.id = "innerpb"+upload.temp_name;
                            inner_div.classList.add('progress');

                            var existing_progress_bar = document.querySelector('#pb'+upload.temp_name)

                            if(upload.current_frames+1 === upload.total_frames)
                            {
                                if(existing_progress_bar)
                                {
                                    existing_progress_bar.style = "width: 100%";
                                }
                                
                                return;
                            }

                            //For each progress in this array, make a progress bar.
                            //If the progress bar doesn't exist, create and append it. if it does exist, just update the current progress.
                            if(existing_progress_bar)
                            {
                                //it did exist, so just update it.
                                var percent_done = Math.ceil(((upload.current_frames/upload.total_frames) * 100)+1);
                                existing_progress_bar.style = "width: "+percent_done+"%";
                            }
                            else
                            {

                                var new_alert = createAlert(upload.original_name);

                                var prog_bar = createProgressBar(upload);
                                inner_div.appendChild(prog_bar);
                                new_alert.appendChild(inner_div);
                                outer_div.appendChild(new_alert);
                                console.log("Should be appended...");
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

function createAlert(fileName)
{
    var alert_base_div = document.createElement('div');
    alert_base_div.classList.add("alert");
    alert_base_div.classList.add("alert-dismissible");
    alert_base_div.classList.add("bg-secondary");

    var alert_heading = document.createElement('h4');
    alert_heading.classList.add('alert-heading');
    alert_heading.innerHTML = fileName;

    var alert_close_button = document.createElement('button');
    alert_close_button.setAttribute('type', 'button');
    alert_close_button.classList.add("close");
    alert_close_button.setAttribute('data-dismiss', 'alert');
    alert_close_button.innerHTML = '×';
    //Append an onclick function that sets 

    alert_base_div.appendChild(alert_close_button);
    alert_base_div.appendChild(alert_heading);

    console.log("There should be an alert here lul");
    return alert_base_div;
}