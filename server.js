const express = require('express');
const nocache = require('nocache');
const md5 = require('md5');
const Tail = require('./lib/tail');
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



function initTail(fileId, onSendInitialLines)
{
  if (files[fileId].tail !== null)
  {
    let lines = files[fileId].tail.getTail();
    if (lines !== false)
    {
      onSendInitialLines(lines);
    }
    else
    {
      files[fileId].tail.once('tail', (lines) =>
      {
        onSendInitialLines(lines);
      });
    }

    return;
  }

  let tail = new Tail(files[fileId].filename, {
    initialLines: config.initialLines
  });

  tail.on('tail', (lines) =>
  {
    onSendInitialLines(lines);
  });

  tail.on('line', (line) =>
  {
    // TODO debounce (but unlike default debounce library, make sure to send it at least once every interval)
    sendLineToClients(fileId, line);
  });

  tail.on('error', (error) =>
  {
    console.log('Watcher error: ' + error);
  });

  files[fileId].tail = tail;
}


function stopTail(fileId)
{
  if (files[fileId].tail === null)
    return;

  files[fileId].tail.unwatch();
  files[fileId].tail = null;
}


function sendCurrentTail(ws, fileId)
{
  initTail(fileId, (lines) =>
  {
    ws.send(lines.join('\n'), (error) => {});
  });
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

  try
  {
    sendCurrentTail(ws, fileId);
  }
  catch (err)
  {
    console.log('Error sending current tail:');
    console.log(err);
  }
});



let server = app.listen(config.port, function()
{
  let host = server.address().address;
  let port = server.address().port;

  console.log('LiveLog server running at http://%s:%s', host, port);
});
