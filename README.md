
Para executar basta acessar a pasta app e executar o comando nodemon 
<code>index.ts qrs ['build | 'init']</code>


# INIT
- <init> Cria um arquivo com as configurações de mininficação do código.

EXEMPLO: <code>index.ts qrs init</code>


# BUILD
- <build> Minifica o código (HTML, CSS, JS) de acordo com as configurações colocadas no arquivo qrs_config.json, depois de minificar o código, é gerado QRCODE de maneira paginada da aplicação, conforme o tamenho do seu código, será gerado um número diferente de imagens com QRCODE.


EXEMPLO: <code>index.ts qrs build</code>
  