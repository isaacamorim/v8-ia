@ -1, 62 + 0, 0 @@
    class CarrinhoManager {
        constructor() {
            this.carrinhoKey = 'carrinho_reposicao';
            this.carregarCarrinho();
        }

        carregarCarrinho() {
            const carrinhoSalvo = localStorage.getItem(this.carrinhoKey);
            this.carrinho = carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
            this.atualizarContador();
        }

        salvarCarrinho() {
            localStorage.setItem(this.carrinhoKey, JSON.stringify(this.carrinho));
            this.atualizarContador();
        }

        adicionarItem(produto, quantidade) {
            const itemExistente = this.carrinho.find(item => item.id === produto.id);

            if (itemExistente) {
                itemExistente.quantidade += quantidade;
            } else {
                this.carrinho.push({
                    id: produto.id,
                    codigo: produto.codigo,
                    nome: produto.nome,
                    quantidade: quantidade,
                    preco: produto.preco,
                    imagem: produto.imagem
                });
            }

            this.salvarCarrinho();
        }

        removerItem(id) {
            this.carrinho = this.carrinho.filter(item => item.id !== id);
            this.salvarCarrinho();
        }

        atualizarQuantidade(id, novaQuantidade) {
            const item = this.carrinho.find(item => item.id === id);
            if (item) {
                item.quantidade = novaQuantidade;
                this.salvarCarrinho();
            }
        }

        limparCarrinho() {
            this.carrinho = [];
            localStorage.removeItem(this.carrinhoKey);
            this.atualizarContador();
        }

        atualizarContador() {
            const totalItens = this.carrinho.reduce((total, item) => total + item.quantidade, 0);
            document.getElementById('cartCount').textContent = totalItens;
        }
    }

const carrinho = new CarrinhoManager();