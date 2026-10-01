// <mapa-sp> — mapa do estado de São Paulo com malha oficial do IBGE, desenhado com d3-geo.
(() => {
  const CAPITAL = ["São Paulo", -46.63, -23.55];
  const SEDE = ["Boituva", -47.67, -23.28];
  const CIDADES = [
    ["Campinas", -47.06, -22.91], ["Santos", -46.33, -23.96], ["São José dos Campos", -45.89, -23.18],
    ["Ribeirão Preto", -47.81, -21.18], ["Sorocaba", -47.46, -23.50], ["Bauru", -49.06, -22.31],
    ["Presidente Prudente", -51.39, -22.13], ["São José do Rio Preto", -49.38, -20.82], ["Araçatuba", -50.44, -21.21],
    ["Marília", -49.95, -22.21], ["Franca", -47.40, -20.54], ["Piracicaba", -47.65, -22.73],
    ["Jundiaí", -46.88, -23.19], ["Guarulhos", -46.53, -23.46], ["Osasco", -46.79, -23.53],
    ["Santo André", -46.54, -23.66], ["São Bernardo do Campo", -46.56, -23.69], ["Mogi das Cruzes", -46.19, -23.52],
    ["Taubaté", -45.56, -23.03], ["Registro", -47.84, -24.49], ["Itapetininga", -48.05, -23.59],
    ["Botucatu", -48.44, -22.89], ["Araraquara", -48.18, -21.79], ["São Carlos", -47.89, -22.01],
    ["Limeira", -47.40, -22.56], ["Barretos", -48.57, -20.56], ["Ourinhos", -49.87, -22.98],
    ["Assis", -50.41, -22.66], ["Avaré", -48.93, -23.10], ["Tatuí", -47.86, -23.36],
    ["Itu", -47.30, -23.26], ["Caraguatatuba", -45.41, -23.62], ["Guaratinguetá", -45.19, -22.82],
    ["Bragança Paulista", -46.54, -22.95], ["Americana", -47.33, -22.74], ["Rio Claro", -47.56, -22.41],
    ["Catanduva", -48.97, -21.14], ["Votuporanga", -49.97, -20.42], ["Andradina", -51.38, -20.90],
    ["Dracena", -51.53, -21.48], ["Lins", -49.74, -21.68], ["Jaú", -48.56, -22.30]
  ];

  const D3 = ["https://unpkg.com/d3@7.9.0/dist/d3.min.js", "sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i"];
  const ESTADO = "https://servicodados.ibge.gov.br/api/v3/malhas/estados/35?formato=application/vnd.geo+json&qualidade=intermediaria";
  const MUNICIPIOS = "https://servicodados.ibge.gov.br/api/v3/malhas/estados/35?formato=application/vnd.geo+json&intrarregiao=municipio&qualidade=minima";

  // IBGE entrega GeoJSON no padrão RFC 7946 (anel externo anti-horário); o d3-geo espera o inverso.
  // Sem isso o polígono vira "o mundo menos SP" e aparece como um retângulo.
  function rewind(f) {
    if (!f || !f.geometry) return f;
    const g = f.geometry;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    polys.forEach((rings) => rings.forEach((r) => r.reverse()));
    if (d3.geoArea(f) > 2 * Math.PI) polys.forEach((rings) => rings.forEach((r) => r.reverse()));
    return f;
  }

  function loadD3() {
    if (window.d3) return Promise.resolve();
    const found = document.querySelector('script[src="' + D3[0] + '"]');
    if (found && found.__p) return found.__p;
    const s = found || document.createElement("script");
    s.src = D3[0]; s.integrity = D3[1]; s.crossOrigin = "anonymous";
    s.__p = new Promise((res, rej) => { s.onload = res; s.onerror = rej; });
    if (!found) document.head.appendChild(s);
    return s.__p;
  }

  class MapaSP extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host{display:block;position:relative;width:100%;aspect-ratio:1.25/1;font-family:inherit;}
          .halo{position:absolute;left:10%;top:12%;width:80%;height:76%;border-radius:50%;background:radial-gradient(circle at 60% 50%,rgba(255,255,255,0.16),transparent 66%);filter:blur(34px);pointer-events:none;}
          svg{position:relative;width:100%;height:100%;display:block;overflow:visible;}
          #contorno{fill:none;stroke:#FFFFFF;stroke-width:1.6;stroke-linejoin:round;stroke-dasharray:var(--len);stroke-dashoffset:var(--len);animation:tracar 2.4s cubic-bezier(.16,.84,.44,1) .15s forwards;}
          #massa{opacity:0;animation:surgir 1.4s ease 1s forwards;}
          #mun path{fill:none;stroke:rgba(255,255,255,0.055);stroke-width:0.5;stroke-linejoin:round;vector-effect:non-scaling-stroke;}
          #mun{opacity:0;animation:surgir 1.4s ease 1.4s forwards;}
          .cid{opacity:0;animation:surgir .6s ease forwards;}
          .dest{opacity:0;animation:surgir .7s ease 2.2s forwards;}
          .pulso{transform-box:fill-box;transform-origin:center;animation:pulsar 3.2s ease-out infinite;}
          .rot{font-size:15px;font-weight:600;fill:#FFFFFF;letter-spacing:-0.01em;}
          .rot2{font-size:11px;font-weight:500;fill:rgba(255,255,255,0.62);letter-spacing:0.06em;text-transform:uppercase;}
          @keyframes tracar{to{stroke-dashoffset:0;}}
          @keyframes surgir{to{opacity:1;}}
          @keyframes pulsar{0%{transform:scale(1);opacity:.6;}70%{transform:scale(3.6);opacity:0;}100%{transform:scale(3.6);opacity:0;}}
          @media(prefers-reduced-motion:reduce){#contorno,#massa,#mun,.cid,.dest{animation:none;stroke-dashoffset:0;opacity:1;}.pulso{animation:none;opacity:0;}}
        </style>
        <div class="halo"></div>
        <svg viewBox="0 0 640 512" role="img" aria-label="Mapa do estado de São Paulo, com destaque para a capital, atendida de forma online"></svg>`;
      this._svg = root.querySelector("svg");
      this._tentativas = 0;
      this._garantir();
      this._io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) this._garantir();
      }, { rootMargin: "300px" });
      this._io.observe(this);
    }

    disconnectedCallback() {
      if (this._io) this._io.disconnect();
      clearTimeout(this._retry);
    }

    async _garantir() {
      if (this._ok || this._rodando) return;
      this._rodando = true;
      const ok = await this.desenhar();
      this._rodando = false;
      if (ok) { this._ok = true; if (this._io) this._io.disconnect(); return; }
      if (this._tentativas < 4) {
        const espera = 800 * Math.pow(2, this._tentativas);
        this._tentativas += 1;
        clearTimeout(this._retry);
        this._retry = setTimeout(() => this._garantir(), espera);
      } else {
        console.error("[mapa-sp] não foi possível carregar o mapa após 5 tentativas.");
      }
    }

    async desenhar() {
      try {
        await loadD3();
        const geo = await (await fetch(ESTADO)).json();
        const estado = rewind(geo.features ? geo.features[0] : geo);
        if (!estado) throw new Error("malha de SP indisponível");

        const W = 640, H = 512, pad = 24;
        const proj = d3.geoMercator().fitExtent([[pad, pad], [W - pad, H - pad]], estado);
        const path = d3.geoPath(proj);
        const d = path(estado);
        const ns = "http://www.w3.org/2000/svg";
        const svg = this._svg;

        svg.innerHTML =
          '<defs>' +
            '<linearGradient id="grad" x1="0" y1="0" x2="0.8" y2="1">' +
              '<stop offset="0%" stop-color="#4A4A4A"/><stop offset="55%" stop-color="#232323"/><stop offset="100%" stop-color="#0B0B0B"/>' +
            '</linearGradient>' +
            '<filter id="sombra" x="-20%" y="-20%" width="140%" height="140%">' +
              '<feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.65"/>' +
            '</filter>' +
            '<clipPath id="clipSP"><path d="' + d + '"/></clipPath>' +
          '</defs>' +
          '<g id="massa" filter="url(#sombra)"><path d="' + d + '" fill="url(#grad)"/></g>' +
          '<g id="mun" clip-path="url(#clipSP)"></g>' +
          '<path id="contorno" d="' + d + '"/>';

        fetch(MUNICIPIOS).then((r) => r.json()).then((m) => {
          const alvo = svg.querySelector("#mun");
          if (!alvo || !m) return;
          alvo.innerHTML = (m.features || []).map((f) => '<path d="' + (path(rewind(f)) || "") + '"/>').join("");
        }).catch((e) => console.warn("[mapa-sp] municípios indisponíveis", e));

        const contorno = svg.querySelector("#contorno");
        contorno.style.setProperty("--len", Math.ceil(contorno.getTotalLength()));

        const gc = document.createElementNS(ns, "g");
        CIDADES.forEach(([nome, lng, lat], i) => {
          const p = proj([lng, lat]);
          if (!p) return;
          const c = document.createElementNS(ns, "circle");
          c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]); c.setAttribute("r", 2.2);
          c.setAttribute("fill", "rgba(255,255,255,0.45)");
          c.setAttribute("class", "cid");
          c.style.animationDelay = (1.5 + (i % 20) * 0.05) + "s";
          const t = document.createElementNS(ns, "title"); t.textContent = nome; c.appendChild(t);
          gc.appendChild(c);
        });
        svg.appendChild(gc);

        // Capital em destaque
        const cp = proj([CAPITAL[1], CAPITAL[2]]);
        const gCap = document.createElementNS(ns, "g");
        gCap.setAttribute("class", "dest");
        gCap.innerHTML =
          '<circle cx="' + cp[0] + '" cy="' + cp[1] + '" r="6" fill="#1EA94F" class="pulso"/>' +
          '<circle cx="' + cp[0] + '" cy="' + cp[1] + '" r="6.5" fill="#1EA94F" stroke="#0B0B0B" stroke-width="1.5"><title>São Paulo — capital</title></circle>' +
          '<line x1="' + (cp[0] + 8) + '" y1="' + (cp[1] + 8) + '" x2="' + (cp[0] + 46) + '" y2="' + (cp[1] + 62) + '" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>' +
          '<text x="' + (cp[0] + 52) + '" y="' + (cp[1] + 66) + '" class="rot2">Atendimento online</text>' +
          '<text x="' + (cp[0] + 52) + '" y="' + (cp[1] + 85) + '" class="rot">São Paulo · capital</text>';
        svg.appendChild(gCap);

        // Sede física
        const sp = proj([SEDE[1], SEDE[2]]);
        const gSede = document.createElementNS(ns, "g");
        gSede.setAttribute("class", "dest");
        gSede.innerHTML =
          '<circle cx="' + sp[0] + '" cy="' + sp[1] + '" r="4.5" fill="#FFFFFF" stroke="#0B0B0B" stroke-width="1.5"><title>Boituva — sede do escritório</title></circle>' +
          '<line x1="' + (sp[0] - 7) + '" y1="' + (sp[1] + 7) + '" x2="' + (sp[0] - 30) + '" y2="' + (sp[1] + 40) + '" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>' +
          '<text x="' + (sp[0] - 34) + '" y="' + (sp[1] + 56) + '" class="rot2" text-anchor="end">Sede</text>' +
          '<text x="' + (sp[0] - 34) + '" y="' + (sp[1] + 73) + '" class="rot" text-anchor="end" style="font-size:13px">Boituva</text>';
        svg.appendChild(gSede);
        return true;
      } catch (e) {
        console.warn("[mapa-sp] falha ao desenhar, vai tentar novamente:", e && e.message ? e.message : e);
        return false;
      }
    }
  }
  if (!customElements.get("mapa-sp")) customElements.define("mapa-sp", MapaSP);
})();
