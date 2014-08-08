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

var worker = new github2es(argv.esUrl, argv.couchUrl, argv.apiKey, zKeyForRedis , numberOfSecondsForAPackageToBeReindexOn, path.join(__dirname, '/sequence.seq')); 
worker.grabPackages(function(err, res){
  
}); 

```
The package will throw errors for several reasons 
  - a problem with a redis method throws an error 
  - 
#Testing
___ 

Lab was used to test the package. 

##Some notes about testing
- Testing is done through the lab framework
- When testing the module, the tests require the Github API key to be passed in through an enviorment variable 
`
githubApi=MY_API_KEY npm test
` 
