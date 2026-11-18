"""Testes do worker (sem core, sem rede): python test_worker.py  (sai com 1 se alguma verificação falhar)."""
import datetime as dt
import logging
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import worker  # noqa: E402

falhas = 0


def check(nome, cond):
    global falhas
    print(('OK   ' if cond else 'FALHA'), nome)
    falhas += 0 if cond else 1


def registo_gbapl(**c):
    """Uma linha da GBAPL (54 valores) pela ordem conhecida."""
    l = [''] * len(worker.CODIGOS_GBAPL)
    por = {'ACEMP': 'ORD_PS2_01', 'ACSQAP': 1, 'ACFILE': 'SACERM11A', 'ACHORA': 103752, 'ACDTIN': 20261117, 'ACNOPR': 123456789,
           'ACUSER': 'NALVES', 'ACNMOV': 10, 'ACTAPL': 10}
    por.update(c)
    for k, v in por.items():
        l[worker.CODIGOS_GBAPL.index(k)] = v
    return l


class Log:
    def __init__(self):
        self.msgs = []

    def info(self, m, *a):
        self.msgs.append(m % a)

    def error(self, m, *a):
        self.msgs.append(m % a)

    def exception(self, m, *a):
        self.msgs.append(m % a)


# ---------------------------------------------------------------- consulta ao log: sem DC
q, dias = worker.consulta_do_pedido('2026-11-11')
check('o log não traz os DC', q == "SELECT * FROM PROMOF0003.$PLOGITF WHERE $PLODTPR IN (20261111, 20261112) AND $PLOMOD <> 'DC'")
check('descrição dos dias', dias == '2026-11-11 e 2026-11-12')
check('CORE_QUERY manda', worker.consulta_do_pedido('2026-11-11', 'SELECT 1') == ('SELECT 1', None))
try:
    worker.consulta_do_pedido('lixo')
    check('data inválida é erro', False)
except ValueError:
    check('data inválida é erro', True)

# ---------------------------------------------------------------- registos_dc
r = worker.registos_dc([registo_gbapl(), registo_gbapl(ACSQAP=2, ACNOPR=123456790, ACEMP='MSCC')])
check('2 operações', len(r) == 2)
check('campos da chave', r[0]['data'] == '2026-11-17' and r[0]['empresa'] == 'ORD_PS2_01' and r[0]['seq'] == 1 and r[0]['n_operacao'] == '123456789')
check('a linha vai em bruto (54 valores)', len(r[0]['linha']) == 54 and r[0]['linha'][worker.CODIGOS_GBAPL.index('ACFILE')] == 'SACERM11A')
check('nº de operação 0 ou vazio fica de fora', worker.registos_dc([registo_gbapl(ACNOPR=0), registo_gbapl(ACNOPR='')]) == [])
check('data inválida fica de fora', worker.registos_dc([registo_gbapl(ACDTIN=20261399), registo_gbapl(ACDTIN=0)]) == [])
check('linha curta fica de fora', worker.registos_dc([['ACEMP', 'x']]) == [])
codigos = list(worker.CODIGOS_GBAPL)
check('o registo de códigos não conta como operação', len(worker.registos_dc([codigos, registo_gbapl()])) == 1)
# códigos noutra ordem: lê pela linha de códigos
curta = ['ACEMP', 'ACSQAP', 'ACDTIN', 'ACNOPR']  # só 4 colunas, numa ordem diferente da conhecida
check('usa o registo de códigos quando vem', worker.registos_dc([curta, ['MSCC', 7, 20261117, 555]])[0]['empresa'] == 'MSCC')
try:
    worker.registos_dc([['ACEMP', 'ACSQAP', 'XX'], ['a', 1, 'b']])
    check('faltam colunas importantes: erro', False)
except ValueError as e:
    check('faltam colunas importantes: erro', 'estrutura' in str(e))

# ---------------------------------------------------------------- hora marcada da cópia
d = lambda h, m: dt.datetime(2026, 11, 17, h, m, 30)  # noqa: E731
check('de 10 em 10 minutos', worker.slot_da_copia(d(14, 10)) == '2026-11-17 14:10' and worker.slot_da_copia(d(14, 0)) == '2026-11-17 14:00')
check('fora das horas marcadas não copia', worker.slot_da_copia(d(14, 7)) is None and worker.slot_da_copia(d(23, 51)) is None)
check('23:55 e 23:59 também', worker.slot_da_copia(d(23, 55)) == '2026-11-17 23:55' and worker.slot_da_copia(d(23, 59)) == '2026-11-17 23:59')
check('a mesma hora marcada tem sempre a mesma chave (copia uma vez)', worker.slot_da_copia(dt.datetime(2026, 11, 17, 14, 10, 1)) == worker.slot_da_copia(dt.datetime(2026, 11, 17, 14, 10, 58)))


# ---------------------------------------------------------------- copiar_dc
class App:
    def __init__(self, falha=False):
        self.lotes = []
        self.falha = falha

    def guardar_dc(self, regs):
        if self.falha:
            raise RuntimeError('rede em baixo')
        self.lotes.append(regs)
        return len(regs)


log = Log()
app = App()
n = worker.copiar_dc(app, log, ler=lambda q: ([], [registo_gbapl(ACNOPR=1000 + i) for i in range(2500)]))
check('copia em lotes de 1000', n == 2500 and [len(x) for x in app.lotes] == [1000, 1000, 500])
vistas = []
worker.copiar_dc(App(), Log(), ler=lambda q: vistas.append(q) or ([], []))
check('a query é a da GBAPL', vistas == ['SELECT * FROM GBANCA0003.GBAPL'])

os.environ['CORE_SENHA'] = 'segredo123'
log = Log()
check('falha da rede não levanta erro', worker.copiar_dc(App(falha=True), log, ler=lambda q: ([], [registo_gbapl()])) is None)
log = Log()
worker.copiar_dc(App(), log, ler=lambda q: (_ for _ in ()).throw(RuntimeError('login falhou com segredo123')))
check('falha do core: não levanta erro e mascara a senha', log.msgs and 'segredo123' not in log.msgs[0] and '***' in log.msgs[0])


# ---------------------------------------------------------------- tratar_pedido faz a cópia primeiro
class AppPedido:
    def __init__(self):
        self.entregas = []

    def entregar(self, pid, colunas, linhas, erro):
        self.entregas.append((pid, colunas, linhas, erro))


ordem = []
ap = AppPedido()
worker.tratar_pedido(ap, {'id': 'p1', 'data': '2026-11-17'}, lambda p: ordem.append('ler') or (['C'], [[1]], 'x'), Log(), lambda: ordem.append('copiar'))
check('copia os DC antes de ler o pedido', ordem == ['copiar', 'ler'] and ap.entregas == [('p1', ['C'], [[1]], None)])

print('\nFALHAS:', falhas)
sys.exit(1 if falhas else 0)
