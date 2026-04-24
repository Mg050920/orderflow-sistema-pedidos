const socket = new WebSocket("ws://localhost:8765");

const statusConexao = document.getElementById("statusConexao");
const listaPedidos = document.getElementById("listaPedidos");
const contadorPedidos = document.getElementById("contadorPedidos");
const somPedido = document.getElementById("somPedido");

let pedidosAtuais = [];

socket.onopen = () => {
  statusConexao.textContent = "Servidor conectado";
  statusConexao.className = "conectado";
};

socket.onclose = () => {
  statusConexao.textContent = "Servidor desconectado";
  statusConexao.className = "desconectado";
};

socket.onerror = () => {
  statusConexao.textContent = "Erro na conexão";
  statusConexao.className = "desconectado";
};

socket.onmessage = (evento) => {
  const resposta = JSON.parse(evento.data);

  if (resposta.tipo === "lista_pedidos") {
    renderizarPedidos(resposta.dados);
  }

  if (resposta.tipo === "erro") {
    alert(resposta.dados);
  }
};

function enviarPedido() {
  const cliente = document.getElementById("cliente").value.trim();
  const produto = document.getElementById("produto").value;
  const quantidade = document.getElementById("quantidade").value;
  const observacao = document.getElementById("observacao").value.trim();

  if (!cliente) {
    alert("Informe o nome do cliente.");
    return;
  }

  socket.send(JSON.stringify({
    acao: "novo_pedido",
    dados: {
      cliente,
      produto,
      quantidade,
      observacao
    }
  }));

  document.getElementById("cliente").value = "";
  document.getElementById("quantidade").value = 1;
  document.getElementById("observacao").value = "";
}

function alterarStatus(id, status) {
  socket.send(JSON.stringify({
    acao: "alterar_status",
    dados: {
      id,
      status
    }
  }));
}

function classeStatus(status) {
  if (status === "Recebido") return "recebido";
  if (status === "Em preparo") return "preparo";
  if (status === "Pronto") return "pronto";
  return "finalizado";
}

function renderizarPedidos(pedidos) {
  const novosPedidos = pedidos.length > pedidosAtuais.length;

  listaPedidos.innerHTML = "";
  contadorPedidos.textContent = `${pedidos.length} pedido(s)`;

  if (pedidos.length === 0) {
    listaPedidos.innerHTML = `<p class="vazio">Nenhum pedido registrado ainda.</p>`;
    pedidosAtuais = pedidos;
    return;
  }

  pedidos.forEach((pedido) => {
    const div = document.createElement("div");
    div.className = "pedido aparecer";

    div.innerHTML = `
      <h3>Pedido #${pedido.id}</h3>
      <p><strong>Cliente:</strong> ${pedido.cliente}</p>
      <p><strong>Produto:</strong> ${pedido.produto}</p>
      <p><strong>Quantidade:</strong> ${pedido.quantidade}</p>
      <p><strong>Observação:</strong> ${pedido.observacao || "Sem observação"}</p>
      <p><strong>Horário:</strong> ${pedido.horario}</p>

      <span class="status ${classeStatus(pedido.status)}">${pedido.status}</span>

      <div class="botoes">
        <button onclick="alterarStatus('${pedido.id}', 'Recebido')">Recebido</button>
        <button onclick="alterarStatus('${pedido.id}', 'Em preparo')">Preparo</button>
        <button onclick="alterarStatus('${pedido.id}', 'Pronto')">Pronto</button>
        <button onclick="alterarStatus('${pedido.id}', 'Finalizado')">Finalizado</button>
      </div>
    `;

    listaPedidos.appendChild(div);
  });

  if (novosPedidos) {
    somPedido.play().catch(() => {});
  }

  pedidosAtuais = pedidos;
}