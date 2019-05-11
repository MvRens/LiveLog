import Vue from 'vue';
import VueRouter from 'vue-router';

import App from './App.vue';
import Overview from './components/Overview.vue';
import LiveView from './components/LiveView.vue';


Vue.use(VueRouter);

const router = new VueRouter({
  routes: [
    { name: 'overview', path: '', component: Overview },
    { name: 'live', path: '/live/:fileId', component: LiveView, props: true,
      children: [
        {
          name: 'live-filtered',
          path: ':filter',
          component: LiveView,
          props: true
        }
      ]
    }
  ]
});


new Vue({
  el: '#app',
  render: h => h(App),
  router
});