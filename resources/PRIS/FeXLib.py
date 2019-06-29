import numpy as np
import imutils
import face_recognition
import cv2
from operator import add
from sklearn.cluster import KMeans
import subprocess
import json

def get_skeleton_keypoints(frame):
	#STEP-01: Use OpenPose to get the skeleton
	temp_dir = 'TEMP'
	img_dir = temp_dir+'/img'
	exe_loc = 'bin/OpenPoseDemo.exe'
	keypoints_dir = temp_dir+'/JSON'
	
	cv2.imwrite(img_dir+'/frame.jpg', frame)
	#input("wrote image")
	
	cmd = [exe_loc, '--image_dir', img_dir, "--write_json", keypoints_dir, "--display", "0", "--render_pose", "0", "--net_resolution", "320x176"]
	results = subprocess.run(cmd, stdout=subprocess.PIPE)
	results.stdout.decode('utf-8')
	#input("wrote keypoints")
	
	with open(keypoints_dir+'/frame_keypoints.json', 'r') as f:
		obj = json.load(f)

	data = obj["people"]
	ourDict = data[0]
	lst = ourDict["pose_keypoints_2d"]
	lst_2 = []

	for x in ourDict["pose_keypoints_2d"]:
		lst_2.append(float(x))

	arr_x = []
	arr_y = []

	i = 0

	while i < len(lst_2):
		arr_x.append(lst_2[i])
		i += 1
		arr_y.append(lst_2[i])
		i+=2
	
	#Skeleton derived from openpose
	skeleton_points = [
				#Skeleton right
				np.array((arr_x[15], arr_y[15])), #right eye
				np.array((arr_x[17], arr_y[17])), #right ear
				np.array((arr_x[2], arr_y[2])), #right shoulder
				np.array((arr_x[3], arr_y[3])), #right elbow
				np.array((arr_x[4], arr_y[4])), #right wrist
				np.array((arr_x[9], arr_y[9])), #right hip
				np.array((arr_x[10], arr_y[10])), #right knee
				np.array((arr_x[11], arr_y[11])), #right ankle
				np.array((arr_x[24], arr_y[24])), #right heel
				np.array((arr_x[22], arr_y[22])), #right foot
				np.array((arr_x[23], arr_y[23])), #right toes

				#Skeleton middle
				np.array((arr_x[0], arr_y[0])), #nose
				np.array((arr_x[1], arr_y[1])), #neck
				np.array((arr_x[8], arr_y[8])), #hip

				#Skeleton left
				np.array((arr_x[16], arr_y[16])), #left eye
				np.array((arr_x[18], arr_y[18])), #left ear
				np.array((arr_x[5], arr_y[5])), #left shoulder
				np.array((arr_x[6], arr_y[6])), #left elbow
				np.array((arr_x[7], arr_y[7])), #left wrist
				np.array((arr_x[12], arr_y[12])), #left hip
				np.array((arr_x[13], arr_y[13])), #left knee
				np.array((arr_x[14], arr_y[14])), #left ankle
				np.array((arr_x[21], arr_y[21])), #right heel
				np.array((arr_x[19], arr_y[19])), #right foot
				np.array((arr_x[20], arr_y[20])) #right toes
			  ]
	return skeleton_points

def get_unit_vector(nosePoint, neckPoint, rEar, lEar):
	#TODO: Find a better unit vector. If the nose is not detected then the entire sckeleton, width and height measurments will fail.
	#would be better to do head tracking then use the heads position to get the unit vector
	#for now I substitute the ears for the nose
	if(sum(nosePoint) == 0):
		if(sum(rEar) != 0):
			unit_vector = np.linalg.norm(rEar - neckPoint)
		elif(sum(lEar) != 0):
			unit_vector = np.linalg.norm(lEar - neckPoint)
		else:
			#Use the nose point and the neck point to derive the unit vector
			unit_vector = np.linalg.norm(nosePoint - neckPoint)
	else:
		#Use the nose point and the neck point to derive the unit vector
		unit_vector = np.linalg.norm(nosePoint - neckPoint)
	return unit_vector

def get_segment(p1, p2):
	return np.linalg.norm(p1 - p2)

def find_histogram(clt):
	"""
	create a histogram with k clusters
	:param: clt
	:return:hist
	"""
	numLabels = np.arange(0, len(np.unique(clt.labels_)) + 1)
	(hist, _) = np.histogram(clt.labels_, bins=numLabels)

	hist = hist.astype("float")
	hist /= hist.sum()

	return hist


