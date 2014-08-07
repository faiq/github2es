' use strict'; 

//needs an ES to post to
//needs a couch to read from 
//needs a github to read stars from 

var lab = require('lab')
  , describe = lab.describe
  , it = lab.it
  , before = lab.before
  , beforeEach = lab.beforeEach
  , afterEach = lab.afterEach
  , github2es = require('../github2es')
  , fs = require('fs')
  , path = require('path')
  , expect = lab.expect  
  , sampleAllDocs = require('./mocks/all-docs-mock.json')
  , nockCalls = require('./nock-calls')
  , follow = require('./fakeApi') 
  , async = require('async')
  , redis = require('redis')
  , spawn = require('child_process').spawn
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
  var elasticsearchCalls = [];
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
  
  var yo = 0; 
  var packageUrls = ['28','request', 'Frog', 'express', 'JSON'
                    ,'osxh', 'voodoo', 'vargs-callback', 'vector2d'];
    
  packageUrls.forEach(function(p){   
    var statCode;
    var res; 
    if (p === '28'){ 
      statCode = 404; 
      res = {statusCode: 404} 
    }
    else{ 
      statCode = 200
      res = 'OK' 
    } 
    elasticsearchCalls[yo] = nock('http://localhost').filteringRequestBody(function(path) {
        return '*';
    }).post('/npm/package/' + p + '/_update', '*')
    .reply(statCode, res);
    yo++;
  });
}

/*var fuck = nock('http://localhost').filteringRequestBody(function(path) {
      return '*';
    }).post('/npm/package/Frog/_update', '*')
      .reply(200, 'OK (excpet for one)');*/

makeCalls();
var fakeES = nock('http://localhost:9200').get('/npm').reply(200, 'Fake ES stuff');


describe('github2es constrctor', function () {
  
  it('needs an api parameter', function(done){ 
    expect(noApi).to.throw(Error);
    done();  
    function noApi (){
      return new github2es(fakeAll, fakeES);
    }
  });
 
});
 
describe('processing the functions (getting metadata -> posting ES)', {timeout: 7000}, function (){ 
  //fire up a redis server, put things into it that I want, see if they behave the way I want them to 
  var client; 
  var startRedis;
  var opts = {}; 
  opts.follow = follow;
  
  beforeEach(function (done){ 
    startRedis = spawn('redis-server')
    setTimeout(function(){ 
      console.log('before') 
      client = redis.createClient();
      client.flushall(); 
      fs.unlinkSync(path.join(__dirname , 'sequence.seq'));
      done();
    }, 3000); 
  });   
  
  it('gets the appropriate info from github', function(done) { 
    var follower2 = new github2es('http://localhost/npm', 'http://localhost:15984/registry', process.env.githubApi, 'packages', 259200, path.join(__dirname , 'sequence.seq'), opts);
    makeGithub(); 
    function makeGithub(){
      var packageUrls = ['28msec/28', 'spiceapps/cashew', 'mikeal/request', 'kaisellgren/Frog', 'visionmedia/express', 'douglascrockford/JSON-js'
                        ,'nodejitsu/http-server', 'proximitybbdo/voodoo', 'furagu/vargs-callback', 'evanshortiss/vec2d']; 
      console.log(packageUrls.length);
      packageUrls.forEach(function (p) { 
          follower2.getGithubInfo(p, p.substring('/'), function (err, res){
            if (p.substring(p.indexOf('/') + 1) === 'cashew') expect(typeof(err)).to.equal('object'); 
            else expect(err).to.equal(null); 
          });  
      }); 
    }
    setTimeout(function(){ 
      done()
    }, 3000)
  });
  
  it('tries to retry on a broken package with an updated timestamp', function(done){
    var follower2 = new github2es('http://localhost/npm', 'http://localhost:15984/registry', process.env.githubApi, 'packages', 259200, path.join(__dirname , 'sequence.seq'), opts);
    follower2.esPost('28', {fake:'yo'}, function (err, res){
      console.log(err)
      expect(err).to.equal(null);
      expect(typeof(res)).to.equal('string'); 
      done(); 
    });  
    }) 
});
