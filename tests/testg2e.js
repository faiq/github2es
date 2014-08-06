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
  , path = require('path')
  , expect = lab.expect  
  , sampleAllDocs = require('./mocks/all-docs-mock.json')
  , nockCalls = require('./nock-calls')
  , async = require('async')
  , exec = require('child_process').exec 
  , redis = require('redis') 
  , nock = require('nock'); 

var fakeGitCalls;
var fakeAll = sampleAllDocs.rows;
var fakeAll2 = fakeAll.slice(); 

var  octonodeObj = nockCalls.octonode; 
var gitObj = nockCalls.gitCalls;
var registryObj = nockCalls.registryCalls; 
var fakeGitCalls; 

function NockFactory(Package) { 
  nock(Package.host).get(Package.path).times(Package.times).reply(Package.statusCode || 200, Package.file); 
}
  
function NockFactoryOctonode(Package) { 
  nock(Package.host).get(Package.path + '?access_token=' + process.env.githubApi).times(Package.times).reply(Package.statusCode || 200, Package.file); 
} 
 
function makeCalls ()  {
  var octonodeCalls = [];
  var githubCalls = []; 
  var registryCalls = [];
  
  var oc = 0; 
  Object.keys(octonodeObj).forEach(function (Package){
    octonodeCalls[oc] = NockFactoryOctonode(octonodeObj[Package]);  
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
var fakeES = nock('http://localhost:9200').get('/npm').reply(200, 'Fake ES stuff');

var followerAll = new github2es('http://loa', process.env.githubApi, path.join(__dirname , 'sequence.seq'));   

describe('github2es constrctor', function () {
  it('needs an api parameter', function(done){ 
    expect(noApi).to.throw(Error);
    done();  
    function noApi (){
      return new github2es(fakeAll, fakeES);
    }
  });
 
});

describe('processing the functions (getting metadata -> posting ES)'), {timeout: 7000}, function (){ 
  //fire up a redis server, put things into it that I want, see if they behave the way I want them to 
  var client; 
  before(function (done){ 
    exec('redis-server', function (e, sto, ste){
      if (e) throw Error('redis is not on your machine or is having trouble starting up')  
      client = redis.createClient()
      client.flushall(function (){
        console.log(arguments);  
      }) 
    }) 
  });   





  it('processes the worksize amount of packages at a time', function(done){
    var follower = new github2es(fakeAll, fakeES, process.env.githubApi, path.join(__dirname , 'sequence2.seq'), function () {console.log('done with all the packages'); }); 
    var asyncArr = follower.makeFuncs();
    lab.expect(asyncArr.length).to.equal(follower.workSize);
    done();      
  });
 
  it('gets the appropriate info from github', function(done) { 
    var follower2 = new github2es(fakeAll, fakeES, process.env.githubApi, path.join(__dirname , 'sequence3.seq'), function () {console.log('done with all the packages'); } );   
    makeGithub(); 
    function makeGithub(){
      var packageUrls = ['28msec/28', 'spiceapps/cashew', 'mikeal/request', 'kaisellgren/Frog', 'visionmedia/express', 'douglascrockford/JSON-js'
                        ,'nodejitsu/http-server', 'proximitybbdo/voodoo', 'furagu/vargs-callback', 'evanshortiss/vec2d']; 
      packageUrls.forEach(function (p) { 
          follower2.getGithubInfo(p, p.substring('/'), function (err, res){
            console.log('on this package ' + p);
            if(p.substring('/') === 'cashew'){expect(res).to.equal(null); }
            else {  expect(err).to.equal(null) }
          });  
      }); 
    done();  
  }
  });
 
});
