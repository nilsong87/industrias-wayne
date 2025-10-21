// ===== VARIÁVEIS GLOBAIS PARA GERENCIAMENTO DE GRÁFICOS =====

let typeChart = null;
let statusChart = null;

// ===== CONFIGURAÇÃO DA INTERFACE DO USUÁRIO =====

const setupUI = (user, profile = { role: 'employee', department: 'none' }) => {
    const userEmailSpan = document.querySelector('#user-email');
    const navResourcesLi = document.querySelector('#nav-resources-li');
    const mainContent = document.querySelector('#app-content');

    const roleDisplayNames = {
        admin: 'Admin',
        manager: 'Gerente',
        employee: 'Colaborador'
    };

    if (user) {
        const displayRole = roleDisplayNames[profile.role] || profile.role;
        const displayDepartment = profile.department !== 'all' && profile.department !== 'none' ? ` - ${profile.department}` : '';
        
        userEmailSpan.textContent = `${user.email} (${displayRole}${displayDepartment})`;
        
        navResourcesLi.style.display = 'block';
        mainContent.style.display = 'block';

    } else {
        userEmailSpan.textContent = '';
        navResourcesLi.style.display = 'none';
        mainContent.style.display = 'none';
    }
};

// ===== GERAÇÃO DE HTML DINÂMICO =====

