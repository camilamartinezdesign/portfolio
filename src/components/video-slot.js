// <video-slot> — user-fillable VIDEO placeholder, sibling to <image-slot>.
//
// Drag a video file onto it (or click to browse) and it plays inline with
// native controls. The dropped video persists across reloads in IndexedDB
// (videos are far too large for the JSON sidecar image-slot uses), keyed by
// the slot's id. A `src` attribute provides a permanent/fallback source that
// the author (Claude) wires in once real files are supplied — that path DOES
// travel to share links and downloads. Local drops are for previewing while
// editing.
//
// Attributes:
//   id           Persistence key (REQUIRED for a drop to survive reload).
//   radius       Corner radius px (default 20).
//   placeholder  Empty-state caption (default 'Arrastra un video').
//   label        Small caption shown under the play glyph.
//   src          Author-set permanent source (mp4/webm URL or path).
//   poster       Optional poster image for the <video>.
//
// Size/shape come from ordinary CSS on the element.

(() => {
  const DB_NAME = 'cm-video-slots';
  const STORE = 'videos';
  const ACCEPT = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'image/gif'];

  let dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).catch(() => null);
    return dbP;
  }
  async function idbGet(key) {
    const d = await db(); if (!d) return null;
    return new Promise((res) => {
      try {
        const tx = d.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        tx.onsuccess = () => res(tx.result || null);
        tx.onerror = () => res(null);
      } catch { res(null); }
    });
  }
  async function idbSet(key, val) {
    const d = await db(); if (!d) return;
    return new Promise((res) => {
      try {
        const tx = d.transaction(STORE, 'readwrite').objectStore(STORE).put(val, key);
        tx.onsuccess = () => res();
        tx.onerror = () => res();
      } catch { res(); }
    });
  }
  async function idbDel(key) {
    const d = await db(); if (!d) return;
    return new Promise((res) => {
      try {
        const tx = d.transaction(STORE, 'readwrite').objectStore(STORE).delete(key);
        tx.onsuccess = () => res();
        tx.onerror = () => res();
      } catch { res(); }
    });
  }

  const css =
    ':host{display:block;position:relative;font:13px/1.35 system-ui,-apple-system,sans-serif;color:#fff}' +
    '.frame{position:absolute;inset:0;overflow:hidden;background:#1A1430}' +
    '.frame video{width:100%;height:100%;object-fit:cover;display:none;background:#000}' +
    '.ph{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    '  gap:12px;text-align:center;padding:18px;box-sizing:border-box;cursor:pointer;user-select:none}' +
    '.play{width:60px;height:60px;border-radius:50%;background:#fff;display:flex;align-items:center;' +
    '  justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,.25)}' +
    '.play span{font-size:22px;color:#FF2D9E;margin-left:3px}' +
    '.cap{font-weight:700;font-size:13px}' +
    '.sub{font-size:11px;opacity:.85;font-weight:500}' +
    '.sub u{cursor:pointer}' +
    '.ring{position:absolute;inset:0;pointer-events:none;border:2px dashed rgba(255,255,255,.35);border-radius:inherit}' +
    ':host([data-filled]) .ring{display:none}' +
    ':host([data-over]) .frame{outline:3px solid #D7FF00;outline-offset:-3px}' +
    '.ctl{position:absolute;top:8px;right:8px;display:flex;gap:6px;opacity:0;transition:opacity .15s;z-index:3}' +
    ':host([data-filled]:hover) .ctl{opacity:1}' +
    '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 9px;cursor:pointer;' +
    '  background:rgba(0,0,0,.6);color:#fff;font:11px/1 system-ui,sans-serif;backdrop-filter:blur(6px)}' +
    '.ctl button:hover{background:rgba(0,0,0,.82)}' +
    '.err{position:absolute;left:8px;right:8px;bottom:8px;background:rgba(255,255,255,.92);color:#b3261e;' +
    '  font-size:11px;padding:5px 7px;border-radius:6px;text-align:center;pointer-events:none}';

  class VideoSlot extends HTMLElement {
    static get observedAttributes() { return ['radius', 'placeholder', 'label', 'src', 'poster', 'id']; }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML =
        '<style>' + css + '</style>' +
        '<div class="frame" part="frame">' +
        '  <video part="video" playsinline preload="metadata"></video>' +
        '  <img part="gif" alt="" style="width:100%;height:100%;object-fit:cover;display:none">' +
        '  <div class="ph" part="ph">' +
        '    <div class="play"><span>&#9658;</span></div>' +
        '    <div class="cap"></div>' +
        '    <div class="sub">o <u>buscar archivo</u></div>' +
        '  </div>' +
        '  <div class="ring"></div>' +
        '</div>' +
        '<div class="ctl"><button data-act="replace">Reemplazar</button><button data-act="clear">Quitar</button></div>' +
        '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._video = root.querySelector('video');
      this._gif = root.querySelector('img[part=gif]');
      this._ph = root.querySelector('.ph');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._input = root.querySelector('input');
      this._err = null;
      this._depth = 0;
      this._objUrl = null;

      this._ph.addEventListener('click', () => this._input.click());
      root.addEventListener('click', (e) => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') this._input.click();
        if (act === 'clear') this._clear();
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
    }

    connectedCallback() {
      if (!this.id && !VideoSlot._warned) {
        VideoSlot._warned = true;
        console.warn('<video-slot> without an id will not persist its dropped video.');
      }
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((t) => this.addEventListener(t, this));
      this._render();
      this._restore();
    }

    disconnectedCallback() {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((t) => this.removeEventListener(t, this));
      if (this._objUrl) { URL.revokeObjectURL(this._objUrl); this._objUrl = null; }
    }

    attributeChangedCallback() { if (this.shadowRoot) this._render(); }

    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        if (--this._depth <= 0) { this._depth = 0; this.removeAttribute('data-over'); }
      } else if (e.type === 'drop') {
        e.preventDefault(); e.stopPropagation();
        this._depth = 0; this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }

    async _ingest(file) {
      this._setError(null);
      const ok = ACCEPT.indexOf(file.type) >= 0 || /\.(mp4|webm|mov|ogv|gif)$/i.test(file.name || '');
      if (!ok) { this._setError('Usa un video MP4/WebM/MOV o un GIF.'); return; }
      if (this.id) await idbSet(this.id, file);
      this._show(file);
    }

    async _restore() {
      if (!this.id) return;
      const blob = await idbGet(this.id);
      if (blob) this._show(blob);
    }

    _show(blob) {
      if (this._objUrl) { URL.revokeObjectURL(this._objUrl); this._objUrl = null; }
      this._objUrl = URL.createObjectURL(blob);
      const isGif = blob.type === 'image/gif' || /\.gif$/i.test(blob.name || '');
      if (isGif) {
        this._gif.src = this._objUrl;
        this._gif.style.display = 'block';
        this._video.style.display = 'none';
      } else {
        this._video.src = this._objUrl;
        this._video.controls = true;
        this._video.style.display = 'block';
        this._gif.style.display = 'none';
      }
      this._ph.style.display = 'none';
      this.setAttribute('data-filled', '');
    }

    async _clear() {
      if (this.id) await idbDel(this.id);
      if (this._objUrl) { URL.revokeObjectURL(this._objUrl); this._objUrl = null; }
      this._video.removeAttribute('src');
      this._video.load();
      this._gif.removeAttribute('src');
      this._gif.style.display = 'none';
      this._render();
    }

    _setError(msg) {
      if (this._err) { this._err.remove(); this._err = null; }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err'; d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => { if (this._err === d) { d.remove(); this._err = null; } }, 3200);
    }

    _render() {
      const n = parseFloat(this.getAttribute('radius'));
      const r = (Number.isFinite(n) ? n : 20) + 'px';
      this._frame.style.borderRadius = r;
      this._cap.textContent = this.getAttribute('placeholder') || 'Arrastra un video';
      const label = this.getAttribute('label');
      if (label) this._cap.textContent = label;
      const poster = this.getAttribute('poster');
      if (poster) this._video.setAttribute('poster', poster); else this._video.removeAttribute('poster');

      // Author-set permanent src (travels to downloads) wins over empty state,
      // but a local IndexedDB drop (_show) overrides it live.
      const src = this.getAttribute('src');
      if (src && !this.hasAttribute('data-filled')) {
        this._video.src = src;
        this._video.controls = true;
        this._video.style.display = 'block';
        this._ph.style.display = 'none';
        this.setAttribute('data-filled', '');
      } else if (!this.hasAttribute('data-filled')) {
        this._video.style.display = 'none';
        this._ph.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }

  if (!customElements.get('video-slot')) customElements.define('video-slot', VideoSlot);
})();
