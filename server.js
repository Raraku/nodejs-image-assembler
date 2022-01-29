import express from "express";
import fetch from "node-fetch";
import * as fs from "fs";
import cors from "cors";
const app = express();
import path from "path";
import Blob from "node-blob";
import FormData from "form-data";

app.use(cors());
//ignore-eslint-no-global-assign
let __dirname = path.resolve();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
import multer from "multer";

const upload = multer({
  limits: { fieldSize: 2 * 1024 * 1024 * 1024 * 1024 * 1024 },
});

const port = process.env.PORT;
import * as http from "http";
import { Server } from "socket.io";
import ffmpeg from "fluent-ffmpeg";
const server = http.createServer(app);
var resolve = (file) => path.resolve(__dirname, file);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

// const io = require("socket.io")(server, {
//   cors: {
//     origin: true,
//     methods: ["GET", "POST"],
//   },
// });
// app.use(express.static(__dirname + "/public"));

function blobToFile(theBlob, fileName) {
  //A Blob() is almost a File() - it's just missing the two properties below which we will add
  theBlob.lastModifiedDate = new Date();
  theBlob.name = fileName;
  return theBlob;
}

function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error("Invalid input string");
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], "base64");

  return response;
}
let malformed = 0;

app.post("", upload.none(), (req, res) => {
  // console.log(req.body.data.length);
  // let imgs = req.body.imgs.split(" ");
  // console.log(req.text);
  console.log("data received")
  let imgs = req.body.data.split(" ");
  console.log(imgs.length);
  var timeStamp = Date.now();
  var folder = "images/" + timeStamp;
  if (!fs.existsSync(resolve(folder))) {
    fs.mkdirSync(resolve(folder), { recursive: true });
  }
  Promise.all(
    imgs.map(function (value, index) {
      if (value == "data:,") {
        malformed += 1;
        return;
      }
      var img = decodeBase64Image(value);
      var data = img.data;
      var type = img.type;
      if (type == "image/png") {
        type = "png";
      }
      return new Promise(function (resolve, reject) {
        fs.writeFile(
          path.resolve(__dirname, folder + "/img" + index + "." + type),
          data,
          "base64",
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    })
  ).then(function () {
    var proc = new ffmpeg({
      source: resolve(folder + "/img%d.png"),
      noLog: true,
    })
      .inputOptions(`-start_number ${malformed}`)
      .withFps(8)

      .on("error", function (err) {
        console.log("ERR: " + err.message);
      })
      .saveToFile(resolve("video/" + timeStamp + ".mp4"))
      .on("end", async function () {
        let file = fs.readFileSync(resolve("video/" + timeStamp + ".mp4"));
        var file2 = new Blob([file], { type: "video/mp4" });
        await saveData(req.body.json, JSON.stringify(file2));
        res.sendStatus(200);
        console.log("done");
        await cleanup(folder, timeStamp);
      });
  });
});

async function cleanup(folder, timeStamp) {
  fs.rm(folder, { recursive: true, force: true }, () => {
    fs.unlinkSync(resolve("video/" + timeStamp + ".mp4"));
  });
}

async function putFormData(url = "", data) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: "PUT", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: data, // body data type must match "Content-Type" header
  });
  return response; // parses JSON response into native JavaScript objects
}

async function saveData(data, file) {
  let formdata = new FormData();
  formdata.append("json", JSON.stringify(data));
  formdata.append("data", file);
  retry(
    () => putCollect(formdata),
    (responce) => {
      // console.log("save data response", responce);
    },
    1000
  );
}

function retry(action, then, delay, count = 0) {
  action()
    .then(then)
    .catch((e) => {
      if (count == 3) {
        return;
      }
      count += 1;
      setTimeout(() => retry(action, then, delay, count), delay);
    });
}

function callApi(api, url, data) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      let res = await api(url, data);
      if (res.ok) {
        resolve(res.json());
        // putFormData can return 409 if frame is already collected or 404 if the study is ended
        // If we reject the response the client will try to call putFormData again, which is not needed
      } else if (
        api.name == "putFormData" &&
        (res.status == 409 || res.status == 404)
      ) {
        resolve(res.json());
      } else {
        reject(res.json());
      }
    } catch (e) {
      console.log("data refused");
      reject(e);
    }
  });
}

export function putCollect(data) {
  // Added support to lambda, save function is deprecated
  return callApi(
    putFormData,
    "https://j7yyaj32p6.execute-api.eu-west-1.amazonaws.com/dev/multipart",
    data
  );
}

// io.on("connection", (socket) => {
//   console.log("hey");
//   connectedClients.push(socket.id);
//   let base64string = "";
//   socket.on("message", (data) => {
//     // console.log(data);
//     console.log(data);
//     base64string += data;
//   });
//   socket.on("close", async (reason) => {
//     console.log("saving");
//     const base64Blob = await fetch(base64string);
//     let theFile = blobToFile(base64Blob);
//     FileSaver.saveAs(base64Blob, "hello world.txt");
//   });
//   socket.on("close", () => {
//     console.log("close 2");
//   });
//   socket.on("disconnect", async (reason) => {
//     try {
//       console.log("disconnected");
//       const base64Blob = await fetch(base64string);
//       // console.log(base64Blob);
//       // let theFile = blobToFile(base64Blob);
//       fs.writeFile(
//         "video.webm",
//         Buffer(new Uint8Array(await base64Blob.blob())),
//         function (err, data) {
//           if (err) console.log("error", err);
//         }
//       ); // does not work
//       FileSaver.saveAs(base64Blob, "hello world.mp4");
//     } catch (err) {
//       console.log(err);
//     }
//   });
// });

server.listen(port, () => console.log(`Server is running on port ${port}`));
