class ComunasFilter {
    constructor() {
        this.comunaSeleccionada = 'todas';
        this.comunasStats = {
            "Santiago": 72,
            "Estación Central": 5,
            "San Miguel": 5,
            "Independencia": 5,
            "Ñuñoa": 4,
            "Macul": 4,
            "La Florida": 4,
            "La Cisterna": 3,
            "Recoleta": 3,
            "Quinta Normal": 2,
            "San Joaquín": 2,
            "Providencia": 1
        };
        this.init();
    }

    init() {
        // 1. Crear HTML del filtro
        this.createHTML();
        
        // 2. Agregar event listeners
        this.addEventListeners();
    }

    createHTML() {
        // Crear contenedor
        const container = document.createElement('div');
        container.className = 'comunas-filter-container';
        container.id = 'comunas-filter-container';
        
        // Botón para abrir/cerrar
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'comunas-toggle-btn';
        toggleBtn.id = 'comunas-toggle-btn';
        toggleBtn.textContent = 'Filtrar por Comuna (12)';
        
        // Lista de radio buttons (oculta por defecto)
        const lista = document.createElement('div');
        lista.className = 'comunas-radio-list';
        lista.style.display = 'none';
        
        // Radio button para "Todas"
        const todasOption = this.createRadioOption('todas', 'Todas las comunas', 110, true);
        lista.appendChild(todasOption);
        
        // Crear opciones para cada comuna
        Object.entries(this.comunasStats).forEach(([comuna, count]) => {
            const option = this.createRadioOption(comuna, comuna, count, false);
            lista.appendChild(option);
        });
        
        // Botones de acción
        const actions = document.createElement('div');
        actions.className = 'comunas-actions';
        actions.innerHTML = `
            <button id="comunas-aplicar">Aplicar</button>
            <button id="comunas-limpiar" class="secundario">Limpiar</button>
        `;
        
        container.appendChild(toggleBtn);
        container.appendChild(lista);
        container.appendChild(actions);
        
        // Insertar después del título
        const title = document.querySelector('h1');
        if (title) {
            title.parentNode.insertBefore(container, title.nextSibling);
        }
    }

    createRadioOption(value, text, count, checked) {
        const label = document.createElement('label');
        label.className = 'comuna-radio-option';
        label.innerHTML = `
            <input type="radio" name="comuna" value="${value}" ${checked ? 'checked' : ''}>
            <span class="radio-custom"></span>
            <span class="comuna-text">${text}</span>
            <span class="comuna-count">${count}</span>
        `;
        return label;
    }

