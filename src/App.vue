<template>
  <v-app>
    <v-main>
      <AppLista/>
    </v-main>
  </v-app>
</template>

<script>
import AppLista from './components/AppLista.vue'

export default {
  name: 'App',

  components: {
    AppLista,
  },

  data: () => ({
    //
  }),
}
</script>
