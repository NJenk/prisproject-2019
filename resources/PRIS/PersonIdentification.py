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

FEATURE_TOLERANCE = [35, 20, 150, 900, 280, 120] #[hair, face, skin, skeleton, height, width]
PROFILE_TOLERANCE = 4
FEATURE_WEIGHTS = [1, 3, 1, 1, 1, 1]
#-------------------------------------------------------------------------------

#-----------------------------------WEB DEFINITION------------------------------
@application.route("/add", methods=["POST"])
def add():
        #Add a new person to the database
        print("="*66)
        #Format: {"Feature Matrix" : [["<feature data ints>", ...], ...]}
        response = False
        data = json.loads(request.data)
        
        #format data
        for i in range(len(data)):
                for j in range(len(data[i])):
                        data[i][j] = float(data[i][j])
        
        #Generate a alpha-numeric label for the person
        start = ''.join(random.choices(string.ascii_letters, k=3))
        end = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
        label = start+'-'+end
        
        print("Added a new person to the database: ", label)
        #Multi-Linear Transform
        
        print("="*66)
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
        print(request.data)
        print("="*66)
        #retuns the label for a given point
        data = json.loads(request.data)
        labels = []
        
        #format data
        for i in range(len(data)):
                for j in range(len(data[i])):
                        data[i][j] = float(data[i][j])
        
        #STEP-01: Get all points in the map
        map = MultiLinearMap.query.all()
        #print("got map")
        
        #STEP-02: Compare given profile to points on the map
        for point in map:
        
                #get the centroid
                centroid = json.loads(point.centroid)
                similarity_score = 0 #range: [-6,6]
                percent_similar = 0
                
                #compare the current point to all centroids
                norm = None
                for i in range(len(data)):
                        dv = np.array(data[i])
                        cv = np.array(centroid[i])
                        
                        if(len(dv) != len(cv)):
                                #If feature vectors are not the same length then exit
                                print("Failed on: ", "hair" if(i==0) else "skin" if(i==1) else "face" if(i==2) else "skelly" if(i==3) else "height" if(i==4) else "width", "Exiting comparison...")
                                break
                        else:
                                #calculate the normative similarity between the two points
                                norm = np.linalg.norm(cv - dv)
                        
                        #Display the norms
                        print("Hair" if(i==0) else "Face" if(i==1) else "Skin" if(i==2) else "Skeleton" if(i==3) else "Length" if(i==4) else "Width", " Norm: ", norm, end=" ")
                        
                        #Check if the norm is within the given tolerance
                        percent_similar += (FEATURE_TOLERANCE[i]/(norm+FEATURE_TOLERANCE[i]))*FEATURE_WEIGHTS[i]
                        if(norm <= FEATURE_TOLERANCE[i]):
                                similarity_score += 1  * FEATURE_WEIGHTS[i]
                                #percent_similar += (1 - (norm/FEATURE_TOLERANCE[i])) * FEATURE_WEIGHTS[i]
                        else:
                                #percent_similar += (1 - (norm/FEATURE_TOLERANCE[i])) * FEATURE_WEIGHTS[i]
                                print(" Fail! Variance out of tolerance.", end=" ")
                        print()
                        
                #Display the label on the console
                print("Label: ", point.label," Similarity: ", similarity_score, "Percent Similar: ", round((percent_similar/sum(FEATURE_WEIGHTS)) * 100), "%")
                print()
                
                #STEP-02A: If match then add to candidates, TODO: - if the current point is better than the centroid then update the centroid
                same_face = np.linalg.norm(np.array(data[1]) - np.array(centroid[1])) == 0
                close = np.isclose(similarity_score, sum(FEATURE_WEIGHTS), atol=PROFILE_TOLERANCE)
                print("CLOSE: ", close, "SAME FACE: ", same_face)
                if(close or same_face):
                        labels.append([point.label, (percent_similar/sum(FEATURE_WEIGHTS)) * 100])
                        for i in [0,2,3,4,5]:
                                dv = np.array(data[i])
                                cv = np.array(centroid[i])
                                norm = np.linalg.norm(cv - dv)
                                if(norm >= FEATURE_TOLERANCE[i]):
                                        centroid[i] =  list((dv+cv)/2)
                        point.centroid = json.dumps(centroid)
                        database.session.commit()
                        
                        
        #STEP-02B: return the most similar label or return false if no labels found
        print("="*66)
        if(len(labels) == 0):
                return json.dumps(False)
        else:
                labels.sort(key=operator.itemgetter(1))
                candidate_match = labels[-1]
                candidate_match[1] = round(candidate_match[1])
                return json.dumps(candidate_match)

@application.route("/query_ranked", methods=["POST"])
def query_ranked():
        print(request.data)
        print("="*66)
        #retuns ranked similarities for the given data vs the database
        data = json.loads(request.data)
        
        returns = []
        
        #format data
        for i in range(len(data)):
                for j in range(len(data[i])):
                        data[i][j] = float(data[i][j])
        
        #STEP-01: Get all points in the map
        map = MultiLinearMap.query.all()
        #print("got map")
        
        #STEP-02: Compare given profile to points on the map
        for point in map:
        
                #get the centroid
                centroid = json.loads(point.centroid)
                percent_similar = 0
                
                #compare the current point to all centroids
                norm = None
                for i in range(len(data)):
                        dv = np.array(data[i])
                        cv = np.array(centroid[i])
                        
                        if(len(dv) != len(cv)):
                                #If feature vectors are not the same length then exit
                                print("Failed on: ", "hair" if(i==0) else "skin" if(i==1) else "face" if(i==2) else "skelly" if(i==3) else "height" if(i==4) else "width", "Exiting comparison...")
                                break
                        else:
                                #calculate the normative similarity between the two points
                                norm = np.linalg.norm(cv - dv)
                        
                        #Display the norms
                        print("Hair" if(i==0) else "Face" if(i==1) else "Skin" if(i==2) else "Skeleton" if(i==3) else "Length" if(i==4) else "Width", " Norm: ", norm)
                        
                        #Add the percentage similarity for the feature, with a norm of 0 returning the feature weight, a norm of tolerance returning half the feature weight, and going towards 0 as the norms get higher
                        percent_similar += (FEATURE_TOLERANCE[i]/(norm+FEATURE_TOLERANCE[i]))*FEATURE_WEIGHTS[i]
                print("Label: ", point.label,"Percent Similar: ", round((percent_similar/sum(FEATURE_WEIGHTS)) * 100), "%")
                #STEP-02A: Add the comparison data to the returns list
                same_face = np.linalg.norm(np.array(data[1]) - np.array(centroid[1])) == 0
                returns.append({'label' : point.label, 'percent' : (percent_similar/sum(FEATURE_WEIGHTS)) * 100})
                        
                        
        #STEP-02B: return the most similar label or return false if no labels found
        print("="*66)
        returns.sort(key = lambda data : data['percent'], reverse=True)
        return json.dumps(returns)

@application.route("/query_feature", methods=["GET", "POST"])
def query_by_feature():
        #returns the label(s) with a given feature
        pass
        
if(__name__ == '__main__'):
        application.run(host='127.0.0.1', port=8080, debug=False)
        print("Exiting session")
        #this occures when the server has been closed
        database.session.remove()
        

