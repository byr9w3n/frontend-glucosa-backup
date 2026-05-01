<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'vue-chartjs'
import * as XLSX from 'xlsx' //[cite: 4]

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend) //[cite: 4]

const registros = ref([]) //[cite: 4]
const cargando = ref(false) //[cite: 4]

// Filtros y Paginación
const mesSeleccionado = ref('todos') //[cite: 4]
const momentoSeleccionado = ref('todos') //[cite: 4]
const paginaActual = ref(1) //[cite: 4]
const elementosPorPagina = 10 //[cite: 4]

onMounted(() => {
  cargarEstadisticas() //[cite: 4]
})

const cargarEstadisticas = async () => {
  cargando.value = true //[cite: 4]
  try {
    const respuesta = await axios.get('https://api-glucosa.onrender.com/estadisticas') //[cite: 4]
    registros.value = respuesta.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) //[cite: 4]
  } catch (error) { console.error(error) }  //[cite: 4]
  finally { cargando.value = false } //[cite: 4]
}

watch([mesSeleccionado, momentoSeleccionado], () => { paginaActual.value = 1; }); //[cite: 4]

const mesesConDatos = computed(() => {
  const map = new Map(); //[cite: 4]
  registros.value.forEach(r => { //[cite: 4]
    const date = new Date(r.created_at); //[cite: 4]
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; //[cite: 4]
    const label = date.toLocaleString('es-EC', { month: 'long', year: 'numeric' }); //[cite: 4]
    if (!map.has(key)) map.set(key, label.charAt(0).toUpperCase() + label.slice(1)); //[cite: 4]
  });
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([key, label]) => ({ key, label })); //[cite: 4]
})

const etiquetasUnicas = computed(() => {
  const etiquetas = new Set(registros.value.map(r => r.etiqueta).filter(e => e)); //[cite: 4]
  return Array.from(etiquetas).sort(); //[cite: 4]
})

const registrosFiltrados = computed(() => {
  return registros.value.filter(r => { //[cite: 4]
    const date = new Date(r.created_at); //[cite: 4]
    const keyMes = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; //[cite: 4]
    const pasaMes = mesSeleccionado.value === 'todos' || keyMes === mesSeleccionado.value; //[cite: 4]
    const pasaMomento = momentoSeleccionado.value === 'todos' || r.etiqueta === momentoSeleccionado.value; //[cite: 4]
    return pasaMes && pasaMomento; //[cite: 4]
  });
})

const totalPaginas = computed(() => Math.ceil(registrosFiltrados.value.length / elementosPorPagina)) //[cite: 4]

const registrosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * elementosPorPagina; //[cite: 4]
  const fin = inicio + elementosPorPagina; //[cite: 4]
  return registrosFiltrados.value.slice(inicio, fin); //[cite: 4]
})

const statsApp = computed(() => {
  if (registrosFiltrados.value.length === 0) return { promedio: 0, max: 0, min: 0 }; //[cite: 4]
  const valores = registrosFiltrados.value.map(r => r.valor); //[cite: 4]
  const suma = valores.reduce((a, b) => a + b, 0); //[cite: 4]
  return { promedio: Math.round(suma / valores.length), max: Math.max(...valores), min: Math.min(...valores) } //[cite: 4]
})

const tendenciaPromedio = computed(() => {
  if (mesSeleccionado.value === 'todos' || registrosFiltrados.value.length === 0) return null; //[cite: 4]
  const indexActual = mesesConDatos.value.findIndex(m => m.key === mesSeleccionado.value); //[cite: 4]
  if (indexActual === -1 || indexActual >= mesesConDatos.value.length - 1) return null;  //[cite: 4]

  const mesAnteriorKey = mesesConDatos.value[indexActual + 1].key; //[cite: 4]
  const regAnteriores = registros.value.filter(r => { //[cite: 4]
    const date = new Date(r.created_at); //[cite: 4]
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; //[cite: 4]
    return key === mesAnteriorKey && (momentoSeleccionado.value === 'todos' || r.etiqueta === momentoSeleccionado.value); //[cite: 4]
  });

  if (regAnteriores.length === 0) return null; //[cite: 4]

  const promAnterior = Math.round(regAnteriores.reduce((acc, r) => acc + r.valor, 0) / regAnteriores.length); //[cite: 4]
  const promActual = statsApp.value.promedio; //[cite: 4]
  const diff = promActual - promAnterior; //[cite: 4]
  
  if (promAnterior === 0) return null; //[cite: 4]
  const porcentaje = Math.round((Math.abs(diff) / promAnterior) * 100); //[cite: 4]

  return { porcentaje, direccion: diff > 0 ? 'subio' : (diff < 0 ? 'bajo' : 'igual') }; //[cite: 4]
})

