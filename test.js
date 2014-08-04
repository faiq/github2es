var request = require('request') 

var opts = { 
  method: 'GET', 
  uri: 'http://faiq-es-dev.internal.npmjs.com:9200/npm/package/LOLLOL', 
  json: false 
}

request(opts, function(err, res){ 
  if (err) console.error(err)
  console.log(res.statusCode)   
})
