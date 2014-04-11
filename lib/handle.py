import os
import sys

infile = open(sys.argv[1],'r');
outfile = open(sys.argv[2],'w');

a = []
for line in infile:
	line = line.strip()
	if len(line) == 0:
		continue
	#if line.startswith("//"):
	#	continue
	line = line.split(",")
	line = line[1].strip()

	a.append(line)

for line in a:
	outfile.write(line+"\n")

outfile.close()
