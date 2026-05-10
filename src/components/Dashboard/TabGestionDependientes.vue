<template>
  <div class="gestion-container">
    
    <div class="info-banner">
      <div class="banner-icon">👨‍⚕️</div>
      <div class="banner-text">
        <h3>Centro de Gestión de Pacientes</h3>
        <p>Administra las cuentas de las personas a tu cuidado. Ellos usarán su correo y la contraseña que les asignes para registrar su glucosa diariamente.</p>
      </div>
    </div>

    <div class="layout-grid">
      
      <div class="panel-card">
        <h2 class="panel-title">➕ Registrar Nuevo Paciente</h2>
        
        <form @submit.prevent="registrarDependiente" class="form-gestion">
          <div class="input-group">
            <label>Nombre Completo</label>
            <input 
              v-model="form.nombre" 
              type="text" 
              placeholder="Ej. María García" 
              required
              :disabled="cargando"
            />
          </div>

          <div class="input-group">
            <label>Correo Electrónico</label>
            <input 
              v-model="form.email" 
              type="email" 
              placeholder="paciente@correo.com" 
              required
              :disabled="cargando"
            />
          </div>

          <div class="input-group">
            <label>Contraseña Temporal</label>
            <input 
              v-model="form.password" 
              type="text" 
              placeholder="Mínimo 6 caracteres" 
              required
              minlength="6"
              :disabled="cargando"
            />
            <small>⚠️ Anota esta contraseña para entregársela al paciente.</small>
          </div>

          <button type="submit" class="btn-submit" :disabled="cargando">
            <span v-if="!cargando">Crear Cuenta de Paciente</span>
            <span v-else>Procesando... ⏳</span>
          </button>

          <transition name="fade">
            <div v-if="mensaje" :class="['status-msg', esError ? 'error' : 'success']">
              {{ mensaje }}
            </div>
          </transition>
        </form>
      </div>

      <div class="panel-card pacientes-list-card">
        <h2 class="panel-title">👥 Mis Pacientes a Cargo</h2>
        
        <div v-if="cargandoPacientes" class="loading-state">
          Cargando lista de pacientes...
        </div>

        <div v-else-if="pacientes.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>Aún no tienes pacientes registrados.</p>
          <span>Usa el formulario para añadir al primero.</span>
        </div>

        <div v-else class="pacientes-list">
          <div v-for="paciente in pacientes" :key="paciente.id" class="paciente-item">
            <div class="paciente-avatar">
              {{ paciente.nombre_completo.charAt(0).toUpperCase() }}
            </div>
            <div class="paciente-info">
              <h4>{{ paciente.nombre_completo }}</h4>
              <p>{{ paciente.email }}</p>
            </div>
            <div class="paciente-status">
              <span class="status-badge">Activo</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api' 
import { supabase } from '../../supabase'

const form = ref({
  nombre: '',
  email: '',
  password: ''
})

const cargando = ref(false)
const mensaje = ref('')
const esError = ref(false)

const pacientes = ref([])
const cargandoPacientes = ref(true)

// Al montar el componente, traemos la lista de pacientes
onMounted(() => {
  cargarPacientes()
})

const cargarPacientes = async () => {
  cargandoPacientes.value = true
  try {
    // Gracias al RLS, esto solo traerá tu propia fila y la de tus pacientes.
    // Filtramos por rol 'dependiente' para obtener solo a los pacientes.
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'dependiente')
      .order('created_at', { ascending: false })

    if (error) throw error
    pacientes.value = data || []
  } catch (error) {
    console.error("Error al cargar la lista de pacientes:", error)
  } finally {
    cargandoPacientes.value = false
  }
}

