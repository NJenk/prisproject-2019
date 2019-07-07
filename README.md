# Installing Dependencies
PRISA requires Python 3.5+

Install the following packages with CMD:
   - OpenCV 4: `pip install opencv-python`
   - OpenCV 4 contributions: `pip install opencv-contrib-python`
   - SQL Alchemy: `pip install Flask-SQLAlchemy`
   - CMake: `pip install cmake`
   - dlib: `pip install dlib`
   - imutils: `pip install imutils`
      * Windows dependency
   - Requests: `pip install requests`
   - Face Recognition: `pip install face_recognition`
   
From the PRIS folder (Google Drive), drag over the following folders from `src/ib` into the prisproject `resources/PRIS` folder:
* 3rdparty
* bin
* database
* include
* lib
* models
* TEMP

# Running the Server
PRISA currently runs on a local host.

1. Change directory to `pris-project2019` in NodeJS CMD
2. Type `node main.js` and press **Enter**
