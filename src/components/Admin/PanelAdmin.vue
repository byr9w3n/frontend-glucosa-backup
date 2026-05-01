<script setup>
import { ref } from 'vue'
import TabEstadisticas from './TabEstadisticas.vue'
import TabMedicamentos from './TabMedicamentos.vue'

const pin = ref('')
const autenticado = ref(false)
const tabActiva = ref('glucosa') 

const verificarPin = () => {
  // Verificamos el PIN administrador
  if (pin.value === '2006') { 
    autenticado.value = true
  } else {
    alert('PIN incorrecto')
    pin.value = ''
  }
}
</script>

<template>
  <div class="card card-wide">
    <div class="header-panel">
      <div>
        <h1 style="margin: 0; font-size: 1.8rem; color: #111827;">Panel De Usuario</h1>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 0.9rem;">Gestión y Estadísticas</p>
      </div>
    </div>

    <!-- Login Box -->
    <div v-if="!autenticado" class="login-box">
      <p style="color: #6b7280; font-size: 1.1rem; margin-bottom: 15px;">Ingresa tu PIN</p>
      <input type="password" pattern="\d*" v-model="pin" class="input-pin" placeholder="">
      <button @click="verificarPin" class="btn-primary" style="margin-top: 25px; max-width: 250px;">Acceder al panel</button>
    </div>

    <div v-else>
      <!-- Contenedor de Pestañas[cite: 2] -->
      <div class="tabs-container">
        <button @click="tabActiva = 'glucosa'" :class="['tab-btn', tabActiva === 'glucosa' ? 'tab-active' : '']">📊 Glucosa</button>
        <button @click="tabActiva = 'medicamentos'" :class="['tab-btn', tabActiva === 'medicamentos' ? 'tab-active' : '']">💊 Medicamentos</button>
      </div>

      <!-- Renderizado Dinámico de Componentes -->
      <TabEstadisticas v-if="tabActiva === 'glucosa'" />
      <TabMedicamentos v-if="tabActiva === 'medicamentos'" />
    </div>
  </div>
</template>

<style scoped>
.header-panel { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; }
.login-box { text-align: center; padding: 40px 0; display: flex; flex-direction: column; align-items: center; }
.input-pin { width: 100%; max-width: 250px; text-align: center; font-size: 2.5rem; letter-spacing: 15px; padding: 15px; border: 2px solid #e5e7eb; border-radius: 16px; background: #f9fafb; transition: border 0.3s; }
.input-pin:focus { outline: none; border-color: #10b981; background: white; }
.tabs-container { display: flex; gap: 10px; margin-bottom: 25px; background: #f3f4f6; padding: 5px; border-radius: 16px; }
.tab-btn { flex: 1; background: transparent; border: none; padding: 12px; font-size: 1.1rem; font-weight: 600; color: #6b7280; border-radius: 12px; cursor: pointer; transition: all 0.3s; }
.tab-active { background: white; color: #10b981; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }

@media (max-width: 768px) {
  .card-wide { padding: 15px; }
  .input-pin { font-size: 2rem; letter-spacing: 10px; max-width: 100%; }
  .tab-btn { font-size: 0.95rem; padding: 10px 5px; }
}
</style>