def plot_colors2(hist, centroids):
	output_vector = []
	bar = np.zeros((50, 300, 3), dtype="uint8")
	startX = 0
	background = 0
	for (percent, color) in zip(hist, centroids):
		endX = startX + (percent * 300)
		cv2.rectangle(bar, (int(startX), 0), (int(endX), 50),
					  color.astype("uint8").tolist(), -1)
		color = list(map(int, color))
		if (color[0] != 0):
			color = list(map(str, color))
			output_vector.append(color)
			startX = endX

	# return the bar chart
	return output_vector


def skin_color_bucket(R, G, B):
	fair = 0
	brown = 0
	dark = 0
	if (R <= 255 and R >= 203 or G <= 235 and G >= 130 or B <= 219 and B >= 99):
		if (R <= 255 and R >= 203):
			fair += 1
		if (G <= 235 and G >= 130):
			fair += 1
		if (B <= 219 and B >= 99):
			fair += 1

	elif (R <= 204 and R >= 140 or G <= 129 and G >= 92 or B <= 98 and B >= 68):
		if (R <= 204 and R >= 140):
			brown += 1
		if (G <= 129 and G >= 92):
			brown += 1
		if (B <= 98 and B >= 68):
			brown += 1
	elif (R <= 141 and R >= 120 or G <= 91 and G >= 80 or B <= 67 and B >= 53):
		if (R <= 141 and R >= 120):
			dark += 1
		if (G <= 91 and G >= 80):
			dark += 1
		if (B <= 67 and B >= 53):
			dark += 1
	else:
		brown = brown
	if (fair > brown and fair > dark):
		return "fair"
	elif (brown > fair and brown > dark):
		return "Brown"
	elif (dark > fair and dark > brown):
		return "Dark"
	return "Unable to Assign Bucket"


def hair_color_bucket(R, G, B):
	black = 0
	brown = 0
	blonde = 0
	if (R <= 80 and R >= 0 or G <= 68 and G >= 0 or B <= 68 and B >= 0):
		if (R <= 80 and R >= 0):
			black += 1
		if (G <= 68 and G >= 0):
			black += 1
		if (B <= 68 and B >= 0):
			black += 1

	if (R <= 230 and R >= 81 or G >= 69 and G <= 206 or B >= 69 and B <= 168):
		if (R >= 81 and R <= 230):
			brown += 1
		if (G >= 69 and G <= 206):
			brown += 1
		if (B >= 69 and B <= 168):
			brown += 1
	if (R >= 231 and R <= 255 or G >= 207 and G <= 245 or B >= 169 and B <= 255):
		if (R >= 231 and R <= 255):
			blonde += 1
		if (G >= 207 and G <= 245):
			blonde += 1
		if (B >= 169 and B <= 225):
			blonde += 1
	if (black > brown and black > blonde):
		return "Black Hair"
	elif (brown > black and brown > blonde):
		return "Brown Hair"
	elif (blonde > black and blonde > brown):
		return "Blonde Hair"
	return "Unable to Assign Bucket"


def HairFeatureExtractor(frame):
	w = frame.shape[1]
	h = frame.shape[0]
	# cv2.imshow('face or body', face_or_body)
	color = [0, 0, 0]
	color_t = [0, 0, 0]
	color_l = [0, 0, 0]
	color_r = [0, 0, 0]
	for col in range(int(2*w/5), int(3*w/5)):
		# print(col, frame[0, col])
		for row in range(0, int(h/10)):
			color_t = list(map(add, color_t, frame[row, col]))
	# for col in range(0, int(w/5)):
	#     # print(col, frame[0, col])
	#     for row in range(int(2*h/10), int(3*h/10)):
	#         color_l = list(map(add, color_l, frame[row, col]))
	# for col in range(int(4*w/5), int(5*w/5)):
	#     # print(col, frame[0, col])
	#     for row in range(int(2*h/10), int(3*h/10)):
	#         color_r = list(map(add, color_r, frame[row, col]))
	px_col_count = int(w/5)*int(h/10)
	# px_col_count = 3 * int(w / 5) * int(h / 5)
	for i in range(3):
		color[i] = color_t[i]+color_l[i]+color_r[i]
	average_color = [int(c/px_col_count) for c in color]
	#print(hair_color_bucket(average_color[0], average_color[1], average_color[2]))
	average_color = list(map(str, average_color))
	# print('hair color: ', average_color)
	return average_color


