<template>
  <div class="form-wrapper">
    <div class="card form-container">
      
      <div class="header-actions">
        <button @click="cerrarSesion" class="btn-logout-small">Salir</button>
      </div>

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
          <option>Pre-Merienda</option>
          <option>Post-Comida</option>
          <option>Antes de dormir</option>
        </select>
      </div>

      <div class="input-group" style="text-align: center;">
        <button v-if="!mostrarNotas" @click="mostrarNotas = true" class="btn-text">
          💬 ¿Añadir un comentario?
        </button>
        <div v-else style="text-align: left;">
          <label>Comentario / Nota</label>
          <textarea v-model="notas" class="input-textarea" placeholder="¿Cómo te sientes?"></textarea>
        </div>
      </div>

      <button @click="guardarRegistro" :disabled="cargando" class="btn-primary">
        {{ cargando ? 'Guardando...' : 'GUARDAR' }}
      </button>

      <p v-if="mensaje" :class="['status-msg', esError ? 'error-msg' : 'success-msg']">
        {{ mensaje }}
      </p>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import api from '../api' // Usamos nuestro cliente Axios con el Token inyectado

const router = useRouter()
const valor = ref('')
const etiqueta = ref('Ayunas')
const notas = ref('')
const mostrarNotas = ref(false)
const mensaje = ref('')
const cargando = ref(false)
const esError = ref(false)

const guardarRegistro = async () => {
  if (!valor.value) return
  
  cargando.value = true
  mensaje.value = ''
  esError.value = false

  try {
    // Apuntamos a tu API de FastAPI a través del interceptor
    await api.post('/registro', {
      valor: valor.value,
      etiqueta: etiqueta.value,
      notas: notas.value || "Sin observaciones"
    })
    
    mensaje.value = '¡Se guardaron los datos correctamente!'
    valor.value = '' 
    notas.value = ''
    mostrarNotas.value = false
    
    setTimeout(() => {
      mensaje.value = ''
    }, 3000)

  } catch (error) {
    console.error("Error guardando registro:", error)
    esError.value = true
    mensaje.value = 'Error al guardar. Verifica tu conexión.'
  } finally {
    cargando.value = false
  }
}

const cerrarSesion = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
.form-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.form-container {
  width: 100%;
  max-width: 450px;
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.btn-logout-small {
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-logout-small:hover {
  background: #e5e7eb;
  color: #ef4444;
}

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

.btn-primary {
  width: 100%;
  padding: 16px;
  font-size: 1.3rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s, background-color 0.2s;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  background-color: #a7f3d0;
}

.status-msg {
  text-align: center; font-weight: bold; font-size: 1.1rem; margin-top: 20px; padding: 10px; border-radius: 10px;
}
.success-msg { color: #059669; background-color: #dcfce7; }
.error-msg { color: #b91c1c; background-color: #fee2e2; }
</style>