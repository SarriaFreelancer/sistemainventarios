# 📊 Informe Resumen de Pruebas Automatizadas Enterprise
**Fecha de Ejecución:** 12/8/2026, 10:17:57 p. m.
**Entorno de Pruebas:** Localhost Multi-Tenant (MySQL + Next.js 15)

---

## 📈 Resumen Ejecutivo
- **Total de Escenarios Evaluados:** 1
- **Pruebas Exitosas (PASS):** 0 ✅
- **Pruebas Fallidas (FAIL):** 1 ❌
- **Tasa de Cobertura de Tipos de Producto:** 100% (SALE, RAW_MATERIAL, FINISHED_GOOD, SUPPLY, SERVICE, FIXED_ASSET)

---

## 📝 Detalles de Escenarios Evaluados


### 1. Control y Alerta de Vencimiento por Lotes (ProductBatch)
- **Resultado:** ❌ FALLIDO (FAIL)
- **Descripción:** Falla en auditoría de lotes: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/auth/login
Call log:
[2m  - navigating to "http://localhost:3001/auth/login", waiting until "load"[22m




---
*Informe generado automáticamente por el Motor de Pruebas de Playwright E2E.*
