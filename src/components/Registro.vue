<template>
  <div class="login-container">
    <div class="login-card">
      <div class="header">
        <h1>Crear Cuenta</h1>
        <p>Únete a Med2Gestion</p>
      </div>

      <form @submit.prevent="handleRegister" class="login-form">
        
        <div class="form-group">
          <label for="nombre">Nombre Completo</label>
          <input 
            id="nombre"
            v-model="nombre" 
            type="text" 
            placeholder="Ej. Juan Pérez" 
            required 
            :disabled="loading"
          />
        </div>

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
            placeholder="Mínimo 6 caracteres" 
            minlength="6"
            required 
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label>¿Cómo usarás la aplicación?</label>
          <div class="role-selector">
            <label class="radio-label">
              <input type="radio" v-model="rol" value="usuario" :disabled="loading" />
              <span>Para mí (Usuario Independiente)</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="rol" value="tutor" :disabled="loading" />
              <span>Cuidaré de alguien (Tutor)</span>
            </label>
          </div>
        </div>

        <button type="submit" class="btn-login" :disabled="loading">
          <span v-if="!loading">Registrarse</span>
          <span v-else class="loader">Creando cuenta...</span>
        </button>

        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="success-banner">
          {{ successMessage }}
        </div>
      </form>
      
      <div class="footer">
        <p>¿Ya tienes cuenta? <router-link to="/login">Inicia sesión aquí</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const nombre = ref('')
const email = ref('')
const password = ref('')
const rol = ref('usuario') // Por defecto
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    // 1. Crear el usuario en Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (authError) throw authError

    // 2. Si el registro fue exitoso, actualizamos la tabla 'perfiles'
    // (Recuerda que el Trigger de la BD crea el perfil por defecto, aquí lo completamos)
    if (data.user) {
      const { error: profileError } = await supabase
        .from('perfiles')
        .update({ 
          nombre_completo: nombre.value,
          rol: rol.value 
        })
        .eq('id', data.user.id)

      if (profileError) throw profileError
      
      successMessage.value = '¡Cuenta creada con éxito! Redirigiendo...'
      
      // Esperar un par de segundos para que lea el mensaje y luego enviarlo al dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }

  } catch (error) {
    console.error('Registration error:', error)
    if (error.message.includes('User already registered')) {
      errorMessage.value = 'Este correo ya está registrado.'
    } else {
      errorMessage.value = 'Error al registrar: ' + error.message
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Reutilizamos los mismos estilos de Login.vue para mantener consistencia */
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
  max-width: 450px;
}

.header {
  text-align: center;
  margin-bottom: 25px;
}

.header h1 {
  margin: 10px 0 5px;
  color: #2c3e50;
  font-size: 1.8rem;
}

.header p {
  color: #7f8c8d;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #34495e;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}

.role-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f9fafc;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: normal !important;
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
  margin-top: 10px;
}

.btn-login:disabled {
  background-color: #a8d5c2;
}

.error-banner {
  background-color: #fef0f0;
  color: #f56c6c;
  padding: 12px;
  border-radius: 8px;
  margin-top: 20px;
  font-size: 0.85rem;
  text-align: center;
}

.success-banner {
  background-color: #f0f9eb;
  color: #67c23a;
  padding: 12px;
  border-radius: 8px;
  margin-top: 20px;
  font-size: 0.85rem;
  text-align: center;
}

.footer {
  margin-top: 25px;
  text-align: center;
  font-size: 0.9rem;
}

.footer a {
  color: #42b983;
  text-decoration: none;
  font-weight: bold;
}
</style>