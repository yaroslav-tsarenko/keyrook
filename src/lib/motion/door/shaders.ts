const LIGHT = `
uniform vec3 cameraPosition;
uniform vec3 uKeyDir;
uniform vec3 uKeyColor;
uniform vec3 uFillDir;
uniform vec3 uFillColor;
uniform vec3 uSky;
uniform vec3 uGround;
vec3 light(vec3 base, vec3 n, vec3 p, float shine, float specAmt, vec3 tangent, float aniso) {
  vec3 v = normalize(cameraPosition - p);
  vec3 l = normalize(uKeyDir);
  vec3 h = normalize(l + v);
  float diff = max(dot(n, l), 0.0);
  vec3 amb = mix(uGround, uSky, n.y * 0.5 + 0.5);
  float fill = max(dot(n, normalize(uFillDir)), 0.0);
  float blinn = pow(max(dot(n, h), 0.0), shine);
  float th = dot(tangent, h);
  float brushed = pow(sqrt(max(1.0 - th * th, 0.0)), shine * 0.6) * diff;
  float spec = mix(blinn, brushed, aniso);
  return base * (amb + diff * uKeyColor + fill * uFillColor) + spec * specAmt * uKeyColor;
}
`;

const HEAD = `precision highp float;\n`;

export const SOLID_VERTEX = `
attribute vec3 position;
attribute vec3 normal;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vObjN;
void main() {
  vLocal = position;
  vObjN = normal;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const RADIAL_VERTEX = (body: string) => `
