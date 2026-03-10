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
const API_BASE = "http://localhost:3000/api";

// Estado global
const estadoGlobal = {
	clientesCarregados: [],
	chamadasCarregadas: [],
	abas: {
		ativa: "dashboard",
	},
	ultimaResposta: null,
	atendimentoAtivo: false,
	tempoOnline: 0,
	intervaloTempo: null,
	atendimentoAtual: null,
	historicoAtendimentos: [],
};

// ==========================================
// NAVEGAÇÃO ENTRE ABAS
// ==========================================

/**
 * Mostrar aba específica
 */
function mostrarAba(nomeAba) {
	// Remover classe 'active' de todos os tabs
	const todosOsTabs = document.querySelectorAll(".tab-content");
	todosOsTabs.forEach((tab) => {
		tab.classList.remove("active");
	});

	// Remover classe 'active' de todos os botões (top+sidebar)
	const todosBotoes = document.querySelectorAll(".nav-btn, .sidebar-btn");
	todosBotoes.forEach((btn) => {
		btn.classList.remove("active");
	});

	// Adicionar classe 'active' ao tab selecionado
	const tabSelecionado = document.getElementById(`tab-${nomeAba}`);
	if (tabSelecionado) {
		tabSelecionado.classList.add("active");
	}

	// Adicionar classe 'active' ao botão clicado (procura em ambos data attributes)
	const btnSelecionado = document.querySelector(
		`[data-tab="${nomeAba}"], [data-section="${nomeAba}"]`,
	);
	if (btnSelecionado) {
		btnSelecionado.classList.add("active");
	}

	// Atualizar estado
	estadoGlobal.abas.ativa = nomeAba;

	// Carregar dados específicos da aba
	if (nomeAba === "teste") {
		carregarStatusSistema();
		atualizarModeloAgente();
	} else if (nomeAba === "historico") {
		carregarHistoricoAtendimentos();
	} else if (nomeAba === "clientes") {
		carregarClientes();
	} else if (nomeAba === "chamadas") {
		carregarChamadas();
	}

	console.log(`📄 Navegando para aba: ${nomeAba}`);
}

// ==========================================
// INICIALIZAR DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
	console.log("📱 Dashboard carregado");

	// Configurar listeners dos botões de navegação (top)
	document.querySelectorAll(".nav-btn").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			e.preventDefault();
			const nomeAba = btn.getAttribute("data-tab");
			mostrarAba(nomeAba);
		});
	});

	// Configurar listeners dos botões na sidebar
	document.querySelectorAll(".sidebar-btn").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			e.preventDefault();
			const nomeAba = btn.getAttribute("data-section");
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
		if (estadoGlobal.abas.ativa === "clientes") {
			carregarEstatisticas();
			carregarClientes();
		}
	}, 30000);
});

/**
 * Configurar event listeners (Legado - removido para evitar conflitos)
 */
function _configurarEventListeners_legacy() {
	// Removido
}

// ==========================================
// FUNÇÕES DE NAVEGAÇÃO
// ==========================================

/**
 * Trocar entre abas
 * @param {string} nomeAba - Nome da aba (clientes, chamadas, teste-ia)
 */
function _switchTab(nomeAba) {
	// Esconder todas as abas
	document.querySelectorAll(".tab-content").forEach((tab) => {
		tab.classList.remove("active");
	});

	// Remover classe active dos botões
	document.querySelectorAll(".tab-btn").forEach((btn) => {
		btn.classList.remove("active");
	});

	// Mostrar aba selecionada
	const tabElement = document.getElementById(`tab-${nomeAba}`);
	if (tabElement) {
		tabElement.classList.add("active");
	}

	// Marcar botão como active
	event.target.classList.add("active");

	// Atualizar estado
	estadoGlobal.abas.ativa = nomeAba;

	// Carregar dados específicos da aba
	if (nomeAba === "dashboard") {
		carregarStatusSistema();
	} else if (nomeAba === "teste") {
		atualizarModeloAgente();
	} else if (nomeAba === "historico") {
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
			document.getElementById("stat-clientes").textContent =
				stats.total_clientes || 0;
			document.getElementById("stat-chamadas").textContent =
				stats.total_chamadas || 0;
			document.getElementById("stat-resolvidas").textContent =
				stats.chamadas_resolvidas || 0;
			document.getElementById("stat-taxa").textContent =
				stats.taxa_resolucao || "0%";

			console.log("✅ Estatísticas carregadas");
		}
	} catch (erro) {
		console.error("❌ Erro ao carregar estatísticas:", erro);
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
		const resposta = await fetch(
			`${API_BASE}/clientes?page=${pagina}&perPage=20`,
		);
		const dados = await resposta.json();

		if (dados.sucesso) {
			estadoGlobal.clientesCarregados = dados.dados;
			renderizarTabelaClientes(dados.dados);
			console.log("✅ Clientes carregados");
		}
	} catch (erro) {
		console.error("❌ Erro ao carregar clientes:", erro);
		mostrarErro("Erro ao carregar clientes");
	}
}

/**
 * Renderizar tabela de clientes
 * @param {Array} clientes - Lista de clientes
 */
function renderizarTabelaClientes(clientes) {
	const tbody = document.getElementById("tbody-clientes");

	if (clientes.length === 0) {
		tbody.innerHTML =
			'<tr><td colspan="6" class="text-center">Nenhum cliente encontrado</td></tr>';
		return;
	}

	tbody.innerHTML = clientes
		.map(
			(cliente) => `
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
  `,
		)
		.join("");
}

/**
 * Abrir formulário para criar cliente
 */
function openFormCriarCliente() {
	const form = document.getElementById("form-cliente");
	form.style.display = form.style.display === "none" ? "block" : "none";

	// Se abrir, focar no primeiro campo
	if (form.style.display === "block") {
		document.getElementById("nome").focus();
	}
}

/**
 * Fechar formulário
 */
function closeFormCliente() {
	document.getElementById("form-cliente").style.display = "none";
	document.getElementById("formNovoCliente").reset();
}

/**
 * Submeter novo cliente
 */
document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("formNovoCliente");
	if (form) {
		form.addEventListener("submit", async (e) => {
			e.preventDefault();

			const novoCliente = {
				nome: document.getElementById("nome").value,
				telefone: document.getElementById("telefone").value,
				email: document.getElementById("email").value,
				cpf_cnpj: document.getElementById("cpf_cnpj").value || null,
				endereco: document.getElementById("endereco").value || null,
				dados_importantes:
					document.getElementById("dados_importantes").value || null,
			};

			try {
				const resposta = await fetch(`${API_BASE}/clientes`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(novoCliente),
				});

				const dados = await resposta.json();

				if (dados.sucesso) {
					mostrarSucesso(`Cliente ${novoCliente.nome} criado com sucesso!`);
					closeFormCliente();
					carregarClientes();
				} else {
					mostrarErro(dados.erro || "Erro ao criar cliente");
				}
			} catch (erro) {
				console.error("Erro:", erro);
				mostrarErro("Erro ao criar cliente");
			}
		});
	}
});

/**
 * Deletar cliente
 * @param {number} clienteId - ID do cliente
 */
async function _deletarCliente(clienteId) {
	if (
		!confirm(
			"Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.",
		)
	) {
		return;
	}

	try {
		const resposta = await fetch(`${API_BASE}/clientes/${clienteId}`, {
			method: "DELETE",
		});

		const dados = await resposta.json();

		if (dados.sucesso) {
			mostrarSucesso("Cliente excluído com sucesso!");
			carregarClientes();
		} else {
			mostrarErro(dados.erro || "Erro ao excluir cliente");
		}
	} catch (erro) {
		console.error("Erro:", erro);
		mostrarErro("Erro ao excluir cliente");
	}
}

/**
 * Ver detalhes do cliente
 * @param {number} clienteId - ID do cliente
 */
async function _verDetalhesCliente(clienteId) {
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
          <p><strong>CPF/CNPJ:</strong> ${cliente.cpf_cnpj || "N/A"}</p>
          <p><strong>Endereço:</strong> ${cliente.endereco || "N/A"}</p>
          <p><strong>Status:</strong> <span class="badge badge-${cliente.status}">${cliente.status}</span></p>
          <p><strong>Cadastrado em:</strong> ${new Date(cliente.data_cadastro).toLocaleDateString("pt-BR")}</p>
          <p><strong>Última interação:</strong> ${cliente.ultima_interacao ? new Date(cliente.ultima_interacao).toLocaleDateString("pt-BR") : "Nenhuma"}</p>
          <p><strong>Dados importantes:</strong> ${cliente.dados_importantes || "N/A"}</p>
          
          <h3>Histórico de Chamadas (últimas 5)</h3>
          <ul>
            ${chamadas
							.slice(0, 5)
							.map(
								(chamada) => `
              <li>
                <strong>${new Date(chamada.data_hora).toLocaleDateString("pt-BR")}:</strong>
                ${chamada.motivo_chamada} - 
                <span class="badge badge-${chamada.foi_resolvido ? "success" : "warning"}">
                  ${chamada.foi_resolvido ? "Resolvido" : "Não resolvido"}
                </span>
              </li>
            `,
							)
							.join("")}
            ${chamadas.length === 0 ? "<li>Nenhuma chamada registrada</li>" : ""}
          </ul>
        </div>
      `;

			abrirModal(conteudoModal);
		}
	} catch (erro) {
		console.error("Erro:", erro);
		mostrarErro("Erro ao carregar detalhes");
	}
}

/**
 * Editar cliente (abrir formulário com dados)
 * @param {number} clienteId - ID do cliente
 */
function _editarCliente(clienteId) {
	const cliente = estadoGlobal.clientesCarregados.find(
		(c) => c.id === clienteId,
	);

	if (cliente) {
		document.getElementById("nome").value = cliente.nome;
		document.getElementById("telefone").value = cliente.telefone;
		document.getElementById("email").value = cliente.email;
		document.getElementById("cpf_cnpj").value = cliente.cpf_cnpj || "";
		document.getElementById("endereco").value = cliente.endereco || "";
		document.getElementById("dados_importantes").value =
			cliente.dados_importantes || "";

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
		console.log("📞 Chamadas carregadas");
	} catch (erro) {
		console.error("Erro ao carregar chamadas:", erro);
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
			const select = document.getElementById("select-cliente-teste");
			select.innerHTML = '<option value="">Cliente anônimo</option>';

			dados.dados.forEach((cliente) => {
				const option = document.createElement("option");
				option.value = cliente.id;
				option.textContent = `${cliente.nome} (${cliente.telefone})`;
				select.appendChild(option);
			});
		}
	} catch (erro) {
		console.error("Erro ao carregar clientes para teste:", erro);
	}
}

/**
 * Testar processamento da IA
 */
/**
 * Testar processamento da IA
 */
async function _testarIA() {
	// Detectar contexto (se é a aba 'IA' ou 'Teste')
	const isTabIA = document
		.getElementById("tab-teste-ia")
		.classList.contains("active");
	const suffix = isTabIA ? "-ia" : "";

	const clienteId = document.getElementById(
		`select-cliente-teste${suffix}`,
	).value;
	let mensagem = document.getElementById(`input-mensagem${suffix}`).value;

	if (!mensagem) {
		// Tentar o outro campo caso o primeiro esteja vazio (fallback)
		const outroSuffix = isTabIA ? "" : "-ia";
		mensagem = document.getElementById(`input-mensagem${outroSuffix}`).value;

		if (!mensagem) {
			mostrarErro("Por favor, digite uma mensagem");
			return;
		}
	}

	try {
		// Mostrar loading
		const resultadoBox = document.getElementById(`resultado-ia${suffix}`);
		resultadoBox.innerHTML = '<p class="loading">⏳ Processando...</p>';

		const resposta = await fetch(`${API_BASE}/ia/processar`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				mensagem,
				cliente_id: clienteId || null,
			}),
		});

		const dados = await resposta.json();

		if (dados.sucesso) {
			const resultado = dados.resposta;

			// Exibir resposta no local correto
			resultadoBox.innerHTML = `
        <div class="resultado-completo">
          <h4>Resposta da IA:</h4>
          <p>${resultado.resposta}</p>
          
          <div class="metadados">
            <p><strong>Intenção:</strong> ${resultado.intencao}</p>
            <p><strong>Confiança:</strong> ${(resultado.confianca * 100).toFixed(0)}%</p>
            <p><strong>Deve transferir:</strong> ${resultado.deve_transferir ? "✅ Sim" : "❌ Não"}</p>
            <p><strong>Solução aplicada:</strong> ${resultado.solucao_aplicada ? "✅ Sim" : "❌ Não"}</p>
          </div>
        </div>
      `;

			// Exibir análise de intenção (se o elemento existir)
			const analiseBox = document.getElementById("analise-intencao");
			if (analiseBox) {
				await carregarAnaliseIntencao(mensagem);
			}

			// Armazenar última resposta e habilitar botão de áudio
			estadoGlobal.ultimaResposta = resultado.resposta;
			const btnOuvir = document.getElementById(`btn-ouvir-resposta${suffix}`);
			if (btnOuvir) btnOuvir.disabled = false;

			// Adicionar ao histórico se a função existir
			if (typeof adicionarAoHistorico === "function") {
				adicionarAoHistorico(mensagem, resultado);
			}
		} else {
			mostrarErro(dados.erro || "Erro ao processar");
		}
	} catch (erro) {
		console.error("Erro:", erro);
		document.getElementById(`resultado-ia${suffix}`).innerHTML =
			`<p class="erro">❌ Erro: ${erro.message}</p>`;
	}
}

/**
 * Carregar análise de intenção
 * @param {string} mensagem - Mensagem para analisar
 */
async function carregarAnaliseIntencao(mensagem) {
	try {
		const resposta = await fetch(`${API_BASE}/ia/analise-intencao`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ mensagem }),
		});

		const dados = await resposta.json();

		if (dados.sucesso) {
			const analise = dados.analise;
			const analiseBox = document.getElementById("analise-intencao");

			analiseBox.innerHTML = `
        <div class="analise-detalhes">
          <p><strong>Categoria:</strong> ${analise.categoria}</p>
          <p><strong>Intenção:</strong> ${analise.intenção}</p>
          <p><strong>Urgência:</strong> ${analise.urgencia}/10</p>
          <p><strong>Palavras-chave:</strong> ${analise.palavras_chave.join(", ")}</p>
        </div>
      `;
		}
	} catch (erro) {
		console.error("Erro ao carregar análise:", erro);
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
	const modal = document.getElementById("modal-detalhes");
	const modalBody = document.getElementById("modal-body");

	modalBody.innerHTML = conteudo;
	modal.style.display = "block";
}

/**
 * Fechar modal
 */
function _closeModal() {
	document.getElementById("modal-detalhes").style.display = "none";
}

// Fechar modal ao clicar fora
window.onclick = (event) => {
	const modal = document.getElementById("modal-detalhes");
	if (event.target === modal) {
		modal.style.display = "none";
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
	const notif = document.createElement("div");
	notif.className = "notificacao sucesso";
	notif.textContent = `✅ ${mensagem}`;

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
	const notif = document.createElement("div");
	notif.className = "notificacao erro";
	notif.textContent = `❌ ${mensagem}`;

	document.body.appendChild(notif);

	setTimeout(() => {
		notif.remove();
	}, 3000);
}

/**
 * Fazer logout
 */
async function _logout() {
	if (await customConfirm("Tem certeza que deseja sair?")) {
		// Encerrar sessão (simulado)
		localStorage.clear();
		// Redirecionar para início
		window.location.href = "/";
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

	// Se voltar para 'agentes', esconde as sub-abas de configuração
	if (nomeSubAba === "agentes") {
		const tabConfig = document.getElementById("tab-configuracao");
		if (tabConfig) tabConfig.classList.remove("agente-selecionado");
	}

	// Esconder todas as sub-abas
	document.querySelectorAll(".config-content").forEach((content) => {
		content.classList.remove("active");
	});

	// Remover classe active dos botões
	document.querySelectorAll(".config-tab-btn").forEach((btn) => {
		btn.classList.remove("active");
	});

	// Mostrar sub-aba selecionada
	const subTabElement = document.getElementById(`config-${nomeSubAba}`);
	console.log(`Buscando elemento: #config-${nomeSubAba}`, subTabElement);

	if (subTabElement) {
		subTabElement.classList.add("active");
		console.log(`Aba ${nomeSubAba} ativada com sucesso`);
	} else {
		console.warn(`Elemento config-${nomeSubAba} não encontrado`);
	}

	// Marcar botão como active
	if (btnElement?.classList) {
		btnElement.classList.add("active");
	}

	// Carregar regras quando abrir a aba Geral
	if (nomeSubAba === "geral") {
		carregarRegrasBrain();
	}
}

