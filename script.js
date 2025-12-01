// BURGA AL CORTE - MAIN SCRIPT
// Optimized & Clean Code

// Global variables
let carrito = [];
let metodoPagoSeleccionado = null;

// Variables para sistema de bebidas en promos
let promoEnProceso = null;
let bebidasSeleccionadas = {
  'Pepsi': 0,
  'Seven Up': 0
};

// Configuration
const CONFIG = {
  WHATSAPP_NUMBER: '541141690977',
  STORAGE_KEY: 'carritoburga',
  DEBUG_MODE: false, // Set to false for production
  // Control de sincronización offline: si false, no se guardan pedidos para sincronizar
  ALLOW_OFFLINE_SYNC: false
};

// UTILITY FUNCTIONS

// Debug function removed - not needed in production

/**
 * Safely gets element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} The element or null if not found
 */
function safeGetElement(id) {
  const element = document.getElementById(id);
  if (!element) {
  }
  return element;
}

// CART FUNCTIONS

/**
 * Initializes cart from localStorage
 */
function inicializarCarrito() {
  try {
    const carritoGuardado = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (carritoGuardado) {
      carrito = JSON.parse(carritoGuardado);
      mostrarCarrito();
    }
  } catch (error) {
    carrito = [];
  }
}

/**
 * Saves cart to localStorage
 */
function guardarCarrito() {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(carrito));
  } catch (error) {
    mostrarNotificacion('Error guardando carrito', 'error');
  }
}

/**
 * Adds item to cart with validation
 * @param {string} nombre - Product name
 * @param {number} precio - Product price
 */
function agregarAlCarrito(nombre, precio, categoria = '') {
  // Input validation
  if (!nombre || typeof precio !== 'number' || precio <= 0) {
    mostrarNotificacion('Error: Producto inválido', 'error');
    return;
  }

  try {
    // Verificar si es una promo que incluye bebidas (por categoría o nombre)
    const esPromo = categoria === 'promo' || nombre.toLowerCase().includes('promo');
    
    if (esPromo) {
      // Agregar promo inmediatamente al carrito SIN bebidas seleccionadas
      const itemExistente = carrito.find(item => item.nombre === nombre);
      
      if (itemExistente) {
        itemExistente.cantidad++;
      } else {
        carrito.push({ 
          nombre, 
          precio, 
          cantidad: 1,
          esPromo: true,
          bebidasSeleccionadas: false,
          bebidas: [],
          descripcionBebidas: ''
        });
      }
      
      mostrarCarrito();
      guardarCarrito();
      mostrarNotificacion(`${nombre} agregada al carrito. Podés elegir tus bebidas desde el carrito.`);
      // Ya no se abre el carrito ni el selector de bebidas automáticamente
      return;
    }
    
    // Agregar producto normal al carrito
    const itemExistente = carrito.find(item => item.nombre === nombre);
    
    if (itemExistente) {
      itemExistente.cantidad++;
    } else {
      carrito.push({ nombre, precio, cantidad: 1 });
    }
    
    mostrarCarrito();
    guardarCarrito();
    mostrarNotificacion(`${nombre} agregado al carrito`);
  } catch (error) {
    mostrarNotificacion('Error agregando al carrito', 'error');
  }
}

/**
 * Updates cart display with improved error handling
 */
function mostrarCarrito() {
  const lista = safeGetElement("lista-carrito");
  const total = safeGetElement("total-carrito");
  
  if (!lista || !total) {
    return;
  }
  
  try {
    lista.innerHTML = "";
    let suma = 0;
    
      carrito.forEach((item, index) => {
      suma += item.precio * item.cantidad;
      const li = document.createElement("li");
      
      // Crear descripción del item
      // Si el nombre ya incluye un sufijo ' xN' no lo volvemos a concatenar
      let descripcionItem = '';
      const nombreStr = String(item.nombre || '');
      // Quitar paréntesis al final para evaluar si el nombre base ya incluye ' xN'
      const baseNameNoParen = nombreStr.replace(/\s*\([^)]*\)\s*$/, '');
      const qtySuffixRegex = /\s*x\d+\s*$/i;
      if (qtySuffixRegex.test(baseNameNoParen)) {
        // El nombre base ya contiene ' xN', usamos el nombre tal cual (incluye paréntesis si los tiene)
        descripcionItem = nombreStr;
      } else {
        descripcionItem = `${nombreStr} x${item.cantidad}`;
      }
      let botonesExtra = '';
      
      // Si es una promo, mostrar estado de bebidas y botón para seleccionarlas
      if (item.esPromo) {
        if (item.bebidasSeleccionadas && item.descripcionBebidas) {
          // Promo con bebidas ya seleccionadas
          // Evitar duplicar si el nombre ya contiene la descripción entre paréntesis
          if (!/\(/.test(nombreStr)) {
            descripcionItem += `<br><small style="color: #27ae60; font-size: 0.85em;">🥤 Bebidas: ${item.descripcionBebidas}</small>`;
          }
          botonesExtra = `<button onclick="cambiarBebidasPromo(${index})" class="btn-cambiar-bebidas" style="background:#f39c12; color:white; border:none; border-radius:3px; padding:5px 10px; margin-left:10px; font-size:0.8em; cursor:pointer;">Cambiar Bebidas</button>`;
        } else {
          // Promo sin bebidas seleccionadas
          let bebidasPorPromo = 3;
          const nombrePromo = item.nombre.toLowerCase();
          if (
            nombrePromo.includes('ax100') ||
            nombrePromo.includes('promo fan') ||
            nombrePromo.includes('promo ybr')
          ) {
            bebidasPorPromo = 2;
          }
          const totalBebidas = bebidasPorPromo * item.cantidad;
          descripcionItem += `<br><small style="color: #e74c3c; font-size: 0.85em;">⚠️ Falta elegir ${totalBebidas} bebida${totalBebidas > 1 ? 's' : ''} gratis</small>`;
          botonesExtra = `<button onclick="seleccionarBebidasPromo(${index})" class="btn-elegir-bebidas" style="background:#e74c3c; color:white; border:none; border-radius:5px; padding:8px 15px; margin-left:10px; font-weight:bold; cursor:pointer; animation:pulse 1.5s infinite;">¡ELEGIR BEBIDAS!</button>`;
        }
      }
      
      li.innerHTML = `
        <div class="carrito-item">
          <span>${descripcionItem}</span>
          <span>$${(item.precio * item.cantidad).toLocaleString()}</span>
          <div style="display: flex; align-items: center;">
            ${botonesExtra}
            <button onclick="quitarDelCarrito(${index})" class="btn-remove-item" style="margin-left: 10px;">❌</button>
          </div>
        </div>
      `;
      lista.appendChild(li);
    });

    total.textContent = `Total: $${suma.toLocaleString()}`;
    
    // Actualizar contador en la navegación
    actualizarContadorCarrito();
    
  } catch (error) {
    mostrarNotificacion('Error mostrando carrito', 'error');
  }
}

/**
 * Removes item from cart with validation
 * @param {number} index - Item index in cart array
 */
function quitarDelCarrito(index) {
  if (typeof index !== 'number' || index < 0 || index >= carrito.length) {
    mostrarNotificacion('Error eliminando producto', 'error');
    return;
  }

  try {
    const removedItem = carrito[index];
    carrito.splice(index, 1);
    
    mostrarCarrito();
    guardarCarrito();
    
    mostrarNotificacion(`${removedItem.nombre} eliminado del carrito`, 'warning');
  } catch (error) {
    mostrarNotificacion('Error eliminando producto', 'error');
  }
}

// ORDER PROCESSING FUNCTIONS

/**
 * Validates order data before processing
 * @returns {object|null} Validation result with data or null if invalid
 */
function validarDatosPedido() {
  if (carrito.length === 0) {
    mostrarNotificacion("El carrito está vacío", 'warning');
    return null;
  }

  // Validar que las promos tengan bebidas seleccionadas
  const promosSinBebidas = carrito.filter(item => item.esPromo && !item.bebidasSeleccionadas);
  if (promosSinBebidas.length > 0) {
    mostrarNotificacion("❌ Debes elegir las bebidas gratis para tus promos antes de continuar", 'error');
    return null;
  }

  const nombre = safeGetElement("pedido-nombre")?.value.trim();
  const direccion = safeGetElement("pedido-direccion")?.value.trim();
  const telefono = safeGetElement("pedido-telefono")?.value.trim();

  if (!nombre || !direccion || !telefono) {
    mostrarNotificacion("Por favor, completá tu nombre, dirección y teléfono", 'warning');
    return null;
  }

  if (!metodoPagoSeleccionado) {
    mostrarNotificacion("Por favor, selecciona un método de pago", 'warning');
    return null;
  }

  return { nombre, direccion, telefono };
}

// Variable para prevenir doble procesamiento
let procesandoPedido = false;

/**
 * Main order processing function with improved error handling and duplicate prevention
 */
