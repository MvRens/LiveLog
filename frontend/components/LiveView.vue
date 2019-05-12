<template>
  <div>
    <div id="status" v-if="statusVisible">
      <span class="statusText">{{ statusText }}</span>
    </div>
    <component :is="getViewType" :file="file" :filter="filter" ref="view"></component>
  </div>
</template>

<script>
import axios from 'axios';
import forEach from 'lodash/forEach';
import find from 'lodash/find';

import DefaultType from './types/Default.vue';
import VCombinedType from './types/VCombined.vue';

export default {
  props: [
    'files',
    'fileId',
    'filter'
  ],


  data()
  {
    return {
      status: 'connecting'
    };
  },


  mounted()
  {
    this.websocket = null;
    this.reconnectTimer = null;

    if (this.file !== null)
      this.connect();
  },


  watch:
  {
    file(newValue)
    {
      if (newValue == null)
        return;

      this.disconnect();
      this.connect();
    }
  },


  destroyed()
  {
    this.disconnect();
  },


  computed: {
    file()
    {
      if (this.files == null)
        return null;

      const fileId = this.fileId;
      return find(this.files, (file) =>
      {
        return file.fileId == fileId;
      });
    },


    getViewType()
    {
      if (this.file == null)
        return null;

      switch (this.file.type)
      {
        case 'vcombined':
          return VCombinedType;

        default:
          return DefaultType;
      }
    },


    statusVisible()
    {
      return this.status != 'connected';
    },


    statusText()
    {
      switch (this.status)
      {
        case 'connecting':
          return 'Connecting...';

        case 'waitingForData':
          return 'Connected, waiting for data...';

        case 'disconnected':
          return 'Disconnected, retrying in 1 second';
      }

      return '';
    }
  },


  methods: {
    connect()
    {
      if (this.connected)
        return;

      this.connected = true;
      this.status = 'connecting';


      let wsURL = 'ws://' + window.location.hostname + ':' + window.location.port + '/api/live/' + encodeURIComponent(this.fileId);

      let websocket = new WebSocket(wsURL);
      const getView = () => { return this.$refs.view; };


      // For testing purposes - note that it is not cleared when changing the view,
      // so they will stack and bleed into other logs.
      /*
      setInterval(() =>
      {
        getView().pushLine('test:80 127.0.0.1 - - [' + moment().format('DD/MMM/YYYY:HH:mm:ss ZZ') + '] ' +
                           '"POST / HTTP/1.1" 200 69 "-" "Totally real user agent"');
      }, 1000);
      */


      websocket.onopen = () =>
      {
        console.log('Websocket connected');
        this.status = 'waitingForData';
        getView().resetLines();
      };

      websocket.onmessage = (event) =>
      {
        this.status = 'connected';

        let lines = event.data.split('\n');
        let view = getView();

        forEach(lines, (line) =>
        {
          view.pushLine(line);
        });
      };

      websocket.onclose = () =>
      {
        console.log('Websocket closed unexpectedly, reconnecting');
        this.disconnect();
        this.reconnect();
      };

      websocket.onerror = (event) =>
      {
        console.error('Websocket error: ' + event);
      };

      this.websocket = websocket;
    },


    disconnect()
    {
      if (this.reconnectTimer !== null)
        clearTimeout(this.reconnectTimer);

      this.connected = false;
      this.status = 'disconnected';

      if (this.websocket !== null)
      {
        this.websocket.onopen = null;
        this.websocket.onmessage = null;
        this.websocket.onclose = null;
        this.websocket.onerror = null;

        this.websocket.close();
        this.websocket = null;
      }
    },


    reconnect()
    {
      if (this.reconnectTimer !== null)
        clearTimeout(this.reconnectTimer);

      this.reconnectTimer = setTimeout(() =>
      {
        this.reconnectTimer = null;
        this.connect();
      }, 1000);
    }
  }
}
</script>


<style lang="scss" scoped>
#status
{
  position: fixed;
  left: 0;
  right: 0;
  bottom: 1em;
  text-align: center;

  .statusText
  {
    background-color: #fffbbc;
    color: black;
    padding: .5em;
    box-shadow: 3px 3px 10px 0px black;
  }
}
</style>