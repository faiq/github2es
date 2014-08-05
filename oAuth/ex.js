var OAuth2 = require('./oauth2.js').OAuth2;
var clientID = 'c7fb198843777e80e7d7';
var clientSecret = '03c7a2782f65d8a140aad31da3d9b07314adbd74';
  
var oauth2 = new OAuth2(clientID,
                          clientSecret,
                          'https://github.com/',
                          'login/oauth/authorize',
                          'login/oauth/access_token',
                          null); /** Custom headers */

oauth2.getOAuthAccessToken(
    '0338ab4622fe2e88ea96',
    {'redirect_uri': 'http://127.0.0.1'},
    function (e, access_token, refresh_token, results){
    if (e) {
    console.log(e);
    res.end(e);
    } else if (results.error) {
    console.log(results);
    res.end(JSON.stringify(results));
    }
    else {
    console.log('Obtained access_token: ', access_token);
   // res.end( access_token);
    }
    });
