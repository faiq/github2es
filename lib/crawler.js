' use strict '; 
 
var redis = require('redis')
  , follow = require('follow')
  , client = redis.createClient()

Walker.prototype.startFollower = function (){
  var couchUrl = this.couchUrl
  var _this = this
  var settings = 
  {
    db: couchUrl
    , since: 0  //maybe I change this? I dont know 
    , include_docs: true
  }  
  
  this.follow = follow(settings, function(err, change){ 
    if(err) console.log(err) 
    if (change.id){ 
      _this.addChange(change)   
    } 
  }) 
}    
  
Walker.prototype.addChange = function(change){ 
  var _this = this
  console.log('adding change') 
  _this.follow.pause()
  client.zscore(this.zKey, change.id, function(err, res){
    if (err){
      console.log('err ' + err)
      return 
    }
    if (!res){
      client.zadd(_this.zKey, 0, change.id, function(err, res){
        if(err){
          console.log('err ' + err)
          return
        } 
        console.log('added ' + res + ' items.') 
        _this.follow.resume()
      })
    }  
  }) 
}

function Walker(couchUrl, zKey){ 
  this.couchUrl = couchUrl
  this.zKey = zKey
} 

var yo =  new Walker('https://skimdb.npmjs.com/registry', 'packages')

yo.startFollower() 
module.exports = Walker    
