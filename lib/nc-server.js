'use strict';

const net = require('net');
const concat = require('concat-stream');
const request = require('then-request');
const JSON = require('./json-buffer');

const server = net.createServer({allowHalfOpen: true}, c => {
  function respond(data) {
    c.end(JSON.stringify(data));
  }

  c.cached = '';
  
  c.on('data', function (data) {
    const str = data.toString('utf8');
    if (c.cached.length === 0 && str === 'ping\r\r\n') {
      c.end('pong');
      return;
    }
    c.cached += data.toString();
    if (c.cached.endsWith("\r\r\n")) {
        try {
          const req = JSON.parse(c.cached);
          request(req.method, req.url, req.options).done(function (response) {
            respond({success: true, response: response});
          }, function (err) {
            respond({success: false, error: { message: err.message }});
          });
        } catch (ex) {
          respond({success: false, error: { message: ex.message }});
        }
    }
  });
});

server.listen(+process.argv[2]);