const registrarDependiente = async () => {
  cargando.value = true
  mensaje.value = ''
  esError.value = false

  try {
    await api.post('/admin/crear-dependiente', {
      nombre: form.value.nombre,
      email: form.value.email,
      password: form.value.password
    })

    esError.value = false
    mensaje.value = `¡Éxito! Cuenta creada para ${form.value.nombre}.`
    
    form.value = { nombre: '', email: '', password: '' }
    
    // Recargamos la lista automáticamente para que aparezca el nuevo paciente
    await cargarPacientes()

    // Ocultar el mensaje de éxito después de 4 segundos
    setTimeout(() => { mensaje.value = '' }, 4000)

  } catch (error) {
    esError.value = true
    console.error("Error al crear dependiente:", error)
    mensaje.value = error.response?.data?.detail || "Error al conectar con el servidor."
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.gestion-container {
  width: 100%;
}

/* --- BANNER SUPERIOR --- */
.info-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #bbf7d0;
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 30px;
}
.banner-icon { font-size: 2.5rem; }
.banner-text h3 { margin: 0 0 5px 0; color: #065f46; font-size: 1.2rem; }
.banner-text p { margin: 0; color: #065f46; font-size: 0.95rem; line-height: 1.5; }

/* --- GRID DE DOS COLUMNAS --- */
.layout-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 25px;
  align-items: start;
}

/* --- TARJETAS PANELISTAS --- */
.panel-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}
.panel-title {
  margin-top: 0;
  margin-bottom: 25px;
  font-size: 1.2rem;
  color: #111827;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 15px;
}

/* --- FORMULARIO --- */
.form-gestion { display: flex; flex-direction: column; gap: 18px; }
.input-group label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px; color: #374151; }
.input-group input { 
  width: 100%; padding: 12px 15px; border: 1px solid #d1d5db; border-radius: 10px; 
  font-size: 1rem; box-sizing: border-box; background: #f9fafb; transition: all 0.2s;
}
.input-group input:focus { outline: none; border-color: #10b981; background: #ffffff; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
.input-group small { display: block; margin-top: 6px; color: #6b7280; font-size: 0.8rem; font-weight: 500; }

.btn-submit {
  width: 100%; padding: 14px; background: linear-gradient(135deg, #10b981, #059669); color: white;
  border: none; border-radius: 10px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: transform 0.1s, box-shadow 0.2s;
  margin-top: 10px;
}
.btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
.btn-submit:disabled { background: #a7f3d0; cursor: not-allowed; }

/* --- MENSAJES FEEDBACK --- */
.status-msg { margin-top: 15px; padding: 12px; border-radius: 10px; text-align: center; font-weight: 500; font-size: 0.95rem; }
.status-msg.success { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.status-msg.error { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

/* --- LISTA DE PACIENTES --- */
.pacientes-list-card {
  background: #f9fafb; /* Ligeramente gris para diferenciar */
}
.loading-state { text-align: center; padding: 40px; color: #6b7280; font-weight: 500; }
.empty-state { text-align: center; padding: 40px 20px; color: #6b7280; }
.empty-icon { font-size: 3rem; margin-bottom: 10px; opacity: 0.5; }
.empty-state p { margin: 0 0 5px 0; font-weight: 600; font-size: 1.1rem; color: #374151; }
.empty-state span { font-size: 0.9rem; }

.pacientes-list { display: flex; flex-direction: column; gap: 15px; }
.paciente-item {
  display: flex; align-items: center; gap: 15px; background: #ffffff; padding: 15px; 
  border-radius: 12px; border: 1px solid #e5e7eb; transition: box-shadow 0.2s;
}
.paciente-item:hover { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }

.paciente-avatar {
  width: 45px; height: 45px; background: #e0e7ff; color: #4f46e5; border-radius: 50%;
  display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.2rem;
}
.paciente-info { flex: 1; }
.paciente-info h4 { margin: 0 0 3px 0; font-size: 1.05rem; color: #111827; }
.paciente-info p { margin: 0; font-size: 0.85rem; color: #6b7280; }
.status-badge { background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }

/* Animación de fade para mensajes */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* --- RESPONSIVIDAD --- */
@media (max-width: 860px) {
  .layout-grid { grid-template-columns: 1fr; }
  .info-banner { flex-direction: column; text-align: center; gap: 10px; }
}
</style>