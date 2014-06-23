#github2es 
==== 

github2es is a utility that serves as a walker to populate metadata from github for each package on npm's couch database to the corresponding ElasticSearch Documents forindexing.
In order to not go over github's rate limit the module takes 10 packages at a time, gets the metadata from github, posts it to Elasticsearch, and waits 2000 ms until processing the next 10 packages.  

#Usage
===
The utility is meant to be as simple as possible and contains only 1 method and 1 constructor that the user needs to invoke in order to walk. 

```
var config = require('../../config'), 
    request = require('request'),
    github2es = require('github2es'); 

request('http://localhost:15984/registry/_all_docs', function(err, res, body){ 
    if (err){
      console.log('error getting all docs'); 
      return
    }
    body = JSON.parse(body); 
    var walker = new github2es(body.rows, config.elasticsearch.url, config.githubAPI)
walker.doWork(); 
});

```

