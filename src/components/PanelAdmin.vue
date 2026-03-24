<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const pin = ref('')
const autenticado = ref(false)

// <-- NUEVO: Estado para el modal de la foto ampliada -->
const fotoSeleccionada = ref(null)

const abrirFoto = (url) => {
  fotoSeleccionada.value = url
}

const cerrarFoto = () => {
  fotoSeleccionada.value = null
}

// Pestañas
const tabActiva = ref('glucosa') 

// Datos
const registros = ref([])
const medicamentos = ref([])
const cargando = ref(false)

// Filtros
const mesSeleccionado = ref('todos')
const momentoSeleccionado = ref('todos')

// Paginación
const paginaActual = ref(1)
const elementosPorPagina = 10

// Estado del formulario de medicamentos
const modoEdicion = ref(false)
const subiendoFoto = ref(false) // <-- NUEVO: Estado de carga de la foto
const formMed = ref({ id: null, nombre: '', dosis: '', instrucciones: '', foto_url: '' }) // <-- NUEVO: foto_url

// --- AUTENTICACIÓN Y CARGA ---
const verificarPin = async () => {
  if (pin.value === '2006') { 
    autenticado.value = true
    await cargarEstadisticas()
    await cargarMedicamentos()
  } else {
    alert('PIN incorrecto')
    pin.value = ''
  }
}

const cargarEstadisticas = async () => {
  cargando.value = true
  try {
    const respuesta = await axios.get('https://api-glucosa.onrender.com/estadisticas')
    registros.value = respuesta.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (error) { console.error(error) } 
  finally { cargando.value = false }
}

const cargarMedicamentos = async () => {
  try {
    const respuesta = await axios.get('https://api-glucosa.onrender.com/medicamentos')
    medicamentos.value = respuesta.data
  } catch (error) { console.error(error) }
}

// --- LÓGICA DE MEDICAMENTOS (CRUD Y FOTOS) ---
const guardarMedicamento = async () => {
  if (!formMed.value.nombre || !formMed.value.dosis) return alert("Nombre y Dosis son obligatorios");
  try {
    if (modoEdicion.value) await axios.put(`https://api-glucosa.onrender.com/medicamentos/${formMed.value.id}`, formMed.value)
    else await axios.post('https://api-glucosa.onrender.com/medicamentos', formMed.value)
    await cargarMedicamentos()
    cancelarEdicion()
  } catch (error) { console.error("Error al guardar medicamento", error) }
}

const editarMedicamento = (med) => {
  modoEdicion.value = true
  formMed.value = { ...med }
}

const eliminarMedicamento = async (id) => {
  if (!confirm("¿Seguro que deseas eliminar este medicamento?")) return;
  try {
    await axios.delete(`https://api-glucosa.onrender.com/medicamentos/${id}`)
    await cargarMedicamentos()
  } catch (error) { console.error("Error al eliminar", error) }
}

const cancelarEdicion = () => {
  modoEdicion.value = false
  formMed.value = { id: null, nombre: '', dosis: '', instrucciones: '', foto_url: '' } // <-- NUEVO: Limpiar foto_url
}

// <-- NUEVO: Función para subir la foto al servidor -->
const manejarSubidaFoto = async (event) => {
  const archivo = event.target.files[0];
  if (!archivo) return;

  subiendoFoto.value = true;
  const formData = new FormData();
  formData.append("file", archivo);

  try {
    const respuesta = await axios.post('https://api-glucosa.onrender.com/upload-foto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    formMed.value.foto_url = respuesta.data.url; // Guardamos la URL pública
  } catch (error) {
    console.error("Error al subir foto", error);
    alert("No se pudo subir la imagen.");
  } finally {
    subiendoFoto.value = false;
  }
}

// --- LÓGICA MÉDICA, FILTROS Y PAGINACIÓN ---
watch([mesSeleccionado, momentoSeleccionado], () => { paginaActual.value = 1; });

const mesesConDatos = computed(() => {
  const map = new Map();
  registros.value.forEach(r => {
    const date = new Date(r.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleString('es-EC', { month: 'long', year: 'numeric' });
    if (!map.has(key)) map.set(key, label.charAt(0).toUpperCase() + label.slice(1));
  });
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([key, label]) => ({ key, label }));
})

const etiquetasUnicas = computed(() => {
  const etiquetas = new Set(registros.value.map(r => r.etiqueta).filter(e => e));
  return Array.from(etiquetas).sort();
})

const registrosFiltrados = computed(() => {
  return registros.value.filter(r => {
    const date = new Date(r.created_at);
    const keyMes = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const pasaMes = mesSeleccionado.value === 'todos' || keyMes === mesSeleccionado.value;
    const pasaMomento = momentoSeleccionado.value === 'todos' || r.etiqueta === momentoSeleccionado.value;
    return pasaMes && pasaMomento;
  });
})

const totalPaginas = computed(() => Math.ceil(registrosFiltrados.value.length / elementosPorPagina))

const registrosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  return registrosFiltrados.value.slice(inicio, fin);
})

