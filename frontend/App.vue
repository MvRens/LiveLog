<template>
  <div id="container">
    <div id="tabs">
      <router-link :to="{ name: 'overview' }" active-class="active" exact>Overview</router-link>
      <router-link v-if="files !== null" v-for="file in files" :key="file.fileId" :to="{ name: 'live', params: { fileId: file.fileId } }" class="tab" active-class="active">{{ file.title }}</router-link>
    </div>

    <div id="page-container">
      <router-view id="page" :files="files"></router-view>
    </div>
  </div>
</template>

<script>
import axios from 'axios';


export default {
  data()
  {
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
      });
  }
};
</script>

<style lang="scss">
html
{
  height: 100%;
  margin: 0;
  padding: 0;
}

body
{
  height: 100%;
  margin: 0;
  padding: 0;

  background-color: black;
  background-image: radial-gradient(at top, #404040, black);
  background-repeat: no-repeat;
  background-attachment: fixed;

  color: white;
  font-family: 'Courier New', monospace;
  font-size: 12pt;
}


#container
{
  height: 100%;

  display: flex;
  flex-direction: column;
}


#tabs
{
  background-color: black;
  padding-top: .5em;
  padding-bottom: .5em;
  border-bottom: solid 1px black;

  > a
  {
    color: white;
    text-decoration: none;
    padding-top: .5em;
    padding-bottom: .5em;
    padding-left: 1em;
    padding-right: 1em;

    &.active
    {
      background-color: #404040;
    }
  }
}


#page-container
{
  flex: 1;
  overflow: hidden;

  display: flex;
}

#page
{
  flex: 1;
  overflow: hidden;

  display: flex;
  flex-direction: column;
}

::-webkit-scrollbar
{
  width: 10px;
}

::-webkit-scrollbar-track
{
  background: transparent;
}

::-webkit-scrollbar-thumb
{
  background: #202020;

  &:hover
  {
    background: #404040;
  }
}


select
{
  background-color: #202020;
  color: white;
  font-family: 'Courier New', monospace;
  border: solid 1px #404040;
}
</style>