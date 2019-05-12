<template>
  <div id="log">
    <div id="vhosts">
      Virtual host:
      <select v-model="vhostFilter">
        <option value="">All</option>
        <option v-for="vhost in sortedVHosts" :value="vhost">{{ vhost }}</option>
      </select>
    </div>
    <div id="vhosts-log-container">
      <div id="vhost-log" :class="{ noVHost: vhostFilter != '' }">
        <span class="header host-header">Host</span>
        <span class="header">Time</span>
        <span class="header">IP</span>
        <span class="header">User</span>
        <span class="header">Status</span>
        <span class="header"></span>
        <span class="header">Request</span>

        <template v-for="line in filteredLines">
          <span class="host"">{{ line.host }}</span>
          <span class="time">{{ line.time.format('YYYY-MM-DD HH:mm:ss') }}</span>
          <span class="ip">{{ line.remoteAddr }}</span>
          <span class="username">{{ line.username }}</span>
          <span class="status" :class="'status-' + line.status">{{ line.status }}</span>
          <span class="requestMethod" :class="'method-' + line.requestMethod">{{ line.requestMethod }}</span>
          <span class="requestPath">{{ line.requestPath }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import filter from 'lodash/filter';
import keys from 'lodash/keys';
import moment from 'moment';

import DefaultType from './Default.vue';

/*
  Based on (NGINX example):

  log_format vcombined '$host:$server_port '
          '$remote_addr - $remote_user [$time_local] '
          '"$request" $status $body_bytes_sent '
          '"$http_referer" "$http_user_agent"';
*/
const VCombinedRegEx = /^(.*?):(\d+) (.+?) - (.+?) \[(.+?)\] "(.+?) (.+?) (.+?)" (\d+) (\d+) "(.*?)" "(.*?)"$/m;

const IdxHost = 1;
const IdxPort = 2;
const IdxRemoteAddr = 3;
const IdxUsername = 4;
const IdxTime = 5;
const IdxRequestMethod = 6;
const IdxRequestPath = 7;
const IdxRequestHTTPVersion = 8;
const IdxStatus = 9;
const IdxBodyBytesSent = 10;
const IdxReferer = 11;
const IdxUserAgent = 12;


export default {
  extends: DefaultType,

  props: [
    'file',
    'filter'
  ],

  data()
  {
    return {
      vhosts: {}
    };
  },


  watch: {
    filter()
    {
      this.scrollToBottom(true);
    }
  },


  computed: {
    vhostFilter: {
      get()
      {
        return this.filter || '';
      },

      set(newValue)
      {
        if (newValue)
          this.$router.push({ name: 'live-filtered', params: { fileId: this.file.fileId, filter: newValue } });
        else
          this.$router.push({ name: 'live', params: { fileId: this.file.fileId } });
      }
    },


    sortedVHosts()
    {
      let hosts = keys(this.vhosts);
      hosts.sort();

      return hosts;
    },


    filteredLines()
    {
      if (!this.filter)
        return this.lines;

      let filterHost = this.filter;

      return filter(this.lines, (line) =>
      {
        return line.host == filterHost;
      });
    }
  },


  methods: {
    pushLine(line)
    {
      let match = VCombinedRegEx.exec(line);
      if (match == null)
      {
        console.error('Log line does not match RegEx: ' + line);
        return;
      }

      let parsedLine = {
        host: match[IdxHost],
        port: match[IdxPort],
        remoteAddr: match[IdxRemoteAddr],
        username: match[IdxUsername],
        time: moment(match[IdxTime], 'DD/MMM/YYYY:HH:mm:ss ZZ'),
        requestMethod: match[IdxRequestMethod],
        requestPath: match[IdxRequestPath],
        requestHTTPVersion: match[IdxRequestHTTPVersion],
        status: match[IdxStatus],
        bodyBytesSent: match[IdxBodyBytesSent],
        referer: match[IdxReferer],
        userAgent: match[IdxUserAgent]
      };

      Vue.set(this.vhosts, parsedLine.host, true);
      this.rawPushLine(parsedLine);
    },


    getScrollingElement()
    {
      return document.getElementById('vhosts-log-container');
    }
  }
}
</script>

<style lang="scss" scoped>
#log
{
  height: 100%;
  padding: 1em;

  display: flex;
  flex-direction: column;
}


#vhosts
{
  padding-bottom: .5em;
}


#vhosts-log-container
{
  flex: 1;
  overflow: auto;

  border: solid 1px #000000;
  box-shadow: inset 0 0 10px #000000;
  padding: 0 .5em .5em .5em;

  font-size: 10pt;
}


$columnCount: 7;

#vhost-log
{
  display: grid;
  grid-template-columns: repeat($columnCount - 1, min-content) auto;

  &.noVHost
  {
    grid-template-columns: repeat($columnCount - 2, min-content) auto;

    .host, .host-header
    {
      display: none;
    }
  }


//  grid-column-gap: 1em;
  grid-row-gap: 0;

  & > span
  {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 1em;


    &.header
    {
      position: sticky;
      top: 0;
      background-color: #202020;
      margin-right: 0;
      padding: .25em 1em .25em 0;
    }


    &.host
    {
      color: #c0c0c0;
    }

    &.ip
    {
      color: #fffbbc;
    }

    &.requestMethod
    {
      color: green;

      &.method-POST
      {
        color: lime;
      }
    }

    &.status
    {
      &.status-200
      {
        color: green;
      }

      &.status-401
      {
        color: orange;
      }

      &.status-400, &.status-500, &.status-501, &.status-502, &.status-503
      {
        color: red;
      }
    }
  }
}
</style>