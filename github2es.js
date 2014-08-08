var async = require('async')
  , request = require('request')
  , moment = require('moment') 
  , github = require('octonode')
  , walker = require('walker') 
  , redis = require('redis')
  , client = redis.createClient(); 

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


function github2es (esUrl, apiKey, zKey, secs){
  if(!apiKey || !esUrl || !zKey || !secs)  throw Error('the constructor is not right')  
  this.interval = 2000; 
  this.workSize = 10;
  this.finished = 0;
  this.es = esUrl;  
  this.api = apiKey; 
  this.zKey = zKey;  
  this.secs = secs; 
}

github2es.prototype.checkStale = function (uTime){
  var now = Math.round((new Date()).getTime() / 1000);
  if (Math.abs(now - uTime) >= this.secs){return true }
  else{ return false }
}

// grab 10 packages highest in the priority q 
// check to see if they're stale
// if stale put on work array
// p refers to package name 

github2es.prototype.grabPackages = function () {
  var _this = this;
  var workArray = [];
  client.zrange(zkey, 0, 10, function(err, res){ 
    if (err) console.log(err);
    async.each(res, function(p, callback){  
      client.zscore(_this.zKey, p, function(err, res){
        if(err){ callback(err, null); return } 
        if (!res){
          var errstr ='A package has no score associated with it packageName: ' + p + ' in redis Key '+ _this.zKey 
          callback({err:errstr}, null);
        }else{
          if(_this.checkStale(res)){
            var now = Math.round((new Date()).getTime() / 1000);
            client.zadd(_this.zkey, p, now, function(err,res){
                if(err) console.log(err)
                else console.log('added ' + res + ' items.')
            }); 
            workArray.push(p); 
          } 
        } 
      });  
    },function (err){ 
      if (err) console.log(err); 
      async.parallel(_this.makeFuncs(workArray), function (err, results){
        if (err) console.log(err);
        console.log('Processing next ' + _this.workSize);
        console.log(results);
        setTimeout(function() {
        _this.groupPackages(); 
        }, _this.interval);
      });
    });
  });  
} 

//makes an array of functions for async 
github2es.prototype.makeFuncs = function (packs) {
  var _this = this;
  var work = []; //array of functions we're going to be returning to async
  packs.forEach(function (p) {
    work.push(_this.makeSingleFunc(p)); 
    _this.finished++; 
    _this.s.save(_this.finished); //save the index of the last  
  }); //closes forEach 
  return work; 
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
            _this.postGithubInfoToEs(packageInfo.repository.url, packageInfo["_id"], cb);
          }
        }  
      });// request for package
    } //closing (cb)
} 

github2es.prototype.postGithubInfoToEs = function (gitUrl, packageName,cb){ 
  var _this = this; 
  this.getGithubInfo(gitUrl, packageName, function (err, results){ 
    if(err){  console.log('got error from GH'); cb(null, err); return }  //pass back the error to the results array to keep async going 
    else{  console.log('attempting post on Elasticsearch'); _this.esPost(packageName, results, cb); } 
  });
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
      var remaining = res['headers']['x-ratelimit-remaining'];
      githubInfo = JSON.parse(githubInfo);
      if (remaining === 0){
        var timeToReset = res['headers']['x-ratelimit-reset']; 
        var now = new moment();
        var resetMoment = new moment.unix(timeToReset);
        var remaining = resetMoment.diff(now); 
        setTimeout(_this.getGithubInfo(gitUrl,packageName, cb), remaining);  
      }else{   
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
              results.recentcommit = null;
              cb(err, null);
              return
            } else{  
              results.recentcommit = arr[0].commit.committer.date;
              console.log(packageName + ' : ' + results); 
              cb(null, results);
            }
          });  
        } else cb({err: packageName +  ' not found on github'}, null);
      } 
   }//end else for err
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
      console.log(err);
      cb(null, {err:err}); 
      return 
    }else cb(null, body);
  }); 
  
}

module.exports = github2es;
 
