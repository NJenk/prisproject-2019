"""
Programmed by: Jared Hall
Discription: This is the database models file for the server database.
All of the SQL-Alchemy classes are in here.
"""
from flask_sqlalchemy import SQLAlchemy
database = SQLAlchemy()

class Profiles(database.Model):
	id = database.Column(database.String(12), primary_key=True, unique=True, nullable=False)
	point = database.Column(database.Text)
	hair = database.Column(database.String(200))
	face = database.Column(database.String(200))
	skin = database.Column(database.String(200))
	skeleton = database.Column(database.String(200))
	height = database.Column(database.String(200))
	width = database.Column(database.String(200))

class MultiLinearMap(database.Model):
	centroid = database.Column(database.Text, primary_key=True, unique=True, nullable=False)
	label = database.Column(database.String(12))