const formatearFechaHora = (isoString) => {
  const fecha = new Date(isoString); //[cite: 4]
  return fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); //[cite: 4]
}

// Lógica de semaforización de glucosa
const obtenerEstado = (valor, etiqueta = '') => {
  const momento = etiqueta ? etiqueta.toLowerCase() : ''; //[cite: 4]
  const esAntesDeComer = momento.includes('ayuna') || momento.includes('despertar') || momento.includes('pre') || momento.includes('antes'); //[cite: 4]

  if (valor < 70) return { texto: 'Bajo', color: '#ef4444', bg: '#fee2e2' };  //[cite: 4]
  if (esAntesDeComer) { //[cite: 4]
    if (valor <= 100) return { texto: 'Normal', color: '#10b981', bg: '#d1fae5' }; //[cite: 4]
    if (valor <= 125) return { texto: 'Alerta', color: '#f59e0b', bg: '#fef3c7' }; //[cite: 4]
    return { texto: 'Alto', color: '#ef4444', bg: '#fee2e2' }; //[cite: 4]
  } else {
    if (valor <= 140) return { texto: 'Normal', color: '#10b981', bg: '#d1fae5' }; //[cite: 4]
    if (valor <= 180) return { texto: 'Alerta', color: '#f59e0b', bg: '#fef3c7' }; //[cite: 4]
    return { texto: 'Alto', color: '#ef4444', bg: '#fee2e2' }; //[cite: 4]
  }
}

const datosGrafico = computed(() => {
  const datosCronologicos = [...registrosFiltrados.value].reverse(); //[cite: 4]
  const coloresPuntos = datosCronologicos.map(r => obtenerEstado(r.valor, r.etiqueta).color); //[cite: 4]
  return {
    labels: datosCronologicos.map(r => { //[cite: 4]
      const fecha = new Date(r.created_at); //[cite: 4]
      return `${fecha.getDate()} ${fecha.toLocaleString('es', { month: 'short' })} ${fecha.getHours()}:${fecha.getMinutes().toString().padStart(2, '0')}`; //[cite: 4]
    }),
    datasets: [{ //[cite: 4]
      label: 'Nivel de Glucosa', borderColor: '#10b981', borderWidth: 2, pointBackgroundColor: coloresPuntos, pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5, data: datosCronologicos.map(r => r.valor), tension: 0.3,  //[cite: 4]
    }]
  }
})