/**
 * Salvar configurações gerais
 */
async function salvarConfigGeral() {
	const agenteId = document.getElementById("agente-seletor-playground")?.value;
	const nome = document.getElementById("nome-agente").value;
	const tom = document.getElementById("tom-voz").value;
	const _idioma = document.getElementById("idioma-agente").value;
	const instrucao = document.getElementById(
		"instrucao-comportamental-config",
	).value;

	if (!agenteId) {
		mostrarNotificacao(
			"Selecione um agente primeiro no Comando da IA.",
			"error",
		);
		return;
	}

	try {
		const res = await fetch(`${API_BASE}/admin/agentes/${agenteId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				nome,
				tom_voz: tom,
				instrucao_comportamental: instrucao,
			}),
		});
		const data = await res.json();
		if (data.sucesso) {
			mostrarNotificacao(
				"Configurações e comportamento salvos com sucesso!",
				"success",
			);

			// Interligar com a caixa do Modal (caso seja o mesmo agente)
			const modalId = document.getElementById("agente-id-edit").value;
			if (modalId === agenteId) {
				document.getElementById("agente-instrucao").value = instrucao;
				document.getElementById("agente-nome").value = nome;
			}

			// Atualizar listas globais
			carregarAgentes();
			carregarSeletorAgentes();

			// Atualizar card de comportamento no chat
			const textoComportamento = document.getElementById(
				"agente-comportamento-texto",
			);
			if (textoComportamento)
				textoComportamento.textContent =
					instrucao || "Nenhum comportamento definido.";
			const nomeDisplay = document.getElementById("agente-nome-display");
			if (nomeDisplay) nomeDisplay.textContent = nome;
			// Recarregar seletor
			carregarSeletorAgentes();
			carregarAgentes();
		} else {
			mostrarNotificacao(
				`Erro ao salvar: ${data.erro || "desconhecido"}`,
				"error",
			);
		}
	} catch (_err) {
		mostrarNotificacao("Erro de conexão ao salvar.", "error");
	}
}

/**
 * Salvar configurações de voz
 */
async function salvarConfigVoz() {
	const habilitar = document.getElementById("habilitar-voz").checked;
	const velocidade = document.getElementById("velocidade-fala").value;
	const tom = document.getElementById("tom-voz-audio").value;
	const agenteId = document.getElementById("agente-seletor-playground")?.value;

	if (agenteId) {
		try {
			await fetch(`${API_BASE}/admin/agentes/${agenteId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					voz_id: tom,
					velocidade: parseFloat(velocidade),
				}),
			});

			// Atualizar modal de edição se for o mesmo agente
			const modalId = document.getElementById("agente-id-edit").value;
			if (modalId === agenteId) {
				document.getElementById("agente-voz").value = tom;
				document.getElementById("agente-velocidade").value = velocidade;
			}

			carregarAgentes();
		} catch (err) {
			console.error("Erro ao salvar voz no banco:", err);
		}
	}

	const config = {
		voz_habilitada: habilitar,
		velocidade_fala: velocidade,
		tom_voz_audio: tom,
	};

	localStorage.setItem("config_voz", JSON.stringify(config));
	mostrarNotificacao("Configurações de voz salvas e sincronizadas!", "success");
}

/**
 * Salvar scripts de conversa
 */
