echo off
cd models
python reset_faces.py
cd ..
cd database
del /f Person.db
cd ..