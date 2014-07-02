' use strict'; 

//needs an ES to post to
//needs a couch to read from 
//needs a github to read stars from 

var lab = require('lab')
  , describe = lab.describe
  , it = lab.it
  , before = lab.before
  , github2es = require('../github2es')
  , fs = require('fs')
  , expect = lab.expect  
  , sampleAllDocs = require('./mocks/all-docs-mock.json')
  , nockCalls = require('./nock-calls')
  , async = require('async')
  , nock = require('nock'); 

var fakeGitCalls;
var fakeAll = sampleAllDocs.rows;
var fakeAll2 = fakeAll.slice(); 

var  octonodeObj = nockCalls.octonode; 
var gitObj = nockCalls.gitCalls;
var registryObj = nockCalls.registryCalls; 
var fakeGitCalls; 

function NockFactory(Package) { 
  console.log(Package);
  nock(Package.host).get(Package.path).times(Package.times).reply(Package.statusCode || 200, Package.file); 
}  
function makeCalls ()  {
  var octonodeCalls = [];
  var githubCalls = []; 
  var registryCalls = [];
  
  var oc = 0; 
  Object.keys(octonodeObj).forEach(function (Package){
    octonodeCalls[oc] = NockFactory(octonodeObj[Package]);  
    oc++; 
  }); 
  
  var gc = 0; 
  Object.keys(gitObj).forEach(function (Package){ 
    githubCalls[gc] = NockFactory(gitObj[Package]); 
    gc++
  });
  fakeGitCalls = gc; 
  var rc = 0; 
  Object.keys(registryObj).forEach(function (Package){
    registryCalls[rc] = NockFactory(registryObj[Package]); 
    rc++; 
  }); 
}
makeCalls();
var fakeES = nock('http://localhost:9200').get('/npm').reply(200, 'Fake ES stuff')
var followerAll = new github2es(fakeAll2, fakeES, process.env.githubApi);   

describe('github2es constrctor', function () {
  it('needs an api parameter', function(done){ 
    expect(noApi).to.throw(Error);
    done();  
    function noApi (){
      return new github2es(fakeAll, fakeES);
    }
  });  
});

describe('github2es functions', {timeout: 7000}, function (){
  it('processes the worksize amount of packages at a time', function(done){
    var follower = new github2es(fakeAll, fakeES, process.env.githubApi); 
    var asyncArr = follower.makeFuncs();
    lab.expect(asyncArr.length).to.equal(follower.workSize);
    done();      
  });
 
  it('gets the appropriate info from github', function(done) { 
    var follower2 = new github2es(fakeAll, fakeES, process.env.githubApi);   
    async.parallel(makeGithub(), function (err,results){ 
    expect(results.length).to.equal(fakeGitCalls); //we should only be making the same number of calls that we have git urls from 
      //dont throw any errs
      expect(err).to.equal(undefined); 
      done();
    }); 
    function makeGithub(){
      var work = []; 
      var packageUrls = ['28msec/28', 'spiceapps/cashew', 'mikeal/request', 'kaisellgren/Frog', 'visionmedia/express', 'douglascrockford/JSON-js'
                        ,'nodejitsu/http-server', 'proximitybbdo/voodoo', 'furagu/vargs-callback', 'evanshortiss/vec2d']; 
      packageUrls.forEach(function (p) { 
        work.push(function (callback){
          follower2.getGithubInfo(p, p.substring('/'), callback);  
        });
      }); 
      return work; 
   }
  });
 
  it('repeats the process until done', function (done){
    console.log(fakeAll2.length); 
    followerAll.groupPackages(); 
    setTimeout(function () {
      if(followerAll.packages.length === 0) 
        done();
    }, 5000);  
  });

});
