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
    const path = require('path');
    const os = require('os');

  function SFtpNode(n) {
    RED.nodes.createNode(this, n);
    // var node = this;

    // console.log('SFTP - Config - username: ' + n.username);
    // console.log('SFTP - Config - hmac: ' + n.hmac);
    // console.log('SFTP - Config - cipher: ' + n.cipher);

    // console.log('SFTP - Config - ssh-key: ' + n.sshkey);

    let keyFile = null;
    let keyData = null;

    // New UI: key content stored in credentials (encrypted)
    if (this.credentials && this.credentials.sshkeydata) {
      keyFile = 'credentials';
      keyData = this.credentials.sshkeydata;
    }
    // Backward compat: old flows store key content directly in n.sshkey
    if (n.sshkey && !keyData) {
      const trimmed = n.sshkey.trim();
      if (trimmed.startsWith('-----BEGIN ') || trimmed.startsWith('PuTTY-User-Key-File-')) {
        keyFile = 'keyFile';
        keyData = n.sshkey;
      } else if (trimmed !== 'loaded') {
        console.log('SFTP - sshkey non contiene una chiave ma "' + trimmed.substring(0, 80) + '", provo a leggerlo come file...');
        const tryPaths = [];
        if (path.isAbsolute(trimmed)) {
          tryPaths.push(path.resolve(trimmed));
        } else {
          tryPaths.push(path.resolve(process.cwd(), trimmed));
          tryPaths.push(path.resolve('/data/', trimmed));
          tryPaths.push(path.resolve(os.homedir(), '.node-red', trimmed));
          tryPaths.push(path.resolve(os.homedir(), trimmed));
          tryPaths.push(path.resolve(os.homedir(), 'Desktop', trimmed));
          tryPaths.push(path.resolve(os.homedir(), 'Downloads', trimmed));
          tryPaths.push(path.resolve(__dirname, '../../' + trimmed));
        }
        console.log('SFTP - Cerco il file in:');
        for (const fp of tryPaths) {
          console.log('  - ' + fp);
          try {
            const content = fs.readFileSync(fp, 'utf8');
            if (content.includes('PuTTY-User-Key-File-') || content.includes('-----BEGIN ')) {
              keyData = content;
              keyFile = fp;
              console.log('SFTP - OK: chiave letta da ' + fp);
              break;
            }
          } catch (_) { /* non trovato */ }
        }
        if (!keyData) {
          console.log('SFTP - WARNING: File "' + trimmed + '" non trovato.');
          console.log('SFTP -   Se usi Docker: docker cp /percorso/locale/' + trimmed + ' <container>:/data/' + trimmed);
          console.log('SFTP -   Oppure incolla il contenuto della chiave nel campo SSH Key dell\'editor, o usa Upload.');
        }
      }
    }
    if (process.env.SFTP_SSH_KEY_FILE) {
      keyFile = process.env.SFTP_SSH_KEY_FILE;
      keyFile = require('path').resolve(__dirname, '../../' + keyFile);
      console.log('SFTP_SSH_KEY_FILE: ' + keyFile);

      try {
        keyData = fs.readFileSync(keyFile).toString();
      } catch (e) {
        keyData = null;
        console.log('SFTP - Read Key File [' + keyFile + '] Exception : ' + e);
      }
    }

    const algorithms = {
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
      ],
    };

    this.options = {
      host: n.host || 'localhost',
      port: n.port || 21,
      username: n.username,
      password: n.password,
      algorithms,
    };

    if (keyFile && keyData) {
      const isPPK = typeof keyData === 'string' && keyData.includes('PuTTY-User-Key-File-');
      if (isPPK) {
        const isEncrypted = !/Encryption:\s*none/i.test(keyData);
        this.ppkPassphrase = n.ppkpassphrase || '';
        if (isEncrypted && !this.ppkPassphrase) {
          console.log('SFTP - WARNING: PPK key is encrypted but no passphrase provided. Set the passphrase in the config or use msg.ppkpassphrase at runtime.');
        }
        console.log('SFTP - Using PPK key file' + (isEncrypted ? ' (encrypted)' : ' (unencrypted)'));
        this.rawKey = keyData;
        this.ppkDetected = true;
      } else {
        console.log('SFTP - Using key file');
        this.options.privateKey = keyData;
      }
    } else {
      console.log('SFTP - Using User/Pwd');
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

          // Lazy PPK -> PEM conversion (supports PPK v2 and v3 with Argon2id)
          console.log('SFTP - PPK state: detected=' + node.sftpConfig.ppkDetected + ' converted=' + node.sftpConfig.ppkConverted);
          if (node.sftpConfig.ppkDetected && !node.sftpConfig.ppkConverted) {
            try {
              node.status({ fill: 'gray', shape: 'ring', text: 'converting PPK...' });
              const ppkPass = msg.ppkpassphrase || node.sftpConfig.ppkPassphrase || '';
              const { PPKParser } = require('ppk-to-openssh');
              const parser = new PPKParser({ outputFormat: 'pem' });
              const result = await parser.parse(node.sftpConfig.rawKey, ppkPass);
              node.sftpConfig.options.privateKey = result.privateKey;
              console.log('SFTP - PPK converted to PEM: ' + result.algorithm);
            } catch (err) {
              const hint = err.message && err.message.includes('Passphrase')
                ? ' - Set the passphrase in the PPK config or pass it via msg.ppkpassphrase'
                : '';
              node.status({ fill: 'red', shape: 'ring', text: 'PPK conversion failed' });
              done(new Error('PPK conversion failed: ' + err.message + hint));
              console.error('SFTP - PPK conversion error: ' + err.message + hint);
              return;
            }
          }

          try {
            node.status({ fill: 'gray', shape: 'ring', text: 'connection...' });

            const opts = node.sftpConfig.options;
            const hostPort = opts.host + ':' + opts.port;
            const user = opts.username;
            let authInfo = 'none';
            if (opts.privateKey) {
              const pk = opts.privateKey;
              if (pk.includes('BEGIN OPENSSH')) authInfo = 'OpenSSH key';
              else if (pk.includes('BEGIN RSA PRIVATE KEY')) authInfo = 'RSA PEM key';
              else if (pk.includes('BEGIN EC PRIVATE KEY')) authInfo = 'EC PEM key';
              else if (pk.includes('BEGIN DSA PRIVATE KEY')) authInfo = 'DSA PEM key';
              else if (pk.includes('BEGIN PRIVATE KEY')) authInfo = 'PKCS8 PEM key';
              else authInfo = 'private key (unknown format)';
            } else if (opts.password) {
              authInfo = 'password';
            }
            console.log('SFTP - Config: ' + node.sftpConfig.id + ' -> ' + hostPort + ' as ' + user + ' (auth: ' + authInfo + ')');

            await client.connect(node.sftpConfig.options);
            node.sftpConfig.ppkConverted = true;
            node.status({ fill: 'green', shape: 'ring', text: 'connected' });
          } catch (err) {
            node.status({ fill: 'red', shape: 'ring', text: 'connection failed.' });
            console.error('SFTP - Connection error: ' + err.message);
            if (err.level) console.error('SFTP - Error level: ' + err.level);
            if (err.description) console.error('SFTP - Error description: ' + err.description);
            if (err.code) console.error('SFTP - Error code: ' + err.code);
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
              try {
                await client.put(msgData, newFile);
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