async function salvarConfigScripts() {
	const habilitar = document.getElementById("habilitar-saudacao").checked;
	const saudacao = document.getElementById("script-saudacao").value;
	const encerramento = document.getElementById("script-encerramento").value;
	const transferencia = document.getElementById("script-transferencia").value;
	const agenteId = document.getElementById("agente-seletor-playground")?.value;

	if (agenteId) {
		try {
			await fetch(`${API_BASE}/admin/agentes/${agenteId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					script_saudacao: saudacao,
					script_pulpito: encerramento,
					script_encerramento: encerramento,
					script_transferencia: transferencia,
				}),
			});

			// Atualizar modal de edição se for o mesmo agente
			const modalId = document.getElementById("agente-id-edit").value;
			if (modalId === agenteId) {
				document.getElementById("agente-saudacao").value = saudacao;
			}
		} catch (err) {
			console.error("Erro ao salvar scripts no banco:", err);
		}
	}

	const config = {
		saudacao_habilitada: habilitar,
		script_saudacao: saudacao,
		script_encerramento: encerramento,
		script_transferencia: transferencia,
	};

	localStorage.setItem("config_scripts", JSON.stringify(config));
	mostrarNotificacao("Scripts de conversa salvos e sincronizados!", "success");
}

/**
 * Testar voz
 */
function testarVoz() {
	const texto = document.getElementById("texto-teste-voz").value;
	if (!texto) {
		mostrarNotificacao("Digite um texto para testar", "error");
		return;
	}

	falarTexto(texto);
}

/**
 * Ouvir última resposta por voz
 */
function _ouvirUltimaResposta() {
	if (estadoGlobal.ultimaResposta) {
		falarTexto(estadoGlobal.ultimaResposta);
	} else {
		mostrarNotificacao("Nenhuma resposta para ouvir", "error");
	}
}

/**
 * Falar texto usando Web Speech API
 * @param {string} texto - Texto a ser falado
 */
function falarTexto_legacy(texto) {
	if (!("speechSynthesis" in window)) {
		mostrarNotificacao("Seu navegador não suporta síntese de voz", "error");
		return;
	}

	// Cancelar fala anterior se existir
	window.speechSynthesis.cancel();

	const utterance = new SpeechSynthesisUtterance(texto);

	// Configurar voz a partir dos inputs atuais
	const velocidade = document.getElementById("velocidade-fala").value;
	const tom = document.getElementById("tom-voz-audio").value;

	utterance.rate = parseFloat(velocidade) || 1;
	utterance.lang = "pt-BR";

	// Selecionar voz
	const voices = window.speechSynthesis.getVoices();
	let selectedVoice = null;

	if (tom === "female") {
		selectedVoice = voices.find(
			(voice) =>
				voice.lang.includes("pt") &&
				(voice.name.toLowerCase().includes("female") ||
					voice.name.toLowerCase().includes("maria") ||
					voice.name.toLowerCase().includes("ana") ||
					voice.name.toLowerCase().includes("female")),
		);
	} else if (tom === "male") {
		selectedVoice = voices.find(
			(voice) =>
				voice.lang.includes("pt") &&
				(voice.name.toLowerCase().includes("male") ||
					voice.name.toLowerCase().includes("joão") ||
					voice.name.toLowerCase().includes("carlos") ||
					voice.name.toLowerCase().includes("male")),
		);
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
	const configGeral = JSON.parse(localStorage.getItem("config_geral") || "{}");
	if (configGeral.nome_agente)
		document.getElementById("nome-agente").value = configGeral.nome_agente;
	if (configGeral.tom_voz)
		document.getElementById("tom-voz").value = configGeral.tom_voz;
	if (configGeral.idioma)
		document.getElementById("idioma-agente").value = configGeral.idioma;

	// Config voz
	const configVoz = JSON.parse(localStorage.getItem("config_voz") || "{}");
	document.getElementById("habilitar-voz").checked =
		configVoz.voz_habilitada !== false;
	document.getElementById("velocidade-fala").value =
		configVoz.velocidade_fala || 1;
	document.getElementById("velocidade-valor").textContent =
		`${configVoz.velocidade_fala || 1}x`;
	if (configVoz.tom_voz_audio)
		document.getElementById("tom-voz-audio").value = configVoz.tom_voz_audio;

	// Config scripts
	const configScripts = JSON.parse(
		localStorage.getItem("config_scripts") || "{}",
	);
	document.getElementById("habilitar-saudacao").checked =
		configScripts.saudacao_habilitada !== false;
	if (configScripts.script_saudacao)
		document.getElementById("script-saudacao").value =
			configScripts.script_saudacao;
	if (configScripts.script_encerramento)
		document.getElementById("script-encerramento").value =
			configScripts.script_encerramento;
	if (configScripts.script_transferencia)
		document.getElementById("script-transferencia").value =
			configScripts.script_transferencia;
}

/**
 * Mostrar notificação temporária
 */
function mostrarNotificacao_legacy(mensagem, tipo = "info") {
	const notification = document.createElement("div");
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

	if (tipo === "success")
		notification.style.background = "var(--success-color)";
	else if (tipo === "error")
		notification.style.background = "var(--danger-color)";
	else notification.style.background = "var(--primary-color)";

	document.body.appendChild(notification);

	setTimeout(() => {
		notification.style.animation = "slideOut 0.3s ease-in";
		setTimeout(() => document.body.removeChild(notification), 300);
	}, 3000);
}

/**
 * Carregar exemplo de mensagem
 */
function _carregarExemplo() {
	const isTabIA = document
		.getElementById("tab-teste-ia")
		.classList.contains("active");
	const suffix = isTabIA ? "-ia" : "";

	const select = document.getElementById(`exemplos-mensagem${suffix}`);
	const textarea = document.getElementById(`input-mensagem${suffix}`);
	if (select?.value) {
		textarea.value = select.value;
	}
}

/**
 * Iniciar gravação de voz
 */
/**
 * Iniciar gravação de voz
 */
function _iniciarGravacao() {
	const isTabIA = document
		.getElementById("tab-teste-ia")
		.classList.contains("active");
	const suffix = isTabIA ? "-ia" : "";

	const btn = document.getElementById(`btn-voice${suffix}`);
	const textarea = document.getElementById(`input-mensagem${suffix}`);

	if (
		!("webkitSpeechRecognition" in window) &&
		!("SpeechRecognition" in window)
	) {
		alert(
			"Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.",
		);
		return;
	}

	const SpeechRecognition =
		window.SpeechRecognition || window.webkitSpeechRecognition;
	const recognition = new SpeechRecognition();

	recognition.lang = "pt-BR";
	recognition.continuous = false;
	recognition.interimResults = false;

	recognition.onstart = () => {
		btn.textContent = "🎤 Gravando...";
		btn.classList.add("recording");
	};

	recognition.onresult = (event) => {
		const transcript = event.results[0][0].transcript;
		textarea.value = transcript;
	};

	recognition.onend = () => {
		btn.textContent = "🎤 Gravar Voz";
		btn.classList.remove("recording");
	};

	recognition.onerror = (event) => {
		console.error("Erro no reconhecimento:", event.error);
		btn.textContent = "🎤 Gravar Voz";
		btn.classList.remove("recording");
	};

	recognition.start();
}

/**
 * Adicionar teste ao histórico
 */
function adicionarAoHistorico(mensagem, resposta) {
	const historyDiv = document.getElementById("historico-testes");
	const item = document.createElement("div");
	item.className = "history-item";
	item.innerHTML = `
    <h4>${new Date().toLocaleString()}</h4>
    <p><strong>Pergunta:</strong> ${mensagem}</p>
    <p><strong>Resposta:</strong> ${resposta.resposta}</p>
    <p><strong>Intenção:</strong> ${resposta.intencao} (${(resposta.confianca * 100).toFixed(0)}%)</p>
  `;

	// Remover mensagem inicial se existir
	if (
		historyDiv.querySelector("p") &&
		historyDiv.querySelector("p").textContent ===
			"Nenhum teste realizado ainda."
	) {
		historyDiv.innerHTML = "";
	}

	historyDiv.insertBefore(item, historyDiv.firstChild);

	// Limitar a 10 itens
	const items = historyDiv.querySelectorAll(".history-item");
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
			document.getElementById("status-api").textContent = "✅ Conectado";
		} else {
			document.getElementById("status-api").textContent = "❌ Erro de conexão";
		}
	} catch (_error) {
		document.getElementById("status-api").textContent = "❌ Indisponível";
	}

	// Verificar sistema de voz
	if ("speechSynthesis" in window) {
		document.getElementById("status-voz").textContent = "✅ Disponível";
	} else {
		document.getElementById("status-voz").textContent = "❌ Não suportado";
	}

	// Status do agente
	document.getElementById("status-agente").textContent =
		"✅ Configurado e ativo";
}

/**
 * Atualizar preview do modelo do agente
 */
function atualizarModeloAgente() {
	const configGeral = JSON.parse(localStorage.getItem("config_geral") || "{}");
	const configVoz = JSON.parse(localStorage.getItem("config_voz") || "{}");
	const configScripts = JSON.parse(
		localStorage.getItem("config_scripts") || "{}",
	);

	// Atualizar informações básicas
	document.getElementById("model-nome").textContent =
		configGeral.nome_agente || "Assistente Virtual";
	document.getElementById("model-tom").textContent =
		`Tom: ${configGeral.tom_voz || "Profissional"}`;
	document.getElementById("model-idioma").textContent =
		`Idioma: ${getNomeIdioma(configGeral.idioma || "pt-BR")}`;
	document.getElementById("model-voz").textContent =
		`Voz: ${configVoz.voz_habilitada !== false ? "Habilitada" : "Desabilitada"}`;

	// Atualizar scripts
	document.getElementById("preview-saudacao").textContent =
		configScripts.script_saudacao
			? `${configScripts.script_saudacao.substring(0, 50)}...`
			: "Olá! Bem-vindo à Atende AI...";
	document.getElementById("preview-encerramento").textContent =
		configScripts.script_encerramento
			? `${configScripts.script_encerramento.substring(0, 50)}...`
			: "Obrigado por entrar em contato...";
}

/**
 * Obter nome do idioma
 */
function getNomeIdioma(codigo) {
	const idiomas = {
		"pt-BR": "Português (Brasil)",
		"pt-PT": "Português (Portugal)",
		"en-US": "Inglês",
		"es-ES": "Espanhol",
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
	document.getElementById("btn-iniciar-atendimento").disabled = true;
	document.getElementById("btn-parar-atendimento").disabled = false;
	document.getElementById("btn-send-manual").disabled = false;
	document.getElementById("manual-message").disabled = false;
	document.getElementById("btn-transferir").disabled = false;
	document.getElementById("btn-encerrar").disabled = false;

	// Atualizar indicadores
	document.getElementById("indicator-status").textContent = "🟢";
	document.getElementById("status-text").textContent = "Sistema Ativo";

	// Iniciar contador de tempo
	estadoGlobal.tempoOnline = 0;
	estadoGlobal.intervaloTempo = setInterval(() => {
		estadoGlobal.tempoOnline++;
		atualizarTempoOnline();
	}, 1000);

	// Adicionar mensagem de boas-vindas
	adicionarMensagemSistema(
		"🎉 Sistema de atendimento iniciado! Aguardando chamadas...",
	);

	mostrarNotificacao("Atendimento iniciado com sucesso!", "success");
}

/**
 * Parar atendimento
 */
function pararAtendimento() {
	if (!estadoGlobal.atendimentoAtivo) return;

	estadoGlobal.atendimentoAtivo = false;

	// Atualizar interface
	document.getElementById("btn-iniciar-atendimento").disabled = false;
	document.getElementById("btn-parar-atendimento").disabled = true;
	document.getElementById("btn-send-manual").disabled = true;
	document.getElementById("manual-message").disabled = true;
	document.getElementById("btn-transferir").disabled = true;
	document.getElementById("btn-encerrar").disabled = true;

	// Atualizar indicadores
	document.getElementById("indicator-status").textContent = "🔴";
	document.getElementById("status-text").textContent = "Sistema Parado";

	// Parar contador
	if (estadoGlobal.intervaloTempo) {
		clearInterval(estadoGlobal.intervaloTempo);
		estadoGlobal.intervaloTempo = null;
	}

	// Adicionar mensagem de encerramento
	adicionarMensagemSistema("🛑 Sistema de atendimento parado.");

	mostrarNotificacao("Atendimento parado.", "info");
}

/**
 * Atualizar tempo online
 */
function atualizarTempoOnline() {
	const horas = Math.floor(estadoGlobal.tempoOnline / 3600);
	const minutos = Math.floor((estadoGlobal.tempoOnline % 3600) / 60);
	const segundos = estadoGlobal.tempoOnline % 60;

	const tempoFormatado = `${horas.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`;
	document.getElementById("tempo-online").textContent = tempoFormatado;
}

/**
 * Adicionar mensagem na conversa
 */
function adicionarMensagemSistema(texto) {
	const messagesArea = document.getElementById("conversation-messages");
	const messageDiv = document.createElement("div");
	messageDiv.className = "system-message";
	messageDiv.innerHTML = `<p><strong>Sistema:</strong> ${texto}</p><small>${new Date().toLocaleTimeString()}</small>`;
	messagesArea.appendChild(messageDiv);
	messagesArea.scrollTop = messagesArea.scrollHeight;
}

/**
 * Enviar mensagem manual
 */
function enviarMensagemManual() {
	const input = document.getElementById("manual-message");
	const mensagem = input.value.trim();

	if (!mensagem) {
		mostrarNotificacao("Digite uma mensagem", "error");
		return;
	}

	// Adicionar mensagem do usuário
	adicionarMensagemUsuario(mensagem);

	// Limpar input
	input.value = "";

	// Simular resposta do agente (modo demo)
	setTimeout(
		() => {
			simularRespostaAgente(mensagem);
		},
		1000 + Math.random() * 2000,
	); // Delay aleatório
}

/**
 * Adicionar mensagem do usuário
 */
function adicionarMensagemUsuario(texto) {
	const messagesArea = document.getElementById("conversation-messages");
	const messageDiv = document.createElement("div");
	messageDiv.className = "user-message";
	messageDiv.innerHTML = `<p><strong>Você:</strong> ${texto}</p><small>${new Date().toLocaleTimeString()}</small>`;
	messagesArea.appendChild(messageDiv);
	messagesArea.scrollTop = messagesArea.scrollHeight;
}

/**
 * Adicionar mensagem do agente
 */
function adicionarMensagemAgente(texto) {
	const messagesArea = document.getElementById("conversation-messages");
	const messageDiv = document.createElement("div");
	messageDiv.className = "agent-message";
	messageDiv.innerHTML = `<p><strong>Agente:</strong> ${texto}</p><small>${new Date().toLocaleTimeString()}</small>`;
	messagesArea.appendChild(messageDiv);
	messagesArea.scrollTop = messagesArea.scrollHeight;

	// Reproduzir voz se habilitada
	const configVoz = JSON.parse(localStorage.getItem("config_voz") || "{}");
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
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				mensagem: mensagemUsuario,
				cliente_id: null,
			}),
		});

		if (response.ok) {
			const dados = await response.json();
			if (dados.sucesso) {
				adicionarMensagemAgente(dados.resposta.resposta);
				registrarAtendimento(mensagemUsuario, dados.resposta);
			} else {
				adicionarMensagemAgente(
					"Desculpe, houve um erro no processamento. Tente novamente.",
				);
			}
		} else {
			// Fallback para resposta simulada
			const respostaSimulada = gerarRespostaSimulada(mensagemUsuario);
			adicionarMensagemAgente(respostaSimulada);
			registrarAtendimento(mensagemUsuario, {
				resposta: respostaSimulada,
				intencao: "simulado",
			});
		}
	} catch (_error) {
		// Fallback para resposta simulada
		const respostaSimulada = gerarRespostaSimulada(mensagemUsuario);
		adicionarMensagemAgente(respostaSimulada);
		registrarAtendimento(mensagemUsuario, {
			resposta: respostaSimulada,
			intencao: "simulado",
		});
	}
}

/**
 * Gerar resposta simulada
 */
function gerarRespostaSimulada(mensagem) {
	const respostas = [
		"Entendi sua solicitação. Como posso ajudar você hoje?",
		"Obrigado por entrar em contato. Estou aqui para ajudar.",
		"Vou verificar isso para você. Um momento por favor.",
		"Essa é uma boa pergunta. Deixe-me explicar melhor.",
		"Posso ajudar com mais detalhes sobre isso?",
	];

	if (mensagem.toLowerCase().includes("saldo")) {
		return "Para consultar seu saldo, você pode acessar o aplicativo ou ligar para nossa central de atendimento.";
	} else if (
		mensagem.toLowerCase().includes("transferência") ||
		mensagem.toLowerCase().includes("transferir")
	) {
		return "Para fazer uma transferência, você precisa do número da conta e agência do destinatário.";
	} else if (mensagem.toLowerCase().includes("cartão")) {
		return "Sobre seu cartão, posso ajudar com bloqueio, desbloqueio ou segunda via.";
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
		cliente: "Cliente Anônimo",
		status: "resolvido",
		duracao: "00:00:30",
		conversa: [
			{
				tipo: "usuario",
				texto: mensagemUsuario,
				hora: new Date().toLocaleTimeString(),
			},
			{
				tipo: "agente",
				texto: respostaAgente.resposta || respostaAgente,
				hora: new Date().toLocaleTimeString(),
			},
		],
		acoes: ["Resposta automática", "Análise de intenção"],
	};

	estadoGlobal.historicoAtendimentos.unshift(atendimento);

	// Limitar histórico a 100 atendimentos
	if (estadoGlobal.historicoAtendimentos.length > 100) {
		estadoGlobal.historicoAtendimentos =
			estadoGlobal.historicoAtendimentos.slice(0, 100);
	}

	// Salvar no localStorage
	localStorage.setItem(
		"historico_atendimentos",
		JSON.stringify(estadoGlobal.historicoAtendimentos),
	);
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
	adicionarMensagemSistema("👤 Transferindo para atendente humano...");
	setTimeout(() => {
		adicionarMensagemSistema(
			"✅ Transferência realizada. Atendente João Silva irá atendê-lo agora.",
		);
		// Registrar transferência
		if (estadoGlobal.atendimentoAtual) {
			estadoGlobal.atendimentoAtual.status = "transferido";
			estadoGlobal.atendimentoAtual.acoes.push("Transferido para humano");
		}
	}, 2000);
}

/**
 * Encerrar atendimento
 */
function encerrarAtendimento() {
	adicionarMensagemSistema("📞 Encerrando atendimento...");
	setTimeout(() => {
		adicionarMensagemSistema(
			"✅ Atendimento encerrado. Obrigado pelo contato!",
		);
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
	const historicoSalvo = localStorage.getItem("historico_atendimentos");
	if (historicoSalvo) {
		estadoGlobal.historicoAtendimentos = JSON.parse(historicoSalvo);
	}

	exibirHistoricoAtendimentos();
}

/**
 * Exibir histórico de atendimentos
 */
function exibirHistoricoAtendimentos(filtros = {}) {
	const container = document.getElementById("historico-atendimentos");
	const atendimentos = estadoGlobal.historicoAtendimentos;

	if (atendimentos.length === 0) {
		container.innerHTML =
			'<div class="empty-history">Nenhum atendimento registrado ainda.</div>';
		return;
	}

	// Aplicar filtros
	const atendimentosFiltrados = atendimentos.filter((atendimento) => {
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
	container.innerHTML = atendimentosFiltrados
		.map(
			(atendimento) => `
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
  `,
		)
		.join("");
}

/**
 * Filtrar histórico
 */
function filtrarHistorico() {
	const filtros = {
		dataInicio: document.getElementById("filtro-data-inicio").value,
		dataFim: document.getElementById("filtro-data-fim").value,
		status: document.getElementById("filtro-status").value,
	};

	exibirHistoricoAtendimentos(filtros);
}

/**
 * Limpar filtros
 */
function limparFiltros() {
	document.getElementById("filtro-data-inicio").value = "";
	document.getElementById("filtro-data-fim").value = "";
	document.getElementById("filtro-status").value = "";
	exibirHistoricoAtendimentos();
}

/**
 * Ver detalhes do atendimento
 */
function _verDetalhesAtendimento(protocolo) {
	const atendimento = estadoGlobal.historicoAtendimentos.find(
		(a) => a.protocolo === protocolo,
	);
	if (!atendimento) return;

	// Preencher detalhes
	document.getElementById("detail-protocolo").textContent =
		atendimento.protocolo;
	document.getElementById("detail-datahora").textContent = new Date(
		atendimento.dataHora,
	).toLocaleString();
	document.getElementById("detail-cliente").textContent = atendimento.cliente;
	document.getElementById("detail-status").textContent = atendimento.status;
	document.getElementById("detail-duracao").textContent = atendimento.duracao;

	// Transcrição da conversa
	const transcricao = atendimento.conversa
		.map((msg) => {
			const tipo = msg.tipo === "usuario" ? "👤 Cliente" : "🤖 Agente";
			return `[${msg.hora}] ${tipo}: ${msg.texto}`;
		})
		.join("\n");

	document.getElementById("detail-conversa").textContent = transcricao;

	// Ações realizadas
	document.getElementById("detail-acoes").innerHTML = atendimento.acoes
		.map((acao) => `<div class="action-item">• ${acao}</div>`)
		.join("");

	// Mostrar modal
	document.getElementById("detalhes-atendimento").style.display = "block";
}

/**
 * Fechar detalhes
 */
function fecharDetalhes() {
	document.getElementById("detalhes-atendimento").style.display = "none";
}

/**
 * Exportar histórico
 */
function exportarHistorico() {
	const dados = JSON.stringify(estadoGlobal.historicoAtendimentos, null, 2);
	const blob = new Blob([dados], { type: "application/json" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = `historico-atendimentos-${new Date().toISOString().split("T")[0]}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	mostrarNotificacao("Histórico exportado com sucesso!", "success");
}

// ==========================================
// SISTEMA DE VOZ (ELEVENLABS)
// ==========================================

let audioAtual = null;

/**
 * Falar texto usando síntese de voz (ElevenLabs via Backend)
 */
async function falarTexto(texto) {
	if (!texto) return;

	// Parar áudio anterior se existir
	pararFala();

	const statusEl = document.getElementById("voz-status");
	if (statusEl) statusEl.textContent = "🔊 Gerando voz...";

	// Obter o gênero a partir do dropdown do agente atual (ou 'female' como padrão)
	const elTomVoz =
		document.getElementById("tom-voz-audio") ||
		document.getElementById("agente-voz");
	const genero = elTomVoz ? elTomVoz.value : "female";
	// Nota: "Tom de voz" na UI era usado para female/male

	try {
		const response = await fetch(`${API_BASE}/voz/tts`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ texto, genero }),
		});

		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			throw new Error(data.erro || "Erro na API de voz");
		}

		const blob = await response.blob();
		const audioUrl = URL.createObjectURL(blob);

		audioAtual = new Audio(audioUrl);

		audioAtual.onplay = () => {
			if (statusEl) statusEl.textContent = "🔊 Falando...";
			// Adicionar animação visual se existir um elemento de avatar pulsando
			const avatar = document.querySelector(
				".msg-bubble.system:last-child .avatar",
			);
			if (avatar) avatar.classList.add("avatar-falando");
		};

		audioAtual.onended = () => {
			if (statusEl) statusEl.textContent = "🔇 Pronto";
			document
				.querySelectorAll(".avatar-falando")
				.forEach((el) => el.classList.remove("avatar-falando"));
			URL.revokeObjectURL(audioUrl); // Limpar memória
		};

		audioAtual.onerror = () => {
			if (statusEl) statusEl.textContent = "❌ Erro ao tocar";
		};

		audioAtual.play();
	} catch (error) {
		console.warn(
			"Erro no ElevenLabs, usando fallback (Voz do Navegador):",
			error,
		);
		if (statusEl) statusEl.textContent = "🔊 Voz (Navegador)...";

		// Fallback para voz do navegador (Legacy)
		falarTexto_legacy(texto);
	}
}

