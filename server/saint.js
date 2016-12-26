const https = require('https');
const querystring = require('querystring');
const Promise = require('bluebird');


const saintLogin = (id, pass) => {
  return new Promise((resolve, reject) => {
    const data = querystring.stringify({
      login_submit : "on",
      login_do_redirect : "1",
      no_cert_storing : "on",
      j_authscheme : "default",
      j_user : id,
      j_password : pass
    });
    const options = {
      host: 'saint.sogang.ac.kr',
      port: 443,
      path: '/irj/portal',
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US) AppleWebKit/534.4 (KHTML, like Gecko) Chrome/6.0.481.0 Safari/534.4',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    var login = true;
    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      response.on('data', (d) => {
        if ((""+d).indexOf("<title>SAINT") == -1)
          login = false;
      });
      response.on('end',() => {
        resolve(login);
      });
    });
    request.write(data);
    request.end();
    request.on('error', (e) => {
      reject(e);
    });
  });
}


module.exports = saintLogin;