    addEventListeners() {
        // Toggle mostrar/ocultar lista
        document.getElementById('comunas-toggle-btn').addEventListener('click', () => {
            const lista = document.querySelector('.comunas-radio-list');
            lista.style.display = lista.style.display === 'none' ? 'block' : 'none';
        });
        
        // Cambio en radio buttons
        document.querySelectorAll('input[name="comuna"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.comunaSeleccionada = e.target.value;
            });
        });
        
        // Aplicar filtro
        document.getElementById('comunas-aplicar').addEventListener('click', () => {
            this.aplicarFiltro();
            document.querySelector('.comunas-radio-list').style.display = 'none';
        });
        
        // Limpiar filtro
        document.getElementById('comunas-limpiar').addEventListener('click', () => {
            document.querySelector('input[value="todas"]').checked = true;
            this.comunaSeleccionada = 'todas';
            this.aplicarFiltro();
        });
    }

    aplicarFiltro() {
        // Actualizar botón
        const btn = document.getElementById('comunas-toggle-btn');
        if (this.comunaSeleccionada === 'todas') {
            btn.textContent = 'Filtrar por Comuna (12)';
        } else {
            btn.textContent = `Comuna: ${this.comunaSeleccionada}`;
        }
        
        // Si existe la función global filtrarPropiedades, llamarla
        if (typeof window.filtrarPropiedadesCombinado === 'function') {
            window.filtrarPropiedadesCombinado();
        } else if (typeof window.filtrarPropiedades === 'function') {
            // Crear función combinada si no existe
            this.integrarConFiltrosExistentes();
        }
    }

    integrarConFiltrosExistentes() {
        // Guardar referencia original
        const filtrarOriginal = window.filtrarPropiedades;
        
        // Crear función combinada
        window.filtrarPropiedadesCombinado = function() {
            const precioMin = parseFloat(document.getElementById('filtro-precio-min').value) || 0;
            const precioMax = parseFloat(document.getElementById('filtro-precio-max').value) || Infinity;
            const habitaciones = parseInt(document.getElementById('filtro-habitaciones').value) || 0;
            const banos = parseInt(document.getElementById('filtro-banos').value) || 0;
            const metros = parseInt(document.getElementById('filtro-metros').value) || 0;
            
            const filtradas = window.propiedadesOriginales.filter(prop => {
                // Filtro de comuna
                if (window.comunasFilter?.comunaSeleccionada !== 'todas' && 
                    prop.commune !== window.comunasFilter.comunaSeleccionada) {
                    return false;
                }
                
                return prop.price >= precioMin &&
                       prop.price <= precioMax &&
                       prop.rooms >= habitaciones &&
                       prop.baths >= banos &&
                       prop.area >= metros;
            });
            
            const container = document.getElementById('propiedades-container');
            container.textContent = '';
            
            if (filtradas.length === 0) {
                container.innerHTML = '<p class="loading">No se encontraron propiedades</p>';
            } else {
                filtradas.forEach(prop => {
                    container.appendChild(window.createCard(prop));
                });
            }
        };
        
        // Reemplazar función original
        window.filtrarPropiedades = window.filtrarPropiedadesCombinado;
        
        // Actualizar event listeners existentes
        const btnFiltrar = document.getElementById('btn-filtrar');
        const btnLimpiar = document.getElementById('btn-limpiar');
        
        if (btnFiltrar) {
            btnFiltrar.replaceWith(btnFiltrar.cloneNode(true));
            document.getElementById('btn-filtrar').addEventListener('click', window.filtrarPropiedadesCombinado);
        }
        
        if (btnLimpiar) {
            btnLimpiar.replaceWith(btnLimpiar.cloneNode(true));
            document.getElementById('btn-limpiar').addEventListener('click', () => {
                // Limpiar inputs
                document.getElementById('filtro-precio-min').value = '';
                document.getElementById('filtro-precio-max').value = '';
                document.getElementById('filtro-habitaciones').value = '';
                document.getElementById('filtro-banos').value = '';
                document.getElementById('filtro-metros').value = '';
                
                // Limpiar filtro de comuna
                window.comunasFilter?.limpiarFiltroComuna();
                
                // Aplicar
                window.filtrarPropiedadesCombinado();
            });
        }
        
        // Ejecutar filtro
        window.filtrarPropiedadesCombinado();
    }
    
    limpiarFiltroComuna() {
        document.querySelector('input[value="todas"]').checked = true;
        this.comunaSeleccionada = 'todas';
        document.getElementById('comunas-toggle-btn').textContent = 'Filtrar por Comuna (12)';
    }
}

// CSS mínimo para el filtro
const comunasCSS = `
.comunas-filter-container {
    margin: 0 auto 20px;
    max-width: 400px;
}

.comunas-toggle-btn {
    width: 100%;
    padding: 12px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 10px;
}

.comunas-radio-list {
    background: white;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 10px;
}

.comuna-radio-option {
    display: flex;
    align-items: center;
    padding: 10px 0;
    cursor: pointer;
    border-bottom: 1px solid #eee;
}

.comuna-radio-option:last-child {
    border-bottom: none;
}

.comuna-radio-option input {
    display: none;
}

.radio-custom {
    width: 18px;
    height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 50%;
    margin-right: 10px;
    position: relative;
}

.comuna-radio-option input:checked + .radio-custom {
    border-color: #3b82f6;
    background: #3b82f6;
}

.comuna-radio-option input:checked + .radio-custom::after {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
}

.comuna-text {
    flex: 1;
}

.comuna-count {
    background: #e5e7eb;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
}

.comunas-actions {
    display: flex;
    gap: 10px;
}

.comunas-actions button {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
}

#comunas-aplicar {
    background: #3b82f6;
    color: white;
}

#comunas-limpiar.secundario {
    background: #e5e7eb;
    color: #374151;
}
`;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Agregar CSS
    const style = document.createElement('style');
    style.textContent = comunasCSS;
    document.head.appendChild(style);
    
    // Crear instancia global
    window.comunasFilter = new ComunasFilter();
});