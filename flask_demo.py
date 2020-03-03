from flask import Flask,  request, jsonify, Response
import os
import pickle
import gensim
import json
from treccast_crown import CROWN
import networkx as nx
from flask_cors import CORS
import logging
import ssl
import dbm

logging.basicConfig(filename="logging/flask_demo.log",level=logging.INFO)


HOST = 'localhost'
PORT = 9999

#load word embeddings
model = gensim.models.KeyedVectors.load_word2vec_format('data/GoogleNews-vectors-negative300.bin.gz', binary=True) 
logging.info("embeddings loaded")

#load proximity information
with open('data/graph_data/marco_graph_edges.pickle', 'rb') as handle:
    prox3_dict = pickle.load(handle)
logging.info("proximity infos loaded")

#open databases where id, paragraph pairs are stored
marco_db = dbm.open('data/marco.dbm', 'r')
car_db = dbm.open('data/car.dbm', 'r')


app = Flask(__name__)
CORS(app)

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


@app.route('/getanswer', methods=['POST'])
def getanswer():

	content = request.get_json()
	logging.info("Received Parameters: %s", content)
	
	#create a new CROWN instance	
	t = CROWN(model, prox3_dict, marco_db, car_db)
	#get answer from crown 
	result_paragraphs, result_ids, result_node_map, result_edge_map, top_score_sentences = t.retrieveAnswer(content)
	result = jsonify (paragraphs=result_paragraphs, ids=result_ids, nodes=result_node_map, edges=result_edge_map, top_sentences=top_score_sentences )
	logging.info("TRECCAST CROWN Result: %s", result)
	return result
	

if __name__ == '__main__':
    logging.info("Application is starting ...")
    logging.info("app has IP: %s and port: %i", HOST, PORT)
    app.run(host=HOST, port=PORT, threaded=True)
