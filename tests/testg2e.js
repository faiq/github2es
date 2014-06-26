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
describe('github2es', function () {
  before(function (done){ 
    var fakeAll = sampleAllDocs.rows; 
    var fakeES = nock('http://localhost:9200').get('/npm').reply(200, 'Fake ES stuff')
    var fakeapi = null;   
    follower = new github2es(fakeAll, fakeES, fakeapi);
    //set up fake requests to registry 
    var fake28 = nock('http://localhost:15984').get('/registry/28').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/28_registry.json'));
    var fakeCashew = nock('http://localhost:15984').get('/registry/Cashew').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/cashew_registry.json'));
    var fakeRequest = nock('http://localhost:15984').get('/registry/request').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/request_registry.json'));
    var fakeviwr = nock('http://localhost:15984').get('/registry/virtuoso-isql-wrapper').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/virtuoso-isql-wrapper_registry.json'));
    var fakeFrog =  nock('http://localhost:15984').get('/registry/Frog').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/Frog_registry.json'));
    var fakeExpress = nock('http://localhost:15984').get('/registry/express').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/express_registry.json'));
    var fakeJson =  nock('http://localhost:15984').get('/registry/JSON').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/JSON_registry.json'));
    var fakeOsxh =  nock('http://localhost:15984').get('/registry/osxh').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/osxh_registry.json'));
    var fakeVoodo =  nock('http://localhost:15984').get('/registry/voodo').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/voodoo_registry.json'));
    var fakeVargs =  nock('http://localhost:15984').get('/registry/vargs-callback').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/vargs-callback_registry.json'));
    var fakeVect =  nock('http://localhost:15984').get('/registry/vector2d').reply(200, fs.readFileSync(__dirname + '/mocks/registry-calls/vector2d_registry.json'));
    
    done();
  }) 
  it('processes 10 packages at a time', function(done){
    var asyncArr = follower.makeFuncs();
    console.log(asyncArr);
    lab.expect(asyncArr.length).to.equal(follower.workSize);
    done();      
  }); 
  it('gets the appropriate info from github', function(done) { }); 
  it('posts the on to elastic search', function(done){}); 
  it('repeats the process until done', function (done){});   
}); 
