# Installing Dependencies
PRISA requires Python 3.5+
PRIS is dependant on Windows systems and Nvidia GPUs.

Install the following Python packages with CMD:
   - OpenCV 4: `pip install opencv-python`
   - OpenCV 4 contributions: `pip install opencv-contrib-python`
   - SQL Alchemy: `pip install Flask-SQLAlchemy`
   - CMake: `pip install cmake`
   - dlib: `pip install dlib`
   - imutils: `pip install imutils`
   - Requests: `pip install requests`
   - sklearn: `pip install sklearn`
   - Face Recognition: `pip install face_recognition`

`npm install` Node dependencies into the project folder.
   
From the PRIS folder (Google Drive), drag over the following folders from `src/lib` into the prisproject-2019 `resources/PRIS` folder:
* 3rdparty
* bin
* database
* include
* lib
* models
* TEMP

# Running PRIS
1. Navigate to `\pris-project2019\resources\PRIS` in CMD
2. Enter `python PersonIdentification.py`

# Running the Server (PRISA)
PRISA currently runs on a local host.

1. Change directory to `\pris-project2019` in NodeJS CMD
2. Enter `node main`