async function realizarPedido() {
  // Prevenir doble procesamiento con logs detallados
  if (procesandoPedido) {
    console.log('🚫 DUPLICATE ORDER ATTEMPT BLOCKED:', {
      timestamp: new Date().toISOString(),
      processingFlag: procesandoPedido,
      caller: 'realizarPedido'
    });
    mostrarNotificacion('Pedido ya siendo procesado...', 'warning');
    return;
  }

  console.log('🔄 ORDER PROCESSING STARTED:', {
    timestamp: new Date().toISOString(),
    carrito: carrito.length,
    metodoPago: metodoPagoSeleccionado
  });

  const datosValidados = validarDatosPedido();
  if (!datosValidados) return;

  const { nombre, direccion, telefono } = datosValidados;

  // Marcar como procesando y deshabilitar botón COMPLETAMENTE
  procesandoPedido = true;
  const btnPedido = safeGetElement('btn-hacer-pedido');
  if (btnPedido) {
    btnPedido.disabled = true;
    btnPedido.textContent = 'Procesando...';
    btnPedido.style.pointerEvents = 'none'; // Prevenir cualquier click
    btnPedido.onclick = null; // Remover handler temporalmente
  }

  try {
    // Handle MercadoPago summary display
    if (metodoPagoSeleccionado === 'mercadopago' && !window._mpResumenMostrado) {
      const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      window._mpResumenMostrado = true;
      
      if (window.mostrarResumenMercadoPago) {
        window.mostrarResumenMercadoPago(total);
      } else {
        mostrarNotificacion('Error mostrando resumen de MercadoPago', 'error');
      }
      return;
    }
    window._mpResumenMostrado = false;

    // Calculate total and prepare order data
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const metodoPagoTexto = metodoPagoSeleccionado === 'efectivo' ? 'Efectivo' : 'MercadoPago';
    const ahora = new Date();
    
    const pedidoData = {
      nombre,
      direccion,
      telefono,
      metodoPago: metodoPagoTexto,
      items: carrito.map(item => {
        // Estructura para Firebase: nombre, cantidad, precio, producto_id, agregado_gratis
        const prod = {
          nombre: item.nombre,
          cantidad: String(item.cantidad),
          precio: item.precio,
          producto_id: item.producto_id || item.id || ''
        };

        // Preparar descripción y array de bebidas si el ítem es una promo y tiene selección
        let bebidasArr = [];
        let bebidasDescripcion = null;

        // Si ya existe una descripción legible (descripcionBebidas) la usamos
        if (item.descripcionBebidas) {
          bebidasDescripcion = item.descripcionBebidas;
          // También construir el arreglo desde la descripción si es posible
          // (mantenemos la compatibilidad con agregado_gratis)
          if (item.bebidas) {
            Object.entries(item.bebidas).forEach(([bebida, cantidad]) => {
              for (let i = 0; i < cantidad; i++) {
                bebidasArr.push(bebida.trim());
              }
            });
          }
        } else if (item.esPromo && item.bebidas) {
          // Construir desde el objeto item.bebidas: { 'Pepsi': 4, 'Seven Up': 2 }
          const partes = [];
          Object.entries(item.bebidas).forEach(([bebida, cantidad]) => {
            const cnt = Number(cantidad) || 0;
            if (cnt <= 0) return;
            // Normalizar para el array y para la descripción
            let nombreBebidaNorm = bebida.trim();
            // Normalizar a formato legible 'seven up' en minúsculas cuando corresponda
            const lower = nombreBebidaNorm.toLowerCase();
            if (lower === 'seven up' || lower === '7up' || lower === '7 up' || lower.includes('seven')) {
              nombreBebidaNorm = 'seven up';
            }
            // Descripción con formato solicitado: 'x2 pepsi' (minúsculas)
            partes.push(`x${cnt} ${nombreBebidaNorm.toLowerCase()}`);
            for (let i = 0; i < cnt; i++) {
              bebidasArr.push(nombreBebidaNorm);
            }
          });
          if (partes.length > 0) {
            bebidasDescripcion = partes.join(', ');
          }
        }

        // Si tenemos descripción de bebidas, anexarla al nombre del producto entre paréntesis
        if (bebidasDescripcion) {
          // Normalizar el nombre base: quitar paréntesis y cualquier ' xN' previo para evitar duplicados
          let baseName = String(prod.nombre || '').replace(/\s*\([^)]*\)\s*$/, '').replace(/\s*x\d+\s*$/, '').trim();

          // Para promociones, queremos el formato: "{nombre_base} x{cantidad} ({bebidas})"
          if (item.esPromo) {
            const qty = String(prod.cantidad || '1');
            prod.nombre = `${baseName} x${qty} ( ${bebidasDescripcion})`;
          } else {
            // Para items normales, anexar la descripción entre paréntesis si no existe
            if (!/\(/.test(prod.nombre)) {
              prod.nombre = `${baseName} (${bebidasDescripcion})`;
            }
          }

          // Mantener agregado_gratis como array para compatibilidad con la app de escritorio
          if (bebidasArr.length > 0) {
            prod.agregado_gratis = bebidasArr;
          }
        }

        return prod;
      }),
      total,
      fecha: ahora,
      fechaPedido: ahora.toLocaleDateString('es-AR'),
      horaPedido: ahora.toLocaleTimeString('es-AR'),
      estado: 'pendiente',
      origen: 'página web',
      entregado: false
    };

    // Try to save to Firebase - Inicializar bajo demanda si es necesario
    let pedidoId = null;
    
    // Inicializar Firebase bajo demanda si no está inicializado
    if (!window.db && window.inicializarFirebase) {
      await window.inicializarFirebase();
    }
    
    if (window.guardarEnFirebase) {
      try {
        pedidoId = await window.guardarEnFirebase(pedidoData);
      } catch (error) {
        mostrarNotificacion('Error conectando con la base de datos. El pedido se guardará para sincronizar después.', 'warning');
        
        // Guardar pedido para sincronización posterior sólo si la configuración lo permite
        if (CONFIG.ALLOW_OFFLINE_SYNC) {
          guardarPedidoPendienteSync(pedidoData);
          pedidoId = `OFFLINE-${Date.now()}`;
        } else {
          // Mark as offline id but do not persist locally when sync is disabled
          pedidoId = `OFFLINE-${Date.now()}`;
        }
      }
    } else {
      mostrarNotificacion('Base de datos no disponible. El pedido se guardará para sincronizar después.', 'info');
      
      // Guardar pedido para sincronización posterior sólo si la configuración lo permite
      if (CONFIG.ALLOW_OFFLINE_SYNC) {
        guardarPedidoPendienteSync(pedidoData);
        pedidoId = `OFFLINE-${Date.now()}`;
      } else {
        pedidoId = `OFFLINE-${Date.now()}`;
      }
    }

    // Create WhatsApp message using new function
    const mensaje = crearMensajeWhatsApp(pedidoData, pedidoId);

    // Send WhatsApp message
    const url = `https://api.whatsapp.com/send?phone=${CONFIG.WHATSAPP_NUMBER}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");

    // Clear form and cart
    limpiarFormularioPedido();
    mostrarNotificacion("¡Pedido enviado correctamente!");
    
    console.log('✅ ORDER COMPLETED SUCCESSFULLY:', {
      timestamp: new Date().toISOString(),
      pedidoId: pedidoId,
      total: pedidoData.total,
      metodo: metodoPagoSeleccionado
    });
    
  } catch (error) {
    mostrarNotificacion('Error procesando el pedido. Intenta nuevamente.', 'error');
  } finally {
    // Restablecer estado después de un breve delay para prevenir doble-clicks
    setTimeout(() => {
      procesandoPedido = false;
      const btnPedido = safeGetElement('btn-hacer-pedido');
      if (btnPedido) {
        btnPedido.disabled = false;
        btnPedido.textContent = 'Hacer Pedido';
        btnPedido.style.pointerEvents = 'auto'; // Restaurar eventos
        btnPedido.onclick = realizarPedido; // Restaurar handler
      }
    }, 1000); // 1 segundo de delay para prevenir clicks múltiples
  }
}

/**
 * Clears the order form and resets cart
 */
function limpiarFormularioPedido() {
  try {
    carrito = [];
    mostrarCarrito();
    guardarCarrito();
    
    // Clear form fields
    const nombreInput = safeGetElement("pedido-nombre");
    const direccionInput = safeGetElement("pedido-direccion");
    const descPago = safeGetElement('desc-pago');
    const btnPedido = safeGetElement('btn-hacer-pedido');
    
    if (nombreInput) nombreInput.value = "";
    if (direccionInput) direccionInput.value = "";
      const telefonoInput = safeGetElement('pedido-telefono');
      if (telefonoInput) telefonoInput.value = '';
    if (descPago) descPago.textContent = "";
    if (btnPedido) {
      btnPedido.disabled = true;
      btnPedido.textContent = 'Hacer Pedido';
      btnPedido.style.pointerEvents = 'auto';
      btnPedido.onclick = realizarPedido;
    }
    
    // Clear payment selection
    metodoPagoSeleccionado = null;
    document.querySelectorAll('.btn-pago').forEach(btn => {
      btn.classList.remove('seleccionado');
    });
    
  } catch (error) {
  }
}

// UI FUNCTIONS

/**
 * Shows notification with improved error handling
 * @param {string} mensaje - Notification message
 * @param {string} tipo - Notification type: 'success', 'error', 'warning', 'info'
 */
function mostrarNotificacion(mensaje, tipo = 'success') {
  if (!mensaje) return;
  
  try {
    // Remove existing notifications to avoid clutter
    document.querySelectorAll('.notificacion').forEach(notif => notif.remove());
    
    const notif = document.createElement("div");
    notif.className = `notificacion ${tipo}`;
    notif.textContent = mensaje;
    
    // Add close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "×";
    closeBtn.style.cssText = "background:none;border:none;color:inherit;font-size:1.2em;font-weight:bold;cursor:pointer;float:right;margin-left:10px;";
    closeBtn.onclick = () => notif.remove();
    
    notif.appendChild(closeBtn);
    document.body.appendChild(notif);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notif.parentNode) {
        notif.remove();
      }
    }, 5000);
    
  } catch (error) {
    // Fallback to alert if notification system fails
    alert(mensaje);
  }
}

/**
 * Handles payment method selection with validation
 * @param {string} metodo - Payment method: 'efectivo' or 'mercadopago'
 */
function seleccionarPago(metodo) {
  if (!metodo || !['efectivo', 'mercadopago'].includes(metodo)) {
    mostrarNotificacion('Método de pago inválido', 'error');
    return;
  }

  try {
    metodoPagoSeleccionado = metodo;
    
    // Update button styles
    document.querySelectorAll('.btn-pago').forEach(btn => {
      btn.classList.remove('seleccionado');
    });
    
    const selectedBtn = safeGetElement(`btn-${metodo}`);
    if (selectedBtn) {
      selectedBtn.classList.add('seleccionado');
    }
    
    // Update description and enable order button
    const descPago = safeGetElement('desc-pago');
    const btnPedido = safeGetElement('btn-hacer-pedido');
    
    if (descPago) {
      if (metodo === 'efectivo') {
        descPago.textContent = "💵 Se paga en efectivo en el domicilio";
        descPago.style.color = "#4CAF50";
      } else if (metodo === 'mercadopago') {
        descPago.textContent = "💳 Transferencia por MercadoPago";
        descPago.style.color = "#00BCD4";
      }
    }
    
    // Solo habilitar botón si no se está procesando un pedido
    if (btnPedido && !procesandoPedido) {
      btnPedido.disabled = false;
    }
    
    mostrarNotificacion(`Método de pago: ${metodo === 'efectivo' ? 'Efectivo' : 'MercadoPago'}`, 'info');
    
  } catch (error) {
    mostrarNotificacion('Error seleccionando método de pago', 'error');
  }
}

// OFFLINE ORDERS SYNC SYSTEM

/**
 * Saves order to localStorage for later sync when Firebase is back online
 * @param {object} pedidoData - Order data to save
 */
function guardarPedidoPendienteSync(pedidoData) {
  try {
    // Si la sincronización offline está deshabilitada, no guardar pedidos pendientes
    if (!CONFIG.ALLOW_OFFLINE_SYNC) {
      console.warn('Sincronización offline deshabilitada - no se guardará el pedido pendiente');
      return;
    }
    // Get existing pending orders
    const pedidosPendientes = JSON.parse(localStorage.getItem('pedidosPendientesSync') || '[]');
    
    // Preservar fecha EXACTA del pedido original
    const fechaOriginalPedido = pedidoData.fecha || new Date();
    
    const pedidoPendiente = {
      ...pedidoData,
      // IDs de identificación
      offlineId: `OFFLINE-${Date.now()}`,
      
      // Fechas preservadas - LA MÁS IMPORTANTE ES LA ORIGINAL
      fechaOffline: fechaOriginalPedido.toISOString(), // Esta es la fecha REAL del pedido
      fechaGuardadoLocal: new Date().toISOString(),     // Cuándo se guardó localmente
      
      // Textos originales preservados  
      fechaPedidoOriginal: fechaOriginalPedido.toLocaleDateString('es-AR'),
      horaPedidoOriginal: fechaOriginalPedido.toLocaleTimeString('es-AR'),
      
      // Estado de sincronización
      estadoSync: 'pendiente',
      intentosSync: 0
    };
    
    pedidosPendientes.push(pedidoPendiente);
    
    // Save to localStorage
    localStorage.setItem('pedidosPendientesSync', JSON.stringify(pedidosPendientes));
    
    
  // Show sync info to user
  mostrarNotificacionSync(pedidosPendientes.length);
    
  } catch (error) {
  }
}

/**
 * Creates descriptive note for recovered orders
 * @param {Date} fechaOriginal - Original order date
 * @param {Date} fechaRecuperacion - Recovery date  
 * @returns {string} Descriptive note
 */
function crearNotaRecuperacion(fechaOriginal, fechaRecuperacion) {
  const fechaOriginalStr = fechaOriginal.toLocaleDateString('es-AR');
  const horaOriginalStr = fechaOriginal.toLocaleTimeString('es-AR');
  const fechaRecuperacionStr = fechaRecuperacion.toLocaleDateString('es-AR');
  const horaRecuperacionStr = fechaRecuperacion.toLocaleTimeString('es-AR');
  
  const diasDiferencia = Math.floor((fechaRecuperacion - fechaOriginal) / (1000 * 60 * 60 * 24));
  
  let nota = `🔄 PEDIDO RECUPERADO AUTOMÁTICAMENTE\n`;
  nota += `📅 Fecha original del pedido: ${fechaOriginalStr} a las ${horaOriginalStr}\n`;
  nota += `🔄 Fecha de recuperación: ${fechaRecuperacionStr} a las ${horaRecuperacionStr}\n`;
  
  if (diasDiferencia === 0) {
    nota += `⏰ Recuperado el mismo día`;
  } else if (diasDiferencia === 1) {
    nota += `⏰ Recuperado al día siguiente`;
  } else {
    nota += `⏰ Recuperado después de ${diasDiferencia} días`;
  }
  
  nota += `\n💡 Este pedido se hizo sin conexión a la base de datos y se sincronizó automáticamente.`;
  
  return nota;
}

/**
 * Creates WhatsApp message with proper date handling for recovered orders
 * @param {object} pedidoData - Order data
 * @param {string} pedidoId - Order ID (could be offline ID or Firebase ID)
 * @returns {string} WhatsApp message
 */
function crearMensajeWhatsApp(pedidoData, pedidoId) {
  const esRecuperado = pedidoData.origenSync === 'recuperacion_offline';
  const fechaOriginal = esRecuperado ? new Date(pedidoData.fechaOffline) : (pedidoData.fecha || new Date());
  
  let mensaje = esRecuperado 
    ? "🔄 *PEDIDO RECUPERADO - BURGA AL CORTE* 🔄\n\n"
    : "🍔 *NUEVO PEDIDO - BURGA AL CORTE* 🍔\n\n";
  
  // ID del pedido
  if (pedidoId) {
    mensaje += `📝 Pedido #${pedidoId}\n`;
  }
  
  // Fechas - MOSTRAR LA FECHA ORIGINAL DEL PEDIDO
  mensaje += `📅 *Fecha del pedido:* ${fechaOriginal.toLocaleDateString('es-AR')}\n`;
  mensaje += `⏰ *Hora del pedido:* ${fechaOriginal.toLocaleTimeString('es-AR')}\n`;
  
  // Si es recuperado, mostrar info adicional
  if (esRecuperado) {
    const fechaRecuperacion = new Date();
    const diasDiferencia = Math.floor((fechaRecuperacion - fechaOriginal) / (1000 * 60 * 60 * 24));
    
    mensaje += `\n🔄 *PEDIDO RECUPERADO AUTOMÁTICAMENTE*\n`;
    mensaje += `📅 Recuperado: ${fechaRecuperacion.toLocaleDateString('es-AR')} a las ${fechaRecuperacion.toLocaleTimeString('es-AR')}\n`;
    
    if (diasDiferencia === 0) {
      mensaje += `⏰ Recuperado el mismo día\n`;
    } else if (diasDiferencia === 1) {
      mensaje += `⏰ Recuperado al día siguiente\n`;
    } else {
      mensaje += `⏰ Recuperado después de ${diasDiferencia} días\n`;
    }
    
    if (pedidoData.offlineOriginalId) {
      mensaje += `🔗 ID original offline: ${pedidoData.offlineOriginalId}\n`;
    }
  }
  
  mensaje += `\n`;
  
  // Productos (soportar ambos formatos: pedidoData.productos o pedidoData.items)
  const productosLista = pedidoData.productos || pedidoData.items || [];
  productosLista.forEach(item => {
    // Asegurar campos numéricos/strings coherentes
    const nombre = item.nombre || item.nombre_producto || 'Producto';
    const cantidad = Number(item.cantidad) || 1;
    const precio = Number(item.precio) || 0;

    // Evitar duplicar la cantidad si ya está presente en el nombre.
    // Eliminamos el paréntesis final para comprobar si el sufijo ' xN' ya existe.
    const nombreBaseSinParen = String(nombre).replace(/\s*\([^)]*\)\s*$/, '');
    const tieneQty = /\s*x\d+\s*$/i.test(nombreBaseSinParen);
    const nombreParaMostrar = tieneQty ? nombre : `${nombre} x${cantidad}`;

    mensaje += `• ${nombreParaMostrar} - $${(precio * cantidad).toLocaleString()}\n`;

    // Si es una promo con bebidas, soportar varias estructuras:
    // - descripcionBebidas (string)
    // - bebidas (obj) + descripcionBebidas
    // - agregado_gratis (array de strings)
    if (item.descripcionBebidas) {
      mensaje += `  🥤 Bebidas incluidas: ${item.descripcionBebidas}\n`;
    } else if (item.bebidas && item.descripcionBebidas) {
      mensaje += `  🥤 Bebidas incluidas: ${item.descripcionBebidas}\n`;
    } else if (Array.isArray(item.agregado_gratis) && item.agregado_gratis.length > 0) {
      mensaje += `  🥤 Bebidas incluidas: ${item.agregado_gratis.join(', ')}\n`;
    }
  });

  mensaje += `\n💰 *TOTAL: $${pedidoData.total.toLocaleString()}*\n\n`;
  mensaje += `👤 *Cliente:* ${pedidoData.nombre}\n`;
  mensaje += `📍 *Dirección:* ${pedidoData.direccion}\n`;
  mensaje += `💳 *Método de pago:* ${pedidoData.metodoPago}\n`;
  mensaje += `📝 *Estado:* ${esRecuperado ? 'Recuperado' : 'Pendiente'}\n`;
  mensaje += `🌐 *Origen:* ${esRecuperado ? 'Recuperación automática' : 'Página Web'}`;
  
  return mensaje;
}

