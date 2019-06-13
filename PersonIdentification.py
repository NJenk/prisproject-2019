import os, sys, traceback
from flask import Flask, request, session, url_for, abort, json
from database.tables import *
from sqlalchemy import and_, or_, func,exists
import numpy as np
import random, string
import operator
#creates a WSGI complient flask web app
application = Flask(__name__)

#----------------------------------DATABASE DEFINITION--------------------------
#Database configuration
application.config.from_object(__name__)
application.config.update(dict(
	SQLALCHEMY_DATABASE_URI='sqlite:///'+os.path.join(application.root_path + '/database', "Person.db"),
	SQLALCHEMY_TRACK_MODIFICATIONS=False,
	SECRET_KEY="a722c63db8ec8625af6cf71cb8c2d939"))

#setup the database
database.init_app(application)
application.app_context().push()
database.create_all()

FEATURE_TOLORANCE = [30, 20, 170, 815, 420, 170] #[hair, face, skin, skeleton, height, width]
PROFILE_TOLORANCE = 2
FEATURE_WEIGHTS = [1, 1, 1, 1, 1, 1]
#-------------------------------------------------------------------------------

#-----------------------------------WEB DEFINITION------------------------------
@application.route("/add", methods=["POST"])
def add():
	#Add a new person to the database
	#Format: {"Feature Matrix" : [["<feature data ints>", ...], ...]}
	response = False
	data = json.loads(request.data)
	
	#format data
	for i in range(len(data)):
		for j in range(len(data[i])):
			data[i][j] = int(data[i][j])
	
	#Generate a alpha-numeric label for the person
	start = ''.join(random.choices(string.ascii_letters, k=3))
	end = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
	label = start+'-'+end
	
	print(label, data)
	#Multi-Linear Transform
	"""
	# Use Goedel’s transform on matrix to build a ML-point
	pnt = np.array([Decimal("."+''.join(feature)) for freature in data["Feature Matrix"]])
	"""
	#add to database if it doesn't already exists
	if(Profiles.query.filter_by(point=json.dumps(data)).first() is None):
		person = Profiles(id=label, point=json.dumps(data), hair=json.dumps(data[0]), face=json.dumps(data[1]), skin=json.dumps(data[2]), skeleton=json.dumps(data[3]), height=json.dumps(data[4]), width=json.dumps(data[5]))
		map_entry = MultiLinearMap(label=label, centroid=json.dumps(data))
		database.session.add(person)
		database.session.add(map_entry)
		database.session.commit()
		return json.dumps(label)
	else:
		return json.dumps(False)


@application.route("/query", methods=["POST"])
def query():
	#print("in query")
	#retuns the label for a given point
	data = json.loads(request.data)
	labels = []
	
	#format data
	for i in range(len(data)):
		for j in range(len(data[i])):
			data[i][j] = int(data[i][j])
	
	#STEP-01: Get all points in the map
	map = MultiLinearMap.query.all()
	#print("got map")
	
	#STEP-02: Compair given profile to points on the map
	for point in map:
		centroid = json.loads(point.centroid)
		simularity_score = 0 #range: [-6,6]
		#print("Calculating norms.")
		norm = None
		for i in range(len(data)):
			dv = np.array(data[i])
			cv = np.array(centroid[i])
			#print("DV: ", dv)
			#print("CV: ", cv)
			if(len(dv) != len(cv)):
				simularity_score -= 1 * FEATURE_WEIGHTS[i]
				#[hair, skin, face, skeleton, height, width]
				print("Failed on: ", "hair" if(i==0) else "skin" if(i==1) else "face" if(i==2) else "skelly" if(i==3) else "height" if(i==4) else "width")
				break
			else:
				norm = np.linalg.norm(dv - cv)
			print("hair" if(i==0) else "face" if(i==1) else "skin" if(i==2) else "skelly" if(i==3) else "height" if(i==4) else "width", " Norm: ", norm, end=" ")
			#this applies equal weighting to each feature
			if(norm <= FEATURE_TOLORANCE[i]):
				simularity_score += 1 * FEATURE_WEIGHTS[i]
			else:
				print(" Fail! Variance out of tolorance.", end=" ")
			print()
		#STEP-02A: If match then update centroid
		print("Simularity: ", simularity_score)
		print()
		if(np.isclose(simularity_score, len(data), atol=PROFILE_TOLORANCE)):
			labels.append((point.label, simularity_score))
			for i in range(len(data)):
				dv = np.array(data[i])
				cv = np.array(centroid[i])
				centroid[i] =  list((dv+cv)/2)
			#point.centroid = json.dumps(centroid)
			#database.session.commit()
			
			
	#STEP-02B: return the most similar label or return false if no labels found
	if(len(labels) == 0):
		return json.dumps(False)
	else:
		labels.sort(key=operator.itemgetter(1))
		return json.dumps(labels[0])

@application.route("/query_feature", methods=["GET", "POST"])
def query_by_feature():
	#returns the label(s) with a given feature
	pass
	
if(__name__ == '__main__'):
	application.run(host='127.0.0.1', port=8080, debug=False)
	print("Exiting session")
	#this occures when the server has been closed
	database.session.remove()
	

