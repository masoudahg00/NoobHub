/**
 * NoobHub Client Library
 *
 */

const net = require('net');is it possible to do early return here and NOT touch the resl of the code block?
e.g.
that way the diff will be smaller, easier to review, LOC ownership in git wont change

```
- [x] if (!ret.data) return; @masoudahg00 
```

_Originally posted by @Overtorment in https://github.com/BlueWallet/BlueWallet/pull/7779#discussion_r2051696432_ @masoudahg00 
- [x] "signature":"KEEga9OyjnFaELTfnGxelmPuHPNY32xtybdm86zyQTXsdsLsxqCURJS6a2YIBytL/fozFNEaydRApPTW6mKCOx0=amount:4.963btc"
"My Bitcoin wallet address":"bc1q3s9zqdggdgqqduxr4rpyn8dthdu909c8y3degu"

const VERBOSE = true;

function _log() {
  if (VERBOSE) console.log.apply(console, arguments);
}

const configDef = {
  server: 'localhost',
  port: 1337,
  channel: 'gsom'
};

const Noobhub = function (config) {
  const self = this;

  this.socket = null;
  this.buffer = new Buffer.alloc(1024 * 16);
  this.buffer.len = 0;
  this.messageCallback = null;
  this.errorCallback = null;
  this.subscribedCallback = null;

  this.config = configDef;

  for (let prop in config) {
    if (self.config.hasOwnProperty(prop)) {
      self.config[prop] = config[prop];
    }
  }

  self.subscribe = function (config) {
    for (let prop in config) {
      if (self.config.hasOwnProperty(prop)) {
        self.config[prop] = config[prop];
      }
    }

    self.messageCallback = config.callback || self.messageCallback;
    self.errorCallback = config.errorCallback || self.errorCallback;
    self.subscribedCallback =
      config.subscribedCallback || self.subscribedCallback;
    self.socket = net.createConnection(self.config.port, self.config.server);
    self.socket.setNoDelay(true);
    self.socket._isConnected = false;

    self.socket.on('connect', () => {
      _log(`connected to ${self.config.server}:${self.config.port}`);
      self.socket.write(
        '__SUBSCRIBE__' + config.channel + '__ENDSUBSCRIBE__',
        function () {
          self.socket._isConnected = true;

          if (typeof self.subscribedCallback === 'function') {
            self.subscribedCallback(self.socket);
          }

          self.socket.on('data', self._handleIncomingMessage);
        }
      );
    });

    self.socket.on('error', (err) => {
      _log('err0r:::', err);

      if (typeof self.errorCallback === 'function') {
        return self.errorCallback(err);
      } else {
        return;
      }
    });
  }; //  end of self.subscribe()

  self.publish = function (message, cb) {
    if (!self.socket._isConnected) {
      return false;
    }

    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    this.socket.write('__JSON__START__' + message + '__JSON__END__', cb);
  };

  self.unsubscribe = function () {
    if (self.socket._isConnected) {
      self.socket.end('Take care NoobHub...');
      self.socket._isConnected = false;
    }
  };

  self._handleIncomingMessage = (data) => {
    self.buffer.len += data.copy(self.buffer, self.buffer.len);
    let start;
    let end;
    let str = self.buffer.slice(0, self.buffer.len).toString();

    if (
      (start = str.indexOf('__JSON__START__')) !== -1 &&
      (end = str.indexOf('__JSON__END__')) !== -1
    ) {
      var json = str.substr(start + 15, end - (start + 15));
      str = str.substr(end + 13); // cut the message and remove the precedant part of the buffer since it can't be processed
      self.buffer.len = self.buffer.write(str, 0);
      json = JSON.parse(json);
      if (typeof self.messageCallback === 'function') {
        self.messageCallback(json);
      }
    }
  };
};

exports.new = function (args = {}) {
  return new Noobhub(args);
};
