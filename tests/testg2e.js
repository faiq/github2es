' use strict'; 

//needs an ES to post to
//needs a couch to read from 
//needs a github to read stars from 

var lab = require('lab')
  , describe = lab.describe
  , it = lab.it
  , before = lab.before
  , github2es = require('../github2es')
  , nock = require('nock')
  , fs = require('fs')
  , expect = lab.expect  
  , sampleAllDocs = require('./mocks/all-docs-mock.json')
  , async = require('async'); 

var fakeGitCalls;
var fakeAll = sampleAllDocs.rows;
var fakeAll2 = fakeAll.slice(); 
 
console.log(fakeAll.length);

var fakeES = nock('http://localhost:9200').get('/npm').reply(200, 'Fake ES stuff')
var followerAll = new github2es(fakeAll2, fakeES, process.env.githubApi);   

//fake registry calls 
var fake28 = nock('http://localhost:15984').get('/registry/28').times(4).reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/28_registry.json'));
var fakeCashew = nock('http://localhost:15984').get('/registry/Cashew').times(4).reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/cashew_registry.json'));
var fakeRequest = nock('http://localhost:15984').get('/registry/request').times(4).reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/request_registry.json'));
var fakeviwr = nock('http://localhost:15984').get('/registry/virtuoso-isql-wrapper').times(4).reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/virtuoso-isql-wrapper_registry.json'));
var fakeFrog =  nock('http://localhost:15984').get('/registry/Frog').times(4).reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/Frog_registry.json'));
var fakeExpress = nock('http://localhost:15984').get('/registry/express').times(4).reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/express_registry.json'));
var fakeJson =  nock('http://localhost:15984').get('/registry/JSON').times(4).reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/JSON_registry.json'));
var fakeOsxh =  nock('http://localhost:15984').get('/registry/osxh').times(4).reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/osxh_registry.json'));
var fakeVoodo =  nock('http://localhost:15984').get('/registry/voodoo').times(4).reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/voodoo_registry.json'));
var fakeVargs =  nock('http://localhost:15984').get('/registry/vargs-callback').times(4).reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/vargs-callback_registry.json'));
var fakeVect =  nock('http://localhost:15984').get('/registry/vector2d').times(4).reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/vector2d_registry.json'));

//set up fake git calls 
var git28 = nock('https://api.github.com').get('/repos/28msec/28').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/git/28.json'));
var cashGit = nock('https://api.github.com').get('/repos/spiceapps/cashew').times(2).reply(404, fs.readFileSync(__dirname + '/mocks/git/cash.json'));
var reqGit = nock('https://api.github.com').get('/repos/mikeal/request').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/git/request.json'));
//viwr does not have a git repository test to see if that works right another way
var frogGit = nock('https://api.github.com').get('/repos/kaisellgren/Frog').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/git/frog.json')); 
var expressGit = nock('https://api.github.com').get('/repos/visionmedia/express').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/git/express.json')) 
var jsonGit = nock('https://api.github.com').get('/repos/douglascrockford/JSON-js').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/git/json.json')); 
var osxhGit = nock('https://api.github.com').get('/repos/nodejitsu/http-server').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/git/osxh.json')); 
var voodooGit = nock('https://api.github.com').get('/repos/proximitybbdo/voodoo').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/git/voodoo.json')); 
var vargsGit = nock('https://api.github.com').get('/repos/furagu/vargs-callback').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/git/vargs.json')); 
var vectGit = nock('https://api.github.com').get('/repos/evanshortiss/vec2d').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/git/vector.json'));  
fakeGitCalls = 10; 

//fake octonode calls         
var git28 = nock('https://api.github.com').get('/repos/28msec/28/commits?access_token=03259061f0f5d7190e00e4d45e5b997014c3be2c').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/octonode/28.json'));
var cashGit = nock('https://api.github.com').get('/repos/spiceapps/cashew/commits?access_token=03259061f0f5d7190e00e4d45e5b997014c3be2c').times(2).reply(404, fs.readFileSync(__dirname + '/mocks/octonode/cashew.json'));
var reqGit = nock('https://api.github.com').get('/repos/mikeal/request/commits?access_token=03259061f0f5d7190e00e4d45e5b997014c3be2c').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/octonode/request.json'));
//viwr does not have a git repository test to see if that works right another way
var frogGit = nock('https://api.github.com').get('/repos/kaisellgren/Frog/commits?access_token=03259061f0f5d7190e00e4d45e5b997014c3be2c').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/octonode/frog.json')); 
var expressGit = nock('https://api.github.com').get('/repos/visionmedia/express/commits?access_token=03259061f0f5d7190e00e4d45e5b997014c3be2c').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/octonode/express.json')) 
var jsonGit = nock('https://api.github.com').get('/repos/douglascrockford/JSON-js/commits?access_token=03259061f0f5d7190e00e4d45e5b997014c3be2c').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/octonode/json.json')); 
var osxhGit = nock('https://api.github.com').get('/repos/nodejitsu/http-server/commits?access_token=03259061f0f5d7190e00e4d45e5b997014c3be2c').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/octonode/osxh.json')); 
var voodooGit = nock('https://api.github.com').get('/repos/proximitybbdo/voodoo/commits?access_token=03259061f0f5d7190e00e4d45e5b997014c3be2c').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/octonode/voodoo.json')); 
var vargsGit = nock('https://api.github.com').get('/repos/furagu/vargs-callback/commits?access_token=03259061f0f5d7190e00e4d45e5b997014c3be2c').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/octonode/vargs.json')); 
var vectGit = nock('https://api.github.com').get('/repos/evanshortiss/vec2d/commits?access_token=03259061f0f5d7190e00e4d45e5b997014c3be2c').times(2).reply(200, fs.readFileSync(__dirname + '/mocks/octonode/vector.json'));  


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
