---
name: saas-ui-ux-design-system
description: >-
  Estándar de diseño UI/UX para Dashboards SaaS modernos utilizando Angular Standalone,
  Tailwind CSS v4 y FontAwesome 6. Define la paleta de colores, efectos Glassmorphism,
  modo oscuro elegante, badges por vertical de negocio y microinteracciones.
---

# SaaS UI/UX Design System (Tailwind v4 + FontAwesome)

Guía oficial de estilos para el desarrollo frontend en Angular + Tailwind CSS v4.

## 1. Paleta de Colores y Superficies (Dark Mode First):
* **Fondo Principal:** `bg-slate-950` (#020617)
* **Sidebar y Header:** `bg-slate-900/90 backdrop-blur-xl border-slate-800/80`
* **Paneles Glassmorphism:** `.glass-panel` (`bg-slate-900/85 backdrop-blur-md border border-slate-800/60`)
* **Tarjetas Interactivas:** `.glass-card` (`bg-slate-900/70 backdrop-blur-sm border border-slate-800/50 hover:border-indigo-500/50`)

## 2. Acentos y Badges por Vertical de Negocio:
* 💊 **Farmacias y Boticas:**
  - Badge: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
  - Icono FontAwesome: `<i class="fa-solid fa-prescription-bottle-medical text-emerald-400"></i>`
* 👕 **Comercio Retail / Ropa:**
  - Badge: `bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`
  - Icono FontAwesome: `<i class="fa-solid fa-shirt text-indigo-400"></i>`
* 🍽️ **Restaurantes y Bares:**
  - Badge: `bg-amber-500/10 text-amber-400 border border-amber-500/20`
  - Icono FontAwesome: `<i class="fa-solid fa-utensils text-amber-400"></i>`

## 3. Iconografía con FontAwesome 6 (fa-solid):
* Dashboard: `fa-solid fa-chart-pie`
* Negocios / Inquilinos: `fa-solid fa-building`
* Bases de Datos Supabase: `fa-solid fa-database`
* Suscripciones / Pagos: `fa-solid fa-credit-card`
* Auditoría / Seguridad: `fa-solid fa-shield-halved`
* Cerrar Sesión: `fa-solid fa-arrow-right-from-bracket`
* Búsqueda: `fa-solid fa-magnifying-glass`
* Agregar: `fa-solid fa-plus`
