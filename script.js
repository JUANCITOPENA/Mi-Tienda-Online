// Espera a que el contenido del DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {

    // Selección de Elementos del DOM
    const productList = document.getElementById('productList');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    const cartCountElement = document.getElementById('cartCount');
    const searchInput = document.getElementById('searchInput');
    const quantityModalElement = document.getElementById('quantityModal');
    const quantityModal = new bootstrap.Modal(quantityModalElement); // Instancia del Modal de Bootstrap
    const quantityProductName = document.getElementById('quantityProductName');
    const quantityInput = document.getElementById('quantityInput');
    const confirmQuantityBtn = document.getElementById('confirmQuantityBtn');
    const cartModalElement = document.getElementById('cartModal');
    const cartModal = new bootstrap.Modal(cartModalElement);
    const checkoutBtn = document.getElementById('checkoutBtn');
    const paymentModalElement = document.getElementById('paymentModal');
    const paymentModal = new bootstrap.Modal(paymentModalElement);
    const paymentForm = document.getElementById('paymentForm');
    const finalizePaymentBtn = document.getElementById('finalizePaymentBtn');
    const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');

    // Estado de la Aplicación
    let allProducts = []; // Almacenará todos los productos de la API
    let cart = []; // Almacenará los productos en el carrito: { product: {}, quantity: N }

    // --- CARGA INICIAL DE PRODUCTOS ---
    const API_URL = 'https://fakestoreapi.com/products';

    async function fetchProducts() {
        // Muestra el spinner mientras carga
        productList.innerHTML = `
            <div class="col-12 text-center" style="min-height: 300px;">
                <div class="spinner-border text-primary mt-5" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Cargando productos...</span>
                </div>
                <p class="mt-2">Cargando productos...</p>
            </div>`;
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allProducts = await response.json();
            displayProducts(allProducts); // Muestra todos los productos inicialmente
        } catch (error) {
            console.error("Error fetching products:", error);
            productList.innerHTML = `<div class="col-12"><div class="alert alert-danger text-center">Error al cargar los productos. Por favor, intenta recargar la página.</div></div>`;
        }
    }

    // --- MOSTRAR PRODUCTOS ---
    function displayProducts(productsToDisplay) {
        productList.innerHTML = ''; // Limpia la lista actual

        if (productsToDisplay.length === 0) {
             productList.innerHTML = `<div class="col-12"><p class="text-center text-muted mt-5">No se encontraron productos que coincidan con tu búsqueda.</p></div>`;
             return;
        }

        productsToDisplay.forEach(product => {
            // Limita la longitud de la descripción
            const shortDescription = product.description.length > 100
                ? product.description.substring(0, 97) + '...'
                : product.description;

            const productCard = document.createElement('div');
            productCard.classList.add('col');
            productCard.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-img-container">
                         <img src="${product.image}" class="card-img-top" alt="${product.title}">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${product.title}</h5>
                         <p class="card-text small text-muted">${shortDescription}</p>
                        <p class="card-price mt-auto">$${product.price.toFixed(2)}</p>
                        <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">
                           <i class="fas fa-cart-plus me-1"></i> Añadir al carrito
                        </button>
                    </div>
                </div>
            `;
            productList.appendChild(productCard);
        });

        // Añadir event listeners a los nuevos botones
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', handleAddToCartClick);
        });
    }

    // --- MANEJO DEL CARRITO ---

    function handleAddToCartClick(event) {
        const productId = parseInt(event.target.dataset.productId);
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            showQuantityModal(product);
        } else {
            console.error("Producto no encontrado:", productId);
            alert("Error: Producto no encontrado.");
        }
    }

    function showQuantityModal(product) {
        quantityProductName.textContent = product.title;
        quantityInput.value = 1; // Resetea a 1
        confirmQuantityBtn.dataset.productId = product.id; // Guarda el ID en el botón
        quantityModal.show();
    }

    confirmQuantityBtn.addEventListener('click', () => {
        const productId = parseInt(confirmQuantityBtn.dataset.productId);
        const quantity = parseInt(quantityInput.value);

        if (quantity > 0 && quantity <= 10) { // Validación simple
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                addToCart(product, quantity);
                quantityModal.hide();
            }
        } else {
            alert("Por favor, introduce una cantidad válida (entre 1 y 10).");
        }
    });

    function addToCart(product, quantity) {
        const existingCartItemIndex = cart.findIndex(item => item.product.id === product.id);

        if (existingCartItemIndex > -1) {
            // Si ya existe, actualiza la cantidad (sin exceder el límite si es necesario)
            cart[existingCartItemIndex].quantity += quantity;
             // Opcional: Limitar cantidad total por producto en carrito
             if(cart[existingCartItemIndex].quantity > 10) {
                 cart[existingCartItemIndex].quantity = 10;
                 alert(`Has alcanzado el límite de 10 unidades para ${product.title}.`);
             }
        } else {
            // Si no existe, añade el nuevo item
            cart.push({ product: product, quantity: quantity });
        }
        updateCartUI();
    }

     function updateCartQuantity(productId, newQuantity) {
        const itemIndex = cart.findIndex(item => item.product.id === productId);
        if (itemIndex > -1) {
            if (newQuantity > 0 && newQuantity <= 10) {
                cart[itemIndex].quantity = newQuantity;
            } else if (newQuantity <= 0) {
                // Eliminar si la cantidad es 0 o menos
                removeFromCart(productId);
                return; // Salir para evitar doble actualización
            } else {
                 cart[itemIndex].quantity = 10; // Limitar a 10 si excede
                 alert(`El máximo de unidades por producto es 10.`);
            }
        }
        updateCartUI();
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.product.id !== productId);
        updateCartUI();
    }


    function updateCartUI() {
        cartItemsContainer.innerHTML = ''; // Limpia el contenedor del carrito
        let total = 0;
        let itemCount = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center text-muted">Tu carrito está vacío.</p>';
            checkoutBtn.disabled = true; // Deshabilita el botón de pago si el carrito está vacío
        } else {
            cart.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                const itemTotal = item.product.price * item.quantity;
                total += itemTotal;
                itemCount += item.quantity;

                itemElement.innerHTML = `
                    <img src="${item.product.image}" alt="${item.product.title}" class="cart-item-img">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.product.title}</div>
                        <div class="cart-item-info">
                            Cantidad: ${item.quantity} x $${item.product.price.toFixed(2)} = $${itemTotal.toFixed(2)}
                        </div>
                    </div>
                     <div class="cart-item-actions">
                        <input type="number" class="form-control form-control-sm quantity-change-input" value="${item.quantity}" min="1" max="10" data-product-id="${item.product.id}" aria-label="Cantidad de ${item.product.title}">
                        <button class="btn-remove" data-product-id="${item.product.id}" aria-label="Eliminar ${item.product.title} del carrito">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemElement);
            });
            checkoutBtn.disabled = false; // Habilita el botón de pago
        }

        // Actualiza el total
        cartTotalElement.textContent = `$${total.toFixed(2)}`;

        // Actualiza el contador del icono del carrito
        if (itemCount > 0) {
            cartCountElement.textContent = itemCount;
            cartCountElement.style.display = 'inline-block'; // Muestra el badge
        } else {
            cartCountElement.style.display = 'none'; // Oculta el badge si no hay items
        }

         // Añadir listeners a los nuevos inputs y botones de eliminar
        document.querySelectorAll('.quantity-change-input').forEach(input => {
            input.addEventListener('change', (e) => {
                 const prodId = parseInt(e.target.dataset.productId);
                 const newQty = parseInt(e.target.value);
                 updateCartQuantity(prodId, newQty);
            });
             // Opcional: prevenir entrada no numérica o fuera de rango mientras se escribe
             input.addEventListener('input', (e) => {
                if (parseInt(e.target.value) > 10) e.target.value = 10;
                if (parseInt(e.target.value) < 1) e.target.value = 1;
            });
        });

        document.querySelectorAll('.btn-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                // Necesario buscar el data-product-id en el botón o su icono interno
                const targetButton = e.target.closest('.btn-remove');
                if(targetButton) {
                    const prodId = parseInt(targetButton.dataset.productId);
                    removeFromCart(prodId);
                }
            });
        });
    }

    // --- BÚSQUEDA DINÁMICA ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        if (!allProducts.length) return; // No buscar si los productos no se han cargado

        const filteredProducts = allProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
        displayProducts(filteredProducts);
    });

    // --- SIMULACIÓN DE PAGO Y GENERACIÓN DE PDF ---

    checkoutBtn.addEventListener('click', () => {
        if (cart.length > 0) {
            cartModal.hide(); // Oculta el modal del carrito
            paymentModal.show(); // Muestra el modal de pago
        }
    });

     // Cancelar pago desde el modal de pago te devuelve al carrito
    cancelPaymentBtn.addEventListener('click', () => {
        paymentModal.hide();
        cartModal.show(); // Reabre el modal del carrito
    });


    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Previene el envío real del formulario

        // Recolecta datos (simulados) del formulario para el PDF si se desea
        const cardName = document.getElementById('cardName').value;
        // const cardNumber = document.getElementById('cardNumber').value; // No es seguro incluirlo

        // Deshabilita botón para evitar doble click mientras se genera el PDF
        finalizePaymentBtn.disabled = true;
        finalizePaymentBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Procesando...`;

        // Simula un pequeño retraso para el "procesamiento"
        setTimeout(() => {
            try {
                generateInvoicePDF(cardName); // Pasa el nombre para el PDF

                // Limpia el carrito después del "pago" exitoso
                cart = [];
                updateCartUI();

                paymentModal.hide(); // Oculta el modal de pago

                // Muestra un mensaje de éxito (podría ser un modal/toast de Bootstrap)
                alert(`¡Pago simulado con éxito, ${cardName}!\n\nTu factura se ha descargado como 'factura.pdf'.\nGracias por tu compra.`);

            } catch (error) {
                console.error("Error generando PDF:", error);
                alert("Hubo un error al generar la factura PDF. Por favor, inténtalo de nuevo.");
            } finally {
                 // Restablece el botón de pago
                finalizePaymentBtn.disabled = false;
                 finalizePaymentBtn.innerHTML = `<i class="fas fa-check-circle me-1"></i> Pagar y Generar Factura`;
                 paymentForm.reset(); // Limpia el formulario de pago
            }
        }, 1500); // 1.5 segundos de retraso simulado
    });

    function generateInvoicePDF(customerName) {
        // Asegurarse de que jsPDF esté cargado
        if (typeof window.jspdf === 'undefined') {
            console.error('jsPDF no está cargado.');
            alert('Error: La librería para generar PDF no está disponible.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // --- Contenido del PDF ---
        let yPosition = 20; // Posición vertical inicial

        // Título
        doc.setFontSize(18);
        doc.text("Factura Simplificada - MiTienda", 105, yPosition, { align: 'center' });
        yPosition += 10;

        // Fecha y Cliente
        doc.setFontSize(11);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, yPosition);
        doc.text(`Cliente: ${customerName || 'Cliente Anónimo'}`, 15, yPosition + 5);
        yPosition += 15;

        // Encabezados de la tabla
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold'); // Poner en negrita
        doc.text("Producto", 15, yPosition);
        doc.text("Cant.", 120, yPosition);
        doc.text("Precio U.", 145, yPosition);
        doc.text("Subtotal", 175, yPosition);
        doc.setFont(undefined, 'normal'); // Volver a normal
        yPosition += 7;
        doc.setLineWidth(0.2);
        doc.line(15, yPosition - 2, 195, yPosition - 2); // Línea separadora

        // Items del carrito
        let totalGeneral = 0;
        doc.setFontSize(10);
        cart.forEach(item => {
            const price = item.product.price;
            const quantity = item.quantity;
            const subtotal = price * quantity;
            totalGeneral += subtotal;

            // Manejo de títulos largos (ajuste de línea manual simple)
            const maxTitleWidth = 100; // Ancho máximo para el título antes de cortar
            const titleLines = doc.splitTextToSize(item.product.title, maxTitleWidth);

            doc.text(titleLines, 15, yPosition); // jsPDF maneja el array de líneas
            doc.text(quantity.toString(), 125, yPosition, { align: 'center' });
            doc.text(`$${price.toFixed(2)}`, 155, yPosition, { align: 'right' });
            doc.text(`$${subtotal.toFixed(2)}`, 190, yPosition, { align: 'right' });

            // Incrementar yPosition basado en cuántas líneas ocupó el título
            yPosition += (titleLines.length * 4) + 4; // Ajusta el espaciado vertical

             // Añadir línea divisoria suave entre items si hay espacio
             if (yPosition < 270) { // Evitar que se salga de la página
                doc.setLineDashPattern([1, 1], 0); // Línea punteada
                doc.line(15, yPosition - 2, 195, yPosition - 2);
                doc.setLineDashPattern([], 0); // Resetear patrón de línea
             }

             // Salto de página si es necesario (básico)
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20; // Reiniciar posición en nueva página
                 // Podrías repetir encabezados aquí si lo deseas
            }
        });

        // Línea antes del total
        yPosition += 5;
        doc.setLineWidth(0.5);
        doc.line(130, yPosition, 195, yPosition);
        yPosition += 5;

        // Total General
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Total General:", 145, yPosition);
        doc.text(`$${totalGeneral.toFixed(2)}`, 190, yPosition, { align: 'right' });
        doc.setFont(undefined, 'normal');
        yPosition += 15;

         // Mensaje de Agradecimiento
        doc.setFontSize(10);
        doc.text("¡Gracias por tu compra en MiTienda!", 105, yPosition, { align: 'center' });


        // --- Guardar el PDF ---
        doc.save("factura_MiTienda.pdf");
    }


    // --- INICIALIZACIÓN ---
    fetchProducts(); // Carga los productos al iniciar
    updateCartUI(); // Actualiza la UI del carrito (por si hubiera datos guardados, aunque aquí no hay persistencia)

}); // Fin del DOMContentLoaded