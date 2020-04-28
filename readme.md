CROWN: **C**onversational Passage **R**anking by Reasoning **o**ver **W**ord **N**etworks
============

Description
------------

CROWN is an unsupervised approach for conversational passage ranking. Answers are retrieved from MS MARCO and TREC CAR datasets. We formulated the objective of maximizing the passage score for a query as a combination of similarity and coherence. Passages are preferred that contain words semantically similar to the words used in the question. Coherence is expressed using term proximity. We built a word-proximity network from the corpus, where words are nodes and there is an edge between two nodes if they co-occur in the same passage in a statistically significant way, within a context window. We use NPMI (normalized pointwise mutual information) as a measure of this word association significance.

To cite CROWN: 

"Conversational Question Answering over Passages by Leveraging Word Proximity Networks", Magdalena Kaiser, Rishiraj Saha Roy and Gerhard Weikum, in Proceedings of the 43rd International ACM SIGIR Conference on Research and Development in Information Retrieval 2020 ([SIGIR '20](https://sigir.org/sigir2020/)), Xi'an, China, July 25-30, 2020 (*to appear*).
            
To see CROWN in action: 
        Please have a look at our [Demo](http://crown.mpi-inf.mpg.de)

Data
------

### Dependencies ####

* We require several python libraries, like gensim, spaCy and NetworkX. Note that only Python 3 is supported.

        pip install -r requirements.txt


* Word2Vec embeddings pre-trained on the GoogleNews Corpus are used: https://code.google.com/archive/p/word2vec/. 

* MS MARCO and TREC CAR collections can be downloaded from here: https://github.com/daltonj/treccastweb#collection. Further tools for prepocessing, like removing duplicates can be found here: https://github.com/gla-ial/trec-cast-tools.

* Further preprocessing of the MARCO and CAR files is required. You can use the file `collection_to_database.py` in order to create database entries in the form of key value pairs consisting of *passage id: passage content* for each passsage in the MARCO and the CAR collections.

* The Indri search engine is required. Information about where to download and how to create index files can be found here: https://sourceforge.net/p/lemur/wiki/Quick%20Start/. Index files need to be created for the MARCO and the CAR corpus. 

* We created a graph from the MS Marco corpus, where each node is a word in the corpus (without stopwords) and the edges between the nodes are the npmi values between these words. These edges can be created using the file `create_graph_edges.py`.



### Running CROWN ####

CROWN consists of two parts: 
* a frontend written in Javascript using REACT JS (the code can be found in `crown_frontend`)
* a backend written in Python. You can run it by starting the Python flask app: `python flask_demo.py`.
  
Data is exchanged between the two parts using a RESTful API.
Parameters are provided in JSON format. They are defined in the following. 
For more information about them and our method in general, please refer to our paper.

#### Parameters for CROWN ####

|Name | Values   |   Description |
| ---- | ------------ | ------------|
|questions | ["question 1", "question 2", ... ] | List of all questions asked in current conversation |
|retNbr | [1, 20] | Number of returned passages |
|indriRetNbr |[10, 1000] | Number of passages retrieved by Indri|
|nodeThreshold |[0.0, 1.0] | Similarity Threshold|
|edgeThreshold |[0.0, 0.1] | Coherence Threshold|
|convquery |{'conv_uw','conv_w1','conv_w2'} | Conversational Query Model|
|h1    |[0.0, 1.0] | Hyperparameter for indri score (h1 - h4 must sum up to 1)|
|h2   | [0.0, 1.0] | Hyperparameter for node score (h1 - h4 must sum up to 1)|
|h3  |  [0.0, 1.0] | Hyperparameter for edge score (h1 - h4 must sum up to 1) |
|h4 |   [0.0, 1.0] | Hyperparameter for position score (h1 - h4 must sum up to 1) |

