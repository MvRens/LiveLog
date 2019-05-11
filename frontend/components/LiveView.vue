<template>
  <div>
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


  mounted()
  {
    this.connected = false;
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

      this.connect();
    }
  },


  destroyed()
  {
    this.disconnect();
  },

  // TODO after route change, reset view en reconnect

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
    }
  },


  methods: {
    connect()
    {
      if (this.connected)
        return;

      this.connected = true;


      let wsURL = 'ws://' + window.location.hostname + ':' + window.location.port + '/api/live/' + encodeURIComponent(this.fileId);
      this.websocket = new WebSocket(wsURL);

      const self = this;
      const getView = () => { return self.$refs.view; };

      this.websocket.onopen = () =>
      {
        console.log('Websocket connected');
        getView().resetLines();
      };

      this.websocket.onmessage = (event) =>
      {
        let lines = event.data.split('\n');
        let view = getView();

        forEach(lines, (line) =>
        {
          view.pushLine(line);
        });
      };

      this.websocket.onclose = () =>
      {
        console.log('Websocket closed');

        if (self.connected)
        {
          console.log('Reconnecting');
          this.disconnect();
          self.reconnect();
        }
      };

      this.websocket.onerror = (event) =>
      {
        console.error('Websocket error: ' + event);
      };
    },


    disconnect()
    {
      if (this.reconnectTimer !== null)
        clearTimeout(this.reconnectTimer);

      this.connected = false;

      if (this.websocket !== null)
      {
        this.websocket.close();
        this.websocket = null;
      }
    },


    reconnect()
    {
      if (this.reconnectTimer !== null)
        clearTimeout(this.reconnectTimer);

      const self = this;
      this.reconnectTimer = setTimeout(() =>
      {
        this.reconnectTimer = null;
        self.connect();
      }, 1000);
    }
  }
}
</script>