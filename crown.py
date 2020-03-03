import gensim
from gensim.parsing.porter import PorterStemmer
import json
import os
from spacy.tokenizer import Tokenizer
from spacy.lang.en import English
import numpy as np
import re
from sklearn.metrics.pairwise import cosine_similarity as cs
import networkx as nx
import operator
import math
import itertools
import pickle
from argparse import ArgumentParser
import subprocess
from subprocess import SubprocessError
import logging
import time
import dbm


nlp = English()
nlp.add_pipe(nlp.create_pipe('sentencizer'))
stemmer = PorterStemmer()

#location of Indri index files
CAR_INDEX_LOC ='data/indri_data/car_index/'
MARCO_INDEX_LOC = 'data/indri_data/marco_index/'


#Indri command line tool
INDRI_LOC = 'indri-5.12/runquery'



#the co-occurence window is set to 3 for our graph 
COOC_WINDOW = 3



class CROWN:
    def __init__(self, word_vectors, prox_dict, marco_db, car_db):
        self.word_vectors = word_vectors
        self.prox_dict = prox_dict
        self.call_time = time.time()
        self.logger = logging.getLogger("crown_logger_" + str(self.call_time))
        self.crown_logger = logging.FileHandler("logging/Log-" + str(self.call_time) + ".log")
        self.crown_logger.setLevel(logging.DEBUG)
        self.logger.addHandler(self.crown_logger)
        self.marco_db = marco_db
        self.car_db = car_db
       

    #return tokenized query and the embedding of each token
    def getQueryEmbeddings(self, query):
        query_embeddings = dict()
        doc = nlp(query)
        tokens = [token.text.lower() for token in doc if token.text.isalpha() and not token.is_stop ]
        for token in tokens:
            try:
                query_embeddings[token] = self.word_vectors[token]
            except KeyError:
                s_token = stemmer.stem(token)
                try:
                    query_embeddings[token] = self.word_vectors[s_token]
                except KeyError:
                    pass  
        return (query_embeddings, tokens)


    #get embeddings for each token, the information in which paragraph certain token appears and the sentence-wise passage
    def getParagraphInfos(self, paragraph_map):
        token_embeddings = dict()
        token_to_ids = dict()
        sentence_info = dict()
        passage_sentences = dict()
        
        for key in paragraph_map:
            sentence_map = dict()
            p_tokens = []
            #split passage into sentences
            text_sentences = nlp( paragraph_map[key])
            passage_sentences[key] = []
            i = 1
            for sentence in text_sentences.sents:
                if sentence.text == []:                
                    continue 
                tokens = list([token.text.lower() for token in sentence if token.text.isalpha() and  not token.is_stop])
                if tokens == []:
                    continue
                passage_sentences[key].append(sentence.text)
                sentence_map[i] = tokens
                i += 1
                p_tokens.extend(tokens)
        
            sentence_info[key] = sentence_map
            #get embeddings for each token
            for token in set(p_tokens):
                try:
                    token_embeddings[token] = self.word_vectors[token]
                except KeyError:
                    s_token = stemmer.stem(token)
                    try:
                        token_embeddings[token] = self.word_vectors[s_token]
                    except KeyError:
                        pass           
                if token in token_to_ids.keys():
                    token_to_ids[token].append(key)
                else:
                    token_to_ids[token] = [key]
       
    
        return (token_embeddings, token_to_ids, passage_sentences, sentence_info)
        

    #parse indri result file
    #returns paragraphs and its corresponding scores given by indri
    def processIndriResult(self, filename):
        with open(filename, 'r') as fp:
            indri_line = fp.readline()
            indri_paragraphs = dict()
            paragraph_score = dict()
            while indri_line:
                splits = indri_line.split(" ")
                paragraph = ""
                if len(splits) < 5:
                    self.logger.warn("processed indri line has not the expected format!")
                    indri_line = fp.readline()
                    continue            
                if "MARCO" in splits[2]:
                    try:
                        paragraph = self.marco_db[splits[2]].decode("utf-8")
                    except KeyError:
                        self.logger.warn("no file with this id found, id was: %s", splits[2])
                        continue
                elif "CAR" in splits[2]:
                    try:
                        paragraph = self.car_db[splits[2]].decode("utf-8")
                    except KeyError:
                        self.logger.warn("no file with this id found, id was: %s", splits[2])
                        continue
                else:
                    self.logger.warn("no file with this id found, id was: %s", splits[2])
                if not paragraph=="":
                    indri_paragraphs[splits[2]] = paragraph
                    paragraph_score[splits[2]] = splits[3]
                indri_line = fp.readline()
        return (indri_paragraphs, paragraph_score)


    #creates an indri query file using the unweighted combination of queries from the current the previous and the first turn
    def createIndriQuery(self, tokens, query_tokens, turn_nbr):
        with open("data/indri_data/indri_queries/" + str(self.call_time) + "_turn" + str(turn_nbr+1) + "_indri-query.query", "w") as query_file:
            xmlString = '''<parameters> <index>''' + MARCO_INDEX_LOC + '''</index>
                    <index>''' + CAR_INDEX_LOC + '''</index>
                    <query><number>''' + str(turn_nbr+1) + '''</number>'''
            if turn_nbr == 0:
                line_str = " ".join(map(str, tokens))
                new_line = "<text>#combine(" + line_str +")</text>"
            elif turn_nbr == 1:
                prev_data = query_tokens[turn_nbr-1]
                line_str = " ".join(map(str, tokens)) + " " + "  ".join(map(str, prev_data))
                words = line_str.split()
                line_str = " ".join(sorted(set(words), key=words.index))
                new_line = "<text>#combine(" + line_str +")</text>"
            else:
                prev_data = query_tokens[turn_nbr-1]
                first_data = query_tokens[0]
                line_str = " ".join(map(str, tokens))+ " " + " ".join(map(str, prev_data)) + " "+ " ".join(map(str, first_data))
                words = line_str.split()
                line_str = " ".join(sorted(set(words), key=words.index))
                new_line = "<text>#combine(" + line_str +")</text>"
            xmlString += new_line
            xmlString += '''</query></parameters>'''
            query_file.write(xmlString)


    #main answering function: receives all relevant parameters to answer the request
    # returns the highest scoring paragraphs
    def retrieveAnswer(self, parameters):
    
        #read in the parameters
        conv_queries = parameters["questions"]
        turn_nbr = len(conv_queries) -1 
        INDRI_RET_NUM = int(parameters["indriRetNbr"])
        EDGE_THRESHOLD = float(parameters["edgeThreshold"])
        NODE_MATCH_THRESHOLD = float(parameters["nodeThreshold"])
        res_nbr = int(parameters["retNbr"])
        convquery_type = parameters["convquery"]
        h1 = float(parameters["h1"])
        h2 = float(parameters["h2"])
        h3 = float(parameters["h3"])
        h4 = float(parameters["h4"])

        self.logger.info("The following parameters have been received: ") 
        self.logger.info("conv_queries: %s", conv_queries)
        self.logger.info("turn_nbr: %s", turn_nbr)
        self.logger.info("INDRI_RET_NUM: %i", INDRI_RET_NUM)
        self.logger.info("EDGE_THRESHOLD: %f", EDGE_THRESHOLD)
        self.logger.info("NODE_MATCH_THRESHOLD: %f", NODE_MATCH_THRESHOLD)
        self.logger.info("res_nbr: %i", res_nbr)
        self.logger.info("convquery_type: %s", convquery_type)
        self.logger.info("h1: %f, h2: %f, h3: %f", h1, h2, h3 )

        turn_query_embeddings = dict()
        query_tokens = dict()

        #get tokenized queries and the embeddings of each token
        for i in range(len(conv_queries)):
            turn_query_embeddings[i], query_tokens[i] = self.getQueryEmbeddings(conv_queries[i])
            
        current_query_embeddings = turn_query_embeddings[turn_nbr]
        tokens = query_tokens[turn_nbr]
        query_turn_weights = dict()
        conv_query_embeddings = dict(current_query_embeddings)

        #create the conversational query (3 options are available)
        if convquery_type=="conv_uw":        
            if turn_nbr != 0:
                conv_query_embeddings.update(turn_query_embeddings[0])
        elif convquery_type=="conv_w1":
            if turn_nbr != 0:
                conv_query_embeddings.update(turn_query_embeddings[0])
            for token in conv_query_embeddings.keys():
                query_turn_weights[token] = 1.0
            if turn_nbr > 1:
                for token in turn_query_embeddings[turn_nbr-1].keys():
                    if not token in query_turn_weights.keys():
                        query_turn_weights[token] = turn_nbr/(turn_nbr+1)
                conv_query_embeddings.update(turn_query_embeddings[turn_nbr-1])
        elif convquery_type=="conv_w2":
            query_turn_weights = dict()
            for j in range(turn_nbr+1):
                t_embeddings = turn_query_embeddings[j]
                for token in t_embeddings.keys():
                    conv_query_embeddings[token] = t_embeddings[token]
                    if j == 0 or j == turn_nbr:
                        query_turn_weights[token] = 1.0
                    else:
                        if token in query_turn_weights.keys():
                            if query_turn_weights[token] == 1.0:
                                continue
                        query_turn_weights[token] = (j+1)/(turn_nbr+1)
        else:
            self.logger.warn("conversational query option is unknown! Defaultwise conv_uw will be used")
            if turn_nbr != 0:
                conv_query_embeddings.update(turn_query_embeddings[0])
       
   
        #create Indri query
        self.createIndriQuery(tokens, query_tokens, turn_nbr)
        self.logger.info("indri query created successfully")

        with open('data/indri_data/indri_results/result' + "_" + str(self.call_time) + "_turn" + str(turn_nbr+1) + '.txt', "w") as outfile:
            subprocess.run([INDRI_LOC + "/IndriRunQuery", "data/indri_data/indri_queries/"  + str(self.call_time) + "_turn" + str(turn_nbr+1) + "_indri-query.query", "-count= "+ str(INDRI_RET_NUM), "-trecFormat=true"], stdout=outfile)


        #prepare indri paragraphs: get paragraph sentences and original indri scores from indri result file       
        indri_paragraphs, indri_paragraph_score = self.processIndriResult('data/indri_data/indri_results/result' + "_" + str(self.call_time) + "_turn" + str(turn_nbr+1) + '.txt')
        #get tokenized paragraphs, its token embeddings and info which token belongs to which paragraph
        token_embeddings, token_to_ids, passage_sentences, sentence_info = self.getParagraphInfos(indri_paragraphs)

        #calculate our indriscore which is 1 / indri rank
        for id in indri_paragraph_score.keys():
            indri_paragraph_score[id] = 1/int(indri_paragraph_score[id])
                    
            
        self.logger.info("indri passages retrieved")
                
        query_to_graph_token = dict()
        token_node_weights = dict()
        #calculate node weights -> note: there are tokens which do not have an embedding: node weight=0
        for p_token in token_to_ids.keys():
            max_sim = 0.0
            max_q_token = ''
            if p_token in token_embeddings.keys():
                for q_token in conv_query_embeddings.keys():
                    [[sim]] = cs([token_embeddings[p_token]], [conv_query_embeddings[q_token]])
                    if sim > max_sim:
                        max_sim = sim 
                        max_q_token = q_token
          
            # if similarity is above the node threshold then the node weight will be considered and the token will be further considered for the edge weight calculation
            if max_sim > NODE_MATCH_THRESHOLD:
                #calculate node weight
                if max_q_token in query_turn_weights.keys():
                    token_node_weights[p_token] = max_sim * query_turn_weights[max_q_token]
                else:
                    token_node_weights[p_token] = max_sim
                #store maximal similar query token of a paragraph token for edge weight calculation
                if not p_token in query_to_graph_token.keys():
                    query_to_graph_token[p_token] = [max_q_token]
                else:
                    query_to_graph_token[p_token].append(max_q_token)
            else:
                token_node_weights[p_token] = 0.0
        
    
        #score paragraphs
        scored_paragraphs_dict = dict()
        node_score_dict = dict()
        edge_score_dict = dict()
        pos_score_dict = dict()
        most_rel_sentences = dict()
        #store info about highest matching nodes and edges
        node_map = dict()
        edge_map = dict()
        edge_weight_map = dict()
        
     
        #go over each candidate paragraph
        for p_key in indri_paragraphs.keys():
            node_map[p_key] = []
            edge_map[p_key] = []
            p_score = 0.0
            node_score = 0.0
            edge_score = 0.0
            
            #get all tokens of current paragraph sentence-wise
            sentence_map = sentence_info[p_key]
            sentence_node_score_dict = dict()
            #calculate node score (sentence-wise and for whole paragraph)
            for s_id in sentence_map.keys():
                sentence_node_score = 0.0
                for token in sentence_map[s_id]:
                    node_weight = token_node_weights[token]
                    if node_weight > 0.0:
                        sentence_node_score += node_weight
                        node_score += node_weight
                        if not token in node_map[p_key]:
                           
                            node_map[p_key].append(token)
             
                sentence_node_score_dict[s_id] = sentence_node_score
          
            node_score_dict[p_key] = node_score

            
            sentence_rel_score_dict = dict()  
            sentence_rank_dict = dict()
            #calculate edge score and sentence relevance for position score
            for s_id in sentence_map.keys():
                sentence_edge_score = 0.0
                s_tokens = sentence_map[s_id]
                for k in range(len(s_tokens)):
                    #check if token is close enough to a conversational query token (> NODE_MATCH_THRESHOLD)
                    if not s_tokens[k] in query_to_graph_token.keys():
                        continue
                    if k >= (len(s_tokens) - COOC_WINDOW):
                        upper_3 = len(s_tokens)
                    else:
                        upper_3 = k+COOC_WINDOW+1      
                    # go over all tokens which are in proximity 3 to current token     
                    for j in range(k+1, upper_3):
                        if s_tokens[j] == s_tokens[k]:
                            continue
                        if not s_tokens[j] in query_to_graph_token.keys():
                            continue
                        t1 = s_tokens[k]
                        t2 = s_tokens[j]            
                        #check if both tokens are not most similar to the same query token
                        if not np.intersect1d(query_to_graph_token[t1], query_to_graph_token[t2]):
                            edge_weight = -1.0
                            #get edge weights
                            if t1 < t2: 
                                if str(t1) + "_" + str(t2) in self.prox_dict.keys():
                                    edge_weight = self.prox_dict[str(t1) + "_" + str(t2)]
                            else:
                                if str(t2) + "_" + str(t1) in self.prox_dict.keys():
                                    edge_weight = self.prox_dict[str(t2) + "_" + str(t1)]              
                            if edge_weight != -1.0:
                                if edge_weight > EDGE_THRESHOLD:
                                    edge_score += edge_weight       
                                    sentence_edge_score += edge_weight 
                                    #store infos about most relevant edges
                                    if t1 < t2:
                                        pair = "(" + str(t1) + "," + str(t2) + ")"
                                    else:
                                        pair = "(" + str(t2) + "," + str(t1) + ")"
                                    edge_map[p_key].append(pair)
                                    if not pair in edge_weight_map.keys():
                                        edge_weight_map[pair] = edge_weight
                 
                #store info about sentence relevance and calculate and sentence rank
                sentence_rel_score_dict[s_id] = sentence_node_score_dict[s_id]  + sentence_edge_score
                sentence_rank_dict[s_id] = sentence_rel_score_dict[s_id] * (1/s_id)
            #store final edge score for the current paragraph    
            edge_score_dict[p_key] = edge_score
            #calculate position score based on sentence ranks
            if sentence_rank_dict:
                pos_score_dict[p_key] = max(sentence_rank_dict.items(), key=operator.itemgetter(1))[1]
            else:
                pos_score_dict[p_key] = 0.0
            
            self.logger.info("node, edge and positions scores are calculated")

            #store most relevant sentences for each paragraph
            if sentence_rel_score_dict:
                sorted_rel_sentences = sorted(sentence_rel_score_dict.items(), key=operator.itemgetter(1),  reverse=True)
                most_rel_sentences[p_key] = [x[0] for x in sorted_rel_sentences]
            else:
                most_rel_sentences[p_key] = [1]

            if len(sentence_info[p_key]) <= 3:
                del most_rel_sentences[p_key][1:]
            elif len(sentence_info[p_key]) == 4:
                del most_rel_sentences[p_key][2:]
            else:
                del most_rel_sentences[p_key][3:]
           
 
        for p_key in indri_paragraphs.keys():
            if not p_key in indri_paragraph_score.keys():
                indri_paragraph_score[p_key] = 0.0
        
        #rescale scores: 1/rank (where rank is the rank for each individual score)
        sorted_nodes = sorted(node_score_dict.items(), key=operator.itemgetter(1), reverse=True)
        node_rank = 1
        prev_node = -1
        old_node_rank = -1
        for entry in sorted_nodes:
            if prev_node == format(node_score_dict[entry[0]], '.4f'):
                node_score_dict[entry[0]] = 1/old_node_rank
            else:
                prev_node = format(node_score_dict[entry[0]], '.4f')
                node_score_dict[entry[0]] = 1/node_rank             
                old_node_rank = node_rank     
            node_rank += 1

        sorted_edges = sorted(edge_score_dict.items(), key=operator.itemgetter(1), reverse=True)
        edge_rank = 1
        prev_edge = -1
        old_edge_rank = -1
        for entry in sorted_edges:
            if prev_edge == format(edge_score_dict[entry[0]],  '.4f'):
                edge_score_dict[entry[0]] = 1/old_edge_rank
            else:
                prev_edge = format(edge_score_dict[entry[0]], '.4f')
                edge_score_dict[entry[0]] = 1/edge_rank
                old_edge_rank = edge_rank
            edge_rank += 1

        sorted_pos = sorted(pos_score_dict.items(), key=operator.itemgetter(1), reverse=True)
        pos_rank = 1
        prev_pos = -1
        old_pos_rank = -1
        for entry in sorted_pos:
            if prev_pos == format(pos_score_dict[entry[0]], '.4f'):
                pos_score_dict[entry[0]] = 1/old_pos_rank
            else:
                prev_pos = format(pos_score_dict[entry[0]], '.4f')
                pos_score_dict[entry[0]] = 1/pos_rank       
                old_pos_rank = pos_rank
            pos_rank += 1

        #combine scores
        for p_key in indri_paragraphs.keys():
            p_score = h1 * indri_paragraph_score[p_key] + h2 * node_score_dict[p_key] + h3 * edge_score_dict[p_key] + h4 * pos_score_dict[p_key]
            scored_paragraphs_dict[p_key] = p_score
               
        #sort paragraphs according to their scores
        sorted_p = sorted(scored_paragraphs_dict.items(), key=operator.itemgetter(1), reverse=True)
        scored_paragraphs = [x[0] for x in sorted_p]

        #sort node and edge token candidates
        for p_key in indri_paragraphs.keys():
            node_map[p_key] = list(set(node_map[p_key]))
            node_map[p_key] = sorted(node_map[p_key], key=lambda x: token_node_weights[x], reverse=True)
            if len(node_map[p_key]) > 5:
                del node_map[p_key][5:]
            edge_map[p_key] = list(set(edge_map[p_key]))
            edge_map[p_key] = sorted(edge_map[p_key], key = lambda x: edge_weight_map[x], reverse=True)
            if len(edge_map[p_key]) > 5:
                del edge_map[p_key][5:]
        

        #get final list of paragraphs that will be returned to the user
        result_paragraphs = []
        result_ids = []
        result_node_map = dict()
        result_edge_map = dict()
        top_score_sentences = dict()
        for p in range(len(scored_paragraphs)):
            if p < res_nbr:
                result_paragraphs.append(passage_sentences[scored_paragraphs[p]])
                result_ids.append(scored_paragraphs[p])
                self.logger.info("Top : %i", (p+1))
                self.logger.info("Paragraph ID: %s, score: %s", scored_paragraphs[p], sorted_p[p][1])
                self.logger.info("Paragraph: %s", passage_sentences[scored_paragraphs[p]])
            else:
                break

        for res_id in result_ids:
            result_node_map[res_id] = node_map[res_id]
            result_edge_map[res_id] = edge_map[res_id]
            top_score_sentences[res_id] = most_rel_sentences[res_id]
            
        return (result_paragraphs, result_ids, result_node_map, result_edge_map, top_score_sentences)
                        
                    
                

            
           
