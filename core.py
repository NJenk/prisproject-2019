import cv2
import numpy as np
from FeXLib import *
from PersonDetection import PersonDetectionModule
from FeatureExtraction import FeatureExtractionModule
import requests
import json, traceback

class PersonReIdentificationSystemCore():
	
	def __init__(self, reader):
                self.reader = reader
                self.person_detection = PersonDetectionModule("box")
                self.feature_extraction = FeatureExtractionModule()
                self.person_identification_url = 'http://127.0.0.1:8080/'
	
	def process_video(self):
		print("Processing video...")
		condition = True
		while(condition):
			condition, frame = self.reader.read()
		
			if(condition):
				print("Detecting people in video...")
				frames = self.person_detection.process_frame_cpu(frame)
				if(len(frames) != 0 and len(frames[0]) > 100):
					#try:
					for detection_frame in frames:
						#extract the features
						matrix = self.feature_extraction.extract_features_sequential(detection_frame)
						print("="*25," Feature Matrix ", "="*25)
						for row in matrix:
							for column in row:
								print(column, end=' ')
							print()
						print()
						input("Press enter to identify the person")
						
						#Identify the person
						resp = requests.post(self.person_identification_url+'query', data=json.dumps(matrix))
						PID = json.loads(resp.text)
						if(PID != False):
							print(PID)
						else:
							print("Adding new person to the database...")
							resp = requests.post(self.person_identification_url+'add', data=json.dumps(matrix))
							print(resp.text)
					#except Exception as e:
					#	print("Error: ", e)
		print("Video processing successful")
		self.reader.release()
		cv2.destroyAllWindows()

#==================driver for the PRIS core================================
if(__name__=="__main__"):

	filename = input("Please enter file path: ")
	reader = cv2.VideoCapture(filename)
	core = PersonReIdentificationSystemCore(reader)
	core.process_video()
	
