##### INSTALLATION #####
1. Install python 3.5+
2. upgrade pip: pip install -upgrade pip
3. Install the following packages:
	i. OpenCV 4: pip install opencv-python
	ii. OpenCV 4 contributions: pip install opencv-contrib-python
	ii. NumPy: pip install numpy
	iii. Flask: pip install Flask
	iv. SQL Alchemy: pip install Flask-SQLAlchemy
	v. CMake: pip install cmake
	vi. dlib: pip install dlib
	vii. Requests: pip install requests


##### RUN THE CODE #####
1. cd into src/lib and open a cmd
2. start the person ID module: python PersonIdentification.py
3. edit line 56 in core.py to include the filename of the video you wish to test.
4. start the core: python core.py

##### change video #####
To change the video:
1. press control+c to stop the core.
2.  edit line 56 in core.py to include the filename of the video you wish to test.
3. start the core: python core.py

##### Restart core with fresh resources #####
1. cd to src/lib/database then delete Person.db
2. cd to src/lib/models then double click reset_faces.py
3. follow the section on running the code above to restart the core.
