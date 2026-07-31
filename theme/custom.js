/* ==========================================================
   Data Analyst Agent — custom.js  (v20)
   Companion script for custom.css

   Purpose:
   1. Inject INA / ENG language toggle on EVERY page (top-right)
   2. On the auth page: inject the rich "Running locally" badge
      and translate brand title / subtitle / form labels / placeholders /
      submit button (Open WebUI ships English defaults — JS swaps).
   3. On the chat page (blank slate): inject custom title + subtitle
      ("Data Analyst Agent" / "Analyze your data efficiently"), three
      data-focused suggestion pills (Upload / Summarize / Find patterns),
      and translate the chat textarea placeholder.
   4. Persist language choice in localStorage; default = ENG.

   Loaded by Open WebUI when /static/custom.js exists AND the
   SvelteKit HTML includes <script src="/static/custom.js">.
   ========================================================== */

(function () {
  'use strict';

  // ================================================================
  // KILL SWITCH  (v60)
  //
  // Opening any page with ?daa=off runs the STOCK Open WebUI interface in the
  // same container: this script stops immediately and the custom stylesheet is
  // detached. Two uses:
  //   1. Diagnosis. If a problem still happens with ?daa=off, it is not caused
  //      by this frontend layer. That distinction cannot be argued from a
  //      screenshot, only demonstrated.
  //   2. Comparison. The default-vs-customised Lighthouse runs and the
  //      side-by-side video can be recorded against the same backend, the same
  //      model and the same data, so the only variable is the frontend.
  // ================================================================
  // MEASURED BUG (v69): the switch only read location.search, so it survived
  // exactly one navigation. Opening /?daa=off while signed out makes Open WebUI
  // redirect to
  //     /auth?redirect=%2F%3Fdaa%3Doff
  // where "daa=off" is now ENCODED INSIDE the redirect parameter and no longer
  // part of the query string at all. The layer switched itself back on, and the
  // comparison silently measured the customised interface while the URL still
  // said daa=off. A benchmark that quietly measures the wrong thing is worse
  // than one that fails loudly.
  //
  // Two changes: the whole href is decoded before matching, so the flag is
  // still found inside a redirect parameter; and the choice is remembered in
  // sessionStorage, so it holds for the rest of THAT TAB — through the login
  // redirect and any navigation afterwards. sessionStorage rather than
  // localStorage on purpose: one tab can run stock Open WebUI while another
  // runs the customised interface, which is exactly what a side-by-side
  // comparison or a split-screen recording needs. Use ?daa=on to switch back.
  const DAA_OFF_KEY = 'daa-disabled';
  let daaHref = location.href;
  try { daaHref = decodeURIComponent(location.href); } catch (e) {}
  const daaWantOff = /[?&]daa=off(&|$|#)/.test(daaHref);
  const daaWantOn  = /[?&]daa=on(&|$|#)/.test(daaHref);
  let daaSticky = false;
  try {
    if (daaWantOn) sessionStorage.removeItem(DAA_OFF_KEY);
    else if (daaWantOff) sessionStorage.setItem(DAA_OFF_KEY, '1');
    daaSticky = sessionStorage.getItem(DAA_OFF_KEY) === '1';
  } catch (e) {}

  if (!daaWantOn && (daaWantOff || daaSticky)) {
    const sheets = document.querySelectorAll('link[href*="custom.css"]');
    for (let i = 0; i < sheets.length; i++) sheets[i].remove();
    console.log('[DAAT] custom layer DISABLED (stock Open WebUI). Use ?daa=on to re-enable.');
    return;
  }

  // ---------- Translations ----------
  const T = {
    en: {
      // Brand stays in English everywhere.
      title:        'Data Analyst Agent',
      subtitle:     'Sign in to continue',
      badge:        'Running locally · your data is safe',

      // Auth form
      username_lbl: 'Username',
      username_ph:  'Enter your username',
      password_lbl: 'Password',
      password_ph:  'Enter your password',
      sign_in:      'Sign in',
      signing_in:   'Signing in…',

      // Chat blank slate
      chat_title:        'Data Analyst Agent',     // brand stays
      chat_subtitle:     'Upload your file and choose what you want to do',
      chat_ph:           'Upload a CSV or Excel file, then ask about your data…',
      chat_ph_followup:  'Ask another question about this dataset…',
      sug_upload:        'Upload your file',
      sug_summarize:     'Summarize this data',
      sug_patterns:      'Find patterns in this file',
      chat_reassurance:  'Your data stays on this device',

      // Schema-aware prompt assistance
      schema_ready:      'Dataset detected. Try one of these:',
      dp_cols:           '{n} columns detected',
      dp_types:          '{num} numeric · {cat} category · {date} date',
      dp_warn_empty:     'Some columns look empty and may affect the analysis.',
      dp_big_file:       'Large file ({size}). Open WebUI still has to upload and index it, so the first analysis can take several minutes.',
      dp_more:           '+{n} more',
      dp_less:           'Show fewer',
      dp_rows:           '{n} rows',
      dp_rows_min:       'at least {n} rows (read from the first 64 KB)',

      // Corrective feedback — Grant Ch 45-46, FENIkS layer 3
      cf_delim:          'Separated by {d}, not commas. Detected and read correctly.',
      cf_noheader:       'The first row looks like data, so the columns have no names yet. Add a header row for clearer answers.',
      cf_numtext:        '{cols} contains numbers written with a thousands separator, so it may be read as text. Sums and averages on it can be wrong.',
      cf_mixdate:        '{cols} mixes date formats. Use one format so the trend is read correctly.',

      // Explanatory feedback — Grant Ch 56, Ruiz et al. 2020 (p<0.01, d=0.87)
      ef_matched:        'Reads as a question about {cols}.',
      ef_nocol:          'There is no column named "{typed}". Did you mean {suggestion}?',
      ef_available:      'Available columns: {cols}',
      dl_report:         'Download report',
      dl_done:           'Report downloaded',
      dl_choose:         'What do you want to download?',
      dl_one_pdf:        'This answer · PDF',
      dl_one_doc:        'This answer · Word',
      dl_all_pdf:        'Whole conversation · PDF',
      dl_all_doc:        'Whole conversation · Word',
      dl_cancel:         'Cancel',
      dl_pdf_hint:       'The print dialog will open. Choose "Save as PDF".',
      dl_h_question:     'Question',
      dl_h_answer:       'Answer',
      dl_h_dataset:      'Dataset',
      dl_h_title:        'Data Analysis Report',
      p_summary:         'Summarise this dataset',
      p_quality:         'Check missing values and data quality',
      p_avg:             'Calculate the average of {a}',
      p_dist:            'Show the distribution of {a}',
      p_group:           'Compare {a} by {b}',
      p_trend:           'Show the trend of {a} over {b}',
      p_corr:            'Find the correlation between {a} and {b}',
      followup_hint:     'Continue the analysis:',
      p_top:             'Show the highest {a} by {b}',
      p_share:           'Show the contribution of each {b} to {a}',
      p_lowest:          'Show the lowest {a} by {b}',
      p_outlier:         'Find unusual values in {a}',
      p_drill:           'Break {a} down further by {b}',
      p_why:             'Explain what causes the difference in {a}',
      p_compare_period:  'Compare {a} between the earliest and latest {b}',
      p_table:           'Show the result above as a table',

      // Quick actions (shown before a dataset exists)
      qa_upload:         'Upload your file',
      qa_sample:         'Try a sample dataset',
      qa_capab:          'What can DAAT do?',
      formats_hint:      'Supported files: CSV and Excel',
      capab_title:       'DAAT analyses your data for you',
      capab_1:           'Upload a spreadsheet, no formulas or code needed.',
      capab_2:           'Ask in plain language: summaries, averages, comparisons, trends, correlations.',
      capab_3:           'You get statistics and charts back, calculated on this device.',
      capab_close:       'Got it',

      // Progress & journey signals
      skip_link:         'Skip to main content',
      an_running:        'Analysing your data…',
      an_running_long:   'Still working · {s}s',
      an_done:           'Analysis complete',
      capab_example:     'Example of what you get back:',
      ex_file:           'sales.csv — 12 rows × 8 columns',
      ex_finding:        'Bandung leads with 39.3% of total revenue.',
      ex_note:           'Key figures per Region — computed from the data, not estimated by the LLM',
      ex_chart_label:    'Chart 1',
      ex_col_region:     'REGION',
      ex_col_revenue:    'REVENUE',
      ex_col_share:      '%',
      ex_chart:          'Revenue by region',
      drop_title:        'Drop your file here',
      drop_sub:          'CSV or Excel',
      undo_removed:      'Dataset removed',
      undo_action:       'Undo',
    },
    id: {
      title:        'Data Analyst Agent',
      subtitle:     'Masuk untuk melanjutkan',
      badge:        'Berjalan secara lokal · data Anda aman',

      username_lbl: 'Nama pengguna',
      username_ph:  'Masukkan nama pengguna',
      password_lbl: 'Kata sandi',
      password_ph:  'Masukkan kata sandi',
      sign_in:      'Masuk',
      signing_in:   'Sedang masuk…',

      chat_title:        'Data Analyst Agent',
      chat_subtitle:     'Unggah file Anda dan pilih yang ingin dilakukan',
      chat_ph:           'Unggah file CSV atau Excel, lalu tanyakan tentang data Anda…',
      chat_ph_followup:  'Tanyakan hal lain tentang dataset ini…',
      sug_upload:        'Unggah file Anda',
      sug_summarize:     'Ringkas data ini',
      sug_patterns:      'Temukan pola dalam file ini',
      chat_reassurance:  'Data Anda tetap di perangkat ini',

      // Schema-aware prompt assistance
      schema_ready:      'Dataset terdeteksi. Coba salah satu berikut:',
      dp_cols:           '{n} kolom terdeteksi',
      dp_types:          '{num} angka · {cat} kategori · {date} tanggal',
      dp_warn_empty:     'Ada kolom yang tampak kosong dan bisa memengaruhi analisis.',
      dp_big_file:       'File besar ({size}). Open WebUI masih perlu mengunggah dan mengindeksnya, jadi analisis pertama bisa memakan beberapa menit.',
      dp_more:           '+{n} lainnya',
      dp_less:           'Tampilkan lebih sedikit',
      dp_rows:           '{n} baris',
      dp_rows_min:       'minimal {n} baris (dibaca dari 64 KB pertama)',

      cf_delim:          'Dipisah dengan {d}, bukan koma. Sudah terdeteksi dan terbaca benar.',
      cf_noheader:       'Baris pertama tampak berisi data, jadi kolomnya belum punya nama. Tambahkan baris judul agar jawabannya lebih jelas.',
      cf_numtext:        '{cols} berisi angka bertitik ribuan, jadi bisa terbaca sebagai teks. Penjumlahan dan rata-ratanya bisa keliru.',
      cf_mixdate:        '{cols} memakai format tanggal yang bercampur. Samakan formatnya agar trennya terbaca benar.',

      ef_matched:        'Terbaca sebagai pertanyaan tentang {cols}.',
      ef_nocol:          'Tidak ada kolom bernama "{typed}". Maksud Anda {suggestion}?',
      ef_available:      'Kolom yang tersedia: {cols}',
      dl_report:         'Unduh laporan',
      dl_done:           'Laporan terunduh',
      dl_choose:         'Apa yang ingin diunduh?',
      dl_one_pdf:        'Jawaban ini · PDF',
      dl_one_doc:        'Jawaban ini · Word',
      dl_all_pdf:        'Seluruh percakapan · PDF',
      dl_all_doc:        'Seluruh percakapan · Word',
      dl_cancel:         'Batal',
      dl_pdf_hint:       'Dialog cetak akan terbuka. Pilih "Save as PDF".',
      dl_h_question:     'Pertanyaan',
      dl_h_answer:       'Jawaban',
      dl_h_dataset:      'Dataset',
      dl_h_title:        'Laporan Analisis Data',
      p_summary:         'Ringkas dataset ini',
      p_quality:         'Periksa nilai kosong dan kualitas data',
      p_avg:             'Hitung rata-rata {a}',
      p_dist:            'Tampilkan distribusi {a}',
      p_group:           'Bandingkan {a} berdasarkan {b}',
      p_trend:           'Tampilkan tren {a} per {b}',
      p_corr:            'Cari korelasi antara {a} dan {b}',
      followup_hint:     'Lanjutkan analisis:',
      p_top:             'Tampilkan {a} tertinggi berdasarkan {b}',
      p_share:           'Tampilkan kontribusi tiap {b} terhadap {a}',
      p_lowest:          'Tampilkan {a} terendah berdasarkan {b}',
      p_outlier:         'Cari nilai yang tidak wajar pada {a}',
      p_drill:           'Rinci {a} lebih lanjut berdasarkan {b}',
      p_why:             'Jelaskan penyebab perbedaan {a}',
      p_compare_period:  'Bandingkan {a} antara {b} paling awal dan paling akhir',
      p_table:           'Tampilkan hasil di atas dalam bentuk tabel',

      // Quick actions (ditampilkan sebelum ada dataset)
      qa_upload:         'Unggah file Anda',
      qa_sample:         'Coba dataset contoh',
      qa_capab:          'Apa yang bisa dilakukan DAAT?',
      formats_hint:      'File yang didukung: CSV dan Excel',
      capab_title:       'DAAT menganalisis data Anda',
      capab_1:           'Unggah file spreadsheet, tanpa perlu rumus atau kode.',
      capab_2:           'Tanya dengan bahasa sehari-hari: ringkasan, rata-rata, perbandingan, tren, korelasi.',
      capab_3:           'Hasilnya berupa statistik dan grafik, dihitung di perangkat ini.',
      capab_close:       'Mengerti',

      // Sinyal progres & penyelesaian
      skip_link:         'Lompat ke konten utama',
      an_running:        'Menganalisis data Anda…',
      an_running_long:   'Masih diproses · {s} detik',
      an_done:           'Analisis selesai',
      capab_example:     'Contoh hasil yang Anda terima:',
      ex_file:           'penjualan.csv — 12 baris × 8 kolom',
      ex_finding:        'Bandung memimpin dengan 39,3% dari total pendapatan.',
      ex_note:           'Angka kunci per Wilayah — dihitung dari data, bukan estimasi LLM',
      ex_chart_label:    'Grafik 1',
      ex_col_region:     'WILAYAH',
      ex_col_revenue:    'PENDAPATAN',
      ex_col_share:      '%',
      ex_chart:          'Pendapatan per wilayah',
      drop_title:        'Lepaskan file Anda di sini',
      drop_sub:          'CSV atau Excel',
      undo_removed:      'Dataset dihapus',
      undo_action:       'Batalkan',
    }
  };

  // Bump on every change. Lets you confirm in one line which build the browser
  // is actually running, instead of debugging a version that was never served.
  const DAA_VERSION = 'v71';
  console.log('[DAAT] custom.js ' + DAA_VERSION + ' loaded');

  const STORAGE_KEY = 'daa-lang';

  // Write the composer's placeholder BEFORE the first paint.
  //
  // applyLang runs on the 250 ms tier, so until v56 the composer briefly showed
  // the stylesheet's fallback text and then swapped to the real one. The script
  // is deferred, which means this runs while the document is still being set
  // up, so setting the variable here means the correct hint is the only one the
  // user ever sees. [Grant Bab 40]
  (function primePlaceholder() {
    try {
      const lang = localStorage.getItem(STORAGE_KEY) === 'id' ? 'id' : 'en';
      const d = T[lang] || T.en;
      const txt = /\/c\//.test(location.pathname) ? d.chat_ph_followup : d.chat_ph;
      document.documentElement.style.setProperty('--i18n-chat-ph', '"' + txt + '"');
    } catch (e) { /* stylesheet fallback stays */ }
  })();

  // ---------- Full i18n integration (v23) ----------
  // Earlier versions only swapped the strings this script owns, so the rest of
  // Open WebUI stayed in English and the interface ended up bilingual in the
  // worst way (custom labels in Indonesian next to built-in labels in English).
  // Open WebUI ships its own i18next locales and reads the active language from
  // localStorage key 'locale'. By writing that key alongside our own we hand the
  // language choice to the platform, so switching to INA localises the WHOLE
  // interface (menus, settings, tooltips), not just our injected elements.
  // i18next reads the locale when the app boots and is not exposed on window,
  // so applying a change requires one reload. We only reload when the platform
  // locale actually has to change, which keeps normal navigation untouched.
  const OWUI_LOCALE_KEY = 'locale';
  const OWUI_LOCALE = { id: 'id-ID', en: 'en-US' };

  function syncPlatformLocale(lang, allowReload) {
    const want = OWUI_LOCALE[lang] || OWUI_LOCALE.en;
    let current = null;
    try { current = localStorage.getItem(OWUI_LOCALE_KEY); } catch (e) { return; }
    if (current === want) return;
    try { localStorage.setItem(OWUI_LOCALE_KEY, want); } catch (e) { return; }
    if (allowReload) location.reload();
  }

  // ---------- Page detection ----------
  function isAuthPage() { return !!document.querySelector('#auth-page'); }

  // Find the chat input. Open WebUI uses TipTap/ProseMirror — a
  // contenteditable <div id="chat-input">, NOT a <textarea>.
  function findChatInput() {
    return (
      document.getElementById('chat-input') ||
      document.querySelector('[contenteditable="true"].ProseMirror') ||
      document.querySelector('[contenteditable="true"][class*="tiptap" i]') ||
      [].find.call(
        document.querySelectorAll('[contenteditable="true"]'),
        function (c) { return !c.closest('#auth-page'); }
      ) ||
      null
    );
  }
  // Back-compat alias
  function findChatTextarea() { return findChatInput(); }

  // Blank slate = chat input present and no real chat-bubble messages.
  // IMPORTANT: keep selectors TIGHT — Open WebUI has many helper elements
  // (message-input, message-thread, error-message...) that exist on blank
  // state too. Only match actual rendered chat-message bubbles.
  function isChatBlankSlate() {
    if (isAuthPage()) return false;
    const editor = findChatInput();
    if (!editor) return false;
    const hasMessages = !!document.querySelector(
      '.user-message, .assistant-message, ' +
      '[data-message-id], [id^="message-"]'
    );
    return !hasMessages;
  }

  // Anchor element used for inserting the custom blank slate
  function findBlankSlateAnchor() {
    const ta = findChatTextarea();
    if (!ta) return null;
    return ta.closest('form') || ta.parentElement;
  }

  // ---------- Auth-form helpers ----------
  function findEmailLabel() {
    return document.querySelector(
      '#auth-page label[for*="email" i], #auth-page label[for*="username" i]'
    );
  }
  function findEmailInput() {
    return document.querySelector(
      '#auth-page input[type="email"], ' +
      '#auth-page input[autocomplete*="username" i], ' +
      '#auth-page input[autocomplete*="email" i]'
    );
  }
  function findPasswordLabel() {
    return document.querySelector('#auth-page label[for*="password" i]');
  }
  function findPasswordInput() {
    return document.querySelector('#auth-page input[type="password"]');
  }
  function findSignInButton() {
    return document.querySelector('#auth-page button[type="submit"]');
  }

  // The composer's hint has to match where the user actually is. On a fresh
  // screen the job is to get data in; inside a conversation the dataset is
  // already attached and the job is to ask the next question, so repeating
  // "upload a file" there is wrong. One function decides this so the ::before
  // and the data-placeholder attribute can never disagree.
  function chatPlaceholder(dict) {
    return /\/c\//.test(location.pathname) ? dict.chat_ph_followup : dict.chat_ph;
  }

  // ---------- Apply language ----------
  // MEASURED BUG (v70): LCP 1350 ms on the login page while FCP was 423 ms and
  // Speed Index only 783 ms. A screen that is visually settled at 0.8 s cannot
  // honestly have its largest paint at 1.35 s — unless something repaints it
  // afterwards. applyLang was that something. It ran on the 250 ms tier, again
  // on `load`, and once more 400 ms after `load`, and every run assigned
  // textContent unconditionally. Assigning the SAME string still replaces the
  // text node, which counts as a fresh paint of that element, so the login
  // card's heading kept resetting the LCP timestamp to the latest rewrite.
  //
  // These three helpers make every write conditional. Nothing about the result
  // changes; what changes is that an unchanged value no longer touches the DOM.
  // This also removes a few dozen needless writes per second from the 250 ms
  // tier, which is work the browser was doing during every generation.
  function setText(el, v) { if (el && el.textContent !== v) el.textContent = v; }
  function setAttr(el, k, v) { if (el && el.getAttribute(k) !== v) el.setAttribute(k, v); }
  function setVar(el, k, v) { if (el.style.getPropertyValue(k) !== v) el.style.setProperty(k, v); }

  function applyLang(lang) {
    if (!T[lang]) lang = 'en';
    const dict = T[lang];
    const root = document.documentElement;

    // CSS custom properties (used by ::before/::after content swaps in custom.css)
    setVar(root, '--i18n-title',    '"' + dict.title    + '"');
    setVar(root, '--i18n-subtitle', '"' + dict.subtitle + '"');
    setVar(root, '--i18n-badge',    '"\\2022\\00a0  ' + dict.badge + '"');

    // Auth form — direct DOM (Open WebUI's own elements)
    setText(findEmailLabel(),    dict.username_lbl);
    setAttr(findEmailInput(),    'placeholder', dict.username_ph);
    setText(findPasswordLabel(), dict.password_lbl);
    setAttr(findPasswordInput(), 'placeholder', dict.password_ph);
    const sB = findSignInButton();  if (sB && !sB.disabled) setText(sB, dict.sign_in);

    // Chat input placeholder — TipTap renders via the empty <p>'s ::before.
    // We override that ::before content via the --i18n-chat-ph CSS variable.
    // The value MUST be a quoted string so CSS `content: var(...)` resolves.
    //
    // MEASURED BUG (v57): there were TWO placeholders on screen with DIFFERENT
    // wording. This line wrote "Upload a CSV or Excel file…" into the ::before,
    // while mountPlaceholder() overlaid a <span> reading "Ask another question
    // about this dataset…". The span was refreshed on the 250 ms tier, so on
    // every render the user saw the first text and then watched it be replaced.
    // There is now ONE placeholder: the native ::before, whose text is chosen
    // by chatPlaceholder() from the same dictionary.
    // [Grant Ch 40] do not let the interface change under the user's eyes
    setVar(root, '--i18n-chat-ph', '"' + chatPlaceholder(dict) + '"');

    // Also try the data-placeholder attr (works in some TipTap configs)
    // TipTap renders its placeholder from the data-placeholder attribute on the
    // empty paragraph. Setting it on EVERY candidate paragraph (not just the
    // first match) is what makes the hint appear reliably; previously the
    // composer could sit completely blank with no indication of what to type.
    const editor = findChatInput();
    if (editor) {
      const phText = chatPlaceholder(dict);
      setAttr(editor, 'data-placeholder', phText);
      const ps = editor.querySelectorAll('p');
      for (let i = 0; i < ps.length; i++) {
        setAttr(ps[i], 'data-placeholder', phText);
      }
    }

    document.querySelectorAll('[data-i18n-chat]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-chat');
      if (dict[key] !== undefined) setText(el, dict[key]);
    });

    // Toggle visual state
    document.querySelectorAll('.lang-toggle button').forEach(function (b) {
      setAttr(b, 'aria-pressed', b.dataset.lang === lang ? 'true' : 'false');
    });

    // Rich badge (auth)
    setText(document.querySelector('.daa-badge .daa-badge-text'), dict.badge);

    if (root.lang !== lang) root.lang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  // ---------- Find the top-right header action container ----------
  // Open WebUI puts the Temporary chat + Controls icon buttons inside
  // a flex container. The Controls button has aria-label="Controls",
  // which is a stable identifier across versions.
  function findHeaderContainer() {
    const btn =
      document.querySelector('button[aria-label="Controls"]') ||
      document.querySelector('button[aria-label*="control" i]') ||
      document.querySelector('button[aria-label*="setting" i]');
    if (btn && btn.parentElement) return btn.parentElement;
    return null;
  }

  // ---------- Toggle injection — inside header container as flex sibling ----------
  function injectToggle() {
    if (document.querySelector('.lang-toggle')) return;

    const toggle = document.createElement('div');
    toggle.className = 'lang-toggle';
    toggle.setAttribute('role', 'group');
    toggle.setAttribute('aria-label', 'Language');
    toggle.innerHTML =
      '<button type="button" data-lang="id" aria-pressed="false" aria-label="Bahasa Indonesia">INA</button>' +
      '<button type="button" data-lang="en" aria-pressed="true"  aria-label="English">ENG</button>';

    const header = findHeaderContainer();
    if (header) {
      // Insert as the FIRST child so it sits to the left of settings + avatar
      header.insertBefore(toggle, header.firstChild);
    } else {
      // No header found yet (e.g. on the auth page, or page still mounting).
      // Fall back to floating top-right so the user always sees the toggle.
      toggle.style.position = 'fixed';
      toggle.style.top      = '20px';
      toggle.style.right    = '20px';
      toggle.style.zIndex   = '9999';
      document.body.appendChild(toggle);
    }

    toggle.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        const chosen = b.dataset.lang;
        applyLang(chosen);
        // Hand the same choice to Open WebUI's own i18n so the entire
        // interface follows, not just the strings this script owns.
        syncPlatformLocale(chosen, true);
      });
    });
  }

  // ---------- Rich badge (auth page only) ----------
  function injectRichBadge() {
    const form = document.querySelector('#auth-page form.flex.flex-col.justify-center');
    if (!form || form.querySelector('.daa-badge')) return;

    form.classList.add('has-js-badge');

    const lang = document.documentElement.lang || 'en';
    const badgeText = (T[lang] || T.en).badge;

    const badge = document.createElement('div');
    badge.className = 'daa-badge';
    badge.innerHTML =
      '<span class="daa-badge-dot" aria-hidden="true"></span>' +
      '<span class="daa-badge-text">' + badgeText + '</span>';
    form.appendChild(badge);

    if (!document.getElementById('daa-badge-style')) {
      const css = document.createElement('style');
      css.id = 'daa-badge-style';
      css.textContent =
        '.daa-badge {' +
        '  margin: 22px auto 0; display: flex; align-items: center;' +
        '  justify-content: center; gap: 8px; padding: 9px 16px;' +
        '  background: var(--powder-pale);' +
        '  border: 1px solid var(--input-border);' +
        '  border-radius: 999px; font-size: 12.5px;' +
        '  color: var(--text2); line-height: 1.4; white-space: nowrap;' +
        '  width: fit-content;' +
        '}' +
        '.daa-badge-dot {' +
        '  width: 8px; height: 8px; border-radius: 50%;' +
        '  background: var(--powder);' +
        '  box-shadow: 0 0 0 3px rgba(221,230,237,0.30);' +
        '  flex-shrink: 0; animation: daa-badge-pulse 2.4s ease-in-out infinite;' +
        '}' +
        '.dark .daa-badge-dot, :root.dark .daa-badge-dot {' +
        '  box-shadow: 0 0 0 3px rgba(183,172,155,0.30);' +
        '}' +
        '@keyframes daa-badge-pulse {' +
        '  0%, 100% { opacity: 0.75; transform: scale(1); }' +
        '  50%      { opacity: 1.00; transform: scale(1.18); }' +
        '}' +
        '@media (prefers-reduced-motion: reduce) {' +
        '  .daa-badge-dot { animation: none; }' +
        '}';
      document.head.appendChild(css);
    }
  }

  // ---------- File upload trigger ----------
  // Open WebUI's chat input has a "+" attachment button that opens a
  // menu (Upload File / Capture / etc.). Try multiple strategies to
  // find and click it.
  function triggerFileUpload() {
    // 1. Direct hidden <input type="file">
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.click();
      return true;
    }

    // 2. Buttons explicitly labeled for upload / attach / add
    const labeled = document.querySelector(
      'button[aria-label*="upload" i], '  +
      'button[aria-label*="attach" i], '  +
      'button[aria-label*="file"   i], '  +
      'button[aria-label*="add"    i], '  +
      'button[title*="upload" i], '       +
      'button[title*="attach" i], '       +
      'button[title*="add"    i]'
    );
    if (labeled) {
      labeled.click();
      return true;
    }

    // 3. Structural fallback — click the FIRST icon button inside the
    // form that wraps the chat input. In Open WebUI's TipTap layout
    // that's the "+" attach button (sits to the left of the input).
    const editor = findChatInput();
    if (editor) {
      const form = editor.closest('form');
      if (form) {
        const firstIconBtn = form.querySelector('button:has(svg)');
        if (firstIconBtn) {
          firstIconBtn.click();
          return true;
        }
      }
    }

    return false;
  }

  // ---------- Hide Open WebUI's default "Suggested" container ----------
  // Finds any element whose direct text === "Suggested" (or Indonesian
  // equivalent) and hides its enclosing container. The default suggestions
  // are usually NOT a direct sibling of the form, so the sibling-walk
  // alone doesn't reach them.
  function hideDefaultSuggestionsContainer() {
    // Scoped to the main column and capped. Scanning the whole document made
    // this too slow to run every tick, so it was throttled — and the default
    // suggestion cards became visible for a moment before being hidden.
    // MEASURED (v57): this build renders no <main> element, so the scope
    // always fell back to document.body and the "capped" scan still walked
    // the whole page. The conversation is in #messages-container, which is
    // both correct and much smaller.
    const scope = document.getElementById('messages-container') ||
                  document.querySelector('main') || document.body;
    const candidates = scope.querySelectorAll('h2, h3, h4, h5, span, div, p');
    const HEADINGS = ['suggested', 'saran', 'disarankan', 'rekomendasi'];
    for (let i = 0; i < candidates.length; i++) {
      const el = candidates[i];
      if (HEADINGS.indexOf(headingText(el)) === -1) continue;
      // Walk up to the section/card that wraps both the heading + items.
      // Stop at the first ancestor that has multiple element children
      // (heading + list).
      let wrap = el.parentElement;
      while (wrap && wrap.children.length === 1) wrap = wrap.parentElement;
      if (!wrap) continue;
      if (wrap.classList.contains('daa-suggestions')) continue;
      if (wrap.querySelector('.daa-sug')) continue;
      if (wrap.getAttribute('data-daa-hidden') === 'true') continue;
      wrap.style.display = 'none';
      wrap.setAttribute('data-daa-hidden', 'true');
    }
  }

  // ---------- Detect right-side panel (Controls / Settings / Profile) ----------
  function isPanelOpen() {
    // 1. Look for a visible "Controls" / "Settings" / "Profile" / "Account"
    //    heading anywhere on the page (the right-side panels render one).
    const headings = document.querySelectorAll('h1, h2, h3, h4');
    const targets = ['Controls', 'Settings', 'Profile', 'Account'];
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      if (targets.indexOf(h.textContent.trim()) === -1) continue;
      const rect = h.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return true;
    }
    // 2. Standard ARIA modals
    if (document.querySelector(
      '[role="dialog"][aria-modal="true"]:not([aria-hidden="true"])'
    )) return true;
    return false;
  }

  function updateTogglePanelState() {
    const toggle = document.querySelector('.lang-toggle');
    if (!toggle) return;
    toggle.style.display = isPanelOpen() ? 'none' : '';
  }


  // ---------- Hide Open WebUI's blank-slate siblings ----------
  // After our blank slate is mounted, walk the DOM around it and hide
  // anything Open WebUI rendered as part of the default empty state.
  // We only walk SIBLINGS of our injected elements so we never hide
  // the form / chat-input / sidebar / etc.
  function hideOpenWebUISiblings() {
    const blank = document.querySelector('.daa-blank');
    const sugs  = document.querySelector('.daa-suggestions');
    if (!blank || !sugs) return;

    function shouldKeep(el) {
      if (!el) return true;
      if (el.classList.contains('daa-blank')) return true;
      if (el.classList.contains('daa-suggestions')) return true;
      if (el.classList.contains('daa-reassurance')) return true;
      // Our own later additions must be protected too. The capability panel
      // was being hidden the instant it opened: it is inserted as a sibling of
      // the suggestions row, and this cleanup pass hides every sibling it does
      // not recognise, so the button looked completely dead when clicked.
      if (el.classList.contains('daa-capab')) return true;
      if (el.classList.contains('daa-followup')) return true;
      if (el.tagName === 'FORM') return true;
      if (el.querySelector && el.querySelector('form, textarea, [contenteditable="true"]')) return true;
      return false;
    }

    // Hide siblings BEFORE .daa-blank
    let node = blank.previousElementSibling;
    while (node) {
      const prev = node.previousElementSibling;
      if (!shouldKeep(node) && node.style.display !== 'none') {
        node.style.display = 'none';
        node.setAttribute('data-daa-hidden', 'true');
      }
      node = prev;
    }

    // Hide siblings AFTER .daa-suggestions
    node = sugs.nextElementSibling;
    while (node) {
      const next = node.nextElementSibling;
      if (!shouldKeep(node) && node.style.display !== 'none') {
        node.style.display = 'none';
        node.setAttribute('data-daa-hidden', 'true');
      }
      node = next;
    }
  }

  // ---------- Chat blank slate injection ----------
  // Always inject when chat-input is present (and we're not on auth page).
  // CSS uses :has() to hide it when real chat messages appear.
  function injectChatBlank() {
    if (isAuthPage()) return;
    if (!findChatInput()) return;
    if (document.querySelector('.daa-blank')) return;
    // Defensive: clear any orphaned parts before rebuilding, so a partially
    // removed blank slate can never leave duplicates behind.
    ['.daa-suggestions', '.daa-reassurance'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) { el.remove(); });
    });

    const anchor = findBlankSlateAnchor();
    if (!anchor || !anchor.parentNode) return;

    // Title + subtitle (inserted before the input wrapper)
    const blank = document.createElement('div');
    blank.className = 'daa-blank';
    blank.innerHTML =
      '<h1 class="daa-blank-title" data-i18n-chat="chat_title">Data Analyst Agent</h1>' +
      '<p  class="daa-blank-subtitle" data-i18n-chat="chat_subtitle">Analyze your data efficiently</p>';

    // Suggestions row (inserted after the input wrapper).
    // The first one carries data-action="upload" so the click handler
    // triggers the file picker instead of just inserting text.
    // QUICK ACTIONS instead of generic example prompts.
    // Prompts like "Summarize this data" were dead weight before a dataset
    // existed: they named no real column and could not be acted on, and once
    // a file IS attached the schema-aware prompts replace them anyway. What a
    // first-time user actually needs at this point is a way to GET data in and
    // to learn what the system can do.
    // [Grant Bab 20] orient a new user; [Krug Bab 1] do not show what is not
    // needed yet; [Amershi et al. 2019] make clear what the system can do.
    const sugs = document.createElement('div');
    sugs.className = 'daa-suggestions daa-quickactions';
    sugs.innerHTML =
      '<button class="daa-sug" type="button" data-action="upload">'              +
      '<span data-i18n-chat="qa_upload">Upload your file</span></button>'       +
      '<button class="daa-sug" type="button" data-action="sample">'             +
      '<span data-i18n-chat="qa_sample">Try a sample dataset</span></button>'   +
      '<button class="daa-sug" type="button" data-action="capabilities"'        +
      '        aria-expanded="false">'                                          +
      '<span data-i18n-chat="qa_capab">What can DAAT do?</span></button>';

    // Reassurance line — small, subtle, builds trust ("data stays on device")
    const reass = document.createElement('p');
    reass.className = 'daa-reassurance';
    reass.setAttribute('data-i18n-chat', 'chat_reassurance');
    reass.textContent = 'Your data stays on this device';

    // Insert: title above the anchor, then suggestions → reassurance after.
    // No secondary suggestion sections — strict hierarchy ends at the
    // reassurance line per spec.
    anchor.parentNode.insertBefore(blank, anchor);
    if (anchor.nextSibling) {
      anchor.parentNode.insertBefore(sugs,  anchor.nextSibling);
      anchor.parentNode.insertBefore(reass, sugs.nextSibling);
    } else {
      anchor.parentNode.appendChild(sugs);
      anchor.parentNode.appendChild(reass);
    }

    // Click handler. For data-action="upload" we trigger Open WebUI's
    // own file picker; for everything else we drop the prompt text
    // into TipTap (ProseMirror) via execCommand so the editor registers
    // it as a real input.
    sugs.querySelectorAll('.daa-sug').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const action = btn.dataset.action;

        const lang0 = (document.documentElement.lang === 'id') ? 'id' : 'en';
        const dict0 = T[lang0] || T.en;

        if (action === 'upload') {
          if (triggerFileUpload()) return;
          // If we couldn't find Open WebUI's upload trigger, fall through
          // to inserting the prompt text as a fallback.
        }

        // Zero-friction onboarding: hand the user a working dataset so they
        // can experience the analysis flow before committing their own file.
        if (action === 'sample') { loadSampleDataset(); return; }

        // Amershi et al. (2019): make clear what the system can do. This is
        // answered by the interface itself rather than by asking the model,
        // because a generated answer is slow, needs a loaded model, and can
        // describe capabilities the system does not actually have.
        if (action === 'capabilities') { toggleCapabilities(); return; }

        const lang = document.documentElement.lang || 'en';
        const key  = btn.dataset.promptKey;
        const text = (T[lang] && T[lang][key]) || T.en[key] || '';
        const editor = findChatInput();
        if (!editor) return;

        editor.focus();
        setTimeout(function () {
          try {
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editor);
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand('insertText', false, text);
          } catch (err) {
            editor.innerHTML = '<p>' + text.replace(/[&<>]/g, '') + '</p>';
            editor.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 10);
      });
    });

    // Activate CSS rules that hide Open WebUI's default greeting + suggestions.
    document.body.classList.add('daa-custom-blank');

    // Hide any Open WebUI sibling content (greeting, default suggestions, etc.)
    hideOpenWebUISiblings();
    hideDefaultSuggestionsContainer();

    // Apply current language to the new elements
    let saved = 'en';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'en'; } catch (e) {}
    applyLang(saved);
  }

  function tearDownChatBlank() {
    const blank = document.querySelector('.daa-blank');
    const sugs  = document.querySelector('.daa-suggestions');
    if (blank) blank.remove();
    if (sugs)  sugs.remove();
    document.body.classList.remove('daa-custom-blank');
  }

  // ---------- Initialization ----------
  // If the toggle is currently in fallback-fixed mode but the header
  // container has since rendered, move it into the header.
  function rehomeToggleIfNeeded() {
    const toggle = document.querySelector('.lang-toggle');
    if (!toggle) return;
    if (toggle.parentElement !== document.body) return; // already in header
    const header = findHeaderContainer();
    if (!header) return;
    // Clear the fallback inline positioning before re-homing
    toggle.style.position = '';
    toggle.style.top      = '';
    toggle.style.right    = '';
    toggle.style.zIndex   = '';
    header.insertBefore(toggle, header.firstChild);
  }

  // ================================================================
  // SCHEMA-AWARE PROMPT ASSISTANCE (v23)
  //
  // Problem this solves: Zamfirescu-Pereira et al. (2023) show that
  // non-experts struggle to write effective prompts mainly because they do
  // not know WHAT they can ask for. Static example prompts ("Summarize this
  // data") do not fix that, because they never mention the user's actual
  // data. So the moment a dataset is attached we read its schema and rewrite
  // the suggestion pills to name real columns, turning an abstract prompt
  // into a concrete, clickable request.
  //
  // Privacy note: parsing happens entirely in the browser with the File API.
  // Only the first slice of the file is read, and nothing is uploaded by this
  // code, which keeps the "your data stays on this device" claim honest.
  // ================================================================

  const SCHEMA_SAMPLE_BYTES = 64 * 1024; // header + a few rows is plenty
  const SCHEMA_STORE_KEY = 'daa-schema';
  let daaSchema = null;
  let lastDataset = null;   // last File, so removal can be undone (Grant Ch 15)                  // { columns:[{name,type,variety}] }

  // The schema is stored PER CHAT. A single shared key had two faults: a new
  // chat inherited the previous dataset's prompts (wrong dataset entirely),
  // and the schema was lost whenever the tab changed. Keying by the chat id in
  // the URL ties each dataset to the conversation it belongs to. Before the
  // first message a chat has no id yet, so the schema is parked under a
  // "pending" key and adopted once the real id appears.
  function chatId() {
    const m = location.pathname.match(/\/c\/([A-Za-z0-9-]+)/);
    return m ? m[1] : null;
  }
  function storeKey(id) { return SCHEMA_STORE_KEY + ':' + (id || 'pending'); }

  function saveSchema(schema) {
    try { localStorage.setItem(storeKey(chatId()), JSON.stringify(schema)); } catch (e) {}
  }

  function loadSchema() {
    try {
      const id = chatId();
      let raw = localStorage.getItem(storeKey(id));
      // Sending the first message turns the pending chat into a real one, so
      // carry the parked schema over to its new id.
      if (!raw && id) {
        const pending = localStorage.getItem(storeKey(null));
        if (pending) {
          localStorage.setItem(storeKey(id), pending);
          localStorage.removeItem(storeKey(null));
          raw = pending;
        }
      }
      if (!raw) return null;
      const s = JSON.parse(raw);
      return (s && s.columns && s.columns.length) ? s : null;
    } catch (e) { return null; }
  }

  // Removing the attached file has to take the dataset prompts away with it.
  // Without this the interface kept offering questions about columns from a
  // file the user had already detached, which is simply wrong information.
  // Only checked before the conversation starts, because once a message is
  // sent the dataset legitimately belongs to that conversation.
  let chipSeen = false;
  let missStreak = 0;   // the attachment chip has been observed at least once

  function forgetSchemaIfFileRemoved() {
    if (!daaSchema || !daaSchema.fileName) return;
    if (/\/c\//.test(location.pathname)) return;   // real chat: keep it
    // Sending a message empties the composer for a moment, and the previous
    // version read that gap as "the user removed the dataset" — which is why
    // the undo toast appeared during a perfectly normal follow-up. Skip while
    // a reply is being generated, and only treat the chip as removed if we
    // actually saw it there first.
    if (isGenerating()) return;
    const editor = findChatInput();
    if (!editor) return;
    const composer = editor.closest('form') || editor.parentElement;
    if (!composer) return;
    const shown = (composer.innerText || '');
    // Open WebUI truncates long names in the chip, so compare on a prefix.
    const stem = daaSchema.fileName.replace(/\.[^.]+$/, '').slice(0, 12);
    if (stem && shown.indexOf(stem) !== -1) { chipSeen = true; missStreak = 0; return; }
    if (!chipSeen) return;                       // never present: nothing removed
    // Require the chip to be missing on TWO consecutive passes. Open WebUI
    // empties the composer for a moment while a message is being sent, and a
    // single check read that gap as a deliberate removal.
    if (!missStreak) { missStreak = 1; return; }
    missStreak = 0;
    if (stem && shown.indexOf(stem) === -1) {
      chipSeen = false;
      offerUndoRemoval();
      resetSchemaForNewChat();
      // Every injected part must go, not just some. Leaving the reassurance
      // line behind meant injectChatBlank() (which only checks for .daa-blank)
      // added a NEW one each time, so the sentence piled up on screen after a
      // few upload-then-remove cycles.
      ['.daa-suggestions', '.daa-blank', '.daa-reassurance', '.daa-capab', '.daa-preview']
        .forEach(function (sel) {
          document.querySelectorAll(sel).forEach(function (el) { el.remove(); });
        });
    }
  }

  // Grant Ch 15: every destructive action deserves an undo. Detaching the
  // dataset is destructive in practice — the prompts, the preview and the
  // detected schema all disappear, and the only recovery was to find the file
  // and upload it again. A short-lived offer to undo removes that penalty.
  // [Grant Bab 40] the toast is fixed to the corner so it never displaces
  // anything the user is about to click.
  function offerUndoRemoval() {
    if (!lastDataset) return;
    const old = document.querySelector('.daa-undo');
    if (old) old.remove();

    const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
    const d = T[lang] || T.en;
    const file = lastDataset;

    const bar = document.createElement('div');
    bar.className = 'daa-undo';
    bar.setAttribute('role', 'status');
    const txt = document.createElement('span');
    txt.textContent = d.undo_removed;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'daa-undo-btn';
    btn.textContent = d.undo_action;
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      restoreDataset(file);
      bar.remove();
    });
    bar.appendChild(txt);
    bar.appendChild(btn);
    document.body.appendChild(bar);

    // Lower-RIGHT. Material Design places a desktop snackbar in a bottom
    // corner; the right one keeps it clear of the sidebar entirely and away
    // from the centred composer. A centred toast covered content and a
    // top-centre one floated over the title, which is why both were wrong.
    // [Grant Ch 93] don't confound expectations · [Ch 95] use known patterns
    bar.style.right = '24px';
    bar.style.bottom = '24px';
    bar.style.left = 'auto';
    bar.style.transform = 'none';

    setTimeout(function () { if (bar.parentNode) bar.remove(); }, 8000);
  }

  function restoreDataset(file) {
    // Safari restricts assigning to input.files, so the re-attach can fail
    // there even though it works in Chromium and Firefox. When it does, at
    // least bring the schema and its prompts back rather than doing nothing.
    let reattached = false;
    try {
      const input = document.querySelector('input[type="file"]:not([accept*="image"])')
                 || document.querySelector('input[type="file"]');
      if (input && window.DataTransfer) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        if (input.files && input.files.length) {
          input.dispatchEvent(new Event('change', { bubbles: true }));
          reattached = true;
        }
      }
    } catch (e) { reattached = false; }

    if (!reattached) readSchemaFromFile(file);
  }

  // Starting a brand new chat must forget the previous dataset, otherwise the
  // interface offers prompts about columns the user has not uploaded here.
  function resetSchemaForNewChat() {
    daaSchema = null;
    try { localStorage.removeItem(storeKey(null)); } catch (e) {}
    const bar = document.querySelector('.daa-followup');
    if (bar) bar.remove();
    const wrap = document.querySelector('.daa-suggestions');
    if (wrap) wrap.removeAttribute('data-daa-schema');
  }

  function splitDelimited(line, delim) {
    // Minimal CSV-aware split: respects double quotes, ignores delimiters
    // inside them. Enough for reading a header row reliably.
    const out = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === delim && !inQ) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  }

  function inferType(values) {
    let num = 0, date = 0, seen = 0;
    values.forEach(function (v) {
      if (v === undefined || v === null || v === '') return;
      seen++;
      // Dates MUST be tested before numbers. "2024-01-05" consists only of
      // digits and hyphens, so a numeric test would swallow it and the UI
      // would then offer nonsense such as "calculate the average of Date".
      if (/^\d{4}-\d{1,2}(-\d{1,2})?$/.test(v) ||
          /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(v)) { date++; return; }
      const cleaned = v.replace(/[^0-9.,\-]/g, '');
      if (cleaned && !isNaN(parseFloat(cleaned.replace(/,/g, '')))
          && /^[\d.,\-\s]+$/.test(v)) { num++; }
    });
    if (!seen) return 'text';
    if (date / seen >= 0.6) return 'date';
    if (num / seen >= 0.7) return 'number';
    return 'text';
  }

  // A grouping prompt is only useful for a column that actually has repeated
  // categories. Grouping by something like "Customer Name", where every row
  // is unique, produces a meaningless request, so we measure how repetitive
  // each text column is and keep the most category-like one.
  // Aggregation prompts ("highest X by Y", "contribution of each Y to X") only
  // read naturally for amount-like measures. Asking for the contribution of a
  // region to a UNIT PRICE is meaningless, while contribution to REVENUE is
  // exactly what a user wants. Average magnitude is a cheap, language-neutral
  // proxy: totals and amounts are numerically much larger than unit values
  // and counts, so we prefer the largest-magnitude measure for those prompts.
  function avgMagnitude(values) {
    let sum = 0, n = 0;
    values.forEach(function (v) {
      if (v === undefined || v === null || v === '') return;
      const f = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
      if (!isNaN(f)) { sum += Math.abs(f); n++; }
    });
    return n ? sum / n : 0;
  }

  function distinctRatio(values) {
    const seen = {};
    let n = 0, d = 0;
    values.forEach(function (v) {
      if (v === undefined || v === null || v === '') return;
      n++;
      if (!seen[v]) { seen[v] = 1; d++; }
    });
    return n ? d / n : 1;
  }

  function parseSchema(text) {
    // Grant Ch 47 "be forgiving": take the file as the user saved it.
    // A UTF-8 BOM is written by Excel on every "Save as CSV" on Windows, and
    // it lands invisibly at the very start of the file. Left in place it
    // becomes part of the FIRST column name, so a column saved as "Tanggal"
    // was read as "\uFEFFTanggal" and every prompt about it was subtly wrong.
    text = String(text || '').replace(/^\uFEFF/, '');
    // Exported files often carry blank or padding lines before the header.
    const lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (lines.length < 2) return null;
    // Pick the delimiter that yields the most header fields.
    const delims = [',', ';', '\t', '|'];
    let best = ',', bestN = 0;
    delims.forEach(function (d) {
      const n = splitDelimited(lines[0], d).length;
      if (n > bestN) { bestN = n; best = d; }
    });
    if (bestN < 2) return null;
    const header = splitDelimited(lines[0], best)
      .map(function (h) { return h.replace(/^["']|["']$/g, '').trim(); });
    const rows = lines.slice(1, 26)
      .map(function (l) { return splitDelimited(l, best); });
    const columns = header.map(function (name, i) {
      if (!name) return null;
      const vals = rows.map(function (r) { return r[i]; });
      return {
        name: name,
        type: inferType(vals),
        variety: distinctRatio(vals),
        magnitude: avgMagnitude(vals),
        // A column of numbers written with thousand separators arrives as
        // text. This is the single most common silent fault in Indonesian
        // spreadsheets ("18.000"), and it makes every sum and average wrong
        // without producing an error anywhere.
        numericText: looksNumericText(vals),
        mixedDates: hasMixedDateFormats(vals)
      };
    }).filter(Boolean);
    if (!columns.length) return null;

    return {
      columns: columns,
      // Everything below feeds the corrective-feedback layer. The parser
      // already knew all of it; it simply never said so.
      // [Grant Bab 45-46] name the specific problem, not "an error occurred"
      delimiter: best,
      headerLooksLikeData: headerLooksLikeData(header),
      rowCount: lines.length - 1,
      truncated: false
    };
  }

  // A header row that is itself data means the file was saved without column
  // names, so every column is called by its first value.
  function headerLooksLikeData(header) {
    if (!header.length) return false;
    let numeric = 0;
    header.forEach(function (h) {
      if (/^-?[\d.,]+$/.test(String(h).trim())) numeric++;
    });
    return numeric >= Math.ceil(header.length / 2);
  }

  function looksNumericText(values) {
    let n = 0, hit = 0;
    values.forEach(function (v) {
      const s = String(v === undefined ? '' : v).trim();
      if (!s) return;
      n++;
      // 1.234  ·  1.234,56  ·  1,234.56  ·  Rp 18.000
      if (/^(rp\s*)?-?\d{1,3}([.,]\d{3})+([.,]\d+)?$/i.test(s)) hit++;
    });
    return n >= 3 && hit / n >= 0.8;
  }

  function hasMixedDateFormats(values) {
    const shapes = {};
    let n = 0;
    values.forEach(function (v) {
      const s = String(v === undefined ? '' : v).trim();
      if (!s) return;
      let k = null;
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) k = 'ymd';
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) k = 'dmy-slash';
      else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) k = 'dmy-dash';
      if (!k) return;
      n++;
      shapes[k] = 1;
    });
    return n >= 3 && Object.keys(shapes).length > 1;
  }

  function fill(tpl, a, b) {
    return String(tpl).replace('{a}', a || '').replace('{b}', b || '');
  }

  // ================================================================
  // EXPLANATORY FEEDBACK  (v63)
  //
  // Ruiz et al. (2020) is the only source in this bibliography with
  // quantitative experimental evidence for a UX principle: feedback that
  // EXPLAINS beats feedback that merely corrects, p < 0.01, Cohen's d = 0.87.
  // Grant Ch 56 operationalises it: show the system's interpretation BEFORE
  // the user spends time on an answer built from a misreading.
  //
  // A local model on a laptop takes tens of seconds per answer, so a question
  // aimed at a column that does not exist costs the user a full round trip and
  // returns something invented. The schema is already parsed in the browser,
  // so the interface can say what it understood before anything is sent.
  //
  // The check is deliberately conservative: it reports columns it actually
  // matched, and otherwise only flags a token that is within a small edit
  // distance of a real column name. It never guesses at arbitrary words.
  // ================================================================
  function editDistance(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)
        );
      }
      prev = cur;
    }
    return prev[n];
  }

  function analyseQuestion(text, schema) {
    const out = { matched: [], nearMiss: null };
    if (!text || !schema || !schema.columns.length) return out;
    const low = ' ' + text.toLowerCase() + ' ';
    const names = schema.columns.map(function (c) { return c.name; });

    names.forEach(function (n) {
      if (low.indexOf(n.toLowerCase()) > -1) out.matched.push(n);
    });

    // Only look for a near miss among words the user typed that did NOT match
    // anything. Short words are skipped because at four characters almost
    // everything is within two edits of something.
    const words = (text.toLowerCase().match(/[a-zÀ-ɏ]{5,}/g) || []);
    for (let i = 0; i < words.length && !out.nearMiss; i++) {
      const w = words[i];
      if (out.matched.some(function (n) { return n.toLowerCase().indexOf(w) > -1; })) continue;
      let bestName = null, bestD = 99;
      names.forEach(function (n) {
        const d = editDistance(w, n.toLowerCase());
        if (d < bestD) { bestD = d; bestName = n; }
      });
      // Close enough to be a typo, far enough not to be a different word.
      if (bestName && bestD > 0 && bestD <= 2 && bestD / bestName.length <= 0.34) {
        out.nearMiss = { typed: words[i], suggestion: bestName };
      }
    }
    return out;
  }

  // The strip sits BELOW the composer on purpose. Above it, the box the user
  // is typing into would move every time the text changed.
  // [Grant Bab 40] never displace what the user is aiming at
  function renderInterpretation() {
    const editor = findChatInput();
    if (!editor) return;
    const host = editor.closest('form') || editor.parentElement;
    if (!host || !host.parentNode) return;

    let strip = document.querySelector('.daa-interpret');
    const text = (editor.textContent || '').trim();

    if (!daaSchema || text.length < 4) {
      if (strip) strip.remove();
      return;
    }

    const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
    const dict = T[lang] || T.en;
    const res = analyseQuestion(text, daaSchema);

    let msg = '', kind = 'ok';
    if (res.nearMiss) {
      kind = 'warn';
      msg = dict.ef_nocol
        .replace('{typed}', res.nearMiss.typed)
        .replace('{suggestion}', '"' + res.nearMiss.suggestion + '"');
    } else if (res.matched.length) {
      msg = dict.ef_matched.replace('{cols}', res.matched.join(', '));
    } else {
      if (strip) strip.remove();
      return;
    }

    if (!strip) {
      strip = document.createElement('p');
      strip.className = 'daa-interpret';
      strip.setAttribute('role', 'status');
      strip.setAttribute('aria-live', 'polite');
      host.parentNode.insertBefore(strip, host.nextSibling);
    }
    strip.setAttribute('data-kind', kind);
    if (strip.textContent !== msg) strip.textContent = msg;
  }

  // ================================================================
  // DOWNLOAD REPORT  (v63)
  // Step 7 of the user journey in the theory framework: "Tombol Unduh Laporan
  // tersedia setelah analisis selesai", placed on the axis of interaction
  // (Marsh Bab 65) and serving as part of the journey-end signal (Grant Bab 70).
  // Entirely client-side: the answer is already in the DOM.
  // ================================================================
  // Strip the interface out of a message before it goes into a document. The
  // bubble also holds citation chips, action buttons and icons, none of which
  // mean anything on paper.
  function cleanCopy(node) {
    const c = node.cloneNode(true);
    c.querySelectorAll('button, svg, input, .daa-followup, .daa-report-row, .daa-interpret, [role="button"]')
      .forEach(function (e) { e.remove(); });
    return c.innerHTML;
  }

  // Collect the conversation in reading order. Open WebUI marks the two roles
  // with .chat-user and .chat-assistant, measured on the running app.
  function collectReport(scope, dict) {
    const parts = [];
    if (scope === 'answer') {
      const list = document.querySelectorAll('.chat-assistant');
      if (!list.length) return parts;
      parts.push({ role: 'assistant', html: cleanCopy(list[list.length - 1]) });
      return parts;
    }
    const msgs = document.querySelectorAll('#messages-container .chat-user, #messages-container .chat-assistant');
    msgs.forEach(function (m) {
      const html = cleanCopy(m);
      if (!(m.textContent || '').trim()) return;
      parts.push({ role: m.classList.contains('chat-user') ? 'user' : 'assistant', html: html });
    });
    return parts;
  }

  // One document body, used by both formats, so a PDF and a Word file of the
  // same report are identical in content and order.
  function buildReportHtml(parts, dict, lang) {
    const esc = function (s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
    let body = '';
    parts.forEach(function (p) {
      const label = p.role === 'user' ? dict.dl_h_question : dict.dl_h_answer;
      body += '<h2 class="role">' + esc(label) + '</h2><div class="msg">' + p.html + '</div>';
    });
    const meta = [];
    if (daaSchema && daaSchema.fileName) meta.push(esc(dict.dl_h_dataset + ': ' + daaSchema.fileName));
    meta.push(esc(new Date().toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')));
    return '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8">' +
      '<title>' + esc(dict.dl_h_title) + '</title><style>' +
      // The document keeps the same three-step type scale as the interface, so
      // the printed report reads with the hierarchy it was designed with.
      'body{font-family:Georgia,"Times New Roman",serif;font-size:11pt;line-height:1.5;color:#1a1a1a;max-width:17cm;margin:2cm auto;}' +
      'h1{font-size:16pt;margin:0 0 4pt;}' +
      '.meta{font-size:9pt;color:#555;margin:0 0 18pt;}' +
      'h2.role{font-size:11pt;font-weight:700;margin:18pt 0 4pt;color:#5A4632;' +
      'border-bottom:1px solid #d8cfc4;padding-bottom:2pt;}' +
      '.msg{margin:0 0 6pt;}' +
      'table{border-collapse:collapse;width:100%;font-size:10pt;margin:8pt 0;}' +
      'th,td{border:1px solid #c9c0b5;padding:4pt 6pt;text-align:left;}' +
      'th{background:#f2ece5;}' +
      'code{font-family:Consolas,monospace;font-size:10pt;background:#f2ece5;padding:1pt 3pt;}' +
      '@page{margin:2cm;}' +
      '</style></head><body>' +
      '<h1>' + esc(dict.dl_h_title) + '</h1>' +
      '<p class="meta">' + meta.join(' &middot; ') + '</p>' +
      body + '</body></html>';
  }

  // PDF without a library. A print window plus the system print dialog gives a
  // real PDF on macOS ("Save as PDF") and keeps the deployment dependency-free,
  // which matters for an interface that has to run fully offline.
  function exportPdf(html, dict) {
    const w = window.open('', '_blank');
    if (!w) { toast(dict.dl_pdf_hint); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(function () { w.print(); }, 400);
    toast(dict.dl_pdf_hint);
  }

  // Word opens an HTML document served with this MIME type and keeps the
  // tables and headings editable, so no packaging library is needed.
  function exportDoc(html, dict) {
    const blob = new Blob(['﻿' + html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'laporan-daat-' + Date.now() + '.doc';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast(dict.dl_done);
  }

  function runExport(scope, format) {
    const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
    const dict = T[lang] || T.en;
    const parts = collectReport(scope, dict);
    if (!parts.length) return;
    const html = buildReportHtml(parts, dict, lang);
    if (format === 'pdf') exportPdf(html, dict); else exportDoc(html, dict);
  }

  // Downloading is an EASY-tier action (Grant Bab 96), so it may cost one extra
  // click. Four explicit choices are offered rather than two dropdowns, because
  // a user who scans rather than reads should be able to pick in one glance.
  // [Krug Bab 4] satisficing: name the whole choice on the control itself
  function openDownloadMenu(anchorBtn) {
    const existing = document.querySelector('.daa-dlmenu');
    if (existing) { existing.remove(); anchorBtn.setAttribute('aria-expanded', 'false'); return; }

    const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
    const dict = T[lang] || T.en;
    const menu = document.createElement('div');
    menu.className = 'daa-dlmenu';
    menu.setAttribute('role', 'group');
    menu.setAttribute('aria-label', dict.dl_choose);

    const cap = document.createElement('p');
    cap.className = 'daa-dlmenu-cap';
    cap.textContent = dict.dl_choose;
    menu.appendChild(cap);

    [['answer', 'pdf', dict.dl_one_pdf],
     ['answer', 'doc', dict.dl_one_doc],
     ['all', 'pdf', dict.dl_all_pdf],
     ['all', 'doc', dict.dl_all_doc]].forEach(function (opt) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'daa-dlmenu-item';
      b.textContent = opt[2];
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        menu.remove();
        anchorBtn.setAttribute('aria-expanded', 'false');
        runExport(opt[0], opt[1]);
      });
      menu.appendChild(b);
    });

    anchorBtn.setAttribute('aria-expanded', 'true');
    anchorBtn.parentNode.appendChild(menu);

    // Grant Bab 15: any panel must be dismissible without committing to it.
    setTimeout(function () {
      document.addEventListener('click', function close(ev) {
        if (menu.contains(ev.target) || ev.target === anchorBtn) return;
        menu.remove();
        anchorBtn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', close);
      });
      document.addEventListener('keydown', function esc(ev) {
        if (ev.key !== 'Escape') return;
        if (menu.parentNode) menu.remove();
        anchorBtn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('keydown', esc);
      });
    }, 0);
  }

  function toast(message) {
    const old = document.querySelector('.daa-toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'daa-toast';
    t.setAttribute('role', 'status');
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 2600);
  }

  // Build a prompt set from the detected schema. Order matters: broad prompts
  // first (they always apply), then prompts that depend on column types.
  function buildSchemaPrompts(schema, dict) {
    const nums = schema.columns.filter(function (c) { return c.type === 'number'; });
    const dates = schema.columns.filter(function (c) { return c.type === 'date'; });
    // Keep only text columns that repeat (real categories), most repetitive
    // first, so "compare X by Y" gets a sensible Y instead of an identifier.
    const cats = schema.columns
      .filter(function (c) { return c.type === 'text' && c.variety <= 0.6; })
      .sort(function (a, b) { return a.variety - b.variety; });
    const out = [dict.p_summary, dict.p_quality];

    // Spread the prompts across DIFFERENT measures instead of repeating the
    // first numeric column. Always reusing nums[0] produced a set that all
    // talked about the same field, which hides the rest of the dataset from
    // a user who does not yet know what they can ask.
    const m0 = nums[0], m1 = nums[1] || nums[0], m2 = nums[2] || nums[0];
    if (m0) out.push(fill(dict.p_avg, m0.name));
    if (m1 && cats[0]) out.push(fill(dict.p_group, m1.name, cats[0].name));
    if (m2 && dates[0]) out.push(fill(dict.p_trend, m2.name, dates[0].name));
    if (nums.length >= 2) out.push(fill(dict.p_corr, nums[0].name, nums[1].name));
    if (m0 && out.length < 6) out.push(fill(dict.p_dist, m0.name));

    return out.slice(0, 6);
  }

  // Follow-up prompts. Once an answer exists the blank slate is gone, so the
  // user loses all prompt scaffolding exactly when they need to drill deeper.
  // These deliberately use columns the opening prompts did not, so the set
  // keeps revealing new angles rather than repeating the first question.
  // v58 rewrite. The previous version returned the SAME three prompts for the
  // whole conversation, so the bar stopped being a next step and became a menu
  // that ignored what had just been answered.
  //
  // It now builds a POOL of candidate questions from the schema and ranks them
  // against the last answer, so the list moves with the analysis:
  //   - a question already asked is dropped,
  //   - a question about a column the last answer actually discussed is
  //     promoted, because that is where the user's attention already is,
  //   - a question about an untouched column is kept in reserve, so the set
  //     still opens new ground once the current thread is exhausted.
  // [Amershi et al. 2019, G3] time services based on context
  // [Grant Bab 20] keep offering the next step, not the first step again
  function buildFollowupPool(schema, dict) {
    const nums = schema.columns.filter(function (c) { return c.type === 'number'; });
    const dates = schema.columns.filter(function (c) { return c.type === 'date'; });
    const cats = schema.columns
      .filter(function (c) { return c.type === 'text' && c.variety <= 0.6; })
      .sort(function (a, b) { return a.variety - b.variety; });

    // Amount-like measure for the aggregation prompts (see avgMagnitude).
    const amount = nums.slice().sort(function (a, b) {
      return (b.magnitude || 0) - (a.magnitude || 0);
    })[0];
    const m0 = amount || nums[0];
    const m1 = nums.filter(function (c) { return !m0 || c.name !== m0.name; })[0];
    const c0 = cats[0];
    const c1 = cats[1];
    const d0 = dates[0];

    // Each entry keeps the columns it talks about, so relevance can be scored
    // later without re-parsing the sentence.
    const pool = [];
    function add(text, cols) {
      if (!text) return;
      pool.push({ text: text, cols: cols.filter(Boolean).map(function (c) { return c.name; }) });
    }

    if (m0 && c0) add(fill(dict.p_top, m0.name, c0.name), [m0, c0]);
    if (m0 && c0) add(fill(dict.p_share, m0.name, c0.name), [m0, c0]);
    if (m0 && c0) add(fill(dict.p_lowest, m0.name, c0.name), [m0, c0]);
    if (m0 && d0) add(fill(dict.p_trend, m0.name, d0.name), [m0, d0]);
    if (m0 && d0) add(fill(dict.p_compare_period, m0.name, d0.name), [m0, d0]);
    if (m0 && c1) add(fill(dict.p_drill, m0.name, c1.name), [m0, c1]);
    if (m0) add(fill(dict.p_outlier, m0.name), [m0]);
    if (m0) add(fill(dict.p_why, m0.name), [m0]);
    if (m1 && c0) add(fill(dict.p_group, m1.name, c0.name), [m1, c0]);
    if (m1) add(fill(dict.p_avg, m1.name), [m1]);
    if (m0 && m1) add(fill(dict.p_corr, m0.name, m1.name), [m0, m1]);
    if (m0) add(fill(dict.p_dist, m0.name), [m0]);
    add(dict.p_table, []);
    return pool;
  }

  // The text of the answer the user is looking at right now. Used to tell a
  // relevant next question from an arbitrary one.
  function lastAnswerText() {
    const as = document.querySelectorAll('.chat-assistant');
    if (!as.length) return '';
    return (as[as.length - 1].innerText || '').toLowerCase();
  }

  function buildFollowupPrompts(schema, dict) {
    const pool = buildFollowupPool(schema, dict);
    if (!pool.length) return [];
    const answer = lastAnswerText();

    const scored = pool.map(function (p, i) {
      let score = 0;
      // A question about a column the answer just discussed continues the
      // thread the user is already in.
      for (let k = 0; k < p.cols.length; k++) {
        if (answer.indexOf(p.cols[k].toLowerCase()) > -1) score += 2;
      }
      // "Show the result above as a table" only makes sense once numbers exist.
      if (!p.cols.length && !answer) score -= 5;
      return { text: p.text, score: score, order: i };
    });

    const fresh = filterAlreadyAsked(scored);
    fresh.sort(function (a, b) {
      return (b.score - a.score) || (a.order - b.order);
    });
    return fresh.slice(0, 3).map(function (p) { return p.text; });
  }

  // Open WebUI renders its own "Follow up" block at the end of a COMPLETED
  // answer. Anchoring to that block gives three things at once:
  //   1. correct timing   - it only exists after generation has finished,
  //   2. correct position - it lives inside the conversation flow, so it
  //      scrolls with the content instead of floating over the report,
  //   3. no duplication   - we hide it and take its place.
  // The previous version floated above the composer, which covered the report
  // while scrolling, appeared mid-generation, and sat next to Open WebUI's own
  // follow-up list.
  // ROOT-CAUSE FIX (v55): both heading detectors required el.firstChild to be a
  // TEXT node. Svelte renders comment anchors and Open WebUI puts an icon in
  // front of these headings, so the first child is a comment or an <svg> and
  // the match never fired. Measured on the running app: the "Disarankan"
  // heading has firstChild.nodeType === 8 (a comment). That single wrong
  // assumption is why the default suggestion cards stayed visible AND why our
  // follow-up chips never rendered. Reading textContent is what actually works.
  function headingText(el) {
    if (!el || el.children.length > 2) return '';
    const t = (el.textContent || '').trim();
    return t.length && t.length <= 40 ? t.toLowerCase() : '';
  }

  const FOLLOWUP_HEADINGS = ['follow up', 'follow-up', 'tindak lanjut', 'lanjutan'];

  function findOwuiFollowupBlock() {
    // PERFORMANCE: this used to scan every div/span/p in the document. During
    // streaming the observer fires on almost every frame, so that scan ran
    // dozens of times a second over thousands of nodes and starved the main
    // thread — the reply appeared to hang. The search is now limited to the
    // tail of the conversation, where the block always is.
    // MEASURED (v57): this build renders no <main> element, so the scope
    // always fell back to document.body and the "capped" scan still walked
    // the whole page. The conversation is in #messages-container, which is
    // both correct and much smaller.
    const scope = document.getElementById('messages-container') ||
                  document.querySelector('main') || document.body;
    const kids = scope.querySelectorAll('h1,h2,h3,h4,h5,h6,div,span,p');
    const nodes = kids.length > 400
      ? [].slice.call(kids, kids.length - 400)
      : kids;
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (FOLLOWUP_HEADINGS.indexOf(headingText(el)) === -1) continue;
      if (el.closest('.daa-followup')) continue;
      let wrap = el.parentElement;
      while (wrap && wrap.children.length === 1) wrap = wrap.parentElement;
      if (!wrap) continue;
      // SAFETY: this walk could climb past the follow-up list into a container
      // that also holds the conversation or the composer. Hiding that would
      // blank the whole screen, so anything too large is rejected.
      if (wrap.querySelector('#chat-input, textarea, [contenteditable="true"]')) continue;
      if ((wrap.innerText || '').length > 1200) continue;
      if (wrap === document.body || wrap === document.documentElement) continue;
      return wrap;
    }
    return null;
  }

  // A prompt the user has already sent is no longer a useful suggestion, so
  // anything already present in the conversation is dropped. This is what makes
  // the list feel tied to THIS analysis instead of being a fixed menu.
  // ROOT CAUSE OF "follow-up tidak berubah" (v58): this used to read
  // document.body.innerText, which CONTAINS THE CHIPS THEMSELVES. Every
  // candidate therefore looked like it had already been asked, the filter
  // emptied, the safety fallback returned the unfiltered list, and the user saw
  // the identical three suggestions after every answer, including the one she
  // had just clicked.
  //
  // Only what the USER actually sent counts as asked, so the text is read from
  // the user messages alone.
  function askedText() {
    const els = document.querySelectorAll('.chat-user');
    let s = '';
    for (let i = 0; i < els.length; i++) s += ' ' + (els[i].innerText || '');
    return s.toLowerCase();
  }

  function filterAlreadyAsked(prompts) {
    const asked = askedText();
    if (!asked.trim()) return prompts;
    const fresh = prompts.filter(function (p) {
      return asked.indexOf(p.text.toLowerCase()) === -1;
    });
    return fresh.length ? fresh : prompts;
  }

  // Records why the bar did not render, so __daaDebug() can explain it instead
  // of leaving us to guess from a screenshot.
  let followupSkipReason = '';

  // Where our own follow-up bar is mounted.
  //
  // ROOT CAUSE OF "follow up LAMA" (v57): the bar used to be appended INSIDE
  // Open WebUI's follow-up block, so it could not appear until that block
  // existed. Open WebUI builds that block with a SECOND model call issued
  // after the answer has finished streaming, which on a local model takes
  // several seconds. Our prompts are derived from the dataset's own columns
  // and are ready the moment the answer ends, so waiting for Open WebUI was
  // pure, self-inflicted latency.
  //
  // The bar is now anchored to the last assistant message itself, which is
  // present as soon as the answer is. Measured on the running app: the
  // assistant bubble is `.chat-assistant`, and its parent is the per-message
  // column that also holds the action row, so appending there puts the
  // suggestions directly under the answer they belong to.
  // [Krug Bab 3] keep a control next to the thing it acts on
  function findFollowupAnchor() {
    const list = document.querySelectorAll('.chat-assistant');
    if (!list.length) return null;
    const last = list[list.length - 1];
    return last.parentElement || null;
  }

  // Whether the answer in `anchor` has actually finished.
  //
  // MEASURED BUG (v58): the bar appeared while the model was still writing, at
  // the moment only "Retrieved 1 source" was on screen. isGenerating() alone was
  // not enough, because it looks for a stop control whose accessible name this
  // build does not provide. Open WebUI only renders the per-message action row
  // (edit / copy / read aloud / details / regenerate) once the message is
  // complete, so the presence of that row is a direct, observable signal.
  // Suggesting a next step before the current one has finished contradicts the
  // whole point of the bar. [Amershi et al. 2019, G3] time services based on context
  function answerIsComplete(anchor) {
    if (!anchor) return false;
    // NOTE (v59): isGenerating() is deliberately NOT consulted here. Open WebUI
    // stays in its "generating" state after the answer is done while it
    // generates the chat title and its own follow-up questions, so that signal
    // reports busy long after this particular message is complete.
    if (anchor.querySelector('[id^="info-"]')) return true;
    // Fallback for builds that render the row differently: at least three
    // action buttons sitting OUTSIDE the answer bubble.
    const bubble = anchor.querySelector('.chat-assistant');
    const btns = [].filter.call(anchor.querySelectorAll('button'), function (b) {
      return !bubble || !bubble.contains(b);
    });
    return btns.length >= 3;
  }

  function renderFollowupPrompts() {
    const inChat = /\/c\//.test(location.pathname);
    const anchor = inChat ? findFollowupAnchor() : null;
    const owui = inChat ? findOwuiFollowupBlock() : null;

    if (!anchor) {
      followupSkipReason = !inChat
        ? 'not in a /c/ chat'
        : 'no assistant message yet';
      const stale = document.querySelector('.daa-followup');
      if (stale) stale.remove();
      return;
    }

    if (!daaSchema) { followupSkipReason = 'no dataset schema for this chat'; return; }

    if (!answerIsComplete(anchor)) {
      followupSkipReason = 'the answer is still being written';
      const stale = document.querySelector('.daa-followup');
      if (stale) stale.remove();
      return;
    }

    const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
    const dict = T[lang] || T.en;
    // buildFollowupPrompts already drops what has been asked and ranks the rest
    // against the answer on screen, so no second filter is applied here.
    const prompts = buildFollowupPrompts(daaSchema, dict);

    // Open WebUI writes its follow-up questions in English regardless of the
    // interface language, presents them as plain grey rows that do not read as
    // controls, and attaches a `title` to each one that merely repeats the
    // visible text, producing a tooltip on hover. Hiding them only under INA
    // (an earlier attempt) made the same screen behave differently in the two
    // languages, which is worse.
    //
    // The whole block is therefore hidden in BOTH languages once we have
    // prompts of our own, which are translated, derived from the user's actual
    // columns, and filtered against what has already been asked.
    // [Krug Bab 5] one voice · [Grant Ch 7] a control must look like a control
    // [Grant Ch 31] never explain a label with a tooltip that repeats it
    if (owui && prompts.length) {
      [].forEach.call(owui.children, function (child) {
        if (child.classList && child.classList.contains('daa-followup')) return;
        child.style.display = 'none';
      });
      stripFollowupTooltips(owui);
    }

    if (!prompts.length) {
      followupSkipReason = 'every generated prompt was already asked';
      return;
    }
    followupSkipReason = '';

    // Reuse the existing bar when the answer it belongs to has not changed.
    // Rebuilding it on every tick made the chips flicker and lose focus.
    // [Grant Bab 40] do not redraw what the user may be about to click
    const existing = document.querySelector('.daa-followup');
    const signature = prompts.join('');
    if (existing && existing.parentElement === anchor &&
        existing.getAttribute('data-daa-sig') === signature) return;
    if (existing) existing.remove();

    const bar = document.createElement('div');
    bar.className = 'daa-followup';
    bar.setAttribute('data-daa-sig', signature);

    // Journey end (Grant Bab 70): once an analysis exists, the user needs a way
    // to take it out of the tool. Placed on the axis of interaction, directly
    // under the answer it exports (Marsh Bab 65).
    const dlRow = document.createElement('div');
    dlRow.className = 'daa-report-row';
    const dl = document.createElement('button');
    dl.type = 'button';
    dl.className = 'daa-sug daa-report';
    dl.textContent = dict.dl_report;
    dl.setAttribute('aria-haspopup', 'true');
    dl.setAttribute('aria-expanded', 'false');
    dl.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      openDownloadMenu(dl);
    });
    dlRow.appendChild(dl);
    bar.appendChild(dlRow);
    // Open WebUI's questions are written by the model; these come from the
    // dataset's own columns. Labelling the group makes the different visual
    // treatment read as deliberate provenance rather than an inconsistency.
    const cap = document.createElement('p');
    cap.className = 'daa-followup-hint';
    cap.textContent = dict.followup_hint;
    bar.appendChild(cap);
    const row = document.createElement('div');
    row.className = 'daa-followup-row';
    prompts.forEach(function (p) {
      const b = document.createElement('button');
      b.className = 'daa-sug daa-followup-sug';
      b.type = 'button';
      b.textContent = p;
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        insertPrompt(p);
      });
      row.appendChild(b);
    });
    bar.appendChild(row);
    anchor.appendChild(bar);
  }

  // Clicking one of Open WebUI's follow-up questions SENDS it immediately, so
  // the user never gets to adjust the wording first. For a data question that
  // matters: "show me this on a chart" usually needs a column name added before
  // it is worth asking. We intercept in the capture phase, before Open WebUI's
  // own handler runs, and drop the text into the composer instead.
  function interceptOwuiFollowup() {
    if (document.__daaFollowupIntercept) return;
    document.__daaFollowupIntercept = true;
    document.addEventListener('click', function (ev) {
      if (ev.target.closest('.daa-sug')) return;   // our own chips handle themselves
      // Insurance: never touch a click inside the composer. Verified by
      // replaying the walk below against the stop control (it does not match),
      // but a capture-phase handler that can cancel an event has no business
      // being anywhere near the send and stop buttons.
      if (ev.target.closest('#message-input-container')) return;
      // Resolve the block by walking UP from the click, not by scanning the
      // document. The scan was rate-limited for performance, so at click time
      // it often returned nothing and Open WebUI's own handler fired first —
      // which is why the question was sent instead of inserted.
      let blk = null, node = ev.target;
      for (let i = 0; i < 7 && node && node !== document.body; i++) {
        if (FOLLOWUP_HEADINGS.indexOf(headingText(node.firstElementChild)) !== -1) {
          blk = node; break;
        }
        node = node.parentElement;
      }
      if (!blk) return;
      const item = ev.target.closest('button, [role="button"], li, div');
      if (!item || !blk.contains(item)) return;
      const text = (item.innerText || '').trim();
      if (!text) return;
      const low = text.toLowerCase();
      if (FOLLOWUP_HEADINGS.indexOf(low) !== -1) return;   // the heading itself
      if (text.length > 400) return;                        // clicked the wrapper
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      insertPrompt(text);
    }, true);
  }

  // ================================================================
  // DATASET PREVIEW & VALIDATION  (v39)
  //
  // Requirement served: "dataset upload". Until now the interface accepted a
  // file and said nothing about it, so the user had to trust that the right
  // data had been read. Amershi et al. (2019) recommend making clear what the
  // system has understood; showing the detected shape turns a silent upload
  // into an observable one, and surfaces problems (empty columns) BEFORE the
  // user spends a question on them.
  //
  // The schema is already parsed in the browser for the prompts, so this adds
  // information without adding work or sending anything anywhere.
  // ================================================================
  function renderDatasetPreview() {
    if (!daaSchema) return;
    const host = document.querySelector('.daa-blank');
    if (!host) return;
    if (host.querySelector('.daa-preview')) return;

    const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
    const dict = T[lang] || T.en;
    const cols = daaSchema.columns;
    const num = cols.filter(function (c) { return c.type === 'number'; }).length;
    const date = cols.filter(function (c) { return c.type === 'date'; }).length;
    const cat = cols.length - num - date;
    // A column whose sampled values were almost all blank is worth flagging.
    const empty = cols.filter(function (c) { return c.variety === 1 && c.magnitude === 0 && c.type === 'text'; });

    const box = document.createElement('div');
    box.className = 'daa-preview';

    // Grant Bab 54 asks the upload confirmation to state file name, ROW COUNT
    // and column count. The row count was missing, so the user could not tell
    // whether the whole file had arrived. Only the first 64 KB is parsed, so on
    // a larger file the number is labelled as a lower bound instead of being
    // presented as a total.
    const line = document.createElement('p');
    line.className = 'daa-preview-line';
    const rowsTxt = daaSchema.rowCount
      ? (daaSchema.truncated
          ? dict.dp_rows_min.replace('{n}', daaSchema.rowCount)
          : dict.dp_rows.replace('{n}', daaSchema.rowCount)) + '  ·  '
      : '';
    line.textContent = rowsTxt + dict.dp_cols.replace('{n}', cols.length) + '  ·  ' +
      dict.dp_types.replace('{num}', num).replace('{cat}', cat).replace('{date}', date);
    box.appendChild(line);

    // ---- Corrective feedback layer (Grant Bab 45-46) ----
    // Everything below was already known to the parser and never surfaced.
    // Each note names the specific problem and what to do about it, which is
    // the distinction Grant draws between a useful message and "an error
    // occurred". They are notes, not errors: the file still works.
    const notes = [];
    const DELIM_NAME = { ';': ';', '\t': 'tab', '|': '|' };
    if (daaSchema.delimiter && daaSchema.delimiter !== ',') {
      notes.push(dict.cf_delim.replace('{d}', DELIM_NAME[daaSchema.delimiter] || daaSchema.delimiter));
    }
    if (daaSchema.headerLooksLikeData) notes.push(dict.cf_noheader);
    const numTextCols = cols.filter(function (c) { return c.numericText; }).map(function (c) { return c.name; });
    if (numTextCols.length) notes.push(dict.cf_numtext.replace('{cols}', numTextCols.join(', ')));
    const mixDateCols = cols.filter(function (c) { return c.mixedDates; }).map(function (c) { return c.name; });
    if (mixDateCols.length) notes.push(dict.cf_mixdate.replace('{cols}', mixDateCols.join(', ')));

    notes.forEach(function (t) {
      const n = document.createElement('p');
      n.className = 'daa-preview-note';
      n.textContent = t;
      box.appendChild(n);
    });

    // Wide datasets. Showing a fixed slice and dropping the rest silently was
    // wrong: with 100 columns the user would believe the file had 8. The list
    // is capped for readability, but the remainder is ALWAYS accounted for and
    // can be opened, inside a scrollable area so it can never take over the
    // screen. [Amershi et al. 2019] be honest about what the system holds
    // [Krug Bab 1] show what is needed now, keep the rest one click away
    const PREVIEW_LIMIT = 6;
    const chips = document.createElement('div');
    chips.className = 'daa-preview-cols';

    function chipFor(c) {
      const t = document.createElement('span');
      t.className = 'daa-col daa-col-' + c.type;
      t.textContent = c.name;
      t.title = c.name + ' (' + c.type + ')';   // full name on hover if truncated
      return t;
    }

    function paint(expanded) {
      chips.innerHTML = '';
      chips.classList.toggle('is-expanded', !!expanded);
      const shown = expanded ? cols : cols.slice(0, PREVIEW_LIMIT);
      shown.forEach(function (c) { chips.appendChild(chipFor(c)); });

      const hidden = cols.length - shown.length;
      if (hidden > 0 || expanded) {
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'daa-col daa-col-more';
        more.textContent = expanded
          ? dict.dp_less
          : dict.dp_more.replace('{n}', hidden);
        more.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        more.addEventListener('click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          paint(!expanded);
        });
        chips.appendChild(more);
      }
    }

    paint(false);
    box.appendChild(chips);

    if (empty.length) {
      const w = document.createElement('p');
      w.className = 'daa-preview-warn';
      w.setAttribute('role', 'status');
      w.textContent = dict.dp_warn_empty;
      box.appendChild(w);
    }

    // Grant Ch 56: when a wait is unavoidable, say so BEFORE it starts. The
    // schema here is parsed from the first 64 KB, so it appears instantly even
    // for a 200 MB file — which is misleading, because Open WebUI is still
    // uploading and indexing the whole thing in the background. Setting the
    // expectation prevents the interface from looking broken.
    const BIG = 20 * 1024 * 1024;
    if (daaSchema.fileSize && daaSchema.fileSize > BIG) {
      const mb = Math.round(daaSchema.fileSize / (1024 * 1024));
      const w2 = document.createElement('p');
      w2.className = 'daa-preview-warn';
      w2.setAttribute('role', 'status');
      w2.textContent = dict.dp_big_file.replace('{size}', mb + ' MB');
      box.appendChild(w2);
    }
    host.appendChild(box);
  }

  function renderSchemaPrompts() {
    const wrap = document.querySelector('.daa-suggestions');
    if (!wrap || !daaSchema) return;
    const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
    const dict = T[lang] || T.en;
    const prompts = buildSchemaPrompts(daaSchema, dict);
    if (!prompts.length) return;

    wrap.innerHTML = '';
    wrap.setAttribute('data-daa-schema', 'true');
    prompts.forEach(function (p) {
      const b = document.createElement('button');
      b.className = 'daa-sug';
      b.type = 'button';
      b.textContent = p;
      b.addEventListener('click', function () { insertPrompt(p); });
      wrap.appendChild(b);
    });

    renderDatasetPreview();

    const sub = document.querySelector('.daa-blank-subtitle');
    if (sub) {
      sub.textContent = dict.schema_ready;
      sub.removeAttribute('data-i18n-chat'); // stop generic re-translation
    }
  }

  // Shared prompt insertion (TipTap/ProseMirror needs a real input event).
  function insertPrompt(text) {
    const editor = findChatInput();
    if (!editor) return;
    editor.focus();
    setTimeout(function () {
      try {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editor);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('insertText', false, text);
      } catch (err) {
        editor.innerHTML = '<p>' + text.replace(/[&<>]/g, '') + '</p>';
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 10);
  }

  // Capability panel. Short, plain-language, and served by the interface so it
  // is always accurate and available even before any model has loaded.
  function toggleCapabilities() {
    const trigger = document.querySelector('[data-action="capabilities"]');
    const existing = document.querySelector('.daa-capab');
    if (existing) {
      existing.remove();
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      return;
    }
    const wrap = document.querySelector('.daa-suggestions');
    if (!wrap || !wrap.parentNode) return;
    if (trigger) trigger.setAttribute('aria-expanded', 'true');

    const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
    const d = T[lang] || T.en;

    const box = document.createElement('div');
    box.className = 'daa-capab';
    box.setAttribute('role', 'note');
    const items = [d.capab_1, d.capab_2, d.capab_3].map(function (t) {
      return '<li>' + t + '</li>';
    }).join('');
    box.innerHTML =
      '<p class="daa-capab-title">' + d.capab_title + '</p>' +
      '<ul class="daa-capab-list">' + items + '</ul>' +
      '<button class="daa-capab-close" type="button">' + d.capab_close + '</button>';
    // Grant Ch 84 "Show, don't tell": a miniature of the actual output tells a
    // first-time user what an analysis looks like far faster than a sentence
    // describing it. Kept deliberately small so the panel stays scannable
    // (Krug Bab 3) and clearly marked as an example, not real data.
    const ex = document.createElement('div');
    ex.className = 'daa-example';
    // Mirrors the shape of a REAL DAAT report: the file line, the "computed
    // from the data" note that distinguishes backend figures from LLM prose,
    // the key-figures table with a share column, then the chart. Showing the
    // actual structure sets an accurate expectation. [Grant Ch 84]
    ex.innerHTML =
      '<p class="daa-example-cap">' + d.capab_example + '</p>' +
      '<div class="daa-example-body">' +
        '<p class="daa-example-file">\uD83D\uDCC1 ' + d.ex_file + '</p>' +
        '<p class="daa-example-finding">' + d.ex_finding + '</p>' +
        '<p class="daa-example-note">\uD83D\uDCCA ' + d.ex_note + '</p>' +
        '<table class="daa-example-table"><thead><tr>' +
          '<th>' + d.ex_col_region + '</th>' +
          '<th class="num">' + d.ex_col_revenue + '</th>' +
          '<th class="num">' + d.ex_col_share + '</th>' +
          '<th class="num">N</th>' +
        '</tr></thead><tbody>' +
          '<tr><td>Bandung</td><td class="num">1.017.000</td><td class="num">39,3%</td><td class="num">5</td></tr>' +
          '<tr><td>Jakarta</td><td class="num">927.500</td><td class="num">35,8%</td><td class="num">4</td></tr>' +
          '<tr><td>Surabaya</td><td class="num">645.000</td><td class="num">24,9%</td><td class="num">3</td></tr>' +
        '</tbody></table>' +
        '<p class="daa-example-chartlabel">\uD83D\uDCCA ' + d.ex_chart_label + ' — ' + d.ex_chart + '</p>' +
        '<div class="daa-example-chart" role="img" aria-label="' + d.ex_chart + '">' +
          '<span style="height:100%"></span>' +
          '<span style="height:91%"></span>' +
          '<span style="height:63%"></span>' +
        '</div>' +
      '</div>';
    box.appendChild(ex);

    box.querySelector('.daa-capab-close')
       .addEventListener('click', function () { box.remove(); });
    wrap.parentNode.insertBefore(box, wrap.nextSibling);
  }

  // Build a small demo dataset in the browser and hand it to Open WebUI's own
  // file input, so the sample travels the exact same path as a real upload
  // (no special case in the analysis flow, and nothing fetched from outside).
  const SAMPLE_CSV =
    'Tanggal,Wilayah,Produk,Kategori,Jumlah,HargaSatuan,Pendapatan,Diskon\n' +
    '2024-01-05,Bandung,Kopi Arabika,Minuman,12,20000,240000,5\n' +
    '2024-01-06,Jakarta,Teh Melati,Minuman,8,15000,120000,0\n' +
    '2024-01-07,Bandung,Kopi Arabika,Minuman,15,20000,300000,10\n' +
    '2024-01-08,Surabaya,Gula Aren,Bahan,20,7500,150000,2\n' +
    '2024-01-12,Jakarta,Kopi Robusta,Minuman,10,18000,180000,0\n' +
    '2024-01-15,Bandung,Teh Melati,Minuman,6,15000,90000,5\n' +
    '2024-01-18,Surabaya,Kopi Arabika,Minuman,18,20000,360000,8\n' +
    '2024-02-02,Jakarta,Gula Aren,Bahan,25,7500,187500,0\n' +
    '2024-02-09,Bandung,Kopi Robusta,Minuman,14,18000,252000,5\n' +
    '2024-02-14,Surabaya,Teh Melati,Minuman,9,15000,135000,0\n' +
    '2024-02-20,Jakarta,Kopi Arabika,Minuman,22,20000,440000,12\n' +
    '2024-03-01,Bandung,Gula Aren,Bahan,30,7500,225000,3\n';

  function loadSampleDataset() {
    try {
      const file = new File([SAMPLE_CSV], 'contoh_penjualan.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]:not([accept*="image"])')
                 || document.querySelector('input[type="file"]');
      if (input && window.DataTransfer) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    } catch (e) { /* fall through */ }
    // If the input cannot be driven, at least show the prompts for it.
    const schema = parseSchema(SAMPLE_CSV);
    if (schema) { daaSchema = schema; saveSchema(schema); renderSchemaPrompts(); }
  }

  // Recovering the schema from the conversation itself.
  //
  // Detecting the dataset only at upload time turned out to be fragile: it
  // works when the user picks a file, but not when they reload mid-chat,
  // re-attach a file Open WebUI already has, or open an older conversation.
  // In those cases the prompts silently disappeared and never came back.
  //
  // Open WebUI keeps uploaded files and exposes them over its own API, so when
  // we find ourselves in a chat with no schema we ask the platform for the file
  // and rebuild the schema from it. Reading stays local to the browser.
  let recoverInFlight = false;

  function owuiToken() {
    try { return localStorage.getItem('token') || ''; } catch (e) { return ''; }
  }

  // PERFORMANCE FIX (v61). This used to call innerText on EVERY element whose
  // class contains "message" — which in Open WebUI is one per message plus the
  // composer wrapper — and innerText forces a full layout each time. It ran on
  // the 250 ms tier for as long as a chat had no schema, so a long conversation
  // paid that cost several times a second while a reply was streaming.
  // textContent reads the same characters without forcing layout, and only the
  // first few messages are examined, because the dataset is attached at the
  // start of a conversation.
  function attachedFileName() {
    const nodes = document.querySelectorAll('[class*="message-"], #chat-input');
    const limit = Math.min(nodes.length, 6);
    for (let i = 0; i < limit; i++) {
      const m = (nodes[i].textContent || '').match(/[\w .()-]+\.(csv|tsv|txt)\b/i);
      if (m) return m[0].trim();
    }
    return null;
  }

  // Backoff state, keyed by conversation. Without it a chat whose dataset could
  // NOT be recovered retried on every 250 ms tier tick, for as long as the tab
  // stayed open. Each attempt issues up to two requests to the backend, so a
  // permanently unrecoverable chat meant a steady stream of calls to the same
  // server that is running the model, competing with it for both connections
  // (a browser allows only a handful per host) and CPU.
  const recoverState = {};

  async function recoverSchemaFromChat() {
    if (daaSchema || recoverInFlight) return;
    if (!/\/c\//.test(location.pathname)) return;
    // Never compete with a reply that is being written.
    if (isGenerating()) return;

    const key = chatId() || 'pending';
    const st = recoverState[key] || (recoverState[key] = { n: 0, nextAt: 0 });
    if (st.n >= 4) return;                    // give up quietly
    if (Date.now() < st.nextAt) return;
    // 2 s, 4 s, 8 s, 16 s. Set BEFORE the attempt so a failure cannot retry
    // immediately.
    st.n += 1;
    st.nextAt = Date.now() + 2000 * Math.pow(2, st.n - 1);

    const wanted = attachedFileName();
    if (!wanted) return;
    recoverInFlight = true;
    try {
      const tok = owuiToken();
      const headers = tok ? { Authorization: 'Bearer ' + tok } : {};
      const list = await fetch('/api/v1/files/', { headers: headers })
        .then(function (r) { return r.ok ? r.json() : null; });
      if (!list || !list.length) return;

      const stem = wanted.replace(/\.[^.]+$/, '').slice(0, 12).toLowerCase();
      const hit = list.filter(function (f) {
        const n = (f.filename || (f.meta && f.meta.name) || '').toLowerCase();
        return n.indexOf(stem) !== -1;
      }).pop() || list[list.length - 1];
      if (!hit || !hit.id) return;

      const text = await fetch('/api/v1/files/' + hit.id + '/content', { headers: headers })
        .then(function (r) { return r.ok ? r.text() : ''; });
      if (!text) return;

      const schema = parseSchema(text.slice(0, SCHEMA_SAMPLE_BYTES));
      if (!schema) return;
      schema.fileName = hit.filename || (hit.meta && hit.meta.name) || wanted;
      daaSchema = schema;
      delete recoverState[chatId() || 'pending'];   // success: clear the backoff
      saveSchema(schema);
      renderSchemaPrompts();
      renderFollowupPrompts();
    } catch (e) {
      /* offline or API shape changed: keep the generic prompts */
    } finally {
      recoverInFlight = false;
    }
  }

  function readSchemaFromFile(file) {
    if (!file) return;
    const name = (file.name || '').toLowerCase();
    // Spreadsheet binaries cannot be parsed without a heavy library, so we
    // only read delimited text formats and leave the defaults otherwise.
    if (!/\.(csv|tsv|txt)$/.test(name)) return;
    lastDataset = file;              // kept so the removal can be undone (Ch 15)
    const reader = new FileReader();
    reader.onload = function () {
      try {
        let raw = String(reader.result || '');
        // Grant Ch 47 again: spreadsheets exported on Windows are frequently
        // Latin-1, not UTF-8. Decoding those as UTF-8 produces replacement
        // characters, which would corrupt column names such as "Provinsi Aceh".
        // If that happens we re-read the slice with the Western encoding.
        if (raw.indexOf('\uFFFD') !== -1) {
          const r2 = new FileReader();
          r2.onload = function () {
            const s2 = parseSchema(String(r2.result || ''));
            if (s2) {
              s2.fileName = file.name || '';
              daaSchema = s2; saveSchema(s2);
              renderSchemaPrompts(); renderFollowupPrompts();
            }
          };
          r2.readAsText(file.slice(0, SCHEMA_SAMPLE_BYTES), 'windows-1252');
          return;
        }
        const schema = parseSchema(raw);
        if (schema) {
          // Remember which file this schema came from so we can tell when the
          // user detaches it again (see forgetSchemaIfFileRemoved).
          schema.fileName = file.name || '';
          schema.fileSize = file.size || 0;
          // Only the first 64 KB is read, so on a larger file the row count is
          // a lower bound, not a total. It is labelled as such rather than
          // presented as fact.
          schema.truncated = (file.size || 0) > SCHEMA_SAMPLE_BYTES;
          daaSchema = schema;
          saveSchema(schema);
          renderSchemaPrompts();
          renderFollowupPrompts();
        }
      } catch (e) { /* keep the static prompts on any parsing problem */ }
    };
    reader.readAsText(file.slice(0, SCHEMA_SAMPLE_BYTES));
  }

  // Open WebUI recreates its hidden file input, so listen on the document in
  // the capture phase instead of binding to one element.
  // The removal check runs on the 250 ms tier and needs two consecutive misses,
  // so detaching a dataset took up to half a second to register. Removing the
  // chip is a click, so we re-check right after any click instead of waiting
  // for the next tick. [Grant Ch 9] an action needs immediate feedback
  function watchRemovalClicks() {
    if (document.__daaRemovalWatch) return;
    document.__daaRemovalWatch = true;
    document.addEventListener('click', function () {
      if (!daaSchema) return;
      setTimeout(function () { forgetSchemaIfFileRemoved(); }, 120);
      setTimeout(function () { forgetSchemaIfFileRemoved(); }, 320);
    }, true);
  }

  function watchFileInput() {
    if (document.__daaFileWatch) return;
    document.__daaFileWatch = true;
    document.addEventListener('change', function (ev) {
      const t = ev.target;
      if (!t || t.tagName !== 'INPUT' || t.type !== 'file') return;
      if (t.files && t.files.length) readSchemaFromFile(t.files[0]);
    }, true);
    // Drag and drop bypasses the file input entirely.
    document.addEventListener('drop', function (ev) {
      const dt = ev.dataTransfer;
      if (dt && dt.files && dt.files.length) readSchemaFromFile(dt.files[0]);
    }, true);
  }

  // Composer placeholder.
  //
  // v57 removes the overlaid <span> this function used to create. Two
  // placeholders existed at once with different wording, and because the span
  // was refreshed on the 250 ms tier the user could see the text change after
  // the screen had already settled. The native ::before (fed by
  // --i18n-chat-ph and data-placeholder, both written by applyLang from
  // chatPlaceholder) is now the only one, so the hint is correct on the very
  // first paint and never swaps.
  //
  // Any span left over from an earlier version is removed, otherwise a user
  // who had the old script cached would keep seeing the duplicate.
  // [Grant Bab 67] a field should always say what belongs in it
  // [Grant Bab 40] the interface must not rearrange itself under the user
  function mountPlaceholder() {
    const old = document.querySelectorAll('.daa-placeholder');
    for (let i = 0; i < old.length; i++) old[i].remove();
  }

  // Grant Ch 63: a "skip to main content" link. Keyboard and screen-reader
  // users otherwise have to tab through the whole sidebar before reaching the
  // conversation. It is hidden until focused, so sighted users never see it.
  function mountSkipLink() {
    if (document.querySelector('.daa-skip')) return;
    const main = document.querySelector('main') || document.getElementById('chat-input');
    if (!main) return;
    if (!main.id) main.id = 'daa-main';

    const a = document.createElement('a');
    a.className = 'daa-skip';
    a.href = '#' + main.id;
    const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
    a.textContent = (T[lang] || T.en).skip_link;
    a.addEventListener('click', function () {
      main.setAttribute('tabindex', '-1');
      main.focus();
    });
    document.body.insertBefore(a, document.body.firstChild);
  }

  // ================================================================
  // ANALYSIS PROGRESS & COMPLETION SIGNAL  (v41)
  //
  // Grant Ch 56: show a spinner for indeterminate tasks — the user must be able
  // to tell the difference between "working" and "broken".
  // Grant Ch 55: one indicator for the whole operation, not a chain of them.
  // Grant Ch 70: a journey needs an END. Without a completion signal the user
  // cannot tell whether the report is finished or more is still coming, which
  // matters here because a long report scrolls past the fold.
  //
  // Open WebUI shows a generic typing dot; this adds a labelled state in the
  // user's own language, escalating the wording if the wait gets long
  // (Grant Ch 56 cites Gmail's "Loading… / Still loading…" pattern).
  // ================================================================
  let genStartedAt = 0;

  // MEASURED, not guessed (v60). A generation was run in the live app and the
  // composer's buttons were sampled every 300 ms:
  //   idle, empty box   -> attach, tools, #voice-input-button, "Voice mode"
  //   idle, text typed  -> attach, tools, #voice-input-button, #send-message-button
  //   generating        -> attach, tools, and ONE button with no id, no
  //                        aria-label and no title (the stop control)
  //   finished          -> back to #voice-input-button + "Voice mode"
  // So the app is generating exactly when NEITHER #send-message-button NOR
  // #voice-input-button is present. Both are stable ids, which makes this far
  // sturdier than the two things tried before: matching an accessible name the
  // stop control does not have, and matching an <svg><rect> its icon does not
  // contain (measured: 1 path, 0 rects).
  function isGenerating() {
    const form = document.querySelector('#message-input-container') ||
                 document.querySelector('form');
    if (!form) return false;
    if (form.querySelector('#send-message-button')) return false;
    if (form.querySelector('#voice-input-button')) return false;
    return !!form.querySelector('button');
  }

  // The stop control ships with no accessible name of any kind, so a screen
  // reader announces it as just "button" at the one moment the user most needs
  // to know what it does. WCAG 4.1.2. Labelled here rather than in
  // enhanceAccessibility because it only exists while a reply is streaming.
  function labelStopButton() {
    if (!isGenerating()) return;
    const form = document.querySelector('#message-input-container') ||
                 document.querySelector('form');
    if (!form) return;
    const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
    const btns = form.querySelectorAll('button');
    for (let i = 0; i < btns.length; i++) {
      const b = btns[i];
      if (b.id || b.getAttribute('aria-label') || b.getAttribute('title')) continue;
      if ((b.innerText || '').trim()) continue;
      b.setAttribute('aria-label',
        lang === 'id' ? 'Hentikan penulisan jawaban' : 'Stop generating');
    }
  }

  function renderProgress() {
    const editor = findChatInput();
    if (!editor) return;
    const anchor = editor.closest('form') || editor.parentElement;
    if (!anchor || !anchor.parentNode) return;

    const running = isGenerating();
    let bar = document.querySelector('.daa-progress');

    if (!running) {
      if (bar) {
        // Mark the end of the journey, then retire the indicator.
        if (genStartedAt) {
          const lang0 = (document.documentElement.lang === 'id') ? 'id' : 'en';
          bar.classList.add('is-done');
          bar.textContent = (T[lang0] || T.en).an_done;
          const b = bar;
          setTimeout(function () { if (b && b.parentNode) b.remove(); }, 2600);
          genStartedAt = 0;
        } else {
          bar.remove();
        }
      }
      return;
    }

    if (!genStartedAt) genStartedAt = Date.now();
    const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
    const dict = T[lang] || T.en;
    const long = (Date.now() - genStartedAt) > 12000;

    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'daa-progress';
      bar.setAttribute('role', 'status');       // announced to screen readers
      bar.setAttribute('aria-live', 'polite');
      anchor.parentNode.insertBefore(bar, anchor);
    }
    bar.classList.remove('is-done');
    // CORRECTED COPY (v61). The long-wait line used to read "Large datasets
    // take longer", which states a CAUSE the interface has no way of knowing.
    // It was shown for a 742 byte file whose first answer had returned quickly,
    // so the explanation was simply untrue, and a wrong explanation is worse
    // than none: it sends the user looking for a problem in their data.
    //
    // Grant Bab 55/56: when the remaining time cannot be known, do not
    // fabricate one — show that work is still happening and how long it has
    // been going. Elapsed time is measured here, so it is always true, and it
    // lets the user judge for herself whether to keep waiting.
    if (long) {
      const secs = Math.round((Date.now() - genStartedAt) / 1000);
      bar.textContent = dict.an_running_long.replace('{s}', secs);
    } else {
      bar.textContent = dict.an_running;
    }
  }

  // Grant Ch 54: "give users the choice of picking a file OR drag-and-drop, and
  // make the upload area visually prominent". Dropping a file already worked
  // (the schema parser listens for it) but nothing on screen ever said so, so
  // the capability was invisible. This shows a full-window target the moment a
  // file is dragged in, which also confirms the app will accept it.
  function mountDropzone() {
    if (document.__daaDropzone) return;
    document.__daaDropzone = true;
    let depth = 0;

    function overlay() {
      let el = document.querySelector('.daa-dropzone');
      if (el) return el;
      const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
      const d = T[lang] || T.en;
      el = document.createElement('div');
      el.className = 'daa-dropzone';
      el.innerHTML =
        '<div class="daa-dropzone-inner">' +
          '<p class="daa-dropzone-title">' + d.drop_title + '</p>' +
          '<p class="daa-dropzone-sub">' + d.drop_sub + '</p>' +
        '</div>';
      document.body.appendChild(el);
      return el;
    }

    function hide() {
      depth = 0;
      const el = document.querySelector('.daa-dropzone');
      if (el) el.remove();
    }

    window.addEventListener('dragenter', function (ev) {
      if (!ev.dataTransfer || (ev.dataTransfer.types || []).indexOf('Files') === -1) return;
      depth++;
      overlay();
    });
    window.addEventListener('dragover', function (ev) {
      if (ev.dataTransfer && (ev.dataTransfer.types || []).indexOf('Files') !== -1) {
        ev.preventDefault();   // required for the drop to be allowed
      }
    });
    window.addEventListener('dragleave', function () {
      depth--;
      if (depth <= 0) hide();
    });
    window.addEventListener('drop', hide);
  }

  // ================================================================
  // REPORT READABILITY  (v45)
  //
  // Grant Ch 4 says type size and alignment carry hierarchy — and that applies
  // inside the report, not just on the welcome screen. A DAAT report is mostly
  // numbers: revenue, share, unit price, counts. Rendered as plain markdown
  // every column is left-aligned, so digits of different lengths do not line
  // up and the figures cannot be compared by eye, which is the whole point of
  // the table.
  //
  // Markdown carries no column types, so the alignment is derived here: a
  // column is treated as numeric when most of its cells parse as numbers.
  // Nothing is rewritten, only aligned.
  // ================================================================
  function looksNumeric(txt) {
    const t = String(txt || '').trim();
    if (!t) return false;
    // Accepts 1.058.314,21 · 2,08% · Rp 1.017.000 · 13,32 · 224
    return /^[^\d\-]{0,4}[\d][\d.,\s]*\s*%?$/.test(t);
  }

  function alignReportTables() {
    const tables = document.querySelectorAll(
      '.assistant-message table, [class*="prose"] table, main table'
    );
    [].forEach.call(tables, function (tb) {
      if (tb.getAttribute('data-daa-aligned') === 'true') return;
      const rows = tb.querySelectorAll('tbody tr');
      if (!rows.length) return;
      const colCount = (tb.querySelectorAll('thead th') || []).length ||
                       rows[0].children.length;

      for (let c = 0; c < colCount; c++) {
        let numeric = 0, total = 0;
        [].forEach.call(rows, function (r) {
          const cell = r.children[c];
          if (!cell) return;
          total++;
          if (looksNumeric(cell.textContent)) numeric++;
        });
        if (!total || numeric / total < 0.7) continue;

        [].forEach.call(rows, function (r) {
          if (r.children[c]) r.children[c].classList.add('daa-num');
        });
        const th = tb.querySelectorAll('thead th')[c];
        if (th) th.classList.add('daa-num');
      }

      // Wide tables must scroll on their own instead of stretching the layout.
      if (!tb.parentElement.classList.contains('daa-table-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'daa-table-wrap';
        tb.parentNode.insertBefore(wrap, tb);
        wrap.appendChild(tb);
      }
      tb.setAttribute('data-daa-aligned', 'true');
    });
  }

  // CROSS-BROWSER: the stylesheet uses :has() to hide the blank slate once real
  // messages exist. Chrome, Edge and Safari 15.4+ support it, but Firefox only
  // gained it in version 121 — on anything older the welcome screen would stay
  // visible on top of a live conversation. Mirroring the same condition as a
  // body class makes the rules work everywhere, with :has() simply acting as
  // the faster path when it is available.
  function syncStateClasses() {
    const hasMsg = /\/c\//.test(location.pathname) || !!document.querySelector(
      '.user-message, .assistant-message, [data-message-id]'
    );
    document.body.classList.toggle('daa-has-messages', hasMsg);
  }

  // Open WebUI prints its build line ("... (Open WebUI) - v0.8.8") under the
  // blank slate. Grant Ch 74: users do not care about the product's identity,
  // they care about the task, and a version string is developer information.
  function hideVersionFooter() {
    // MEASURED (v57): this build renders no <main> element, so the scope
    // always fell back to document.body and the "capped" scan still walked
    // the whole page. The conversation is in #messages-container, which is
    // both correct and much smaller.
    const scope = document.getElementById('messages-container') ||
                  document.querySelector('main') || document.body;
    const nodes = scope.querySelectorAll('div, span, p, a');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (el.children.length > 2) continue;
      if (el.getAttribute('data-daa-hidden') === 'true') continue;
      const t = (el.textContent || '').trim();
      if (t.length > 70 || !/v\d+\.\d+\.\d+/.test(t)) continue;
      el.style.display = 'none';
      el.setAttribute('data-daa-hidden', 'true');
    }
  }

  // Hovering a built-in follow-up popped a native tooltip repeating the very
  // text already on screen, which is pure noise. The title attribute is
  // removed; the visible label is the label. [Grant Ch 31]
  function stripFollowupTooltips(blk) {
    if (!blk) return;
    [].forEach.call(blk.querySelectorAll('[title]'), function (el) {
      const t = (el.getAttribute('title') || '').trim();
      if (t && (el.textContent || '').indexOf(t) !== -1) el.removeAttribute('title');
    });
  }

  // ---------- Accessibility enhancement layer (v22) ----------
  // Open WebUI ships several icon-only buttons with no accessible name. A
  // Lighthouse audit of the chat page flagged 6 visible buttons failing
  // "Buttons do not have an accessible name" plus 1 image without [alt].
  // Screen readers announce those as just "button", which is exactly the
  // barrier WCAG 2.1 SC 4.1.2 (Name, Role, Value) is meant to prevent.
  //
  // We cannot patch Open WebUI's source, so we add the missing names from the
  // frontend layer instead. Buttons are matched on the leading characters of
  // their SVG path data, which is a stable signature (the icon geometry does
  // not change between renders, unlike the randomly generated element ids).
  // Labels follow the active language so the fix works in both EN and ID.
  const A11Y_ICONS = [
    { match: 'M9.5 21V3',      en: 'Toggle sidebar',    id: 'Buka atau tutup panel samping' },
    { match: 'M6 12H12M18 12', en: 'Attach file',       id: 'Lampirkan berkas' },
    { match: 'M6.28 5.22',     en: 'Close',             id: 'Tutup' },
    { match: 'M12 22C17.5228', en: 'Temporary chat',    id: 'Obrolan sementara' },
    { match: 'M5.21173 15.1113', en: 'Tools',           id: 'Alat' },
    // Added in v57 after measuring the running app: 17 buttons still had no
    // accessible name, which is the WCAG 4.1.2 failure Lighthouse reports as
    // "Buttons do not have an accessible name" and the main reason the
    // Accessibility score stayed below 100. Each `match` below is the opening
    // of the icon's own path, read off the live DOM, so the label attaches to
    // the right control rather than being guessed from position.
    { match: 'M6.75 12a.75.75 0',  en: 'More options',       id: 'Opsi lainnya' },
    { match: 'M16.862 4.487',      en: 'Edit message',       id: 'Ubah pesan' },
    { match: 'M15.666 3.888',      en: 'Copy message',       id: 'Salin pesan' },
    { match: 'M11.25 11.25l.041',  en: 'Message details',    id: 'Rincian pesan' },
    { match: 'M16.023 9.348',      en: 'Regenerate answer',  id: 'Buat ulang jawaban' },
    { match: 'm14.74 9-.346 9',    en: 'Delete',             id: 'Hapus' }
  ];

  function labelFor(btn, lang) {
    const svg = btn.querySelector('svg');
    if (svg) {
      const d = [].map.call(svg.querySelectorAll('path'), function (p) {
        return p.getAttribute('d') || '';
      }).join(' ');
      for (let i = 0; i < A11Y_ICONS.length; i++) {
        if (d.indexOf(A11Y_ICONS[i].match) === 0 || d.indexOf(A11Y_ICONS[i].match) > -1) {
          return A11Y_ICONS[i][lang] || A11Y_ICONS[i].en;
        }
      }
    }
    // Contextual fallback: a button wrapping the profile image is the user menu.
    if (btn.querySelector('img')) return lang === 'id' ? 'Menu pengguna' : 'User menu';
    if (btn.closest('#sidebar')) return lang === 'id' ? 'Menu panel samping' : 'Sidebar menu';

    // Some ids carry the meaning even when the icon is unknown to us.
    const id = btn.id || '';
    if (/^info-/.test(id))   return lang === 'id' ? 'Rincian pesan' : 'Message details';
    if (/context-menu/.test(id)) return lang === 'id' ? 'Opsi obrolan' : 'Chat options';
    if (/regenerate/.test(btn.className || '')) {
      return lang === 'id' ? 'Buat ulang jawaban' : 'Regenerate answer';
    }
    return null;
  }

  // Open WebUI ships <meta name="viewport" ... maximum-scale=1>, which blocks
  // pinch zoom. Lighthouse flags this and it breaks WCAG 2.1 SC 1.4.4 (Resize
  // Text): low-vision users must be able to magnify the page. We rewrite the
  // tag from the frontend layer, keeping every other directive intact.
  function fixViewportZoom() {
    const mv = document.querySelector('meta[name="viewport"]');
    if (!mv) return;
    const c = mv.getAttribute('content') || '';
    if (!/maximum-scale|user-scalable\s*=\s*no/i.test(c)) return;
    const cleaned = c
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(function (s) {
        return !/^maximum-scale/i.test(s) && !/^user-scalable/i.test(s);
      })
      .join(', ');
    mv.setAttribute('content', cleaned);
  }

  function enhanceAccessibility() {
    const lang = (document.documentElement.lang === 'id') ? 'id' : 'en';
    fixViewportZoom();

    // 1. Icon buttons with no accessible name
    [].forEach.call(document.querySelectorAll('button'), function (b) {
      const hasName = (b.innerText || '').trim() ||
                      b.getAttribute('aria-label') ||
                      b.getAttribute('aria-labelledby') ||
                      b.getAttribute('title');
      if (hasName) return;
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return; // not rendered, skip
      const lbl = labelFor(b, lang);
      if (lbl) b.setAttribute('aria-label', lbl);
    });

    // 2. Images missing [alt]. Decorative avatars get an empty alt so screen
    //    readers skip them instead of reading the file name (WCAG 1.1.1).
    [].forEach.call(document.querySelectorAll('img:not([alt])'), function (im) {
      im.setAttribute('alt', '');
    });

    // 3. MEASURED (v57): the page has no <main> element at all, so there is no
    //    main landmark for a screen reader to jump to and the "skip to content"
    //    link lands on a region with no name. Open WebUI's conversation lives in
    //    #messages-container, so that element is given the role directly.
    //    WCAG 1.3.1 / 2.4.1 (bypass blocks).
    //    MEASURED AGAIN (v62): the fix above only covered a conversation.
    //    On the blank slate #messages-container does not exist yet, so the
    //    landing screen — the first thing a new user meets — still had no main
    //    landmark at all. The region that holds the greeting AND the composer
    //    is the main content there, so it is found by walking up from the
    //    composer until an ancestor also contains the greeting.
    if (!document.querySelector('main, [role="main"]')) {
      const region = findMainRegion();
      if (region) {
        region.setAttribute('role', 'main');
        region.setAttribute('aria-label', lang === 'id' ? 'Percakapan' : 'Conversation');
      }
    }

  }

  const INTERACTIVE_SEL =
    'a[href],button,input,select,textarea,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])';

  // MEASURED (v65): Open WebUI wraps the whole collapsed sidebar strip in a
  // <button aria-label="Toggle sidebar"> that is 36 x 755 px, and puts three
  // real controls inside it (Open Sidebar, New Chat, Search). A control nested
  // inside another control is invalid, and axe reports it as
  // "nested-interactive" — three violations, which is what holds the
  // Accessibility score below 100.
  //
  // For a screen-reader user the effect is worse than the score suggests: they
  // reach a 755 pixel tall button called "Toggle sidebar" that contains three
  // other buttons, with no way to tell what activating it would do. WCAG 4.1.2.
  //
  // Setting role="presentation" on the wrapper does NOT fix it: ARIA ignores a
  // presentational role on a focusable element, and a <button> stays focusable
  // even with tabindex="-1". The nesting has to actually be undone, so the real
  // controls are moved out to sit beside the wrapper instead of inside it.
  //
  // Verified in the running app before being written here: after the move,
  // nested-interactive drops from 3 to 0, all 37 sidebar controls remain
  // present, the change survives Svelte re-rendering, and a screenshot confirms
  // the sidebar looks unchanged. Nothing is restyled; only the parent changes.
  function fixNestedInteractive() {
    const nodes = document.querySelectorAll('button, [role="button"]');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if ((el.innerText || '').trim()) continue;          // has its own label: leave alone
      if (!el.querySelector(INTERACTIVE_SEL)) continue;   // nothing nested: leave alone
      if (el.closest('.daa-suggestions, .daa-followup, .lang-toggle, .daa-dlmenu')) continue;
      if (el.getAttribute('role') === 'presentation') continue;   // already handled
      // A wrapper that carries its own name is a real control, not scaffolding.
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) continue;

      // MEASURED BUG (v70): "sidebar tidak bisa dibuka".
      //
      // Until v69 this function MOVED the wrapper's children out into its
      // parent and then neutralised the emptied wrapper. Measured on the
      // running app, the sidebar's real toggle is nested inside the resize
      // handle:
      //
      //   BUTTON.flex.flex-col.flex-1.cursor-[e-resize]   <- wrapper
      //     └ DIV.pb-1.5
      //         └ DIV.flex
      //             └ BUTTON[aria-label="Open Sidebar"]   <- the toggle
      //
      // Relocating the toggle removed the wrapper from its ancestor chain, so
      // the click no longer reached the handler that opens the sidebar.
      // Verified by isolation: with the stylesheet applied but this script
      // disabled, one click flipped localStorage.sidebar from "false" to
      // "true"; with the script active the same click left it at "false" while
      // still reaching both the capture and the bubble phase undefeated, i.e.
      // nothing cancelled the event, the handler simply was not there any more.
      //
      // No DOM surgery is needed to satisfy the rule. axe states the remedy in
      // its own message: "Element's default semantics were not overridden with
      // role='none' or role='presentation'". Overriding the role removes the
      // nesting violation while leaving the tree exactly as Open WebUI built
      // it, so every handler keeps working.
      //
      // aria-hidden is deliberately NOT set here. The children now stay inside
      // the wrapper, and hiding the wrapper would take the real controls out of
      // the accessibility tree — the opposite of what this pass is for.
      el.setAttribute('role', 'presentation');
      el.setAttribute('tabindex', '-1');
    }
  }

  // ROOT CAUSE OF Accessibility 92 (v67), found by measurement after four
  // wrong guesses.
  //
  // The header carries a visible 40 x 44 <button> that has BOTH
  // aria-hidden="true" AND tabindex 0, plus a meaningful label:
  // "Get information on gemma3:4b in the UI". axe reports this as
  // `aria-hidden-focus`: an element removed from the accessibility tree must
  // not be reachable by keyboard. A keyboard user tabs onto a control that a
  // screen reader refuses to announce, so they land on something that, as far
  // as assistive technology is concerned, does not exist.
  //
  // This also explains why the login page scored 100 while the chat page scored
  // 92 in BOTH themes: the button only exists next to the model selector, which
  // the login page does not have. It is not a contrast problem and not a timing
  // problem, which is what the earlier attempts assumed.
  //
  // My own earlier check missed it because it looked for aria-hidden elements
  // CONTAINING focusable descendants, and never asked whether the aria-hidden
  // element was itself focusable.
  //
  // The control has a real name and performs a real action, so it belongs in
  // the accessibility tree: aria-hidden is removed. An aria-hidden element with
  // no name is instead taken out of the tab order, which is the other valid
  // resolution. WCAG 4.1.2.
  function fixAriaHiddenFocus() {
    const FOCUSABLE = 'a[href],button,input,select,textarea,' +
                      '[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
    const hidden = document.querySelectorAll('[aria-hidden="true"]');
    for (let i = 0; i < hidden.length; i++) {
      const el = hidden[i];
      const selfFocusable = el.matches(FOCUSABLE) && el.tabIndex >= 0;
      const inner = el.querySelectorAll(FOCUSABLE);
      if (!selfFocusable && !inner.length) continue;

      if (selfFocusable) {
        if (el.getAttribute('aria-label') || (el.innerText || '').trim()) {
          el.removeAttribute('aria-hidden');       // it has a name: announce it
        } else {
          el.setAttribute('tabindex', '-1');       // no name: take it out of the tab order
        }
      }
      for (let k = 0; k < inner.length; k++) {
        if (inner[k].tabIndex >= 0) inner[k].setAttribute('tabindex', '-1');
      }
    }
  }

  // MEASURED (v65): the "Add Model" control in the header renders 14 x 44 px.
  // axe's target-size rule requires 24 x 24, and Grant Bab 69 asks for 44 x 44.
  // Rather than name that one button, any visible control that falls below the
  // threshold is widened, so the rule keeps holding when Open WebUI changes.
  // The sidebar is excluded, as recorded in the audit document.
  function enforceTargetSize() {
    const nodes = document.querySelectorAll(INTERACTIVE_SEL);
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (el.closest('#sidebar')) continue;
      if (el.getAttribute('data-daa-target') === 'true') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width >= 24 && r.height >= 24) continue;
      el.style.minWidth = '44px';
      el.style.minHeight = '44px';
      el.style.display = 'inline-flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.setAttribute('data-daa-target', 'true');
    }
  }

  function findMainRegion() {
    const mc = document.getElementById('messages-container');
    if (mc) return mc;
    const ed = findChatInput();
    if (!ed) return null;
    const blank = document.querySelector('.daa-blank');
    let n = ed.parentElement;
    for (let i = 0; i < 10 && n && n !== document.body; i++) {
      if (blank && n.contains(blank)) return n;
      if (!blank && n.getBoundingClientRect().height > window.innerHeight * 0.6) return n;
      n = n.parentElement;
    }
    return null;
  }

  // Work is split by cost. The cheap half is safe to run on every observer
  // tick; the expensive half (full-document queries, getBoundingClientRect,
  // innerText reads — all of which force layout) is rate-limited, because
  // running it on every streamed token made the interface stall.
  // Three tiers, because a single throttle was wrong in both directions: it
  // still let the heaviest scans run too often, while starving the checks that
  // must feel immediate (removing a dataset, hiding the default suggestions).
  //   every tick  - cheap and idempotent, must stay responsive
  //   250 ms      - state checks that the user perceives as instant
  //   1000 ms     - full-document scans that force layout
  //
  // ROOT CAUSE OF "follow-up loadingnya lama" (v60). init() was driven ONLY by
  // the MutationObserver. When the tick raised by the LAST mutation of an
  // answer arrived less than 250 ms after the previous tier-2 run, it returned
  // early — and since the page had stopped mutating, no further tick ever came.
  // The bar then had to wait for the next unrelated mutation.
  //
  // Measured on the live app during one generation:
  //     22 955 ms  answer complete, action row rendered   <- bar could appear
  //     27 302 ms  Open WebUI's own follow-up block lands <- next mutation
  // a 4.3 second gap with nothing on screen, which is exactly the delay
  // reported. A steady heartbeat (see the mount section) removes the dependency
  // on something else happening to change.
  let tMid = 0, tHeavy = 0;

  function init() {
    // --- tier 1: every tick ---
    injectToggle();
    syncStateClasses();
    rehomeToggleIfNeeded();
    watchFileInput();
    watchRemovalClicks();
    interceptOwuiFollowup();
    labelStopButton();
    mountDropzone();
    mountSkipLink();
    renderProgress();
    renderInterpretation();

    // These belong in tier 1: they are what the eye notices first. Delaying
    // them let Open WebUI's own greeting and suggestion cards flash on screen
    // before being replaced. Both are cheap now — injectChatBlank returns
    // immediately once mounted, and the suggestion scan is scoped and capped.
    if (isAuthPage()) {
      injectRichBadge();
    } else if (findChatInput()) {
      injectChatBlank();
      hideOpenWebUISiblings();
      hideDefaultSuggestionsContainer();
      hideVersionFooter();
    }

    const now = Date.now();

    // --- tier 3: full-document scans ---
    if (now - tHeavy >= 1000) {
      tHeavy = now;
      enhanceAccessibility();
      alignReportTables();
    }

    // --- tier 2: perceived-instant state ---
    if (now - tMid < 250) return;
    tMid = now;
    // TIMING (v66). These two used to sit on the 1000 ms tier together with the
    // rest of enhanceAccessibility. Measured symptom: the login page scored 100
    // for Accessibility while the chat page scored 92, even though every check
    // passed when run by hand afterwards. The difference is that the login page
    // has no sidebar, so it never had the violations at all — while on the chat
    // page Lighthouse can take its snapshot in the window between the sidebar
    // being rendered and the next 1000 ms pass. Moving both to the 250 ms tier
    // closes that window. They are cheap: one query plus a rect read over about
    // forty elements.
    fixNestedInteractive();
    fixAriaHiddenFocus();
    enforceTargetSize();
    mountPlaceholder();
    // Restore a schema captured before the language-switch reload.
    if (!daaSchema) daaSchema = loadSchema();

    // BUGFIX: bind an in-memory schema to the conversation as soon as the chat
    // has an id. Sending the first message is a client-side navigation, so no
    // reload happens and loadSchema() never ran to migrate the parked "pending"
    // entry. If the user then opened a new chat, that pending entry was cleared
    // and the dataset was lost for the original conversation, which is why the
    // follow-up bar silently stopped appearing.
    if (daaSchema && chatId()) {
      try {
        if (!localStorage.getItem(storeKey(chatId()))) saveSchema(daaSchema);
      } catch (e) {}
    }

    forgetSchemaIfFileRemoved();
    // A schema detected earlier must survive Open WebUI's re-renders, which
    // would otherwise restore the generic pills.
    if (daaSchema) {
      const w = document.querySelector('.daa-suggestions');
      if (w && w.getAttribute('data-daa-schema') !== 'true') renderSchemaPrompts();
    } else {
      // No schema for this conversation: try to rebuild it from the file the
      // chat already has, instead of leaving the user without prompts.
      recoverSchemaFromChat();
    }
    // The follow-up block only exists once generation has finished, so there is
    // nothing to find while a reply is streaming — skipping the search there
    // removes the heaviest work from the busiest moment.
    // ROOT CAUSE OF "follow-up masih telat" (v59): this used to be gated on
    // isGenerating(). Open WebUI keeps the composer in its stop state AFTER the
    // answer is finished, while it makes two further model calls (the chat
    // title and its own follow-up questions) — which is also why the stop
    // control appears not to stop. Gating on that signal therefore held the bar
    // back for exactly as long as those extra calls took, reintroducing the
    // latency v57 removed.
    //
    // renderFollowupPrompts decides for itself, from the presence of the
    // per-message action row, whether THIS answer is finished. That is a
    // property of the message rather than of the app's global busy state, so it
    // is both earlier and more accurate.
    renderFollowupPrompts();

    let saved = 'en';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'en'; } catch (e) {}
    applyLang(saved);
  }

  // ---------- Mount ----------
  // SPA renders can settle on a frame AFTER our last check, so a single
  // init() may run BEFORE the chat input / header / form labels exist. A
  // short cascade of retries makes late-rendered elements still get handled.
  // This is the fix for: toggle stuck in fixed-overlap fallback, custom blank
  // slate + branding not appearing, and login labels/placeholders reverting
  // to the Open WebUI defaults on refresh.
  let lastPath = location.pathname;

  function burstInit() {
    // Navigating to the root IS the "new chat" action in Open WebUI, so drop
    // the previous dataset before re-injecting anything.
    if (location.pathname !== lastPath) {
      // A pending undo toast belongs to the screen it was raised on. Sending a
      // message navigates to /c/<id>, and the toast used to survive that jump —
      // which is why "Dataset dihapus" appeared in the middle of a perfectly
      // normal follow-up.
      const t = document.querySelector('.daa-undo');
      if (t) t.remove();
      if (location.pathname === '/') resetSchemaForNewChat();
      lastPath = location.pathname;
      // The composer's hint and the follow-up bar both depend on the path, and
      // both live on the 250 ms tier. Clearing the timers makes the very next
      // tick do the full work, so nothing carries over from the previous
      // screen for a quarter of a second. [Grant Bab 40]
      tMid = 0;
      tHeavy = 0;
      const stale = document.querySelector('.daa-followup');
      if (stale) stale.remove();
    }
    [0, 60, 150, 300, 600, 1000, 1800, 3000].forEach(function (ms) {
      setTimeout(init, ms);
    });
  }

  // Diagnostic hook. Run  __daaDebug()  in the browser console to see why a
  // feature did not render, instead of guessing from the outside.
  window.__daaDebug = function () {
    const editor = findChatInput();
    return {
      version: DAA_VERSION,
      path: location.pathname,
      schemaInMemory: !!daaSchema,
      schemaColumns: daaSchema ? daaSchema.columns.map(function (c) { return c.name + ':' + c.type; }) : null,
      storedKeys: Object.keys(localStorage).filter(function (k) { return k.indexOf(SCHEMA_STORE_KEY) === 0; }),
      editorFound: !!editor,
      anchorFound: editor ? !!(editor.closest('form') || editor.parentElement) : false,
      followupRendered: !!document.querySelector('.daa-followup'),
      followupSkipReason: followupSkipReason || '(none)',
      owuiFollowupFound: !!findOwuiFollowupBlock(),
      quickActions: !!document.querySelector('.daa-quickactions')
    };
  };

  // MEASURED BUG (v62). The platform locale was only written when the toggle
  // was CLICKED. Measured in the running app: daa-lang was "en" while Open
  // WebUI's own locale was still "id-ID", so the interface showed our strings
  // in English next to Open WebUI's in Indonesian ("Ditetapkan sebagai
  // default"). That is precisely the half-translated state the full i18n
  // integration exists to prevent, and it survived every reload because
  // nothing reconciled the two on start-up.
  //
  // The saved choice is now reasserted on every load. syncPlatformLocale
  // returns immediately when the locale already matches, so this reloads at
  // most once and normal navigation is untouched.
  // [Krug Bab 5] one voice · [Grant Bab 85] one term, used consistently
  try {
    syncPlatformLocale(localStorage.getItem(STORAGE_KEY) === 'id' ? 'id' : 'en', true);
  } catch (e) {}

  // A fresh load of the root URL is also a new chat, so clear any dataset that
  // was parked before the tab was closed.
  if (location.pathname === '/') {
    try { localStorage.removeItem(storeKey(null)); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', burstInit);
  } else {
    burstInit();
  }

  // Heartbeat. The observer only fires when the page changes, and the tier-2
  // rate limit can swallow the tick raised by the last change of an answer. In
  // a page that has gone quiet, that meant the follow-up bar waited for the
  // next unrelated mutation — measured at 4.3 seconds. This runs init() on a
  // fixed cadence so a completed answer is picked up within one interval no
  // matter what the observer does. The tiers still rate-limit the expensive
  // work, so the added cost is one cheap pass per 400 ms.
  setInterval(init, 400);

  // SvelteKit re-renders pages asynchronously — watch + re-apply.
  // Throttle so we don't spam on every DOM mutation.
  let pending = false;
  const observer = new MutationObserver(function () {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      init();
    });
  });
  // BUGFIX (v22): custom.js is referenced from <head>, so this file executes
  // BEFORE <body> is parsed. Calling observer.observe(document.body, ...) at
  // that moment threw:
  //   TypeError: Failed to execute 'observe' on 'MutationObserver':
  //   parameter 1 is not of type 'Node'
  // The exception meant the observer NEVER attached, so no re-injection ever
  // happened on SPA re-renders (this is why the custom blank slate, branding
  // and the header-docked language toggle kept disappearing). It also showed
  // up as a console error, which Lighthouse counts against Best Practices.
  // Fix: wait until document.body exists before observing.
  function attachObserver() {
    if (!document.body) {
      requestAnimationFrame(attachObserver);
      return;
    }
    observer.observe(document.body, { childList: true, subtree: true });
  }
  attachObserver();

  // Client-side navigation (SvelteKit) does NOT reload the page, so re-run the
  // retry cascade whenever the route changes (opening a new chat, back/forward).
  ['pushState', 'replaceState'].forEach(function (m) {
    var orig = history[m];
    history[m] = function () {
      var r = orig.apply(this, arguments);
      burstInit();
      return r;
    };
  });
  window.addEventListener('popstate', burstInit);

  // Also re-apply the saved language once more after full load, so the login
  // labels (Username / Kata sandi) and placeholders never get left on the
  // Open WebUI English defaults after a hard refresh.
  window.addEventListener('load', function () {
    var saved = 'en';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'en'; } catch (e) {}
    applyLang(saved);
    setTimeout(function () { applyLang(saved); }, 400);
  });
})();