/**
 * Parar fala atual
 */
function pararFala() {
	if (audioAtual) {
		audioAtual.pause();
		audioAtual.currentTime = 0;
		audioAtual = null;
	}
	// Também cancelar speechSynthesis caso ainda tenha algo antigo
	if ("speechSynthesis" in window) speechSynthesis.cancel();

	const statusEl = document.getElementById("voz-status");
	if (statusEl) statusEl.textContent = "🔇 Pronto";
	document
		.querySelectorAll(".avatar-falando")
		.forEach((el) => el.classList.remove("avatar-falando"));
}

/**
 * Carregar vozes disponíveis
 */
function carregarVozesDisponiveis() {
	if (!("speechSynthesis" in window)) return;

	const selectVoz = document.getElementById("voz-selecionada");
	const configVoz = JSON.parse(localStorage.getItem("config_voz") || "{}");

	// Função para popular select
	const popularVozes = () => {
		const vozes = speechSynthesis.getVoices();
		selectVoz.innerHTML = '<option value="">Voz padrão do sistema</option>';

		vozes.forEach((voz) => {
			const option = document.createElement("option");
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
function mostrarNotificacao(mensagem, tipo = "info") {
	const notification = document.createElement("div");
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
function _formatarData(data) {
	return new Date(data).toLocaleString("pt-BR");
}

/**
 * Copiar texto para clipboard
 */
function _copiarParaClipboard(texto) {
	navigator.clipboard
		.writeText(texto)
		.then(() => {
			mostrarNotificacao("Copiado para a área de transferência!", "success");
		})
		.catch((err) => {
			console.error("Erro ao copiar:", err);
			mostrarNotificacao("Erro ao copiar texto", "error");
		});
}

/**
 * Resetar configurações
 */
function resetarConfiguracoes() {
	if (
		!confirm(
			"Tem certeza que deseja resetar todas as configurações? Esta ação não pode ser desfeita.",
		)
	) {
		return;
	}

	// Limpar localStorage
	localStorage.removeItem("config_geral");
	localStorage.removeItem("config_voz");
	localStorage.removeItem("config_scripts");
	localStorage.removeItem("config_integracoes");

	// Recarregar configurações padrão
	carregarConfiguracoes();

	mostrarNotificacao("Configurações resetadas com sucesso!", "success");
}

/**
 * Exportar configurações
 */
function exportarConfiguracoes() {
	const configuracoes = {
		geral: JSON.parse(localStorage.getItem("config_geral") || "{}"),
		voz: JSON.parse(localStorage.getItem("config_voz") || "{}"),
		scripts: JSON.parse(localStorage.getItem("config_scripts") || "{}"),
		integracoes: JSON.parse(localStorage.getItem("config_integracoes") || "{}"),
		exportado_em: new Date().toISOString(),
	};

	const dados = JSON.stringify(configuracoes, null, 2);
	const blob = new Blob([dados], { type: "application/json" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = `configuracoes-agente-${new Date().toISOString().split("T")[0]}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	mostrarNotificacao("Configurações exportadas!", "success");
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

			if (configuracoes.geral)
				localStorage.setItem(
					"config_geral",
					JSON.stringify(configuracoes.geral),
				);
			if (configuracoes.voz)
				localStorage.setItem("config_voz", JSON.stringify(configuracoes.voz));
			if (configuracoes.scripts)
				localStorage.setItem(
					"config_scripts",
					JSON.stringify(configuracoes.scripts),
				);
			if (configuracoes.integracoes)
				localStorage.setItem(
					"config_integracoes",
					JSON.stringify(configuracoes.integracoes),
				);

			// Recarregar configurações
			carregarConfiguracoes();
			atualizarModeloAgente();

			mostrarNotificacao("Configurações importadas com sucesso!", "success");
		} catch (_error) {
			mostrarNotificacao(
				"Erro ao importar configurações. Verifique o arquivo.",
				"error",
			);
		}
	};
	reader.readAsText(file);
}

// ==========================================
// TREINAMENTO E BASE DE CONHECIMENTO
// ==========================================

function _openFormAdicionarTreinamento() {
	document.getElementById("form-treinamento").style.display = "block";
}

function closeFormTreinamento() {
	document.getElementById("form-treinamento").style.display = "none";
	document.getElementById("formNovoTreinamento").reset();
}

async function carregarTreinamentos() {
	const tbody = document.getElementById("tbody-treinamentos");
	tbody.innerHTML =
		'<tr><td colspan="5" class="text-center">Carregando...</td></tr>';

	try {
		const res = await fetch(`${API_BASE}/treinamento/problemas`);
		const data = await res.json();

		if (data.sucesso && data.dados.length > 0) {
			tbody.innerHTML = "";
			data.dados.forEach((item) => {
				tbody.innerHTML += `
          <tr>
            <td>#${item.id}</td>
            <td><span class="badge ${item.categoria}">${item.categoria}</span></td>
            <td>${item.descricao}</td>
            <td><small>${item.palavras_chave || "N/A"}</small></td>
            <td>
              <button class="btn btn-primary btn-small" onclick="editarProblemaIA(${item.id}, event)">Editar</button>
              <button class="btn btn-danger btn-small" onclick="deletarTreinamento(${item.id}, event)">Remover</button>
            </td>
          </tr>
        `;
			});
		} else {
			tbody.innerHTML =
				'<tr><td colspan="5" class="text-center">Nenhum conhecimento treinado ainda.</td></tr>';
		}
	} catch (err) {
		console.error(err);
		tbody.innerHTML =
			'<tr><td colspan="5" class="text-center erro">Erro ao carregar conhecimentos.</td></tr>';
	}
}

/**
 * RAG / CONHECIMENTO TÉCNICO
 */
async function _deletarTreinamento(id, event) {
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	if (!(await customConfirm("Deseja realmente excluir este conhecimento?")))
		return;
	try {
		const res = await fetch(`${API_BASE}/treinamento/problemas/${id}`, {
			method: "DELETE",
		});
		const data = await res.json();
		if (data.sucesso) {
			mostrarNotificacao("Conhecimento removido!", "info");
			carregarTreinamentos();
			carregarConhecimentoMini();
		}
	} catch (_err) {
		mostrarNotificacao("Erro ao excluir.", "error");
	}
}

async function _deletarBase(id) {
	if (!(await customConfirm("Excluir este conhecimento?"))) return;
	try {
		await fetch(`${API_BASE}/treinamento/problemas/${id}`, {
			method: "DELETE",
		});
		mostrarNotificacao("Conhecimento removido!", "info");
		carregarConhecimentoMini();
		if (typeof carregarTreinamentos === "function") carregarTreinamentos();
	} catch (_err) {
		mostrarNotificacao("Erro ao remover.", "error");
	}
}

async function _editarProblemaIA(id, event) {
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	try {
		// Primeiro buscar dados atuais
		const res = await fetch(`${API_BASE}/treinamento/problemas`);
		const data = await res.json();
		const atual = data.dados.find((p) => p.id === id);

		if (!atual) return;

		const desc = await customPrompt(
			"Edite a pergunta/descrição:",
			atual.descricao,
		);
		if (!desc) return;
		const sol = await customPrompt("Edite a resposta/solução:", atual.solucao);
		if (!sol) return;

		await fetch(`${API_BASE}/treinamento/problemas/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ descricao: desc, solucao: sol }),
		});
		mostrarNotificacao("Atualizado com sucesso!", "success");
		carregarConhecimentoMini();
		if (typeof carregarTreinamentos === "function") carregarTreinamentos();
	} catch (err) {
		console.error(err);
		mostrarNotificacao("Erro ao atualizar.", "error");
	}
}

/**
 * SISTEMA DE TREINAMENTO COMPORTAMENTAL E FEEDBACK
 */

function _switchTrainingSubTab(tab) {
	document
		.querySelectorAll(".training-sub-content")
		.forEach((el) => (el.style.display = "none"));
	document
		.querySelectorAll(".btn-tab-sub")
		.forEach((el) => el.classList.remove("active"));

	event.currentTarget.classList.add("active");

	if (tab === "comportamento") carregarRegrasComportamento();
	if (tab === "aprendizado") carregarLicoesAprendidas();
}

async function _salvarRegraComportamento() {
	const nome = document.getElementById("regra-nome").value;
	const instrucao = document.getElementById("regra-instrucao").value;

	if (!nome || !instrucao)
		return alert("Preencha o nome e a instrução da regra.");

	try {
		const res = await fetch(`${API_BASE}/admin/regras`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nome, instrucao }),
		});
		const data = await res.json();
		if (data.sucesso) {
			alert("IA aprendeu nova regra de comportamento!");
			document.getElementById("regra-nome").value = "";
			document.getElementById("regra-instrucao").value = "";
			carregarRegrasComportamento();
			if (typeof carregarRegrasBrain === "function") carregarRegrasBrain();
		}
	} catch (err) {
		console.error(err);
	}
}