/**
 * Shows notification about pending sync orders
 * @param {number} count - Number of pending orders
 */
function mostrarNotificacionSync(count) {
  const mensaje = count === 1 
    ? '💾 1 pedido guardado para sincronizar cuando vuelva la conexión'
    : `💾 ${count} pedidos guardados para sincronizar cuando vuelva la conexión`;
    
  mostrarNotificacion(mensaje, 'info');
}

/**
 * Attempts to sync all pending orders when Firebase becomes available
 */
async function sincronizarPedidosPendientes() {
  try {
    const pedidosPendientes = JSON.parse(localStorage.getItem('pedidosPendientesSync') || '[]');
    
    if (pedidosPendientes.length === 0) {
      return;
    }
    
    
    let syncedCount = 0;
    let failedOrders = [];
    
    for (let i = 0; i < pedidosPendientes.length; i++) {
      const pedido = pedidosPendientes[i];
      
      if (pedido.estadoSync === 'completado') {
        syncedCount++;
        continue;
      }
      
      try {
        // Attempt to save to Firebase
        if (window.guardarEnFirebase) {
          // Preservar fechas originales y agregar info de recuperación
          const fechaOriginal = new Date(pedido.fechaOffline);
          const fechaRecuperacion = new Date();
          
          const pedidoParaSync = {
            ...pedido,
            // Preservar fecha y hora ORIGINALES del pedido
            fecha: fechaOriginal,
            fechaPedido: fechaOriginal.toLocaleDateString('es-AR'),
            horaPedido: fechaOriginal.toLocaleTimeString('es-AR'),
            
            // Información de sincronización
            origenSync: 'recuperacion_offline',
            offlineOriginalId: pedido.offlineId,
            fechaRecuperacion: fechaRecuperacion.toISOString(),
            fechaRecuperacionTexto: fechaRecuperacion.toLocaleDateString('es-AR'),
            horaRecuperacionTexto: fechaRecuperacion.toLocaleTimeString('es-AR'),
            
            // Calcular días de diferencia
            diasRetraso: Math.floor((fechaRecuperacion - fechaOriginal) / (1000 * 60 * 60 * 24)),
            
            // Estado especial
            estado: 'recuperado_offline',
            
            // Nota descriptiva automática
            notaRecuperacion: crearNotaRecuperacion(fechaOriginal, fechaRecuperacion)
          };
          
          const firebaseId = await window.guardarEnFirebase(pedidoParaSync);
          
          // Mark as synced
          pedidosPendientes[i].estadoSync = 'completado';
          pedidosPendientes[i].firebaseId = firebaseId;
          pedidosPendientes[i].fechaSync = new Date().toISOString();
          
          syncedCount++;
          
          // Enviar WhatsApp automático para pedido recuperado
          try {
            const mensajeRecuperacion = crearMensajeWhatsApp(pedidoParaSync, firebaseId);
            const url = `https://api.whatsapp.com/send?phone=${CONFIG.WHATSAPP_NUMBER}&text=${encodeURIComponent(mensajeRecuperacion)}`;
            
            // Enviar automáticamente (sin abrir ventana para no molestar al usuario)
            // Solo registramos que se envió
            
            // Opcional: Solo abrir si el usuario está activo
            if (document.hasFocus()) {
              setTimeout(() => {
                window.open(url, "_blank");
              }, syncedCount * 2000); // Espaciar los envíos
            }
          } catch (error) {
          }
          
        } else {
          throw new Error('Firebase not available');
        }
      } catch (error) {
        pedidosPendientes[i].intentosSync = (pedidosPendientes[i].intentosSync || 0) + 1;
        failedOrders.push(pedido);
      }
    }
    
    // Update localStorage with sync status
    localStorage.setItem('pedidosPendientesSync', JSON.stringify(pedidosPendientes));
    
    // Show sync results
    if (syncedCount > 0) {
      const mensaje = syncedCount === 1 
        ? '✅ 1 pedido sincronizado exitosamente con Firebase'
        : `✅ ${syncedCount} pedidos sincronizados exitosamente con Firebase`;
      mostrarNotificacion(mensaje, 'success');
    }
    
    if (failedOrders.length > 0) {
      const mensaje = `⚠️ ${failedOrders.length} pedidos pendientes de sincronizar`;
      mostrarNotificacion(mensaje, 'warning');
    }
    
    return {
      synced: syncedCount,
      failed: failedOrders.length,
      total: pedidosPendientes.length
    };
    
  } catch (error) {
    mostrarNotificacion('Error en el proceso de sincronización', 'error');
  }
}

