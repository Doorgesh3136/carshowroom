"""
Tiny SCSS compiler for this project.

Why it exists: the build box has no Sass binary. If `sass` or `sassc` is on PATH,
build.py uses that instead, so the .scss files are ordinary SCSS and nothing here
is a lock-in.

Supported (everything the partials in src/scss use):
  // and /* */ comments, $variables, #{interpolation}, nested rules with &,
  nested @media / @supports (bubbled up), @mixin / @include with default args and @content,
  @each $x in a, b, c   @for $i from 1 through N,   number maths with * + - and (brackets) (outside calc()).
A file whose first line is `/* @raw */` is copied untouched (used for the legacy plain-CSS partial).
"""
import os, re

class SCSSError(Exception):
    pass

# ---------------------------------------------------------------- parsing
def _skip_ws(t, i):
    n = len(t)
    while i < n:
        if t[i].isspace():
            i += 1
        elif t.startswith('//', i):
            j = t.find('\n', i)
            i = n if j < 0 else j + 1
        elif t.startswith('/*', i):
            j = t.find('*/', i + 2)
            i = n if j < 0 else j + 2
        else:
            break
    return i

def _read_head(t, i):
    """Read up to the first ; { } at depth 0 (strings, parens and #{} respected)."""
    n, start, par = len(t), i, 0
    while i < n:
        c = t[i]
        if c in '"\'':
            q = c; i += 1
            while i < n and t[i] != q:
                i += 2 if t[i] == '\\' else 1
            i += 1; continue
        if t.startswith('#{', i):
            d = 0
            while i < n:
                if t[i] == '{': d += 1
                elif t[i] == '}':
                    d -= 1
                    if d == 0: i += 1; break
                i += 1
            continue
        if c == '(': par += 1
        elif c == ')': par -= 1
        elif par <= 0 and c in ';{}':
            return t[start:i].strip(), i
        i += 1
    return t[start:i].strip(), i

def parse(t, i=0, top=True):
    nodes, n = [], len(t)
    while True:
        i = _skip_ws(t, i)
        if i >= n:
            if not top: raise SCSSError('missing }')
            return nodes, i
        if t[i] == '}':
            if top: raise SCSSError('unexpected }')
            return nodes, i + 1
        head, i = _read_head(t, i)
        end = t[i] if i < n else ';'
        if end == '{':
            kids, i = parse(t, i + 1, False)
            nodes.append(('block', head, kids))
        else:
            if end == ';': i += 1
            if head: nodes.append(('stmt', head))
    return nodes, i

# ---------------------------------------------------------------- values
def _split_top(s, sep=','):
    out, d, cur, q = [], 0, [], None
    for ch in s:
        if q:
            cur.append(ch)
            if ch == q: q = None
            continue
        if ch in '"\'': q = ch; cur.append(ch); continue
        if ch in '([{': d += 1
        elif ch in ')]}': d -= 1
        if ch == sep and d == 0:
            out.append(''.join(cur).strip()); cur = []
        else:
            cur.append(ch)
    last = ''.join(cur).strip()
    if last or out: out.append(last)
    return out

def _fmt(x):
    s = ('%.4f' % x).rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s

_NUM = r'(-?\d*\.?\d+)([a-z%]*)'
_MATH = re.compile(r'(?<![\w.#$-])' + _NUM + r'\s+([*+-])\s+' + _NUM + r'(?![\w.])')
_PAREN = re.compile(r'(?<![\w-])\(\s*(-?\d*\.?\d+[a-z%]*)\s*\)')

def _maths(s):
    keep = []
    def hold(m):
        keep.append(m.group(0)); return '\x00%d\x00' % (len(keep) - 1)
    # leave calc()/var()/url() and strings alone
    s = re.sub(r'(calc|var|url|min|max|clamp)\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)|"[^"]*"|\'[^\']*\'', hold, s)
    prev = None
    while prev != s:
        prev = s
        def rep(m):
            a, ua, op, b, ub = float(m.group(1)), m.group(2), m.group(3), float(m.group(4)), m.group(5)
            if op == '*':
                if ua and ub: return m.group(0)
                return _fmt(a * b) + (ua or ub)
            if ua != ub and ua and ub: return m.group(0)
            return _fmt(a + b if op == '+' else a - b) + (ua or ub)
        s = _MATH.sub(rep, s)
        s = _PAREN.sub(lambda m: m.group(1), s)
    return re.sub(r'\x00(\d+)\x00', lambda m: keep[int(m.group(1))], s)

