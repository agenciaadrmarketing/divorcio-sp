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

Teste rápido: abra `URL/exec?nome=Teste&email=t@t.com&whatsapp=11999999999` no navegador;
deve aparecer `{"status":"ok"}` e uma nova linha na planilha.
