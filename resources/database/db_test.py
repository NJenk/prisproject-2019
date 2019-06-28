import numpy as np
import requests
import json
person = [
			[123, 321, 456], #hair
			[204, 245, 215], #skin
			[234, 104, 555, 653, 234, 256, 459], #face
			[234, 567, 923, 101, 107], #skeleton
			[743], #height
			[231] #width
		  ]


variance = 9
differentiation = 100

#send feature matrix with person 1 to the id module

#add the person to the database
p1 = person[:]
for i in range(len(p1)):
	for j in range(len(p1[i])):
		p1[i][j] = str(p1[i][j])

resp = requests.post('http://127.0.0.1:8080/add', data=json.dumps(p1))
print(resp.text)
input("Press enter to query for this person...")

#check person
resp = requests.post('http://127.0.0.1:8080/query', data=json.dumps(p1))
print(resp.text)
input("press enter to query with variance")

#check person with variance
for i in range(len(p1)):
	for j in range(len(p1[i])):
		p1[i][j] = int(p1[i][j])

for i in range(10):
	p1 = person[:]
	#print("Initial p1: ", p1)
	#print()
	
	
	for j in range(len(p1)):
		p1[j] = list(np.array(p1[j]) + np.random.randint(1, variance))
	#print("p1 with varience: ", p1)
	#print()
	
	for k in range(len(p1)):
		for l in range(len(p1[k])):
			p1[k][l] = str(p1[k][l])
	#send to person ID
	#print("str p1:", p1)
	#print()
	
	resp = requests.post('http://127.0.0.1:8080/query', data=json.dumps(list(p1)))
	print(resp.text)
	input()

#differentiate persion profile
print()
print("Checking for second person...")
p2 = person[:]
for i in range(len(p2)):
	for j in range(len(p2[i])):
		p2[i][j] = str(p2[i][j]+differentiation)
#add the new person to the database
resp = requests.post('http://127.0.0.1:8080/add', data=json.dumps(p2))
print(resp.text)
input("Press enter to query for this person...")

#check person
resp = requests.post('http://127.0.0.1:8080/query', data=json.dumps(p2))
print(resp.text)
input("press enter to query with variance")

#check person with variance
for i in range(len(p2)):
	for j in range(len(p2[i])):
		p2[i][j] = int(p2[i][j])

for i in range(10):
	p2 = person[:]
	#print("Initial p1: ", p1)
	#print()
	
	
	for j in range(len(p1)):
		p2[j] = list(np.array(p2[j]) + np.random.randint(1, variance))
	#print("p1 with varience: ", p1)
	#print()
	
	for k in range(len(p2)):
		for l in range(len(p2[k])):
			p2[k][l] = str(p2[k][l])
	#send to person ID
	#print("str p1:", p1)
	#print()
	
	resp = requests.post('http://127.0.0.1:8080/query', data=json.dumps(list(p2)))
	print(resp.text)
	input()
