// js/config.js - Configurações globais e lógica de permissões

// ===== MAPEAMENTO DE DEPARTAMENTOS PARA TIPOS DE RECURSOS GERENCIÁVEIS =====

const departmentManagedTypes = {
    'Transporte': ['Veículo'],
    'TI': ['Tecnologia'],
    'Segurança': ['Dispositivo de Segurança', 'Equipamento']
};

// Lista de todos os tipos de recursos possíveis no sistema
const allResourceTypes = [
    'Equipamento',
    'Veículo',
    'Dispositivo de Segurança',
    'Tecnologia',
    'Móveis'
];

// ===== FUNÇÕES DE LÓGICA DE PERMISSÃO =====

/**
 * Verifica se um usuário, com base em seu perfil, pode gerenciar (adicionar, editar, excluir) um recurso de um tipo específico.
 * @param {object} profile - O perfil do usuário (contém role e department).
 * @param {string} resourceType - O tipo do recurso a ser verificado.
 * @returns {boolean} - Retorna true se o usuário tiver permissão, senão false.
 */
function canManageResourceType(profile, resourceType) {
    if (!profile || !profile.role) {
        return false;
    }

    if (profile.role === 'admin') {
        return true;
    }

    if (profile.role === 'manager') {
        if (!profile.department || !resourceType) return false;
        const allowedTypes = departmentManagedTypes[profile.department.trim()];
        return allowedTypes ? allowedTypes.includes(resourceType) : false;
    }

    return false;
}

/**
 * Obtém a lista de tipos de recursos que um usuário pode gerenciar.
 * @param {object} profile - O perfil do usuário.
 * @returns {string[]} - Uma lista de strings contendo os tipos de recursos gerenciáveis.
 */
function getManagableResourceTypes(profile) {
    if (!profile || !profile.role) {
        return [];
    }

    if (profile.role === 'admin') {
        return allResourceTypes;
    }

    if (profile.role === 'manager') {
        if (!profile.department) return [];
        return departmentManagedTypes[profile.department.trim()] || [];
    }

    return [];
}