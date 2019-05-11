const express = require('express');
const nocache = require('nocache');
const md5 = require('md5');
const Tail = require('./lib/tail');
const _ = require('lodash');

const config = require('./config');


if (!Array.isArray(config.files))
{
  console.error("Error: config.files must be an array");
  return;
}

if (config.files.length == 0)
{
  console.warn("Warning: config.files is empty");
}


let files = {};
_.forEach(config.files, (file) =>
{
  let fileId = md5(file.filename);

  let filter = null;
  let exclude = file.exclude;

  if (typeof exclude == 'function')
  {
    filter = (line) =>
    {
      return !exclude(line);
    };
  }
  else if (Array.isArray(exclude) && exclude.length > 0)
  {
    filter = (line) =>
    {
      for (let i = 0, len = exclude.length; i < len; i++)
      {
        if (exclude[i].test(line))
          return false;
      }

      return true;
    };
  }
  else
  {
    console.error('Error: exclude must be a function or array in config');
  }

  files[fileId] = {
    filename: file.filename,
    title: file.title || file.filename,
    type: file.type || '',
    tail: null,
    filter: filter
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
    initialLines: config.initialLines,
    filter: files[fileId].filter
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
