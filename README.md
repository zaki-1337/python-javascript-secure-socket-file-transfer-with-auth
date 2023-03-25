# python-javascript-secure-socket-file-transfer-with-auth

Python-Server and JavaScript Client Secure Socket File Transfer.
Users have their own specific resource folders which they can navigate up or down and request a file.

Requiremnts:
1. node
2. python interpreter
3. openssl (for generating public and private keys)

Usage
1. "npm install" in Client directory.
2. Generate public and private keys using the following commands:
  openssl genrsa -out private-key.pem 2048
  openssl req -new -key private-key.pem -out csr.pem
  openssl x509 -req -in csr.pem -signkey private-key.pem -out public-cert.pem
3. Copy the 'private-key.pem' file in the 'Server' folder.
   Copy the 'public-cert.pem' file into both the 'Server' and 'Client' folders.
4. "python3 server.py" to run the server.
5. "node client.js" to run the client.

Note:
The user credential are stored in a dictionary in the python server.
