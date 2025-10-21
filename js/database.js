// ===== CONFIGURAÇÃO DA COLEÇÃO DO FIRESTORE =====

const resourceCollection = db.collection('resources');

// ===== MAPEAMENTO DE DEPARTAMENTOS PARA TIPOS DE RECURSOS =====

const departmentToResourceType = {
    'Segurança': 'Dispositivo de Segurança',
    'Transporte': 'Veículo',
    'TI': 'Tecnologia'
};

// ===== GERENCIAMENTO DE RECURSOS (CRUD OPERATIONS) =====

function saveResource(data) {
    if (data.id) {
        return resourceCollection.doc(data.id).update({
            name: data.name,
            type: data.type,
            status: data.status
        });
    } else {
        return resourceCollection.add({
            name: data.name,
            type: data.type,
            status: data.status,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

/**
 * Obtém recursos baseados no departamento do usuário.
 * @param {Object} userProfile - Perfil do usuário, incluindo o departamento.
 * @returns {Promise<QuerySnapshot>} Promise com os documentos dos recursos filtrados.
 */
function getResources(userProfile) {
    console.log('[DEBUG] getResources chamado com o perfil:', userProfile);
    let query = resourceCollection.orderBy('createdAt', 'desc');

    // Aplica filtro apenas se o usuário não for admin
    if (userProfile.role !== 'admin') {
        const userDepartment = userProfile.department;
        console.log(`[DEBUG] Departamento do usuário: "${userDepartment}"`);

        let resourceTypes = [];

        // Definir quais tipos de recurso cada departamento pode acessar
        if (userDepartment === 'Segurança') {
            resourceTypes = ['Dispositivo de Segurança', 'Equipamento'];
            console.log('[DEBUG] Tipos de recursos para Segurança:', resourceTypes);
        } else if (userDepartment === 'Transporte') {
            resourceTypes = ['Veículo'];
            console.log('[DEBUG] Tipos de recursos para Transporte:', resourceTypes);
        } else if (userDepartment === 'TI') {
            resourceTypes = ['Tecnologia'];
            console.log('[DEBUG] Tipos de recursos para TI:', resourceTypes);
        }

        // Aplicar filtro para múltiplos tipos usando 'in'
        if (resourceTypes.length > 0) {
            console.log('[DEBUG] Aplicando filtro: where(\'type\', \'in\',', resourceTypes, ')');
            query = query.where('type', 'in', resourceTypes);
        }
    } else {
        console.log('[DEBUG] Usuário é admin. Nenhum filtro de departamento aplicado.');
    }

    return query.get();
}

async function getResource(id) {
    const doc = await resourceCollection.doc(id).get();
    return doc.exists ? doc.data() : null;
}

function deleteResource(id) {
    return resourceCollection.doc(id).delete();
}

// ===== GERENCIAMENTO DE USUÁRIOS E PAPÉIS =====

/**
 * Obtém o perfil completo de um usuário (papel e departamento)
 * @param {string} userId - UID do usuário no Firebase Auth
 * @returns {Promise<Object>} Promise que resolve com o perfil do usuário (ex: { role: 'employee', department: 'TI' })
 */
async function getUserProfile(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            return userDoc.data();
        } else {
            console.warn(`User document not found for UID: ${userId}. Defaulting to employee profile.`);
            return { role: 'employee', department: 'none' }; // Perfil padrão
        }
    } catch (error) {
        console.error("Error getting user profile:", error);
        return { role: 'employee', department: 'none' }; // Fallback em caso de erro
    }
}