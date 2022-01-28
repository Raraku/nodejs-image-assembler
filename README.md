# WebRTC Video/Audio Broadcast

Express web application that receives a list of base64 encoded images and relays it to a server

## Getting started

### Starting the application

Start the application using Node:

```bash
# Install dependencies for server
npm install

# Run the server
node server
```

Start the application using Docker:

```bash
# Building the image
docker build --tag imageassember .

# Run the image in a container
docker run -d -p 4000:4000 imageassembler
```

### Testing the application

The application should now be running on your localhost:4000
