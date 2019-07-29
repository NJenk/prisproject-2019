window.setInterval(function() {
    getProgress();
  }, 500);

//Creates a hopefully unique id for every user. The id is 6 digits from the current time and 3 random digits appended to that.
if(!document.cookie) {
    var id = Date.now().toString().substring(6)
    id += Math.floor(Math.random() * 10).toString() + Math.floor(Math.random() * 10).toString() + Math.floor(Math.random() * 10).toString();

    document.cookie = "id= "+ id+"; path=/";
}

/* gets the global progress object and parses through it, creating and displaying progress bars as needed.
 * Inputs:   None
 * Outputs:  None
 */
function getProgress() {
    fetch('/getprogress').then(function(response) {
            return response.json();
        })
        .then( function(data) {
                var prog_object = data.prog;
                var outer_div = document.querySelector('#pbar');

                //Our progress bars follow this structure: outerDiv-->alertDivs-->innerDiv-->progressBar
                //Make sure this is a page with progress bar capabilities...
                if(outer_div) {

                    //Get progress based on our cookie.
                    var user_id = document.cookie.substring(3, document.cookie.length);
                    var our_progress = prog_object[user_id];
                    
                    if(our_progress) {
                        our_progress.forEach( function(upload) {

                            //get the progress bar for this specific file.
                            var existing_progress_bar = document.querySelector('#pb'+upload.temp_name);

                            //For each upload in our_progress, either create a new progress bar or update an old one
                            if(existing_progress_bar) {

                                //If the file is finished processing, set percent_done to 100
                                if(upload.current_frames+1 === upload.total_frames) { 
                                    var percent_done = 100;
                                }
                                else{
                                    percent_done = Math.ceil((upload.current_frames/upload.total_frames) * 100);
                                }
                            
                                //Styles the progress bar based on percent_done.
                                setStyle(existing_progress_bar, percent_done, user_id, upload, outer_div);
                            }
                            else {
                                //Get the inner div so we can append the progress bar to it, and it to the alert div.
                                var inner_div = document.createElement("div");
                                inner_div.id = "innerpb"+upload.temp_name;
                                inner_div.classList.add('progress');

                                var prog_bar = createProgressBar(upload);
                                inner_div.appendChild(prog_bar);

                                //If the new bar to be displayed is for an image, draw it immediately with the alert/close button.
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

/* Creates a progress bar div that displays progress uof uploaded file.
 * Inputs:  upload: The data object for the upload file
 * Outputs: A progress bar element that can be appended to another div. 
 */
function createProgressBar(upload) {
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

/* Creates an alert div that a progress bar can be appended to and hooks the button to an ajax call that removes the file from uploads.
 * Inputs:   user_id:              The current users id.
 *           temp_name:            The temp name of the file the progress bar element is tracking.
 * Outputs:  An alert element that can then have a progress bar appended to it. 
 */
function createAlert(user_id, temp_name) {
    //Creates all the alert divs we need for a proper bootstrap alert.
    var alert_base_div = document.createElement('div');
    alert_base_div.classList.add("alert");
    alert_base_div.classList.add("alert-dismissible");
    alert_base_div.classList.add("bg-secondary");

    //Creates a close button.
    var alert_close_button = document.createElement('button');
    alert_close_button.setAttribute('type', 'button');
    alert_close_button.classList.add("close");
    alert_close_button.setAttribute('data-dismiss', 'alert');
    alert_close_button.innerHTML = '×';

    //Append an onclick function that calls ajax for removing the clicked file from uploads.
    alert_close_button.addEventListener('click', function(e){
        fetch('/removeupload', {method: 'post', headers: {'content-type': 'application/json'}, body: JSON.stringify({'user_id': user_id, 'temp_name': temp_name})});
    })

    alert_base_div.appendChild(alert_close_button);

    return alert_base_div;
}

/* Sets the specified progress bars style class based on percent_done
 * Inputs:  progress_bar_element: The element to receive the close button
 *          percent_done:         The current level of progresss for this file.
 *          user_id:              The current users id.
 *          upload:               The data object for the upload file
 *          outer_div:            The outer div all other progress bar elements are appended to.
 * Outputs: None 
 */
function setStyle(progress_bar_element, percent_done, user_id, upload, outer_div) {
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
            addCloseButton(progress_bar_element, outer_div, user_id, upload.temp_name);
        }
    }
}

/* Adds a close button to the provided progress bar element. This is used for elements that don't originally have close buttons.
 * Inputs:  progress_bar_element: The element to receive the close button
 *          outer_div:            The outer div to append the progress bar to after button is added.
 *          user_id:              The current users id.
 *          temp_name:            The temp name of the file the progress bar element is tracking.
 * Outputs: None 
 */
function addCloseButton(progress_bar_element, outer_div, user_id, temp_name) {
    progress_bar_element.classList.add('done');
            
    var existing_div = progress_bar_element.parentElement;
    var new_alert = createAlert(user_id, temp_name);    
    new_alert.appendChild(existing_div);
    outer_div.prepend(new_alert);  
}