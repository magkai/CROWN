CROWN: **C**onversational Passage **R**anking by Reasoning **o**ver **W**ord **N**etworks
============

Description
------------

CROWN is an unsupervised approach for conversational passage ranking. Answers are retrieved from MS MARCO and TREC CAR datasets. We formulated the objective of maximizing the passage score for a query as a combination of similarity and coherence. Passages are preferred that contain words semantically similar to the words used in the question. Coherence is expressed using term proximity. We built a word-proximity network from the corpus, where words are nodes and there is an edge between two nodes if they co-occur in the same passage in a statistically significant way, within a context window. We use NPMI (normalized pointwise mutual information) as a measure of this word association significance.



Data
------

### Dependencies ####

* We require several python libraries, like gensim, spaCy and NetworkX. Note that only Python 3 is supported.

        pip install -r requirements.txt


* Word2Vec embeddings pre-trained on the GoogleNews Corpus are used: https://code.google.com/archive/p/word2vec/. 

* MS MARCO and TREC CAR collections can be downloaded from here: https://github.com/daltonj/treccastweb#collection. Further tools for prepocessing, like removing duplicates can be found here: https://github.com/gla-ial/trec-cast-tools.

* Further preprocessing of the MARCO and CAR files is required. You can use the file `preprocess_collections.py` in order to create for each passage in the MARCO and the CAR collection a single file `id.txt` where `id` is the respective id used in the corpus. 

* The Indri search engine is required. Information about where to download and how to create index files can be found here: https://sourceforge.net/p/lemur/wiki/Quick%20Start/. Index files need to be created for the MARCO and the CAR corpus. 

* We created a graph from the MS Marco corpus, where each node is a word in the corpus (without stopwords) and the edges between the nodes are the pmi values between these words. You can reproduce this graph using the file `create_marco_graph.py`. This generates two files, the graph itself and a dictionary containing the frequency of two words co-occuring in a context window of size 3.



### Running CROWN ####

You can run CROWN by starting the Python flask app: `python crown_flask_app.py`. Additional parameters need to be provided in JSON format. These are defined in the following. 
For more information about them and our method in general, please refer to our paper.

#### Parameters for CROWN ####

| Name | Values | Description|
|------|  ------------ | --------------|
| questions | ["question 1", "question 2", ... ] | List of all questions asked in current conversation| 
| indriRetNbr | [10, 1000] | Number of passages retrieved by Indri |
| edgeThreshold  | [0.0, 0.1] | Coherence Threshold |
| nodeThreshold  | [0.0, 1.0] | Similarity Threshold |
| retNbr  | [1, 20]  | Number of returned passages |
| convquery  |{'conv_uw', 'conv_w1', 'conv_w2'} | Conversational Query Model|
| h1   | [0.0, 1.0] | Hyperparameter for indri score (h1, h2, h3 must sum up to 1) |
| h2  |  [0.0, 1.0] | Hyperparameter for node score (h1, h2, h3 must sum up to 1) |
| h3  |  [0.0, 1.0]  | Hyperparameter for edge score (h1, h2, h3 must sum up to 1) |

