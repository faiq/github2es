var EE = require('events').EventEmitter 
  , fakeEvents = require('./fakeEvents') 
  , fakeFollow  = new EE

function startEvents (){   
  for (var c = 97; c < 'l'.charCodeAt(0); c++){
    var letter = String.fromCharCode(c)
    var randomTime = Math.floor((Math.random() * 1000) + 1)
    setTimeout(fakeFollow.emit.bind(fakeFollow, "change", fakeEvents[letter] ), randomTime)
  }
} 

fakeFollow.pause = function (){ 
  return
} 

fakeFollow.resume = function (){ 
  return
} 

function follow(opts, cb) {
  startEvents()
  fakeFollow.on('change', function(ch){ 
    cb(null, ch)   
  })
  return fakeFollow
}

module.exports = follow
