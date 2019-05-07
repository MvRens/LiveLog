import Vue from 'vue';
import VueNativeSock from 'vue-native-websocket';
import VueRouter from 'vue-router';

import App from './App.vue';
import FileSelection from './components/FileSelection.vue';
import LiveView from './components/LiveView.vue';

//import { library } from '@fortawesome/fontawesome-svg-core';
//import { faHeartbeat, faChartLine, faHardHat, faDesktop, faCog, faCheck } from '@fortawesome/free-solid-svg-icons';
//import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';


//library.add(faHeartbeat, faChartLine, faHardHat, faDesktop, faCog, faCheck );
//Vue.component('fa', FontAwesomeIcon);


Vue.use(VueRouter);

Vue.use(VueNativeSock, 'ws://', {
  connectManually: true,
  reconnection: true
});



const router = new VueRouter({
  routes: [
    { path: '', component: FileSelection },
    { path: '/live/:fileId', component: LiveView, props: true }
  ]
});


new Vue({
  el: '#app',
  render: h => h(App),
  router,
  store
});