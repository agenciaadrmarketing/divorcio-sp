# Integração do formulário com a planilha de leads

Planilha: https://docs.google.com/spreadsheets/d/1PAulss8q6FpJ2_8HfxoVOPkYV92NKaGnxJ9kTedUCOk/edit

## Publicar o script

1. Na planilha: **Extensões → Apps Script**.
2. Apague o conteúdo de `Código.gs` e cole o conteúdo de `Code.gs` desta pasta. Salve.
3. **Implantar → Nova implantação** → tipo **App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. Autorize o acesso e copie a URL que termina em `/exec`.
5. Em `index.html`, substitua o valor `default` de `endpointPlanilha` por essa URL.

Cada lead novo também dispara um e-mail para os endereços em `EMAIL_AVISO`;
o resultado do envio fica na coluna `notificacao`.

Teste rápido: no editor, rode a função `testar` (autorize planilha e e-mail na primeira vez).
Deve aparecer `ok` no log, uma nova linha na planilha e o e-mail de aviso.
