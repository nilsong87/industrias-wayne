// ===== CONFIGURAÇÃO DA COLEÇÃO DO FIRESTORE =====

const resourceCollection = db.collection('resources');

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
 * Obtém recursos baseados no perfil do usuário.
 * @param {Object} userProfile - Perfil do usuário, incluindo role e department.
 * @returns {Promise<QuerySnapshot>} Promise com os documentos dos recursos filtrados.
 */
function getResources(userProfile) {
    console.log('[DEBUG] getResources chamado com o perfil:', userProfile);
    let query = resourceCollection.orderBy('createdAt', 'desc');

    // Admins veem tudo. Para outros, filtramos por tipo de recurso.
    if (userProfile.role !== 'admin') {
        const userDepartment = userProfile.department ? userProfile.department.trim() : null;
        
        // Usa a variável de config.js como fonte da verdade para os tipos que o departamento pode VER.
        // Assumimos que os tipos que um gerente pode gerenciar são os mesmos que um colaborador pode ver.
        const resourceTypes = departmentManagedTypes[userDepartment] || [];
        
        console.log(`[DEBUG] Departamento do usuário: "${userDepartment}"`);
        console.log('[DEBUG] Tipos de recursos permitidos para visualização:', resourceTypes);

        // O Firestore lança um erro se a lista para a cláusula 'in' estiver vazia.
        if (resourceTypes.length > 0) {
            query = query.where('type', 'in', resourceTypes);
        } else {
            // Se um usuário (não-admin) não tem tipos de recursos associados, ele não deve ver nada.
            // Retornamos uma query que propositalmente não encontrará nenhum documento.
            return query.where('__no_results__', '==', true).get();
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
        }
         else {
            console.warn(`User document not found for UID: ${userId}. Defaulting to employee profile.`);
            return { role: 'employee', department: 'none' }; // Perfil padrão
        }
    } catch (error) {
        console.error("Error getting user profile:", error);
        return { role: 'employee', department: 'none' }; // Fallback em caso de erro
    }
}