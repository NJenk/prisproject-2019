import cv2
import numpy as np
from FeXLib import *
from PersonDetection import PersonDetectionModule
from FeatureExtraction import FeatureExtractionModule
import requests
import json, traceback
import sys

class PersonReIdentificationSystemCore():
	
	def __init__(self, reader):
		self.reader = reader
		self.person_detection = PersonDetectionModule("box")
		self.feature_extraction = FeatureExtractionModule()
		self.person_identification_url = 'http://127.0.0.1:8080/'
	
	def display(self, mode, count=0, condition=True, frame=None, fMatrix=None, box=None, label=[0, "1", "None", "None"]):
		if(mode == 0):
			#draw the box and the label on the frame
			label_pos = (box[0][0], box[0][1]-30)
			label_pos2 = (box[0][0], box[0][1]-10)
			color = (0, 0, 255)
			if(label[0] == 0):
				label1 = "Person: "+label[1]+" Status: REC"
				label2 = "Label: "+label[2]+" Sim: "+label[3]
				cv2.putText(frame, label1, label_pos, cv2.FONT_HERSHEY_SIMPLEX, .4, color, 1)
				cv2.putText(frame, label2, label_pos2, cv2.FONT_HERSHEY_SIMPLEX, .4, color, 1)
				cv2.rectangle(frame, box[0], box[1], color, 2)
			else:
				label1 = "Person: "+label[1]+" Status: NEW"
				label2 = "Label: "+label[2]
				cv2.putText(frame, label1, label_pos, cv2.FONT_HERSHEY_SIMPLEX, .4, color, 1)
				cv2.putText(frame, label2, label_pos2, cv2.FONT_HERSHEY_SIMPLEX, .4, color, 1)
				cv2.rectangle(frame, box[0], box[1], color, 2)
		elif(mode == 1):
			#display the frame
			cv2.imshow("PRIS Output", frame)
			ff = cv2.waitKey(10)
			if(ff == ord('q')):
				condition = False
		elif(mode == 2):
			#display the feature matrix
			print("="*25," Feature Matrix ", "="*25)
		elif(mode == 3):
			print("Person: ", count)
			for row in fMatrix:
				for column in row:
					print(column, end=' ')
				print()
		elif(mode == 4):
			print("="*66)
			print()
		elif(mode == 5):
			if(label[0] == 0):
				print("Person: "+label[1]+" Status: REC"+" Label: "+label[2]+" Sim: "+label[3])
				print()
			else:
				print("Person: "+label[1]+" Status: NEW"+" Label: "+label[2])
				print()

		return condition
	
	def person_identification(self, fMatrix):
		#this is a wrapper function for the person ID module - sends a feature matrix to the module then recieves a label
		label = ["None", "None", "None"] #Format: [<status>, <label>, <simularity>]
		resp = requests.post(self.person_identification_url+'query', data=json.dumps(fMatrix))
		PID = json.loads(resp.text)
		if(PID != False):
			label[0] = 0
			label[1] = PID[0]
			label[2] = str(PID[1])
		else:
			resp = requests.post(self.person_identification_url+'add', data=json.dumps(fMatrix))
			label[0] = 1
			label[1] = resp.text
			label[2] = None
		return label
	
	def process_video(self):
		print("Processing video...")
		condition = True
		while(condition):
			#STEP-01: Pull the frame
			condition, frame = self.reader.read()
		
			if(condition):
                                #resize the image
				window_height = 450
				aspect_ratio = float(frame.shape[1])/float(frame.shape[0])
				window_width = window_height/aspect_ratio
				frame = cv2.resize(frame, (int(window_height),int(window_width)), interpolation = cv2.INTER_AREA)
			
				#correct luminance in image

				
				#STEP-02: Detect human shaped objects in frame
				#Output format for person detection: [(Detection frame, bounding box), ...]
				detected_people = self.person_detection.process_frame_cpu(frame)
				
				if(len(detected_people) != 0 and len(detected_people[0][0]) > 100):
					self.display(2) #Comment out to disable matrix display
					count = 1
					for person in detected_people:
						#STEP-02: Extract the feature matrix from the detected person.
						matrix = self.feature_extraction.extract_features_sequential(person[0])
						
						#Display feature matrix to console
						self.display(3, count=count, fMatrix=matrix) #Comment out to disable matrix display
						
						#STEP-03: Send the matrix to the Person Identification module
						label = self.person_identification(matrix)

						#ADDED BY NICK: If it's new, spit out the image
						if label[0]==1:
                                                        cv2.imwrite("../images/profile_pics/"+str(label[1]).replace('"',"")+".jpg",person[0])
						
						#Display label to console
						self.display(5, label=[label[0], str(count), label[1], label[2]])
						
						#attach label to frame for image display - only needs to be uncommented when the image display is in use
						self.display(0, frame=frame, box=person[1], label=[label[0], str(count), label[1], label[2]])
						count += 1
				self.display(4) #comment out to disable matrix display
				
				#Display the output for the demo
				#condition = self.display(1, condition, frame=frame)
		self.reader.release()
		cv2.destroyAllWindows()

#==================driver for the PRIS core================================
if(__name__=="__main__"):

	filename = sys.argv[1]
	
	reader = cv2.VideoCapture(filename)
	core = PersonReIdentificationSystemCore(reader)
	core.process_video()
	
