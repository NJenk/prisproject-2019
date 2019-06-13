from imutils import face_utils
import numpy as np
import argparse
import imutils
import dlib
import cv2
import os
from operator import add
from scipy.stats import itemfreq
import argparse
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
import subprocess
import json
import math

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
	tol = 200
	
	# initialize dlib's face detector (HOG-based) and then create
	# the facial landmark predictor
	detector = dlib.get_frontal_face_detector()
	predictor = dlib.shape_predictor("models/shape_predictor_68_face_landmarks.dat")

	# Resize the image, and convert it to grayscale
	frame = imutils.resize(frame, width=500)
	gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

	# This array stores all the coordinates that are come up with from
	# the facial predictor algorithm.
	coordinates = []

	# detect faces in the grayscale image
	rects = detector(gray, 1)

	# loop over the face detections
	for (i, rect) in enumerate(rects):
		# determine the facial landmarks for the face region, then
		# convert the landmark (x, y)-coordinates to a NumPy array
		# and then add this array to the coordinates array to be stored
		# for calculating the distances and ratios later.
		shape = predictor(gray, rect)
		shape = face_utils.shape_to_np(shape)
		coordinates.append(shape)
		break

	# The arrays that will store the distances from point to point, and
	# ratios of each distance to the next distance.
	distances = []
	ratios = []
	if len(coordinates) > 0:
		# Calculates distances and appends them to the distances array in order
		#load in the known faces
		infile = open("models/faces.json", 'r')
		faces = json.load(infile)
		infile.close()
		
		#put the face in a usable format
		face = [(int(x[0]), int(x[1])) for x in coordinates[0]]

		for knownFace in faces:
			kFace = json.loads(knownFace)
			
			f = np.array(face)
			kf = np.array(kFace)
			norm = np.linalg.norm(f - kf)
			if(np.isclose(norm, 0, atol=tol)):
				feature_vector = faces[knownFace]

		if(len(feature_vector)==0): #only happens when there are no matches or there were no known faces
			#add a new face to the dict
			knownFace = json.dumps(face)
			face = np.array(face)
			faces[knownFace] = [str(int(np.average(face[:, 1:]))), str(int(np.average(face[:, :1])))]
			feature_vector = faces[knownFace]

		#save the dictionary to file so we don't lose facial information
		outfile = open("models/faces.json", 'w')
		json.dump(faces, outfile)
		outfile.close()
	else:
		feature_vector = ["-1"]
	return feature_vector


