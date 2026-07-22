# @yousolution/node-red-contrib-you-ftp-sftp

[![npm version](https://badge.fury.io/js/@yousolution%2Fnode-red-contrib-you-ftp-sftp.svg)](https://badge.fury.io/js/@yousolution%2Fnode-red-contrib-you-ftp-sftp)
[![Node-RED](https://img.shields.io/badge/Node--RED-3.x-red)](https://nodered.org)

Node-RED nodes for FTP, FTPS and SFTP file transfer operations.

## Install

```bash
npm install @yousolution/node-red-contrib-you-ftp-sftp
```

## Nodes

This package provides three protocol nodes, each with a **server config node** and an **input node**:

| Node | Protocol | Auth | Library |
|------|----------|------|---------|
| `ftp` + `ftp in` | FTP (plain) | Password | [basic-ftp](https://github.com/patrickjuchli/basic-ftp) |
| `ftps` + `ftps in` | FTP over implicit TLS | Password | [basic-ftp](https://github.com/patrickjuchli/basic-ftp) |
| `sftp` + `sftp in` | SFTP (SSH) | Password, SSH Key, PPK | [ssh2-sftp-client](https://github.com/theophilusx/ssh2-sftp-client) |

## Operations

All three nodes support the same four operations:

| Operation | Description |
|-----------|-------------|
| `list` | List files in the working directory |
| `get` | Download a file |
| `put` | Upload a file |
| `delete` | Delete a file |

RENAME - Set msg.payload.filename and msg.payload.newfilename Leave configuration blank to set in code.

DELETE - Set msg.payload.filename to delete the file or will use Workdir + Filename in configuration. Leave configuration blank to set in code.

---

## Server Config Nodes

### FTP / FTPS Config

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Host | string | `localhost` | Server hostname or IP |
| Port | number | `21` | Server port |
| User | string | `anonymous` | Username |
| Password | string | `anonymous@` | Password |
| Connection Timeout | number | `10000` | Connection timeout (ms) |
| PASV Timeout | number | `10000` | PASV mode timeout (ms) |
| Keepalive | number | `10000` | Keepalive interval (ms) |
| Secure | boolean | `false` | Use TLS for data channel (FTP only) |
| Secure Options | string | — | TLS options (FTP only) |

> FTPS forces `secure: true` and `rejectUnauthorized: false`.

### SFTP Config

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Host | string | `localhost` | Server hostname or IP |
| Port | number | `22` | Server port |
| Username | string | — | SSH username |
| Password | string | — | SSH password |
| SSH-Key file | file | — | PEM, OpenSSH, or PPK private key |
| PPK Passphrase | password | — | Passphrase for encrypted PPK keys |
| hmac | select | `hmac-sha2-256,hmac-sha2-512,hmac-sha1` | Allowed HMAC algorithms (multi-select) |
| cipher | select | `aes128-ctr,aes192-ctr,aes256-ctr,aes128-gcm` | Allowed ciphers (multi-select) |

---

## Input Node: Message Properties

### Input Messages (`msg`)

| Property | Type | Applicable | Description |
|----------|------|------------|-------------|
| `msg.host` | string | All | Override server host |
| `msg.port` | number | All | Override server port |
| `msg.user` | string | FTP/FTPS | Override username |
| `msg.password` | string | All | Override password |
| `msg.workdir` | string | All | Override working directory |
| `msg.payload.filename` | string | get/delete/put | File path (overrides config) |
| `msg.payload.filedata` | string/Buffer | put | File content to upload |
| `msg.ppkpassphrase` | string | SFTP only | Override PPK passphrase at runtime |

### Output Messages (`msg`)

| Operation | Output |
|-----------|--------|
| `list` | `msg.payload` — Array of file entries |
| `get` | `msg.payload.filedata` — File content, `msg.payload.filename` — Remote path |
| `put` | `msg.payload.filename` — Remote path of uploaded file |
| `delete` | `msg.payload.filename` — Deleted file path |

### Status

The node updates its status indicator during operations:

| Status | Description |
|--------|-------------|
| 🟡 `connection...` | Connecting to server |
| 🟢 `connected` | Connected successfully |
| 🟢 `list done` / `get done` / `put done` / `delete done` | Operation completed |
| 🔴 `connection failed.` | Connection failed |
| 🔴 `list failed` / ... | Operation failed |
| 🟡 `converting PPK...` | PPK key conversion in progress (SFTP only) |

---

## Authentication

### FTP / FTPS

Username and password only.

### SFTP

The SFTP node supports three authentication methods (tried in order):

1. **SSH Private Key** (PEM or OpenSSH format)
   - Upload the key file in the node config, or
   - Set the `SFTP_SSH_KEY_FILE` environment variable

2. **PPK Key** (PuTTY format, v2 and v3)
   - Upload the `.ppk` file in the node config
   - If the PPK is encrypted, provide the passphrase
   - The node automatically converts PPK to PEM using [`ppk-to-openssh`](https://github.com/cartpauj/ppk-to-openssh)
   - Supports all key types: RSA, DSA, ECDSA (P-256/P-384/P-521), Ed25519
   - Supports PPK v3 with Argon2id key derivation

3. **Password** (fallback if no key is provided)

> Pass the passphrase for encrypted keys via the config UI or at runtime via `msg.ppkpassphrase`.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SFTP_SSH_KEY_FILE` | Path to an SSH private key file (PEM/OpenSSH/PPK). Resolved relative to the project root. |

---

## Examples

### Upload a file

```javascript
msg.payload = {};
msg.payload.filename = "/remote/path/file.txt";
msg.payload.filedata = "file content";
return msg;
```

### Download a file

```javascript
msg.payload = {};
msg.payload.filename = "/remote/path/file.txt";
return msg;
```

### List directory

```javascript
msg.workdir = "/remote/path/";
return msg;
```

### Delete a file

```javascript
msg.payload = {};
msg.payload.filename = "/remote/path/file.txt";
return msg;
```

### Override connection at runtime

```javascript
msg.host = "192.168.1.100";
msg.port = 22;
msg.user = "admin";
msg.password = "secret";
msg.ppkpassphrase = "my-ppk-passphrase"; // for encrypted PPK keys
return msg;
```

---

## Changelog

See [history.md](history.md).

## License

Apache 2.0 — see [LICENSE](LICENSE).
