<script setup>
// Solo necesitamos importar los estilos globales.
// Los componentes ya no se importan aquí, el Router se encarga de eso.
import './main.css' 
</script>

<template>
  <router-view></router-view>
</template>

<style>
/* Si tenías estilos globales en App.vue, puedes mantenerlos. 
   Por ahora nos aseguramos de que ocupe toda la pantalla */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.app-container {
  min-height: 100vh;
}
</style>