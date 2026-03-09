/**
 * ==============================================================
 * SCRIPT PRINCIPAL DO DASHBOARD
 * ==============================================================
 * Gerencia a interface do usuário e comunicação com o backend
 */

// ==========================================
// CONFIGURAÇÕES GLOBAIS
// ==========================================

// URL base da API (adaptar se necessário)
const API_BASE = 'http://localhost:3000/api';

// Estado global
let estadoGlobal = {
  clientesCarregados: [],
  chamadasCarregadas: [],
  abas: {
    ativa: 'dashboard'
  },
  ultimaResposta: null,
  atendimentoAtivo: false,
  tempoOnline: 0,
  intervaloTempo: null,
  atendimentoAtual: null,
  historicoAtendimentos: []
};

// ==========================================
// NAVEGAÇÃO ENTRE ABAS
// ==========================================

/**
 * Mostrar aba específica
 */
function mostrarAba(nomeAba) {
  // Remover classe 'active' de todos os tabs
  const todosOsTabs = document.querySelectorAll('.tab-content');
  todosOsTabs.forEach(tab => {
    tab.classList.remove('active');
  });

  // Remover classe 'active' de todos os botões (top+sidebar)
  const todosBotoes = document.querySelectorAll('.nav-btn, .sidebar-btn');
  todosBotoes.forEach(btn => {
    btn.classList.remove('active');
  });

  // Adicionar classe 'active' ao tab selecionado
  const tabSelecionado = document.getElementById(`tab-${nomeAba}`);
  if (tabSelecionado) {
    tabSelecionado.classList.add('active');
  }

  // Adicionar classe 'active' ao botão clicado (procura em ambos data attributes)
  const btnSelecionado = document.querySelector(`[data-tab="${nomeAba}"], [data-section="${nomeAba}"]`);
  if (btnSelecionado) {
    btnSelecionado.classList.add('active');
  }

  // Atualizar estado
  estadoGlobal.abas.ativa = nomeAba;

  // Carregar dados específicos da aba
  if (nomeAba === 'teste') {
    carregarStatusSistema();
    atualizarModeloAgente();
  } else if (nomeAba === 'historico') {
    carregarHistoricoAtendimentos();
  } else if (nomeAba === 'clientes') {
    carregarClientes();
  } else if (nomeAba === 'chamadas') {
    carregarChamadas();
  }

  console.log(`📄 Navegando para aba: ${nomeAba}`);
}

// ==========================================
// INICIALIZAR DASHBOARD
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 Dashboard carregado');
  
  // Configurar listeners dos botões de navegação (top)
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const nomeAba = btn.getAttribute('data-tab');
      mostrarAba(nomeAba);
    });
  });

  // Configurar listeners dos botões na sidebar
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const nomeAba = btn.getAttribute('data-section');
      mostrarAba(nomeAba);
    });
  });
  
  // Carregar dados iniciais
  carregarEstatisticas();
  carregarClientes();
  carregarClientesTeste();
  carregarConfiguracoes();
  
  // Configurar event listeners
  configurarEventListeners();
  
  // Auto-refresh a cada 30 segundos
  setInterval(() => {
    if (estadoGlobal.abas.ativa === 'clientes') {
      carregarEstatisticas();
      carregarClientes();
    }
  }, 30000);
});

/**
 * Configurar event listeners
 */
function configurarEventListeners_legacy() {
  // Slider de velocidade da fala
  const sliderVelocidade = document.getElementById('velocidade-fala');
  const valorVelocidade = document.getElementById('velocidade-valor');
  
  if (sliderVelocidade && valorVelocidade) {
    sliderVelocidade.addEventListener('input', (e) => {
      valorVelocidade.textContent = `${e.target.value}x`;
    });
  }
}

// ==========================================
// FUNÇÕES DE NAVEGAÇÃO
// ==========================================

/**
 * Trocar entre abas
 * @param {string} nomeAba - Nome da aba (clientes, chamadas, teste-ia)
 */
function switchTab(nomeAba) {
  // Esconder todas as abas
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remover classe active dos botões
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Mostrar aba selecionada
  const tabElement = document.getElementById(`tab-${nomeAba}`);
  if (tabElement) {
    tabElement.classList.add('active');
  }
  
  // Marcar botão como active
  event.target.classList.add('active');
  
  // Atualizar estado
  estadoGlobal.abas.ativa = nomeAba;
  
  // Carregar dados específicos da aba
  if (nomeAba === 'dashboard') {
    carregarStatusSistema();
  } else if (nomeAba === 'teste') {
    atualizarModeloAgente();
  } else if (nomeAba === 'historico') {
    carregarHistoricoAtendimentos();
  }
}

// ==========================================
// FUNÇÕES DE ESTATÍSTICAS
// ==========================================

/**
 * Carregar e exibir estatísticas gerais
 */
async function carregarEstatisticas() {
  try {
    const resposta = await fetch(`${API_BASE}/admin/estatisticas`);
    const dados = await resposta.json();
    
    if (dados.sucesso) {
      const stats = dados.estatisticas;
      
      // Atualizar elementos da tela
      document.getElementById('stat-clientes').textContent = stats.total_clientes || 0;
      document.getElementById('stat-chamadas').textContent = stats.total_chamadas || 0;
      document.getElementById('stat-resolvidas').textContent = stats.chamadas_resolvidas || 0;
      document.getElementById('stat-taxa').textContent = stats.taxa_resolucao || '0%';
      
      console.log('✅ Estatísticas carregadas');
    }
  } catch (erro) {
    console.error('❌ Erro ao carregar estatísticas:', erro);
  }
}

// ==========================================
// FUNÇÕES DE CLIENTES
// ==========================================

/**
 * Carregar lista de clientes
 * @param {number} pagina - Número da página
 */
async function carregarClientes(pagina = 1) {
  try {
    const resposta = await fetch(`${API_BASE}/clientes?page=${pagina}&perPage=20`);
    const dados = await resposta.json();
    
    if (dados.sucesso) {
      estadoGlobal.clientesCarregados = dados.dados;
      renderizarTabelaClientes(dados.dados);
      console.log('✅ Clientes carregados');
    }
  } catch (erro) {
    console.error('❌ Erro ao carregar clientes:', erro);
    mostrarErro('Erro ao carregar clientes');
  }
}

/**
 * Renderizar tabela de clientes
 * @param {Array} clientes - Lista de clientes
 */
