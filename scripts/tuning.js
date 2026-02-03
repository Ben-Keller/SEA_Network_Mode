(function(){
  const ENABLE = true;
  if(!ENABLE) return;

  function init(){
    if(!window.__SEA || !window.__SEA.CONFIG) return setTimeout(init, 80);
    const CONFIG = window.__SEA.CONFIG;

    const panel = document.createElement("div");
    panel.id="tuningPanel";
    panel.innerHTML = `
      <div class="tpHead">
        <div class="tpTitle">Tuning</div>
        <button class="tpBtn" id="tpCopy">Copy params</button>
      </div>
      <div class="tpBody" id="tpBody"></div>
      <textarea class="tpOut" id="tpOut" readonly></textarea>
    `;
    document.body.appendChild(panel);

    const controls = [
      // Layout
      { key:"polygonRadiusFactor",  min:0.20,  max:0.50, step:0.005 },
      { key:"insetPadding",        min:6,     max:40,   step:1 },
      { key:"minEdgeDistance",     min:2,     max:10,   step:1 },

      // Motion / distribution
      { key:"driftStrength",       min:0.000, max:0.080, step:0.001 },
      { key:"jitterStrength",      min:0.00,  max:1.50,  step:0.01 },
      { key:"centerTether",        min:0.000, max:0.020, step:0.0005 },
      { key:"outwardBias",         min:0.000, max:0.020, step:0.0005 },

      // Collision / packing
      { key:"collidePadding",      min:0.80,  max:1.60,  step:0.01 },
      { key:"collideStrength",     min:0.00,  max:1.00,  step:0.01 },

      // Focus dynamics
      { key:"dimBiasMax",          min:0.20,  max:2.50,  step:0.01 },
      { key:"dimBiasRamp",         min:0.00,  max:0.20,  step:0.005 },
      { key:"nodeSimStrength",     min:0.10,  max:2.50,  step:0.01 },
      { key:"nodeRepel",           min:0.10,  max:2.50,  step:0.01 },

      // Animation
      { key:"posEase",             min:0.005, max:0.22,  step:0.001 },
      { key:"sizeEase",            min:0.01,  max:0.35,  step:0.01 },

      // Neighborhood & dim-links
      { key:"topoNeighbors",       min:0,     max:6,     step:1 },
      { key:"dimTopK",             min:1,     max:10,    step:1 },
    ];

    const body = panel.querySelector("#tpBody");
    const out = panel.querySelector("#tpOut");

    function render(){
      body.innerHTML = controls.map(c => {
        const v = CONFIG[c.key];
        return `
          <div class="tpRow">
            <label class="tpLbl">${c.key}</label>
            <input class="tpSlider" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${v}" data-key="${c.key}">
            <input class="tpVal" type="number" min="${c.min}" max="${c.max}" step="${c.step}" value="${v}" data-key="${c.key}">
          </div>
        `;
      }).join("");
      out.value = JSON.stringify(CONFIG,null,2);
    }

    function setKey(k,v){
      const num = Number(v);
      if(!Number.isFinite(num)) return;
      CONFIG[k]=num;
      out.value = JSON.stringify(CONFIG,null,2);
      if (window.__SEA.setConfig) window.__SEA.setConfig({[k]: num});
      window.__SEA.kick(0.55);
    }

    body.addEventListener("input",(e)=>{
      const k = e.target.getAttribute("data-key");
      if(!k) return;
      const v = e.target.value;
      body.querySelectorAll(`[data-key="${k}"]`).forEach(el=>{ if(el!==e.target) el.value=v; });
      setKey(k,v);
    });

    panel.querySelector("#tpCopy").addEventListener("click", async ()=>{
      const txt = JSON.stringify(CONFIG,null,2);
      out.value = txt;
      try{ await navigator.clipboard.writeText(txt); }catch{}
    });

    render();
  }
  init();
})();