const generateDashboardHTML = () => {
    return `
        <div class="row">
            <div class="col-lg-3 col-md-6 mb-4"><div class="card bg-dark-2 text-light h-100"><div class="card-body text-center"><h5 class="card-title"><i class="bi bi-box-seam me-2"></i>Recursos Totais</h5><p class="card-text fs-2 fw-bold" id="total-resources">-</p></div></div></div>
            <div class="col-lg-3 col-md-6 mb-4"><div class="card bg-dark-2 text-light h-100"><div class="card-body text-center"><h5 class="card-title"><i class="bi bi-check-circle me-2"></i>Operacional</h5><p class="card-text fs-2" id="status-operational">-</p></div></div></div>
            <div class="col-lg-3 col-md-6 mb-4"><div class="card bg-dark-2 text-light h-100"><div class="card-body text-center"><h5 class="card-title"><i class="bi bi-tools me-2"></i>Em Manutenção</h5><p class="card-text fs-2" id="status-maintenance">-</p></div></div></div>
            <div class="col-lg-3 col-md-6 mb-4"><div class="card bg-dark-2 text-light h-100"><div class="card-body text-center"><h5 class="card-title"><i class="bi bi-exclamation-triangle me-2"></i>Inativos</h5><p class="card-text fs-2" id="status-inactive">-</p></div></div></div>
        </div>
        <div class="row mt-4">
            <!-- Lista de Recursos -->
            <div class="col-md-6 mb-4">
                <div class="card bg-dark-2 text-light h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title mb-3">Lista de Recursos</h5>
                        <div id="dashboard-resource-list" class="flex-grow-1" style="max-height:500px; overflow-y:auto;">
                            <!-- A lista será injetada aqui -->
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Gráfico: Recursos por Status -->
            <div class="col-md-6 mb-4">
                <div class="card bg-dark-2 text-light h-100">
                    <div class="card-body" style="max-height:500px; height:500px; padding:0.75rem;">
                        <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                            <canvas id="resources-by-status-chart" style="width:100%; height:100%;"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const generateResourcesHTML = (profile) => {
    const canManage = profile.role === 'admin' || profile.role === 'manager';
    
    return `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Gestão de Recursos ${profile.department !== 'all' ? `(${profile.department})` : ''}</h2>
            ${canManage ? `<button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#resource-modal" id="add-resource-btn"><i class="bi bi-plus-circle"></i> Adicionar Recurso</button>` : ''}
        </div>
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>Status</th>
                        ${canManage ? '<th>Ações</th>' : ''}
                    </tr>
                </thead>
                <tbody id="resources-table-body"></tbody>
            </table>
        </div>
    `;
};

// ===== RENDERIZAÇÃO DE DADOS =====

const renderResources = (resources, profile) => {
    const tableBody = document.getElementById('resources-table-body');
    if (!tableBody) return;
    
    const canManage = profile.role === 'admin' || profile.role === 'manager';
    
    if (resources.length === 0) {
        const colSpan = canManage ? 5 : 4;
        tableBody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center">Nenhum recurso encontrado.</td></tr>`;
        return;
    }
    
    let html = '';
    resources.forEach(doc => {
        const resource = doc.data();
        const badgeClass = resource.status === 'Operacional' ? 'primary' : resource.status === 'Em Manutenção' ? 'warning' : 'danger';
        
        html += `
            <tr data-id="${doc.id}">
                <td>${doc.id}</td>
                <td>${resource.name}</td>
                <td>${resource.type}</td>
                <td><span class="badge bg-${badgeClass}">${resource.status}</span></td>
                ${canManage ? `<td><button class="btn btn-sm btn-warning edit-btn"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-danger delete-btn"><i class="bi bi-trash"></i></button></td>` : ''}
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
};

// ===== CARREGAMENTO DE DADOS =====

const loadDashboardData = async (profile) => {
    const snapshot = await getResources(profile);
    const resources = snapshot.docs;

    const statuses = { 'Operacional': 0, 'Em Manutenção': 0, 'Inativo': 0 };

    resources.forEach(doc => {
        const resource = doc.data();
        if (statuses.hasOwnProperty(resource.status)) {
            statuses[resource.status]++;
        }
    });

    document.getElementById('total-resources').textContent = resources.length;
    document.getElementById('status-operational').textContent = statuses['Operacional'];
    document.getElementById('status-maintenance').textContent = statuses['Em Manutenção'];
    document.getElementById('status-inactive').textContent = statuses['Inativo'];

    // Renderiza a nova lista de recursos no dashboard
    const listContainer = document.getElementById('dashboard-resource-list');
    if (listContainer) {
        let listHtml = '<ul class="list-group">';
        if (resources.length === 0) {
            listHtml += '<li class="list-group-item bg-dark-2 text-light border-secondary">Nenhum recurso encontrado.</li>';
        } else {
            resources.forEach(doc => {
                const resource = doc.data();
                const badgeClass = resource.status === 'Operacional' ? 'primary' :
                                  resource.status === 'Em Manutenção' ? 'warning' : 'danger';
                listHtml += `
                    <li class="list-group-item d-flex justify-content-between align-items-center bg-dark-2 text-light border-secondary">
                        ${resource.name}
                        <span class="badge bg-${badgeClass}">${resource.status}</span>
                    </li>
                `;
            });
        }
        listHtml += '</ul>';
        listContainer.innerHTML = listHtml;
    }

    // Renderiza apenas o gráfico de status
    renderChart('resources-by-status-chart', 'Recursos por Status', 'doughnut', Object.keys(statuses), Object.values(statuses));
    
    // Garante que o gráfico de tipos seja destruído se existir
    if (typeChart) {
        typeChart.destroy();
        typeChart = null;
    }
};

const loadResources = async (profile) => {
    const snapshot = await getResources(profile);
    renderResources(snapshot.docs, profile);
};

// ===== SISTEMA DE GRÁFICOS =====

const renderChart = (canvasId, label, type, labels, data) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    let chartInstanceRef = (canvasId === 'resources-by-type-chart') ? typeChart : statusChart;
    if (chartInstanceRef) {
        chartInstanceRef.destroy();
    }

    const newChart = new Chart(ctx, createChartConfig(label, type, labels, data));
    if (canvasId === 'resources-by-type-chart') {
        typeChart = newChart;
    } else {
        statusChart = newChart;
    }
};

const createChartConfig = (label, type, labels, data) => {
    return {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: ['rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(255, 99, 132, 0.7)'],
                borderColor: '#1e1e1e',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#fff',
                        font: { size: 14 }
                    }
                }
            }
        }
    };
};