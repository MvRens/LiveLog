<template>
  <div id="container">
    <div id="tabs">
      <router-link to="/" class="tab" active-class="active" exact>Files</router-link>
      <!--<router-link v-for="" to="/" class="tab" active-class="active" exact>Files</router-link>-->
    </div>

    <div id="page-container">
      <router-view id="page"></router-view>
    </div>
  </div>
</template>

<script>
import axios from 'axios';


export default {
  data() {
    return {
      files: null
    };
  },


  mounted()
  {
  }
};
</script>

<style lang="scss">
html
{
  height: 100%;
}

body
{
  height: 100%;

  background-color: black;
  background-image: radial-gradient(at top, #404040, black);
  background-repeat: no-repeat;
  background-attachment: fixed;

  color: white;
  font-family: 'Courier New', monospace;
  font-size: 12pt;
}
</style>