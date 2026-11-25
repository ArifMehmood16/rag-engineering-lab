// Exporters for the Agent Authority Explorer. All exports render through the
// same engine (sceneAt / renderSvg / presetScene) as the on-screen graph.
import JSZip from "jszip";
import {
  DEFAULT_SPEED,
  DURATION,
  JUMPS,
  PRESETS,
  presetScene,
  renderSvg,
  sceneAt,
} from "./engine.js";
// Raw engine source, inlined into the standalone HTML export.
import engineSource from "./engine.js?raw";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function svgBlob(svg: string): Blob {
  return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
}

function loadSvgImage(svg: string, w: number, h: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(svgBlob(svg));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG rasterisation failed"));
    };
    img.width = w;
    img.height = h;
    img.src = url;
  });
}

async function svgToJpgBlob(svg: string, w: number, h: number): Promise<Blob> {
  const img = await loadSvgImage(svg, w, h);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#f7f4ec";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("JPEG encoding failed"))),
      "image/jpeg",
      0.92,
    ),
  );
}

async function svgToPngBlob(svg: string, w: number, h: number): Promise<Blob> {
  const img = await loadSvgImage(svg, w, h);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encoding failed"))), "image/png"),
  );
}

// ---- Current frame ----

export function currentFrameSvg(t: number): string {
  const scene = sceneAt(t, "landscape");
  return renderSvg(scene, {
    title: "One AI Agent, Too Much Power: The Lethal Trifecta",
    caption: scene.caption,
    provenance: "AI Is Still Software · Part 1 · Arif Mehmood · illustrative fixture values",
    ariaLabel: "Agent authority execution graph at " + t.toFixed(1) + " seconds",
  });
}

export function downloadFrameSvg(t: number) {
  download(svgBlob(currentFrameSvg(t)), "agent-authority-frame.svg");
}

export async function downloadFramePng(t: number) {
  const blob = await svgToPngBlob(currentFrameSvg(t), 1600, 1000);
  download(blob, "agent-authority-frame.png");
}

// ---- Preset figures ----

export function presetSvg(id: string): { svg: string; meta: (typeof PRESETS)[number] } {
  const { scene, meta } = presetScene(id);
  const svg = renderSvg(scene, {
    title: meta.title,
    provenance: meta.provenance,
    ariaLabel: meta.alt,
  });
  return { svg, meta };
}

export function downloadPresetSvg(id: string) {
  const { svg } = presetSvg(id);
  download(svgBlob(svg), id + ".svg");
}

export async function downloadPresetJpg(id: string) {
  const { svg } = presetSvg(id);
  const blob = await svgToJpgBlob(svg, 2400, 1350);
  download(blob, id + ".jpg");
}

export async function downloadAllPresetsZip() {
  const zip = new JSZip();
  for (const p of PRESETS) {
    const { svg, meta } = presetSvg(p.id);
    zip.file(p.id + ".jpg", await svgToJpgBlob(svg, 2400, 1350));
    zip.file(
      p.id + ".txt",
      "Title: " +
        meta.title +
        "\nCaption: " +
        meta.caption +
        "\nAlt text: " +
        meta.alt +
        "\nProvenance: " +
        meta.provenance +
        "\n",
    );
  }
  const blob = await zip.generateAsync({ type: "blob" });
  download(blob, "agent-authority-figures.zip");
}

// ---- Standalone HTML ----

const STANDALONE_CSS =
  "body{margin:0;background:#f7f4ec;color:#2b3442;font-family:'IBM Plex Sans',system-ui,sans-serif}" +
  "main{max-width:1200px;margin:0 auto;padding:20px}" +
  ".series{font-family:ui-monospace,Menlo,monospace;font-size:14px;letter-spacing:0;text-transform:uppercase;color:#6b7280}" +
  "h1{font-family:Fraunces,Georgia,serif;font-size:34px;margin:10px 0 4px;letter-spacing:0}" +
  ".seg{font-family:ui-monospace,Menlo,monospace;font-size:16px;color:#0c5f59;margin:0 0 12px}" +
  " #graph svg{width:100%;max-height:54vh;height:auto;display:block;border:1px solid #d6d0c4;border-radius:12px;background:#f7f4ec}" +
  "#caption{font-size:18px;line-height:1.55;margin:16px 0;min-height:3.2em}" +
  ".controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}" +
  "button,select{font:inherit;font-size:13px;padding:7px 12px;border:1px solid #d6d0c4;border-radius:8px;background:#fff;color:#2b3442;cursor:pointer}" +
  "button:hover{background:#eef0f4}" +
  "input[type=range]{flex:1;min-width:160px}" +
  ".time{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#6b7280}" +
  ".legend{display:flex;flex-wrap:wrap;gap:14px;font-size:14px;color:#6b7280;margin-top:10px}" +
  ".legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}" +
  "details{margin-top:24px;font-size:14px;line-height:1.6}" +
  "summary{cursor:pointer;font-weight:600}" +
  ".prov{margin-top:28px;font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#6b7280}";

