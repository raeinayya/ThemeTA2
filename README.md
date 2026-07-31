# Antarmuka DAAT (Data Analyst Agent Tool)

Lapisan frontend untuk **Data Analyst Agent**, dibangun di atas Open WebUI v0.8.8.

Repositori ini memuat seluruh kontribusi sisi frontend, yaitu tema antarmuka beserta dua ekstensi Open WebUI yang menjembatani antarmuka dengan backend analisis data.

## Prinsip perancangan

Seluruh kustomisasi dilakukan **tanpa memodifikasi kode sumber Open WebUI**. Hanya dua mekanisme resmi yang dipakai:

1. Berkas `custom.css` dan `custom.js` yang disajikan dari direktori statis.
2. Mekanisme *Tool Function* dan *Filter Function* milik Open WebUI.

Konsekuensinya, Open WebUI tetap dapat diperbarui tanpa kehilangan kustomisasi, dan seluruh lapisan ini dapat dimatikan sepenuhnya melalui parameter URL `?daa=off` untuk keperluan perbandingan.

## Struktur

```
theme/
  custom.css          sumber gaya, memuat dokumentasi setiap keputusan desain
  custom.js           sumber perilaku antarmuka
  custom.min.css      artefak ringkas yang benar-benar dikirim ke browser
  custom.min.js       artefak ringkas yang benar-benar dikirim ke browser

functions/
  daat_analyze_tool.py     Tool Function, dua fungsi: analyze_data dan analyze_followup
  daat_session_filter.py   Filter Function, dua fungsi: inlet dan outlet

scripts/
  build-theme.py      membuang komentar dari sumber untuk menghasilkan artefak ringkas
  reapply-theme.sh    memasang artefak ke container Open WebUI
  set-webui-name.sh   mengganti nama aplikasi, dipakai saat membandingkan dengan versi default
```

Berkas sumber sengaja memuat komentar yang panjang, karena komentar itu merekam alasan setiap keputusan beserta hasil pengukuran yang mendasarinya. Komentar tersebut tidak berguna bagi browser dan membebani metrik Lighthouse, sehingga versi yang dikirim ke browser adalah artefak ringkas. Pengurangannya 51 persen untuk CSS dan 41 persen untuk JavaScript.

## Cara memasang

Dijalankan dari akar repositori, dengan container Open WebUI bernama `open-webui` dalam keadaan berjalan.

```bash
bash scripts/reapply-theme.sh
```

Skrip tersebut membangun ulang artefak bila sumbernya lebih baru, menyalinnya ke container, memastikan `index.html` memuat `custom.js` dengan atribut `defer`, lalu mencetak versi yang akan dimuat browser.

Setelah itu buka `http://localhost:3000` dan lakukan *hard refresh*.

**Penting.** Tema tersimpan pada lapisan tulis container, bukan pada named volume. Setiap kali container dibuat ulang, tema hilang dan skrip di atas harus dijalankan kembali.

Tool dan Filter dipasang melalui antarmuka Open WebUI pada menu Admin, bagian Functions, lalu diaktifkan dan ditugaskan ke model yang dipakai.

## Hasil pengukuran

Kedua kondisi dijalankan pada container, backend, model, mesin, dan peramban yang identik, pada halaman yang sama. Satu-satunya variabel yang berbeda adalah aktif atau tidaknya lapisan frontend, yang dipisahkan melalui parameter `?daa=off`.

### Google Lighthouse

| Kategori | Halaman | Open WebUI default | Antarmuka DAAT |
|---|---|---|---|
| **Accessibility** | chat | **79** | **100** |
| **Accessibility** | login | **88** | **100** |
| Performance | chat | 95 | 96 |
| Performance | login | 95 | 96 |
| Best Practices | keduanya | 100 | 100 |

Peningkatan aksesibilitas sebesar 21 poin dicapai tanpa penurunan performa. Skor Performance pada kedua kondisi tertahan oleh metrik yang berasal dari mekanisme pemuatan Open WebUI sendiri, yaitu Speed Index pada halaman chat dan Largest Contentful Paint pada halaman login, dan bukan oleh lapisan frontend ini.

### Pelanggaran WCAG menurut axe-core 4.12.1

| | Open WebUI default | Antarmuka DAAT |
|---|---|---|
| Pelanggaran WCAG 2.1 A dan AA | 4 | 0 |
| Total elemen bermasalah | 6 | 0 |

Empat pelanggaran yang dihilangkan adalah `button-name` (kritis), `nested-interactive` (serius), `aria-hidden-focus` (serius), dan `meta-viewport` (moderat).

## Catatan versi

Versi lapisan tercatat pada konstanta `DAA_VERSION` di dalam `theme/custom.js`, dan dicetak oleh skrip pemasangan. Di dalam peramban, versi yang sedang berjalan dapat diperiksa dengan menjalankan `__daaDebug()` pada Console.

Versi saat ini: **v71**.