function renderizarTabelaClientes(clientes) {
  const tbody = document.getElementById('tbody-clientes');
  
  if (clientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum cliente encontrado</td></tr>';
    return;
  }
  
  tbody.innerHTML = clientes.map(cliente => `
    <tr>
      <td>${cliente.id}</td>
      <td>${cliente.nome}</td>
      <td>${cliente.telefone}</td>
      <td>${cliente.email}</td>
      <td><span class="badge badge-${cliente.status}">${cliente.status}</span></td>
      <td>
        <button class="btn-icon" onclick="verDetalhesCliente(${cliente.id})">👁️</button>
        <button class="btn-icon" onclick="editarCliente(${cliente.id})">✏️</button>
        <button class="btn-icon" onclick="deletarCliente(${cliente.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

/**
 * Abrir formulário para criar cliente
 */
function openFormCriarCliente() {
  const form = document.getElementById('form-cliente');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  
  // Se abrir, focar no primeiro campo
  if (form.style.display === 'block') {
    document.getElementById('nome').focus();
  }
}

/**
 * Fechar formulário
 */
function closeFormCliente() {
  document.getElementById('form-cliente').style.display = 'none';
  document.getElementById('formNovoCliente').reset();
}

/**
 * Submeter novo cliente
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formNovoCliente');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const novoCliente = {
        nome: document.getElementById('nome').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        cpf_cnpj: document.getElementById('cpf_cnpj').value || null,
        endereco: document.getElementById('endereco').value || null,
        dados_importantes: document.getElementById('dados_importantes').value || null
      };
      
      try {
        const resposta = await fetch(`${API_BASE}/clientes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(novoCliente)
        });
        
        const dados = await resposta.json();
        
        if (dados.sucesso) {
          mostrarSucesso(`Cliente ${novoCliente.nome} criado com sucesso!`);
          closeFormCliente();
          carregarClientes();
        } else {
          mostrarErro(dados.erro || 'Erro ao criar cliente');
        }
      } catch (erro) {
        console.error('Erro:', erro);
        mostrarErro('Erro ao criar cliente');
      }
    });
  }
});

/**
 * Deletar cliente
 * @param {number} clienteId - ID do cliente
 */
async function deletarCliente(clienteId) {
  if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
    return;
  }
  
  try {
    const resposta = await fetch(`${API_BASE}/clientes/${clienteId}`, {
      method: 'DELETE'
    });
    
    const dados = await resposta.json();
    
    if (dados.sucesso) {
      mostrarSucesso('Cliente excluído com sucesso!');
      carregarClientes();
    } else {
      mostrarErro(dados.erro || 'Erro ao excluir cliente');
    }
  } catch (erro) {
    console.error('Erro:', erro);
    mostrarErro('Erro ao excluir cliente');
  }
}

/**
 * Ver detalhes do cliente
 * @param {number} clienteId - ID do cliente
 */
async function verDetalhesCliente(clienteId) {
  try {
    const resposta = await fetch(`${API_BASE}/clientes/${clienteId}`);
    const dados = await resposta.json();
    
    if (dados.sucesso) {
      const cliente = dados.cliente;
      const chamadas = dados.historico_chamadas || [];
      
      const conteudoModal = `
        <h2>${cliente.nome}</h2>
        <div class="detalhes-cliente">
          <p><strong>Telefone:</strong> ${cliente.telefone}</p>
          <p><strong>Email:</strong> ${cliente.email}</p>
          <p><strong>CPF/CNPJ:</strong> ${cliente.cpf_cnpj || 'N/A'}</p>
          <p><strong>Endereço:</strong> ${cliente.endereco || 'N/A'}</p>
          <p><strong>Status:</strong> <span class="badge badge-${cliente.status}">${cliente.status}</span></p>
          <p><strong>Cadastrado em:</strong> ${new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}</p>
          <p><strong>Última interação:</strong> ${cliente.ultima_interacao ? new Date(cliente.ultima_interacao).toLocaleDateString('pt-BR') : 'Nenhuma'}</p>
          <p><strong>Dados importantes:</strong> ${cliente.dados_importantes || 'N/A'}</p>
          
          <h3>Histórico de Chamadas (últimas 5)</h3>
          <ul>
            ${chamadas.slice(0, 5).map(chamada => `
              <li>
                <strong>${new Date(chamada.data_hora).toLocaleDateString('pt-BR')}:</strong>
                ${chamada.motivo_chamada} - 
                <span class="badge badge-${chamada.foi_resolvido ? 'success' : 'warning'}">
                  ${chamada.foi_resolvido ? 'Resolvido' : 'Não resolvido'}
                </span>
              </li>
            `).join('')}
            ${chamadas.length === 0 ? '<li>Nenhuma chamada registrada</li>' : ''}
          </ul>
        </div>
      `;
      
      abrirModal(conteudoModal);
    }
  } catch (erro) {
    console.error('Erro:', erro);
    mostrarErro('Erro ao carregar detalhes');
  }
}

/**
 * Editar cliente (abrir formulário com dados)
 * @param {number} clienteId - ID do cliente
 */
function editarCliente(clienteId) {
  const cliente = estadoGlobal.clientesCarregados.find(c => c.id === clienteId);
  
  if (cliente) {
    document.getElementById('nome').value = cliente.nome;
    document.getElementById('telefone').value = cliente.telefone;
    document.getElementById('email').value = cliente.email;
    document.getElementById('cpf_cnpj').value = cliente.cpf_cnpj || '';
    document.getElementById('endereco').value = cliente.endereco || '';
    document.getElementById('dados_importantes').value = cliente.dados_importantes || '';
    
    openFormCriarCliente();
  }
}

// ==========================================
// FUNÇÕES DE CHAMADAS
// ==========================================

/**
 * Carregar histórico de chamadas
 */
async function carregarChamadas() {
  try {
    // Aqui você poderia fazer fetch de chamadas
    // Por enquanto, usar dados exemplo
    console.log('📞 Chamadas carregadas');
  } catch (erro) {
    console.error('Erro ao carregar chamadas:', erro);
  }
}

// ==========================================
// FUNÇÕES DE TESTE IA
// ==========================================

/**
 * Carregar clientes para select de teste
 */
async function carregarClientesTeste() {
  try {
    const resposta = await fetch(`${API_BASE}/clientes?perPage=100`);
    const dados = await resposta.json();
    
    if (dados.sucesso) {
      const select = document.getElementById('select-cliente-teste');
      select.innerHTML = '<option value="">Cliente anônimo</option>';
      
      dados.dados.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = `${cliente.nome} (${cliente.telefone})`;
        select.appendChild(option);
      });
    }
  } catch (erro) {
    console.error('Erro ao carregar clientes para teste:', erro);
  }
}

/**
 * Testar processamento da IA
 */
