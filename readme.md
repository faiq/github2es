#github2es 
---
github2es is a utility that serves as a walker to populate metadata from github for each package on npm's couch database to the corresponding ElasticSearch Documents forindexing.
In order to not go over github's rate limit the module takes 10 packages at a time, gets the metadata from github, posts it to Elasticsearch, and waits 2000 ms until processing the next 10 packages.  

#Usage
---
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
    var walker = new github2es(body.rows, config.elasticsearch.url, config.githubAPI);
    walker.doWork(); 
});

```
#Testing
___ 

Lab was used to test the package. 

##Some notes about testing
- Since the functionality of the module depends on one function calling another, that calls another, all being called by the async parallel function, the way unit testing was implemented 
was a little different. In order to test a function you need to call the callback that the async function expects as oppossed to calling the next function in the sequence. There is an example of this on lines 131 and 132. When testing in that case, take the `cb` out of the comments and put `_this.esPost` in. 

- If you have have any suggestions on how to make it better, please submit an issue on Github 
