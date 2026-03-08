## npm run dev
<script setup>
import { ref } from 'vue'
import axios from 'axios'

const valor = ref('')
const etiqueta = ref('Ayunas')
const mensaje = ref('')
const cargando = ref(false)

const guardarRegistro = async () => {
  if (!valor.value) return
  
  cargando.value = true
  try {
    await axios.post('https://api-glucosa.onrender.com/registro', {
  valor: valor.value,
  etiqueta: etiqueta.value,
  notas: ""
})
    
    mensaje.value = '¡Guardado con éxito!'
    valor.value = '' 
    
    setTimeout(() => mensaje.value = '', 3000)
  } catch (error) {
    mensaje.value = 'Hubo un error al conectar'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="app-container">
    <div class="card">
      <h1 class="title">Control de Glucosa</h1>
      
      <div class="form-group">
        <label class="label">Nivel (mg/dL)</label>
        <input 
          type="number" 
          pattern="\d*"
          v-model="valor" 
          class="input-number"
          placeholder="0"
        >
      </div>

      <div class="form-group">
        <label class="label">Momento del día</label>
        <div class="select-wrapper">
          <select v-model="etiqueta" class="select-time">
            <option>Ayunas</option>
            <option>Post-Desayuno</option>
            <option>Post-Almuerzo</option>
            <option>Post-Cena</option>
            <option>Antes de dormir</option>
          </select>
        </div>
      </div>

      <button 
        @click="guardarRegistro" 
        :disabled="cargando"
        class="btn-submit"
      >
        {{ cargando ? 'Guardando...' : 'GUARDAR' }}
      </button>

      <p v-if="mensaje" class="message">
        {{ mensaje }}
      </p>
    </div>
  </div>
</template>

<style>
/* Reseteo del fondo oscuro que pone Vite por defecto */
body {
  background-color: #f0fdf4; /* Un verde/blanco muy suave y relajante */
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
}

.card {
  background: white;
  padding: 35px 25px;
  border-radius: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 400px;
}

.title {
  color: #1f2937;
  text-align: center;
  font-size: 1.8rem;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 25px;
}

.label {
  display: block;
  color: #4b5563;
  font-size: 1.1rem;
  margin-bottom: 10px;
  font-weight: 600;
}

.input-number {
  width: 100%;
  text-align: center;
  font-size: 4rem;
  font-weight: bold;
  height: 110px;
  color: #111827;
  background-color: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.input-number:focus {
  outline: none;
  border-color: #10b981;
  background-color: white;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

.select-time {
  width: 100%;
  padding: 18px;
  font-size: 1.3rem;
  color: #1f2937;
  background-color: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  box-sizing: border-box;
  appearance: none; /* Quita la flecha fea por defecto en algunos móviles */
  transition: all 0.3s ease;
}

.select-time:focus {
  outline: none;
  border-color: #10b981;
  background-color: white;
}

/* Pequeño truco para poner una flecha personalizada en el select */
.select-wrapper {
  position: relative;
}
.select-wrapper::after {
  content: '▼';
  font-size: 1rem;
  color: #9ca3af;
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.btn-submit {
  width: 100%;
  background-color: #10b981;
  color: white;
  border: none;
  padding: 20px;
  font-size: 1.4rem;
  font-weight: bold;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.1s, background-color 0.3s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  margin-top: 10px;
}

.btn-submit:active {
  transform: scale(0.97);
}

.btn-submit:disabled {
  background-color: #9ca3af;
  box-shadow: none;
}

.message {
  text-align: center;
  color: #059669;
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 20px;
  min-height: 1.5rem;
}
</style>