def SkeletonFeatureExtractor(frame):
	#print("starting skeleton")
	temp_dir = 'TEMP'
	img_dir = temp_dir+'/img'
	exe_loc = 'bin/OpenPoseDemo.exe'
	keypoints_dir = temp_dir+'/JSON'
	
	cv2.imwrite(img_dir+'/frame.jpg', frame)
	#input("wrote image")
	
	cmd = [exe_loc, '--image_dir', img_dir, "--write_json", keypoints_dir, "--display", "0", "--render_pose", "0"]
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

	#print(arr_x)
	#print(arr_y)

	nose = (arr_x[0], arr_y[0])
	neck = (arr_x[1], arr_y[1])
	#rightArm
	rtShlder = (arr_x[2], arr_y[2])
	rtEl = (arr_x[3], arr_y[3])
	rtWrst = (arr_x[4], arr_y[4])
	#leftArm
	lftShlder = (arr_x[5], arr_y[5])
	lftEl = (arr_x[6], arr_y[6])
	lftWrist = (arr_x[7], arr_y[7])

	midHip = (arr_x[8], arr_y[8])
	#rightLeg
	rtHip = (arr_x[9], arr_y[9])
	rtKnee = (arr_x[10], arr_y[10])
	rtAnkle = (arr_x[11], arr_y[11])
	#leftLeg
	lftHip = (arr_x[12], arr_y[12])
	lftKnee = (arr_x[13], arr_y[13])
	lftAnkle = (arr_x[14], arr_y[14])
	#eyes
	rtEye = (arr_x[15], arr_y[15])
	lftEye = (arr_x[16], arr_y[16])
	#ears
	rtEar = (arr_x[17], arr_y[17])
	lftEar = (arr_x[18], arr_y[18])
	#leftfoot
	lftBFoot = (arr_x[19], arr_y[19])
	lftToes = (arr_x[20], arr_y[20])
	lftHeel = (arr_x[21], arr_y[21])
	#righ foot
	rtBFoot = (arr_x[22], arr_y[22])
	rtToes = (arr_x[23], arr_y[23])
	rtHeel = (arr_x[24], arr_y[24])



	def distance(a,b):
		return math.sqrt(((a[0] - b[0]) ** 2) + ((a[1] - b[1]) ** 2))


	def dist_ratio(bdy_prt1, bdy_prt2):
		distance_xy = math.sqrt(((bdy_prt1[0] - bdy_prt2[0]) ** 2) + ((bdy_prt1[1] - bdy_prt2[1]) ** 2))
		return round(distance_xy/neckSize,2)

	def standardize(value):
		if value < 0.1:
			return value*100000

		if value < 1:
			return value*10000

		if value <= 9.99 and value >= 1:
			return value*1000

		if value > 9.99 and value < 100:
			return value*100

		if value > 100 and value < 999:
			return value*10

		if value >= 1000 and value < 9999:
			return value

		if value >= 10000:
			return value/10


	neckSize = distance(nose,neck)

	height = ((round(((distance(nose,neck) + distance(neck,midHip) + distance(lftHip,lftKnee) + distance(lftKnee,lftAnkle))/neckSize), 2)))

	height_ratio = height + neckSize

	shlderWidth_ratio = (round(((distance(rtShlder,neck) + distance(neck,lftShlder))/neckSize),2))

	waistWidth_ratio = (round(((distance(rtHip,midHip) + distance(midHip,lftHip))/neckSize),2))

	width_array = [waistWidth_ratio,shlderWidth_ratio, distance(lftHip,rtHip)*100]

	height_left = ((round(((distance(nose,neck) + distance(neck,midHip) + distance(lftHip,lftKnee) + distance(lftKnee,lftAnkle))/neckSize), 2)))

	height_right = ((round(((distance(nose,neck) + distance(neck,midHip) + distance(rtHip,rtKnee) + distance(rtKnee,rtAnkle))), 2)))

	height_ratio_right = height_right + neckSize

	height_ratio_left = height_left + neckSize

	shlderWidth_ratio = (round(((distance(rtShlder,neck) + distance(neck,lftShlder))/neckSize),2))

	waistWidth_ratio = (round(((distance(rtHip,midHip) + distance(midHip,lftHip))/neckSize),2))

	width_id = [str(int(standardize(waistWidth_ratio))),str(int(standardize(shlderWidth_ratio)))]


	raw_skeleton_ratios = [dist_ratio(lftEye, rtEye), dist_ratio(rtEar, lftEar), dist_ratio(lftShlder, neck),
					   dist_ratio(rtShlder,neck), dist_ratio(lftShlder,lftEl), dist_ratio(rtShlder,rtEl),
					   dist_ratio(lftEl,lftWrist),dist_ratio(rtEl,rtWrst),dist_ratio(neck,midHip),
					   dist_ratio(lftHip,midHip),dist_ratio(rtHip,midHip),dist_ratio(lftHip,lftKnee),
					   dist_ratio(rtHip,rtKnee),dist_ratio(lftKnee,lftAnkle),dist_ratio(rtKnee,rtAnkle),
					   dist_ratio(lftAnkle,lftBFoot),dist_ratio(rtAnkle,rtBFoot),dist_ratio(lftAnkle,lftHeel),
					   dist_ratio(rtAnkle,rtHeel), dist_ratio(lftToes,lftBFoot),dist_ratio(rtToes, rtBFoot)]

	skeleton_ratios_upper = [int(standardize(dist_ratio(lftHip,rtHip*100)))]

	skeleton_ratios_mid = [int(standardize(dist_ratio(lftHip,rtHip*100)))]

	skeleton_ratios_lower = [int(standardize(dist_ratio(lftHip,rtHip*100)))]


	i = 0
	while i < 7:
		skeleton_ratios_upper.append(int(standardize(raw_skeleton_ratios[i]*neckSize*10)))
		i += 1

	while i < 14:
		skeleton_ratios_mid.append(int(standardize(raw_skeleton_ratios[i]*neckSize*100)))
		i += 1


	while i < 21:
		skeleton_ratios_lower.append(int(standardize(raw_skeleton_ratios[i]/neckSize*100)))
		i += 1


	upper_skel = str(int(standardize(sum(skeleton_ratios_upper))))
	mid_skel = str(int(standardize(sum(skeleton_ratios_mid))))
	lower_skel = str(int(standardize(sum(skeleton_ratios_lower))))

	skelly_id = [upper_skel,mid_skel,lower_skel]
	height_id = [str(standardize(int(height_ratio_left))), str(standardize(int(height_ratio_right)))]



	return skelly_id, width_id, height_id


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