async function testarIA() {
  const clienteId = document.getElementById('select-cliente-teste').value;
  const mensagem = document.getElementById('input-mensagem').value;
  
  if (!mensagem) {
    mostrarErro('Por favor, digite uma mensagem');
    return;
  }
  
  try {
    // Mostrar loading
    const resultadoBox = document.getElementById('resultado-ia');
    resultadoBox.innerHTML = '<p class="loading">⏳ Processando...</p>';
    
    const resposta = await fetch(`${API_BASE}/ia/processar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mensagem,
        cliente_id: clienteId || null
      })
    });
    
    const dados = await resposta.json();
    
    if (dados.sucesso) {
      const resultado = dados.resposta;
      
      // Exibir resposta
      resultadoBox.innerHTML = `
        <div class="resultado-completo">
          <h4>Resposta da IA:</h4>
          <p>${resultado.resposta}</p>
          
          <div class="metadados">
            <p><strong>Intenção:</strong> ${resultado.intencao}</p>
            <p><strong>Confiança:</strong> ${(resultado.confianca * 100).toFixed(0)}%</p>
            <p><strong>Deve transferir:</strong> ${resultado.deve_transferir ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Solução aplicada:</strong> ${resultado.solucao_aplicada ? '✅ Sim' : '❌ Não'}</p>
          </div>
        </div>
      `;
      
      // Exibir análise de intenção
      await carregarAnaliseIntencao(mensagem);
      
      // Armazenar última resposta
      estadoGlobal.ultimaResposta = resultado.resposta;
      document.getElementById('btn-ouvir-resposta').disabled = false;
      
    } else {
      mostrarErro(dados.erro || 'Erro ao processar');
    }
  } catch (erro) {
    console.error('Erro:', erro);
    // Fallback para demonstração quando API não está disponível
    if (erro.message.includes('fetch') || erro.message.includes('Failed to fetch')) {
      console.log('API não disponível, usando resposta mockada para demonstração');
      const respostaMock = {
        resposta: 'Olá! Sou o assistente virtual da Atende AI. Como posso ajudar você hoje com seus serviços bancários?',
        intencao: 'saudacao',
        confianca: 0.95,
        deve_transferir: false,
        solucao_aplicada: false
      };
      
      resultadoBox.innerHTML = `
        <div class="resultado-completo">
          <h4>Resposta da IA (Demonstração):</h4>
          <p>${respostaMock.resposta}</p>
          
          <div class="metadados">
            <p><strong>Intenção:</strong> ${respostaMock.intencao}</p>
            <p><strong>Confiança:</strong> ${(respostaMock.confianca * 100).toFixed(0)}%</p>
            <p><strong>Deve transferir:</strong> ${respostaMock.deve_transferir ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Solução aplicada:</strong> ${respostaMock.solucao_aplicada ? '✅ Sim' : '❌ Não'}</p>
          </div>
        </div>
      `;
      
      // Armazenar última resposta
      estadoGlobal.ultimaResposta = respostaMock.resposta;
      document.getElementById('btn-ouvir-resposta').disabled = false;
    } else {
      document.getElementById('resultado-ia').innerHTML = `<p class="erro">❌ Erro: ${erro.message}</p>`;
    }
  }
}

/**
 * Carregar análise de intenção
 * @param {string} mensagem - Mensagem para analisar
 */
async function carregarAnaliseIntencao(mensagem) {
  try {
    const resposta = await fetch(`${API_BASE}/ia/analise-intencao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mensagem })
    });
    
    const dados = await resposta.json();
    
    if (dados.sucesso) {
      const analise = dados.analise;
      const analiseBox = document.getElementById('analise-intencao');
      
      analiseBox.innerHTML = `
        <div class="analise-detalhes">
          <p><strong>Categoria:</strong> ${analise.categoria}</p>
          <p><strong>Intenção:</strong> ${analise.intenção}</p>
          <p><strong>Urgência:</strong> ${analise.urgencia}/10</p>
          <p><strong>Palavras-chave:</strong> ${analise.palavras_chave.join(', ')}</p>
        </div>
      `;
    }
  } catch (erro) {
    console.error('Erro ao carregar análise:', erro);
  }
}

// ==========================================
// FUNÇÕES DE MODAL
// ==========================================

/**
 * Abrir modal com conteúdo
 * @param {string} conteudo - HTML do conteúdo
 */
function abrirModal(conteudo) {
  const modal = document.getElementById('modal-detalhes');
  const modalBody = document.getElementById('modal-body');
  
  modalBody.innerHTML = conteudo;
  modal.style.display = 'block';
}

/**
 * Fechar modal
 */
function closeModal() {
  document.getElementById('modal-detalhes').style.display = 'none';
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
  const modal = document.getElementById('modal-detalhes');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

// ==========================================
// FUNÇÕES UTILITÁRIAS
// ==========================================

/**
 * Mostrar notificação de sucesso
 * @param {string} mensagem - Mensagem a exibir
 */
function mostrarSucesso(mensagem) {
  const notif = document.createElement('div');
  notif.className = 'notificacao sucesso';
  notif.textContent = '✅ ' + mensagem;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.remove();
  }, 3000);
}

/**
 * Mostrar notificação de erro
 * @param {string} mensagem - Mensagem a exibir
 */
function mostrarErro(mensagem) {
  const notif = document.createElement('div');
  notif.className = 'notificacao erro';
  notif.textContent = '❌ ' + mensagem;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.remove();
  }, 3000);
}

/**
 * Fazer logout
 */
function logout() {
  if (confirm('Tem certeza que deseja sair?')) {
    // Limpar dados locais
    localStorage.clear();
    // Redirecionar para início
    window.location.href = '/';
  }
}

// ==========================================
// CONFIGURAÇÃO DO AGENTE
// ==========================================

/**
 * Trocar entre sub-abas de configuração
 * @param {string} nomeSubAba - Nome da sub-aba (geral, voz, scripts, preview)
 * @param {HTMLElement} btnElement - Elemento do botão clicado
 */
