var fs = require('fs')
  , nock = require('nock'); 

var registryCalls = { 
  fake28: {
    host: 'http://localhost:15984',
    path: '/registry/28', 
    times: 4,
    file: fs.readFileSync(__dirname + '/mocks/registry-calls/28_registry.json')
  },
  fakeCashew: {
    host: 'http://localhost:15984',
    path: '/registry/Cashew',
    times: 4,
    file: fs.readFileSync(__dirname + '/mocks/registry-calls/cashew_registry.json')
  },
  fakeRequest: {
    host: 'http://localhost:15984',
    path: '/registry/request', 
    times: 4,
    file: fs.readFileSync(__dirname + '/mocks/registry-calls/request_registry.json') 
  }, 
  fakeviwr: { 
    host: 'http://localhost:15984',
    path: '/registry/virtuoso-isql-wrapper', 
    times: 4,
    file: fs.readFileSync(__dirname + '/mocks/registry-calls/virtuoso-isql-wrapper_registry.json')
  }, 
  fakeFrog: {
    host: 'http://localhost:15984',
    path:'/registry/Frog',
    times: 4,
    file: fs.readFileSync(__dirname + '/mocks/registry-calls/Frog_registry.json')  
  },
  fakeExpress: {
    host: 'http://localhost:15984',
    path: '/registry/express', 
    times: 4,
    file: fs.readFileSync(__dirname + '/mocks/registry-calls/express_registry.json')
  }, 
  fakeJson: {
    host: 'http://localhost:15984',
    path: '/registry/JSON',
    times: 4,
    file: fs.readFileSync(__dirname + '/mocks/registry-calls/JSON_registry.json')
  }, 
  fakeOsxh: { 
    host: 'http://localhost:15984',
    path: '/registry/osxh',
    times: 4,
    file: fs.readFileSync(__dirname + '/mocks/registry-calls/osxh_registry.json')
  }, 
  fakeVoodoo:{ 
    host: 'http://localhost:15984', 
    path: '/registry/voodoo',
    times: 4,
    file: fs.readFileSync(__dirname + '/mocks/registry-calls/voodoo_registry.json')
  },
  fakeVargs: {
    host: 'http://localhost:15984',
    path: '/registry/vargs-callback', 
    times: 4,
    file: fs.readFileSync(__dirname + '/mocks/registry-calls/vargs-callback_registry.json')
  }, 
  fakeVect: {
    host: 'http://localhost:15984',
    path: '/registry/vector2d',
    times: 4,
    file: fs.readFileSync(__dirname + '/mocks/registry-calls/vector2d_registry.json') 
  }
}

var octonode = {
  git28: {
    host: 'https://api.github.com',
    path: '/repos/28msec/28/commits', 
    times: 2,
    statusCode: 200,
    file: fs.readFileSync(__dirname + '/mocks/octonode/28.json')
  },
  cashGit: {
    host: 'https://api.github.com',
    path: '/repos/spiceapps/cashew/commits', 
    times: 2,
    statusCode: 404,
    file: fs.readFileSync(__dirname + '/mocks/octonode/cashew.json')
  },
  reqGit: {
    host: 'https://api.github.com',
    path: '/repos/mikeal/request/commits', 
    times: 2,
    statusCode: 200, 
    file: fs.readFileSync(__dirname + '/mocks/octonode/request.json') 
  },
  frogGit: {
    host: 'https://api.github.com',
    path: '/repos/kaisellgren/Frog/commits', 
    times: 2,
    statusCode: 200,
    file: fs.readFileSync(__dirname + '/mocks/octonode/frog.json')
  },
  expressGit: {
    host: 'https://api.github.com',
    path: '/repos/visionmedia/express/commits', 
    times: 2,
    statusCode: 200, 
    file: fs.readFileSync(__dirname + '/mocks/octonode/express.json') 
  },
  jsonGit: {
    host: 'https://api.github.com',
    path: '/repos/douglascrockford/JSON-js/commits', 
    times: 2,
    statusCode: 200,
    file: fs.readFileSync(__dirname + '/mocks/octonode/json.json')
  },
  osxhGit: {
    host: 'https://api.github.com',
    path: '/repos/nodejitsu/http-server/commits', 
    times: 2,
    statusCode: 200,
    file: fs.readFileSync(__dirname + '/mocks/octonode/osxh.json') 
  },
  voodooGit: {
    host: 'https://api.github.com',
    path: '/repos/proximitybbdo/voodoo/commits', 
    times: 2,
    statusCode: 200, 
    file: fs.readFileSync(__dirname + '/mocks/octonode/voodoo.json')
  },
  vargsGit: {
    host: 'https://api.github.com',
    path:  '/repos/furagu/vargs-callback/commits', 
    times: 2,
    statusCode: 200,
    file: fs.readFileSync(__dirname + '/mocks/octonode/vargs.json')
  }, 
  vectGit: {
    host: 'https://api.github.com',
    path: '/repos/evanshortiss/vec2d/commits', 
    times: 2,
    statusCode: 200, 
    file: fs.readFileSync(__dirname + '/mocks/octonode/vector.json') 
  }
} 

var gitCalls = {
  git28: {
    host: 'https://api.github.com',
    path: '/repos/28msec/28', 
    times: 2,
    statusCode: 200,
    file: fs.readFileSync(__dirname + '/mocks/git/28.json')
  },
  cashGit: {
    host: 'https://api.github.com',
    path: '/repos/spiceapps/cashew', 
    times: 2,
    statusCode: 404,
    file: fs.readFileSync(__dirname + '/mocks/git/cash.json')
  },
  reqGit: {
    host: 'https://api.github.com',
    path: '/repos/mikeal/request', 
    times: 2,
    statusCode: 200, 
    file: fs.readFileSync(__dirname + '/mocks/git/request.json') 
  },
  frogGit: {
    host: 'https://api.github.com',
    path: '/repos/kaisellgren/Frog', 
    times: 2,
    statusCode: 200,
    file: fs.readFileSync(__dirname + '/mocks/git/frog.json')
  },
  expressGit: {
    host: 'https://api.github.com',
    path: '/repos/visionmedia/express', 
    times: 2,
    statusCode: 200, 
    file: fs.readFileSync(__dirname + '/mocks/git/express.json') 
  },
  jsonGit: {
    host: 'https://api.github.com',
    path: '/repos/douglascrockford/JSON-js', 
    times: 2,
    statusCode: 200,
    file: fs.readFileSync(__dirname + '/mocks/git/json.json')
  },
  osxhGit: {
    host: 'https://api.github.com',
    path: '/repos/nodejitsu/http-server', 
    times: 2,
    statusCode: 200,
    file: fs.readFileSync(__dirname + '/mocks/git/osxh.json') 
  },
  voodooGit: {
    host: 'https://api.github.com',
    path: '/repos/proximitybbdo/voodoo', 
    times: 2,
    statusCode: 200, 
    file: fs.readFileSync(__dirname + '/mocks/git/voodoo.json')
  },
  vargsGit: {
    host: 'https://api.github.com',
    path:  '/repos/furagu/vargs-callback', 
    times: 2,
    statusCode: 200,
    file: fs.readFileSync(__dirname + '/mocks/git/vargs.json')
  },
  vectGit: {
    host: 'https://api.github.com',
    path: '/repos/evanshortiss/vec2d', 
    times: 2,
    statusCode: 200, 
    file: fs.readFileSync(__dirname + '/mocks/git/vector.json') 
  }
  

} 
 
module.exports.registryCalls = registryCalls
module.exports.gitCalls = gitCalls
module.exports.octonode = octonode 
