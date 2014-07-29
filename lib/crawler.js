//WALKER FUNCTION TAKES IN A BUNCH OF PACKAGE NAMES
//, CHECKS TO SEE IF THEY'RE STALE 
//, IF STALE -> UPDATE TIMESTAMP 
// && PUSH ON QUEUE 
//ELSE KEEP WALKING
' use strict '; 
 
var redis = require('redis')
  , moment = require('moment') 
  , client = redis.createClient(); 

function Walker (plist q, key, dbNum){ 
  var _this = this; 
  this.key = key 

  if (dbNum){
    client.select(dbNum, function(err){ 
      if(err){ console.log(err); return } 
    }); 
  } 
  client.exists(key, function(err, exists){
    if(err){ console.log(err); return } 
    if (exists){ 
      _this.walk(key); 
    }else{
      //build index for the first time
      _this.buildIndex(plist, key);  
    } 
  });
}

Walker.prototype.buildIndex = function (packages, key){
  var moment = new Date.getTime() * 1000; 
  for(p in packages){ 
    client.hset(key, p, moment, redis.print)
   }
} 

Walker.prototype.walk = function(key){ 
  client.hkeys(key, function(err,res){ 
    replies.forEach(function (reply){ 
      client.hget(key, function(err,  
    
