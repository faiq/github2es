var EE = require('events').EventEmitter 
  , fakeEvents = require('./fakeEvents') 
  , fakeFollow  = new EE
   
/*setTimeout(fakeFollow.emit.bind(mock, "first-event", "some arg"), 0)
setTimeout(fakeFollow.emit.bind(mock, "second-event"), 50)
setTimeout(fakeFollow.emit.bind(mock, "third-event", 3), 100)
*/

for (var c = 97; c < 'l'.charCodeAt(0); c++){
  var letter = String.fromCharCode(c)
  var randomTime = Math.floor((Math.random() * 1000) + 1)
  setTimeout(fakeFollow.emit.bind(fakeFollow, "change", fakeEvents[letter] ), randomTime)
}

//function follow(opts, cb) {
  fakeFollow.on('change', function(ch){ 
    console.log(ch)
    //return cb && cb.call(ch_feed, null, ch) 
  });

  /*process.nextTick(function() {
    ch_feed.follow();
  })

  return ch_feed;*/
//}

//module.exports = follow

