<script setup>
// npm run dev
import { ref } from 'vue'
import './main.css' // Importamos los estilos globales
import FormularioMama from './components/Formulario.vue'
import PanelAdmin from './components/PanelAdmin.vue'

// Lógica de enrutamiento simple
const rutaActual = ref(window.location.hash)

window.addEventListener('hashchange', () => {
  rutaActual.value = window.location.hash
})
</script>

<template>
  <div class="app-container">
    <PanelAdmin v-if="rutaActual === '#admin'" @volver="window.location.hash = ''" />
    <FormularioMama v-else />
  </div>
</template>