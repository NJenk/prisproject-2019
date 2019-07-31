/**
* @file client.js
* @desc Front-end code to manage the spawning, updating, and deleting of progress bars
* @author Paul Brackett
* @see client
*/

/**
* @namespace client
*/

window.setInterval(function() {
    getProgress();
  }, 500);

//Creates a hopefully unique id for every user. The id is 6 digits from the current time and 3 random digits appended to that.
if(!document.cookie) {
    var id = Date.now().toString().substring(6)
    id += Math.floor(Math.random() * 10).toString() + Math.floor(Math.random() * 10).toString() + Math.floor(Math.random() * 10).toString();

    document.cookie = "id= "+ id+"; path=/";
}

/** Parse the asynchronously fetched global progress object and spawn progress bars
 * @author Paul Brackett
 * @async
 * @memberof client
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

/**
 * Generate a new progress bar div for a specific file
 * @memberof client
 * @param {Object} upload - Progress data object for a specific video
 * @param {string} upload.temp_name - Current name of the video
 * @param {string} upload.original_name - User's original filename for the video or image
 * @return {Object} DOM div element of a bootstrap progress bar
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

/**
 * Create an alert div and hook its close button to a function that asynchronously removes a file from the global progress object
 * @memberof client
 * @param {string} user_id - Unique identifier for the current user
 * @param {string} temp_name - Current name of the file the button will remove from the progress object
 * @return {Object} DOM div element of a bootstrap alert box
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

/**
 * Set a class on a given progress bar based on its completion percentage
 * @memberof client
 * @param {Object} progress_bar_element - DOM object of a bootstrap progress bar
 * @param {number} percent_done - Percent completion of the given progress bar
 * @param {string} user_id - Unique identifier for the current user
 * @param {Object} upload - Progress data object for the video linked to this progress bar
 * @param {Object} outer_div - DOM object of the parent div of the given progress bar
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

/**
 * Add a close button to a DOM element
 * @memberof client
 * @param {object} progress_bar_element - DOM element to recieve a close button
 * @param {object} outer_div - DOM object for the parent div of the given object
 * @param {string} user_id - Unique identifier for the current user
 * @param {string} temp_name - Current name of the file represented by the given progress bar element
 */
function addCloseButton(progress_bar_element, outer_div, user_id, temp_name) {
    progress_bar_element.classList.add('done');

    var existing_div = progress_bar_element.parentElement;
    var new_alert = createAlert(user_id, temp_name);
    new_alert.appendChild(existing_div);
    outer_div.prepend(new_alert);
}