/**
 * Checks Firebase availability and syncs pending orders
 */
async function verificarYSincronizar() {
  try {
    // Inicializar Firebase bajo demanda si es necesario
    if (!window.db && window.inicializarFirebase) {
      const conectado = await window.inicializarFirebase();
      if (!conectado) {
        return;
      }
    }
    
    // Check if Firebase is available
    if (window.guardarEnFirebase && window.cargarProductosDesdeFirebase) {
      await sincronizarPedidosPendientes();
    } else {
    }
  } catch (error) {
  }
}

/**
 * Gets count of pending sync orders
 * @returns {number} Count of pending orders
 */
function contarPedidosPendientes() {
  try {
    const pedidosPendientes = JSON.parse(localStorage.getItem('pedidosPendientesSync') || '[]');
    return pedidosPendientes.filter(p => p.estadoSync !== 'completado').length;
  } catch {
    return 0;
  }
}

/**
 * Shows sync status in UI
 */
function mostrarEstadoSync() {
  const pendientes = contarPedidosPendientes();
  
  if (pendientes > 0) {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'sync-status';
    statusDiv.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 10px 15px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1000;
      font-size: 0.9rem;
      cursor: pointer;
    `;
    statusDiv.innerHTML = `
      💾 ${pendientes} pedido${pendientes > 1 ? 's' : ''} por sincronizar
      <br><small>Click para intentar sincronizar</small>
    `;
    
    statusDiv.onclick = verificarYSincronizar;
    
    // Remove existing status
    const existing = document.getElementById('sync-status');
    if (existing) existing.remove();
    
    document.body.appendChild(statusDiv);
  }
}

// PRODUCT LOADING FUNCTIONS

/**
 * Loads products from Firebase or fallback
 */

function cargarProductos() {
  // SIEMPRE usar datos locales al cargar la página (sin Firebase)
  console.log('� Cargando productos desde datos locales (Firebase bajo demanda)');
  
  if (window.mostrarProductosRespaldo) {
    window.mostrarProductosRespaldo();
  } else {
    // Fallback: mostrar productos hardcoded si no hay función de respaldo
    mostrarProductosEstaticos();
  }
}

/**
 * Muestra productos estáticos cuando no hay función de respaldo definida
 */
function mostrarProductosEstaticos() {
  try {
    const productos = obtenerProductosEstaticos();
    mostrarProductosEnPagina(productos);
  } catch (error) {
  }
}

// Detectar retorno de MercadoPago
function verificarRetornoMercadoPago() {
  const urlParams = new URLSearchParams(window.location.search);
  const estadoPago = urlParams.get('pago');
  
  if (estadoPago) {
    const pedidoTemporal = localStorage.getItem('pedidoPendienteMercadoPago');
    
    if (pedidoTemporal) {
      const pedido = JSON.parse(pedidoTemporal);
      
      if (estadoPago === 'aprobado') {
        // Pago aprobado - procesar pedido
        procesarPagoAprobado(pedido);
      } else if (estadoPago === 'rechazado') {
        // Pago rechazado
        mostrarNotificacion("❌ Pago rechazado. Intenta nuevamente.", 'error');
      } else if (estadoPago === 'pendiente') {
        // Pago pendiente
        mostrarNotificacion("⏳ Pago pendiente. Te notificaremos cuando se apruebe.", 'warning');
      }
      
      // Limpiar datos temporales
      localStorage.removeItem('pedidoPendienteMercadoPago');
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
}

async function procesarPagoAprobado(pedidoData) {
  try {
    // Restaurar carrito para procesar
    carrito = pedidoData.productos;
    mostrarCarrito();
    
    // Rellenar formulario
    document.getElementById("pedido-nombre").value = pedidoData.nombre;
    document.getElementById("pedido-direccion").value = pedidoData.direccion;
    metodoPagoSeleccionado = 'mercadopago';
    
    // Procesar como pedido normal
    await realizarPedidoConfirmado(pedidoData);
    
    mostrarNotificacion("✅ ¡Pago aprobado! Pedido confirmado correctamente.", 'success');
  } catch (error) {
    console.error('Error procesando pago aprobado:', error);
    mostrarNotificacion("❌ Error confirmando pedido. Contactanos por WhatsApp.", 'error');
  }
}

async function realizarPedidoConfirmado(pedidoData) {
  const total = pedidoData.total;
  const metodoPagoTexto = 'MercadoPago';

  const ahora = new Date();
  
  const datosCompletos = {
    nombre: pedidoData.nombre,
    direccion: pedidoData.direccion,
    metodoPago: metodoPagoTexto,
    items: pedidoData.productos.map(item => {
      const prod = {
        nombre: item.nombre,
        precio: item.precio,
        cantidad: String(item.cantidad),
        producto_id: item.producto_id || item.id || ''
      };
      // Si es promo, agregar campo agregado_gratis
      if (item.esPromo && item.bebidas) {
        let bebidasArr = [];
        Object.entries(item.bebidas).forEach(([bebida, cantidad]) => {
          let nombreBebida = bebida.trim().toLowerCase() === 'seven up' ? '7up' : bebida;
          for (let i = 0; i < cantidad; i++) {
            bebidasArr.push(nombreBebida);
          }
        });
        prod.agregado_gratis = bebidasArr;
      }
      return prod;
    }),
    total: total,
    fecha: ahora,
    fechaPedido: ahora.toLocaleDateString('es-AR'),
    horaPedido: ahora.toLocaleTimeString('es-AR'),
    estado: 'pendiente',
    origen: 'página web',
    entregado: false
  };

  // Guardar en Firebase
  let pedidoId = null;
  if (window.guardarEnFirebase) {
    try {
      pedidoId = await window.guardarEnFirebase(datosCompletos);
    } catch (error) {
      console.error('Error guardando en Firebase:', error);
    }
  }

  // Enviar por WhatsApp con mensaje especial para MercadoPago
  let mensaje = crearMensajeWhatsApp(datosCompletos, pedidoId);
  
  // Agregar información específica de MercadoPago al inicio
  mensaje = mensaje.replace(
    "🍔 *NUEVO PEDIDO - BURGA AL CORTE* 🍔",
    "🍔 *NUEVO PEDIDO - BURGA AL CORTE* 🍔\n✅ *PAGO CONFIRMADO MERCADOPAGO* ✅"
  );

  const url = `https://api.whatsapp.com/send?phone=541141690977&text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");

  // Limpiar carrito
  carrito = [];
  mostrarCarrito();
  guardarCarrito();
  document.getElementById("pedido-nombre").value = "";
  document.getElementById("pedido-direccion").value = "";
  const telefonoEl = document.getElementById("pedido-telefono");
  if (telefonoEl) telefonoEl.value = "";
  metodoPagoSeleccionado = null;
  document.querySelectorAll('.btn-pago').forEach(btn => {
    btn.classList.remove('seleccionado');
  });
  document.getElementById('desc-pago').textContent = "";
  document.getElementById('btn-hacer-pedido').disabled = true;
}

document.addEventListener('DOMContentLoaded', function() {
  inicializarCarrito();
  cargarProductos();
  verificarRetornoMercadoPago();
  inicializarScrollHeader();
  inicializarNavegacionFlotante();
  actualizarBotonActivo();
  
  // Inicializar nuevo sistema de navegación y carrito modal
  inicializarSistemaNavegacion();
  
  // Sistema de sincronización offline - solo mostrar estado
  // Si la sincronización offline está deshabilitada, limpiar cualquier pedido pendiente y no mostrar el estado
  if (!CONFIG.ALLOW_OFFLINE_SYNC) {
    try {
      localStorage.removeItem('pedidosPendientesSync');
      console.log('Sincronización offline deshabilitada - pedidos pendientes eliminados');
    } catch (e) {}
  } else {
    mostrarEstadoSync();
  }
  
  // NO hacer verificaciones automáticas constantes para ahorrar Firebase
  // La sincronización se hará bajo demanda cuando el usuario interactúe
  
});

// Función para manejar el header dinámico
function inicializarScrollHeader() {
  const header = document.querySelector('header');
  let lastScrollTop = 0;
  let isScrolled = false;
  
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Header desaparece al hacer scroll
    if (!isScrolled && scrollTop > 150) {
      // Ocultar header cuando baje más de 150px
      header.classList.add('scrolled');
      isScrolled = true;
    } else if (isScrolled && scrollTop < 100) {
      // Mostrar header cuando suba menos de 100px
      header.classList.remove('scrolled');
      isScrolled = false;
    }
    
    lastScrollTop = scrollTop;
  });
}

