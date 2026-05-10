<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api' // <-- Usamos la instancia local con Token

const medicamentos = ref([])
const cargando = ref(false)

const fotoSeleccionada = ref(null)
const subiendoFoto = ref(false)

const modoEdicion = ref(false)
const formMed = ref({ id: null, nombre: '', dosis: '', instrucciones: '', foto_url: '' })

onMounted(() => {
  cargarMedicamentos()
})

const abrirFoto = (url) => { fotoSeleccionada.value = url }
const cerrarFoto = () => { fotoSeleccionada.value = null }

const cargarMedicamentos = async () => {
  cargando.value = true
  try {
    const respuesta = await api.get('/medicamentos') // <-- API Local
    medicamentos.value = respuesta.data
  } catch (error) { 
    console.error(error) 
  } finally { 
    cargando.value = false 
  }
}

const manejarSubidaFoto = async (event) => {
  const archivo = event.target.files[0];
  if (!archivo) return;

  subiendoFoto.value = true;
  const formData = new FormData();
  formData.append("file", archivo);

  try {
    const respuesta = await api.post('/upload-foto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    formMed.value.foto_url = respuesta.data.url;
  } catch (error) {
    console.error("Error al subir foto", error);
    alert("No se pudo subir la imagen.");
  } finally {
    subiendoFoto.value = false;
  }
}

const guardarMedicamento = async () => {
  if (!formMed.value.nombre || !formMed.value.dosis) return alert("Nombre y Dosis son obligatorios");
  try {
    if (modoEdicion.value) {
      await api.put(`/medicamentos/${formMed.value.id}`, formMed.value)
    } else {
      await api.post('/medicamentos', formMed.value)
    }
    await cargarMedicamentos()
    cancelarEdicion()
  } catch (error) { 
    console.error("Error al guardar medicamento", error) 
  }
}

const editarMedicamento = (med) => {
  modoEdicion.value = true
  formMed.value = { ...med }
}

const eliminarMedicamento = async (id) => {
  if (!confirm("¿Seguro que deseas eliminar este medicamento?")) return;
  try {
    await api.delete(`/medicamentos/${id}`)
    await cargarMedicamentos()
  } catch (error) { 
    console.error("Error al eliminar", error) 
  }
}

const cancelarEdicion = () => {
  modoEdicion.value = false
  formMed.value = { id: null, nombre: '', dosis: '', instrucciones: '', foto_url: '' }
}
</script>

<template>
  <div class="tab-medicamentos-wrapper">
    <div class="med-form-card">
      <h3 style="margin-top: 0; color: #1f2937;">{{ modoEdicion ? 'Editar Medicamento' : 'Añadir Nuevo Medicamento' }}</h3>
      
      <div class="form-row">
        <div class="form-col">
          <label class="form-label">Nombre</label>
          <input type="text" v-model="formMed.nombre" class="form-input">
        </div>
        <div class="form-col">
          <label class="form-label">Dosis</label>
          <input type="text" v-model="formMed.dosis" class="form-input">
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label class="form-label">Instrucciones (Horario)</label>
        <input type="text" v-model="formMed.instrucciones" class="form-input">
      </div>

      <div style="margin-bottom: 20px; padding-top: 5px;">
        <label class="form-label">Foto del medicamento (Opcional)</label>
        <input type="file" accept="image/*" @change="manejarSubidaFoto" class="form-input" style="padding: 8px;">
        
        <div v-if="subiendoFoto" style="color: #10b981; font-size: 0.9rem; margin-top: 8px; font-weight: bold;">
          ⏳ Subiendo imagen al servidor...
        </div>
        
        <div v-if="formMed.foto_url" style="margin-top: 15px; display: flex; align-items: flex-end; gap: 10px;">
          <img :src="formMed.foto_url" style="max-height: 100px; border-radius: 8px; border: 2px solid #e5e7eb;">
          <button @click="formMed.foto_url = ''" class="btn-outline" style="color: #ef4444; border-color: #ef4444; padding: 6px 12px; font-size: 0.9rem;">
            Quitar Foto
          </button>
        </div>
      </div>
      
      <div class="action-row">
        <button @click="guardarMedicamento" :disabled="subiendoFoto" class="btn-primary" style="padding: 12px; font-size: 1rem; width: 100%;">
          {{ modoEdicion ? 'Actualizar' : 'Guardar' }}
        </button>
        <button v-if="modoEdicion" @click="cancelarEdicion" class="btn-outline" style="width: 100%;">Cancelar</button>
      </div>
    </div>

    <h3 style="color: #1f2937; margin-top: 30px;">Receta Actual</h3>
    <div v-if="cargando" style="color: #6b7280; padding: 20px; text-align: center;">Cargando medicamentos...</div>
    <div v-else class="modern-table-container">
      <table class="modern-table">
        <thead>
          <tr><th>Foto</th><th>Medicamento</th><th>Dosis</th><th>Instrucciones</th><th style="text-align: right;">Acciones</th></tr>
        </thead>
        <tbody>
          <tr v-if="medicamentos.length === 0"><td colspan="5" style="text-align: center; color: #6b7280; padding: 20px;">No hay medicamentos registrados.</td></tr>
          <tr v-for="med in medicamentos" :key="med.id">
            <td style="width: 60px; text-align: center; vertical-align: middle;">
              <img v-if="med.foto_url" :src="med.foto_url" @click="abrirFoto(med.foto_url)" class="img-thumbnail" style="width: 45px; height: 45px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; cursor: pointer;">
              <span v-else style="font-size: 1.8rem; display: block;">💊</span>
            </td>
            <td style="font-weight: 600; color: #111827;">{{ med.nombre }}</td>
            <td style="color: #4b5563;">{{ med.dosis }}</td>
            <td style="color: #6b7280; font-size: 0.9rem;">{{ med.instrucciones }}</td>
            <td style="text-align: right;">
              <button @click="editarMedicamento(med)" class="action-btn edit-btn">✏️</button>
              <button @click="eliminarMedicamento(med.id)" class="action-btn delete-btn">❌</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="fotoSeleccionada" class="modal-overlay" @click="cerrarFoto">
      <div class="modal-content" @click.stop>
        <button class="close-modal-btn" @click="cerrarFoto">❌</button>
        <img :src="fotoSeleccionada" class="img-ampliada" alt="Medicamento ampliado">
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-medicamentos-wrapper { width: 100%; display: block; }

.med-form-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 16px; margin-bottom: 20px; width: 100%; box-sizing: border-box; }
.form-label { display: block; font-size: 0.9rem; font-weight: 600; color: #4b5563; margin-bottom: 5px; }
.form-input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 10px; box-sizing: border-box; background-color: white; }
.form-input:focus { outline: none; border-color: #10b981; }

.btn-outline { background: white; border: 2px solid #e5e7eb; padding: 10px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-primary { background: #10b981; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; transition: background 0.2s; }

.action-btn { background: transparent; border: none; font-size: 1.2rem; cursor: pointer; padding: 5px; margin: 0 5px; transition: transform 0.2s; }
.action-btn:hover { transform: scale(1.2); }

.form-row { display: flex; gap: 15px; margin-bottom: 15px; width: 100%; }
.form-col { flex: 1; }
.action-row { display: flex; gap: 10px; }

.modern-table-container { border-radius: 12px; border: 1px solid #e5e7eb; overflow-x: auto; width: 100%; }
.modern-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 600px; }
.modern-table th { background: #f9fafb; padding: 14px 16px; font-weight: 600; color: #374151; font-size: 0.95rem; border-bottom: 2px solid #e5e7eb; }
.modern-table td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }

.img-thumbnail { transition: transform 0.2s ease-in-out; }
.img-thumbnail:hover { transform: scale(1.15); }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.75); display: flex; justify-content: center; align-items: center; z-index: 9999; backdrop-filter: blur(3px); }
.modal-content { position: relative; max-width: 90vw; max-height: 90vh; background: white; padding: 10px; border-radius: 12px; display: flex; justify-content: center; align-items: center; }
.img-ampliada { max-width: 100%; max-height: calc(90vh - 20px); border-radius: 8px; object-fit: contain; }
.close-modal-btn { position: absolute; top: -15px; right: -15px; background: white; border: 2px solid #e5e7eb; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.close-modal-btn:hover { transform: scale(1.1); }

@media (max-width: 768px) {
  .form-row, .action-row { flex-direction: column; gap: 10px; }
}
</style>