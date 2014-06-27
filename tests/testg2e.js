'use strict'; 

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
  , sampleAllDocs = require('./mocks/all-docs-mock.json'); 

var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337, '127.0.0.1');
var follower; 
var follower2;
var follower3;  
describe('github2es', {timeout: 7000}, function () {
  before(function (done){ 
    var fakeAll = sampleAllDocs.rows; 
    var fakeES = nock('http://localhost:9200').get('/npm').reply(200, 'Fake ES stuff')
    var fakeapi = null;   
    follower = new github2es(fakeAll, fakeES, fakeapi);
    follower2 = new github2es(fakeAll, fakeES, fakeapi);
    follower3 = new github2es(fakeAll, fakeES, fakeapi);  
    //set up fake requests to registry 
    var fake28 = nock('http://localhost:15984').get('/registry/28').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/28_registry.json'));
    var fakeCashew = nock('http://localhost:15984').get('/registry/Cashew').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/cashew_registry.json'));
    var fakeRequest = nock('http://localhost:15984').get('/registry/request').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/request_registry.json'));
    var fakeviwr = nock('http://localhost:15984').get('/registry/virtuoso-isql-wrapper').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/virtuoso-isql-wrapper_registry.json'));
    var fakeFrog =  nock('http://localhost:15984').get('/registry/Frog').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/Frog_registry.json'));
    var fakeExpress = nock('http://localhost:15984').get('/registry/express').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/express_registry.json'));
    var fakeJson =  nock('http://localhost:15984').get('/registry/JSON').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/JSON_registry.json'));
    var fakeOsxh =  nock('http://localhost:15984').get('/registry/osxh').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/osxh_registry.json'));
    var fakeVoodo =  nock('http://localhost:15984').get('/registry/voodoo').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/voodoo_registry.json'));
    var fakeVargs =  nock('http://localhost:15984').get('/registry/vargs-callback').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/vargs-callback_registry.json'));
    var fakeVect =  nock('http://localhost:15984').get('/registry/vector2d').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/vector2d_registry.json'));
    //set up fake git calls 
    var 28git = nock('https://api.github.com').get('/repos/28msec/28').reply(200, fs.readFileSync(__dirname + '/mocks/git/28.json');
    var cashGit = nock('https://api.github.com').get('/repos/spiceapps/cashew').reply(404, 'not found');
    var reqGit = nock('https://api.github.com').get('/repos/mikeal/request').reply(200, __dirname + '/mocks/git/request.json');
    //viwr does not have a git repository test to see if that works right another way
    var frogGit = nock('https://api.github.com').get('/repos/kaisellgren/Frog').reply(200, __dirname + '/mocks/git/frog.json'); 
    var expressGit = nock('https://api.github.com').get('/repos/visionmedia/express').reply(200, __dirname + '/mocks/git/express.json'); 
    var jsonGit = nock('https://api.github.com').get('/repos/douglascrockford/JSON-js').reply(200, __dirname + '/mocks/git/json.json'); 
    var osxhGit = nock('https://api.github.com').get('/repos/nodejitsu/http-server').reply(200, __dirname + '/mocks/git/osxh.json'); 
    var voodooGit nock('https://api.github.com').get('/repos/proximitybbdo/voodoo').reply(200, __dirname + '/mocks/git/voodoo.json'); 
    var vargsGit = nock('https://api.github.com').get('/repos/furagu/vargs-callback').reply(200, __dirname + '/mocks/git/vargs.json'); 
    var vectGit = nock('https://api.github.com').get('/repos/evanshortiss/vec2d').reply(200, __dirname + '/mocks/git/vector.json');  
    done();
  }) 
  it('processes the worksize amount of packages at a time', function(done){
    var asyncArr = follower.makeFuncs();
    console.log(asyncArr);
    lab.expect(asyncArr.length).to.equal(follower.workSize);
    done();      
  }); 
  it('gets the appropriate info from github', function(done) { 
    
    follower2.groupPackages(function (results) {
      lab.expect  
    });  

  }); 
  it('posts the on to elastic search', function(done){
    done();
  }); 
  it('repeats the process until done', function (done){
    console.log('from tests ' +follower.packages.length);
    follower2.groupPackages(); 
    setTimeout(function () {
      if(follower.packages.length === 0) 
        done();
    }, 5000);  
  });   
}); 
