<template>
  <div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: [
    'fileId'
  ],

  data()
  {
    return {
    }
  },


  mounted()
  {
    self.$options.sockets.onmessage = (message) =>
    {
      /*
      let data = JSON.parse(message.data);
      if (!data) return;

      switch (data.msg)
      {
        case 'change':
          self.addReloadEntity(data.type);
          self.reload();
          break;

        default:
          console.log('Unknown message type: ' + data.msg);
          console.log(data);
      }
      */

      console.log(data);
    };
  },


  destroyed()
  {
    delete this.$options.sockets.onmessage;
  }
}
</script>