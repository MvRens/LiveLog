<template>
  <div id="log">
    <span class="line" v-for="line in lines">{{ line }}</span>
  </div>
</template>

<script>
import Vue from 'vue';


// Maximum number of lines to show, limited to prevent overloading the browser
const MaxLineCount = 200;

// Automatically scroll vertically when within this much pixels from the bottom
const AutoScrollDelta = 20;


export default {
  data()
  {
    return {
      lines: []
    };
  },


  mounted()
  {
    this.scrollingElement = this.getScrollingElement();
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
      this.rawPushLine(line);
    },


    rawPushLine(line)
    {
      this.lines.push(line);

      while (this.lines.length >= MaxLineCount)
        this.lines.shift();
    },


    getScrollingElement()
    {
      return document.getElementById('log');
    },


    scrollToBottom(force)
    {
      let scrollingElement = this.scrollingElement;
      let distanceFromBottom = scrollingElement.scrollHeight - scrollingElement.scrollTop - scrollingElement.clientHeight;


      if (distanceFromBottom <= AutoScrollDelta)
      {
        Vue.nextTick(() =>
        {
          scrollingElement.scrollTop = scrollingElement.scrollHeight - scrollingElement.clientHeight;
        });
      }
    }
  }
}
</script>

<style lang="scss" scoped>
#log
{
  overflow: auto;
  height: 100%;

  margin: 1em;
  border: solid 1px #000000;
  box-shadow: inset 0 0 10px #000000;
  padding: .5em;

  font-size: 10pt;

  .line
  {
    display: block;
    white-space: nowrap;
  }
}
</style>