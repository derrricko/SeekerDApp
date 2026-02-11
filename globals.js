import {Buffer} from 'buffer';

global.Buffer = Buffer;

if (typeof global.process === 'undefined') {
  global.process = require('process');
}
global.process.version = 'v16.0.0';
global.process.browser = true;

if (typeof global.location === 'undefined') {
  global.location = {protocol: 'file:'};
}

if (typeof global.btoa === 'undefined') {
  global.btoa = str => Buffer.from(str, 'binary').toString('base64');
}

if (typeof global.atob === 'undefined') {
  global.atob = b64 => Buffer.from(b64, 'base64').toString('binary');
}
