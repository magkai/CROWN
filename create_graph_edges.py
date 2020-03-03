import gensim
import json
import os
from gensim.parsing.preprocessing import remove_stopwords
from spacy.tokenizer import Tokenizer
from spacy.lang.en import English
import numpy as np
import subprocess
from subprocess import SubprocessError
from xml.dom import minidom
import xml.etree.ElementTree as ET
import re
import linecache
import errno
from sklearn.metrics.pairwise import cosine_similarity as cs
import networkx as nx
import matplotlib.pyplot as plt
import operator
import math
import itertools
from gensim.parsing.porter import PorterStemmer
import csv
import multiprocessing as mp
from multiprocessing import Manager
from networkx.readwrite import json_graph
import concurrent.futures
import threading
import pickle


#directory where marco passages are located
MARCO_DIR = "data/marco_ids/"

punctuation = ['.', ';', ':', ',' ,'!', '?']
not_wanted = ['&', '%', '+', '/', '_', '-', '(', ')', '$', "\n", "="]

nlp = English()


prox3_dict = dict()
word_freq = dict()


prox3_lock = threading.Lock()
word_freq_lock = threading.Lock()

COOC_WINDOW = 3


def processFiles(fname):
    with open(os.path.join(MARCO_DIR, fname), 'r') as f:
        paragraph = f.read()

    doc = nlp(''.join(paragraph))
    tokens = list([token.text.lower() for token in doc if token.text.isalpha() and  not token.is_stop and  not token.text in punctuation and not token.text in not_wanted])
    
    #store frequency of two words appearing together in a context window of size 3
    res_added3 = []
    prox3_lock.acquire()
    try:
        for i in range(len(tokens)):
            if i >= (len(tokens) - COOC_WINDOW):
                upper_3 = len(tokens)
            else:
                upper_3 = i+COOC_WINDOW+1
            for j in range(i+1, upper_3):
                
                if tokens[j] != tokens[i]:
                    if tokens[i] < tokens[j]:
                        if not str(tokens[i] + "_" + tokens[j]) in res_added3:
                            if str(tokens[i] + "_" + tokens[j]) in prox3_dict.keys():
                                prox3_dict[str(tokens[i] + "_" +tokens[j])] += 1
                            else:
                                prox3_dict[str(tokens[i] + "_" +tokens[j])] = 1
                            res_added3.append(str(tokens[i] + "_" + tokens[j]))
                    else:
                        if not str(tokens[j] + "_" + tokens[i]) in res_added3:
                            if str(tokens[j] + "_" +tokens[i]) in prox3_dict.keys():
                                prox3_dict[str(tokens[j] + "_" +tokens[i])] += 1
                            else:
                                prox3_dict[str(tokens[j] + "_" +tokens[i])] = 1
                            res_added3.append(str(tokens[j] + "_" + tokens[i]))
                    
    finally:
        prox3_lock.release()
    
  
    #count how many times word appear in the corpus
    word_freq_lock.acquire()
    try:
        for token in set(tokens):
            if token in word_freq.keys():
                word_freq[token] += 1
            else:
                word_freq[token] = 1
    finally:
        word_freq_lock.release()


with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    executor.map(processFiles, os.listdir(MARCO_DIR))


#edge dictionary
npmi_edges = dict()

#number of passages in marco corpus
nbr_docs = 8635155
#add edges to graph (edges are the npmi values between two words)
for key in prox3_dict.keys():
    t1 = key.split("_")[0]
    t2 = key.split("_")[1]
    prox3_prob = prox3_dict[key]/ nbr_docs
    t1_prob = word_freq[t1]/nbr_docs
    t2_prob = word_freq[t2]/nbr_docs
    val = prox3_prob/ (t1_prob*t2_prob)
    pmi = math.log(val, 2)
    npmi = pmi/(- math.log(prox3_prob, 2))
    npmi_edges[key] = npmi


#store graph edge dictionary 
with open('data/graph_data/marco_graph_edges.pickle', 'wb') as handle: 
	pickle.dump(npmi_edges, handle, protocol=pickle.HIGHEST_PROTOCOL)


print("Ended successfully")

