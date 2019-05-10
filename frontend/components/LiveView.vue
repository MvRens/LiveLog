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
    this.$disconnect();
    delete this.$options.sockets.onmessage;
    delete this.$options.sockets.onopen;
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
      const self = this;

      self.$options.sockets.onopen = () =>
      {
        self.lines = [];
      };

      self.$options.sockets.onmessage = (message) =>
      {
        let lines = message.data.split('\n');
        let view = self.$refs.view;

        forEach(lines, (line) =>
        {
          view.pushLine(line);
        });
      };

      self.$connect('ws://' + window.location.hostname + ':' + window.location.port + '/api/live/' + self.fileId);
    }
  }
}
</script>