// Función para scroll suave a secciones
function inicializarNavegacionFlotante() {
  const botonesFlotantes = document.querySelectorAll('.floating-btn');
  
  botonesFlotantes.forEach(boton => {
    boton.addEventListener('click', function(e) {
      e.preventDefault();
      
      const seccion = this.getAttribute('href');
      const elemento = document.querySelector(seccion);
      
      if (elemento) {
        // Scroll suave hacia la sección
        elemento.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Efecto visual en el botón clickeado
        this.style.transform = 'translateX(15px) scale(1.1)';
        
        // Resetear el efecto después de un momento
        setTimeout(() => {
          this.style.transform = '';
        }, 300);
      }
    });
  });
}

// Función para resaltar el botón activo según la sección visible
function actualizarBotonActivo() {
  const secciones = document.querySelectorAll('section');
  const botones = document.querySelectorAll('.floating-btn');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const seccionId = entry.target.id;
        
        // Remover clase activa de todos los botones
        botones.forEach(btn => btn.classList.remove('activo'));
        
        // Agregar clase activa al botón correspondiente
        const botonActivo = document.querySelector(`[data-section="${seccionId}"]`);
        if (botonActivo) {
          botonActivo.classList.add('activo');
        }
      }
    });
  }, {
    threshold: 0.3
  });
  
  secciones.forEach(seccion => {
    observer.observe(seccion);
  });
}

