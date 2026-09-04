---
name: sql-database-architect
description: >-
  Especialista en Arquitectura de Bases de Datos, Modelado Relacional y NoSQL,
  Optimización de Consultas SQL, Diseño de Índices (B-Tree, GIN, GiST, BRIN),
  estrategias Multi-Tenant (Database-per-Tenant en Supabase/PostgreSQL),
  Kardex valorizado y algoritmos de inventario FEFO.
---

# SQL & Database Architect Skill

Esta skill guía el diseño, mantenimiento y optimización de bases de datos para el ecosistema SaaS.

## Principios y Responsabilidades:
1. **Modelado y Normalización:**
   - Diseñar esquemas relacionales hasta 3NF/BCNF con integridad referencial estricta.
   - Usar UUIDv4/UUIDv7 para identificadores primarios en entornos distribuidos.
2. **Aislamiento Multi-Tenant (Supabase):**
   - **Control Plane (`saas_master`):** Gestiona catálogos globales (`verticales`, `planes_suscripcion`, `negocios`, `credenciales_bd_negocio`).
   - **Data Plane (Tenant DB):** Aislamiento por silo para cada cliente (`productos`, `lotes_producto`, `stock_inventario`, `ventas`, `facturacion_electronica_sunat`).
3. **Motor FEFO y Bloqueo de Caducados:**
   - Consultas de picking ordenadas por `fecha_vencimiento ASC` con condición `fecha_vencimiento > CURRENT_DATE`.
   - Control de concurrencia pesimista `SELECT ... FOR UPDATE` para evitar sobreventas.
4. **Optimización de Consultas:**
   - Uso de índices Trigram GIN (`pg_trgm`) para búsquedas predictivas en POS.
   - Análisis de buffers y escaneos con `EXPLAIN ANALYZE`.
