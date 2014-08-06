var EE = require('events') 
  , fakeFollow  = new EE
   
setTimeout(fakeFollow.emit.bind(mock, "first-event", "some arg"), 0)
setTimeout(fakeFollow.emit.bind(mock, "second-event"), 50)
setTimeout(fakeFollow.emit.bind(mock, "third-event", 3), 100)

function follow_feed(opts, cb) {
  fakeFollow.on('change', function(ch) { return cb && cb.call(ch_feed, null, ch) });

  process.nextTick(function() {
    ch_feed.follow();
  })

  return ch_feed;
}

module.exports = follow_feed;