attribute vec3 position;
attribute vec3 normal;
attribute float aAngle;
attribute float aIndex;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uProgress;
uniform float uStagger;
uniform float uCenter;
uniform float uTravel;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vObjN;
void main() {
  float c = cos(aAngle);
  float s = sin(aAngle);
  vec3 d = vec3(c, s, 0.0);
  vec3 t = vec3(-s, c, 0.0);
  ${body}
  vec3 local = d * (position.y + center) + t * position.x + vec3(0.0, 0.0, position.z);
  vec3 n = d * normal.y + t * normal.x + vec3(0.0, 0.0, normal.z);
  vLocal = position;
  vObjN = normal;
  vec4 world = modelMatrix * vec4(local, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const BOLT_VERTEX = RADIAL_VERTEX(`
  float k = clamp(uProgress * (1.0 + 7.0 * uStagger) - aIndex * uStagger, 0.0, 1.0);
  float e = k * k * k * (k * (k * 6.0 - 15.0) + 10.0);
  float center = uCenter - e * uTravel;
`);

export const SPOKE_VERTEX = RADIAL_VERTEX(`
  float center = uCenter;
`);

export const HINGE_VERTEX = `
attribute vec3 position;
attribute vec3 normal;
attribute float aY;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vObjN;
void main() {
  vec3 local = position + vec3(0.0, aY, 0.0);
  vLocal = position;
  vObjN = normal;
  vec4 world = modelMatrix * vec4(local, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const VARYINGS = `
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vObjN;
`;

export const STEEL_FRAGMENT = `${HEAD}${LIGHT}${VARYINGS}
uniform vec3 uColor;
uniform float uShine;
uniform float uSpec;
void main() {
  vec3 n = normalize(vNormal);
  gl_FragColor = vec4(light(uColor, n, vWorld, uShine, uSpec, vec3(0.0, 0.0, 1.0), 0.25), 1.0);
}
`;

export const DOOR_FRAGMENT = `${HEAD}${LIGHT}${VARYINGS}
uniform mat4 modelMatrix;
uniform vec3 uColor;
uniform float uRadius;
uniform float uRing;
void main() {
  vec3 n = normalize(vNormal);
  mat3 m = mat3(modelMatrix);
  float r = length(vLocal.xz);
  vec3 radial = normalize(m * vec3(vLocal.x, 0.0, vLocal.z) + vec3(1e-5));
  vec3 circ = normalize(m * vec3(-vLocal.z, 0.0, vLocal.x) + vec3(1e-5));
  vec3 base = uColor;
  float aniso = 0.45;
  if (vObjN.y > 0.5) {
    float rr = r / uRadius;
    base *= 1.0 + sin(r * 620.0) * 0.015;
    float edge = smoothstep(0.955, 0.985, rr);
    n = normalize(n + radial * edge * 1.6);
    float groove = 1.0 - smoothstep(0.0, 0.0035, abs(rr - uRing));
    base = mix(base, base * 0.5, groove);
    aniso = 0.85;
  } else if (vObjN.y < -0.5) {
    base *= 0.5;
  }
  gl_FragColor = vec4(light(base, n, vWorld, 54.0, 0.6, circ, aniso), 1.0);
}
`;

export const DIAL_FRAGMENT = `${HEAD}${LIGHT}${VARYINGS}
uniform mat4 modelMatrix;
uniform vec3 uColor;
uniform float uRadius;
uniform sampler2D uFace;
void main() {
  vec3 n = normalize(vNormal);
  mat3 m = mat3(modelMatrix);
  vec3 circ = normalize(m * vec3(-vLocal.z, 0.0, vLocal.x) + vec3(1e-5));
  vec3 base = uColor;
  float aniso = 0.5;
  if (vObjN.y > 0.5) {
    vec2 uv = vec2(vLocal.x, -vLocal.z) / (2.0 * uRadius) + 0.5;
    base = texture2D(uFace, uv).rgb;
    aniso = 0.7;
  } else if (vObjN.y > -0.5) {
    float a = atan(vLocal.z, vLocal.x);
    n = normalize(n + circ * sin(a * 140.0) * 0.45);
  }
  gl_FragColor = vec4(light(base, n, vWorld, 40.0, 0.45, circ, aniso), 1.0);
}
`;

export const FLAT_FRAGMENT = `${HEAD}
uniform vec3 uColor;
uniform vec3 uOff;
uniform float uLit;
void main() {
  gl_FragColor = vec4(mix(uOff, uColor, uLit), 1.0);
}
`;

export const WALL_FRAGMENT = `${HEAD}${LIGHT}${VARYINGS}
uniform vec3 uBg;
uniform vec3 uLip;
uniform float uFrame;
uniform float uLipWidth;
void main() {
  float r = length(vWorld.xy);
  if (r < uFrame) discard;
  float t = clamp((r - uFrame) / uLipWidth, 0.0, 1.0);
  vec3 radial = vec3(vWorld.xy / max(r, 1e-4), 0.0);
  vec3 n = normalize(vec3(0.0, 0.0, 1.0) - radial * (1.0 - t) * 1.1);
  vec3 lit = light(uLip, n, vWorld, 36.0, 0.4, vec3(-radial.y, radial.x, 0.0), 0.7);
  float mask = 1.0 - smoothstep(0.8, 1.0, t);
  gl_FragColor = vec4(mix(uBg, lit, mask), 1.0);
}
`;

export const TUNNEL_FRAGMENT = `${HEAD}${LIGHT}${VARYINGS}
uniform vec3 uColor;
uniform float uExposure;
uniform float uDepth;
void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  float depth = smoothstep(-uDepth, 0.0, vWorld.z);
  vec3 base = uColor * mix(0.3, 1.0, depth);
  vec3 c = light(base, n, vWorld, 24.0, 0.2, vec3(0.0, 0.0, 1.0), 0.6);
  gl_FragColor = vec4(c * mix(0.16, 1.0, uExposure), 1.0);
}
`;

export const BACK_FRAGMENT = `${HEAD}${VARYINGS}
uniform vec3 uColor;
uniform float uExposure;
void main() {
  float vignette = 1.0 - smoothstep(0.6, 1.7, length(vWorld.xy));
  gl_FragColor = vec4(uColor * mix(0.55, 1.0, vignette) * mix(0.14, 1.0, uExposure), 1.0);
}
`;

export const CELL_VERTEX = `
attribute vec3 position;
attribute vec2 uv;
attribute vec3 aOffset;
attribute vec2 aSize;
attribute vec4 aRect;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec2 uParallax;
varying vec2 vUv;
varying vec2 vSize;
varying vec4 vRect;
void main() {
  vUv = uv;
  vSize = aSize;
  vRect = aRect;
  vec3 local = vec3(position.xy * aSize, 0.0) + aOffset + vec3(uParallax * (aOffset.z + 1.3), 0.0);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(local, 1.0);
}
`;

export const CELL_FRAGMENT = `${HEAD}
uniform sampler2D uAtlas;
uniform vec3 uPlate;
uniform vec3 uRecess;
uniform vec3 uHi;
uniform float uExposure;
uniform float uFrame;
varying vec2 vUv;
varying vec2 vSize;
varying vec4 vRect;
void main() {
  vec2 px = vUv * vSize;
  vec2 inner = step(vec2(uFrame), px) * step(px, vSize - uFrame);
  vec3 col = uPlate;
  if (inner.x * inner.y < 0.5) {
    if (px.y > vSize.y - 0.007) col = mix(col, uHi, 0.22);
    if (px.y < 0.007) col *= 0.45;
  } else if (vRect.z > 0.0) {
    vec2 uv = (px - uFrame) / (vSize - 2.0 * uFrame);
    col = texture2D(uAtlas, vRect.xy + uv * vRect.zw).rgb;
  } else {
    vec2 q = px - uFrame;
    vec2 s = vSize - 2.0 * uFrame;
    col = uPlate * 0.86;
    if (q.y > s.y - 0.006) col = mix(col, uHi, 0.18);
    float pull = step(abs(q.x - s.x * 0.5), s.x * 0.2) * step(abs(q.y - s.y * 0.2), 0.012);
    col = mix(col, uPlate * 1.4, pull);
    float lock = 1.0 - step(0.018, length(q - vec2(s.x * 0.5, s.y * 0.62)));
    col = mix(col, uRecess, lock);
  }
  gl_FragColor = vec4(col * mix(0.12, 1.0, uExposure), 1.0);
}
`;
