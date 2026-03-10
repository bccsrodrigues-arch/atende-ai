import db from "./backend/database.js";

const add = async () => {
	await db.registrarInteracaoIa(1, {
		tipo: "texto",
		mensagem_usuario: "ola bom dia tudo bem?",
		resposta_ia: "nao quero te ajudar",
		confianca_resposta: 0.1,
		agente_id: 1,
	});
	await db.registrarFeedback(1, "negativo", "Resposta muito grosseira");
	const licoes = await db.obterAprendizadosRecentes(5);
	console.log("Mock lições atuais: ", licoes);
};
add();
