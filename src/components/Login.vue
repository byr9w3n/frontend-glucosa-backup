<template>
  <div class="login-container">
    <div class="login-card">
      <div class="header">
        <h1>Med2Gestion</h1>
        <p>Control de Glucosa y Salud</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input 
            id="email"
            v-model="email" 
            type="email" 
            placeholder="correo@ejemplo.com" 
            required 
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            id="password"
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            required 
            :disabled="loading"
          />
        </div>

        <button type="submit" class="btn-login" :disabled="loading">
          <span v-if="!loading">Ingresar</span>
          <span v-else class="loader">Cargando...</span>
        </button>

        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>
      </form>
      
      <div class="footer">
  <p>¿No tienes cuenta? <router-link to="/registro">Regístrate aquí</router-link></p>
  <p style="margin-top: 10px; font-size: 0.8rem;">(Si eres un paciente a cargo, pide a tu tutor que te cree la cuenta)</p>
</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const hasLogo = ref(false) // Cambiar a true si tienes un logo en assets

/**
 * Gestiona el proceso de autenticación y redirección por rol
 */
const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    // 1. Intentar inicio de sesión en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (authError) throw authError

    // 2. Consultar el rol en la tabla 'perfiles' usando el ID del usuario autenticado
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', authData.user.id)
      .single()

    if (perfilError) throw perfilError

    // 3. Lógica de redirección según el rol detectado
    if (perfil.rol === 'dependiente') {
      // El adulto mayor va directo a la pantalla de ingreso de datos
      router.push('/formulario') 
    } else if (perfil.rol === 'tutor' || perfil.rol === 'usuario') {
      // Los tutores y usuarios independientes van al panel principal
      router.push('/dashboard')
    } else {
      throw new Error('Rol de usuario no reconocido.')
    }

  } catch (error) {
    console.error('Login error:', error)
    // Personalización de mensajes de error comunes
    if (error.message.includes('Invalid login credentials')) {
      errorMessage.value = 'Credenciales incorrectas. Verifica tu correo y contraseña.'
    } else {
      errorMessage.value = 'Error: ' + error.message
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.header h1 {
  margin: 10px 0 5px;
  color: #2c3e50;
  font-size: 1.8rem;
}

.header p {
  color: #7f8c8d;
  margin-bottom: 30px;
}

.form-group {
  text-align: left;
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #34495e;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #42b983;
}

.btn-login {
  width: 100%;
  padding: 14px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.1s;
}

.btn-login:hover {
  background-color: #3aa876;
}

.btn-login:active {
  transform: scale(0.98);
}

.btn-login:disabled {
  background-color: #a8d5c2;
  cursor: not-allowed;
}

.error-banner {
  background-color: #fef0f0;
  color: #f56c6c;
  padding: 12px;
  border-radius: 8px;
  margin-top: 20px;
  font-size: 0.85rem;
  border: 1px solid #fde2e2;
}

.footer {
  margin-top: 30px;
  font-size: 0.85rem;
  color: #909399;
}
</style>