class Ctx:
    def __init__(self):
        self.vars = [{}]
        self.mixins = {}
        self.out = []   # (media_tuple, selector, [decl strings])
    def get(self, k):
        for d in reversed(self.vars):
            if k in d: return d[k]
        raise SCSSError('undefined variable $' + k)
    def set(self, k, v): self.vars[-1][k] = v

def sub(ctx, s):
    # #{ ... } first (may hold a variable), then bare $vars
    def interp(m):
        return sub(ctx, m.group(1))
    s = re.sub(r'#\{([^}]*)\}', interp, s)
    s = re.sub(r'\$([A-Za-z_][\w-]*)', lambda m: ctx.get(m.group(1)), s)
    return s

def value(ctx, s):
    return _maths(sub(ctx, s)).strip()

# ---------------------------------------------------------------- evaluation
def _join(parents, child):
    outs = []
    for c in _split_top(child):
        for p in (parents or ['']):
            if '&' in c: outs.append(c.replace('&', p) if p else c.replace('&', ''))
            else: outs.append((p + ' ' + c).strip())
    return outs

def run(ctx, nodes, sels, media, block_out, content=None):
    """block_out: dict holding the current rule's declaration list (so decls after children still land)."""
    for node in nodes:
        if node[0] == 'stmt':
            st = node[1]
            if st.startswith('$'):
                m = re.match(r'\$([\w-]+)\s*:\s*(.*?)(\s*!default)?$', st, re.S)
                if not m: raise SCSSError('bad variable: ' + st)
                if m.group(3) and any(m.group(1) in d for d in ctx.vars): continue
                ctx.set(m.group(1), value(ctx, m.group(2)))
            elif st.startswith('@include'):
                include(ctx, st, None, sels, media, block_out)
            elif st.startswith('@content'):
                if content: content(sels, media, block_out)
            elif st.startswith('@import'):
                raise SCSSError('@import must be resolved before compiling')
            elif st.startswith('@charset'):
                pass
            elif st.startswith('@'):
                ctx.out.append((media, st + ';', None))
            else:
                if ':' not in st: raise SCSSError('bad declaration: ' + st)
                p, v = st.split(':', 1)
                if not sels: raise SCSSError('declaration outside a rule: ' + st)
                block_out['decls'].append(sub(ctx, p).strip() + ':' + value(ctx, v))
        else:
            _, head, kids = node
            if head.startswith('@mixin'):
                m = re.match(r'@mixin\s+([\w-]+)\s*(?:\((.*)\))?$', head, re.S)
                params = []
                for a in _split_top(m.group(2) or ''):
                    if not a: continue
                    k, _, d = a.partition(':')
                    params.append((k.strip().lstrip('$'), d.strip() or None))
                ctx.mixins[m.group(1)] = (params, kids)
            elif head.startswith('@include'):
                include(ctx, head, kids, sels, media, block_out)
            elif head.startswith('@each'):
                m = re.match(r'@each\s+\$([\w-]+)\s+in\s+(.*)$', head, re.S)
                lst = sub(ctx, m.group(2)).strip()
                if lst.startswith('(') and lst.endswith(')'): lst = lst[1:-1]
                for item in _split_top(lst):
                    ctx.vars.append({m.group(1): item}); run(ctx, kids, sels, media, block_out, content); ctx.vars.pop()
            elif head.startswith('@for'):
                m = re.match(r'@for\s+\$([\w-]+)\s+from\s+(.*?)\s+(through|to)\s+(.*)$', head, re.S)
                a, b = int(float(value(ctx, m.group(2)))), int(float(value(ctx, m.group(4))))
                if m.group(3) == 'to': b -= 1
                for k in range(a, b + 1):
                    ctx.vars.append({m.group(1): str(k)}); run(ctx, kids, sels, media, block_out, content); ctx.vars.pop()
            elif head.startswith('@media') or head.startswith('@supports'):
                kind, _, q = head.partition(' ')
                q = value(ctx, q)
                new = media + ((kind + ' ' + q),)
                inner = {'decls': []}
                run(ctx, kids, sels, new, inner, content)
                flush(ctx, sels, new, inner)
            elif head.startswith('@keyframes') or head.startswith('@-webkit-keyframes'):
                frames = []
                for kid in kids:
                    if kid[0] != 'block': continue
                    d = {'decls': []}
                    run(ctx, kid[2], [kid[1]], media, d, content)
                    frames.append(kid[1].replace(' ', '') + '{' + ';'.join(d['decls']) + '}')
                ctx.out.append((media, sub(ctx, head) + '{' + ''.join(frames) + '}', None))
            elif head.startswith('@font-face'):
                d = {'decls': []}
                run(ctx, kids, ['@font-face'], media, d, content)
                ctx.out.append((media, '@font-face', d['decls']))
            else:
                new_sels = _join(sels, sub(ctx, head))
                flush(ctx, sels, media, block_out)
                inner = {'decls': []}
                run(ctx, kids, new_sels, media, inner, content)
                flush(ctx, new_sels, media, inner)

