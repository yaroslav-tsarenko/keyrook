import { MOTION_DURATION, MOTION_LIMITS } from "../tokens";

const VERTEX = `
attribute vec2 a_pos;
uniform vec4 u_rect;
uniform vec2 u_canvas;
varying vec2 v_uv;
void main() {
  v_uv = a_pos;
  vec2 px = u_rect.xy + a_pos * u_rect.zw;
  vec2 clip = px / u_canvas * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_texel;
uniform highp vec4 u_rect;
uniform highp vec3 u_light;
uniform vec2 u_tilt;
uniform vec3 u_lamp;
uniform float u_strength;
uniform float u_shade;
varying vec2 v_uv;
float luma(vec4 c) { return dot(c.rgb, vec3(0.299, 0.587, 0.114)); }
void main() {
  vec4 c = texture2D(u_tex, v_uv);
  float body = smoothstep(0.02, 0.6, c.a);
  vec2 dx = vec2(u_texel.x, 0.0);
  vec2 dy = vec2(0.0, u_texel.y);
  float gx = luma(texture2D(u_tex, v_uv + dx)) - luma(texture2D(u_tex, v_uv - dx));
  float gy = luma(texture2D(u_tex, v_uv + dy)) - luma(texture2D(u_tex, v_uv - dy));
  vec2 r = u_texel * 6.0;
  float ax = texture2D(u_tex, v_uv + vec2(r.x, 0.0)).a - texture2D(u_tex, v_uv - vec2(r.x, 0.0)).a;
  float ay = texture2D(u_tex, v_uv + vec2(0.0, r.y)).a - texture2D(u_tex, v_uv - vec2(0.0, r.y)).a;
  vec3 n = normalize(vec3(-(gx * 1.8 + ax * 0.75), -(gy * 1.8 + ay * 0.75), 1.0));
  float cp = cos(u_tilt.y);
  float sp = sin(u_tilt.y);
  n = vec3(n.x, n.y * cp - n.z * sp, n.y * sp + n.z * cp);
  float cy = cos(u_tilt.x);
  float sy = sin(u_tilt.x);
  n = vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy);
  highp vec2 p = u_rect.xy + v_uv * u_rect.zw;
  vec3 L = normalize(vec3(u_light.xy - p, u_light.z));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float nh = max(dot(n, H), 0.0);
  float spec = (pow(nh, 22.0) * 0.42 + pow(nh, 160.0) * 0.95) * body * u_strength;
  float facing = dot(n, L);
  float shade = (1.0 - smoothstep(0.35, 0.95, facing)) * u_shade * body;
  float a = clamp(spec * 0.55 + shade, 0.0, 0.9);
  gl_FragColor = vec4(u_lamp * spec, a);
}`;

const SOFTWARE = /swiftshader|llvmpipe|software|basic render/i;

export interface LampState {
  lx: number;
  ly: number;
  yaw: number;
  pitch: number;
  level: number;
}

export interface LampLayer {
  draw: (state: LampState) => void;
  dispose: () => void;
}

interface LampOptions {
  forced: boolean;
  onLost?: () => void;
  onInvalidate?: () => void;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => img.decode().then(() => resolve(img), () => resolve(img));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function readLamp(): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--lamp-rgb").trim().split(/[\s,]+/).map(Number);
  if (raw.length < 3 || raw.some((v) => !Number.isFinite(v))) return [1, 0.94, 0.85];
  return [raw[0] / 255, raw[1] / 255, raw[2] / 255];
}

export async function createLampLayer(stage: HTMLElement, options: LampOptions): Promise<LampLayer | null> {
  const render = stage.querySelector<HTMLElement>("[data-render]");
  const source = render?.querySelector<HTMLImageElement>("img");
  if (!render || !source) return null;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.lampCanvas = "";
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) return null;

  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const rendererName = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "";
  if (SOFTWARE.test(rendererName) && !options.forced) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

  const loaded = await loadImage(source.currentSrc || source.src);
  if (!loaded || !stage.isConnected) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const aPos = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uRect = gl.getUniformLocation(program, "u_rect");
  const uCanvas = gl.getUniformLocation(program, "u_canvas");
  const uTexel = gl.getUniformLocation(program, "u_texel");
  const uLight = gl.getUniformLocation(program, "u_light");
  const uTilt = gl.getUniformLocation(program, "u_tilt");
  const uLamp = gl.getUniformLocation(program, "u_lamp");
  const uStrength = gl.getUniformLocation(program, "u_strength");
  const uShade = gl.getUniformLocation(program, "u_shade");
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, loaded);
  } catch {
    gl.deleteTexture(texture);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }

  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "1",
    opacity: "0",
    transition: `opacity ${MOTION_DURATION.reveal}ms var(--ease-std)`,
  });
  render.appendChild(canvas);

  let alive = true;
  let shown = false;
  let width = 1;
  let height = 1;
  let stageWidth = 1;
  let stageHeight = 1;
  let offsetX = 0;
  let offsetY = 0;
  let rect: [number, number, number, number] = [0, 0, 1, 1];
  let lamp = readLamp();
  let dark = document.documentElement.dataset.theme !== "light";

  const layout = () => {
    width = Math.max(1, render.offsetWidth);
    height = Math.max(1, render.offsetHeight);
    stageWidth = Math.max(1, stage.offsetWidth);
    stageHeight = Math.max(1, stage.offsetHeight);
    offsetX = render.offsetLeft;
    offsetY = render.offsetTop;
    const dpr = Math.min(window.devicePixelRatio || 1, MOTION_LIMITS.dprCap);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const scale = Math.min(width / loaded.naturalWidth, height / loaded.naturalHeight);
    const w = loaded.naturalWidth * scale;
    const h = loaded.naturalHeight * scale;
    rect = [(width - w) / 2, (height - h) / 2, w, h];
  };
  layout();

  const draw = (state: LampState) => {
    if (!alive) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uCanvas, width, height);
    gl.uniform4f(uRect, rect[0], rect[1], rect[2], rect[3]);
    gl.uniform2f(uTexel, 1 / loaded.naturalWidth, 1 / loaded.naturalHeight);
    gl.uniform3f(uLight, state.lx * stageWidth - offsetX, state.ly * stageHeight - offsetY, stageHeight * 0.85);
    gl.uniform2f(uTilt, (state.yaw * Math.PI) / 180, (state.pitch * Math.PI) / 180);
    gl.uniform3f(uLamp, lamp[0], lamp[1], lamp[2]);
    gl.uniform1f(uStrength, (dark ? 0.8 : 1) * state.level);
    gl.uniform1f(uShade, dark ? 0.16 : 0.1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!shown) {
      shown = true;
      canvas.style.opacity = "1";
    }
  };

  const resize = new ResizeObserver(() => {
    layout();
    options.onInvalidate?.();
  });
  resize.observe(render);

  const theme = new MutationObserver(() => {
    lamp = readLamp();
    dark = document.documentElement.dataset.theme !== "light";
    options.onInvalidate?.();
  });
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const dispose = () => {
    if (!alive) return;
    alive = false;
    resize.disconnect();
    theme.disconnect();
    canvas.removeEventListener("webglcontextlost", onLost);
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  };

  function onLost(event: Event) {
    event.preventDefault();
    dispose();
    options.onLost?.();
  }
  canvas.addEventListener("webglcontextlost", onLost);

  return { draw, dispose };
}
