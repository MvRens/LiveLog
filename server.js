const express = require('express');
const nocache = require('nocache');
const md5 = require('md5');
const Tail = require('tail').Tail;
const _ = require('lodash');

const config = require('./config');


if (!Array.isArray(config.files))
{
  console.log("Error: config.files must be an array");
  return;
}

if (config.files.length == 0)
{
  console.log("Warning: config.files is empty");
}


let files = {};
_.forEach(config.files, (file) =>
{
  let fileId = md5(file.filename);
  files[fileId] = {
    filename: file.filename,
    title: file.title || file.filename,
    type: file.type || '',
    tail: null
  };
});


let app = express();
app.use(nocache());
app.use(express.static('dist'));


const expressWs = require('express-ws')(app);
let clients = {};



function initTail(fileId)
{
  if (files[fileId].tail !== null)
    return;

  let tail = {
    watcher: new Tail(files[fileId].filename, {
      fromBeginning: true
    }),
    lines: [],
    linePointer: 0
  };

  tail.lines.length = config.initialLines;

  tail.watcher.on('line', (data) =>
  {
    // TODO add line
    // TODO debounce -> notify clients
  });

  tail.watcher.on('error', (error) =>
  {
  });


  files[fileId].tail = tail;
}


function stopTail(fileId)
{
  if (files[fileId].tail === null)
    return;

  files[fileId].watcher.unwatch();
  files[fileId].tail = null;
}


function sendCurrentTail(ws, fileId)
{
  initTail(fileId);
}


function appendLine(tail)
{

}
/*
function notifyClients(payload)
{
  clients.forEach(socket => {
    socket.send(JSON.stringify(payload), (error) => {});
  });
}
*/


app.get('/api/files', (req, res) =>
{
  res.send(_.map(files, (file, fileId) =>
  {
    return {
      fileId: fileId,
      title: file.title,
      type: file.type
    };
  }));
});


app.ws('/api/live/:fileId', (ws, req) =>
{
  let fileId = req.params.fileId;
  if (!files.hasOwnProperty(fileId))
    return;

  if (clients.hasOwnProperty(fileId))
    clients[fileId].push(ws);
  else
    clients[fileId] = [ws];

  ws.on('close', () =>
  {
    if (clients.hasOwnProperty(fileId))
    {
      clients[fileId] = clients[fileId].filter(conn => (conn === ws) ? false : true);

      if (clients[fileId].length == 0)
        stopTail(fileId);
    }
  });


  sendCurrentTail(ws, fileId);
});



var server = app.listen(3000, function()
{
  var host = server.address().address;
  var port = server.address().port;

  console.log('LiveLog server running at http://%s:%s', host, port);
});
