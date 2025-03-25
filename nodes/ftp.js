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


module.exports = function (RED) {
  'use strict';
  // var ftp = require('ftp');
  // var fs = require('fs');

  // const ReadableStream = require('stream');

  function FtpNode(n) {
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

  RED.nodes.registerType('ftp', FtpNode);

  function FtpInNode(n) {
    RED.nodes.createNode(this, n);
    this.ftp = n.ftp;
    this.operation = n.operation;
    this.filename = n.filename;
    this.fileExtension = n.fileExtension;
    this.workdir = n.workdir;
    this.ftpConfig = RED.nodes.getNode(this.ftp);


    if (this.ftpConfig) {
      const node = this;
      // console.log("FTP ftpConfig: " + JSON.stringify(this.ftpConfig));
      node.on('input', async (msg, send, done) => {
        const ftp = require('basic-ftp');
        const client = new ftp.Client();
        console.log("Creating client")

        try {
          // const client = new ftp.Client();
          node.workdir = node.workdir || msg.workdir || './';
          node.fileExtension = node.fileExtension || msg.fileExtension || '';

          /*FTP options - create local copy to avoid shared mutation*/
          const ftpOptions = {
            host: msg.host || node.ftpConfig.options.host,
            port: msg.port || node.ftpConfig.options.port,
            user: msg.user || node.ftpConfig.options.user,
            password: msg.password || node.ftpConfig.options.password,
            secure: false,
            connTimeout: node.ftpConfig.options.connTimeout,
            pasvTimeout: node.ftpConfig.options.pasvTimeout,
            keepalive: node.ftpConfig.options.keepalive,
          };

          try {
            await client.access(ftpOptions);
            // client.ftp.verbose = true;
          } catch (err) {
            console.log(err);
          }

          // const JSFtp = require('jsftp');

          // const Ftp = new JSFtp(node.ftpConfig.options);
          switch (node.operation) {
            case 'list':
              console.log('FTP List:' + node.workdir.toString());
              try {
                let data = await client.list(node.workdir);
                msg.payload = data;
                client.close();
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
              break;
          }
        } catch (error) {
          console.log('FTP Caught Error:' + error);
          // node.error(error, msg);
          done(error);
        }
      });
    } else {
      this.error('missing ftp configuration');
    }
  }
  RED.nodes.registerType('ftp in', FtpInNode);
};
