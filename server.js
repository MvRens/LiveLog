const express = require('express');
const nocache = require('nocache');
const md5 = require('md5');
const Tail = require('tail').Tail;
const debounce = require('debounce');
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



function getInitialLines(fileId)
{
  if (files[fileId].tail === null)
    return;

  let tail = files[fileId].tail;
  let start = tail.linePointer;
  let lines = [];

  for (let i = start; i < tail.length; i++)
  {
    if (tail.lines[i] !== null)
      lines.push(tail.lines[i]);
  }

  for (let i = 0; i < start; i++)
  {
    if (tail.lines[i] !== null)
      lines.push(tail.lines[i]);
  }

  return lines.join('\n');
}


function initTail(fileId, onSendInitialLines)
{
  if (files[fileId].tail !== null)
  {
    onSendInitialLines(getInitialLines(fileId));
    return;
  }

  let tail = {
    watcher: new Tail(files[fileId].filename, {
      fromBeginning: true
    }),
    lines: [],
    linePointer: 0
  };

  tail.lines.length = config.initialLines;
  for (let i = 0; i < tail.lines.length; i++)
    tail.lines[i] = null;

  let broadcastLine = null;

  broadcastLine = debounce((line) =>
  {
    onSendInitialLines(getInitialLines(fileId));
    broadcastLine = (line) => {
      sendLineToClients(fileId, line);
    };
  }, 100);

  tail.watcher.on('line', (data) =>
  {
    appendLine(tail, data);
    broadcastLine(data);
  });

  tail.watcher.on('error', (error) =>
  {
    console.log('Watcher error: ' + error);
  });


  files[fileId].tail = tail;
}


function stopTail(fileId)
{
  if (files[fileId].tail === null)
    return;

  files[fileId].tail.watcher.unwatch();
  files[fileId].tail = null;
}


function sendCurrentTail(ws, fileId)
{
  initTail(fileId, (lines) =>
  {
    ws.send(lines, (error) => {});
  });
}


function appendLine(tail, line)
{
  tail.lines[tail.linePointer] = line;
  tail.linePointer++;

  if (tail.linePointer >= tail.linePointer.length)
    tail.linePointer = 0;
}


function sendLineToClients(fileId, line)
{
  if (!clients.hasOwnProperty(fileId))
    return;

  clients[fileId].forEach(ws =>
  {
    ws.send(line, (error) => {});
  });
}


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



let server = app.listen(3000, function()
{
  let host = server.address().address;
  let port = server.address().port;

  console.log('LiveLog server running at http://%s:%s', host, port);
});
