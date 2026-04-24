import asyncio
import json
import uuid
from datetime import datetime

import websockets

clientes_conectados = set()
pedidos = []

def gerar_resposta(tipo, dados):
    return json.dumps({
        "tipo": tipo,
        "dados": dados
    }, ensure_ascii=False)

async def enviar_para_todos(mensagem):
    if clientes_conectados:
        await asyncio.gather(
            *[cliente.send(mensagem) for cliente in clientes_conectados],
            return_exceptions=True
        )

async def processar_mensagem(websocket, mensagem):
    global pedidos

    try:
        pacote = json.loads(mensagem)
        acao = pacote.get("acao")
        dados = pacote.get("dados", {})

        if acao == "novo_pedido":
            novo_pedido = {
                "id": str(uuid.uuid4())[:8],
                "cliente": dados.get("cliente", "Cliente não informado"),
                "produto": dados.get("produto", "Produto não informado"),
                "quantidade": int(dados.get("quantidade", 1)),
                "observacao": dados.get("observacao", ""),
                "status": "Recebido",
                "horario": datetime.now().strftime("%H:%M:%S")
            }

            pedidos.append(novo_pedido)

            await enviar_para_todos(
                gerar_resposta("lista_pedidos", pedidos)
            )

        elif acao == "alterar_status":
            id_pedido = dados.get("id")
            novo_status = dados.get("status")

            for pedido in pedidos:
                if pedido["id"] == id_pedido:
                    pedido["status"] = novo_status
                    break

            await enviar_para_todos(
                gerar_resposta("lista_pedidos", pedidos)
            )

        elif acao == "remover_pedido":
            id_pedido = dados.get("id")
            pedidos = [pedido for pedido in pedidos if pedido["id"] != id_pedido]

            await enviar_para_todos(
                gerar_resposta("lista_pedidos", pedidos)
            )

    except Exception as erro:
        await websocket.send(
            gerar_resposta("erro", f"Erro ao processar mensagem: {erro}")
        )

async def controlar_conexao(websocket):
    clientes_conectados.add(websocket)

    await websocket.send(
        gerar_resposta("lista_pedidos", pedidos)
    )

    try:
        async for mensagem in websocket:
            await processar_mensagem(websocket, mensagem)

    finally:
        clientes_conectados.remove(websocket)

async def iniciar_servidor():
    async with websockets.serve(controlar_conexao, "localhost", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(iniciar_servidor())