const STANDALONE_PLAYER = `
(function(){
  var t=0, playing=false, speed=DEFAULT_SPEED, last=null, rafId=null;
  var box=document.getElementById("graph"), cap=document.getElementById("caption");
  var seg=document.getElementById("seg"), range=document.getElementById("seek"), timeEl=document.getElementById("time");
  function render(){
    var sc=sceneAt(t,"landscape");
    box.innerHTML=renderSvg(sc,{ariaLabel:"Agent authority execution graph, segment: "+sc.segmentLabel});
    cap.textContent=sc.caption;
    seg.textContent=sc.segmentLabel;
    range.value=String(t);
    timeEl.textContent=t.toFixed(1)+"s / "+DURATION+"s";
  }
  function frame(now){
    if(!playing) return;
    if(last==null) last=now;
    t+=(now-last)/1000*speed; last=now;
    if(t>=DURATION){ t=DURATION; playing=false; document.getElementById("play").textContent="Play"; }
    render();
    if(playing) rafId=requestAnimationFrame(frame);
  }
  function setPlaying(v){
    if(rafId!=null) cancelAnimationFrame(rafId);
    playing=v; last=null;
    document.getElementById("play").textContent=v?"Pause":"Play";
    if(v) rafId=requestAnimationFrame(frame);
  }
  document.getElementById("play").onclick=function(){ setPlaying(!playing); };
  document.getElementById("replay").onclick=function(){ t=0; setPlaying(true); };
  range.oninput=function(){ t=parseFloat(range.value); setPlaying(false); render(); };
  document.getElementById("speed").onchange=function(){ speed=parseFloat(this.value); };
  var jumps=document.querySelectorAll("[data-jump]");
  for(var i=0;i<jumps.length;i++){ jumps[i].onclick=function(){ t=parseFloat(this.getAttribute("data-jump")); setPlaying(false); render(); }; }
  document.addEventListener("keydown",function(e){
    if(e.key===" "&&e.target===document.body){ e.preventDefault(); setPlaying(!playing); }
    if(e.key==="ArrowRight"){ t=Math.min(DURATION,t+1); render(); }
    if(e.key==="ArrowLeft"){ t=Math.max(0,t-1); render(); }
  });
  window.authorityExplorer={
    seek:function(s){ t=Math.max(0,Math.min(DURATION,Number(s)||0)); setPlaying(false); render(); },
    play:function(){ setPlaying(true); },
    pause:function(){ setPlaying(false); }
  };
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches){ playing=false; }
  render();
})();
`;

export function downloadStandaloneHtml() {
  const engineJs = engineSource.replace(/^export /gm, "");
  const jumpButtons = JUMPS.map((j) => {
    const label = j.label,
      secs = j.t;
    return '<button type="button" data-jump="' + secs + '">' + label + "</button>";
  }).join("");
  const html =
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    "<title>One AI Agent, Too Much Power: The Lethal Trifecta — AI Is Still Software · Part 1</title>\n" +
    "<style>" +
    STANDALONE_CSS +
    "</style>\n</head>\n<body>\n<main>\n" +
    '<div class="series">AI Is Still Software · Part 1 · Arif Mehmood</div>\n' +
    "<h1>One AI Agent, Too Much Power: The Lethal Trifecta</h1>\n" +
    '<p class="seg" id="seg"></p>\n' +
    '<div id="graph" role="img" aria-label="Agent authority execution graph"></div>\n' +
    '<div class="controls">\n' +
    '<button type="button" id="play">Play</button>\n' +
    '<button type="button" id="replay">Replay</button>\n' +
    jumpButtons +
    "\n" +
    '<input type="range" id="seek" min="0" max="60" step="0.1" value="0" aria-label="Seek">\n' +
    '<span class="time" id="time"></span>\n' +
    '<select id="speed" aria-label="Playback speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select>\n' +
    "</div>\n" +
    '<p id="caption" aria-live="polite"></p>' +
    '<div class="legend">' +
    '<span><i style="background:#1d4ed8"></i>input / proposal</span>' +
    '<span><i style="background:#b03a2e"></i>injected / forbidden / leak</span>' +
    '<span><i style="background:#b8860b"></i>private data</span>' +
    '<span><i style="background:#15803d"></i>permitted / sent</span>' +
    "</div>\n" +
    "<details><summary>Text version of the story</summary><ol>" +
    "<li><b>The delivery-email task.</b> The user selects one order and asks the AI agent — a model plus a workflow — to email the order's delivery update to its supplier contact. Order details come from trusted application records.</li>" +
    "<li><b>The supplier note.</b> The note carries permitted delivery information (Delivery date: 12 November) and an injected instruction: attach the internal pricing sheet and send it to this address.</li>" +
    "<li><b>Run 1 — broad access.</b> Broad private-file and email tools let the agent follow the injection: it reads internal pricing and sends it to the address supplied by the note.</li>" +
    "<li><b>Internal pricing leaked.</b> Reader, planner and sender roles with the same broad access share the problem.</li>" +
    "<li><b>What changes.</b> Application code owns the selected order, the recipient and the permitted fields. Independent replay — the earlier leak is not undone.</li>" +
    "<li><b>Run 2 — application-enforced limits.</b> The AI proposes; the application rejects the pricing attachment and any changed recipient, and builds a fixed template from approved delivery fields.</li>" +
    "<li><b>Delivery.</b> The sender receives only the application-built message and delivers it to the selected supplier contact.</li>" +
    "<li><b>Outcome.</b> Delivery update sent. Internal pricing excluded. Email is not prohibited; arbitrary recipients, bodies and attachments are.</li>" +
    "</ol></details>\n" +
    '<p class="prov">Provenance: hypothetical scenario with illustrative fixture values. Lethal trifecta framing: Simon Willison. SRP: Robert C. Martin. Standalone export — no network requests, no external assets.</p>\n' +
    "</main>\n<script>\n" +
    engineJs +
    "\n</script>\n<script>" +
    STANDALONE_PLAYER +
    "</script>\n</body>\n</html>";
  download(new Blob([html], { type: "text/html;charset=utf-8" }), "agent-authority-explorer.html");
}