async function carregarRegrasComportamento() {
	const container = document.getElementById("lista-regras");
	try {
		const res = await fetch(`${API_BASE}/admin/regras`);
		const data = await res.json();
		if (data.sucesso) {
			container.innerHTML = data.regras
				.map(
					(r) => `
				<div class="regra-item card" style="margin-bottom: 10px; border-left: 4px solid #3b82f6; display: flex; justify-content: space-between; align-items: center; padding: 15px;">
					<div style="flex: 1;">
						<strong>${r.nome || "Regra"}</strong>
						<p style="margin: 5px 0 0 0;">${r.instrucao}</p>
					</div>
					<div class="actions" style="display: flex; gap: 5px;">
						<button type="button" class="btn-icon" onclick="editarRegraIA(${r.id}, '${r.instrucao.replace(/['"\n\r]/g, " ")}', event)" title="Editar">✏️</button>
						<button type="button" class="btn-icon" onclick="deletarRegraIA(${r.id}, event)" title="Excluir">🗑️</button>
					</div>
				</div>
			`,
				)
				.join("");
		}
	} catch (_err) {
		container.innerHTML = "Erro ao carregar regras.";
	}
}

async function carregarLicoesAprendidas() {
	const container = document.getElementById("lista-aprendizados");
	try {
		// Nota: Precisamos adicionar esta rota no server.js se ainda não houver
		const res = await fetch(`${API_BASE}/admin/aprendizados`);
		const data = await res.json();
		if (data.sucesso && data.aprendizados.length > 0) {
			container.innerHTML = data.aprendizados
				.map(
					(a) => `
				<div class="aprendizado-item card" style="margin-bottom: 10px; border-left: 4px solid #ef4444; background: #fef2f2;">
					<div style="font-size: 0.8rem; color: #991b1b;">PERGUNTA: ${a.mensagem_usuario}</div>
					<div style="margin: 5px 0;"><strong>RESPOSTA COM ERRO:</strong> <em>${a.resposta_ia}</em></div>
					<div style="font-weight: bold; color: #b91c1c;">POR QUE FOI RUIM: ${a.justificativa_feedback || "Não justificado"}</div>
					<button onclick="excluirAprendizado(${a.id})" class="btn btn-mini" style="margin-top: 10px; background: #fee2e2; color: #b91c1c; border: 1px solid #f87171;">🗑️ Excluir Memória</button>
				</div>
			`,
				)
				.join("");
		} else {
			container.innerHTML =
				"<p>Nenhum erro registrado. Sua IA está indo bem!</p>";
		}
	} catch (_err) {
		container.innerHTML = "Ainda não há lições aprendidas registradas.";
	}
}

async function _excluirAprendizado(id) {
	if (!(await customConfirm("Esquecer esta lição aprendida?"))) return;
	try {
		const res = await fetch(`${API_BASE}/admin/aprendizados/${id}`, {
			method: "DELETE",
		});
		const data = await res.json();
		if (data.sucesso) {
			mostrarNotificacao("Lição esquecida pela IA.", "success");
			carregarLicoesAprendidas();
		}
	} catch (_error) {
		mostrarNotificacao("Erro ao excluir", "error");
	}
}

async function _registrarFeedbackIA(id, tipo) {
	let justificativa = "";
	if (tipo === "negativo") {
		justificativa = await customPrompt(
			"Por que essa resposta foi ruim? (Ex: Muito curta, agressiva, errou o saldo...)",
		);
		if (justificativa === null) return;
	}

	try {
		const res = await fetch(`${API_BASE}/ia/feedback`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ interacao_id: id, feedback: tipo, justificativa }),
		});
		const data = await res.json();
		if (data.sucesso) {
			mostrarNotificacao(
				tipo === "positivo" ? "Reforço registrado!" : "IA aprendeu a correção.",
				"success",
			);

			// Atualizar visões de aprendizado imediatamente
			if (typeof carregarAprendizadosMini === "function")
				carregarAprendizadosMini();
			if (typeof atualizarStatsSidebar === "function") atualizarStatsSidebar();
			if (typeof carregarLicoesAprendidas === "function")
				carregarLicoesAprendidas();
		}
	} catch (err) {
		console.error(err);
		mostrarNotificacao("Erro ao registrar feedback", "error");
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const formTreino = document.getElementById("formNovoTreinamento");
	if (formTreino) {
		formTreino.addEventListener("submit", async (e) => {
			e.preventDefault();

			const payload = {
				categoria: document.getElementById("treino-categoria").value,
				descricao: document.getElementById("treino-descricao").value,
				solucao: document.getElementById("treino-solucao").value,
				palavras_chave: document.getElementById("treino-palavras").value,
				prioridade: document.getElementById("treino-prioridade").value,
			};

			try {
				const res = await fetch(`${API_BASE}/treinamento/problemas`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});

				const data = await res.json();

				if (data.sucesso) {
					mostrarNotificacao(
						"IA treinada com novo conhecimento com sucesso!",
						"success",
					);
					closeFormTreinamento();
					carregarTreinamentos();
				} else {
					mostrarNotificacao_legacy(`Erro ao treinar: ${data.erro}`, "error");
				}
			} catch (_err) {
				mostrarNotificacao_legacy("Erro grave na conexão", "error");
			}
		});
	}
});

/**
 * GERENCIAMENTO DE AGENTES
 */
async function carregarAgentes() {
	const grid = document.getElementById("lista-agentes-grid");
	if (!grid) return;

	try {
		const res = await fetch(`${API_BASE}/admin/agentes`);
		const data = await res.json();

		if (data.sucesso) {
			grid.innerHTML = data.agentes
				.map((agente) => {
					const statusLabel = agente.finalizado
						? "🟢 Finalizado"
						: "🟡 Em treinamento";
					const comportamento = agente.instrucao_comportamental
						? agente.instrucao_comportamental.substring(0, 60) +
							(agente.instrucao_comportamental.length > 60 ? "..." : "")
						: "Sem comportamento definido";
					return `
				<div class="agent-card ${agente.ativo ? "active" : ""}">
					<div class="agent-avatar">${agente.nome.charAt(0)}</div>
					<div class="agent-info">
						<h4>${agente.nome}</h4>
						<p>${agente.voz_id === "female" ? "Feminino" : "Masculino"} · ${statusLabel}</p>
						<p style="font-size:0.72rem;color:#64748b;font-style:italic;margin-top:4px;">${comportamento}</p>
					</div>
					<div class="agent-actions">
						<button type="button" class="btn-icon" onclick="event.stopPropagation(); abrirConfigAgente(${agente.id})" title="Configurar">⚙️</button>
						<button type="button" class="btn-icon" onclick="event.stopPropagation(); editarAgente(${agente.id})" title="Editar">✏️</button>
						<button type="button" class="btn-icon" onclick="event.stopPropagation(); deletarAgente(${agente.id})" title="Excluir">🗑️</button>
					</div>
				</div>
			`;
				})
				.join("");
		}
	} catch (err) {
		console.error("Erro ao carregar agentes:", err);
	}
}

async function _abrirConfigAgente(id) {
	// 1. Selecionar o agente no playground
	const seletor = document.getElementById("agente-seletor-playground");
	if (seletor) {
		seletor.value = id;
		trocarAgentePlayground(true); // true = pular saudação
	}

	// 2. Buscar dados do agente
	try {
		const res = await fetch(`${API_BASE}/admin/agentes/${id}`);
		const data = await res.json();
		if (data.sucesso) {
			const a = data.agente;
			// Preencher campos da aba Geral
			document.getElementById("nome-agente").value = a.nome || "";
			document.getElementById("tom-voz").value = a.tom_voz || "profissional";
			document.getElementById("instrucao-comportamental-config").value =
				a.instrucao_comportamental || "";

			// Preencher campos da aba Voz
			document.getElementById("tom-voz-audio").value = a.voz_id || "female";
			document.getElementById("velocidade-fala").value = a.velocidade || 1.0;
			const valorVel = document.getElementById("velocidade-valor");
			if (valorVel)
				valorVel.textContent = `${parseFloat(a.velocidade || 1.0).toFixed(1)}x`;

			// Preencher campos da aba Scripts
			document.getElementById("script-saudacao").value =
				a.script_saudacao || "";
			document.getElementById("script-encerramento").value =
				a.script_encerramento || "";
			document.getElementById("script-transferencia").value =
				a.script_transferencia || "";
		}
	} catch (_err) {}

	// 3. Trocar para a aba Geral da configuração
	const btnGeral = document.querySelector(".config-tab-btn:nth-child(2)");
	switchConfigTab("geral", btnGeral);

	// 4. Marcar que tem agente selecionado (mostrar sub-abas)
	const tabConfig = document.getElementById("tab-configuracao");
	if (tabConfig) tabConfig.classList.add("agente-selecionado");

	mostrarNotificacao(`Configurações do agente carregadas.`, "success");
}

async function carregarSeletorAgentes() {
	const seletorPlayground = document.getElementById(
		"agente-seletor-playground",
	);
	const seletorAtendimento = document.getElementById(
		"agente-seletor-atendimento",
	);

	try {
		const res = await fetch(`${API_BASE}/admin/agentes`);
		const data = await res.json();

		if (data.sucesso) {
			const options = data.agentes
				.map(
					(agente) => `
				<option value="${agente.id}">🤖 ${agente.nome} ${agente.id === 1 ? "(Padrão)" : ""}</option>
			`,
				)
				.join("");

			if (seletorPlayground) {
				seletorPlayground.innerHTML = `<option value="">⚙️ Selecione um Agente</option>${options}`;
			}
			if (seletorAtendimento) {
				seletorAtendimento.innerHTML = `<option value="">⚙️ Selecione o Agente p/ Atender</option>${options}`;
			}
		}
	} catch (_err) {}
}

function _selecionarAgenteAtendimento() {
	const id = document.getElementById("agente-seletor-atendimento").value;
	const btnIniciar = document.getElementById("btn-iniciar-atendimento");

	if (id) {
		btnIniciar.disabled = false;
		mostrarNotificacao("Agente selecionado para atendimento.", "success");
	} else {
		btnIniciar.disabled = true;
	}
}

function _abrirNovoAgente() {
	document.getElementById("modal-agente").style.display = "block";
	document.getElementById("modal-agente-titulo").textContent = "👤 Novo Agente";
	document.getElementById("agente-id-edit").value = "";
	document.getElementById("agente-nome").value = "";
	document.getElementById("agente-instrucao").value = "";
	document.getElementById("agente-saudacao").value = "";
}

function fecharModalAgente() {
	document.getElementById("modal-agente").style.display = "none";
}

/**
 * Selecionar e abrir configurações do agente
 */
