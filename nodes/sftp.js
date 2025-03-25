/**
 * Copyright 2017 Joe Gaska
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

// --------------------------------------------------------------------------------------------------------------
/*

TODO
    Add Get
    Add Delete

 http://ourcodeworld.com/articles/read/133/how-to-create-a-sftp-client-with-node-js-ssh2-in-electron-framework

*/
// --------------------------------------------------------------------------------------------------------------

// STILL VALIDATING CONNECTIVITY
//  -- DID validate it works with list/dir
// const fs = require('fs');

module.exports = function (RED) {
  'use strict';

  // const sftp = require('ssh2').Client;
  const fs = require('fs');

  function SFtpNode(n) {
    RED.nodes.createNode(this, n);
    // var node = this;

    // console.log('SFTP - Config - username: ' + n.username);
    // console.log('SFTP - Config - hmac: ' + n.hmac);
    // console.log('SFTP - Config - cipher: ' + n.cipher);

    // console.log('SFTP - Config - ssh-key: ' + n.sshkey);

    let keyFile = null;
    let keyData = null;

    if (n.sshkey) {
      keyFile = 'keyFile';
      keyData = n.sshkey;
    }
    if (process.env.SFTP_SSH_KEY_FILE) {
      keyFile = process.env.SFTP_SSH_KEY_FILE;
      keyFile = require('path').resolve(__dirname, '../../' + keyFile);
      console.log('SFTP_SSH_KEY_FILE: ' + keyFile);

      try {
        keyData = fs.readFileSync(keyFile).toString();
        // console.log("[http://wwww.HardingPoint.com PRIVATE KEY] " + keyData);
      } catch (e) {
        keyData = null;
        console.log('SFTP - Read Key File [' + keyFile + '] Exception : ' + e);
      }
    }

    if (keyFile && keyData) {
      console.log('SFTP - Using key file');
      // console.log('*******************');
      // console.log('SFTP - Username: ' + n.username);
      // console.log('SFTP - Using privateKey: ' + keyFile + ' Length: ' + keyData.toString().length);
      // console.log('*******************');
      this.options = {
        host: n.host || 'localhost',
        port: n.port || 21,
        username: n.username,
        password: n.password,
        privateKey: keyData,
        algorithms: {
          kex: [
            'curve25519-sha256',
            'curve25519-sha256@libssh.org',
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521',
            'diffie-hellman-group-exchange-sha256',
            'diffie-hellman-group14-sha256',
            'diffie-hellman-group15-sha512',
            'diffie-hellman-group16-sha512',
            'diffie-hellman-group17-sha512',
            'diffie-hellman-group18-sha512',
            'diffie-hellman-group-exchange-sha1',
            'diffie-hellman-group14-sha1',
            'diffie-hellman-group1-sha1',
          ],
          cipher: [
            'chacha20-poly1305@openssh.com',
            'aes128-gcm',
            'aes128-gcm@openssh.com',
            'aes256-gcm',
            'aes256-gcm@openssh.com',
            'aes128-ctr',
            'aes192-ctr',
            'aes256-ctr',
            '3des-cbc',
            'aes256-cbc',
            'aes192-cbc',
            'aes128-cbc',
            // 'arcfour256',
            // 'arcfour128',
            // 'arcfour',
            // 'blowfish-cbc',
            // 'ast128-cbc',
          ],
          serverHostKey: [
            'ssh-ed25519',
            'ecdsa-sha2-nistp256',
            'ecdsa-sha2-nistp384',
            'ecdsa-sha2-nistp521',
            'rsa-sha2-512',
            'rsa-sha2-256',
            'ssh-rsa',
            'ssh-dss',
          ],
          hmac: [
            'hmac-sha2-256-etm@openssh.com',
            'hmac-sha2-512-etm@openssh.com',
            'hmac-sha1-etm@openssh.com',
            'hmac-sha2-256',
            'hmac-sha2-512',
            'hmac-sha1',
            'hmac-md5',
            'hmac-sha2-256-96',
            'hmac-sha2-512-96',
            // 'hmac-ripemd160',
            // 'hmac-sha1-96',
            // 'hmac-md5-96',
          ],
        },
      };
    } else {
      // console.log('*******************');
      console.log('SFTP - Using User/Pwd');
      // console.log('SFTP - Username: ' + n.username);
      // console.log('SFTP - Password: ' + n.password);
      // console.log('SFTP - Using privateKey: ' + keyFile + ' Length: ' + keyData?.toString().length);
      // console.log('*******************');
      this.options = {
        host: n.host || 'localhost',
        port: n.port || 21,
        username: n.username,
        password: n.password,
        algorithms: {
          kex: [
            'curve25519-sha256',
            'curve25519-sha256@libssh.org',
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521',
            'diffie-hellman-group-exchange-sha256',
            'diffie-hellman-group14-sha256',
            'diffie-hellman-group15-sha512',
            'diffie-hellman-group16-sha512',
            'diffie-hellman-group17-sha512',
            'diffie-hellman-group18-sha512',
            'diffie-hellman-group-exchange-sha1',
            'diffie-hellman-group14-sha1',
            'diffie-hellman-group1-sha1',
          ],
          cipher: [
            'chacha20-poly1305@openssh.com',
            'aes128-gcm',
            'aes128-gcm@openssh.com',
            'aes256-gcm',
            'aes256-gcm@openssh.com',
            'aes128-ctr',
            'aes192-ctr',
            'aes256-ctr',
            '3des-cbc',
            'aes256-cbc',
            'aes192-cbc',
            'aes128-cbc',
            // 'arcfour256',
            // 'arcfour128',
            // 'arcfour',
            // 'blowfish-cbc',
            // 'ast128-cbc',
          ],
          serverHostKey: [
            'ssh-ed25519',
            'ecdsa-sha2-nistp256',
            'ecdsa-sha2-nistp384',
            'ecdsa-sha2-nistp521',
            'rsa-sha2-512',
            'rsa-sha2-256',
            'ssh-rsa',
            'ssh-dss',
          ],
          hmac: [
            'hmac-sha2-256-etm@openssh.com',
            'hmac-sha2-512-etm@openssh.com',
            'hmac-sha1-etm@openssh.com',
            'hmac-sha2-256',
            'hmac-sha2-512',
            'hmac-sha1',
            'hmac-md5',
            'hmac-sha2-256-96',
            'hmac-sha2-512-96',
            // 'hmac-ripemd160',
            // 'hmac-sha1-96',
            // 'hmac-md5-96',
          ],
        },
      };
    }
  }

  RED.nodes.registerType('sftp', SFtpNode);

  function SFtpInNode(n) {
    RED.nodes.createNode(this, n);
    this.sftp = n.sftp;
    this.operation = n.operation;
    this.filename = n.filename;
    this.fileExtension = n.fileExtension;
    this.workdir = n.workdir;
    this.sftpConfig = RED.nodes.getNode(this.sftp);

    if (this.sftpConfig) {
      const node = this;
      node.on('input', async function (msg, send, done) {
        try {
          node.workdir = node.workdir || msg.workdir || './';
          node.fileExtension = node.fileExtension || msg.fileExtension || '';

          /*SFTP options*/
          node.sftpConfig.options.host = msg.host || node.sftpConfig.options.host;
          node.sftpConfig.options.port = msg.port || node.sftpConfig.options.port;
          node.sftpConfig.options.username = msg.user || node.sftpConfig.options.username || '';
          node.sftpConfig.options.password = msg.password || node.sftpConfig.options.password || '';

          // console.log('========');
          // console.log(node.sftpConfig.options.privateKey);
          // console.log('========');

          // let conn = new sftp();

          // conn.on('ready', async function () {
          const Client = require('ssh2-sftp-client');
          const client = new Client();
          try {
            node.status({ fill: 'gray', shape: 'ring', text: 'connection...' });
            await client.connect(node.sftpConfig.options);
            node.status({ fill: 'green', shape: 'ring', text: 'connected' });
          } catch (err) {
            node.status({ fill: 'red', shape: 'ring', text: 'connection failed.' });
            done(err);
            console.error(err.message);
            return;
          }

          switch (node.operation) {
            case 'list':
              try {
                const result = await client.list(node.workdir);
                node.status({ fill: 'green', shape: 'dot', text: 'list done' });
                await client.end();
                msg.payload = {};
                msg.payload = result;
                node.send(msg);
              } catch (err) {
                node.status({ fill: 'red', shape: 'ring', text: 'list failed' });
                done(err);
                console.error(err.message);
              }
              break;

            case 'get':
              try {
                let ftpfilename = node.workdir + node.filename;
                if (msg.payload.filename) ftpfilename = msg.payload.filename;

                const result = await client.get(ftpfilename);
                await client.end();
                node.status({ fill: 'green', shape: 'dot', text: 'get done' });
                // conn.end();
                // console.log('SFTP Read Chunks ' + counter + ' Length: ' + buf.length);
                msg.payload = {};
                msg.payload.filedata = result;
                msg.payload.filename = ftpfilename;
                node.send(msg);
              } catch (err) {
                node.status({ fill: 'red', shape: 'ring', text: 'get failed' });
                done(err);
                console.error(err.message);
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
              msgData = msg.payload.filedata ? msg.payload.filedata : JSON.stringify(msg.payload);
              // console.log(newFile);
              node.status({});

              const { Readable } = require('stream');
              const buffer = new Buffer.from(msgData);
              try {
                await client.put(Readable.from(buffer), newFile);
                node.status({ fill: 'green', shape: 'dot', text: 'put done' });
                await client.end();
                msg.payload = {};
                msg.payload.filename = newFile;
                node.send(msg);
              } catch (err) {
                node.status({ fill: 'red', shape: 'ring', text: 'put failed' });
                done(err);
                console.error(err.message);
              }
              break;
            case 'rename':
              try{
                let ftpfilename = node.workdir + node.filename;
                let ftpnewfilename = node.workdir + node.newfilename;
                if (msg.payload.filename) ftpfilename = msg.payload.filename;
                if (msg.payload.newfilename) ftpnewfilename = msg.payload.newfilename;
                console.log('SFTP Renaming File: ' + ftpfilename + ' to ' + ftpnewfilename);
                await client.rename(ftpfilename, ftpnewfilename);
                node.status({ fill: 'green', shape: 'dot', text: 'rename done' });
                await client.end();
                node.send(msg);
              } catch (err) {
                node.status({ fill: 'red', shape: 'ring', text: 'rename failed' });
                done(err);
                console.error(err.message);
              }
              break;

            case 'delete':
              try {
                let ftpfilename = node.workdir + node.filename;
                if (msg.payload.filename) ftpfilename = msg.payload.filename;
                console.log('SFTP Deleting File: ' + ftpfilename);
                await client.delete(ftpfilename);
                node.status({ fill: 'green', shape: 'dot', text: 'delete done' });
                await client.end();
                msg.payload = {};
                msg.payload.filename = ftpfilename;
                node.send(msg);
              } catch (err) {
                node.status({ fill: 'red', shape: 'ring', text: 'delete failed' });
                done(err);
                console.error(err.message);
              }
              break;
          }
        } catch (error) {
          // node.error(error, msg);
          done(error);
          return;
        }
      });
    } else {
      this.error('missing sftp configuration');
      done(this.error);
    }
  }
  RED.nodes.registerType('sftp in', SFtpInNode);
};