// --- NUEVA FUNCIÓN PARA EXCEL ---
const descargarExcel = () => {
  const datosParaExcel = registrosFiltrados.value.map(reg => {
    // Usamos formatearFechaHora pero le damos un formato más amigable para Excel si quieres
    const fecha = new Date(reg.created_at);
    const fechaFormateada = fecha.toLocaleDateString('es-EC') + ' ' + fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

    return {
      'Nivel de Glucosa (mg/dL)': reg.valor,
      'Momento del día': reg.etiqueta,
      'Estado': obtenerEstado(reg.valor, reg.etiqueta).texto, // Aprovechamos tu función para añadir el estado
      'Comentarios/Notas': reg.notas && reg.notas !== 'EMPTY' ? reg.notas : '',
      'Fecha y Hora': fechaFormateada
    };
  });

  if (datosParaExcel.length === 0) {
    alert("No hay registros para descargar con los filtros actuales.");
    return;
  }

  const hoja = XLSX.utils.json_to_sheet(datosParaExcel);
  
  // Ajustar el ancho de las columnas para que se vea mejor
  hoja['!cols'] = [
    { wch: 25 }, // Ancho para 'Nivel de Glucosa (mg/dL)'
    { wch: 20 }, // Ancho para 'Momento del día'
    { wch: 15 }, // Ancho para 'Estado'
    { wch: 40 }, // Ancho para 'Comentarios/Notas'
    { wch: 20 }  // Ancho para 'Fecha y Hora'
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Glucosa");

  // Nombre del archivo dinámico según el mes seleccionado
  let nombreArchivo = "Reporte_Glucosa";
  if (mesSeleccionado.value !== 'todos') {
     const mesLabel = mesesConDatos.value.find(m => m.key === mesSeleccionado.value)?.label || mesSeleccionado.value;
     nombreArchivo += `_${mesLabel.replace(' ', '_')}`;
  }
  nombreArchivo += ".xlsx";

  XLSX.writeFile(libro, nombreArchivo);
}
</script>

<template>
  <div>
    <div v-if="cargando" style="text-align: center; padding: 40px; color: #6b7280;">Cargando estadísticas...</div> <!--[cite: 4] -->
    
    <div v-else>
      <div class="filters-container"> <!--[cite: 4] -->
        <select v-model="momentoSeleccionado" class="form-input custom-select"> <!--[cite: 4] -->
          <option value="todos">Todos los momentos</option> <!--[cite: 4] -->
          <option v-for="etiqueta in etiquetasUnicas" :key="etiqueta" :value="etiqueta">{{ etiqueta }}</option> <!--[cite: 4] -->
        </select>
        <select v-model="mesSeleccionado" class="form-input custom-select"> <!--[cite: 4] -->
          <option value="todos">Histórico Completo</option> <!--[cite: 4] -->
          <option v-for="mes in mesesConDatos" :key="mes.key" :value="mes.key">{{ mes.label }}</option> <!--[cite: 4] -->
        </select>

        <!-- NUEVO BOTÓN DE DESCARGA -->
        <button @click="descargarExcel" class="btn-excel">
           📥 Descargar Excel
        </button>
      </div>

      <div class="kpi-grid"> <!--[cite: 4] -->
        <div class="kpi-card"> <!--[cite: 4] -->
          <span class="kpi-label">Promedio</span> <!--[cite: 4] -->
          <div class="kpi-value" :style="{ color: obtenerEstado(statsApp.promedio).color }"> <!--[cite: 4] -->
            {{ statsApp.promedio }} <span class="kpi-unit">mg/dL</span> <!--[cite: 4] -->
          </div>
          <div v-if="tendenciaPromedio" class="trend-indicator" :class="tendenciaPromedio.direccion"> <!--[cite: 4] -->
            <span v-if="tendenciaPromedio.direccion === 'subio'">↑ Subió {{ tendenciaPromedio.porcentaje }}%</span> <!--[cite: 4] -->
            <span v-else-if="tendenciaPromedio.direccion === 'bajo'">↓ Bajó {{ tendenciaPromedio.porcentaje }}%</span> <!--[cite: 4] -->
            <span v-else>↔ Se mantuvo</span> <!--[cite: 4] -->
            <span class="trend-vs">vs mes ant.</span> <!--[cite: 4] -->
          </div>
        </div>
        <div class="kpi-card"> <!--[cite: 4] -->
          <span class="kpi-label">Máximo</span> <!--[cite: 4] -->
          <div class="kpi-value" style="color: #ef4444;">{{ statsApp.max }} <span class="kpi-unit">mg/dL</span></div> <!--[cite: 4] -->
        </div>
        <div class="kpi-card"> <!--[cite: 4] -->
          <span class="kpi-label">Mínimo</span> <!--[cite: 4] -->
          <div class="kpi-value" style="color: #3b82f6;">{{ statsApp.min }} <span class="kpi-unit">mg/dL</span></div> <!--[cite: 4] -->
        </div>
      </div>

      <div class="chart-wrapper"> <!--[cite: 4] -->
        <Line :data="datosGrafico" :options="{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }" /> <!--[cite: 4] -->
      </div>

      <div class="modern-table-container"> <!--[cite: 4] -->
        <table class="modern-table"> <!--[cite: 4] -->
          <thead> <!--[cite: 4] -->
            <tr><th>Estado</th><th>Nivel</th><th>Momento</th><th>Notas</th><th>Fecha y Hora</th></tr> <!--[cite: 4] -->
          </thead>
          <tbody>
            <tr v-if="registrosFiltrados.length === 0"> <!--[cite: 4] -->
              <td colspan="5" style="text-align: center; color: #6b7280; padding: 20px;">No hay registros.</td> <!--[cite: 4] -->
            </tr>
            <tr v-for="reg in registrosPaginados" :key="reg.id"> <!--[cite: 4] -->
              <td><div class="status-indicator" :style="{ backgroundColor: obtenerEstado(reg.valor, reg.etiqueta).color }"></div></td> <!--[cite: 4] -->
              <td><span class="badge" :style="{ backgroundColor: obtenerEstado(reg.valor, reg.etiqueta).bg, color: obtenerEstado(reg.valor, reg.etiqueta).color }">{{ reg.valor }} mg/dL</span></td> <!--[cite: 4] -->
              <td style="color: #4b5563; font-weight: 500;">{{ reg.etiqueta }}</td> <!--[cite: 4] -->
              <td style="color: #6b7280; font-size: 0.9rem; max-width: 200px; word-wrap: break-word;">{{ reg.notas && reg.notas !== 'EMPTY' ? reg.notas : '-' }}</td> <!--[cite: 4] -->
              <td style="color: #6b7280; font-size: 0.95rem;">{{ formatearFechaHora(reg.created_at) }}</td> <!--[cite: 4] -->
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPaginas > 1" class="pagination-controls"> <!--[cite: 4] -->
        <button @click="paginaActual--" :disabled="paginaActual === 1" class="btn-page">Anterior</button> <!--[cite: 4] -->
        <span class="page-info">Página {{ paginaActual }} de {{ totalPaginas }}</span> <!--[cite: 4] -->
        <button @click="paginaActual++" :disabled="paginaActual === totalPaginas" class="btn-page">Siguiente</button> <!--[cite: 4] -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.filters-container { display: flex; gap: 15px; justify-content: flex-end; margin-bottom: 20px; align-items: center; } /*[cite: 4] */
.custom-select { padding: 8px 12px; font-weight: 600; cursor: pointer; border: 1px solid #d1d5db; border-radius: 10px;} /*[cite: 4] */

/* NUEVOS ESTILOS PARA EL BOTÓN DE EXCEL */
.btn-excel {
  background-color: white;
  border: 2px solid #10b981;
  color: #10b981;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-excel:hover {
  background-color: #10b981;
  color: white;
}

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; } /*[cite: 4] */
.kpi-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; text-align: center; } /*[cite: 4] */
.kpi-label { display: block; color: #6b7280; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; } /*[cite: 4] */
.kpi-value { font-size: 2.2rem; font-weight: 800; } /*[cite: 4] */
.kpi-unit { font-size: 1rem; font-weight: 600; color: #9ca3af; } /*[cite: 4] */
.trend-indicator { font-size: 0.85rem; margin-top: 5px; font-weight: 600; } /*[cite: 4] */
.trend-indicator.subio { color: #ef4444; } /*[cite: 4] */
.trend-indicator.bajo { color: #10b981; } /*[cite: 4] */
.trend-indicator.igual { color: #6b7280; } /*[cite: 4] */
.chart-wrapper { height: 320px; margin-bottom: 30px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 16px; background: white; } /*[cite: 4] */
.modern-table-container { border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; } /*[cite: 4] */
.modern-table { width: 100%; border-collapse: collapse; text-align: left; } /*[cite: 4] */
.modern-table th { background: #f9fafb; padding: 14px 16px; font-weight: 600; color: #374151; font-size: 0.95rem; border-bottom: 2px solid #e5e7eb; } /*[cite: 4] */
.modern-table td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; } /*[cite: 4] */
.status-indicator { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 2px white, 0 0 0 3px #e5e7eb; } /*[cite: 4] */
.badge { padding: 6px 12px; border-radius: 20px; font-weight: 800; font-size: 1rem; display: inline-block; } /*[cite: 4] */
.pagination-controls { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; } /*[cite: 4] */
.btn-page { background: white; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; } /*[cite: 4] */
.btn-page:hover:not(:disabled) { background: #f3f4f6; } /*[cite: 4] */
.btn-page:disabled { opacity: 0.5; cursor: not-allowed; } /*[cite: 4] */

@media (max-width: 768px) {
  .filters-container { flex-direction: column; gap: 10px; align-items: stretch; } /*[cite: 4] */
  .kpi-grid { grid-template-columns: 1fr 1fr; } /*[cite: 4] */
  .kpi-card:first-child { grid-column: span 2; } /*[cite: 4] */
  .modern-table-container { overflow-x: auto; } /*[cite: 4] */
}
</style>