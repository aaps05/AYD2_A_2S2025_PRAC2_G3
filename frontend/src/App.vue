<template>
  <div id="app">
    <!-- Header -->
    <header class="header">
      <div class="header-inner">
        <span class="header-icon">🏥</span>
        <div class="header-text">
          <h1>Centro Médico AYD</h1>
          <p>Catálogo de Servicios y Procedimientos Médicos</p>
        </div>
        <button class="btn-admin" :class="{ active: adminMode }" @click="adminMode = !adminMode">
          {{ adminMode ? 'Salir del modo admin' : 'Modo Admin' }}
        </button>
      </div>
    </header>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast" :class="['toast', toast.type]">{{ toast.msg }}</div>
    </transition>

    <div class="page">
      <!-- Loading -->
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>Cargando catálogo...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="state-box error-box">
        <span class="icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="fetchData">Reintentar</button>
      </div>

      <!-- Content -->
      <div v-else class="layout">

        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <h2>Especialidades</h2>
            <button v-if="adminMode" class="btn-add-sm" @click="openEspModal()">+ Nueva</button>
          </div>
          <ul>
            <li :class="{ active: selectedId === null }" @click="selectedId = null">
              <span class="esp-icon">🔬</span>
              Todas
              <span class="count">{{ servicios.length }}</span>
            </li>
            <li
              v-for="esp in especialidades"
              :key="esp.id"
              :class="{ active: selectedId === esp.id }"
              @click="selectedId = esp.id"
            >
              <span class="esp-icon">{{ iconFor(esp.nombre) }}</span>
              <span class="esp-name">{{ esp.nombre }}</span>
              <span class="count">{{ esp.servicios.length }}</span>
              <span v-if="adminMode" class="admin-actions" @click.stop>
                <button class="btn-icon" title="Editar" @click="openEspModal(esp)">Editar</button>
                <button class="btn-icon danger" title="Eliminar" @click="confirmDelete('especialidad', esp)">Eliminar</button>
              </span>
            </li>
          </ul>
        </aside>

        <!-- Main -->
        <main class="main">
          <div class="main-header">
            <div class="section-title">
              <h2>{{ currentTitle }}</h2>
              <p v-if="currentDesc" class="section-desc">{{ currentDesc }}</p>
            </div>
            <button v-if="adminMode" class="btn-add" @click="openSvcModal()">+ Nuevo Servicio</button>
          </div>

          <p v-if="filtered.length === 0" class="empty">
            No hay servicios disponibles para esta especialidad.
          </p>

          <div v-else class="grid">
            <div v-for="svc in filtered" :key="svc.id" class="card">
              <div class="card-top">
                <h3>{{ svc.nombre }}</h3>
                <span :class="['badge', svc.disponible ? 'avail' : 'unavail']">
                  {{ svc.disponible ? 'Disponible' : 'No disponible' }}
                </span>
              </div>
              <p class="desc">{{ svc.descripcion_tecnica }}</p>
              <div v-if="svc.requisitos_previos" class="req">
                <strong>Requisitos:</strong> {{ svc.requisitos_previos }}
              </div>
              <div class="card-footer">
                <div class="price">Q {{ fmt(svc.precio) }}</div>
                <div v-if="adminMode" class="card-admin-actions">
                  <button class="btn-icon" title="Editar" @click="openSvcModal(svc)">Editar</button>
                  <button class="btn-icon danger" title="Eliminar" @click="confirmDelete('servicio', svc)">Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    <footer class="footer">
      <p>© 2026 Centro Médico AYD · Análisis y Diseño de Sistemas 2 · USAC</p>
    </footer>

    <!-- ── Modal Servicio ──────────────────────────────────────────────────── -->
    <div v-if="svcModal.open" class="overlay" @click.self="svcModal.open = false">
      <div class="modal">
        <h3>{{ svcModal.editing ? 'Editar Servicio' : 'Nuevo Servicio' }}</h3>
        <form @submit.prevent="saveServicio">
          <label>Nombre <span class="req-mark">*</span>
            <input v-model="svcForm.nombre" required placeholder="Ej. Radiografía de columna" />
          </label>
          <label>Descripción técnica
            <textarea v-model="svcForm.descripcion_tecnica" rows="3" placeholder="Descripción del procedimiento..." />
          </label>
          <label>Requisitos previos
            <input v-model="svcForm.requisitos_previos" placeholder="Ej. Ayuno de 8 horas" />
          </label>
          <label>Precio (Q) <span class="req-mark">*</span>
            <input v-model.number="svcForm.precio" type="number" min="0" step="0.01" required placeholder="0.00" />
          </label>
          <label class="inline-check">
            <input v-model="svcForm.disponible" type="checkbox" />
            Disponible
          </label>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="svcModal.open = false">Cancelar</button>
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? 'Guardando...' : (svcModal.editing ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Modal Especialidad ─────────────────────────────────────────────── -->
    <div v-if="espModal.open" class="overlay" @click.self="espModal.open = false">
      <div class="modal">
        <h3>{{ espModal.editing ? 'Editar Especialidad' : 'Nueva Especialidad' }}</h3>
        <form @submit.prevent="saveEspecialidad">
          <label>Nombre <span class="req-mark">*</span>
            <input v-model="espForm.nombre" required placeholder="Ej. Dermatología" />
          </label>
          <label>Descripción
            <textarea v-model="espForm.descripcion" rows="2" placeholder="Descripción de la especialidad..." />
          </label>
          <label>Servicios asociados</label>
          <div class="service-checks">
            <label v-for="svc in servicios" :key="svc.id" class="inline-check small">
              <input
                type="checkbox"
                :value="svc.id"
                :checked="espForm.servicios.includes(svc.id)"
                @change="toggleSvcInEsp(svc.id)"
              />
              {{ svc.nombre }}
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="espModal.open = false">Cancelar</button>
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? 'Guardando...' : (espModal.editing ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Diálogo de confirmación de borrado ─────────────────────────────── -->
    <div v-if="deleteTarget" class="overlay" @click.self="deleteTarget = null">
      <div class="modal confirm-modal">
        <span class="confirm-icon">🗑️</span>
        <h3>¿Eliminar {{ deleteTarget.type === 'servicio' ? 'servicio' : 'especialidad' }}?</h3>
        <p>Esta acción no se puede deshacer. Se eliminará permanentemente <strong>{{ deleteTarget.item.nombre }}</strong>.</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="deleteTarget = null">Cancelar</button>
          <button class="btn-delete" :disabled="saving" @click="executeDelete">
            {{ saving ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import {
  getServicios, getEspecialidades,
  createServicio, updateServicio, deleteServicio,
  createEspecialidad, updateEspecialidad, deleteEspecialidad,
} from './services/api.js';

// ── State ─────────────────────────────────────────────────────────────────────
const servicios      = ref([]);
const especialidades = ref([]);
const selectedId     = ref(null);
const loading        = ref(true);
const error          = ref(null);
const adminMode      = ref(false);
const saving         = ref(false);
const toast          = ref(null);
const deleteTarget   = ref(null);

// ── Modals ────────────────────────────────────────────────────────────────────
const svcModal = reactive({ open: false, editing: false, id: null });
const svcForm  = reactive({ nombre: '', descripcion_tecnica: '', requisitos_previos: '', precio: '', disponible: true });

const espModal = reactive({ open: false, editing: false, id: null });
const espForm  = reactive({ nombre: '', descripcion: '', servicios: [] });

// ── Icons ─────────────────────────────────────────────────────────────────────
const ICONS = { 'Cardiología': '❤️', 'Pediatría': '👶', 'Laboratorio Clínico': '🧪', 'Neurología': '🧠', 'Traumatología': '🦴' };
const iconFor = (nombre) => ICONS[nombre] || '🩺';

// ── Computed ──────────────────────────────────────────────────────────────────
const currentEsp   = computed(() => especialidades.value.find((e) => e.id === selectedId.value));
const currentTitle = computed(() => currentEsp.value ? currentEsp.value.nombre : 'Todos los Servicios');
const currentDesc  = computed(() => currentEsp.value?.descripcion || '');
const filtered     = computed(() => {
  if (selectedId.value === null) return servicios.value;
  const ids = currentEsp.value?.servicios ?? [];
  return servicios.value.filter((s) => ids.includes(s.id));
});
const fmt = (val) => Number(val).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Data Fetch ────────────────────────────────────────────────────────────────
async function fetchData() {
  loading.value = true;
  error.value   = null;
  try {
    const [sRes, eRes] = await Promise.all([getServicios(), getEspecialidades()]);
    servicios.value      = sRes.data;
    especialidades.value = eRes.data;
  } catch {
    error.value = 'No se pudo conectar con los servicios. Verifica que los microservicios estén activos.';
  } finally {
    loading.value = false;
  }
}
onMounted(fetchData);

// ── Toast helper ──────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  toast.value = { msg, type };
  setTimeout(() => { toast.value = null; }, 3000);
}

// ── Servicio Modal ────────────────────────────────────────────────────────────
function openSvcModal(svc = null) {
  if (svc) {
    Object.assign(svcForm, { nombre: svc.nombre, descripcion_tecnica: svc.descripcion_tecnica || '',
      requisitos_previos: svc.requisitos_previos || '', precio: svc.precio, disponible: svc.disponible });
    svcModal.id      = svc.id;
    svcModal.editing = true;
  } else {
    Object.assign(svcForm, { nombre: '', descripcion_tecnica: '', requisitos_previos: '', precio: '', disponible: true });
    svcModal.id      = null;
    svcModal.editing = false;
  }
  svcModal.open = true;
}

async function saveServicio() {
  saving.value = true;
  try {
    if (svcModal.editing) {
      const res = await updateServicio(svcModal.id, { ...svcForm });
      const idx = servicios.value.findIndex((s) => s.id === svcModal.id);
      if (idx !== -1) servicios.value[idx] = res.data;
      showToast('Servicio actualizado correctamente');
    } else {
      const res = await createServicio({ ...svcForm });
      servicios.value.push(res.data);
      showToast('Servicio creado correctamente');
    }
    svcModal.open = false;
  } catch {
    showToast('Error al guardar el servicio', 'error');
  } finally {
    saving.value = false;
  }
}

// ── Especialidad Modal ────────────────────────────────────────────────────────
function openEspModal(esp = null) {
  if (esp) {
    Object.assign(espForm, { nombre: esp.nombre, descripcion: esp.descripcion || '', servicios: [...(esp.servicios ?? [])] });
    espModal.id      = esp.id;
    espModal.editing = true;
  } else {
    Object.assign(espForm, { nombre: '', descripcion: '', servicios: [] });
    espModal.id      = null;
    espModal.editing = false;
  }
  espModal.open = true;
}

function toggleSvcInEsp(id) {
  const idx = espForm.servicios.indexOf(id);
  if (idx === -1) espForm.servicios.push(id);
  else espForm.servicios.splice(idx, 1);
}

async function saveEspecialidad() {
  saving.value = true;
  try {
    if (espModal.editing) {
      const res = await updateEspecialidad(espModal.id, { ...espForm });
      const idx = especialidades.value.findIndex((e) => e.id === espModal.id);
      if (idx !== -1) especialidades.value[idx] = res.data;
      showToast('Especialidad actualizada correctamente');
    } else {
      const res = await createEspecialidad({ ...espForm });
      especialidades.value.push(res.data);
      showToast('Especialidad creada correctamente');
    }
    espModal.open = false;
  } catch {
    showToast('Error al guardar la especialidad', 'error');
  } finally {
    saving.value = false;
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
function confirmDelete(type, item) {
  deleteTarget.value = { type, item };
}

async function executeDelete() {
  if (!deleteTarget.value) return;
  saving.value = true;
  const { type, item } = deleteTarget.value;
  try {
    if (type === 'servicio') {
      await deleteServicio(item.id);
      servicios.value = servicios.value.filter((s) => s.id !== item.id);
      if (selectedId.value !== null) {
        const esp = especialidades.value.find((e) => e.id === selectedId.value);
        if (esp) esp.servicios = esp.servicios.filter((id) => id !== item.id);
      }
      showToast('Servicio eliminado');
    } else {
      await deleteEspecialidad(item.id);
      especialidades.value = especialidades.value.filter((e) => e.id !== item.id);
      if (selectedId.value === item.id) selectedId.value = null;
      showToast('Especialidad eliminada');
    }
    deleteTarget.value = null;
  } catch {
    showToast('Error al eliminar', 'error');
  } finally {
    saving.value = false;
  }
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: #f0f4f8;
  color: #1a2332;
  min-height: 100vh;
}

#app { display: flex; flex-direction: column; min-height: 100vh; }

/* ── Header ──────────────────────────────────────────────────────────────── */
.header {
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
  color: white;
  padding: 1.25rem 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.header-inner { display: flex; align-items: center; gap: 1rem; max-width: 1400px; margin: 0 auto; }
.header-icon  { font-size: 2.5rem; }
.header-text  { flex: 1; }
.header h1    { font-size: 1.6rem; font-weight: 700; }
.header p     { font-size: 0.9rem; opacity: 0.85; margin-top: 2px; }

.btn-admin {
  padding: 0.5rem 1rem; border: 2px solid rgba(255,255,255,0.5);
  border-radius: 8px; background: transparent; color: white;
  font-size: 0.85rem; cursor: pointer; white-space: nowrap;
  transition: all 0.2s;
}
.btn-admin:hover, .btn-admin.active { background: rgba(255,255,255,0.2); border-color: white; }

/* ── Toast ───────────────────────────────────────────────────────────────── */
.toast {
  position: fixed; top: 1rem; right: 1rem; z-index: 9999;
  padding: 0.75rem 1.25rem; border-radius: 8px;
  font-size: 0.9rem; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  background: #2e7d32; color: white;
}
.toast.error { background: #c62828; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-10px); }

/* ── Page ────────────────────────────────────────────────────────────────── */
.page { flex: 1; max-width: 1600px; margin: 0 auto; width: 100%; padding: 1.5rem; }

/* ── States ──────────────────────────────────────────────────────────────── */
.state-box {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 1rem; padding: 4rem;
  background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.error-box { border-left: 4px solid #e53935; }
.error-box button {
  padding: 0.5rem 1.5rem; background: #1565c0; color: white;
  border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;
}
.spinner {
  width: 40px; height: 40px; border: 4px solid #e3e8f0;
  border-top-color: #1565c0; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Layout ──────────────────────────────────────────────────────────────── */
.layout { display: flex; gap: 1.5rem; align-items: flex-start; }

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
.sidebar {
  width: 320px; flex-shrink: 0;
  background: white; border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1.25rem;
  position: sticky; top: 1.5rem;
}
.sidebar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.sidebar h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #6b7a8d; }
.sidebar ul { list-style: none; }
.sidebar li {
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
  padding: 0.6rem 0.75rem; border-radius: 8px;
  cursor: pointer; font-size: 0.9rem; color: #3a4a5c;
  transition: background 0.15s; margin-bottom: 2px;
}
.sidebar li:hover { background: #f0f4f8; }
.sidebar li.active { background: #e3eaf8; color: #1565c0; font-weight: 600; }
.esp-icon { font-size: 1rem; }
.esp-name { flex: 1; min-width: 0; }
.count {
  background: #e3eaf8; color: #1565c0;
  font-size: 0.72rem; font-weight: 700;
  padding: 1px 7px; border-radius: 20px;
}
.sidebar li.active .count { background: #1565c0; color: white; }
.admin-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  width: 100%;
}

/* ── Main ────────────────────────────────────────────────────────────────── */
.main { flex: 1; min-width: 0; }
.main-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem; gap: 1rem; }
.section-title h2    { font-size: 1.4rem; color: #1a2332; }
.section-desc { margin-top: 0.3rem; color: #6b7a8d; font-size: 0.9rem; }
.empty { color: #6b7a8d; padding: 2rem; background: white; border-radius: 12px; text-align: center; }

/* ── Grid ────────────────────────────────────────────────────────────────── */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }

/* ── Card ────────────────────────────────────────────────────────────────── */
.card {
  background: white; border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1.25rem;
  display: flex; flex-direction: column; gap: 0.6rem;
  transition: box-shadow 0.2s, transform 0.2s;
}
.card:hover { box-shadow: 0 6px 20px rgba(21,101,192,0.12); transform: translateY(-2px); }
.card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
.card-top h3 { font-size: 0.97rem; font-weight: 700; color: #1a2332; line-height: 1.3; }
.badge {
  flex-shrink: 0; font-size: 0.7rem; font-weight: 600;
  padding: 3px 9px; border-radius: 20px; white-space: nowrap;
}
.avail   { background: #e8f5e9; color: #2e7d32; }
.unavail { background: #fce4ec; color: #c62828; }
.desc { font-size: 0.85rem; color: #4a5568; line-height: 1.5; }
.req  { font-size: 0.82rem; color: #6b7a8d; background: #f7f9fc; padding: 0.4rem 0.6rem; border-radius: 6px; }
.card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 0.5rem; border-top: 1px solid #e8edf3; }
.price { font-size: 1.15rem; font-weight: 700; color: #1565c0; }
.card-admin-actions { display: flex; gap: 4px; }

/* ── Buttons ─────────────────────────────────────────────────────────────── */
.btn-add {
  padding: 0.5rem 1.1rem; background: #1565c0; color: white;
  border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: background 0.2s;
}
.btn-add:hover { background: #0d47a1; }
.btn-add-sm {
  padding: 0.25rem 0.6rem; background: #1565c0; color: white;
  border: none; border-radius: 6px; font-size: 0.75rem; font-weight: 600;
  cursor: pointer; transition: background 0.2s;
}
.btn-add-sm:hover { background: #0d47a1; }
.btn-icon {
  background: none; border: none; cursor: pointer; font-size: 0.84rem;
  padding: 2px 6px; border-radius: 4px; transition: background 0.15s;
  white-space: nowrap;
}
.btn-icon:hover { background: #e3eaf8; }
.btn-icon.danger:hover { background: #fce4ec; }

/* ── Footer ──────────────────────────────────────────────────────────────── */
.footer { text-align: center; padding: 1.5rem; color: #8a9ab0; font-size: 0.8rem; }

/* ── Overlay / Modal ─────────────────────────────────────────────────────── */
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
}
.modal {
  background: white; border-radius: 14px; padding: 2rem;
  width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}
.modal h3 { font-size: 1.2rem; margin-bottom: 1.25rem; color: #1a2332; }

.modal form { display: flex; flex-direction: column; gap: 0.9rem; }
.modal label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.85rem; font-weight: 600; color: #4a5568; }
.modal input[type="text"],
.modal input[type="number"],
.modal textarea {
  padding: 0.55rem 0.75rem; border: 1.5px solid #d0d9e6; border-radius: 7px;
  font-size: 0.9rem; font-family: inherit; color: #1a2332;
  transition: border-color 0.15s;
}
.modal input:focus, .modal textarea:focus { outline: none; border-color: #1565c0; }
.req-mark { color: #e53935; }
.inline-check { flex-direction: row !important; align-items: center; gap: 0.5rem !important; font-weight: normal !important; }
.inline-check.small { font-size: 0.82rem; }
.service-checks { display: flex; flex-direction: column; gap: 0.35rem; max-height: 180px; overflow-y: auto; padding: 0.5rem; border: 1.5px solid #d0d9e6; border-radius: 7px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.btn-cancel {
  padding: 0.5rem 1.1rem; background: #f0f4f8; color: #4a5568;
  border: 1.5px solid #d0d9e6; border-radius: 7px; font-size: 0.9rem; cursor: pointer;
}
.btn-cancel:hover { background: #e3e8f0; }
.btn-save {
  padding: 0.5rem 1.3rem; background: #1565c0; color: white;
  border: none; border-radius: 7px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
}
.btn-save:hover:not(:disabled) { background: #0d47a1; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Confirm Delete Modal ─────────────────────────────────────────────────── */
.confirm-modal { text-align: center; }
.confirm-icon  { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }
.confirm-modal h3 { margin-bottom: 0.5rem; }
.confirm-modal p  { font-size: 0.9rem; color: #4a5568; margin-bottom: 0.5rem; }
.btn-delete {
  padding: 0.5rem 1.3rem; background: #c62828; color: white;
  border: none; border-radius: 7px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
}
.btn-delete:hover:not(:disabled) { background: #b71c1c; }
.btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 768px) {
  .layout { flex-direction: column; }
  .sidebar { width: 100%; position: static; }
  .admin-actions { width: auto; margin-left: 0; justify-content: flex-start; }
  .header-inner { flex-wrap: wrap; }
}
</style>
