var async = require('async')
, request = require('request')
, github = require('octonode');

// utility function to clean reponames

function cleanName (url){ 
  var count = 0; 
  if (url.indexOf('@') !== -1){
    return url.substring(url.indexOf(':'), url.lastIndexOf('.'));
  }
  for (var i = 0; i < url.length; i++){ 
    if (url.charAt(i) === '/'){
      count++; 
      if (count === 3){
        // account for the .git at end:
        var returnString; 
        var end = url.lastIndexOf('.');
        if (end < i){ // no .git at the end of this 
          returnString = url.substring(i+1); 
          return returnString; 
        }else{ 
          returnString = url.substring(i+1,end); 
          return returnString;
        } 
      }
    }
  }
  if (count !== 3) return url;
}

function github2es (packages,  esUrl, apiKey){
  if (!apiKey){ throw Error('you need an api key for this package'); return }
  this.interval = 2000; 
  this.workSize = 10; 
  this.packages = packages; 
  this.finished = 0;
  this.es = esUrl;  
  this.api = apiKey; 
  this.ghClient = github.client(apiKey);
}

github2es.prototype.groupPackages = function () {
  var _this = this; //save the context of the IssuePopulator object
  if (this.packages.length === 0){
    console.log('finished populating packages on ES'); 
  } else {
    async.parallel(_this.makeFuncs(), function (err, results){
      if (err) console.log(err);
      console.log('Processing next ' + _this.workSize);
      console.log(results);
      setTimeout(function() {
        _this.groupPackages(); 
      }, _this.interval);
    });
  }
}

github2es.prototype.makeSingleFunc = function (p){
  var _this = this;
    return function (cb){
        var packageUrl =  'http://localhost:15984/registry/' + p.id;
        request(packageUrl, function(err, res, packageInfo){
          if (err){ 
            console.log('Error connecting to package that is in the all docs!');
            console.log(err); 
            cb({err: err}, null); // error will show inside results array, cont func exec  
            return  
          }else {
            packageInfo = JSON.parse(packageInfo);
            if ( !packageInfo.repository || !packageInfo.repository.url){
              cb(null, {err:p.id + ' has no repo'});
              return 
            }else {
              _this.getGithubInfo(packageInfo.repository.url, packageInfo["_id"], cb);
            }
          }  
        });// request for package*/
      } //closing (cb)
} 

//makes an array of functions for async 
github2es.prototype.makeFuncs = function (cb) {
  var _this = this;
  var work = []; //array of functions we're going to be returning to async
  var packageNames;  
  if (this.packages.length < this.workSize) packageNames = this.packages.splice(0, this.packages.length); // we have < 10 packages left do the work on all of them and finish
  else packageNames = this.packages.splice(0, this.workSize);
  packageNames.forEach( function (p) {
    work.push(_this.makeSingleFunc(p))
  }); //closes forEach 
  this.finished+=this.workSize;  
  return work; 
}

github2es.prototype.getGithubInfo = function (gitUrl, packageName,  cb){
  var _this = this;
  var repo =  cleanName(gitUrl);  
  var results = {};
  var uri = 'https://api.github.com/repos/' + repo;
  var ghRepo = this.ghClient.repo(repo); 
  var options = {
    method: 'GET',
    url: uri, 
    headers: {
      'User-Agent': 'request',
      "Authorization": "token " + this.api
     }
  };
  request(options, function (err, res, githubInfo) {
    if (err){ cb(err, null); console.log(err); }
    else{
      console.log('API Calls Remaining ' + res['headers']['x-ratelimit-remaining']); 
      githubInfo = JSON.parse(githubInfo);
      if (githubInfo.id){
        if (githubInfo.has_issues){
          results.issues = githubInfo.open_issues;
        }else{
          results.issues = 0;
        }
        results.ghstars = githubInfo['stargazers_count'];
        ghRepo.commits(function (err, arr){
          if (err) { 
            console.log('err with commit' + gitUrl); 
            results.recent-commit = null;
            cb(err, null);
            return
          } else{  
            results.recentcommit = arr[0].commit.committer.date;
            console.log(packageName + ' : ' + results); 
            // cb here for testing this function 
            //cb(null, results);
            _this.esPost(packageName, results, cb);  
          }
        });  
     } else cb(null, {err: packageName +  ' not found on github'}); 
   }
  }); 
}

github2es.prototype.esPost = function (packageName, results, cb){ 
  var esPackageString = this.es + '/package/' + packageName + "/_update"; 
  var opts1 = { 
    method: 'POST', 
    uri: esPackageString, 
    json: { 
      doc: results 
    }
  }
  
  request(opts1, function (err, res, body){
    if (err){
      console.log('there has been an error with the PUT to elastic search');
      cb(null, {err:err}); 
      return 
    }else cb(null, body);
  }); 
  
}

module.exports = github2es;
