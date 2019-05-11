<template>
  <div id="log">
    <span class="line" v-for="line in lines">{{ line }}</span>
    <div id="eof"></div>
  </div>
</template>

<script>
import Vue from 'vue';

export default {
  data()
  {
    return {
      lines: []
    };
  },


  mounted()
  {
    this.eofElement = document.getElementById('eof');
    this.firstData = true;
  },


  watch: {
    lines(newValue)
    {
      // newValue and oldValue are the same for objects or arrays,
      // keep track of it ourselves
      if (newValue.length == 0)
        return;

      this.scrollToBottom(this.firstData);
      this.firstData = false;
    }
  },


  methods: {
    resetLines()
    {
      this.lines = [];
    },


    pushLine(line)
    {
      this.lines.push(line);
    },


    scrollToBottom(force)
    {
      let eofElement = this.eofElement;

      Vue.nextTick(() =>
      {
        // Only scroll when we are at the bottom. The #eof element is used to keep track.
        // TODO allow a few more pixels slack?
        // TODO can we use scrollTop / scrollHeight instead? which is better?
        var eofPos = eofElement.getBoundingClientRect();
        let viewportHeight = (window.innerHeight || document.documentElement.clientHeight);

        if (force || (eofPos.top <= viewportHeight))
        {
          eofElement.scrollIntoView();
        }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
#log
{
  overflow: auto;
  padding: 1em;

  .line
  {
    display: block;
    white-space: nowrap;
  }
}


#eof
{
  height: 4px;
}
</style>