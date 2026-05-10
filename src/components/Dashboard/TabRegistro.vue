<template>
  <div class="registro-container">
    <div class="panel-card">
      <h2 class="panel-title">📝 Registrar Nueva Medición</h2>
      
      <form @submit.prevent="guardarRegistro" class="form-registro">
        <div class="layout-grid">
          
          <div class="form-column">
            <div class="input-group">
              <label>Nivel de Glucosa (mg/dL)</label>
              <input 
                v-model="form.valor" 
                type="number" 
                placeholder="Ej. 110" 
                required
                :disabled="cargando"
                class="input-huge"
              />
            </div>

            <div class="input-group">
              <label>Momento del día</label>
              <select v-model="form.etiqueta" class="input-select" :disabled="cargando">
                <option value="Ayunas">Ayunas</option>
                <option value="Pre-Merienda">Pre-Merienda</option>
                <option value="Post-Comida">Post-Comida</option>
                <option value="Antes de dormir">Antes de dormir</option>
              </select>
            </div>
          </div>

          <div class="form-column">
            <div class="input-group">
              <label>Notas o Comentarios (Opcional)</label>
              <textarea 
                v-model="form.notas" 
                placeholder="¿Cómo te sientes? ¿Comiste algo diferente?"
                class="input-textarea"
                :disabled="cargando"
              ></textarea>
            </div>

            <button type="submit" class="btn-submit" :disabled="cargando">
              <span v-if="!cargando">Guardar Registro</span>
              <span v-else>Guardando... ⏳</span>
            </button>

            <transition name="fade">
              <div v-if="mensaje" :class="['status-msg', esError ? 'error' : 'success']">
                {{ mensaje }}
              </div>
            </transition>
          </div>

        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../../api' 

const form = ref({
  valor: '',
  etiqueta: 'Ayunas',
  notas: ''
})

const cargando = ref(false)
const mensaje = ref('')
const esError = ref(false)

const guardarRegistro = async () => {
  if (!form.value.valor) return

  cargando.value = true
  mensaje.value = ''
  esError.value = false

  try {
    // Usamos la API local con el interceptor que inyecta el Token
    await api.post('/registro', {
      valor: form.value.valor,
      etiqueta: form.value.etiqueta,
      notas: form.value.notas || "Sin observaciones"
    })

    esError.value = false
    mensaje.value = '¡Medición guardada correctamente!'
    
    // Limpiamos el formulario (dejamos la etiqueta como estaba por comodidad)
    form.value.valor = ''
    form.value.notas = ''

    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => { mensaje.value = '' }, 3000)

  } catch (error) {
    esError.value = true
    console.error("Error al guardar registro:", error)
    mensaje.value = error.response?.data?.detail || "Error al conectar con el servidor."
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.registro-container { width: 100%; max-width: 800px; margin: 0 auto; }
.panel-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); }
.panel-title { margin-top: 0; margin-bottom: 25px; font-size: 1.3rem; color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 15px; }

.layout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start; }
.form-column { display: flex; flex-direction: column; gap: 20px; }

.input-group label { display: block; font-weight: 600; font-size: 0.95rem; margin-bottom: 8px; color: #374151; }
.input-huge { width: 100%; padding: 15px; border: 2px solid #d1d5db; border-radius: 12px; font-size: 2rem; font-weight: bold; text-align: center; color: #111827; background: #f9fafb; transition: all 0.2s; box-sizing: border-box; }
.input-select { width: 100%; padding: 14px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 1rem; background: #f9fafb; transition: all 0.2s; box-sizing: border-box; }
.input-textarea { width: 100%; padding: 14px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 1rem; background: #f9fafb; min-height: 110px; resize: vertical; transition: all 0.2s; box-sizing: border-box; font-family: inherit; }

.input-huge:focus, .input-select:focus, .input-textarea:focus { outline: none; border-color: #10b981; background: #ffffff; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }

.btn-submit { width: 100%; padding: 16px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 12px; font-weight: bold; font-size: 1.1rem; cursor: pointer; transition: transform 0.1s, box-shadow 0.2s; margin-top: auto; }
.btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
.btn-submit:disabled { background: #a7f3d0; cursor: not-allowed; }

.status-msg { margin-top: 15px; padding: 12px; border-radius: 10px; text-align: center; font-weight: 500; font-size: 0.95rem; }
.status-msg.success { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.status-msg.error { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .layout-grid { grid-template-columns: 1fr; gap: 20px; }
}
</style>