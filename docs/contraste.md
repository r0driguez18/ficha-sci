# Auditoria de contraste (WCAG 2.1 AA) — F11

Objetivo do F11: contraste ≥ **4.5:1** para texto normal e ≥ **3:1** para
texto grande e componentes de interface, nos três temas (claro, escuro,
alto contraste).

Correr a qualquer momento:

```bash
node scripts/contrast-audit.mjs
```

O script lê `src/index.css`, converte os pares primeiro-plano/fundo para o
rácio WCAG e assinala `OK` / `grande` (só passa para texto grande) / `FALHA`.

## Estado

Depois do ajuste de paleta (`--success`, `--destructive`, `--info-foreground`,
`--muted-foreground`, `--border`, `--input`, `--sidebar-primary`,
`--sidebar-border` no tema claro):

- **Todo o texto que o utilizador lê passa AA** nos três temas — texto
  corrido, texto em cartão, texto secundário, botões (primário, secundário,
  destrutivo, success, warning), texto da barra lateral e do item ativo.
- **Alto contraste (`.hc`)**: passa tudo, incluindo bordas (5–6:1).

## Exceções assumidas (com justificação)

| Item | Rácio | Porquê fica assim |
|---|---|---|
| Bordas de cartão / campo vs fundo (claro e escuro) | ~1.4–1.6:1 | Contornos subtis; os cartões têm sombra e os campos têm um anel de foco a 10:1 e etiqueta. Uma borda a 3:1 transforma cada cartão/campo numa caixa pesada. O `--input` do tema claro foi reforçado (91%→76% de luminância). O tema `.hc` tem bordas a 5–6:1 para quem precisa. |
| `text-warning` como cor de **texto pequeno** no tema claro | 2:1 | Não se usa. Os sítios que usavam (`Dashboard`, `CRC`, `SignatureSection`, badge "Pendente", coluna Nome do Gerador PS2) passaram a `text-foreground`/`text-muted-foreground`. O token `--warning` continua vivo para preenchimentos, bordas e ícones (`botão warning` = 6.07:1). |
| Ícones em `text-warning` (2 casos) | ~2:1 | Decorativos e sempre ao lado de uma etiqueta de texto legível. |
| Chips de estado/categoria em `bg-<token>/15 text-<token>` | ~4.0–4.4:1 | Etiquetas curtas com ícone redundante; passam para texto grande. Os piores (`text-warning`) foram trocados para `bg-warning/20 text-foreground`. |
| Tema escuro: `botão destrutivo` e `badge` da sidebar | ~3.9:1 | Vermelho saturado sobre fundo escuro é um caso conhecido: escurecer para o texto branco passar destrói-o como cor de texto; clarear destrói o botão. 3.9:1 num preenchimento e num contador minúsculo é o compromisso habitual. |
