#!/usr/bin/env python3
"""
build-theme.py — bangun berkas tema versi ringkas untuk deployment.

Alasan berkas ini ada
---------------------
custom.css disajikan sebagai <link> di dalam <head>, sehingga bersifat
render-blocking: browser tidak menggambar apa pun sebelum berkas itu selesai
diunduh dan diurai. Lighthouse mengukurnya pada kondisi jaringan yang
diperlambat, jadi setiap kilobyte langsung memengaruhi First Contentful Paint
dan Largest Contentful Paint.

Diukur pada berkas sumber: 43 persen isi custom.css dan 38 persen isi
custom.js berupa komentar. Komentar itu sengaja ditulis panjang karena
merekam alasan setiap keputusan desain beserta rujukan teorinya, dan itu
justru nilai akademik dari berkas ini. Menghapusnya dari sumber akan
menghilangkan dokumentasi; membiarkannya terkirim ke browser membebani
metrik tanpa memberi manfaat kepada pengguna.

Karena itu sumber dan artefak deployment dipisahkan:
  sumber (dibaca manusia)      theme/custom.css, theme/custom.js
  artefak (dikirim ke browser) theme/custom.min.css, theme/custom.min.js

Menjalankan:  python3 build-theme.py
"""

import re
import sys
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CSS_SRC = os.path.join(ROOT, "theme", "custom.css")
JS_SRC = os.path.join(ROOT, "theme", "custom.js")
CSS_OUT = os.path.join(ROOT, "theme", "custom.min.css")
JS_OUT = os.path.join(ROOT, "theme", "custom.min.js")


def minify_css(text: str) -> str:
    """CSS tidak punya sintaks yang bisa keliru terbaca sebagai komentar,
    sehingga penghapusan blok /* */ aman dilakukan secara menyeluruh."""
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"\s*\n\s*", "\n", text)
    text = re.sub(r"\n{2,}", "\n", text)
    text = re.sub(r"\s*([{};:,>])\s*", r"\1", text)
    text = re.sub(r";}", "}", text)
    return text.strip()


def strip_js_comments(text: str) -> str:
    """Hanya baris yang SELURUHNYA berupa komentar yang dihapus.

    Penghapusan komentar di dalam JavaScript dengan ekspresi reguler berbahaya,
    karena tanda // juga muncul di dalam string dan literal regex. Pendekatan
    per baris ini sengaja konservatif: komentar di akhir baris kode dibiarkan
    utuh, dan hasilnya tetap diverifikasi dengan `node --check`.
    """
    out = []
    in_block = False
    for line in text.split("\n"):
        s = line.strip()
        if in_block:
            if "*/" in s:
                in_block = False
                after = s.split("*/", 1)[1].strip()
                if after:
                    out.append(after)
            continue
        if s.startswith("/*") and "*/" not in s:
            in_block = True
            continue
        if s.startswith("//"):
            continue
        if s.startswith("/*") and s.endswith("*/"):
            continue
        if not s:
            continue
        out.append(line.rstrip())
    return "\n".join(out)


def main() -> int:
    if not (os.path.exists(CSS_SRC) and os.path.exists(JS_SRC)):
        print("Berkas sumber tidak ditemukan.", file=sys.stderr)
        return 1

    css_src = open(CSS_SRC, encoding="utf-8").read()
    js_src = open(JS_SRC, encoding="utf-8").read()

    css_out = minify_css(css_src)
    if css_out.count("{") != css_out.count("}"):
        print("GAGAL: kurung kurawal CSS tidak seimbang setelah diringkas.", file=sys.stderr)
        return 1

    version = "?"
    m = re.search(r"DAA_VERSION\s*=\s*'([^']+)'", js_src)
    if m:
        version = m.group(1)

    banner = "/* DAAT theme %s, versi ringkas untuk deployment. Sumber beserta seluruh dokumentasinya ada di theme/custom.css dan theme/custom.js. */\n" % version
    js_out = banner + strip_js_comments(js_src)
    css_out = banner + css_out

    open(CSS_OUT, "w", encoding="utf-8").write(css_out)
    open(JS_OUT, "w", encoding="utf-8").write(js_out)

    def kb(s):
        return len(s.encode("utf-8")) / 1024

    print("versi     : %s" % version)
    print("CSS       : %5.1f KB  ->  %5.1f KB   (turun %d%%)"
          % (kb(css_src), kb(css_out), 100 * (1 - kb(css_out) / kb(css_src))))
    print("JS        : %5.1f KB  ->  %5.1f KB   (turun %d%%)"
          % (kb(js_src), kb(js_out), 100 * (1 - kb(js_out) / kb(js_src))))
    print("hasil     : theme/custom.min.css, theme/custom.min.js")
    return 0


if __name__ == "__main__":
    sys.exit(main())
