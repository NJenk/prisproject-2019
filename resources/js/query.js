/**
*	@file query.js
*	@desc This file contains the frontend code that manages the query page
*	@author Rei Radford
*	@author Mikayla King
*	@author Nick Julien
*	@author Paul Brackett
*	@see query
*/
/**
*	@namespace query
*/
//ROR
$(function() {
		var // Define maximum number of files.
				max_file_number = 1,
				// Define your form id or class or just tag.
				$form = $('#form-submit'),
				// Define your upload field class or id or tag.
				$file_upload = $('#upload', $form),
				// Define your submit class or id or tag.
				$button = $('.submit', $form);

		/**
		*	Get the file upload form contents, send them asynchronously to the API query endpoint, and handle the data on return. NOTE: This is an anonymous function
		*	@function sendFilesAsync
		*	@async
		*	@memberof query
		*	@author Nick Julien
		*	@author Paul Brackett
		*	@param {object} e - Javascript event parameter
		*/
		$form.submit((e)=>{
				e.preventDefault();
				var data = new FormData($form[0]);
				var xhr = new XMLHttpRequest();
				xhr.open('POST','/submit-query',true);
				xhr.send(data);

				//Paul Brackett
				xhr.onload = ()=>{
						var PRISdata = JSON.parse(xhr.responseText);

						displayUploadedImage(PRISdata);

						//If the results exist, go ahead and add them to the page.
						if(PRISdata["1"].results[0].label !== undefined)
						{
								addResult(PRISdata["1"].results[0], 0);
						}
						if(PRISdata["1"].results[1].label !== undefined)
						{
								addResult(PRISdata["1"].results[1], 1);
						}
						if(PRISdata["1"].results[2].label !== undefined)
						{
								addResult(PRISdata["1"].results[2], 2);
						}

						showElements();
			}

});



		//ROR
		// Disable submit button on page ready.
		$button.prop('disabled', 'disabled');

		//ROR
		/**
		*	Prevent the user from selecting more than the maximum number of files at once. NOTE: This is an anonymous function
		*	@function constrainFileNumber
		*	@memberof query
		*	@author Rei Radford
		*/
		$file_upload.on('change', function () {
				var number_of_images = $(this)[0].files.length;
				if (number_of_images > max_file_number) {
						alert(`You can upload maximum ${max_file_number} files.`);
						$(this).val('');
						$button.prop('disabled', 'disabled');
				} else {
						$button.prop('disabled', false);
				}
				$('.custom-file-label').html($(this)[0].files[0].name);
		});
});

//Paul Brackett
/**
*	Manipulate the DOM to display a result
*	@memberof query
* @author Paul Brackett
* @param {object} result - Result similarity JSON data from PRIS
*	@param {number} result_num - Sequential index of the result
*/
function addResult(result, result_num){
		//Function does a ton of DOM manip.
		//Selects a couple elements that were id-hardcoded 0 to 2.
		var outer_div = document.querySelector('#imageHolder'+result_num);
		var image_element = document.createElement("img");
		var p_similar = document.querySelector('#psimilar_'+result_num);
		var check_box = document.querySelector('#similar_'+result_num);

		image_element.classList.add('results_image');
		image_element.src = 'public\\profile_pics\\' + result.label + ".jpg";

		outer_div.appendChild(image_element);

		check_box.setAttribute('value', result.label);
		check_box.classList.remove('hidden');

		p_similar.innerHTML = "Similarity: " + Math.round(result.percent) + "%";
};

//Paul Brackett
/**
*	Unhide profile association form elements in the DOM
*	@memberof query
* @author Paul Brackett
*/
function showElements(){
		var submit_button = document.querySelector('#similar_submit');
		var results_container = document.querySelector('#results_container');
		var upload_text = document.querySelector('#upload_text');

		submit_button.classList.remove('hidden');
		results_container.classList.remove('hidden');
		upload_text.classList.remove('hidden');
};

//Paul Brackett
/**
*	Manipulate the DOM to display the cropped person from the user's uploaded image
*	@memberof query
* @author Paul Brackett
* @param {object} pris_data - JSON object returned from querying PRIS
*/
function displayUploadedImage(pris_data){
		var image_original_div = document.querySelector('#imageUploaded');
		var image_element = document.createElement("img");

		image_element.src = 'public\\query_data\\' + pris_data["1"].image;
		image_element.classList.add('results_image');

		image_original_div.appendChild(image_element);
};
