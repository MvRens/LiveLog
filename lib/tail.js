const EventEmitter = require('events');
const fs = require('fs');
const _ = require('lodash');


/*
  Similar to, and heavily based on, node-tail (https://github.com/lucagrulla/node-tail)
  but tailored for LiveLog.  Keeps track of the last N lines, so they can be sent to
  new connections while only one tail is required. Also fixes the issue where
  all lines are repeated when monitoring from the beginning if the full file is
  rewritten instead of just appended.
*/
class Tail extends EventEmitter
{
  constructor(filename, options)
  {
    super();
    const self = this;

    this.filename = filename;

    this.readBlock = this.readBlock.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.pushLine = this.pushLine.bind(this);
    this.getTail = this.getTail.bind(this);
    this.emitTail = this.emitTail.bind(this);

    this.options = _.defaults(options || {}, {
      initialLines: 10,
      separator: /[\r]{0,1}\n/,
      encoding: 'utf-8'
    });

    this.buffer = '';
    this.internalDispatcher = new EventEmitter();
    this.queue = [];

    this.tail = [];
    this.tail.length = this.options.initialLines;
    this.tailPointer = 0;
    this.tailRead = false;

    for (let i = 0, len = this.tail.length; i < len; i++)
      this.tail[i] = null;


    this.isWatching = false;
    this.internalDispatcher.on('next', () =>
    {
      self.readBlock();
    });

    this.watch();
  }


  watch()
  {
    const self = this;

    if (this.isWatching)
      return;

    this.isWatching = true;
    this.pos = 0;
    this.handleChange(this.filename, true);

    this.watcher = fs.watch(this.filename, {}, (e, filename) =>
    {
      self.handleWatchEvent(e, filename);
    });
  }


  unwatch()
  {
    if (this.watcher)
      this.watcher.close();

    this.isWatching = false;
    this.queue = [];
  }


  handleChange(filename, initial)
  {
    var stats;
    try
    {
      stats = fs.statSync(filename);
    } catch (err)
    {
      this.emit('error', err);
      return;
    }

    // Ignore completely empty files, probably a full rewrite
    if (stats.size == 0)
      return;

    // Check if the file was rewritten and is now smaller
    if (stats.size < this.pos)
    {
      this.pos = stats.size;
    }

    if (stats.size > this.pos)
    {
      this.queue.push({
        start: this.pos,
        end: stats.size,
        initial: initial
      });

      this.pos = stats.size;
      if (this.queue.length === 1)
        this.internalDispatcher.emit('next');
    }
  }


  handleRename(filename)
  {
    // MacOS sometimes throws a rename event for no reason.
    // Different platforms might behave differently.
    // see https://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener
    // filename might not be present.
    // https://nodejs.org/api/fs.html#fs_filename_argument
    // Better solution would be check inode but it will require a timeout and
    // a sync file read.
    if (filename === void 0 || filename !== this.filename)
    {
      this.unwatch();

      setTimeout((() =>
      {
        this.watch();
      }), 1000);
    }
  }


  handleWatchEvent(e, filename)
  {
    switch (e)
    {
      case 'change':
        this.handleChange(this.filename, false);
        break;;

      case 'rename':
        this.handleRename(filename);
        break;
    }
  }


  readBlock()
  {
    const self = this;

    if (this.queue.length == 0)
      return;

    let block = this.queue[0];
    if (block.end < block.start)
      // Should be prevented by handleChange
      return;

    let stream = fs.createReadStream(this.filename, {
      start: block.start,
      end: block.end - 1,
      encoding: this.options.encoding
    });

    stream.on('error', (error) =>
    {
      self.emit('error', error);
    });

    stream.on('end', () =>
    {
      if (block.initial)
        self.emitTail();

      self.queue.shift();

      if (self.queue.length > 0)
        self.internalDispatcher.emit('next');
    });

    stream.on('data', (data) =>
    {
      if (self.options.separator === null)
      {
        self.pushLine(data, block.initial);
      }
      else
      {
        self.buffer += data;
        let parts = self.buffer.split(self.options.separator);
        self.buffer = parts.pop();

        for (let i = 0, len = parts.length; i < len; i++)
          self.pushLine(parts[i], block.initial);
      }
    });
  }


  pushLine(line, initial)
  {
    this.tail[this.tailPointer] = line;
    this.tailPointer++;

    if (this.tailPointer >= this.tail.length)
      this.tailPointer = 0;

    if (!initial)
      this.emit('line', line);
  }


  getTail()
  {
    if (!this.tailRead)
      return false;

    let start = this.tailPointer;
    let lines = [];

    for (let i = start, len = this.tail.length; i < len; i++)
    {
      if (this.tail[i] !== null)
        lines.push(this.tail[i]);
    }

    for (let i = 0; i < start; i++)
    {
      if (this.tail[i] !== null)
        lines.push(this.tail[i]);
    }

    return lines;
  }


  emitTail()
  {
    if (this.tailRead)
      return;

    this.tailRead = true;

    let lines = this.getTail();
    this.emit('tail', lines);
  }
};

module.exports = Tail;