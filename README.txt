# Installation
1. Install Python 3.5+
2. Upgrade pip: `pip install -upgrade pip`
3. Install the following packages:
   - OpenCV 4: `pip install opencv-python`
   - OpenCV 4 contributions: `pip install opencv-contrib-python`
   - NumPy: `pip install numpy`
   - Flask: `pip install Flask`
   - SQL Alchemy: `pip install Flask-SQLAlchemy`
   - CMake: `pip install cmake`
   - dlib: `pip install dlib`
   - Requests: `pip install requests`


# Running the Code
1. `cd` into `src/lib` and open CMD.
2. Start the person ID module: `python PersonIdentification.py`
3. Edit line 56 in `core.py` to include the filename of the video you wish to test.
4. Start the core in CMD: `python core.py`

# Changing the Video
To change the video:
1. Press CTRL+C to stop the core.
2. Edit line 56 in `core.py` to include the filename of the video you wish to test.
3. Start the core in CMD: `python core.py`

# Restarting the Core with Fresh Resources
1. Locate `src/lib/database` in File Explorer then delete `Person.db`
2. Locate `src/lib/models` in File Explorer then double-click `reset_faces.py`
3. Follow the steps in **Running the Code** above to restart the core.
