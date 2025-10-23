// ===== VARIÁVEIS GLOBAIS E INICIALIZAÇÃO =====

let currentUserProfile = { role: 'employee', department: 'none' };
let resourceModal;

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async user => {
        if (user) {
            currentUserProfile = await getUserProfile(user.uid);
            
            // Verifica se o usuário acabou de fazer login para mostrar a mensagem
            if (sessionStorage.getItem('justLoggedIn') === 'true') {
                alert('Login bem-sucedido! Seja bem-vindo(a).');
                sessionStorage.removeItem('justLoggedIn');
            }

            setupUI(user, currentUserProfile);
            navigateTo('dashboard');
            setupEventListeners();
        } else {
            currentUserProfile = { role: 'employee', department: 'none' };
            setupUI();
            if (window.location.pathname.includes('index.html')) {
                window.location.replace('login.html');
            }
        }
    });
});

// ===== FUNÇÕES AUXILIARES DE UI =====

function populateResourceTypeDropdown(profile, selectedType = null) {
    const typeSelect = document.getElementById('resource-type');
    const manageableTypes = getManagableResourceTypes(profile);

    // DEBUG: Log para verificar quais tipos estão sendo carregados
    console.log('DEBUG: Tipos de recursos gerenciáveis para o perfil atual:', manageableTypes);

    typeSelect.innerHTML = ''; // Limpa opções existentes
    manageableTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        if (type === selectedType) {
            option.selected = true;
        }
        typeSelect.appendChild(option);
    });

    // Desabilita o campo se não for admin ou o gerente de segurança
    const isSecurityManager = profile.role === 'manager' && profile.department.trim() === 'Segurança';
    typeSelect.disabled = profile.role !== 'admin' && !isSecurityManager;
}

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
        document.getElementById('resource-type').disabled = false; // Reabilita o campo ao fechar
    });

    navLinks.addEventListener('click', (e) => {
        e.preventDefault();
        const id = e.target.id;
        if (id === 'nav-dashboard') navigateTo('dashboard');
        else if (id === 'nav-resources') navigateTo('resources');
    });

    appContent.addEventListener('click', async (e) => {
        const addBtn = e.target.closest('#add-resource-btn');
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (addBtn) {
            document.getElementById('resource-modal-title').textContent = 'Adicionar Recurso';
            populateResourceTypeDropdown(currentUserProfile);
            resourceModal.show();
        }

        if (editBtn) {
            const id = editBtn.closest('tr').dataset.id;
            
            try {
                const resource = await getResource(id);
                if (!resource) {
                    alert('Recurso não encontrado.');
                    return;
                }

                if (!canManageResourceType(currentUserProfile, resource.type)) {
                    alert('Você não tem permissão para editar este tipo de recurso.');
                    return;
                }

                resourceForm.reset();
                document.getElementById('resource-id').value = id;
                document.getElementById('resource-modal-title').textContent = 'Editar Recurso';
                
                document.getElementById('resource-name').value = resource.name;
                document.getElementById('resource-status').value = resource.status;
                
                populateResourceTypeDropdown(currentUserProfile, resource.type);
                
                resourceModal.show();

            } catch (error) {
                console.error("Erro ao buscar recurso para edição:", error);
                alert('Erro ao carregar dados do recurso.');
            }
        }

        if (deleteBtn) {
            const id = deleteBtn.closest('tr').dataset.id;

            try {
                const resource = await getResource(id);
                if (!resource) {
                    alert('Recurso não encontrado.');
                    return;
                }

                if (!canManageResourceType(currentUserProfile, resource.type)) {
                    alert('Você não tem permissão para excluir este tipo de recurso.');
                    return;
                }

                if (confirm('Deseja realmente excluir este recurso? Esta ação não pode ser desfeita.')) {
                    await deleteResource(id);
                    await loadResources(currentUserProfile);
                    await loadDashboardData(currentUserProfile); // Atualiza o dashboard também
                }
            } catch (err) {
                console.error('Erro ao excluir recurso:', err);
                alert('Erro ao excluir recurso.');
            }
        }
    });

    resourceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            id: document.getElementById('resource-id').value,
            name: document.getElementById('resource-name').value,
            type: document.getElementById('resource-type').value,
            status: document.getElementById('resource-status').value,
        };

        // Validação final de permissão antes de salvar
        if (!canManageResourceType(currentUserProfile, data.type)) {
            alert('Operação não permitida. Você não pode criar ou alterar para este tipo de recurso.');
            return;
        }
        
        await saveResource(data);
        resourceModal.hide();
        loadResources(currentUserProfile);
    });

    // Listener para o filtro de ID
    appContent.addEventListener('keyup', (e) => {
        if (e.target.id === 'resource-name-filter') {
            const filterText = e.target.value.toLowerCase();
            const tableBody = document.getElementById('resources-table-body');
            if (!tableBody) return;
            const rows = tableBody.querySelectorAll('tr');

            rows.forEach(row => {
                const nameCell = row.querySelector('td:nth-child(2)'); // A segunda coluna (td) é o Nome
                if (nameCell) {
                    const nameText = nameCell.textContent.toLowerCase();
                    if (nameText.includes(filterText)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
        }
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