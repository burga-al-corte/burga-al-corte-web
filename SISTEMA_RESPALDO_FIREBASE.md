# Sistema de Respaldo Automático de Firebase

## 📋 Descripción General

La página web de **Burga al Corte** ahora cuenta con un sistema de respaldo automático de bases de datos Firebase. Si la base de datos principal se queda sin cuota gratuita o presenta errores, el sistema cambia automáticamente a la base de datos de respaldo sin que los clientes noten ningún problema.

## 🔄 Cómo Funciona

### Bases de Datos Configuradas

1. **Base de Datos Principal**
   - Proyecto: `la-burga-al-corte`
   - Se intenta usar primero siempre

2. **Base de Datos de Respaldo**
   - Proyecto: `burga-al-cortee`
   - Se activa automáticamente si la principal falla

### Flujo Automático

```
┌─────────────────────────────────────┐
│  Cliente hace un pedido             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Sistema intenta usar BD Principal  │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
    ✅ Éxito      ❌ Error
        │         (cuota excedida)
        │             │
        │             ▼
        │   ┌────────────────────────┐
        │   │ Cambio AUTOMÁTICO a    │
        │   │ Base de Datos Respaldo │
        │   └──────────┬─────────────┘
        │              │
        │              ▼
        │   ┌────────────────────────┐
        │   │ Reintentar operación   │
        │   └──────────┬─────────────┘
        │              │
        └──────────────┴──────────────┐
                       │               │
                       ▼               ▼
              ┌────────────────────────────┐
              │  Pedido guardado exitoso   │
              │  (en BD principal o        │
              │   respaldo)                │
              └────────────────────────────┘
```

## ✨ Características

### 1. Detección Automática de Errores
- El sistema detecta cuando la cuota de Firebase se agota
- Reconoce errores de tipo `resource-exhausted` o mensajes de `quota`

### 2. Cambio Transparente
- Los clientes NO ven ningún error
- El cambio de base de datos es invisible para el usuario
- Los pedidos se guardan sin interrupciones

### 3. Operaciones Protegidas

Todas estas funciones tienen respaldo automático:

- ✅ **Guardar pedidos** (`guardarEnFirebase`)
- ✅ **Cargar productos** (`cargarProductosDesdeFirebase`)
- ✅ **Obtener IDs únicos** (`getNextPedidoId`)

### 4. Logs Informativos

El sistema registra en la consola del navegador:

```javascript
✅ Firebase conectado correctamente (base de datos principal)
// ... al usar BD principal

⚠️ Cuota de base de datos principal excedida
🔄 Cambiando automáticamente a base de datos de respaldo...
✅ Firebase conectado correctamente (base de datos de RESPALDO)
ℹ️ La página está funcionando con la base de datos de respaldo
// ... cuando cambia a respaldo
```

## 🔧 Archivos Modificados

### `index.html`

Se agregaron:
- Configuración de BD de respaldo (`firebaseConfigRespaldo`)
- Variable `usandoRespaldo` para rastrear qué BD está activa
- Función `inicializarFirebaseRespaldo()` para conectar al respaldo
- Función `verificarConexionFirebase()` para validar la conexión
- Lógica de cambio automático en todas las operaciones de Firebase

## 📊 Monitoreo

### Cómo Saber Qué Base de Datos Está Activa

1. **En la consola del navegador** (F12):
   - Busca mensajes que digan "base de datos principal" o "base de datos de RESPALDO"
   - Los pedidos guardados en respaldo muestran: `ℹ️ Pedido guardado en base de datos de RESPALDO`

2. **Variable global**:
   ```javascript
   // En la consola del navegador:
   usandoRespaldo
   // Devuelve: false (BD principal) o true (BD respaldo)
   ```

## ⚠️ Importante

### Sincronización de Datos

**Las dos bases de datos son INDEPENDIENTES:**
- Los pedidos guardados en la BD principal solo están en la principal
- Los pedidos guardados en la BD de respaldo solo están en el respaldo
- **NO se sincronizan automáticamente entre sí**

### Recomendación

Revisa regularmente ambas bases de datos:

1. **BD Principal**: `la-burga-al-corte`
   - Firebase Console: https://console.firebase.google.com/project/la-burga-al-corte

2. **BD Respaldo**: `burga-al-cortee`
   - Firebase Console: https://console.firebase.google.com/project/burga-al-cortee

## 🛠️ Configuración de las Credenciales

Las credenciales de ambas bases de datos están configuradas directamente en `index.html`:

- **BD Principal**: Sección `firebaseConfig`
- **BD Respaldo**: Sección `firebaseConfigRespaldo`

**Nota de Seguridad**: En producción con GitHub Pages, las credenciales son públicas. Asegúrate de:
- Configurar reglas de seguridad en Firebase
- Limitar permisos solo a operaciones necesarias (escribir en `pedidos`, leer en `productos`)

## 🎯 Beneficios

1. **Disponibilidad 24/7**: La web funciona siempre, incluso si una BD falla
2. **Sin pérdida de pedidos**: Todos los pedidos se guardan en alguna BD
3. **Experiencia sin interrupciones**: Los clientes nunca ven errores
4. **Automático**: No requiere intervención manual
5. **Transparente**: El cliente no nota ninguna diferencia

## 🔍 Pruebas

Para probar el sistema de respaldo:

1. Abre la consola del navegador (F12)
2. Haz un pedido de prueba
3. Revisa los logs para ver qué base de datos se usó
4. Verifica en Firebase Console que el pedido se guardó

## 📝 Notas Técnicas

- **Versión Firebase**: 9.23.0
- **Tipo**: Firestore (base de datos NoSQL)
- **Límite cuota gratuita**: 50,000 lecturas/día, 20,000 escrituras/día
- **Reintentos**: El sistema reintenta la operación UNA vez con la BD de respaldo
- **Fallback final**: Si ambas BD fallan, se muestra error al usuario