async function _selecionarAgente(id) {
	try {
		console.log(`[UI] Selecionando Agente ID: ${id}`);
		const res = await fetch(`${API_BASE}/admin/agentes/${id}`);
		const data = await res.json();

		if (data.sucesso) {
			const a = data.agente;

			// 1. Preencher campos das abas de configuração (Geral, Voz, Scripts)

			// Aba Geral
			const elNome = document.getElementById("nome-agente");
			if (elNome) elNome.value = a.nome;

			const elIdioma = document.getElementById("idioma-agente");
			if (elIdioma) elIdioma.value = "pt-BR"; // Valor padrão se não houver no banco

			// Aba Voz
			const elVozAudio = document.getElementById("tom-voz-audio");
			if (elVozAudio) elVozAudio.value = a.voz_id || "female";

			const elVelocidade = document.getElementById("velocidade-fala");
			if (elVelocidade) {
				elVelocidade.value = a.velocidade || 1.0;
				const valDisplay = document.getElementById("velocidade-valor");
				if (valDisplay)
					valDisplay.textContent = `${parseFloat(a.velocidade || 1.0).toFixed(1)}x`;
			}

			// Aba Scripts
			const elSaudacao = document.getElementById("script-saudacao");
			if (elSaudacao) elSaudacao.value = a.script_saudacao || "";

			// 2. Preencher o ID oculto no modal (caso ainda precise salvar via modal para Novos Agentes)
			document.getElementById("agente-id-edit").value = a.id;

			// 3. Mudar para a aba "Geral" para mostrar que foi carregado
			const tabConfig = document.getElementById("tab-configuracao");
			if (tabConfig) tabConfig.classList.add("agente-selecionado");

			switchConfigTab(
				"geral",
				document.querySelector("button[onclick*=\"switchConfigTab('geral'\"]"),
			);

			// 4. Marcar o card como visualmente ativo no grid
			document
				.querySelectorAll(".agent-card")
				.forEach((card) => card.classList.remove("active"));
			const activeCard = document.querySelector(
				`.agent-card[onclick*="selecionarAgente(${id})"]`,
			);
			if (activeCard) activeCard.classList.add("active");

			mostrarNotificacao(`Configurações de "${a.nome}" carregadas`, "info");
		}
	} catch (err) {
		console.error("Erro ao carregar detalhes do agente:", err);
	}
}

function _editarAgenteSelecionado() {
	const id = document.getElementById("agente-seletor-playground")?.value;
	if (!id) {
		mostrarNotificacao("Nenhum agente selecionado.", "error");
		return;
	}
	editarAgente(id);
}

async function editarAgente(id) {
	try {
		const res = await fetch(`${API_BASE}/admin/agentes/${id}`);
		const data = await res.json();

		if (data.sucesso) {
			const a = data.agente;
			document.getElementById("modal-agente").style.display = "block";
			document.getElementById("modal-agente-titulo").textContent =
				"✏️ Editar Agente";
			document.getElementById("agente-id-edit").value = a.id;
			document.getElementById("agente-nome").value = a.nome;
			document.getElementById("agente-instrucao").value =
				a.instrucao_comportamental || "";
			document.getElementById("agente-voz").value = a.voz_id || "female";
			document.getElementById("agente-velocidade").value = a.velocidade || 1.0;
			document.getElementById("agente-saudacao").value =
				a.script_saudacao || "";
			document.getElementById("agente-finalizado").checked = !!a.finalizado;

			// Sincronizar com as abas de Configurações imediatamente
			document.getElementById("nome-agente").value = a.nome;
			document.getElementById("instrucao-comportamental-config").value =
				a.instrucao_comportamental || "";
			document.getElementById("tom-voz-audio").value = a.voz_id || "female";
			document.getElementById("velocidade-fala").value = a.velocidade || 1.0;
			const valorVel = document.getElementById("velocidade-valor");
			if (valorVel)
				valorVel.textContent = `${parseFloat(a.velocidade || 1.0).toFixed(1)}x`;
			document.getElementById("script-saudacao").value =
				a.script_saudacao || "";
		}
	} catch (_err) {}
}

async function _salvarAgente() {
	const id = document.getElementById("agente-id-edit").value;
	const payload = {
		nome: document.getElementById("agente-nome").value,
		instrucao_comportamental: document.getElementById("agente-instrucao").value,
		voz_id: document.getElementById("agente-voz").value,
		velocidade: parseFloat(document.getElementById("agente-velocidade").value),
		script_saudacao: document.getElementById("agente-saudacao").value,
		finalizado: document.getElementById("agente-finalizado").checked ? 1 : 0,
		tom_voz: "personalizado",
		ativo: 1,
	};

	if (!payload.nome) return alert("Dê um nome ao agente");

	try {
		const method = id ? "PUT" : "POST";
		const url = id
			? `${API_BASE}/admin/agentes/${id}`
			: `${API_BASE}/admin/agentes`;

		const res = await fetch(url, {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		const data = await res.json();
		if (data.sucesso) {
			fecharModalAgente();
			carregarAgentes();
			carregarSeletorAgentes();

			// Interligar com a aba Geral de Configurações
			const agenteAtivoId = document.getElementById(
				"agente-seletor-playground",
			)?.value;
			if (agenteAtivoId === id || (!id && data.id)) {
				document.getElementById("instrucao-comportamental-config").value =
					payload.instrucao_comportamental;
				document.getElementById("nome-agente").value = payload.nome;
				document.getElementById("tom-voz-audio").value = payload.voz_id;
				document.getElementById("velocidade-fala").value = payload.velocidade;
				const valorVel = document.getElementById("velocidade-valor");
				if (valorVel)
					valorVel.textContent = `${parseFloat(payload.velocidade).toFixed(1)}x`;
				document.getElementById("script-saudacao").value =
					payload.script_saudacao;
			}

			mostrarNotificacao("Perfil do Agente salvo com sucesso!", "success");
		}
	} catch (_err) {
		mostrarNotificacao("Erro ao salvar agente", "error");
	}
}

async function _deletarAgente(id) {
	if (id === 1) return alert("Não é possível excluir o agente padrão.");
	if (!(await customConfirm("Excluir este perfil de agente permanentemente?")))
		return;

	try {
		const res = await fetch(`${API_BASE}/admin/agentes/${id}`, {
			method: "DELETE",
		});
		const data = await res.json();
		if (data.sucesso) {
			carregarAgentes();
			carregarSeletorAgentes();
		}
	} catch (_err) {}
}

function trocarAgentePlayground(skipGreeting = false) {
	const id = document.getElementById("agente-seletor-playground").value;
	const placeholder = document.getElementById("chat-empty-placeholder");
	const interfaceAtiva = document.getElementById("chat-active-interface");
	const seletorCliente = document.getElementById("cliente-contexto-chat");

	if (!id) {
		placeholder.style.display = "flex";
		interfaceAtiva.style.display = "none";
		if (seletorCliente) seletorCliente.style.display = "none";
	} else {
		placeholder.style.display = "none";
		interfaceAtiva.style.display = "grid"; // Wrapper usa grid
		if (seletorCliente) seletorCliente.style.display = "block";
		console.log(`[UI] Trocando para Agente ID: ${id}`);
		carregarRegrasBrain();
		carregarConhecimentoMini();
		carregarAprendizadosMini();

		// MOSTRAR SAUDAÇÃO + COMPORTAMENTO
		fetch(`${API_BASE}/admin/agentes/${id}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.sucesso) {
					const agente = data.agente;

					// Mostrar card de comportamento
					const cardComportamento = document.getElementById(
						"agente-comportamento-card",
					);
					const nomeDisplay = document.getElementById("agente-nome-display");
					const textoComportamento = document.getElementById(
						"agente-comportamento-texto",
					);
					if (cardComportamento) {
						cardComportamento.style.display = "flex";
						nomeDisplay.textContent = agente.nome;
						textoComportamento.textContent =
							agente.instrucao_comportamental ||
							"Nenhum comportamento definido.";
					}

					// Preencher tab Geral da Configuração
					const nomeInput = document.getElementById("nome-agente");
					const tomSelect = document.getElementById("tom-voz");
					const instrucaoInput = document.getElementById(
						"instrucao-comportamental-config",
					);
					if (nomeInput) nomeInput.value = agente.nome || "";
					if (tomSelect) tomSelect.value = agente.tom_voz || "profissional";
					if (instrucaoInput)
						instrucaoInput.value = agente.instrucao_comportamental || "";

					// Sincronizar Abas Avançadas
					const vozAudio = document.getElementById("tom-voz-audio");
					const velFala = document.getElementById("velocidade-fala");
					if (vozAudio) vozAudio.value = agente.voz_id || "female";
					if (velFala) {
						velFala.value = agente.velocidade || 1.0;
						const vVal = document.getElementById("velocidade-valor");
						if (vVal)
							vVal.textContent = `${parseFloat(agente.velocidade || 1.0).toFixed(1)}x`;
					}
					const sSaudacao = document.getElementById("script-saudacao");
					if (sSaudacao) sSaudacao.value = agente.script_saudacao || "";
					const sEncerramento = document.getElementById("script-encerramento");
					if (sEncerramento)
						sEncerramento.value = agente.script_encerramento || "";
					const sTransferencia = document.getElementById(
						"script-transferencia",
					);
					if (sTransferencia)
						sTransferencia.value = agente.script_transferencia || "";

					// Saudação (só no playground, não na config)
					if (!skipGreeting && agente.script_saudacao) {
						renderizarMensagem("system", agente.script_saudacao);
						if (document.getElementById("habilitar-voz")?.checked) {
							falarTexto(agente.script_saudacao);
						}
					}
				}
			});
	}
}

// ==========================================
// INICIALIZAÇÃO DO SISTEMA
// ==========================================

// ==========================================
// PLAYGROUND DE CHAT (CENTRAL DE TESTE UNIFICADO)
// ==========================================

let chatHistory = [];

async function enviarMensagemChat() {
	const input = document.getElementById("texto-chat-input");
	const mensagem = input.value.trim();

	if (!mensagem) return;

	// 1. Renderizar mensagem do usuário
	renderizarMensagem("user", mensagem);
	input.value = "";
	chatHistory.push({ role: "user", content: mensagem });

	// Status: Carregando com bubble temporário para feedback instantâneo
	document.getElementById("chat-agente-status").textContent = "IA Pensando...";
	document.querySelector(".status-dot").style.background = "#fbbf24";

	const container = document.getElementById("chat-container");
	const loadingBubble = document.createElement("div");
	loadingBubble.id = "bubble-loading-ia";
	loadingBubble.className = "msg-bubble system loading";
	loadingBubble.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="bubble-content-wrapper">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
	container.appendChild(loadingBubble);
	container.scrollTop = container.scrollHeight;

	const agenteId =
		document.getElementById("agente-seletor-playground")?.value || 1;

	try {
		const historicoPrevio = chatHistory.slice(0, -1); // Tira a msg atual

		const res = await fetch(`${API_BASE}/ia/processar`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				mensagem,
				agente_id: agenteId,
				historico: historicoPrevio,
			}),
		});

		const data = await res.json();

		// Remover bubble de loading
		const loader = document.getElementById("bubble-loading-ia");
		if (loader) loader.remove();

		if (data.sucesso) {
			const resposta = data.resposta;
			// 2. Renderizar resposta da IA com interacaoId para feedback
			renderizarMensagem(
				"system",
				resposta.resposta,
				data.interacao_id || Date.now(),
			);
			chatHistory.push({ role: "assistant", content: resposta.resposta });

			// Falar texto se habilitado (O toggle do CHAT é o mestre aqui)
			const chatVoiceToggle = document.getElementById("chat-voice-enabled");

			if (chatVoiceToggle?.checked) {
				falarTexto(resposta.resposta);
			}

			// Atualizar estatísticas da sidebar
			atualizarStatsSidebar();
		}
	} catch (_err) {
		renderizarMensagem("system", "Erro na conexão com o cérebro da IA.");
	} finally {
		document.getElementById("chat-agente-status").textContent = "Agente Pronto";
		document.querySelector(".status-dot").style.background = "#10b981";
	}
}

function renderizarMensagem(quem, texto, id = null) {
	const container = document.getElementById("chat-container");
	const bubble = document.createElement("div");
	bubble.className = `msg-bubble ${quem}`;

	const avatar = quem === "user" ? "👤" : "🤖";

	let feedbackHtml = "";
	if (quem === "system" && id) {
		feedbackHtml = `
			<div class="bubble-actions">
				<button class="btn-feedback-action positive" onclick="registrarFeedbackIA(${id}, 'positivo')">👍 Bom</button>
				<button class="btn-feedback-action negative" onclick="registrarFeedbackIA(${id}, 'negativo')">👎 Ruim</button>
			</div>
		`;
	}

	bubble.innerHTML = `
		<div class="avatar">${avatar}</div>
		<div class="bubble-content-wrapper">
			<div class="content">${texto}</div>
			${feedbackHtml}
		</div>
	`;

	container.appendChild(bubble);
	container.scrollTop = container.scrollHeight;
}

async function carregarRegrasBrain() {
	const miniList = document.getElementById("regras-ativas-mini");
	const configList = document.getElementById("lista-regras-config");
	const agenteId =
		document.getElementById("agente-seletor-playground")?.value || 1;
	try {
		const res = await fetch(`${API_BASE}/admin/regras?agente_id=${agenteId}`);
		const data = await res.json();
		if (data.sucesso) {
			const gerarRegrasHtml = (regras) =>
				regras
					.map((r) => {
						const escapedInstrucao = r.instrucao.replace(/['"\n\r]/g, " ");
						return `
					<div class="rule-pill">
						<div class="rule-text">${r.instrucao}</div>
						<div class="rule-actions">
							<button type="button" class="rule-btn" onclick="editarRegraIA(${r.id}, '${escapedInstrucao}', event)">✏️</button>
							<button type="button" class="rule-btn delete" onclick="deletarRegraIA(${r.id}, event)">🗑️</button>
						</div>
					</div>
				`;
					})
					.join("");

			const html = gerarRegrasHtml(data.regras);
			const emptyMsg =
				'<div class="text-muted" style="padding:10px;text-align:center;">Nenhuma regra ativa. Adicione regras para guiar o comportamento do agente.</div>';

			if (miniList) miniList.innerHTML = data.regras.length ? html : emptyMsg;
			if (configList)
				configList.innerHTML = data.regras.length ? html : emptyMsg;

			// Atualizar card de comportamento com contagem de regras
			const textoComportamento = document.getElementById(
				"agente-comportamento-texto",
			);
			if (textoComportamento) {
				const instrucao =
					document.getElementById("instrucao-comportamental-config")?.value ||
					"";
				const regrasCount = data.regras.length;
				textoComportamento.textContent = instrucao
					? `${instrucao} (${regrasCount} regra${regrasCount !== 1 ? "s" : ""} ativa${regrasCount !== 1 ? "s" : ""})`
					: `${regrasCount} regra${regrasCount !== 1 ? "s" : ""} de comportamento ativa${regrasCount !== 1 ? "s" : ""}`;
			}
		}
	} catch (_err) {
		const emptyHtml = '<div class="text-muted">Sem regras ativas.</div>';
		if (miniList) miniList.innerHTML = emptyHtml;
		if (configList) configList.innerHTML = emptyHtml;
	}
}

async function _deletarRegraIA(id, event) {
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	if (!(await customConfirm("Excluir esta regra permanentemente?"))) return;
	try {
		const res = await fetch(`${API_BASE}/admin/regras/${id}`, {
			method: "DELETE",
		});
		const data = await res.json();
		if (data.sucesso) {
			mostrarNotificacao("Regra excluída!", "success");
			carregarRegrasBrain(); // Atualiza aba configuração e barra lateral
			if (typeof carregarRegrasComportamento === "function")
				carregarRegrasComportamento(); // Atualiza tab global
		}
	} catch (_err) {
		mostrarNotificacao("Falha ao excluir.", "error");
	}
}

async function _editarRegraIA(id, instrucao, event) {
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	const novaInstrucao = await customPrompt("Edite a regra:", instrucao);
	if (!novaInstrucao || novaInstrucao === instrucao) return;

	fetch(`${API_BASE}/admin/regras/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ instrucao: novaInstrucao }),
	})
		.then((res) => res.json())
		.then((data) => {
			if (data.sucesso) {
				mostrarNotificacao("Regra atualizada!", "success");
				carregarRegrasBrain(); // Atualiza aba configuração e barra lateral
				if (typeof carregarRegrasComportamento === "function")
					carregarRegrasComportamento(); // Atualiza tab global
			}
		});
}