// PRODUCT DISPLAY FUNCTIONS
window.mostrarProductos = function(productos) {
  const hamburguesasFeatured = document.getElementById('hamburguesas-featured');
  const hamburguesasGrid = document.getElementById('hamburguesas-grid');
  const promosGrid = document.getElementById('promos-grid');
  const bebidasGrid = document.getElementById('bebidas-grid');
  
  // Clear all containers
  if (hamburguesasFeatured) hamburguesasFeatured.innerHTML = '';
  if (hamburguesasGrid) hamburguesasGrid.innerHTML = '';
  if (promosGrid) promosGrid.innerHTML = '';
  if (bebidasGrid) bebidasGrid.innerHTML = '';
  
  // Separate hamburgers from other products
  const hamburguesas = productos.filter(p => p.categoria === 'hamburguesa' || !p.categoria);
  const promos = productos.filter(p => p.categoria === 'promo');
  const bebidas = productos.filter(p => p.categoria === 'bebidas');
  
  // Display first 8 hamburgers in featured layout
  const hamburguesasFeaturedList = hamburguesas.slice(0, 8);
  const hamburguesasRestantes = hamburguesas.slice(8);
  
  // Create product cards for featured hamburgers
  hamburguesasFeaturedList.forEach(producto => {
    const div = document.createElement('div');
    div.className = 'product-card';
    
    const imagenReal = producto.imagen;
    const placeholderUrl = './fotos/hamburguesas/smash.jpg'; // Fallback local
    
    div.innerHTML = `
      <div class="product-image">
        <img src="${imagenReal}" 
             alt="${producto.nombre}" 
             onerror="this.src='${placeholderUrl}'; this.onerror=null;"
             style="background-color: #ffcb05; color: #000;">
      </div>
      <div class="product-info">
        <h3>${producto.nombre}</h3>
        <p class="product-description">${producto.descripcion || 'Deliciosa opción de nuestra carta'}</p>
        <div class="product-price">$${producto.precio.toLocaleString()}</div>
        <button class="btn-agregar" onclick="event.stopPropagation(); agregarAlCarrito('${producto.nombre}', ${producto.precio}, '${producto.categoria || ''}')">Agregar al Carrito</button>
      </div>
    `;
    
    if (hamburguesasFeatured) {
      hamburguesasFeatured.appendChild(div);
    }
  });
  
  // Display remaining hamburgers in normal grid (if any)
  hamburguesasRestantes.forEach(producto => {
    const div = document.createElement('div');
    div.className = 'product-card';
    
    const imagenReal = producto.imagen;
    const placeholderUrl = './fotos/hamburguesas/smash.jpg'; // Fallback local
    
    div.innerHTML = `
      <div class="product-image">
        <img src="${imagenReal}" 
             alt="${producto.nombre}" 
             onerror="this.src='${placeholderUrl}'; this.onerror=null;"
             style="background-color: #ffcb05; color: #000;">
      </div>
      <div class="product-info">
        <h3>${producto.nombre}</h3>
        <p class="product-description">${producto.descripcion || 'Deliciosa opción de nuestra carta'}</p>
        <div class="product-price">$${producto.precio.toLocaleString()}</div>
        <button class="btn-agregar" onclick="event.stopPropagation(); agregarAlCarrito('${producto.nombre}', ${producto.precio}, '${producto.categoria || ''}')">Agregar al Carrito</button>
      </div>
    `;
    
    if (hamburguesasGrid) {
      hamburguesasGrid.appendChild(div);
    }
  });
  
  // Show/hide grids based on content
  if (hamburguesasRestantes.length > 0 && hamburguesasGrid) {
    hamburguesasGrid.style.display = 'grid';
  }
  
  // Display promos and bebidas normally
  [...promos, ...bebidas].forEach(producto => {
    const div = document.createElement('div');
    div.className = 'product-card';
    
    const imagenReal = producto.imagen;
    const placeholderUrl = './fotos/bebidas/bebida.jpg'; // Fallback local para promos y bebidas
    
    div.innerHTML = `
      <div class="product-image">
        <img src="${imagenReal}" 
             alt="${producto.nombre}" 
             onerror="this.src='${placeholderUrl}'; this.onerror=null;"
             style="background-color: #ffcb05; color: #000;">
      </div>
      <div class="product-info">
        <h3>${producto.nombre}</h3>
        <p class="product-description">${producto.descripcion || 'Deliciosa opción de nuestra carta'}</p>
        <div class="product-price">$${producto.precio.toLocaleString()}</div>
        <button class="btn-agregar" onclick="event.stopPropagation(); agregarAlCarrito('${producto.nombre}', ${producto.precio}, '${producto.categoria || ''}')">Agregar al Carrito</button>
      </div>
    `;
    
    if (producto.categoria === 'promo' && promosGrid) {
      promosGrid.appendChild(div);
    } else if (producto.categoria === 'bebidas' && bebidasGrid) {
      bebidasGrid.appendChild(div);
    }
  });
};

window.mostrarProductosRespaldo = function() {
  const productos = [
    // 1-8 Hamburguesas
    { nombre: "Smash", precio: 10000, categoria: "hamburguesa", descripcion: "Medallón simple, cheddar, nuestra salsa especial + papas fritas ", imagen: "./fotos/hamburguesas/smash.jpg" },
    { nombre: "Crypton", precio: 10000, categoria: "hamburguesa", descripcion: "simple medallon, cebolla caramelizada y queso roquefort + papas fritas", imagen: "./fotos/hamburguesas/cripton.jpg" },
    { nombre: "Wave", precio: 10000, categoria: "hamburguesa", descripcion: "simple medallón, queso provolone y mayocriolla + papas fritas", imagen: "./fotos/hamburguesas/wave.jpg" },
    { nombre: "AX100", precio: 12500, categoria: "hamburguesa", descripcion: "Doble medallón, doble cheddar crujientes y doble bacon + papas fritas", imagen: "./fotos/hamburguesas/ax100.jpg" },
    { nombre: "YBR", precio: 13500, categoria: "hamburguesa", descripcion: "doble medallón, doble cheddar crujientes, cebolla caramelizada y salsa barbacoa + papas fritas", imagen: "./fotos/hamburguesas/ybr.jpg" },
    { nombre: "Tornado 293", precio: 13000, categoria: "hamburguesa", descripcion: "doble medallón, doble cheddar, morron asado y salsa pro tork + papas fritas", imagen: "./fotos/hamburguesas/tornado293.jpg" },
    { nombre: "FAN", precio: 16500, categoria: "hamburguesa", descripcion: "triple medallón, triple cheddar, triple bacon crujientes y salsa butaquera + papas fritas", imagen: "./fotos/hamburguesas/fan.jpg" },
    { nombre: "ax115", precio: 21000, categoria: "hamburguesa", descripcion: "5 medallón, 5 cheddar, 5 bacon crujientes y salsa butaquera + papas fritas", imagen: "./fotos/hamburguesas/ax115.jpg" },
    // Promos
    { nombre: "Promo Smash", precio: 27000, categoria: "promo", descripcion: "Smash x3 + 3 papas fritas + 3 bebida. ¡El combo perfecto para compartir!", imagen: "./fotos/promociones/promo-smash.jpg" },
    { nombre: "Promo Cripton", precio: 27000, categoria: "promo", descripcion: "crypton x3 + 3 papas fritas + 3 bebida. ¡Sabor y cantidad en una sola promo!", imagen: "./fotos/promociones/promo-cripton.jpg" },
    { nombre: "Promo Wave", precio: 27000, categoria: "promo", descripcion: "Wave x3 + 3 papas fritas + 3 bebida. ¡Un combo de puro sabor!", imagen: "./fotos/promociones/promo-wave.jpg" },
    { nombre: "Promo AX100", precio: 30000, categoria: "promo", descripcion: "AX100 x2 + 2 papas fritas + 2 bebida de elección. ¡Doble medallón, doble placer!", imagen: "./fotos/promociones/promo-ax100.jpeg" },
    { nombre: "Promo Variant", precio: 36000, categoria: "promo", descripcion: "Variant x3 + 3 papas fritas + 3 bebida de elección. ¡Sabor único e irresistible!", imagen: "./fotos/promociones/promo variant.jpeg" },
    // Nuevas promos
    { nombre: "promo ybr", precio: 33000, categoria: "promo", descripcion: "2 ybr + combo de papas fritas con cheddar y bacon + 2 bebidas", imagen: "./fotos/promociones/promo ybr.jpeg" },
    { nombre: "promo fan", precio: 38000, categoria: "promo", descripcion: "2 fan + combo de papas fritas con cheddar y bacon + 2 bebidas", imagen: "./fotos/promociones/promo-fan.jpg" },
    // Bebidas
    { nombre: "Pepsi", precio: 2500, categoria: "bebidas", descripcion: "Gaseosa fría de 500ml. Pepsi", imagen: "./fotos/bebidas/pepsi.jpg" },
    { nombre: "Seven Up", precio: 2500, categoria: "bebidas", descripcion: "Gaseosa fría de 500ml. Seven Up", imagen: "./fotos/bebidas/seven-up.jpg" },
    // Extras
    { nombre: "Aros de cebolla", precio: 5000, categoria: "extra", descripcion: "Aros de cebolla + papas fritas + alioli", imagen: "./fotos/extras/aros-de-cebolla-caseros-crujientes.jpg" },
    { nombre: "Bastones de mozzarella", precio: 7500, categoria: "extra", descripcion: "Bastones de mozzarella + papas fritas + alioli", imagen: "./fotos/extras/bastones-de-mozzarella.jpg" },
    { nombre: "Flan", precio: 5000, categoria: "extra", descripcion: "Flan casero", imagen: "./fotos/extras/flan.jpg" }
  ];
  window.mostrarProductos(productos);
};

// Ejecutar inmediatamente si el DOM ya está listo
if (document.readyState !== 'loading') {
  cargarProductos();
  verificarRetornoMercadoPago();
  inicializarNavegacionFlotante();
  actualizarBotonActivo();
}

// SISTEMA DE BEBIDAS PARA PROMOS

/**
 * Abre el modal selector de bebidas para promos
 */
