/*
  To customize these settings it is recommended to create a copy and rename it
  to config.local.js. In config.local.js, remove anything below the "module.exports" line.

  The two config objects are merged, anything not specified in config.local.js will
  use the default specified below.
*/
let config = {
  port: 3000,

  /*
    The amount of lines to display when the page is first loaded
  */
  initialLines: 50,

  /*
    Array of files which are available to the frontend.
    Example:


    files: [
      {
        title: 'NGINX log',
        filename: '/var/log/nginx/access.log',
        type: 'vcombined',
        exclude: [
          /"(GET|POST) \/signalr/
        ]
      }
    ]


    The title can be used to give a friendly name to the tab in the frontend.
    If falsy (false, not specified, empty), the filename will be used instead.

    The type is optional and used in the frontend to apply formatting.
    In the example, "vcombined" is used to indicate a standard Combined Log Format
    with added VirtualHost.

    Exclude is optional and can be either a function or an array of regular expressions.
    If set to a function, the line to filter is passed as the first parameter and false
    must be returned for the line to appear in the tail. If set to an array, if any
    of the items are a match the line is excluded from the tail.
  */
  files: []
};


module.exports = config;


// Remove this code in config.local.js!
const fs = require('fs');
const _ = require('lodash');

if (fs.existsSync('./config.local.js'))
{
  const localConfig = require('./config.local.js');
  if (localConfig)
    _.merge(module.exports, localConfig);
}