async function _adicionarRegraConfig() {
	const textarea = document.getElementById("nova-regra-config");
	const instrucao = textarea.value.trim();
	const agenteId =
		document.getElementById("agente-seletor-playground")?.value || 1;

	if (!instrucao) {
		mostrarNotificacao("Escreva uma regra antes de adicionar.", "error");
		return;
	}

	try {
		const res = await fetch(`${API_BASE}/admin/regras`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nome: "Regra", instrucao, agente_id: agenteId }),
		});
		const data = await res.json();
		if (data.sucesso) {
			textarea.value = "";
			mostrarNotificacao("Nova regra adicionada!", "success");
			carregarRegrasBrain(); // Atualiza listas do config e playground
			if (typeof carregarRegrasComportamento === "function")
				carregarRegrasComportamento(); // Atualiza tab global
		}
	} catch (_err) {
		mostrarNotificacao("Erro ao adicionar regra.", "error");
	}
}

async function atualizarStatsSidebar() {
	try {
		const res = await fetch(`${API_BASE}/admin/aprendizados`);
		const data = await res.json();
		if (data.sucesso) {
			document.getElementById("stat-licoes").textContent =
				data.aprendizados.length;
			// Aqui poderíamos ter um contador de positivos também se o banco suportasse
		}
	} catch (_err) {}
}

function _limparChat() {
	document.getElementById("chat-container").innerHTML = `
		<div class="msg-bubble system">
			<div class="avatar">🤖</div>
			<div class="content">Chat limpo. Como posso ajudar agora?</div>
		</div>
	`;
	chatHistory = [];
}

async function _iniciarGravacaoChat() {
	if (!("webkitSpeechRecognition" in window)) {
		alert("Seu navegador não suporta reconhecimento de voz.");
		return;
	}

	const recognition = new webkitSpeechRecognition();
	recognition.lang = document.getElementById("idioma-agente")?.value || "pt-BR";
	recognition.interimResults = false;

	const btn = document.getElementById("btn-voice-chat");
	const micIcon = document.getElementById("mic-icon");

	if (btn) btn.classList.add("recording-pulse");
	if (micIcon) micIcon.textContent = "🛑";

	recognition.onresult = (event) => {
		const transcript = event.results[0][0].transcript;
		const input = document.getElementById("texto-chat-input");
		if (input) {
			input.value = transcript;
			enviarMensagemChat();
		}
	};

	recognition.onerror = () => {
		if (btn) btn.classList.remove("recording-pulse");
		if (micIcon) micIcon.textContent = "🎤";
	};

	recognition.onend = () => {
		if (btn) btn.classList.remove("recording-pulse");
		if (micIcon) micIcon.textContent = "🎤";
	};

	try {
		recognition.start();
	} catch (err) {
		console.error("Erro ao iniciar reconhecimento:", err);
	}
}

/**
 * NAVEGAÇÃO SIDEBAR COMMAND CENTER
 */
function _switchSidebarTab(tab) {
	// Esconder todos os painéis
	document
		.querySelectorAll(".sidebar-pane")
		.forEach((el) => (el.style.display = "none"));
	// Remover active de todos os mini-tabs
	document
		.querySelectorAll(".tab-mini")
		.forEach((el) => el.classList.remove("active"));

	// Mostrar selecionado
	const pane = document.getElementById(`side-pane-${tab}`);
	if (pane) pane.style.display = "flex";
	event.currentTarget.classList.add("active");

	// Carregar dados se necessário
	if (tab === "regras") carregarRegrasBrain();
	if (tab === "conhecimento") carregarConhecimentoMini();
	if (tab === "sugestoes") gerarSugestoesIA();
	if (tab === "aprendizados") carregarAprendizadosMini();
}

async function gerarSugestoesIA() {
	const id = document.getElementById("agente-seletor-playground").value;
	const container = document.getElementById("lista-sugestoes-ia");
	if (!id) return;

	container.innerHTML =
		'<div class="loading-mini" style="padding: 20px; text-align: center;">IA está pensando em melhorias... 🧠</div>';

	try {
		const res = await fetch(`${API_BASE}/ia/sugestoes/${id}`);
		const data = await res.json();

		if (data.sucesso && data.sugestoes.length > 0) {
			container.innerHTML = data.sugestoes
				.map(
					(s) => `
                <div class="rule-pill suggestion" style="border-left-color: #8b5cf6; background: #f5f3ff; flex-direction: column;">
                    <div class="rule-content">
                        <strong style="color: #6d28d9;">💡 ${s.titulo}</strong>
                        <p style="margin: 5px 0; font-size: 0.8rem; line-height: 1.3;">${s.descricao}</p>
                        <hr style="border: 0; border-top: 1px dashed #c084fc; margin: 10px 0;">
                        <div style="font-style: italic; font-size: 0.75rem; color: #4c1d95;"><strong>Sugestão:</strong> ${s.solucao}</div>
                        <div class="suggestion-actions" style="margin-top: 10px; display: flex; gap: 5px;">
                            <button class="btn btn-primary btn-mini" onclick="aceitarSugestaoIA('${s.tipo}', '${s.titulo.replace(/'/g, "\\'")}', '${s.descricao.replace(/'/g, "\\'")}', '${s.solucao.replace(/'/g, "\\'")}')">✅ Aplicar</button>
                            <button class="btn btn-mini" onclick="recusarSugestaoIA(this)" style="background:#ef4444;color:white;">❌ Recusar</button>
                        </div>
                    </div>
                </div>
            `,
				)
				.join("");
		} else {
			container.innerHTML =
				'<p class="text-muted" style="padding: 20px; text-align: center;">Nenhuma sugestão nova no momento.</p>';
		}
	} catch (_err) {
		container.innerHTML =
			'<p class="text-danger" style="padding: 20px; text-align: center;">Erro ao conectar com o gerador de ideias.</p>';
	}
}

function _recusarSugestaoIA(btn) {
	const card = btn.closest(".rule-pill");
	if (card) {
		card.style.transition = "all 0.3s ease";
		card.style.opacity = "0";
		card.style.transform = "translateX(50px)";
		setTimeout(() => {
			card.remove();
			const container = document.getElementById("lista-sugestoes-ia");
			if (container && container.querySelectorAll(".rule-pill").length === 0) {
				container.innerHTML =
					'<p class="text-muted" style="padding: 20px; text-align: center;">Todas as sugestões foram avaliadas. 🌟</p>';
			}
		}, 300);
		mostrarNotificacao("Sugestão descartada.", "info");
	}
}

async function _aceitarSugestaoIA(tipo, titulo, descricao, solucao) {
	const agenteId = document.getElementById("agente-seletor-playground").value;
	const endpoint =
		tipo === "regra"
			? `${API_BASE}/admin/regras`
			: `${API_BASE}/treinamento/problemas`;

	const payload =
		tipo === "regra"
			? { nome: titulo, instrucao: solucao, agente_id: agenteId }
			: {
					categoria: "Geral",
					descricao,
					solucao,
					palavras_chave: titulo,
					prioridade: 5,
				};

	try {
		const res = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		const data = await res.json();
		if (data.sucesso) {
			mostrarNotificacao(
				`Nova ${tipo} foi integrada ao cérebro do agente!`,
				"success",
			);
			if (tipo === "regra") carregarRegrasBrain();
			else carregarConhecimentoMini();

			// Recarregar sugestões para limpar a atual
			gerarSugestoesIA();
		}
	} catch (_err) {
		mostrarNotificacao("Falha ao salvar sugestão", "error");
	}
}

async function _salvarRegraComportamentoRapido() {
	const instrucao = document.getElementById("regra-instrucao-side").value;
	const agenteId =
		document.getElementById("agente-seletor-playground")?.value || 1;
	if (!instrucao) return;

	try {
		const res = await fetch(`${API_BASE}/admin/regras`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nome: "Rápida", instrucao, agente_id: agenteId }),
		});
		const data = await res.json();
		if (data.sucesso) {
			mostrarNotificacao("Regra de comportamento aplicada!", "success");
			document.getElementById("regra-instrucao-side").value = "";
			carregarRegrasBrain();
		}
	} catch (_err) {
		mostrarNotificacao("Erro ao salvar regra", "error");
	}
}

async function _salvarTreinamentoRapido() {
	const descricao = document.getElementById("treino-pergunta-side").value;
	const solucao = document.getElementById("treino-resposta-side").value;
	if (!descricao || !solucao) return;

	try {
		// Gerar palavras-chave básicas removendo conectores
		const keywords = `${descricao} ${solucao}`
			.toLowerCase()
			.replace(/[^\w\s]/gi, "")
			.split(" ")
			.filter((w) => w.length > 3)
			.slice(0, 10)
			.join(",");

		const res = await fetch(`${API_BASE}/treinamento/problemas`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				categoria: "Geral",
				descricao,
				solucao,
				palavras_chave: keywords,
				prioridade: 5,
			}),
		});
		const data = await res.json();
		if (data.sucesso) {
			mostrarNotificacao("IA treinada com sucesso!", "success");
			document.getElementById("treino-pergunta-side").value = "";
			document.getElementById("treino-resposta-side").value = "";
			carregarConhecimentoMini();
		}
	} catch (_err) {
		mostrarNotificacao("Falha no treinamento", "error");
	}
}