def FacialFeatureExtractor(frame):
	feature_vector = []
	faces = {} #format: {"ecodings": [...], "labels": [....]}

	#load in the known faces
	infile = open("models/faces.json", 'r')
	faces = json.load(infile)
	faces["encodings"] = [np.asarray(x, dtype=np.float64) for x in faces["encodings"]]
	infile.close()

	#resize it into useable form and convert it
	rgb_frame = frame[:, :, ::-1]
	
	#find faces in the image
	loc = face_recognition.face_locations(rgb_frame)#,  )
	if(len(loc) != 0):
		#generate facial encodings
		face_encodings = face_recognition.face_encodings(rgb_frame, loc)#, num_jitters=5)
		#match the face or add to known faces
		match = face_recognition.compare_faces(faces["encodings"], face_encodings[0], tolerance=0.6)
		
		if(True not in match or len(match) == 0):
			#if faces is empty or this is an unknown face then generate a new label
			faces["encodings"].append(face_encodings[0])
			feature_vector = [abs(int(sum(face_encodings[0][:len(face_encodings[0])//2])*1000)), abs(int(sum(face_encodings[0][len(face_encodings[0])//2:])*1000))]
			i=0
			while(feature_vector in faces["labels"]):
				feature_vector = [abs(int(sum(face_encodings[0][:len(face_encodings[0])//2])*1000))+i, abs(int(sum(face_encodings[0][len(face_encodings[0])//2:])*1000))+i]
				i+=1
			faces["labels"].append(feature_vector)
			
			#save new encodings to disc
			outfile = open("models/faces.json", 'w')
			faces["encodings"] = [x.tolist() for x in faces["encodings"]]
			json.dump(faces, outfile)
			outfile.close()
			faces["encodings"] = [np.asarray(x, dtype=np.float64) for x in faces["encodings"]]
		else:
			#we have seen this face before so pull the label
			feature_vector = faces["labels"][match.index(True)]
	else:
		feature_vector = [-1, -1]
	return feature_vector


def SkeletonFeatureExtractor(frame):
	mul_shift = 1000 #multiplicative shift to all values - makes getting the variance easier
	#STEP-01: Get the skeleton keypoints
	skeleton_points = get_skeleton_keypoints(frame)

	# #Skeleton keypoints derived from openpose
	# skeleton_points = [
				# #Skeleton right
				# 0, #right eye
				# 1, #right ear
				# 2, #right shoulder
				# 3, #right elbow
				# 4, #right wrist
				# 5, #right hip
				# 6, #right knee
				# 7, #right ankle
				# 8, #right heel
				# 9, #right foot
				# 10, #right toes

				# #Skeleton middle
				# 11, #nose
				# 12, #neck
				# 13, #hip

				# #Skeleton left
				# 14, #left eye
				# 15, #left ear
				# 16, #left shoulder
				# 17, #left elbow
				# 18, #left wrist
				# 19, #left hip
				# 20, #left knee
				# 21, #left ankle
				# 22, #right heel
				# 23, #right foot
				# 24 #right toes
			  # ]
	
	
	#STEP-02: Get the unit vector for conversion
	unit_vector = get_unit_vector(skeleton_points[11], skeleton_points[12], skeleton_points[1], skeleton_points[15])
	
	#STEP-03: Derive the ratios of the unit vector to every line segment in the skeleton.
	sk_ratios = [
				#Skeleton Right
				get_segment(skeleton_points[12], skeleton_points[2])/unit_vector, #unit -> right shoulder 0
				get_segment(skeleton_points[2], skeleton_points[3])/unit_vector, #unit -> right arm 1
				get_segment(skeleton_points[3], skeleton_points[4])/unit_vector, #unit -> right forearm 2
				get_segment(skeleton_points[2], skeleton_points[5])/unit_vector, #unit -> right torso 3
				get_segment(skeleton_points[5], skeleton_points[13])/unit_vector, #unit -> right hip 4
				get_segment(skeleton_points[5], skeleton_points[6])/unit_vector, #unit -> right thigh 5
				get_segment(skeleton_points[6], skeleton_points[7])/unit_vector, #unit -> right leg 6
				
				#Skeleton Middle
				get_segment(skeleton_points[11], skeleton_points[12])/unit_vector, #unit -> Head 7
				get_segment(skeleton_points[12], skeleton_points[13])/unit_vector, #unit -> Middle Torso 8
				
				#Skeleton Left
				get_segment(skeleton_points[12], skeleton_points[16])/unit_vector, #unit -> left shoulder 9
				get_segment(skeleton_points[16], skeleton_points[17])/unit_vector, #unit -> left arm 10
				get_segment(skeleton_points[17], skeleton_points[18])/unit_vector, #unit -> left forearm 11
				get_segment(skeleton_points[16], skeleton_points[19])/unit_vector, #unit -> left torso 12
				get_segment(skeleton_points[13], skeleton_points[19])/unit_vector, #unit -> left hip 13
				get_segment(skeleton_points[19], skeleton_points[20])/unit_vector, #unit -> left thigh 14
				get_segment(skeleton_points[20], skeleton_points[21])/unit_vector #unit -> left leg 15
			   ]
	
	#Derive the skeleton feature vector from the given ratios
	skeleton = [
				#Skeleton Right
				np.array(sk_ratios[:7]).sum() * mul_shift,
				
				#Skeleton Middle
				np.array(sk_ratios[7:9]).sum() * mul_shift,
				
				#Skeleton Left
				np.array(sk_ratios[9:]).sum() * mul_shift
			   ]
	
	#Derive the length of the skeleton from its ratios
	#select right or left leg based on length
	leg_length = max(np.array(sk_ratios[14:]).sum(), np.array(sk_ratios[5:7]).sum()) #max([left leg, right leg])
	
	#Length = head length & torso length & leg length
	length = [(unit_vector/100) * mul_shift, sk_ratios[8] * mul_shift, leg_length * mul_shift]
	
	#Derive the width feature vector from the given points
	#Width = shoulder width & waist width
	width = [(sk_ratios[0]+sk_ratios[9]) * mul_shift, (sk_ratios[4]+sk_ratios[13]) * mul_shift]
	
	return (skeleton, length, width)


def SkinFeatureExtractor(frame):
	# define the upper and lower boundaries of the HSV pixel
	# intensities to be considered 'skin'
	lower = np.array([0, 48, 80], dtype="uint8")
	upper = np.array([20, 255, 255], dtype="uint8")

	# resize the frame, convert it to the HSV color space,
	# and determine the HSV pixel intensities that fall into
	# the speicifed upper and lower boundaries

	frame = imutils.resize(frame, width=400)
	converted = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
	skinMask = cv2.inRange(converted, lower, upper)

	# apply a series of erosions and dilations to the mask
	# using an elliptical kernel
	kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
	skinMask = cv2.erode(skinMask, kernel, iterations=2)
	skinMask = cv2.dilate(skinMask, kernel, iterations=2)

	# blur the mask to help remove noise, then apply the
	# mask to the frame
	skinMask = cv2.GaussianBlur(skinMask, (3, 3), 0)
	skin = cv2.bitwise_and(frame, frame, mask=skinMask)

	# show the skin in the image along with the mask
	# cv2.imshow("images", np.hstack([frame, skin]))
	##cv2.waitKey(0)
	skin_image = np.hstack([skin])
	# status = cv2.imwrite("Gray_Image.png", skin_image)
	# print(status)

	img = skin_image
	img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

	img = img.reshape((img.shape[0] * img.shape[1], 3))  # represent as row*column,channel number
	clt = KMeans(n_clusters=4)  # cluster number
	clt.fit(img)
	hist = find_histogram(clt)
	##    print( type(clt.cluster_centers_))
	output_vector = plot_colors2(hist, clt.cluster_centers_)
	output_vector = np.reshape(output_vector, 9)
	output_color_array = []
	avg_R = 0
	avg_G = 0
	avg_B = 0
	for i in range(9):
		if (i % 3 == 0):
			avg_R += int(output_vector[i])
		if (i % 3 == 1):
			avg_G += int(output_vector[i])
		if (i % 3 == 2):
			avg_B += int(output_vector[i])
	avg_R = int(avg_R / 3)
	avg_G = int(avg_G / 3)
	avg_B = int(avg_B / 3)
	#print("Skin Tone:", skin_color_bucket(avg_R, avg_G, avg_B))
	for i in output_vector:
		output_color_array.append(str(i))

	return output_color_array