const statsApp = computed(() => {
  if (registrosFiltrados.value.length === 0) return { promedio: 0, max: 0, min: 0 };
  const valores = registrosFiltrados.value.map(r => r.valor);
  const suma = valores.reduce((a, b) => a + b, 0);
  return { promedio: Math.round(suma / valores.length), max: Math.max(...valores), min: Math.min(...valores) }
})

const tendenciaPromedio = computed(() => {
  if (mesSeleccionado.value === 'todos' || registrosFiltrados.value.length === 0) return null;
  const indexActual = mesesConDatos.value.findIndex(m => m.key === mesSeleccionado.value);
  if (indexActual === -1 || indexActual >= mesesConDatos.value.length - 1) return null; 

  const mesAnteriorKey = mesesConDatos.value[indexActual + 1].key;
  const regAnteriores = registros.value.filter(r => {
    const date = new Date(r.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const matchMes = key === mesAnteriorKey;
    const matchMomento = momentoSeleccionado.value === 'todos' || r.etiqueta === momentoSeleccionado.value;
    return matchMes && matchMomento;
  });

  if (regAnteriores.length === 0) return null;

  const promAnterior = Math.round(regAnteriores.reduce((acc, r) => acc + r.valor, 0) / regAnteriores.length);
  const promActual = statsApp.value.promedio;
  const diff = promActual - promAnterior;
  
  if (promAnterior === 0) return null;
  const porcentaje = Math.round((Math.abs(diff) / promAnterior) * 100);

  return { porcentaje, direccion: diff > 0 ? 'subio' : (diff < 0 ? 'bajo' : 'igual') };
})

const formatearFechaHora = (isoString) => {
  const fecha = new Date(isoString);
  return fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const obtenerEstado = (valor, etiqueta = '') => {
  const momento = etiqueta ? etiqueta.toLowerCase() : '';
  
  // NUEVO: Agregamos 'pre' y 'antes' para incluir Pre-Merienda, Pre-Almuerzo, etc.
  const esAntesDeComer = momento.includes('ayuna') || momento.includes('despertar') || momento.includes('pre') || momento.includes('antes');

  // 1. ROJO: Demasiado bajo (Menor a 70 siempre es alerta por hipoglucemia)
  if (valor < 70) return { texto: 'Bajo', color: '#ef4444', bg: '#fee2e2' }; 

  // 2. Lógica para "Antes de comer" (Ayunas, Pre-Merienda, etc. - Normal hasta 100)
  if (esAntesDeComer) {
    if (valor <= 100) return { texto: 'Normal', color: '#10b981', bg: '#d1fae5' }; // Verde
    if (valor <= 125) return { texto: 'Alerta', color: '#f59e0b', bg: '#fef3c7' }; // Amarillo
    return { texto: 'Alto', color: '#ef4444', bg: '#fee2e2' }; // Rojo
  } 
  // 3. Lógica para "Después de comidas" (Post-comidas - Normal hasta 140)
  else {
    if (valor <= 140) return { texto: 'Normal', color: '#10b981', bg: '#d1fae5' }; // Verde
    if (valor <= 180) return { texto: 'Alerta', color: '#f59e0b', bg: '#fef3c7' }; // Amarillo
    return { texto: 'Alto', color: '#ef4444', bg: '#fee2e2' }; // Rojo
  }
}

const datosGrafico = computed(() => {
  const datosCronologicos = [...registrosFiltrados.value].reverse();
  const coloresPuntos = datosCronologicos.map(r => obtenerEstado(r.valor, r.etiqueta).color);
  return {
    labels: datosCronologicos.map(r => {
      const fecha = new Date(r.created_at);
      return `${fecha.getDate()} ${fecha.toLocaleString('es', { month: 'short' })} ${fecha.getHours()}:${fecha.getMinutes().toString().padStart(2, '0')}`;
    }),
    datasets: [{
      label: 'Nivel de Glucosa',
      borderColor: '#10b981', borderWidth: 2, pointBackgroundColor: coloresPuntos,
      pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5, data: datosCronologicos.map(r => r.valor), tension: 0.3, 
    }]
  }
})
</script>

<template>
  <div class="card card-wide">
    <div class="header-panel">
      <div>
        <h1 style="margin: 0; font-size: 1.8rem; color: #111827;">Panel De Glucosa Mamá</h1>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 0.9rem;">Estadísticas</p>
      </div>
    </div>

    <div v-if="!autenticado" class="login-box">
      <p style="color: #6b7280; font-size: 1.1rem; margin-bottom: 15px;">Ingresa tu PIN de administrador</p>
      <input type="password" pattern="\d*" v-model="pin" class="input-pin" placeholder="">
      <button @click="verificarPin" class="btn-primary" style="margin-top: 25px; max-width: 250px;">Acceder al panel</button>
    </div>

    <div v-else>
      <div class="tabs-container">
        <button @click="tabActiva = 'glucosa'" :class="['tab-btn', tabActiva === 'glucosa' ? 'tab-active' : '']">📊 Glucosa</button>
        <button @click="tabActiva = 'medicamentos'" :class="['tab-btn', tabActiva === 'medicamentos' ? 'tab-active' : '']">💊 Medicamentos</button>
      </div>

      <div v-if="cargando" style="text-align: center; padding: 40px; color: #6b7280;">Cargando datos...</div>
      
      <div v-else-if="tabActiva === 'glucosa'">
        
        <div class="filters-container">
          <select v-model="momentoSeleccionado" class="form-input custom-select">
            <option value="todos">Todos los momentos</option>
            <option v-for="etiqueta in etiquetasUnicas" :key="etiqueta" :value="etiqueta">{{ etiqueta }}</option>
          </select>
          
          <select v-model="mesSeleccionado" class="form-input custom-select">
            <option value="todos">Histórico Completo (Todos)</option>
            <option v-for="mes in mesesConDatos" :key="mes.key" :value="mes.key">{{ mes.label }}</option>
          </select>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-label">Promedio</span>
            <div class="kpi-value" :style="{ color: obtenerEstado(statsApp.promedio).color }">
              {{ statsApp.promedio }} <span class="kpi-unit">mg/dL</span>
            </div>
            <div v-if="tendenciaPromedio" class="trend-indicator" :class="tendenciaPromedio.direccion">
              <span v-if="tendenciaPromedio.direccion === 'subio'">↑ Subió {{ tendenciaPromedio.porcentaje }}%</span>
              <span v-else-if="tendenciaPromedio.direccion === 'bajo'">↓ Bajó {{ tendenciaPromedio.porcentaje }}%</span>
              <span v-else>↔ Se mantuvo</span>
              <span class="trend-vs">vs mes ant.</span>
            </div>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Máximo</span>
            <div class="kpi-value" style="color: #ef4444;">{{ statsApp.max }} <span class="kpi-unit">mg/dL</span></div>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Mínimo</span>
            <div class="kpi-value" style="color: #3b82f6;">{{ statsApp.min }} <span class="kpi-unit">mg/dL</span></div>
          </div>
        </div>

        <div class="chart-wrapper">
          <Line :data="datosGrafico" :options="{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }" />
        </div>

        <div class="modern-table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Nivel</th>
                <th>Momento</th>
                <th>Notas</th>
                <th>Fecha y Hora</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="registrosFiltrados.length === 0">
                <td colspan="5" style="text-align: center; color: #6b7280; padding: 20px;">No hay registros para los filtros seleccionados.</td>
              </tr>
              <tr v-for="reg in registrosPaginados" :key="reg.id">
                <td><div class="status-indicator" :style="{ backgroundColor: obtenerEstado(reg.valor, reg.etiqueta).color }"></div></td>
<td><span class="badge" :style="{ backgroundColor: obtenerEstado(reg.valor, reg.etiqueta).bg, color: obtenerEstado(reg.valor, reg.etiqueta).color }">{{ reg.valor }} mg/dL</span></td>
                <td style="color: #4b5563; font-weight: 500;">{{ reg.etiqueta }}</td>
                <td style="color: #6b7280; font-size: 0.9rem; max-width: 200px; word-wrap: break-word;">
                  {{ reg.notas && reg.notas !== 'EMPTY' ? reg.notas : '-' }}
                </td>
                <td style="color: #6b7280; font-size: 0.95rem;">{{ formatearFechaHora(reg.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPaginas > 1" class="pagination-controls">
          <button @click="paginaActual--" :disabled="paginaActual === 1" class="btn-page">Anterior</button>
          <span class="page-info">Página {{ paginaActual }} de {{ totalPaginas }}</span>
          <button @click="paginaActual++" :disabled="paginaActual === totalPaginas" class="btn-page">Siguiente</button>
        </div>

      </div>

      <div v-else-if="tabActiva === 'medicamentos'">
        <div class="med-form-card">
          <h3 style="margin-top: 0; color: #1f2937;">{{ modoEdicion ? 'Editar Medicamento' : 'Añadir Nuevo Medicamento' }}</h3>
          
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Nombre</label>
              <input type="text" v-model="formMed.nombre" class="form-input" placeholder="">
            </div>
            <div class="form-col">
              <label class="form-label">Dosis</label>
              <input type="text" v-model="formMed.dosis" class="form-input" placeholder="">
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <label class="form-label">Instrucciones (Horario)</label>
            <input type="text" v-model="formMed.instrucciones" class="form-input" placeholder="">
          </div>

          <div style="margin-bottom: 20px; padding-top: 5px;">
            <label class="form-label">Foto del medicamento (Opcional)</label>
            <input type="file" accept="image/*" @change="manejarSubidaFoto" class="form-input" style="padding: 8px;">
            
            <div v-if="subiendoFoto" style="color: #10b981; font-size: 0.9rem; margin-top: 8px; font-weight: bold;">
              ⏳ Subiendo imagen al servidor...
            </div>
            
            <div v-if="formMed.foto_url" style="margin-top: 15px; display: flex; align-items: flex-end; gap: 10px;">
              <img :src="formMed.foto_url" style="max-height: 100px; border-radius: 8px; border: 2px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
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
        <div class="modern-table-container">
          <table class="modern-table">
            <thead>
              <tr><th>Foto</th><th>Medicamento</th><th>Dosis</th><th>Instrucciones</th><th style="text-align: right;">Acciones</th></tr>
            </thead>
            <tbody>
              <tr v-if="medicamentos.length === 0"><td colspan="5" style="text-align: center; color: #6b7280; padding: 20px;">No hay medicamentos registrados.</td></tr>
              <tr v-for="med in medicamentos" :key="med.id">
                
                <td style="width: 60px; text-align: center; vertical-align: middle;">
  <img v-if="med.foto_url" :src="med.foto_url" @click="abrirFoto(med.foto_url)" class="img-thumbnail" style="width: 45px; height: 45px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; display: block; cursor: pointer;">
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
      </div>

    </div>
  </div>
  <div v-if="fotoSeleccionada" class="modal-overlay" @click="cerrarFoto">
      <div class="modal-content" @click.stop>
        <button class="close-modal-btn" @click="cerrarFoto">❌</button>
        <img :src="fotoSeleccionada" class="img-ampliada" alt="Medicamento ampliado">
      </div>
    </div>
</template>

<style scoped>
/* ESTILOS BASE MANTENIDOS */
.header-panel { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; }
.btn-outline { background: white; border: 2px solid #e5e7eb; padding: 10px 20px; border-radius: 12px; font-weight: 600; color: #4b5563; cursor: pointer; transition: all 0.2s; }
.login-box { text-align: center; padding: 40px 0; display: flex; flex-direction: column; align-items: center; }
.input-pin { width: 100%; max-width: 250px; text-align: center; font-size: 2.5rem; letter-spacing: 15px; padding: 15px; border: 2px solid #e5e7eb; border-radius: 16px; background: #f9fafb; transition: border 0.3s; }
.input-pin:focus { outline: none; border-color: #10b981; background: white; }

/* PESTAÑAS Y FORMULARIOS */
.tabs-container { display: flex; gap: 10px; margin-bottom: 25px; background: #f3f4f6; padding: 5px; border-radius: 16px; }
.tab-btn { flex: 1; background: transparent; border: none; padding: 12px; font-size: 1.1rem; font-weight: 600; color: #6b7280; border-radius: 12px; cursor: pointer; transition: all 0.3s; }
.tab-active { background: white; color: #10b981; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.med-form-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 16px; margin-bottom: 20px; }
.form-label { display: block; font-size: 0.9rem; font-weight: 600; color: #4b5563; margin-bottom: 5px; }
.form-input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 10px; box-sizing: border-box; font-family: inherit; }
.form-input:focus { outline: none; border-color: #10b981; }
.action-btn { background: transparent; border: none; font-size: 1.2rem; cursor: pointer; padding: 5px; margin: 0 5px; transition: transform 0.2s; }
.action-btn:hover { transform: scale(1.2); }

/* NUEVOS CONTROLES DE FILTROS */
.filters-container { display: flex; gap: 15px; justify-content: flex-end; margin-bottom: 20px; }
.custom-select { padding: 8px 12px; width: auto; font-weight: 600; cursor: pointer; background-color: white; }

/* TENDENCIA Y KPIs */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
.kpi-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; text-align: center; position: relative; }
.kpi-label { display: block; color: #6b7280; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
.kpi-value { font-size: 2.2rem; font-weight: 800; }
.kpi-unit { font-size: 1rem; font-weight: 600; color: #9ca3af; }
.trend-indicator { font-size: 0.85rem; margin-top: 5px; font-weight: 600; }
.trend-indicator.subio { color: #ef4444; }
.trend-indicator.bajo { color: #10b981; }
.trend-indicator.igual { color: #6b7280; }
.trend-vs { color: #9ca3af; font-weight: 400; font-size: 0.8rem; margin-left: 4px; }

/* TABLAS Y GRÁFICOS */
.chart-wrapper { height: 320px; margin-bottom: 30px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 16px; background: white; }
.modern-table-container { border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
.modern-table { width: 100%; border-collapse: collapse; text-align: left; }
.modern-table th { background: #f9fafb; padding: 14px 16px; font-weight: 600; color: #374151; font-size: 0.95rem; border-bottom: 2px solid #e5e7eb; }
.modern-table td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.status-indicator { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 2px white, 0 0 0 3px #e5e7eb; }
.badge { padding: 6px 12px; border-radius: 20px; font-weight: 800; font-size: 1rem; display: inline-block; }

/* NUEVA PAGINACIÓN */
.pagination-controls { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; }
.btn-page { background: white; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 8px; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-page:hover:not(:disabled) { background: #f3f4f6; }
.btn-page:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { font-size: 0.95rem; font-weight: 500; color: #6b7280; }

/* CLASES PARA EL FORMULARIO */
.form-row { display: flex; gap: 15px; margin-bottom: 15px; }
.form-col { flex: 1; }
.action-row { display: flex; gap: 10px; }

@media (max-width: 768px) {
  .card-wide { padding: 15px; }
  .input-pin { font-size: 2rem; letter-spacing: 10px; max-width: 100%; }
  .filters-container { flex-direction: column; gap: 10px; }
  .custom-select { width: 100%; }
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .kpi-card:first-child { grid-column: span 2; }
  .form-row, .action-row { flex-direction: column; gap: 10px; }
  .modern-table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .modern-table { min-width: 500px; }
  .tab-btn { font-size: 0.95rem; padding: 10px 5px; }
}

/* --- NUEVO: MODAL DE IMAGEN --- */
.img-thumbnail {
  transition: transform 0.2s ease-in-out;
}

.img-thumbnail:hover {
  transform: scale(1.15); /* Efecto de zoom al pasar el mouse */
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* Asegura que esté por encima de todo */
  backdrop-filter: blur(3px); /* Difumina un poco el fondo */
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.img-ampliada {
  max-width: 100%;
  max-height: calc(90vh - 20px);
  border-radius: 8px;
  display: block;
  object-fit: contain;
}

.close-modal-btn {
  position: absolute;
  top: -15px;
  right: -15px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.close-modal-btn:hover {
  transform: scale(1.1);
}

</style>