async function carregarConhecimentoMini() {
	const container = document.getElementById("lista-problemas-mini");
	if (!container) return;
	try {
		const res = await fetch(`${API_BASE}/treinamento/problemas`);
		const data = await res.json();
		if (data.sucesso) {
			container.innerHTML = data.dados
				.map(
					(item) => `
				<div class="rule-pill knowledge" style="border-left-color: #10b981; background: #f0fdf4; color: #065f46;">
					<div class="rule-content" onclick="editarProblemaIA(${item.id}, event)">
						<strong>${item.descricao}</strong>
						<p>${item.solucao.substring(0, 50)}...</p>
					</div>
					<div class="rule-actions">
						<button type="button" class="rule-btn" onclick="editarProblemaIA(${item.id}, event)" title="Editar">✏️</button>
						<button type="button" class="rule-btn delete" onclick="deletarProblemaIA(${item.id}, event)" title="Excluir">🗑️</button>
					</div>
				</div>
			`,
				)
				.join("");

			// Atualizar tabela principal se existir
			if (document.getElementById("tbody-treinamentos")) carregarTreinamentos();
		}
	} catch (_err) {}
}

async function _deletarProblemaIA(id, event) {
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	if (!(await customConfirm("Excluir este conhecimento?"))) return;
	try {
		await fetch(`${API_BASE}/treinamento/problemas/${id}`, {
			method: "DELETE",
		});
		mostrarNotificacao("Conhecimento removido!", "info");
		carregarConhecimentoMini();
		if (typeof carregarTreinamentos === "function") carregarTreinamentos();
	} catch (_err) {
		mostrarNotificacao("Erro ao remover.", "error");
	}
}

async function carregarAprendizadosMini() {
	const container = document.getElementById("lista-aprendizados-mini");
	if (!container) return;
	try {
		const res = await fetch(`${API_BASE}/admin/aprendizados`);
		const data = await res.json();
		if (data.sucesso) {
			const stat = document.getElementById("stat-licoes-side");
			if (stat) stat.textContent = data.aprendizados.length;
			container.innerHTML = data.aprendizados
				.map(
					(a) => `
				<div class="rule-pill" style="border-left-color: #ef4444; background: #fef2f2; color: #991b1b;">
					<small>IA Errou em: "${a.mensagem_usuario.substring(0, 30)}..."</small><br>
					<strong>Aprendizado: ${a.justificativa_feedback || "Correção comportamental"}</strong>
				</div>
			`,
				)
				.join("");
		}
	} catch (_err) {}
}

/**
 * Inicializar aplicação
 */
function inicializarAplicacao() {
	// Carregar configurações
	carregarConfiguracoes();
	carregarRegrasBrain();
	atualizarStatsSidebar();
	carregarConhecimentoMini();
	carregarAprendizadosMini();

	// Prevenir Enter no textarea e enviar
	document
		.getElementById("texto-chat-input")
		?.addEventListener("keypress", (e) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				enviarMensagemChat();
			}
		});

	// Carregar histórico
	carregarHistoricoAtendimentos();

	// Carregar vozes
	carregarVozesDisponiveis();

	// Atualizar status do sistema
	carregarStatusSistema();

	// Carregar Agentes
	carregarAgentes();
	carregarSeletorAgentes();

	// Atualizar preview do modelo
	atualizarModeloAgente();

	// Configurar event listeners
	configurarEventListeners();

	// Mostrar aba inicial
	mostrarAba("configuracao");

	console.log("Sistema Atende AI inicializado com sucesso!");
}

/**
 * Configurar event listeners
 */
function configurarEventListeners() {
	// Botões de navegação
	document.querySelectorAll(".nav-btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			const aba = btn.dataset.tab;
			mostrarAba(aba);
		});
	});

	// Botões de configuração (Defensivo: verifica se ID existe)
	const btnGeral = document.getElementById("btn-salvar-config");
	if (btnGeral) btnGeral.addEventListener("click", salvarConfigGeral);

	const btnVoz = document.getElementById("btn-salvar-voz");
	if (btnVoz) btnVoz.addEventListener("click", salvarConfigVoz);

	const btnScripts = document.getElementById("btn-salvar-scripts");
	if (btnScripts) btnScripts.addEventListener("click", salvarConfigScripts);

	const btnIntegracoes = document.getElementById("btn-salvar-integracoes");
	if (btnIntegracoes) {
		btnIntegracoes.addEventListener("click", () => {
			mostrarNotificacao("Configurações de integração salvas!", "success");
		});
	}

	// Botões de teste
	document
		.getElementById("btn-testar-voz")
		.addEventListener("click", testarVoz);
	document.getElementById("btn-parar-voz").addEventListener("click", pararFala);

	// Botões de atendimento
	document
		.getElementById("btn-iniciar-atendimento")
		.addEventListener("click", iniciarAtendimento);
	document
		.getElementById("btn-parar-atendimento")
		.addEventListener("click", pararAtendimento);
	document
		.getElementById("btn-send-manual")
		.addEventListener("click", enviarMensagemManual);
	document
		.getElementById("btn-transferir")
		.addEventListener("click", transferirAtendimento);
	document
		.getElementById("btn-encerrar")
		.addEventListener("click", encerrarAtendimento);

	// Enter no campo de mensagem manual
	document
		.getElementById("manual-message")
		.addEventListener("keypress", (e) => {
			if (e.key === "Enter") {
				enviarMensagemManual();
			}
		});

	// Botões de histórico
	document
		.getElementById("btn-filtrar")
		.addEventListener("click", filtrarHistorico);
	document
		.getElementById("btn-limpar-filtros")
		.addEventListener("click", limparFiltros);
	document
		.getElementById("btn-exportar-historico")
		.addEventListener("click", exportarHistorico);
	document
		.getElementById("btn-fechar-detalhes")
		.addEventListener("click", fecharDetalhes);

	// Botões de utilitários
	document
		.getElementById("btn-resetar-config")
		.addEventListener("click", resetarConfiguracoes);
	document
		.getElementById("btn-exportar-config")
		.addEventListener("click", exportarConfiguracoes);
	document
		.getElementById("input-importar-config")
		.addEventListener("change", importarConfiguracoes);

	// Slider de velocidade da fala (visualização instantânea)
	const sliderVelocidade = document.getElementById("velocidade-fala");
	const valorVelocidade = document.getElementById("velocidade-valor");

	if (sliderVelocidade && valorVelocidade) {
		// Atualizar imediatamente ao mover (input event)
		sliderVelocidade.addEventListener("input", (e) => {
			const valor = parseFloat(e.target.value).toFixed(1);
			valorVelocidade.textContent = `${valor}x`;
		});

		// Garantir que o valor inicial esteja correto
		valorVelocidade.textContent = `${parseFloat(sliderVelocidade.value).toFixed(1)}x`;
	}

	// Atualização automática do preview
	document
		.querySelectorAll("#config-geral input, #config-geral select")
		.forEach((element) => {
			element.addEventListener("change", atualizarModeloAgente);
		});
	// Sincronização em tempo real entre caixas de comportamento (Config Geral vs Modal Edição)
	const syncComportamento = (sourceId, targetId) => {
		const source = document.getElementById(sourceId);
		const target = document.getElementById(targetId);
		if (!source || !target) return;

		source.addEventListener("input", () => {
			// Só sincronizar se o ID do agente no modal for o mesmo do playground
			const activeId = document.getElementById(
				"agente-seletor-playground",
			)?.value;
			const modalId = document.getElementById("agente-id-edit")?.value;
			if (activeId && modalId && activeId === modalId) {
				target.value = source.value;
			}
			// Também atualizar o preview visual do card de comportamento se houver
			const textoComportamento = document.getElementById(
				"agente-comportamento-texto",
			);
			if (textoComportamento && activeId === modalId) {
				textoComportamento.textContent =
					source.value || "Nenhum comportamento definido.";
			}
		});
	};

	syncComportamento("instrucao-comportamental-config", "agente-instrucao");
	syncComportamento("agente-instrucao", "instrucao-comportamental-config");

	// Sincronização de Voz
	const syncVoz = (sourceId, targetId) => {
		const source = document.getElementById(sourceId);
		const target = document.getElementById(targetId);
		if (!source || !target) return;
		source.addEventListener("change", () => {
			const activeId = document.getElementById(
				"agente-seletor-playground",
			)?.value;
			const modalId = document.getElementById("agente-id-edit")?.value;
			if (activeId && modalId && activeId === modalId)
				target.value = source.value;
		});
	};
	syncVoz("tom-voz-audio", "agente-voz");
	syncVoz("agente-voz", "tom-voz-audio");

	// Sincronização de Velocidade
	const syncVelo = (sourceId, targetId, updateText = false) => {
		const source = document.getElementById(sourceId);
		const target = document.getElementById(targetId);
		if (!source || !target) return;
		source.addEventListener("input", () => {
			const activeId = document.getElementById(
				"agente-seletor-playground",
			)?.value;
			const modalId = document.getElementById("agente-id-edit")?.value;
			if (activeId && modalId && activeId === modalId) {
				target.value = source.value;
				if (updateText) {
					const vVal = document.getElementById("velocidade-valor");
					if (vVal)
						vVal.textContent = `${parseFloat(source.value).toFixed(1)}x`;
				}
			}
		});
	};
	syncVelo("velocidade-fala", "agente-velocidade");
	syncVelo("agente-velocidade", "velocidade-fala", true);

	// Sincronização de saudação
	const syncText = (sourceId, targetId) => {
		const source = document.getElementById(sourceId);
		const target = document.getElementById(targetId);
		if (!source || !target) return;
		source.addEventListener("input", () => {
			const activeId = document.getElementById(
				"agente-seletor-playground",
			)?.value;
			const modalId = document.getElementById("agente-id-edit")?.value;
			if (activeId && modalId && activeId === modalId)
				target.value = source.value;
		});
	};
	syncText("script-saudacao", "agente-saudacao");
	syncText("agente-saudacao", "script-saudacao");
}

// Inicializar quando DOM estiver pronto
document.addEventListener("DOMContentLoaded", inicializarAplicacao);

// ==========================================
// CUSTOM UI ALERTS (Bypass Native Constraints)
// ==========================================
function customConfirm(message) {
	return new Promise((resolve) => {
		const overlay = document.createElement("div");
		overlay.style =
			"position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);";
		overlay.innerHTML = `
			<div style="background:white;padding:25px;border-radius:12px;width:320px;box-shadow:0 10px 25px rgba(0,0,0,0.2);text-align:center;font-family:Inter,sans-serif;">
				<h3 style="margin-top:0;color:#1e293b;font-size:1.1rem;">Atenção</h3>
				<p style="color:#475569;font-size:0.9rem;margin-bottom:20px;">${message}</p>
				<div style="display:flex;gap:10px;justify-content:center;">
					<button id="cc-cancel" style="padding:8px 16px;border:none;border-radius:6px;background:#e2e8f0;color:#475569;cursor:pointer;font-weight:600;">Cancelar</button>
					<button id="cc-confirm" style="padding:8px 16px;border:none;border-radius:6px;background:#ef4444;color:white;cursor:pointer;font-weight:600;">Sim, Excluir</button>
				</div>
			</div>
		`;
		document.body.appendChild(overlay);

		overlay.querySelector("#cc-cancel").onclick = () => {
			overlay.remove();
			resolve(false);
		};
		overlay.querySelector("#cc-confirm").onclick = () => {
			overlay.remove();
			resolve(true);
		};
	});
}

function customPrompt(message, defaultVal = "") {
	return new Promise((resolve) => {
		const overlay = document.createElement("div");
		overlay.style =
			"position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);";
		overlay.innerHTML = `
			<div style="background:white;padding:25px;border-radius:12px;width:400px;box-shadow:0 10px 25px rgba(0,0,0,0.2);font-family:Inter,sans-serif;">
				<h3 style="margin-top:0;color:#1e293b;font-size:1.1rem;text-align:center;">${message}</h3>
				<textarea id="cp-input" style="width:100%;height:100px;padding:10px;margin-bottom:20px;border:1px solid #cbd5e1;border-radius:6px;resize:vertical;font-family:inherit;">${defaultVal}</textarea>
				<div style="display:flex;gap:10px;justify-content:flex-end;">
					<button id="cp-cancel" style="padding:8px 16px;border:none;border-radius:6px;background:#e2e8f0;color:#475569;cursor:pointer;font-weight:600;">Cancelar</button>
					<button id="cp-confirm" style="padding:8px 16px;border:none;border-radius:6px;background:#3b82f6;color:white;cursor:pointer;font-weight:600;">Salvar</button>
				</div>
			</div>
		`;
		document.body.appendChild(overlay);
		const input = overlay.querySelector("#cp-input");
		input.focus();

		overlay.querySelector("#cp-cancel").onclick = () => {
			overlay.remove();
			resolve(null);
		};
		overlay.querySelector("#cp-confirm").onclick = () => {
			overlay.remove();
			resolve(input.value);
		};
	});
}