function switchConfigTab(nomeSubAba, btnElement) {
  console.log(`Trocando para aba: ${nomeSubAba}`, btnElement);
  
  // Esconder todas as sub-abas
  document.querySelectorAll('.config-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Remover classe active dos botões
  document.querySelectorAll('.config-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Mostrar sub-aba selecionada
  const subTabElement = document.getElementById(`config-${nomeSubAba}`);
  console.log(`Buscando elemento: #config-${nomeSubAba}`, subTabElement);
  
  if (subTabElement) {
    subTabElement.classList.add('active');
    console.log(`Aba ${nomeSubAba} ativada com sucesso`);
  } else {
    console.warn(`Elemento config-${nomeSubAba} não encontrado`);
  }
  
  // Marcar botão como active
  if (btnElement && btnElement.classList) {
    btnElement.classList.add('active');
    console.log(`Botão marcado como ativo`);
  }
}

/**
 * Salvar configurações gerais
 */
function salvarConfigGeral() {
  const nome = document.getElementById('nome-agente').value;
  const tom = document.getElementById('tom-voz').value;
  const idioma = document.getElementById('idioma-agente').value;
  
  const config = {
    nome_agente: nome,
    tom_voz: tom,
    idioma: idioma
  };
  
  localStorage.setItem('config_geral', JSON.stringify(config));
  mostrarNotificacao('Configurações gerais salvas!', 'success');
}

/**
 * Salvar configurações de voz
 */
function salvarConfigVoz() {
  const habilitar = document.getElementById('habilitar-voz').checked;
  const velocidade = document.getElementById('velocidade-fala').value;
  const tom = document.getElementById('tom-voz-audio').value;
  
  const config = {
    voz_habilitada: habilitar,
    velocidade_fala: velocidade,
    tom_voz_audio: tom
  };
  
  localStorage.setItem('config_voz', JSON.stringify(config));
  mostrarNotificacao('Configurações de voz salvas!', 'success');
}

/**
 * Salvar scripts de conversa
 */
function salvarConfigScripts() {
  const habilitar = document.getElementById('habilitar-saudacao').checked;
  const saudacao = document.getElementById('script-saudacao').value;
  const encerramento = document.getElementById('script-encerramento').value;
  const transferencia = document.getElementById('script-transferencia').value;
  
  const config = {
    saudacao_habilitada: habilitar,
    script_saudacao: saudacao,
    script_encerramento: encerramento,
    script_transferencia: transferencia
  };
  
  localStorage.setItem('config_scripts', JSON.stringify(config));
  mostrarNotificacao('Scripts salvos!', 'success');
}

/**
 * Testar voz
 */
function testarVoz() {
  const texto = document.getElementById('texto-teste-voz').value;
  if (!texto) {
    mostrarNotificacao('Digite um texto para testar', 'error');
    return;
  }
  
  falarTexto(texto);
}

/**
 * Executar preview da resposta
 */
async function executarPreview() {
  const mensagem = document.getElementById('preview-mensagem').value;
  if (!mensagem) {
    mostrarNotificacao('Digite uma mensagem para preview', 'error');
    return;
  }
  
  try {
    const respostaBox = document.getElementById('preview-resposta');
    respostaBox.innerHTML = '<p>Processando...</p>';
    
    const resposta = await fetch(`${API_BASE}/ia/processar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mensagem,
        cliente_id: null
      })
    });
    
    const dados = await resposta.json();
    
    if (dados.sucesso) {
      const resultado = dados.resposta;
      respostaBox.innerHTML = `
        <div class="preview-response">
          <p><strong>Resposta:</strong> ${resultado.resposta}</p>
          <p><strong>Intenção:</strong> ${resultado.intencao}</p>
          <p><strong>Confiança:</strong> ${(resultado.confianca * 100).toFixed(0)}%</p>
        </div>
      `;
      
      // Armazenar resposta para áudio
      window.previewResposta = resultado.resposta;
      document.getElementById('btn-preview-audio').disabled = false;
      
    } else {
      respostaBox.innerHTML = `<p class="erro">Erro: ${dados.erro}</p>`;
    }
  } catch (erro) {
    respostaBox.innerHTML = `<p class="erro">Erro: ${erro.message}</p>`;
  }
}

/**
 * Ouvir última resposta por voz
 */
function ouvirUltimaResposta() {
  if (estadoGlobal.ultimaResposta) {
    falarTexto(estadoGlobal.ultimaResposta);
  } else {
    mostrarNotificacao('Nenhuma resposta para ouvir', 'error');
  }
}

/**
 * Falar texto usando Web Speech API
 * @param {string} texto - Texto a ser falado
 */
function falarTexto_legacy(texto) {
  if (!('speechSynthesis' in window)) {
    mostrarNotificacao('Seu navegador não suporta síntese de voz', 'error');
    return;
  }
  
  // Cancelar fala anterior se existir
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(texto);
  
  // Configurar voz a partir dos inputs atuais
  const velocidade = document.getElementById('velocidade-fala').value;
  const tom = document.getElementById('tom-voz-audio').value;
  
  utterance.rate = parseFloat(velocidade) || 1;
  utterance.lang = 'pt-BR';
  
  // Selecionar voz
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = null;
  
  if (tom === 'female') {
    selectedVoice = voices.find(voice => voice.lang.includes('pt') && (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('maria') || voice.name.toLowerCase().includes('ana') || voice.name.toLowerCase().includes('female')));
  } else if (tom === 'male') {
    selectedVoice = voices.find(voice => voice.lang.includes('pt') && (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('joão') || voice.name.toLowerCase().includes('carlos') || voice.name.toLowerCase().includes('male')));
  }
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  
  // Falar
  window.speechSynthesis.speak(utterance);
}

/**
 * Carregar configurações salvas
 */
function carregarConfiguracoes() {
  // Config geral
  const configGeral = JSON.parse(localStorage.getItem('config_geral') || '{}');
  if (configGeral.nome_agente) document.getElementById('nome-agente').value = configGeral.nome_agente;
  if (configGeral.tom_voz) document.getElementById('tom-voz').value = configGeral.tom_voz;
  if (configGeral.idioma) document.getElementById('idioma-agente').value = configGeral.idioma;
  
  // Config voz
  const configVoz = JSON.parse(localStorage.getItem('config_voz') || '{}');
  document.getElementById('habilitar-voz').checked = configVoz.voz_habilitada !== false;
  document.getElementById('velocidade-fala').value = configVoz.velocidade_fala || 1;
  document.getElementById('velocidade-valor').textContent = `${configVoz.velocidade_fala || 1}x`;
  if (configVoz.tom_voz_audio) document.getElementById('tom-voz-audio').value = configVoz.tom_voz_audio;
  
  // Config scripts
  const configScripts = JSON.parse(localStorage.getItem('config_scripts') || '{}');
  document.getElementById('habilitar-saudacao').checked = configScripts.saudacao_habilitada !== false;
  if (configScripts.script_saudacao) document.getElementById('script-saudacao').value = configScripts.script_saudacao;
  if (configScripts.script_encerramento) document.getElementById('script-encerramento').value = configScripts.script_encerramento;
  if (configScripts.script_transferencia) document.getElementById('script-transferencia').value = configScripts.script_transferencia;
}

/**
 * Mostrar notificação temporária
 */
function mostrarNotificacao_legacy(mensagem, tipo = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${tipo}`;
  notification.textContent = mensagem;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  
  if (tipo === 'success') notification.style.background = 'var(--success-color)';
  else if (tipo === 'error') notification.style.background = 'var(--danger-color)';
  else notification.style.background = 'var(--primary-color)';
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

/**
 * Carregar exemplo de mensagem
 */
function carregarExemplo() {
  const select = document.getElementById('exemplos-mensagem');
  const textarea = document.getElementById('input-mensagem');
  if (select.value) {
    textarea.value = select.value;
  }
}

/**
 * Iniciar gravação de voz
 */
function iniciarGravacao() {
  const btn = document.getElementById('btn-voice');
  const textarea = document.getElementById('input-mensagem');
  
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.');
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = false;
  
  recognition.onstart = () => {
    btn.textContent = '🎤 Gravando...';
    btn.classList.add('recording');
  };
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    textarea.value = transcript;
  };
  
  recognition.onend = () => {
    btn.textContent = '🎤 Gravar Voz';
    btn.classList.remove('recording');
  };
  
  recognition.onerror = (event) => {
    console.error('Erro no reconhecimento:', event.error);
    btn.textContent = '🎤 Gravar Voz';
    btn.classList.remove('recording');
  };
  
  recognition.start();
}

/**
 * Adicionar teste ao histórico
 */
function adicionarAoHistorico(mensagem, resposta) {
  const historyDiv = document.getElementById('historico-testes');
  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `
    <h4>${new Date().toLocaleString()}</h4>
    <p><strong>Pergunta:</strong> ${mensagem}</p>
    <p><strong>Resposta:</strong> ${resposta.resposta}</p>
    <p><strong>Intenção:</strong> ${resposta.intencao} (${(resposta.confianca * 100).toFixed(0)}%)</p>
  `;
  
  // Remover mensagem inicial se existir
  if (historyDiv.querySelector('p') && historyDiv.querySelector('p').textContent === 'Nenhum teste realizado ainda.') {
    historyDiv.innerHTML = '';
  }
  
  historyDiv.insertBefore(item, historyDiv.firstChild);
  
  // Limitar a 10 itens
  const items = historyDiv.querySelectorAll('.history-item');
  if (items.length > 10) {
    historyDiv.removeChild(items[items.length - 1]);
  }
}

// ==========================================
// SISTEMA DE ATENDIMENTO
// ==========================================

/**
 * Carregar status do sistema
 */
async function carregarStatusSistema() {
  // Verificar status da API
  try {
    const response = await fetch(`${API_BASE}/admin/estatisticas`);
    if (response.ok) {
      document.getElementById('status-api').textContent = '✅ Conectado';
    } else {
      document.getElementById('status-api').textContent = '❌ Erro de conexão';
    }
  } catch (error) {
    document.getElementById('status-api').textContent = '❌ Indisponível';
  }

  // Verificar sistema de voz
  if ('speechSynthesis' in window) {
    document.getElementById('status-voz').textContent = '✅ Disponível';
  } else {
    document.getElementById('status-voz').textContent = '❌ Não suportado';
  }

  // Status do agente
  document.getElementById('status-agente').textContent = '✅ Configurado e ativo';
}

/**
 * Atualizar preview do modelo do agente
 */
function atualizarModeloAgente() {
  const configGeral = JSON.parse(localStorage.getItem('config_geral') || '{}');
  const configVoz = JSON.parse(localStorage.getItem('config_voz') || '{}');
  const configScripts = JSON.parse(localStorage.getItem('config_scripts') || '{}');

  // Atualizar informações básicas
  document.getElementById('model-nome').textContent = configGeral.nome_agente || 'Assistente Virtual';
  document.getElementById('model-tom').textContent = `Tom: ${configGeral.tom_voz || 'Profissional'}`;
  document.getElementById('model-idioma').textContent = `Idioma: ${getNomeIdioma(configGeral.idioma || 'pt-BR')}`;
  document.getElementById('model-voz').textContent = `Voz: ${configVoz.voz_habilitada !== false ? 'Habilitada' : 'Desabilitada'}`;

  // Atualizar scripts
  document.getElementById('preview-saudacao').textContent = configScripts.script_saudacao ?
    configScripts.script_saudacao.substring(0, 50) + '...' : 'Olá! Bem-vindo à Atende AI...';
  document.getElementById('preview-encerramento').textContent = configScripts.script_encerramento ?
    configScripts.script_encerramento.substring(0, 50) + '...' : 'Obrigado por entrar em contato...';
}

/**
 * Obter nome do idioma
 */
function getNomeIdioma(codigo) {
  const idiomas = {
    'pt-BR': 'Português (Brasil)',
    'pt-PT': 'Português (Portugal)',
    'en-US': 'Inglês',
    'es-ES': 'Espanhol'
  };
  return idiomas[codigo] || codigo;
}

/**
 * Iniciar atendimento
 */
function iniciarAtendimento() {
  if (estadoGlobal.atendimentoAtivo) return;

  estadoGlobal.atendimentoAtivo = true;

  // Atualizar interface
  document.getElementById('btn-iniciar-atendimento').disabled = true;
  document.getElementById('btn-parar-atendimento').disabled = false;
  document.getElementById('btn-send-manual').disabled = false;
  document.getElementById('manual-message').disabled = false;
  document.getElementById('btn-transferir').disabled = false;
  document.getElementById('btn-encerrar').disabled = false;

  // Atualizar indicadores
  document.getElementById('indicator-status').textContent = '🟢';
  document.getElementById('status-text').textContent = 'Sistema Ativo';

  // Iniciar contador de tempo
  estadoGlobal.tempoOnline = 0;
  estadoGlobal.intervaloTempo = setInterval(() => {
    estadoGlobal.tempoOnline++;
    atualizarTempoOnline();
  }, 1000);

  // Adicionar mensagem de boas-vindas
  adicionarMensagemSistema('🎉 Sistema de atendimento iniciado! Aguardando chamadas...');

  mostrarNotificacao('Atendimento iniciado com sucesso!', 'success');
}

/**
 * Parar atendimento
 */
function pararAtendimento() {
  if (!estadoGlobal.atendimentoAtivo) return;

  estadoGlobal.atendimentoAtivo = false;

  // Atualizar interface
  document.getElementById('btn-iniciar-atendimento').disabled = false;
  document.getElementById('btn-parar-atendimento').disabled = true;
  document.getElementById('btn-send-manual').disabled = true;
  document.getElementById('manual-message').disabled = true;
  document.getElementById('btn-transferir').disabled = true;
  document.getElementById('btn-encerrar').disabled = true;

  // Atualizar indicadores
  document.getElementById('indicator-status').textContent = '🔴';
  document.getElementById('status-text').textContent = 'Sistema Parado';

  // Parar contador
  if (estadoGlobal.intervaloTempo) {
    clearInterval(estadoGlobal.intervaloTempo);
    estadoGlobal.intervaloTempo = null;
  }

  // Adicionar mensagem de encerramento
  adicionarMensagemSistema('🛑 Sistema de atendimento parado.');

  mostrarNotificacao('Atendimento parado.', 'info');
}

/**
 * Atualizar tempo online
 */
function atualizarTempoOnline() {
  const horas = Math.floor(estadoGlobal.tempoOnline / 3600);
  const minutos = Math.floor((estadoGlobal.tempoOnline % 3600) / 60);
  const segundos = estadoGlobal.tempoOnline % 60;

  const tempoFormatado = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  document.getElementById('tempo-online').textContent = tempoFormatado;
}

/**
 * Adicionar mensagem na conversa
 */
function adicionarMensagemSistema(texto) {
  const messagesArea = document.getElementById('conversation-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'system-message';
  messageDiv.innerHTML = `<p><strong>Sistema:</strong> ${texto}</p><small>${new Date().toLocaleTimeString()}</small>`;
  messagesArea.appendChild(messageDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

/**
 * Enviar mensagem manual
 */
function enviarMensagemManual() {
  const input = document.getElementById('manual-message');
  const mensagem = input.value.trim();

  if (!mensagem) {
    mostrarNotificacao('Digite uma mensagem', 'error');
    return;
  }

  // Adicionar mensagem do usuário
  adicionarMensagemUsuario(mensagem);

  // Limpar input
  input.value = '';

  // Simular resposta do agente (modo demo)
  setTimeout(() => {
    simularRespostaAgente(mensagem);
  }, 1000 + Math.random() * 2000); // Delay aleatório
}

/**
 * Adicionar mensagem do usuário
 */
function adicionarMensagemUsuario(texto) {
  const messagesArea = document.getElementById('conversation-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'user-message';
  messageDiv.innerHTML = `<p><strong>Você:</strong> ${texto}</p><small>${new Date().toLocaleTimeString()}</small>`;
  messagesArea.appendChild(messageDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

/**
 * Adicionar mensagem do agente
 */
function adicionarMensagemAgente(texto) {
  const messagesArea = document.getElementById('conversation-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'agent-message';
  messageDiv.innerHTML = `<p><strong>Agente:</strong> ${texto}</p><small>${new Date().toLocaleTimeString()}</small>`;
  messagesArea.appendChild(messageDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight;

  // Reproduzir voz se habilitada
  const configVoz = JSON.parse(localStorage.getItem('config_voz') || '{}');
  if (configVoz.voz_habilitada !== false) {
    falarTexto(texto);
  }
}

/**
 * Simular resposta do agente
 */
async function simularRespostaAgente(mensagemUsuario) {
  try {
    // Usar a API real se disponível
    const response = await fetch(`${API_BASE}/ia/processar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mensagem: mensagemUsuario,
        cliente_id: null
      })
    });

    if (response.ok) {
      const dados = await response.json();
      if (dados.sucesso) {
        adicionarMensagemAgente(dados.resposta.resposta);
        registrarAtendimento(mensagemUsuario, dados.resposta);
      } else {
        adicionarMensagemAgente('Desculpe, houve um erro no processamento. Tente novamente.');
      }
    } else {
      // Fallback para resposta simulada
      const respostaSimulada = gerarRespostaSimulada(mensagemUsuario);
      adicionarMensagemAgente(respostaSimulada);
      registrarAtendimento(mensagemUsuario, { resposta: respostaSimulada, intencao: 'simulado' });
    }
  } catch (error) {
    // Fallback para resposta simulada
    const respostaSimulada = gerarRespostaSimulada(mensagemUsuario);
    adicionarMensagemAgente(respostaSimulada);
    registrarAtendimento(mensagemUsuario, { resposta: respostaSimulada, intencao: 'simulado' });
  }
}

/**
 * Gerar resposta simulada
 */
function gerarRespostaSimulada(mensagem) {
  const respostas = [
    'Entendi sua solicitação. Como posso ajudar você hoje?',
    'Obrigado por entrar em contato. Estou aqui para ajudar.',
    'Vou verificar isso para você. Um momento por favor.',
    'Essa é uma boa pergunta. Deixe-me explicar melhor.',
    'Posso ajudar com mais detalhes sobre isso?'
  ];

  if (mensagem.toLowerCase().includes('saldo')) {
    return 'Para consultar seu saldo, você pode acessar o aplicativo ou ligar para nossa central de atendimento.';
  } else if (mensagem.toLowerCase().includes('transferência') || mensagem.toLowerCase().includes('transferir')) {
    return 'Para fazer uma transferência, você precisa do número da conta e agência do destinatário.';
  } else if (mensagem.toLowerCase().includes('cartão')) {
    return 'Sobre seu cartão, posso ajudar com bloqueio, desbloqueio ou segunda via.';
  }

  return respostas[Math.floor(Math.random() * respostas.length)];
}

/**
 * Registrar atendimento no histórico
 */
function registrarAtendimento(mensagemUsuario, respostaAgente) {
  const atendimento = {
    protocolo: gerarProtocolo(),
    dataHora: new Date().toISOString(),
    cliente: 'Cliente Anônimo',
    status: 'resolvido',
    duracao: '00:00:30',
    conversa: [
      { tipo: 'usuario', texto: mensagemUsuario, hora: new Date().toLocaleTimeString() },
      { tipo: 'agente', texto: respostaAgente.resposta || respostaAgente, hora: new Date().toLocaleTimeString() }
    ],
    acoes: ['Resposta automática', 'Análise de intenção']
  };

  estadoGlobal.historicoAtendimentos.unshift(atendimento);

  // Limitar histórico a 100 atendimentos
  if (estadoGlobal.historicoAtendimentos.length > 100) {
    estadoGlobal.historicoAtendimentos = estadoGlobal.historicoAtendimentos.slice(0, 100);
  }

  // Salvar no localStorage
  localStorage.setItem('historico_atendimentos', JSON.stringify(estadoGlobal.historicoAtendimentos));
}

/**
 * Gerar protocolo único
 */
function gerarProtocolo() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ATD-${timestamp}-${random}`;
}

/**
 * Transferir atendimento
 */
function transferirAtendimento() {
  adicionarMensagemSistema('👤 Transferindo para atendente humano...');
  setTimeout(() => {
    adicionarMensagemSistema('✅ Transferência realizada. Atendente João Silva irá atendê-lo agora.');
    // Registrar transferência
    if (estadoGlobal.atendimentoAtual) {
      estadoGlobal.atendimentoAtual.status = 'transferido';
      estadoGlobal.atendimentoAtual.acoes.push('Transferido para humano');
    }
  }, 2000);
}

/**
 * Encerrar atendimento
 */
function encerrarAtendimento() {
  adicionarMensagemSistema('📞 Encerrando atendimento...');
  setTimeout(() => {
    adicionarMensagemSistema('✅ Atendimento encerrado. Obrigado pelo contato!');
    // Resetar estado
    estadoGlobal.atendimentoAtual = null;
  }, 1000);
}

// ==========================================
// HISTÓRICO DE ATENDIMENTOS
// ==========================================

/**
 * Carregar histórico de atendimentos
 */
function carregarHistoricoAtendimentos() {
  const historicoSalvo = localStorage.getItem('historico_atendimentos');
  if (historicoSalvo) {
    estadoGlobal.historicoAtendimentos = JSON.parse(historicoSalvo);
  }

  exibirHistoricoAtendimentos();
}

/**
 * Exibir histórico de atendimentos
 */
function exibirHistoricoAtendimentos(filtros = {}) {
  const container = document.getElementById('historico-atendimentos');
  const atendimentos = estadoGlobal.historicoAtendimentos;

  if (atendimentos.length === 0) {
    container.innerHTML = '<div class="empty-history">Nenhum atendimento registrado ainda.</div>';
    return;
  }

  // Aplicar filtros
  let atendimentosFiltrados = atendimentos.filter(atendimento => {
    if (filtros.status && atendimento.status !== filtros.status) return false;
    if (filtros.dataInicio) {
      const dataAtendimento = new Date(atendimento.dataHora);
      const dataFiltro = new Date(filtros.dataInicio);
      if (dataAtendimento < dataFiltro) return false;
    }
    if (filtros.dataFim) {
      const dataAtendimento = new Date(atendimento.dataHora);
      const dataFiltro = new Date(filtros.dataFim);
      dataFiltro.setHours(23, 59, 59);
      if (dataAtendimento > dataFiltro) return false;
    }
    return true;
  });

  // Renderizar
  container.innerHTML = atendimentosFiltrados.map(atendimento => `
    <div class="attendance-item" onclick="verDetalhesAtendimento('${atendimento.protocolo}')">
      <div class="attendance-header">
        <h4>Protocolo: ${atendimento.protocolo}</h4>
        <span class="status-badge status-${atendimento.status}">${atendimento.status}</span>
      </div>
      <div class="attendance-info">
        <p><strong>Data:</strong> ${new Date(atendimento.dataHora).toLocaleString()}</p>
        <p><strong>Cliente:</strong> ${atendimento.cliente}</p>
        <p><strong>Duração:</strong> ${atendimento.duracao}</p>
      </div>
      <div class="attendance-preview">
        <p><strong>Última mensagem:</strong> ${atendimento.conversa[atendimento.conversa.length - 1]?.texto.substring(0, 100)}...</p>
      </div>
    </div>
  `).join('');
}

/**
 * Filtrar histórico
 */
function filtrarHistorico() {
  const filtros = {
    dataInicio: document.getElementById('filtro-data-inicio').value,
    dataFim: document.getElementById('filtro-data-fim').value,
    status: document.getElementById('filtro-status').value
  };

  exibirHistoricoAtendimentos(filtros);
}

/**
 * Limpar filtros
 */
function limparFiltros() {
  document.getElementById('filtro-data-inicio').value = '';
  document.getElementById('filtro-data-fim').value = '';
  document.getElementById('filtro-status').value = '';
  exibirHistoricoAtendimentos();
}

/**
 * Ver detalhes do atendimento
 */
function verDetalhesAtendimento(protocolo) {
  const atendimento = estadoGlobal.historicoAtendimentos.find(a => a.protocolo === protocolo);
  if (!atendimento) return;

  // Preencher detalhes
  document.getElementById('detail-protocolo').textContent = atendimento.protocolo;
  document.getElementById('detail-datahora').textContent = new Date(atendimento.dataHora).toLocaleString();
  document.getElementById('detail-cliente').textContent = atendimento.cliente;
  document.getElementById('detail-status').textContent = atendimento.status;
  document.getElementById('detail-duracao').textContent = atendimento.duracao;

  // Transcrição da conversa
  const transcricao = atendimento.conversa.map(msg => {
    const tipo = msg.tipo === 'usuario' ? '👤 Cliente' : '🤖 Agente';
    return `[${msg.hora}] ${tipo}: ${msg.texto}`;
  }).join('\n');

  document.getElementById('detail-conversa').textContent = transcricao;

  // Ações realizadas
  document.getElementById('detail-acoes').innerHTML = atendimento.acoes.map(acao =>
    `<div class="action-item">• ${acao}</div>`
  ).join('');

  // Mostrar modal
  document.getElementById('detalhes-atendimento').style.display = 'block';
}

/**
 * Fechar detalhes
 */
function fecharDetalhes() {
  document.getElementById('detalhes-atendimento').style.display = 'none';
}

/**
 * Exportar histórico
 */
function exportarHistorico() {
  const dados = JSON.stringify(estadoGlobal.historicoAtendimentos, null, 2);
  const blob = new Blob([dados], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `historico-atendimentos-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  mostrarNotificacao('Histórico exportado com sucesso!', 'success');
}

// ==========================================
// SISTEMA DE VOZ
// ==========================================

/**
 * Falar texto usando síntese de voz
 */
function falarTexto(texto) {
  if (!('speechSynthesis' in window)) {
    console.warn('Síntese de voz não suportada neste navegador');
    return;
  }

  // Cancelar fala anterior se estiver em andamento
  speechSynthesis.cancel();

  const configVoz = JSON.parse(localStorage.getItem('config_voz') || '{}');
  const configGeral = JSON.parse(localStorage.getItem('config_geral') || '{}');

  const utterance = new SpeechSynthesisUtterance(texto);

  // Configurar voz
  if (configVoz.voz_selecionada) {
    const vozes = speechSynthesis.getVoices();
    const vozSelecionada = vozes.find(voz => voz.name === configVoz.voz_selecionada);
    if (vozSelecionada) {
      utterance.voice = vozSelecionada;
    }
  }

  // Configurar idioma
  utterance.lang = configGeral.idioma || 'pt-BR';

  // Configurar velocidade e tom
  utterance.rate = configVoz.velocidade || 1.0;
  utterance.pitch = configVoz.tom || 1.0;
  utterance.volume = configVoz.volume || 0.8;

  // Eventos
  utterance.onstart = () => {
    document.getElementById('voz-status').textContent = '🔊 Falando...';
  };

  utterance.onend = () => {
    document.getElementById('voz-status').textContent = '🔇 Pronto';
  };

  utterance.onerror = (event) => {
    console.error('Erro na síntese de voz:', event.error);
    document.getElementById('voz-status').textContent = '❌ Erro na voz';
  };
  // Reproduzir fala
  speechSynthesis.speak(utterance);
}

/**
 * Parar fala atual
 */
function pararFala() {
  speechSynthesis.cancel();
  document.getElementById('voz-status').textContent = '🔇 Pronto';
}

/**
 * Carregar vozes disponíveis
 */
function carregarVozesDisponiveis() {
  if (!('speechSynthesis' in window)) return;

  const selectVoz = document.getElementById('voz-selecionada');
  const configVoz = JSON.parse(localStorage.getItem('config_voz') || '{}');

  // Função para popular select
  const popularVozes = () => {
    const vozes = speechSynthesis.getVoices();
    selectVoz.innerHTML = '<option value="">Voz padrão do sistema</option>';

    vozes.forEach(voz => {
      const option = document.createElement('option');
      option.value = voz.name;
      option.textContent = `${voz.name} (${voz.lang})`;
      if (voz.name === configVoz.voz_selecionada) {
        option.selected = true;
      }
      selectVoz.appendChild(option);
    });
  };

  // Carregar vozes imediatamente se disponíveis
  if (speechSynthesis.getVoices().length > 0) {
    popularVozes();
  }

  // Recarregar quando vozes estiverem prontas
  speechSynthesis.onvoiceschanged = popularVozes;
}

// ==========================================
// UTILITÁRIOS GERAIS
// ==========================================

/**
 * Mostrar notificação
 */
function mostrarNotificacao(mensagem, tipo = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${tipo}`;
  notification.textContent = mensagem;

  document.body.appendChild(notification);

  // Auto-remover após 3 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

/**
 * Formatar data para exibição
 */
function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR');
}

/**
 * Copiar texto para clipboard
 */
function copiarParaClipboard(texto) {
  navigator.clipboard.writeText(texto).then(() => {
    mostrarNotificacao('Copiado para a área de transferência!', 'success');
  }).catch(err => {
    console.error('Erro ao copiar:', err);
    mostrarNotificacao('Erro ao copiar texto', 'error');
  });
}

/**
 * Resetar configurações
 */
function resetarConfiguracoes() {
  if (!confirm('Tem certeza que deseja resetar todas as configurações? Esta ação não pode ser desfeita.')) {
    return;
  }

  // Limpar localStorage
  localStorage.removeItem('config_geral');
  localStorage.removeItem('config_voz');
  localStorage.removeItem('config_scripts');
  localStorage.removeItem('config_integracoes');

  // Recarregar configurações padrão
  carregarConfiguracoes();

  mostrarNotificacao('Configurações resetadas com sucesso!', 'success');
}

/**
 * Exportar configurações
 */
function exportarConfiguracoes() {
  const configuracoes = {
    geral: JSON.parse(localStorage.getItem('config_geral') || '{}'),
    voz: JSON.parse(localStorage.getItem('config_voz') || '{}'),
    scripts: JSON.parse(localStorage.getItem('config_scripts') || '{}'),
    integracoes: JSON.parse(localStorage.getItem('config_integracoes') || '{}'),
    exportado_em: new Date().toISOString()
  };

  const dados = JSON.stringify(configuracoes, null, 2);
  const blob = new Blob([dados], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `configuracoes-agente-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  mostrarNotificacao('Configurações exportadas!', 'success');
}

/**
 * Importar configurações
 */
function importarConfiguracoes(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const configuracoes = JSON.parse(e.target.result);

      if (configuracoes.geral) localStorage.setItem('config_geral', JSON.stringify(configuracoes.geral));
      if (configuracoes.voz) localStorage.setItem('config_voz', JSON.stringify(configuracoes.voz));
      if (configuracoes.scripts) localStorage.setItem('config_scripts', JSON.stringify(configuracoes.scripts));
      if (configuracoes.integracoes) localStorage.setItem('config_integracoes', JSON.stringify(configuracoes.integracoes));

      // Recarregar configurações
      carregarConfiguracoes();
      atualizarModeloAgente();

      mostrarNotificacao('Configurações importadas com sucesso!', 'success');
    } catch (error) {
      mostrarNotificacao('Erro ao importar configurações. Verifique o arquivo.', 'error');
    }
  };
  reader.readAsText(file);
}

// ==========================================
// INICIALIZAÇÃO DO SISTEMA
// ==========================================

/**
 * Inicializar aplicação
 */
function inicializarAplicacao() {
  // Carregar configurações
  carregarConfiguracoes();

  // Carregar histórico
  carregarHistoricoAtendimentos();

  // Carregar vozes
  carregarVozesDisponiveis();

  // Atualizar status do sistema
  carregarStatusSistema();

  // Atualizar preview do modelo
  atualizarModeloAgente();

  // Configurar event listeners
  configurarEventListeners();

  // Mostrar aba inicial
  mostrarAba('configuracao');

  console.log('Sistema Atende AI inicializado com sucesso!');
}

/**
 * Configurar event listeners
 */
function configurarEventListeners() {
  // Botões de navegação
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const aba = btn.dataset.tab;
      mostrarAba(aba);
    });
  });

  // Botões de configuração
  document.getElementById('btn-salvar-config').addEventListener('click', salvarConfiguracaoGeral);
  document.getElementById('btn-salvar-voz').addEventListener('click', salvarConfiguracaoVoz);
  document.getElementById('btn-salvar-scripts').addEventListener('click', salvarConfiguracaoScripts);
  document.getElementById('btn-salvar-integracoes').addEventListener('click', salvarConfiguracaoIntegracoes);

  // Botões de teste
  document.getElementById('btn-testar-voz').addEventListener('click', testarVoz);
  document.getElementById('btn-parar-voz').addEventListener('click', pararFala);

  // Botões de atendimento
  document.getElementById('btn-iniciar-atendimento').addEventListener('click', iniciarAtendimento);
  document.getElementById('btn-parar-atendimento').addEventListener('click', pararAtendimento);
  document.getElementById('btn-send-manual').addEventListener('click', enviarMensagemManual);
  document.getElementById('btn-transferir').addEventListener('click', transferirAtendimento);
  document.getElementById('btn-encerrar').addEventListener('click', encerrarAtendimento);

  // Enter no campo de mensagem manual
  document.getElementById('manual-message').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      enviarMensagemManual();
    }
  });

  // Botões de histórico
  document.getElementById('btn-filtrar').addEventListener('click', filtrarHistorico);
  document.getElementById('btn-limpar-filtros').addEventListener('click', limparFiltros);
  document.getElementById('btn-exportar-historico').addEventListener('click', exportarHistorico);
  document.getElementById('btn-fechar-detalhes').addEventListener('click', fecharDetalhes);

  // Botões de utilitários
  document.getElementById('btn-resetar-config').addEventListener('click', resetarConfiguracoes);
  document.getElementById('btn-exportar-config').addEventListener('click', exportarConfiguracoes);
  document.getElementById('input-importar-config').addEventListener('change', importarConfiguracoes);

  // Atualização automática do preview
  document.querySelectorAll('#config-geral input, #config-geral select').forEach(element => {
    element.addEventListener('change', atualizarModeloAgente);
  });
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarAplicacao);
