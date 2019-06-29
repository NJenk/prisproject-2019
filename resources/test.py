import time
import sys

for i in range(100):
    time.sleep(1)
    print(i)
    sys.stdout.flush()