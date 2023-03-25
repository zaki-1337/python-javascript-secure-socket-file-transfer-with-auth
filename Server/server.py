import socket
import ssl
import os
import json

HOST = '127.0.0.1' # socket.gethostbyname(socket.gethostname())
PORT = 1337
ADDR = (HOST,PORT)
SIZE = 1024
FORMAT = 'utf-8'

ROOT = 'SERVER DATA'

userCreds = {'User 1':'Pass 1', 'User 2':'Pass 2'}

context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
context.load_cert_chain(certfile='public-cert.pem', keyfile='private-key.pem')

def main():
    print("Server is starting.");
    
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM,0);
    server.bind(ADDR);
    
    server.listen(5)
    
    secureSocket=context.wrap_socket(server, server_side=True)
    print(f'Server listening on {HOST}:{PORT}')
    
    while True:
        connection, address = secureSocket.accept()
        print(f"[NEW CONNECTION] {address} connected.")
        
        while True:
            loginDetails = connection.recv(1024).decode('utf-8')
            # print(loginDetails)
            loginDetails = json.loads(loginDetails)
        
            userName = loginDetails['uname']
            passWord = loginDetails['pass']
        
            if(userCreds.get(userName) and userCreds[userName]==passWord):
                    connection.send('Logged in.'.encode('utf-8'))
                    print(f'{userName} logged in.')
                    break
            else:
                connection.send('Invalid credentials.'.encode('utf-8'))
                continue
        
        # print([f for f in os.walk(f'Server Data/{userName}/')])
        CURRENT_DIRECTORY = f'{ROOT}/{userName}'
        
        while True:
            availableResources = os.listdir(CURRENT_DIRECTORY);
            availableResources = str(availableResources)
            availableResources = availableResources.encode()
            
            try:
                connection.send(availableResources)
            except:
                # print(f"[DISCONNECTED] {address} disconnected.")
                break
            
            print("Available resources list sent.")
            
            resourceName = connection.recv(1024).decode('utf-8')
            if(resourceName == '..'):
                    if(CURRENT_DIRECTORY != f'{ROOT}/{userName}'):
                        CURRENT_DIRECTORY=os.path.normpath(CURRENT_DIRECTORY+ os.sep + os.pardir)
                    continue
            if(not resourceName):
                print(f"[DISCONNECTED] {address} disconnected.")
                continue
            print("Received the resource name.")
            
            CURRENT_DIRECTORY = f'{CURRENT_DIRECTORY}/{resourceName}'
            
            if(os.path.isfile(CURRENT_DIRECTORY)):
                connection.send('Sending File...'.encode('utf-8'))
                file = open(CURRENT_DIRECTORY, "rb")
                data = file.read(SIZE)
            
                while data:
                    connection.send(data)
                    data = file.read(SIZE)
                print("File sent.")
            
                file.close()
                connection.close() 
                print(f"[DISCONNECTED] {address} disconnected.")
                break
                
            else:
                continue
            
        
if __name__ == "__main__":
    main()