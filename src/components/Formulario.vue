<script setup>
import { ref } from 'vue'
import axios from 'axios'

const valor = ref('')
const etiqueta = ref('Ayunas')
const notas = ref('')
const mostrarNotas = ref(false)
const mensaje = ref('')
const cargando = ref(false)

const guardarRegistro = async () => {
  if (!valor.value) return
  cargando.value = true
  try {
    await axios.post('https://api-glucosa.onrender.com/registro', {
      valor: valor.value,
      etiqueta: etiqueta.value,
      notas: notas.value // Ahora enviamos el comentario
    })
    mensaje.value = '¡Ya lo guardé Mamá :)!'
    valor.value = '' 
    notas.value = ''
    mostrarNotas.value = false
    setTimeout(() => mensaje.value = '', 3000)
  } catch (error) {
    mensaje.value = 'Error de conexión, enviéme un mensaje al WhatsApp Má!'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="card">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 3rem; margin-bottom: 10px;">🩸</div>
      <h1 style="margin: 0; font-size: 1.8rem; color: #111827;">Control de Glucosa</h1>
    </div>
    
    <div class="input-group">
      <label>Nivel (mg/dL)</label>
      <input type="number" pattern="\d*" v-model="valor" class="input-huge" placeholder="0">
    </div>

    <div class="input-group">
      <label>Momento del día</label>
      <select v-model="etiqueta" class="input-select">
        <option>Ayunas</option>
        <option>Post-Desayuno</option>
        <option>Post-Almuerzo</option>
        <option>Post-Cena</option>
        <option>Antes de dormir</option>
      </select>
    </div>

    <div class="input-group" style="text-align: center;">
      <button v-if="!mostrarNotas" @click="mostrarNotas = true" class="btn-text">
        💬 ¿Añadir un comentario?
      </button>
      <div v-else style="text-align: left;">
        <label>Comentario / Nota</label>
        <textarea v-model="notas" class="input-textarea" placeholder=""></textarea>
      </div>
    </div>

    <button @click="guardarRegistro" :disabled="cargando" class="btn-primary">
      {{ cargando ? 'Guardando...' : 'GUARDAR' }}
    </button>

    <p v-if="mensaje" class="success-msg">{{ mensaje }}</p>
  </div>
</template>

<style scoped>
.input-group { margin-bottom: 24px; }
.input-group label {
  display: block; font-weight: 600; color: #4b5563; margin-bottom: 8px; font-size: 1.1rem;
}
.input-huge {
  width: 100%; text-align: center; font-size: 4rem; font-weight: 700; padding: 20px 0;
  color: #111827; background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 16px;
  box-sizing: border-box; transition: border-color 0.2s;
}
.input-select {
  width: 100%; padding: 16px; font-size: 1.2rem; background-color: #f9fafb;
  border: 2px solid #e5e7eb; border-radius: 16px; box-sizing: border-box;
}
/* Estilos para las notas */
.btn-text {
  background: none; border: none; color: #6b7280; font-weight: 600; font-size: 1rem; 
  cursor: pointer; text-decoration: underline; padding: 10px; transition: color 0.2s;
}
.btn-text:hover { color: #10b981; }
.input-textarea {
  width: 100%; padding: 12px; font-size: 1rem; background-color: #f9fafb;
  border: 2px solid #e5e7eb; border-radius: 12px; box-sizing: border-box; 
  resize: vertical; min-height: 80px; font-family: inherit;
}
.input-huge:focus, .input-select:focus, .input-textarea:focus {
  outline: none; border-color: #10b981; background-color: #ffffff;
}
.success-msg {
  text-align: center; color: #059669; font-weight: bold; font-size: 1.2rem; margin-top: 20px;
}
</style>