var async = require('async')
  , url = require('url') 
  , request = require('request')
  , moment = require('moment') 
  , github = require('octonode')
  , Couch2redis  = require('couch2redis')
  , gh = require('github-url-to-object')
  , redis = null 
  , client = null;  //a redis client to be assigned by the testing fucntion or assigned by this

function github2es (esUrl, couchUrl, apiKey, zKey, secs, sfPath, testOpts){
  if(!apiKey || !esUrl || !zKey || !secs || !sfPath || !couchUrl)  throw Error('the constructor is missing some parameters'); 
  this.couchUrl = couchUrl; 
  var c2r;
  if (testOpts){
    if (!testOpts.client || !testOpts.follow){ throw Error('If you are passing in an options object to test, please have a follow function'); return } 
    console.log('here in github2es') 
    redis = require('fakeredis')
    client = redis.createClient(); 
    client.flushdb(); 
    c2r = new Couch2redis(couchUrl, zKey, sfPath, testOpts) 
    console.log('in github2es, about to start c2r')
    c2r.startFollower(testOpts);
  }else {
    redis = require('redis')
    client = redis.createClient();
    c2r.startFollower(); 
  }  
  this.interval = 2000; 
  this.workSize = 10;
  this.finished = 0;
  this.es = esUrl;  
  this.api = apiKey; 
  this.ghClient = github.client(apiKey);
  this.zKey = zKey;  
  this.secs = secs; 
}

github2es.prototype.checkStale = function (pTime){
  var now = Math.round((new Date()).getTime() / 1000);
  if (Math.abs(now - pTime) >= this.secs) return true 
  else return false 
}

// grab 10 packages highest in the priority q 
// check to see if they're stale
// if stale put on work array
// p refers to package name 

github2es.prototype.grabPackages = function (cb) {
  var _this = this;
  if (!client){ 
    setTimeout(function (){ 
      _this.grabPackages(cb) 
    }, 1500);
  }else { 
    console.log('this is client '+ client)
    var workArray = [];
    var scoreArray = [];
    client.zrange(this.zKey, 0, 9,'WITHSCORES', function(err, res){ 
      if (err){ cb(err); return } 
      for(var i =  0; i < res.length; i+=2){ 
        var packageName = res[i];
        var packageScore = res[i + 1];
        scoreArray.push(packageScore); 
        if (_this.checkStale(packageScore)) workArray.push(packageName) 
      }
      console.log(workArray) 
      async.each(workArray, function (packageName, callback){
        var now = Math.round((new Date()).getTime() / 1000);
        client.zadd(_this.zKey, now, packageName, function(err,res){
          if(err){console.error(err); callback(err)} 
          callback()
        });  
      },
      function (err){  
        if (err) cb(err)
        async.parallel(_this.makeFuncs(workArray), function (err, results){
          if (err){ cb(err); }
          console.log('Processing next ' + _this.workSize); 
          cb(null, workArray);
          setTimeout(function() {
            _this.grabPackages(cb); 
          }, _this.interval);
        });
      });
    }); 
  }
} 

//makes an array of functions for async 
github2es.prototype.makeFuncs = function (packs) {
  var _this = this;
  var work = []; //array of functions we're going to be returning to async
  packs.forEach(function (p) {
    work.push(_this.makeSingleFunc(p)); 
    _this.finished++; 
  }); //closes forEach 
  return work; 
}

github2es.prototype.makeSingleFunc = function (p){ 
  var _this = this;
    return function (cb){
      var packageUrl =  _this.couchUrl + '/'+  p;
      request(packageUrl, function(err, res, packageInfo){
        if (err){ 
          console.log(err); 
          cb({err: err}, null); //fatal error that should not be ignored   
          return  
        }else {
          packageInfo = JSON.parse(packageInfo);
          if (!packageInfo.repository || !packageInfo.repository.url){
            cb(null, {err:p.id + ' has no repo'});
            return 
          }else {
            _this.postGithubInfoToEs(packageInfo.repository.url, packageInfo["_id"], cb);
          }
        }  
      });// request for package
    } //end of return function 
} 

github2es.prototype.postGithubInfoToEs = function (gitUrl, packageName,cb){ 
  var _this = this; 
  this.getGithubInfo(gitUrl, packageName, function (err, results){ 
    if(err) cb(null, err)  //pass back the error to the results array to keep async going 
    else if(typeof results ==== 'number'){
      cb(null, results);
    }else  _this.esPost(packageName, results, cb);  
  });
}

github2es.prototype.getGithubInfo = function (gitUrl, packageName,  cb){
  var _this = this;
  var results = {};
  var rateuri = 'https://api.github.com/rate_limit'
  var opts = {
    method: 'GET',
    url: rateuri,
    headers: {
      'User-Agent': 'request',
      "Authorization": "token " + this.api
     }
  };
  var _this = this;
  request(opts, function(err, res, api){
    api = JSON.parse(api)
    if(api.rate.remaining === 0){
      var timeToReset = api.rate.reset
      var then = timeToReset - _this.secs; 
      client.zadd(_this.zKey, then, packageName, function(err,res){
        if(err){ console.error(err); cb(err, null)} 
        console.log('cannot get information from github right now for ' + packageName + ' will try again at ' + timeToReset); 
        cb(null, then);  
      });  
    }
    var uri = gh(gitUrl).https_url;
    var repo = url.parse(gh(gitUrl.https_url)).path.slice(1);
    var ghRepo = _this.ghClient.repo(repo);
    var options = {
      method: 'GET',
      url: uri,
      headers: {
        'User-Agent': 'request',
        "Authorization": "token " + this.api
       }
    };
    request(options, function (err, res, githubInfo) {
      if (err){ console.log('error from GH ' + err + ' on this package ' + packageName); cb(err, null); }
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
              results.recentcommit = null;
              cb(err, null);
              return
            } else{
              results.recentcommit = arr[0].commit.committer.date;
              console.log(packageName + ' : ' + results);
              cb(null, results);
            }
          });
        } else{ console.log(packageName + ' not found on github'); cb({err: packageName +  ' not found on github'}, null); }
    });
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
  };
  var _this = this;
  request(opts1, function (err, res, body){
    if (err){
      console.log('there has been an error with the PUT to elastic search');
      console.log(err);
      cb(err,null); //pretty fatal error with elasticsearch 
    }else if(res.statusCode === 404){
      var secs = _this.secs;
      var now = Math.round((new Date()).getTime() / 1000);
      var then = now - secs + 3600; 
      client.zadd(_this.zKey, then, packageName, function(err,res){
        if(err){ console.error(err); cb(err, null)} 
        var str = packageName + ' will be reindexed in an hour'; 
        console.log(str);
        cb(null, str);  
      });  
    }else{ 
      console.log(packageName + ' has been posted sucessfully');  
      cb(null, body);} 
  }); 
}

module.exports = github2es;
 
