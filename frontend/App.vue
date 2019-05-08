<template>
  <div id="container">
    <div id="tabs">
      <router-link to="/" active-class="active" exact>Overview</router-link>
      <router-link v-if="files !== null" v-for="file in files" :to="'/live/' + encodeURIComponent(file.fileId)" class="tab" active-class="active" exact>{{ file.title }}</router-link>
    </div>

    <div id="page-container">
      <router-view id="page" :files="files"></router-view>
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
    const self = this;

    axios.get('/api/files')
      .then((response) =>
      {
        self.files = response.data;
      })
      .catch((error) =>
      {
        console.log('Error while retrieving file list:');
        console.log(error);
      })
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

#tabs
{
  > a
  {
    color: white;
    text-decoration: none;
    padding-left: 1em;
    padding-right: 1em;
    border-right: solid 1px white;
  }
}


#page-container
{
  margin-top: 1em;
}
</style>