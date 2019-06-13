import cv2
import numpy as np
from multiprocessing import Process
import traceback, sys
from FeXLib import *

class FeatureExtractionModule():
	"""This module runs a thread-pool and a collection of FeX Workers to extract recognizable features from an individual and generates a feature matrix"""
	
	def __init__(self):
		self.feature_matrix = []
		
		#Setup FeX Workers
		self.fex_workers = [HairFeatureExtractor, 
							FacialFeatureExtractor,
							SkinFeatureExtractor,
							SkeletonFeatureExtractor]
		
	def extract_features_sequential(self, detection_frame):
		self.feature_matrix = []
		self.feature_matrix.append(self.fex_workers[0](detection_frame[:]))
		self.feature_matrix.append(self.fex_workers[1](detection_frame[:]))
		self.feature_matrix.append(self.fex_workers[2](detection_frame[:]))
		skelly, height, width = self.fex_workers[3](detection_frame[:])
		self.feature_matrix.append(skelly)
		self.feature_matrix.append(height)
		self.feature_matrix.append(width)
		
		return self.feature_matrix
		
#=========Test driver=============
if(__name__=="__main__"):
	from PersonDetection import PersonDetectionModule
	filename = "data/test2.avi"
	pd = PersonDetectionModule("box")
	fx = FeatureExtractionModule()
	
	reader = cv2.VideoCapture(filename)
	labels = ["Detected Hair Features: ", "Detected Facial Features: ", "Detected Skeleton Features: ", "Detected Height Features: ", "Detected Width Features: ", "Detected Skin Features: "]
	
	print("Processing video...")
	condition = True
	while(condition):
		condition, frame = reader.read()
		
		if(condition):
			print("Pulling frames from video...")
			frames = pd.process_frame_cpu(frame)
			if(len(frames) != 0 and len(frames[0]) > 100):
				try:
					feature_matrices = []
					for detection_frame in frames:
						matrix = fx.extract_features_sequential(detection_frame)
						print("="*25," Feature Matrix ", "="*25)
						i=0
						for row in matrix:
							print(labels[i], end='')
							i+=1
							for column in row:
								print(column, end=' ')
							print()
						feature_matrices.append(matrix)
						input()
				except Exception:
					traceback.print_exc(file=sys.stdout)
	reader.release()
	cv2.destroyAllWindows()