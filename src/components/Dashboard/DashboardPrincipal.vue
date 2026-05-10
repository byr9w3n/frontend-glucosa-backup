<template>
  <div v-if="cargando" class="loading-screen">
    <div class="spinner"></div>
    <p>Preparando tu espacio...</p>
  </div>

  <div v-else class="dashboard-layout">
    
    <header class="app-header">
      <div class="header-container">
        <div class="user-profile">
          <div class="avatar" :class="perfil?.rol || 'usuario'">
            {{ perfil?.nombre_completo ? perfil.nombre_completo.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div class="user-details">
            <h1>Hola, {{ perfil?.nombre_completo ? perfil.nombre_completo.split(' ')[0] : 'Usuario' }}</h1>
            <span :class="['role-badge', perfil?.rol]">
              {{ perfil?.rol === 'tutor' ? '👨‍⚕️ Panel de Tutor' : '👤 Cuenta Personal' }}
            </span>
          </div>
        </div>
        <button @click="cerrarSesion" class="btn-logout">
          <span class="logout-icon">🚪</span> Salir
        </button>
      </div>
    </header>

    <main class="dashboard-main">
      
      <nav class="modern-tabs">
        <button 
          v-if="perfil?.rol === 'usuario'"
          @click="tabActiva = 'registro'" 
          :class="['tab-item', { active: tabActiva === 'registro' }]"
        >
          <span class="icon">📝</span> Registrar
        </button>

        <button @click="tabActiva = 'glucosa'" :class="['tab-item', { active: tabActiva === 'glucosa' }]">
          <span class="icon">📊</span>
          {{ perfil?.rol === 'tutor' ? 'Glucosa del Paciente' : 'Mis Estadísticas' }}
        </button>
        
        <button @click="tabActiva = 'medicamentos'" :class="['tab-item', { active: tabActiva === 'medicamentos' }]">
          <span class="icon">💊</span>
          {{ perfil?.rol === 'tutor' ? 'Receta del Paciente' : 'Mis Medicamentos' }}
        </button>
        
        <button 
          v-if="perfil?.rol === 'tutor'" 
          @click="tabActiva = 'dependientes'" 
          :class="['tab-item', { active: tabActiva === 'dependientes' }]"
        >
          <span class="icon">⚙️</span> Gestionar Paciente
        </button>
      </nav>

      <div class="content-card">
        <TabRegistro v-if="tabActiva === 'registro' && perfil?.rol === 'usuario'" />
        <TabEstadisticas v-if="tabActiva === 'glucosa'" />
        <TabMedicamentos v-if="tabActiva === 'medicamentos'" />
        <TabGestionDependientes v-if="tabActiva === 'dependientes' && perfil?.rol === 'tutor'" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../supabase'

// Importaciones
import TabRegistro from './TabRegistro.vue'
import TabEstadisticas from './TabEstadisticas.vue'
import TabMedicamentos from './TabMedicamentos.vue'
import TabGestionDependientes from './TabGestionDependientes.vue'

const router = useRouter()
// Inicializamos vacío, lo asignaremos dinámicamente según el rol
const tabActiva = ref('') 
const perfil = ref(null)
const cargando = ref(true)

onMounted(async () => {
  await inicializarDashboard()
})

const inicializarDashboard = async () => {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      router.push('/login')
      return
    }

    const { data: perfilData, error: perfilError } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (perfilError) throw perfilError
    perfil.value = perfilData

    // --- LÓGICA DE RUTAS Y PESTAÑA INICIAL ---
    if (perfil.value?.rol === 'dependiente') {
      router.push('/formulario') // El paciente se va a su pantalla simplificada
    } else if (perfil.value?.rol === 'tutor') {
      tabActiva.value = 'glucosa' // El tutor entra directo a las estadísticas
    } else {
      tabActiva.value = 'registro' // El usuario independiente entra a registrar
    }

  } catch (error) {
    console.error("Error al cargar perfil:", error)
    await supabase.auth.signOut()
    router.push('/login')
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
.dashboard-layout { min-height: 100vh; background-color: #f3f4f6; font-family: sans-serif; }
.loading-screen { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; color: #6b7280; }
.spinner { border: 4px solid #e5e7eb; border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.app-header { background: white; border-bottom: 1px solid #e5e7eb; padding: 15px 0; position: sticky; top: 0; z-index: 10; }
.header-container { max-width: 1100px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
.user-profile { display: flex; align-items: center; gap: 15px; }
.avatar { width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; color: white; background: #10b981; }
.avatar.tutor { background: #4f46e5; }
.user-details h1 { margin: 0; font-size: 1.2rem; }
.role-badge { font-size: 0.8rem; font-weight: 600; }
.role-badge.tutor { color: #4f46e5; }
.role-badge.usuario { color: #059669; }
.btn-logout { background: #f9fafb; border: 1px solid #e5e7eb; padding: 8px 15px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.btn-logout:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }
.dashboard-main { max-width: 1100px; margin: 20px auto; padding: 0 20px; }
.modern-tabs { display: flex; gap: 15px; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; overflow-x: auto; padding-bottom: 5px; }
.tab-item { padding: 10px 15px; border: none; background: none; cursor: pointer; font-weight: 600; color: #6b7280; border-bottom: 3px solid transparent; white-space: nowrap; transition: color 0.2s; }
.tab-item:hover { color: #111827; }
.tab-item.active { color: #10b981; border-bottom-color: #10b981; }
.content-card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); min-height: 400px; }

@media (max-width: 640px) {
  .header-container { flex-direction: column; align-items: flex-start; gap: 15px; }
  .btn-logout { align-self: flex-end; }
  .content-card { padding: 15px; }
}
</style>