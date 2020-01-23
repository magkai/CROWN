from flask import Flask,  request, jsonify
import os
import pickle
import gensim
from gensim.parsing.porter import PorterStemmer
import json
from crown import CROWN
import networkx as nx
from flask_cors import CORS
import logging


logging.basicConfig(filename="logging/flask_demo.log",level=logging.INFO)

#add name of host and port here
HOST =  'ADD_NAME_OF_HOST_HERE'
PORT = 5000

#load word embeddings
model = gensim.models.KeyedVectors.load_word2vec_format('data/GoogleNews-vectors-negative300.bin.gz', binary=True) 
logging.info("embeddings loaded")

#load proximity information
with open('data/graph_data/prox_3.pickle', 'rb') as handle:
    prox3_dict = pickle.load(handle)
logging.info("proximity infos loaded")

#load graph created from marco corpus
G = nx.read_gpickle("data/graph_data/marco_graph_pmi3_edges.gpickle")  
logging.info("Graph successfully loaded")



app = Flask(__name__)
CORS(app)

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


@app.route('/getanswer', methods=['POST'])
def getanswer():

	content = request.get_json()
	logging.info("Received Parameters: %s", content)
	
	#create a new CROWN instance	
	t = CROWN(model, G, prox3_dict)
	#get answer from crown 
	result_paragraphs, result_ids, result_node_map, result_edge_map = t.retrieveAnswer(content)
	result = jsonify (paragraphs=result_paragraphs, ids=result_ids, nodes=result_node_map, edges=result_edge_map )
	logging.info("TRECCAST CROWN Result: %s", result)
	return result
	

if __name__ == '__main__':
	logging.info("Application is starting ...")
	logging.info("app has IP: %s and port: %i", HOST, PORT)
	app.run(host=HOST, port=PORT, threaded=True)

