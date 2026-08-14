#!/usr/bin/env python3
# BLADE:13 构建: src/*.js 字典序合并 -> terser -> roadroller -> zip, 全程报字节
import re, sys, subprocess, pathlib, zipfile

ROOT = pathlib.Path(__file__).resolve().parent
SRC, BUILD, DIST = ROOT / 'src', ROOT / 'build', ROOT / 'build' / 'dist'
LIMIT = 13312
TARGET = 13100
BIN = ROOT / 'node_modules' / '.bin'
TERSER, ROADROLLER = BIN / 'terser', BIN / 'roadroller'
ROADROLLER_ARGS = ['-Zab32', '-Zlr1500', '-Zpr14', '-S0,1,2,3,7,13,25,42,50,70,297,404']

def run(cmd):
    return subprocess.run([str(x) for x in cmd], cwd=ROOT, capture_output=True, text=True)

def main():
    if not TERSER.is_file() or not ROADROLLER.is_file():
        print('FAIL 缺少固定版本构建工具，请先运行 npm ci')
        sys.exit(1)
    BUILD.mkdir(exist_ok=True); DIST.mkdir(parents=True, exist_ok=True)
    files = sorted(SRC.glob('*.js'))
    code = '\n'.join(f.read_text(encoding='utf-8') for f in files)
    (BUILD / 'game.js').write_text(code, encoding='utf-8')
    # 逻辑层(供 node 测试, 不含 canvas/DOM)
    logic = '\n'.join(f.read_text(encoding='utf-8') for f in files if f.name[:2] in ('00', '10', '15', '20', '30', '50'))
    (BUILD / 'logic.js').write_text(logic, encoding='utf-8')

    shell = (ROOT / 'tools' / 'shell.html').read_text(encoding='utf-8')
    (BUILD / 'BLADE13-dev.html').write_text(shell.replace('/*CODE*/', code), encoding='utf-8')

    # 红线: 禁止任何外部请求
    bad = re.findall(r'\b(fetch|XMLHttpRequest|importScripts)\s*\(', code)
    if bad:
        print('FAIL 违反 js13k 离线红线:', set(bad)); sys.exit(1)

    # minify
    r = run([TERSER, 'build/game.js', '-c', 'passes=3', '-m', 'toplevel=true', '--format', 'semicolons=true', '-o', 'build/game.min.js'])
    if r.returncode:
        print('terser 失败:\n', r.stderr[:800]); sys.exit(1)
    mn = (BUILD / 'game.min.js').read_text(encoding='utf-8')

    # roadroller
    # 显式固定优化参数，避免 Roadroller 默认随机搜索造成构建漂移。
    r = run([ROADROLLER, *ROADROLLER_ARGS, 'build/game.min.js', '-o', 'build/game.pack.js'])
    if r.returncode:
        print('roadroller 失败:\n', r.stderr[:800]); sys.exit(1)
    packed = (BUILD / 'game.pack.js').read_text(encoding='utf-8') if (BUILD / 'game.pack.js').exists() else None
    use_pack = packed and len(packed) < len(mn)
    final_js = packed if use_pack else mn

    (DIST / 'index.html').write_text(shell.replace('/*CODE*/', final_js), encoding='utf-8')
    zp = BUILD / 'BLADE13.zip'
    info = zipfile.ZipInfo('index.html', date_time=(1980, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    info.create_system = 3
    info.external_attr = 0o100644 << 16
    with zipfile.ZipFile(zp, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        archive.writestr(info, (DIST / 'index.html').read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)

    z = zp.stat().st_size
    print('--- BLADE:13 build ---')
    print(f'模块      {len(files)} 个, 源码 {len(code):>7,} B')
    print(f'terser    {len(mn):>7,} B')
    print(f'roadroller{len(packed) if packed else 0:>7,} B  {"(采用)" if use_pack else "(未采用)"}')
    print(f'zip       {z:>7,} B   剩余 {LIMIT - z:>6,} B / {LIMIT}')
    print(f'交付余量  {TARGET - z:>7,} B / {TARGET}')
    print('预算占用  %.1f%%' % (z * 100 / LIMIT))
    if z > LIMIT: print('!! 超出 13KB'); sys.exit(1)
    if z > TARGET: print(f'!! 超出交付目标 {TARGET} B'); sys.exit(1)

if __name__ == '__main__':
    main()
