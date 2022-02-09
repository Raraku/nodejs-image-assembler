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

After that, you just need to visit localhost:4000 to connect to the server as a client and you should get the video that is streamed from the broadcaster.


```bash
Heroku build commands
docker build -t <image name> .
docker tag <image_name> registry.heroku.com/<project_name>
docker push registry.heroku.com/<project_name>/web
heroku container:release web -a <project_name>
```
