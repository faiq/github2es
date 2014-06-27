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
  if (count != 3) return url;
}

function github2es (packages,  esUrl, apiKey){
  this.interval = 2000; 
  this.workSize = 10; 
  this.packages = packages; 
  this.finished = 0;
  this.es = esUrl;   
  if (!apiKey) throw Error('you need an api key for this package'); return 
  this.ghClient = github.client(apiKey);
}

github2es.prototype.groupPackages = function () {
  var _this = this; //save the context of the IssuePopulator object
  if (this.packages.length === 0){
    console.log('finished populating packages on ES'); 
  } else {
    //do 10 packages at a time
    async.parallel(_this.makeFuncs(this), function (err, results){
      if (err) console.log(err);
      console.log('Processing next ' + _this.workSize);
      console.log(results);
      setTimeout(function() {
        _this.groupPackages(); 
      }, _this.interval);
    });
  }
}

//makes an array of functions for async 
github2es.prototype.makeFuncs = function (callback) {
  var _this = this;
  var work = []; //array of functions we're going to be returning to async
  var packageNames;  
  if (this.packages.length < this.workSize) packageNames = this.packages.splice(0, this.packages.length); // we have < 10 packages left do the work on all of them and finish
  else packageNames = this.packages.splice(0, this.workSize);
  packageNames.forEach(function (p){
    //console.log(p);
    work.push(
      function (callback){
        var packageUrl =  'http://localhost:15984/registry/' + p.id;
        request(packageUrl, function(err, res, packageInfo){
          if (err){ 
            console.log('error connecting to package');
            console.log(err); 
            callback(null , {err: err}); // error will show inside results array, cont func exec  
            return  
            }else {
                packageInfo = JSON.parse(packageInfo); 
                if ( !packageInfo.repository || !packageInfo.repository.url){
                  var returnObj = {}; 
                  returnObj['packageName'] = packageInfo["_id"];
                  callback(null, {err:'package has no repo'});
                  return 
                }else {
                  _this.getGithubInfo(packageInfo.repository.url, packageInfo["_id"], callback);
                }
            }  
        });// request for package*/
      } //closing (callback) 
    );
  }); //closes forEach 
  this.finished+=this.workSize;  
  return work; 
}

github2es.prototype.getGithubInfo = function (gitUrl, packageName,  callback){
  var _this = this;
  var repo =  cleanName(gitUrl);  
  var results = [];
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
    if (err){ callback(err, null); console.log(err); }
    else{
      githubInfo = JSON.parse(githubInfo);
      if (githubInfo.id){
        if (githubInfo.has_issues){
          results[0] = githubInfo.open_issues;
        }else{
          results[0] = 0;
        }
        results[1] = githubInfo['stargazers_count'];
        //callback(null,results); 
        ghRepo.commits(function (err, arr){
          if (err) { 
            console.log('err with commit' + gitUrl); 
            results[2] = null;
            callback(err, null);
            return
          } else{  
            results[2] = arr[0].commit.committer.date;
            console.log(packageName + ' : ' + results); 
            // callback here for testing this function 
            callback(null, results);
            // _this.esPost(packageName, results, callback);  
          }
        });  
     } else callback(null, {err: 'package not found'});  
   }
  }); 
}

github2es.prototype.esPost = function (packageName, results, callback){ 
  var esPackageString = this.es + '/package/' + packageName + "/_update"; 
  // build scripts
  var issues = "ctx._source.issues = " + results[0];
  var stars = "ctx._source.ghstars = "  + results[1];  
  var com = "ctx._source.recentcommit = " + "\""+ results[2] + "\"";     
  var opts1 = { 
    method: 'POST', 
    uri: esPackageString, 
    json: { "script" : issues }
  }
  var opts2 = { 
    method: 'POST', 
    uri: esPackageString, 
    json: { "script" : stars }
  }
  var opts3 = { 
    method: 'POST', 
    uri: esPackageString, 
    json: { "script" : com }
  }
  
  async.parallel([
    function (callback){
      request(opts1, function (err, res, body){
        if (err){
          console.log('there has been an error with the PUT to elastic search');
          callback(null, {err:err}); 
          return 
        }else callback(null, body); 
      });
    },
    function (callback){ 
      request(opts2, function (err, res, body){ 
        if (err){
          console.log('error posting stars'); 
          callback(null, {err:err}); 
        }else callback (null, body); 
      });
    },
    function (callback){ 
      request(opts3, function (err, res, body){ 
        if (err){
          console.log('error posting latest commit');
          callback(null, {err:err});
        }   
        callback(null, results);
      }); 
    }],function (err, results){ 
      callback(null, results) 
    }); 
  
}

module.exports = github2es;
