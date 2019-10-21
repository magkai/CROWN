import re
import os.path

#path to location of the datasets
CAR_TRECWEB_LOC = 'CAR_DATA_LOC'
MARCO_TRECWEB_LOC='MARCO_DATA_LOC'


cleanr = re.compile('<.*?>')


def process(loc, folder):
    with open(loc, 'r') as fp:
        line = fp.readline()
        id = ''
        while line:
            if "DOCNO" in line:
                id = re.sub(cleanr, '', line).replace('\n','')
            if "<BODY>" in line:
                paragraph = fp.readline()
                if not os.path.isfile(folder + "/" + id + ".txt"):
                    with open(folder +"/"+id+".txt", 'w') as out:
                        out.write(paragraph)
                        out.close()

            line = fp.readline()


process(MARCO_TRECWEB_LOC, "data/marco_ids")
process(CAR_TRECWEB_LOC, "data/car_ids")

