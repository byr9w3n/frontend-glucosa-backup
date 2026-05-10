<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '../../api' 
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'vue-chartjs'
import * as XLSX from 'xlsx'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

// --- ESTADOS ---
const registros = ref([])
const cargando = ref(false)

// Filtros y Paginación
const mesSeleccionado = ref('todos')
const momentoSeleccionado = ref('todos')
const paginaActual = ref(1)
const elementosPorPagina = 10

onMounted(() => {
  cargarEstadisticas()
})

const cargarEstadisticas = async () => {
  cargando.value = true
  try {
    const respuesta = await api.get('/estadisticas') 
    registros.value = respuesta.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (error) { 
    console.error("Error cargando estadísticas:", error) 
  } finally { 
    cargando.value = false 
  }
}

// --- LÓGICA DE FILTROS Y PAGINACIÓN ---
watch([mesSeleccionado, momentoSeleccionado], () => { 
  paginaActual.value = 1; 
});

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

// --- KPIs Y TENDENCIAS ---
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

// --- UTILIDADES (Colores, Fechas y Exportación) ---
const formatearFechaHora = (isoString) => {
  const fecha = new Date(isoString);
  return fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const obtenerEstado = (valor, etiqueta = '') => {
  const momento = etiqueta ? etiqueta.toLowerCase() : '';
  const esAntesDeComer = momento.includes('ayuna') || momento.includes('despertar') || momento.includes('pre') || momento.includes('antes');

  if (valor < 70) return { texto: 'Bajo', color: '#ef4444', bg: '#fee2e2' }; 

  if (esAntesDeComer) {
    if (valor <= 100) return { texto: 'Normal', color: '#10b981', bg: '#d1fae5' }; 
    if (valor <= 125) return { texto: 'Alerta', color: '#f59e0b', bg: '#fef3c7' }; 
    return { texto: 'Alto', color: '#ef4444', bg: '#fee2e2' }; 
  } else {
    if (valor <= 140) return { texto: 'Normal', color: '#10b981', bg: '#d1fae5' }; 
    if (valor <= 180) return { texto: 'Alerta', color: '#f59e0b', bg: '#fef3c7' }; 
    return { texto: 'Alto', color: '#ef4444', bg: '#fee2e2' }; 
  }
}

const exportarExcel = () => {
  const datosFormateados = registrosFiltrados.value.map(reg => ({
    'Fecha y Hora': new Date(reg.created_at).toLocaleString('es-EC'),
    'Nivel (mg/dL)': reg.valor,
    'Momento': reg.etiqueta,
    'Estado': obtenerEstado(reg.valor, reg.etiqueta).texto,
    'Notas': reg.notas && reg.notas !== 'EMPTY' ? reg.notas : 'Ninguna'
  }));

  const hoja = XLSX.utils.json_to_sheet(datosFormateados);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Historial Glucosa");
  
  // Nombramos el archivo dinámicamente según el mes seleccionado
  const nombreArchivo = mesSeleccionado.value === 'todos' 
    ? 'Historial_Glucosa_Completo.xlsx' 
    : `Historial_Glucosa_${mesSeleccionado.value}.xlsx`;

  XLSX.writeFile(libro, nombreArchivo);
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
  <div>
    <div v-if="cargando" class="loading-state">
      Cargando estadísticas...
    </div>
    <div v-else>
      
      <div class="top-controls">
        <button @click="exportarExcel" class="btn-export" :disabled="registrosFiltrados.length === 0">
          📥 Exportar Excel
        </button>
        
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
  </div>
</template>

<style scoped>
.loading-state { text-align: center; padding: 40px; color: #6b7280; }

/* Controles Superiores */
.top-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
.filters-container { display: flex; gap: 10px; }
.custom-select { padding: 8px 12px; font-weight: 600; cursor: pointer; background-color: white; border: 1px solid #d1d5db; border-radius: 8px; outline: none; }
.custom-select:focus { border-color: #10b981; }

.btn-export { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-export:hover:not(:disabled) { background: #059669; }
.btn-export:disabled { background: #9ca3af; cursor: not-allowed; }

/* KPIs */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
.kpi-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.kpi-label { display: block; color: #6b7280; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
.kpi-value { font-size: 2.2rem; font-weight: 800; }
.kpi-unit { font-size: 1rem; font-weight: 600; color: #9ca3af; }
.trend-indicator { font-size: 0.85rem; margin-top: 5px; font-weight: 600; }
.trend-indicator.subio { color: #ef4444; }
.trend-indicator.bajo { color: #10b981; }
.trend-indicator.igual { color: #6b7280; }
.trend-vs { color: #9ca3af; font-weight: 400; font-size: 0.8rem; margin-left: 4px; }

/* Gráfico */
.chart-wrapper { height: 320px; margin-bottom: 30px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

/* Tabla Moderna */
.modern-table-container { border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.modern-table { width: 100%; border-collapse: collapse; text-align: left; }
.modern-table th { background: #f9fafb; padding: 14px 16px; font-weight: 600; color: #374151; font-size: 0.95rem; border-bottom: 2px solid #e5e7eb; }
.modern-table td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.status-indicator { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 2px white, 0 0 0 3px #e5e7eb; margin: 0 auto; }
.badge { padding: 6px 12px; border-radius: 20px; font-weight: 800; font-size: 1rem; display: inline-block; }

/* Paginación */
.pagination-controls { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; }
.btn-page { background: white; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 8px; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-page:hover:not(:disabled) { background: #f3f4f6; }
.btn-page:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { font-size: 0.95rem; font-weight: 500; color: #6b7280; }

@media (max-width: 768px) {
  .top-controls { flex-direction: column; align-items: stretch; }
  .filters-container { flex-direction: column; }
  .btn-export { width: 100%; }
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .kpi-card:first-child { grid-column: span 2; }
  .modern-table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .modern-table { min-width: 600px; }
}
</style>