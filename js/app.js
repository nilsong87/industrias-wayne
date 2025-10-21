// ===== VARIÁVEIS GLOBAIS E INICIALIZAÇÃO =====

// Armazena o perfil do usuário atual (role e department)
let currentUserProfile = { role: 'employee', department: 'none' }; // Valor padrão

// Referência para o modal de recursos
let resourceModal;

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async user => {
        if (user) {
            currentUserProfile = await getUserProfile(user.uid);
            console.log('User logged in:', user.email, 'Profile:', currentUserProfile);
            
            setupUI(user, currentUserProfile);
            navigateTo('dashboard');
            setupEventListeners();
        } else {
            console.log('User logged out');
            currentUserProfile = { role: 'employee', department: 'none' };
            setupUI();
            
            if (window.location.pathname.includes('index.html')) {
                window.location.replace('login.html');
            }
        }
    });
});

// ===== CONFIGURAÇÃO DE EVENT LISTENERS =====

function setupEventListeners() {
    const navLinks = document.querySelector('.navbar-nav');
    const appContent = document.getElementById('app-content');
    const resourceForm = document.getElementById('resource-form');
    
    const modalEl = document.getElementById('resource-modal');
    resourceModal = new bootstrap.Modal(modalEl);

    modalEl.addEventListener('hidden.bs.modal', () => {
        resourceForm.reset();
        document.getElementById('resource-id').value = '';
        document.getElementById('resource-modal-title').textContent = 'Adicionar Recurso';
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '';
    });

    navLinks.addEventListener('click', (e) => {
        e.preventDefault();
        const id = e.target.id;
        if (id === 'nav-dashboard') navigateTo('dashboard');
        else if (id === 'nav-resources') navigateTo('resources');
    });

    appContent.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (editBtn) {
            const id = editBtn.closest('tr').dataset.id;
            resourceForm.reset();
            document.getElementById('resource-id').value = id;
            document.getElementById('resource-modal-title').textContent = 'Carregando...';
            resourceModal.show();

            try {
                const resource = await getResource(id);
                if (resource) {
                    document.getElementById('resource-name').value = resource.name;
                    document.getElementById('resource-type').value = resource.type;
                    document.getElementById('resource-status').value = resource.status;
                    document.getElementById('resource-modal-title').textContent = 'Editar Recurso';

                    // Para managers, desabilita a edição do tipo de recurso
                    if (currentUserProfile.role === 'manager') {
                        document.getElementById('resource-type').disabled = true;
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar recurso:", error);
            }
        }

        if (deleteBtn) {
            const row = deleteBtn.closest('tr[data-id]');
            if (!row) return;
            const id = row.getAttribute('data-id');

            // Confirmação da ação
            if (!confirm('Deseja realmente excluir este recurso? Esta ação não pode ser desfeita.')) return;

            try {
                // Verifica permissão local (garanta também regras no Firestore)
                if (currentUserProfile.role !== 'admin' && currentUserProfile.role !== 'manager') {
                    alert('Apenas administradores e gerentes podem excluir recursos.');
                    return;
                }

                // Se houver função deleteResource fornecida em js/database.js, use-a
                if (typeof window.deleteResource === 'function') {
                    await window.deleteResource(id);
                } else {
                    // Fallback direto para Firestore
                    await window.db.collection('resources').doc(id).delete();
                }

                console.log('Recurso excluído:', id);

                // Atualiza UI
                await loadResources(currentUserProfile);
                await loadDashboardData(currentUserProfile);
            } catch (err) {
                console.error('Erro ao excluir recurso:', err);
                alert('Erro ao excluir recurso: ' + (err.message || err));
            }
        }
    });

    resourceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const typeInput = document.getElementById('resource-type');
        let resourceType = typeInput.value;

        // Se o usuário for um manager, o tipo é fixo ao seu departamento
        if (currentUserProfile.role === 'manager') {
            const requiredType = departmentToResourceType[currentUserProfile.department];
            if (requiredType) {
                resourceType = requiredType;
            }
        }

        const data = {
            id: document.getElementById('resource-id').value,
            name: document.getElementById('resource-name').value,
            type: resourceType,
            status: document.getElementById('resource-status').value,
        };
        
        await saveResource(data);
        resourceModal.hide();
        loadResources(currentUserProfile);
    });
}

// ===== SISTEMA DE NAVEGAÇÃO =====

function navigateTo(page) {
    const appContent = document.getElementById('app-content');
    const navDashboard = document.getElementById('nav-dashboard');
    const navResources = document.getElementById('nav-resources');

    if(navDashboard) navDashboard.classList.remove('active');
    if(navResources) navResources.classList.remove('active');

    if (page === 'dashboard') {
        appContent.innerHTML = generateDashboardHTML(currentUserProfile);
        if(navDashboard) navDashboard.classList.add('active');
        loadDashboardData(currentUserProfile);
    }
    else if (page === 'resources') {
        appContent.innerHTML = generateResourcesHTML(currentUserProfile);
        if(navResources) navResources.classList.add('active');
        loadResources(currentUserProfile);
    }
    else {
        appContent.innerHTML = generateDashboardHTML(currentUserProfile);
        if(navDashboard) navDashboard.classList.add('active');
        loadDashboardData(currentUserProfile);
    }
}