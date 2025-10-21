// ===== CONFIGURAÇÃO DA COLEÇÃO DO FIRESTORE =====

/**
 * Referência para a coleção 'resources' no Firestore
 * Acesso através do objeto global 'window.db' que deve ser inicializado previamente
 */
const resourcesCollection = window.db.collection('resources');

// ===== FUNÇÕES DE GERENCIAMENTO DE RECURSOS =====

/**
 * Adiciona um novo recurso à coleção do Firestore
 * @param {Object} data - Dados do recurso a ser adicionado
 * @param {string} data.name - Nome do recurso
 * @param {string} data.type - Tipo/categoria do recurso
 * @param {number} data.quantity - Quantidade disponível
 * @param {string} data.location - Localização física do recurso
 * @param {string} data.notes - Observações/adicionais sobre o recurso
 * @returns {Promise} Promise que resolve quando o recurso é adicionado
 */
async function addResource(data) {
  // Adiciona metadados automáticos ao recurso
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); // Data/hora do servidor
  data.createdBy = window.auth.currentUser ? window.auth.currentUser.uid : null; // ID do usuário criador
  
  // Adiciona o documento à coleção 'resources'
  return resourcesCollection.add(data);
}

/**
 * Configura a interface do usuário para gerenciamento de recursos
 * Inclui event listeners para botões e formulários
 */
function setupResourceUI() {
  // ===== ELEMENTOS DA INTERFACE =====
  const addBtn = document.querySelector('#add-resource-btn'); // Botão para adicionar recurso
  const resourceForm = document.querySelector('#resource-form'); // Formulário de recurso

  // ===== CONFIGURAÇÃO DO BOTÃO "ADICIONAR RECURSO" =====
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      // Abre o modal do Bootstrap quando o botão é clicado
      const modalEl = document.getElementById('resourceModal');
      if (modalEl) {
        const modal = new bootstrap.Modal(modalEl); // Cria instância do modal
        modal.show(); // Exibe o modal
      }
    });
  }

  // ===== CONFIGURAÇÃO DO FORMULÁRIO DE RECURSO =====
  if (resourceForm) {
    /**
     * Event listener para submissão do formulário
     * Processa os dados e envia para o Firestore
     */
    resourceForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // Impede o envio tradicional do formulário
      
      // Obtém referência ao formulário
      const form = resourceForm;
      
      // ===== PREPARAÇÃO DOS DADOS DO FORMULÁRIO =====
      const data = {
        name: form['resource-name'].value.trim(), // Nome (remove espaços extras)
        type: form['resource-type'].value.trim(), // Tipo (remove espaços extras)
        quantity: Number(form['resource-quantity'].value) || 0, // Converte para número, padrão 0
        location: form['resource-location'].value.trim(), // Localização (remove espaços extras)
        notes: form['resource-notes'].value.trim() // Observações (remove espaços extras)
      };

      try {
        // ===== TENTATIVA DE ADIÇÃO DO RECURSO =====
        await addResource(data); // Chama função para adicionar ao Firestore
        
        // ===== LIMPEZA PÓS-SUCESSO =====
        // Fecha o modal do Bootstrap
        const modalEl = document.getElementById('resourceModal');
        if (modalEl) {
          bootstrap.Modal.getInstance(modalEl)?.hide(); // Fecha modal se existir
        }
        
        form.reset(); // Limpa todos os campos do formulário
        
        // ===== FEEDBACK E ATUALIZAÇÃO =====
        console.log('Recurso adicionado', data); // Log para desenvolvimento
        // Nota: Aqui poderia ser chamada uma função para atualizar a lista de recursos
        
      } catch (err) {
        // ===== TRATAMENTO DE ERROS =====
        console.error('Erro ao adicionar recurso:', err); // Log detalhado do erro
        alert('Erro ao adicionar recurso: ' + err.message); // Feedback para o usuário
      }
    });
  }
}

// ===== EXPOSIÇÃO DA FUNÇÃO PARA USO GLOBAL =====

/**
 * Torna a função disponível globalmente para ser chamada durante o carregamento da página
 * Permite que outros scripts inicializem a UI de recursos quando necessário
 */
window.setupResourceUI = setupResourceUI;