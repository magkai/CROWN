import re
import os.path
import dbm

CAR_TRECWEB_LOC = 'data/car_out/dedup.articles-paragraphs.cbor.xml' 
MARCO_TRECWEB_LOC='data/marco_out/collection.tsv.xml'

cleanr = re.compile('<.*?>')



def process(loc, database):
    with open(loc, 'r') as fp:
        line = fp.readline()
        idf = ''
        while line:
            if "DOCNO" in line:
                idf = re.sub(cleanr, '', line).replace('\n','')
                idf = idf.replace(" ", "")
            if "<BODY>" in line:
                paragraph = fp.readline()
                database[idf] = paragraph 
            line = fp.readline()


database  = dbm.open('data/marco.dbm', 'c') 
process(MARCO_TRECWEB_LOC, database)
print("marco_ids created")
database  = dbm.open('data/car.dbm', 'c') 
process(CAR_TRECWEB_LOC, database)
print("car_ids created")


