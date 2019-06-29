import cv2
import numpy as np


class PersonDetectionModule():
	"""This module uses a pre-trained Caffe CNN model to detect and contor people in a given frame"""
	
	def __init__(self, output_method):
		self.output_method = output_method
		
		#Set up the pretrained CNN 
		self.classes = ["background", "aeroplane", "bicycle", "bird", "boat",
									"bottle", "bus", "car", "cat", "chair", "cow", "diningtable",
									"dog", "horse", "motorbike", "person", "pottedplant", "sheep",
									"sofa", "train", "tvmonitor"]

		#load in the pretrained model
		self.cnn = cv2.dnn.readNetFromCaffe('models/cnn.txt', 'models/cnn.caffemodel')
		
	def process_frame_cpu(self, frame):
		#resize the frame to a 300x300 image for detection, get image metrics, and our Binary Large Object
		#Output format: [(detection frame, bounding box),...]
		height, width, channels = frame.shape
		size = (300, 300)
		blob = cv2.dnn.blobFromImage(cv2.resize(frame, size), 0.007843, size, 127.5)
		
		#Feed the blob through the neural network and collect a list of the detected objects
		self.cnn.setInput(blob) #sets a new input value for the cnn
		objects = self.cnn.forward()
		
		#for each object detected
		frames = []
		for i in np.arange(0, objects.shape[2]):
			#get the cnn's confidence in the detected objects class
			conf = objects[0, 0, i, 2]
			idx = int(objects[0, 0, i, 1])
			
			#if the cnn's confidence that the detected object is a person is over 80%
			if(conf >= 0.70 and self.classes[idx] == "person"):
				bounding_box = objects[0, 0, i, 3:7] * np.array([width, height, width, height])
				X1, Y1, X2, Y2 = bounding_box.astype("int")
				Y1 -= 15
				X1 -= 15
				X2 += 15
				Y2 += 15
				if(self.output_method == "box"):
					frames.append((self.box_frame(frame[:], X1, Y1, X2, Y2), [(X1, Y1), (X2, Y2)]))
				else:
					frames.append(self.contor_frame(frame[:], X1, Y1, X2, Y2))
			
			#Send frame to Fex Workers
			#send feature matrix to Person ID module
		return frames

	def box_frame(self, frame, X1, Y1, X2, Y2):
		frame = frame[Y1:Y2, X1:X2]
		return frame
		
	def contor_frame(self, frame, X1, Y1, X2, Y2):
		#TODO: Return the contor of a person
		return frame

#=========Test driver=============
if(__name__=="__main__"):
	filename = "data/jared_1.avi"
	pd = PersonDetectionModule("box")
	
	reader = cv2.VideoCapture(filename)
	
	condition = True
	while(condition):
		condition, frame = reader.read()
		
		if(condition):
			frames = pd.process_frame_cpu(frame)
			if(len(frames) != 0 and len(frames[0]) > 100):
				try:
					cv2.imshow('frame',frames[0])
					cv2.imwrite("jared.jpg", frame)
					if cv2.waitKey(1) & 0xFF == ord('q'):
						break
				except:
					pass
	reader.release()
	cv2.destroyAllWindows()