def flush(ctx, sels, media, block_out):
    if block_out['decls'] and sels:
        ctx.out.append((media, ','.join(sels), list(block_out['decls'])))
    block_out['decls'] = []

def include(ctx, head, kids, sels, media, block_out):
    m = re.match(r'@include\s+([\w-]+)\s*(?:\((.*)\))?\s*$', head, re.S)
    if not m: raise SCSSError('bad @include: ' + head)
    name = m.group(1)
    if name not in ctx.mixins: raise SCSSError('unknown mixin ' + name)
    params, body = ctx.mixins[name]
    args = [a for a in _split_top(m.group(2) or '')]
    frame = {}
    for i, (k, d) in enumerate(params):
        if i < len(args) and args[i]: frame[k] = value(ctx, args[i])
        elif d is not None: frame[k] = value(ctx, d)
        else: raise SCSSError('missing argument $%s for mixin %s' % (k, name))
    ctx.vars.append(frame)
    def content(c_sels, c_media, c_out):
        if kids is not None:
            ctx.vars.pop(); run(ctx, kids, c_sels, c_media, c_out); ctx.vars.append(frame)
    run(ctx, body, sels, media, block_out, content)
    ctx.vars.pop()

def render(ctx):
    # group consecutive identical media contexts
    lines, i = [], 0
    out = ctx.out
    while i < len(out):
        media = out[i][0]
        j = i
        chunk = []
        while j < len(out) and out[j][0] == media:
            _, sel, decls = out[j]
            if decls is None: chunk.append(sel if sel.endswith(';') or sel.endswith('}') else sel)
            else: chunk.append('%s{%s}' % (sel, ';'.join(decls)))
            j += 1
        body = '\n'.join(chunk)
        for q in reversed(media): body = '%s{\n%s\n}' % (q, body)
        lines.append(body)
        i = j
    return '\n'.join(lines)

# ---------------------------------------------------------------- files
def _resolve(base_dir, name):
    d, f = os.path.split(name)
    for cand in (os.path.join(base_dir, d, '_' + f + '.scss'), os.path.join(base_dir, d, f + '.scss'),
                 os.path.join(base_dir, d, f)):
        if os.path.isfile(cand): return cand
    raise SCSSError('cannot find ' + name)

def load(path, seen=None):
    """Return list of ('raw', text) | ('scss', text) with @import resolved in order."""
    text = open(path, encoding='utf-8').read()
    if text.lstrip().startswith('/* @raw */'):
        return [('raw', text)]
    parts, buf = [], []
    for line in text.split('\n'):
        m = re.match(r"\s*@import\s+['\"]([^'\"]+)['\"]\s*;", line)
        if m:
            if buf: parts.append(('scss', '\n'.join(buf))); buf = []
            parts.extend(load(_resolve(os.path.dirname(path), m.group(1))))
        else:
            buf.append(line)
    if buf: parts.append(('scss', '\n'.join(buf)))
    return parts

def compile_file(path):
    ctx = Ctx()
    css = []
    pending = []
    def flush_scss():
        if not pending: return
        nodes, _ = parse('\n'.join(pending))
        root = {'decls': []}
        ctx.out = []
        run(ctx, nodes, [], (), root)
        css.append(render(ctx)); pending.clear()
    for kind, text in load(path):
        if kind == 'raw':
            flush_scss(); css.append(text)
        else:
            pending.append(text)
    flush_scss()
    return '\n'.join(css)

if __name__ == '__main__':
    import sys
    print(compile_file(sys.argv[1]))
