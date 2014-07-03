#!/usr/bin/env node
var github2es = require('../github2es') 
  , request = require('request')
  , argv = require('yargs').usage('A walker that goes through all packages, and updates ES with github metrics.\n')
    .options('i', {
      alias: 'clientId',
      describe: 'Github Oauth Client key',
      demand: false 
    })
    .options('s', {
      alias: 'clientSecret',
      describe: 'ID of service to perform operation on',
      demand: false  
    }).
    options('e', {
      alias: 'esUrl',
      describe: 'ID of service to perform operation on',
      demand: true
    }).
    options('a', {
      alias: 'apiKey',
      describe: 'ID of service to perform operation on',
      demand: false 
    }).argv; 

request('http://localhost:15984/registry/_all_docs', function(err, res, body){
  if (err){
    console.log('error getting all docs');
    return
  }
  console.log(argv);
  body = JSON.parse(body);
  var worker = new github2es(body.rows, argv.esUrl, null,  argv.clientId, argv.clientSecret);
  worker.groupPackages();
});
