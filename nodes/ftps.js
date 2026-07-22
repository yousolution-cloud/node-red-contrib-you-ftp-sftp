/**
 * Copyright 2015 Atsushi Kojo.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const ftps = require('basic-ftp');

module.exports = function (RED) {
  'use strict';
  // var fs = require('fs');

  // const ReadableStream = require('stream');

  function FtpsNode(n) {
    RED.nodes.createNode(this, n);
    // let node = this;

    this.options = {
      host: n.host || 'localhost',
      port: n.port || 21,
      secure: n.secure || false,
      secureOptions: n.secureOptions,
      user: n.user || 'anonymous',
      password: n.password || 'anonymous@',
      pass: n.password || 'anonymous@',
      connTimeout: n.connTimeout || 10000,
      pasvTimeout: n.pasvTimeout || 10000,
      keepalive: n.keepalive || 10000,
    };
  }

  RED.nodes.registerType('ftps', FtpsNode);

  function FtpsInNode(n) {
    RED.nodes.createNode(this, n);

    this.ftps = n.ftps;
    this.operation = n.operation;
    this.filename = n.filename;
    this.fileExtension = n.fileExtension;
    this.workdir = n.workdir;
    this.ftpsConfig = RED.nodes.getNode(this.ftps);

    const client = new ftps.Client();

    if (this.ftpsConfig) {
      const node = this;
      // console.log("FTP ftpsConfig: " + JSON.stringify(this.ftpsConfig));
      node.on('input', async (msg, send, done) => {
        try {
          node.workdir = node.workdir || msg.workdir || '/';
          node.fileExtension = node.fileExtension || msg.fileExtension || '';

          /*FTP options*/
          node.ftpsConfig.options.host = msg.host || node.ftpsConfig.options.host;
          node.ftpsConfig.options.port = msg.port || node.ftpsConfig.options.port;
          node.ftpsConfig.options.user = msg.user || node.ftpsConfig.options.user;
          node.ftpsConfig.options.password = msg.password || node.ftpsConfig.options.password;
          node.ftpsConfig.options.pass = msg.pass || msg.password || node.ftpsConfig.options.pass;
          node.ftpsConfig.options.secure = true;
          node.ftpsConfig.options.secureOptions = {
            rejectUnauthorized: false,
          };

          // client.ftp.verbose = true;

          try {
            await client.access(node.ftpsConfig.options);
            // console.log(await client.list());
            // await client.uploadFrom('README.md', 'README_FTP.md');
            // await client.downloadTo('README_COPY.md', 'README_FTP.md');
            // await client.remove('prova.txt');
          } catch (err) {
            console.log(err);
          }

          // const Ftp = new JSFtp(node.ftpsConfig.options);
          switch (node.operation) {
            case 'list':
              console.log('FTP List:' + node.workdir.toString());
              try {
                let data = await client.list(node.workdir);
                msg.payload = data;
                client.close();
                // client = null;
                node.send(msg);
              } catch (err) {
                client.close();
                done(err);
              }
              break;
            case 'get':
              let ftpfilename = node.workdir + node.filename;
              if (msg.payload.filename) ftpfilename = msg.payload.filename;
              let str = '';
              console.log('FTP Get:' + ftpfilename);

              const stream = require('stream');
              const dataStream = new stream.Writable({
                write: function (chunk, encoding, next) {
                  str += chunk.toString();
                  next();
                },
              });
              try {
                await client.downloadTo(dataStream, ftpfilename);
                node.status({});
                msg.payload = {};
                msg.payload.filedata = str;
                msg.payload.filename = ftpfilename;
                client.close();
                node.send(msg);
              } catch (err) {
                client.close();
                done(err);
              }

              // Ftp.get(ftpfilename, (err, socket) => {
              //   if (err) {
              //     // node.error(err, msg);
              //     done(err);
              //   } else {
              //     socket.on('data', (d) => {
              //       str += d.toString();
              //     });

              //     socket.on('close', (err) => {
              //       if (err) {
              //         // node.error(err, msg);
              //         done(err);
              //       }

              //       node.status({});
              //       msg.payload = {};
              //       msg.payload.filedata = str;
              //       msg.payload.filename = ftpfilename;
              //       node.send(msg);
              //     });
              //     socket.resume();
              //   }
              // });
              break;
            case 'put':
              let newFile = '';
              if (msg.payload.filename) {
                newFile = msg.payload.filename;
              } else if (node.filename == '') {
                let d = new Date();
                let guid = d.getTime().toString();
                if (node.fileExtension == '') node.fileExtension = '.txt';
                newFile = node.workdir + guid + node.fileExtension;
              } else {
                newFile = node.workdir + node.filename;
              }

              let msgData = '';
              if (msg.payload.filedata) msgData = msg.payload.filedata;
              else msgData = JSON.stringify(msg.payload);

              console.log('FTP Put:' + newFile);

              // let Ftp = new JSFtp(node.ftpsConfig.options);

              const { Readable } = require('stream');
              const buffer = new Buffer.from(msgData);
              try {
                await client.uploadFrom(Readable.from(buffer), newFile);
                node.status({});
                msg.payload = {};
                msg.payload.filename = newFile;
                client.close();
                node.send(msg);
              } catch (err) {
                client.close();
                done(err);
              }

              // Ftp.put(buffer, newFile, (err) => {
              //   if (err) {
              //     // node.error(err, msg);
              //     done(err);
              //   } else {
              //     node.status({});
              //     msg.payload = {};
              //     msg.payload.filename = newFile;
              //     node.send(msg);
              //   }
              // });
              break;
            case 'rename':
              try{
                let ftpfilename = node.workdir + node.filename;
                let ftpnewfilename = node.workdir + node.newfilename;
                if (msg.payload.filename) ftpfilename = msg.payload.filename;
                if (msg.payload.newfilename) ftpnewfilename = msg.payload.newfilename;
                console.log('FTPS Renaming File: ' + ftpfilename + ' to ' + ftpnewfilename);
                await client.rename(ftpfilename, ftpnewfilename);
                node.status({ fill: 'green', shape: 'dot', text: 'rename done' });
                await client.close();
                node.send(msg);
              } catch (err) {
                node.status({ fill: 'red', shape: 'ring', text: 'rename failed' });
                await client.close();
                done(err);
                console.error(err.message);
              }
              break;

            case 'delete':
              let delFile = '';
              if (msg.payload.filename) delFile = msg.payload.filename;
              else delFile = node.workdir + node.filename;
              console.log('FTP Delete:' + delFile);
              try {
                await client.remove(delFile);
                node.status({});
                msg.payload = {};
                msg.payload.filename = delFile;
                client.close();
                node.send(msg);
              } catch (err) {
                client.close();
                done(err);
              }
              // var Ftp = new JSFtp(node.ftpsConfig.options);
              // Ftp.raw('dele', delFile, (err, data) => {
              //   if (err) {
              //     // node.error(err, msg);
              //     done(err);
              //   } else {
              //     node.status({});
              //     msg.payload = {};
              //     msg.payload.filename = delFile;
              //     node.send(msg);
              //   }
              // });
              break;
          }
        } catch (error) {
          console.log('FTP Caught Error:' + error);
          client.close();
          // node.error(error, msg);
          done(error);
        }
      });
    } else {
      this.error('missing ftps configuration');
    }
  }
  RED.nodes.registerType('ftps in', FtpsInNode);
};

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// const ftp = require('basic-ftp');

// example();

// async function example() {
//   const client = new ftp.Client();
//   client.ftp.verbose = true;
//   try {
//     await client.access({
//       host: 'localhost',
//       user: 'foo',
//       password: 'pass',
//       secure: true,
//       secureOptions: {
//         rejectUnauthorized: false,
//       },
//     });
//     console.log(await client.list());
//     await client.uploadFrom('README.md', 'README_FTP.md');
//     await client.downloadTo('README_COPY.md', 'README_FTP.md');
//     // await client.remove('prova.txt');
//   } catch (err) {
//     console.log(err);
//   }
//   client.close();
// }
