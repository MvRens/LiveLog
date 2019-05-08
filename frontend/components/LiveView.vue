<template>
  <div>
    <div id="log">
      <span class="line" v-for="line in lines">{{ line }}</span>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import forEach from 'lodash/forEach';

export default {
  props: [
    'fileId'
  ],

  data()
  {
    return {
      lines: []
    }
  },


  mounted()
  {
    const self = this;

    self.$options.sockets.onopen = () =>
    {
      self.lines = [];
    };

    self.$options.sockets.onmessage = (message) =>
    {
      let lines = message.data.split('\n');

      forEach(lines, (line) =>
      {
        self.lines.push(line);
      });
    };

    self.$connect('ws://' + window.location.hostname + ':' + window.location.port + '/api/live/' + self.fileId);
  },


  destroyed()
  {
    this.$disconnect();
    delete this.$options.sockets.onmessage;
    delete this.$options.sockets.onopen;
  }

  // TODO after route change, reset view en reconnect
}
</script>

<style lang="scss" scoped>
#log
{
  .line
  {
    display: block;
  }
}
</style>