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
        var end = url.lastIndexOf('.');
        if (end < i){ // no .git at the end of this 
          var returnString = url.substring(i+1); 
          return returnString; 
        } 
        var returnString = url.substring(i+1,end); 
        return returnString; 
      }
    }
  }
}

function github2es (packages,  esUrl, apiKey){
  this.interval = 2000; 
  this.workSize = 10; 
  this.packages = packages; 
  this.index = 0;
  this.es = esUrl;   
  this.ghClient = github.client(apiKey);
}

github2es.prototype.asyncCallback = function (err, results){
  
  if (err) console.log(err);
  console.log('hit');
  setTimeout(function() {
    _this.doWork();
  }, _this.interval);
}

github2es.prototype.doWork = function () {
  var _this = this; //save the context of the IssuePopulator object
  //console.log(this.packages.length); 
  if (this.packages.length === 0){
    console.log('finished populating packages on ES'); 
  }else {
    //do 10 packages at a time
    async.parallel(_this.getWork(this), function (err, results){
      if (err) console.log(err);
      console.log('Processing next 10');
      setTimeout(function() {
        _this.doWork();
      }, _this.interval);
    });
  }
}

github2es.prototype.getWork = function (callback) {
  var _this = this;
  work = []; //array of functions we're going to be returning to async 
  var packageNames = this.packages.splice(this.index, this.workSize);
  packageNames.forEach(function (p){
    work.push(
      function (callback){
        var packageUrl =  'http://localhost:15984/registry/' + p.id 
        request(packageUrl, function(err, res, body){
          if (err){ 
            console.log('error connecting to package');
            callback(null , {err: err}); // error will show inside results array, cont func exec   
          } else {  
            body = JSON.parse(body);
            if ( !body.repository || !body.repository.url){
              var returnObj = {}; 
              returnObj['packageName'] = body["_id"];
              //console.log('package failure'); 
              callback(null, {err:'package has no repo'});
            }else {
              _this.getGithubInfo(body.repository.url, body["_id"], callback);
            }
          }  
        });// request for package*/
      } //closing (callback) 
    );
  }); //closes forEach 
  this.index+=9; 
  return work; 
}

github2es.prototype.getGithubInfo = function (gitUrl, packageName,  callback){
  var _this = this;
  var repo =  cleanName(gitUrl);  
  var ghRepo = this.ghClient.repo(repo); 
  var results = [];
  console.log(repo); 
  ghRepo.issues(function (err, arr){
    if (err){ 
      //console.log('err with issues' + repo);
      if(err.message==='Not Found'){
        callback(null, {err: err.message});
      }else 
        callback(null, {err: "no issues"})
    results[0] = {'err':err } 
    }else {
      results[0] = arr.length;  
      ghRepo.stargazers(function (err, arr) {
        if (err) { 
            console.log('err with starz' + gitUrl); 
            results[1] = {'err':err } 
        }else { 
        results[1] = arr.length; 
        ghRepo.commits(function (err, arr){
              if (err) { 
                console.log('err with commit' + gitUrl); 
                results[2] = null;
                callback(null, results);
              }else{  
              //results[2] = arr[0].commit.committer.date;
              //passed all three of these tests
              callback(null, results);
              // _this.esPost(packageName, results, callback);  
            }
          }); 
        }
      }); 
    }
  }); 
}

github2es.prototype.esPost = function (packageName, results, callback){ 
 console.log('posting to ES');
 if (typeof (results[0]) === 'object')
    results[0] = 0; 
  if (typeof (results[1] === 'object'))
    results[1] = 0;
  if (results[2] == null){
      callback(null, results);
      return
  }
  var esPackageString = this.es + '/package/' + packageName + "/_update"; 
  // build scripts
  var issues = "ctx._source.issues = " + results[0];
  var stars = "ctx._source.stars = "  + results[1];  
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
  request(opts1, function (err, res, body){
    if (err)
      console.log('there has been an error with the PUT to elastic search');
    request(opts2, function (err, res, body){ 
        if (err) 
          console.log('error posting stars'); 
        request(opts3, function (err, res, body){ 
          if (err) 
            console.log('error posting latest commit');
            callback(null, results);
          //console.log(body); 
      }); //inner request 
    }); //middle request
  }); //outer request */
}