function abrirSelectorBebidas(totalBebidas) {
  try {
    // Resetear selecciones solo si no hay bebidas pre-seleccionadas
    if (!bebidasSeleccionadas || Object.keys(bebidasSeleccionadas).length === 0) {
      bebidasSeleccionadas = {
        'Pepsi': 0,
        'Seven Up': 0
      };
    }
    // Guardar el total de bebidas permitido en variable global temporal
    window._totalBebidasPromo = totalBebidas || (promoEnProceso && promoEnProceso.totalBebidas) || 3;
    // Actualizar título y descripción del modal según cantidad de bebidas
    const titulo = safeGetElement('modal-bebidas-titulo');
    const descripcion = safeGetElement('modal-bebidas-descripcion');
    if (titulo) {
      titulo.textContent = `🥤 Elegí tus ${window._totalBebidasPromo} Bebidas Gratis`;
    }
    if (descripcion) {
      descripcion.textContent = `Tu promo incluye ${window._totalBebidasPromo} bebidas. Seleccioná la cantidad de cada una:`;
    }
    // Crear contenido del selector
    crearContenidoSelectorBebidas();
    // Mostrar modal
    const modal = document.getElementById('modal-bebidas-promo');
    if (modal) {
      modal.style.display = 'flex';
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
      modal.style.zIndex = '9999';
      modal.classList.add('show');
      mostrarNotificacion(`🥤 Selecciona tus ${window._totalBebidasPromo} bebidas gratis`, 'info');
    } else {
      mostrarNotificacion('Error: No se pudo abrir selector de bebidas', 'error');
    }
  } catch (error) {
    mostrarNotificacion('Error abriendo selector de bebidas', 'error');
  }
}

/**
 * Crea el contenido dinámico del selector de bebidas
 */
function crearContenidoSelectorBebidas() {
  const container = safeGetElement('selector-bebidas-content');
  if (!container) return;
  
  const bebidasDisponibles = [
    { nombre: 'Pepsi', imagen: './fotos/bebidas/pepsi.jpg' },
    { nombre: 'Seven Up', imagen: './fotos/bebidas/seven-up.jpg' }
  ];
  
  let html = '';
  
  bebidasDisponibles.forEach(bebida => {
    html += `
      <div class="bebida-selector">
        <div class="bebida-info">
          <img src="${bebida.imagen}" alt="${bebida.nombre}" class="bebida-img" onerror="this.src='./fotos/bebidas/bebida.jpg'">
          <div class="bebida-nombre">${bebida.nombre}</div>
        </div>
        <div class="cantidad-selector">
          <button class="btn-cantidad" onclick="cambiarCantidadBebida('${bebida.nombre}', -1)">−</button>
          <span class="cantidad-display" id="cantidad-${bebida.nombre.replace(' ', '-')}">${bebidasSeleccionadas[bebida.nombre]}</span>
          <button class="btn-cantidad" onclick="cambiarCantidadBebida('${bebida.nombre}', 1)">+</button>
        </div>
      </div>
    `;
  });
  
  // Agregar contador total
  const totalBebidas = window._totalBebidasPromo || 3;
  html += `<div id="contador-bebidas" class="contador-total">Seleccionadas: <span id="total-seleccionadas">0</span> / ${totalBebidas} bebidas</div>`;
  
  container.innerHTML = html;
  actualizarContadorBebidas();
}

/**
 * Cambia la cantidad de una bebida seleccionada
 */
function cambiarCantidadBebida(nombreBebida, cambio) {
  try {
    const cantidadActual = bebidasSeleccionadas[nombreBebida];
    const nuevaCantidad = Math.max(0, cantidadActual + cambio);
    
    // Verificar que no exceda el límite total de bebidas permitidas
    const totalPermitidas = window._totalBebidasPromo || 3;
    const totalActual = Object.values(bebidasSeleccionadas).reduce((sum, val) => sum + val, 0);
    const nuevoTotal = totalActual - cantidadActual + nuevaCantidad;
    if (nuevoTotal <= totalPermitidas) {
      bebidasSeleccionadas[nombreBebida] = nuevaCantidad;
      // Actualizar display
      const displayId = `cantidad-${nombreBebida.replace(' ', '-')}`;
      const displayElement = safeGetElement(displayId);
      if (displayElement) {
        displayElement.textContent = nuevaCantidad;
      }
      actualizarContadorBebidas();
    } else {
      mostrarNotificacion(`Máximo ${totalPermitidas} bebidas permitidas`, 'warning');
    }
  } catch (error) {
  }
}

/**
 * Actualiza el contador total de bebidas seleccionadas
 */
function actualizarContadorBebidas() {
  const totalSeleccionadas = Object.values(bebidasSeleccionadas).reduce((sum, val) => sum + val, 0);
  
  const totalElement = safeGetElement('total-seleccionadas');
  const contadorElement = safeGetElement('contador-bebidas');
  
  if (totalElement) {
    totalElement.textContent = totalSeleccionadas;
  }
  
  if (contadorElement) {
    // Cambiar estilo según cantidad
    const totalPermitidas = window._totalBebidasPromo || 3;
    contadorElement.className = 'contador-total';
    if (totalSeleccionadas === totalPermitidas) {
      contadorElement.classList.add('completo');
    } else if (totalSeleccionadas > totalPermitidas) {
      contadorElement.classList.add('excedido');
    }
  }
  // Actualizar estado de botones
  actualizarBotonesBebidas(totalSeleccionadas);
}

/**
 * Actualiza el estado de los botones según el total seleccionado
 */
function actualizarBotonesBebidas(totalSeleccionadas) {
  const botonesMas = document.querySelectorAll('.btn-cantidad[onclick*=", 1"]');
  
  const totalPermitidas = window._totalBebidasPromo || 3;
  botonesMas.forEach(boton => {
    if (totalSeleccionadas >= totalPermitidas) {
      boton.disabled = true;
    } else {
      boton.disabled = false;
    }
  });
}

/**
 * Confirma la selección de bebidas y agrega la promo al carrito
 */
function confirmarSeleccionBebidas() {
  try {
    const totalPermitidas = window._totalBebidasPromo || 3;
    const totalSeleccionadas = Object.values(bebidasSeleccionadas).reduce((sum, val) => sum + val, 0);
    if (totalSeleccionadas !== totalPermitidas) {
      mostrarNotificacion(`Debes seleccionar exactamente ${totalPermitidas} bebidas`, 'warning');
      return;
    }
    
    if (!promoEnProceso) {
      mostrarNotificacion('Error: No hay promo en proceso', 'error');
      return;
    }
    
    // Crear descripción detallada con las bebidas seleccionadas
    let descripcionBebidas = '';
    Object.entries(bebidasSeleccionadas).forEach(([bebida, cantidad]) => {
      if (cantidad > 0) {
        descripcionBebidas += `${cantidad}x ${bebida} `;
      }
    });
    
    // Verificar si estamos actualizando una promo existente en el carrito
    if (promoEnProceso.indexEnCarrito !== undefined) {
      // Actualizar promo existente en el carrito
      const itemEnCarrito = carrito[promoEnProceso.indexEnCarrito];
      itemEnCarrito.bebidas = {...bebidasSeleccionadas};
      itemEnCarrito.descripcionBebidas = descripcionBebidas.trim();
      itemEnCarrito.bebidasSeleccionadas = true;
      
      // Mostrar notificación y actualizar carrito
      mostrarCarrito();
      guardarCarrito();
      mostrarNotificacion(`Bebidas actualizadas para ${promoEnProceso.nombre}: ${descripcionBebidas.trim()}`);
    } else {
      // Agregar nueva promo al carrito (modo antiguo - ya no se usa)
      const itemExistente = carrito.find(item => item.nombre === promoEnProceso.nombre);
      
      if (itemExistente) {
        itemExistente.cantidad++;
      } else {
        carrito.push({ 
          nombre: promoEnProceso.nombre, 
          precio: promoEnProceso.precio, 
          cantidad: 1,
          esPromo: true,
          bebidasSeleccionadas: true,
          bebidas: {...bebidasSeleccionadas},
          descripcionBebidas: descripcionBebidas.trim()
        });
      }
    }
    
    // Guardar el nombre para la notificación antes de limpiar
    const nombrePromo = promoEnProceso.nombre;
    
    // Cerrar modal (esto limpiará las variables automáticamente)
    const modal = document.getElementById('modal-bebidas-promo');
    if (modal) {
      modal.classList.remove('show');
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
      }, 300);
    }
    
    // Esperar a que se cierre el modal antes de actualizar el carrito
    setTimeout(() => {
      mostrarCarrito();
      guardarCarrito();
      
      // Mostrar notificación apropiada según el caso
      if (promoEnProceso && promoEnProceso.indexEnCarrito !== undefined) {
        // Era una actualización de bebidas
        // Ya se mostró la notificación arriba
      } else {
        // Era una nueva promo (no debería llegar aquí con el nuevo flujo)
        mostrarNotificacion(`${nombrePromo} agregada al carrito con bebidas seleccionadas`);
        
        // Scroll al carrito solo para nuevas promos
        setTimeout(() => {
          navegarAlCarrito();
        }, 200);
      }
    }, 400);
    
    // Limpiar variables manualmente después de procesar
    setTimeout(() => {
      bebidasSeleccionadas = {};
      promoEnProceso = null;
    }, 500);
    
  } catch (error) {
    mostrarNotificacion('Error confirmando selección de bebidas', 'error');
  }
}

