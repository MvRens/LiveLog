<template>
  <div>
    <div id="overview">
      Select the log file:<br /><br />

      <div v-for="(file, index) in files" class="file">
        [{{ index }}] <router-link :to="{ name: 'live', params: { fileId: file.fileId } }">{{ file.title }}</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: [
    'files'
  ]
}
</script>

<style lang="scss" scoped>
#overview
{
  padding: 1em;

  a
  {
    color: white;
    text-decoration: underline;
  }
}
</style>