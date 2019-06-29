echo off
cd models
python reset_faces.py
cd ..
cd database
del /f Person.db
cd ..
cd images
rmdir /S /Q profile_pics
mkdir profile_pics
cd ..