/**
 * Cancela la selección de bebidas
 */
function cancelarSeleccionBebidas() {
  cerrarSelectorBebidas();
  
  // Limpiar variables
  setTimeout(() => {
    bebidasSeleccionadas = {};
    promoEnProceso = null;
  }, 350);
  
  mostrarNotificacion('Selección de bebidas cancelada', 'info');
}

/**
 * Cierra el modal de selección de bebidas
 */
function cerrarSelectorBebidas() {
  const modal = document.getElementById('modal-bebidas-promo');
  if (modal) {
    modal.classList.remove('show');
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.display = 'none';
      modal.style.visibility = 'hidden';
    }, 300);
  }
}

/**
 * Abre el modal del carrito después de agregar una promo
 */
function navegarAlCarrito() {
  try {
    // Abrir modal del carrito
    abrirCarrito();
    
    // Mensaje temporal para guiar al usuario
    setTimeout(() => {
      mostrarNotificacion('🛒 ¡Tu promo está en el carrito! Elegí tus bebidas', 'info');
    }, 500);
    
  } catch (error) {
  }
}

/**
 * Permite seleccionar bebidas para una promo desde el carrito
 */
function seleccionarBebidasPromo(index) {
  try {
    if (index < 0 || index >= carrito.length) {
      return;
    }
    const promoItem = carrito[index];
    if (!promoItem.esPromo) {
      return;
    }
    // Determinar cantidad de bebidas gratis por promo
    let bebidasPorPromo = 3;
    const nombrePromo = promoItem.nombre.toLowerCase();
    if (
      nombrePromo.includes('ax100') ||
      nombrePromo.includes('promo fan') ||
      nombrePromo.includes('promo ybr')
    ) {
      bebidasPorPromo = 2;
    }
    const totalBebidas = bebidasPorPromo * promoItem.cantidad;
    // Guardar referencia del item en el carrito para actualizarlo después
    promoEnProceso = { 
      nombre: promoItem.nombre, 
      precio: promoItem.precio,
      indexEnCarrito: index,
      bebidasPorPromo,
      totalBebidas
    };
    // Abrir selector de bebidas con el total correcto
    abrirSelectorBebidas(totalBebidas);
  } catch (error) {
    mostrarNotificacion('Error abriendo selector de bebidas', 'error');
  }
}

/**
 * Permite cambiar las bebidas de una promo ya configurada
 */
function cambiarBebidasPromo(index) {
  try {
    if (index < 0 || index >= carrito.length) {
      return;
    }
    const promoItem = carrito[index];
    if (!promoItem.esPromo) {
      return;
    }
    // Determinar cantidad de bebidas gratis por promo
    let bebidasPorPromo = 3;
    const nombrePromo = promoItem.nombre.toLowerCase();
    if (
      nombrePromo.includes('ax100') ||
      nombrePromo.includes('promo fan') ||
      nombrePromo.includes('promo ybr')
    ) {
      bebidasPorPromo = 2;
    }
    const totalBebidas = bebidasPorPromo * promoItem.cantidad;
    // Guardar referencia del item en el carrito y sus bebidas actuales
    promoEnProceso = { 
      nombre: promoItem.nombre, 
      precio: promoItem.precio,
      indexEnCarrito: index,
      bebidasActuales: promoItem.bebidas || {},
      bebidasPorPromo,
      totalBebidas
    };
    // Precargar las bebidas actuales en el selector
    bebidasSeleccionadas = { ...promoItem.bebidas };
    // Abrir selector de bebidas con el total correcto
    abrirSelectorBebidas(totalBebidas);
  } catch (error) {
    mostrarNotificacion('Error abriendo selector de bebidas', 'error');
  }
}

// SISTEMA DE NAVEGACIÓN Y CARRITO MODAL

/**
 * Función obsoleta - ahora todas las secciones están visibles
 * Mantenida para compatibilidad
 */
function mostrarSeccion(seccionId) {
  try {
    // Ya no ocultamos secciones - todas están visibles
    // Solo hacer scroll suave a la sección si se necesita
    if (seccionId && seccionId !== 'menu') {
      const seccion = document.getElementById(seccionId);
      if (seccion) {
        seccion.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
  } catch (error) {
  }
}

/**
 * Nueva función para navegación lateral
 */
function scrollToSection(seccionId) {
  try {
    const seccion = document.getElementById(seccionId);
    if (seccion) {
      seccion.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Actualizar estado activo de los botones
      actualizarNavegacionActiva(seccionId);
      
    }
  } catch (error) {
  }
}

/**
 * Actualiza el estado activo de la navegación lateral
 */
function actualizarNavegacionActiva(seccionId) {
  try {
    document.querySelectorAll('.nav-btn-lateral').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const btnActivo = document.querySelector(`[data-section="${seccionId}"]`);
    if (btnActivo) {
      btnActivo.classList.add('active');
    }
  } catch (error) {
  }
}

/**
 * Inicializa la navegación lateral con detección automática de scroll
 */
function inicializarNavegacionLateral() {
  try {
    // Detectar sección activa según scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const seccionId = entry.target.id;
          actualizarNavegacionActiva(seccionId);
        }
      });
    }, {
      rootMargin: '-50% 0px -50% 0px'
    });
    
    // Observar todas las secciones
    const secciones = ['menu', 'promos', 'bebidas', 'redes'];
    secciones.forEach(id => {
      const elemento = document.getElementById(id);
      if (elemento) {
        observer.observe(elemento);
      }
    });
    
    // Marcar menú como activo inicialmente
    actualizarNavegacionActiva('menu');
    
  } catch (error) {
  }
}

/**
 * Abre el modal del carrito
 */
function abrirCarrito() {
  try {
    const modalCarrito = document.getElementById('modal-carrito');
    if (modalCarrito) {
      modalCarrito.style.display = 'flex';
      modalCarrito.classList.add('show');
      
      // Actualizar display del carrito al abrir
      mostrarCarrito();
      
      // Enfocar en el primer input si el carrito no está vacío
      if (carrito.length > 0) {
        setTimeout(() => {
          const nombreInput = document.getElementById('pedido-nombre');
          if (nombreInput) nombreInput.focus();
        }, 300);
      }
      
    }
  } catch (error) {
  }
}

/**
 * Cierra el modal del carrito
 */
function cerrarCarrito() {
  try {
    const modalCarrito = document.getElementById('modal-carrito');
    if (modalCarrito) {
      modalCarrito.classList.remove('show');
      setTimeout(() => {
        modalCarrito.style.display = 'none';
      }, 300);
      
    }
  } catch (error) {
  }
}

/**
 * Actualiza el contador del carrito y la preview
 */
function actualizarContadorCarrito() {
  try {
    // Actualizar contador en navegación lateral
    const contadorLateral = document.getElementById('carrito-contador-lateral');
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    if (contadorLateral) {
      contadorLateral.textContent = totalItems > 0 ? totalItems : '';
      contadorLateral.style.display = totalItems > 0 ? 'flex' : 'none';
      
      // Añadir animación cuando cambia el contador
      if (totalItems > 0) {
        contadorLateral.style.animation = 'none';
        setTimeout(() => {
          contadorLateral.style.animation = 'pulse 1.5s ease-in-out';
        }, 10);
      }
    }
    
    // Mantener compatibilidad con contador anterior (si existe)
    const contador = document.getElementById('carrito-contador');
    if (contador) {
      contador.textContent = totalItems > 0 ? totalItems : '';
      contador.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Mantener compatibilidad con texto del carrito (si existe)
    const carritoTexto = document.querySelector('.carrito-texto');
    if (carritoTexto) {
      if (totalItems > 0) {
        const totalPrecio = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        carritoTexto.innerHTML = `
          <div style="font-size: 0.8rem; font-weight: bold;">${totalItems} producto${totalItems > 1 ? 's' : ''}</div>
          <div style="font-size: 0.7rem; color: #ffcb05;">$${totalPrecio.toLocaleString()}</div>
        `;
      } else {
        carritoTexto.innerHTML = '<div style="font-size: 0.8rem;">Carrito</div>';
      }
    }
  } catch (error) {
  }
}

/**
 * Inicializa el sistema de carrito flotante
 */
function inicializarSistemaNavegacion() {
  try {
    // Actualizar contador del carrito
    actualizarContadorCarrito();
    
    // Agregar evento de teclado para cerrar carrito con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        cerrarCarrito();
      }
    });
    
    // Cerrar carrito al hacer click fuera del modal
    const modalCarrito = document.getElementById('modal-carrito');
    if (modalCarrito) {
      modalCarrito.addEventListener('click', (e) => {
        if (e.target === modalCarrito) {
          cerrarCarrito();
        }
      });
    }
    
    // Inicializar navegación lateral con detección de scroll
    inicializarNavegacionLateral();
    
  } catch (error) {
  }
}
