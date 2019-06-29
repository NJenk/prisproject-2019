import json
with open("faces.json", 'w') as outfile:
	json.dump({"encodings":[], "labels":[]}, outfile)