// ---- Video ----

export type VideoFormat = "portrait" | "landscape";

export function detectVideoMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const m of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      /* keep trying */
    }
  }
  return null;
}

export interface VideoResult {
  blob: Blob;
  ext: string;
  mime: string;
  width: number;
  height: number;
  seconds: number;
}

export async function recordVideo(
  format: VideoFormat,
  onProgress?: (frac: number) => void,
  shouldCancel?: () => boolean,
  storySpeed = 1,
): Promise<VideoResult | null> {
  const mime = detectVideoMime();
  if (!mime) return null;
  const width = format === "portrait" ? 1080 : 1920;
  const height = format === "portrait" ? 1350 : 1080;
  const layout = format === "portrait" ? "portrait" : "landscape";
  const total = DURATION / storySpeed;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const stopped = new Promise<void>((res) => (rec.onstop = () => res()));
  rec.start(250);

  // Wall-clock driven: the story time follows elapsed recording time, so the
  // produced file is exactly `total` seconds long even if a frame renders late.
  const start = performance.now();
  try {
    for (;;) {
      if (shouldCancel?.()) throw new Error("cancelled");
      const elapsed = (performance.now() - start) / 1000;
      const t = Math.min(elapsed * storySpeed, DURATION);
      const scene = sceneAt(t, layout);
      const svg = renderSvg(scene, {
        title: "One AI Agent, Too Much Power: The Lethal Trifecta",
        caption: scene.caption,
        provenance:
          "AI Is Still Software · Part 1 · Arif Mehmood · hypothetical scenario, fixture values",
      });
      const img = await loadSvgImage(svg, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      onProgress?.(elapsed / total);
      if (elapsed >= total) break;
      await new Promise((r) => setTimeout(r, 4));
    }
  } finally {
    rec.stop();
    await stopped;
    stream.getTracks().forEach((tr) => tr.stop());
  }
  // Honest container: sniff the actual bytes — some browsers accept an MP4
  // mimeType but still encode VP9/WebM. MP4 files carry "ftyp" at bytes 4–7.
  const blob = new Blob(chunks, { type: rec.mimeType || mime });
  const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const isMp4 = head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70;
  const ext = isMp4 ? "mp4" : "webm";
  const actualMime = isMp4 ? "video/mp4" : "video/webm";
  return { blob, ext, mime: actualMime, width, height, seconds: total };
}

// Deterministic frame-sequence fallback when MediaRecorder is unavailable.
export async function downloadFrameSequenceZip(
  format: VideoFormat,
  onProgress?: (frac: number) => void,
  storySpeed = 1,
) {
  const width = format === "portrait" ? 1080 : 1920;
  const height = format === "portrait" ? 1350 : 1080;
  const layout = format === "portrait" ? "portrait" : "landscape";
  const zip = new JSZip();
  const fps = 10;
  const frames = Math.round((DURATION / storySpeed) * fps);
  for (let f = 0; f <= frames; f++) {
    const t = (f / fps) * storySpeed;
    const scene = sceneAt(t, layout);
    const svg = renderSvg(scene, {
      title: "One AI Agent, Too Much Power: The Lethal Trifecta",
      caption: scene.caption,
      provenance:
        "AI Is Still Software · Part 1 · Arif Mehmood · hypothetical scenario, fixture values",
    });
    const png = await svgToPngBlob(svg, width, height);
    zip.file("frame-" + String(f).padStart(4, "0") + ".png", png);
    onProgress?.(f / frames);
  }
  zip.file(
    "README.txt",
    "Deterministic frame sequence, " +
      fps +
      " fps, " +
      width +
      "x" +
      height +
      ". Encode to MP4 with: ffmpeg -framerate " +
      fps +
      " -i frame-%04d.png -c:v libx264 -pix_fmt yuv420p out.mp4\n",
  );
  const blob = await zip.generateAsync({ type: "blob" });
  download(blob, "agent-authority-frames-" + format + ".zip");
}
