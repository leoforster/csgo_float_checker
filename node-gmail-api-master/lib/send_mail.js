// (function() {
'use strict';

var fs = require('fs');
var googleAuth = require('google-auth-library');
var google = require('googleapis');

var getOAuth2Client = function(cb) {
// Load client secrets
fs.readFile('./node-gmail-api-master/lib/client_secret.json', function(err, data) {
    if (err) {
    return cb(err);
    }
    var credentials = JSON.parse(data);
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Load credentials
    fs.readFile('./node-gmail-api-master/lib/gmail-credentials.json', function(err, token) {
    if (err) {
        return cb(err);
    } else {
        oauth2Client.credentials = JSON.parse(token);
        return cb(null, oauth2Client);
    }
    });
});
}

var sendSampleMail = function(auth, subject, message, cb) {
var gmailClass = google.gmail('v1');

var email_lines = [];

email_lines.push('From: ');
email_lines.push('To: ');
email_lines.push('Content-type: text/html;charset=iso-8859-1');
email_lines.push('MIME-Version: 1.0');
email_lines.push('Subject: ' + subject);
email_lines.push('');
email_lines.push(message);

var email = email_lines.join('\r\n').trim();

var base64EncodedEmail = new Buffer(email).toString('base64');
base64EncodedEmail = base64EncodedEmail.replace(/\+/g, '-').replace(/\//g, '_');

gmailClass.users.messages.send({
    auth: auth,
    userId: 'me',
    resource: {
    raw: base64EncodedEmail
    }
}, cb);
}

exports.getOAuth2Client = getOAuth2Client;
exports.sendSampleMail = sendSampleMail;

//     getOAuth2Client(function(err, oauth2Client
//     ) {
//     if (err) {
//         console.log('err:', err);
//     } else {
//         sendSampleMail(oauth2Client, function(err, results) {
//         if (err) {
//             console.log('err:', err);
//         } else {
//             console.log(results);
//         }
//         });
//     }
//     });
// })();

