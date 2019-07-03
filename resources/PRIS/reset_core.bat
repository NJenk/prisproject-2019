echo off
cd models
python reset_faces.py
cd ..
cd database
del /f Person.db
cd ..
cd ..
cd images
cd profile_pics
del *.jpg
cd ..
cd ..
cd PRIS