#!/usr/bin/env node

var github2es = require('../github2es')   
  , path = require('path') 
  , request = require('request')
  , argv = require('yargs').usage('A walker that goes through all packages, and updates ES with github metrics.\n').
    options('e', {
      alias: 'esUrl',
      describe: 'ID of service to perform operation on',
      demand: true
    }).
    options('a', {
      alias: 'apiKey',
      describe: 'ID of service to perform operation on',
      demand: true 
    }).
    options('c', {
      alias: 'couchUrl',
      describe: 'url of all endpoints',
      demand: true 
    }).argv; 

var worker = new github2es(argv.esUrl, argv.couchUrl, argv.apiKey, 'packages' , 259200, path.join(__dirname, '/sequence.seq')); 
setTimeout(function (){ 
worker.grabPackages(function(err, res){ 
  if (err) console.error(err)
  console.log(res + ' these packages have been updated') 
});
}, 2000 ); 
