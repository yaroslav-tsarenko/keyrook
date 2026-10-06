import { Box, Camera, Cylinder, Mesh, Plane, Program, Renderer, Texture, Transform, Vec3, type Geometry, type Vec3Tuple } from "ogl";
import { MOTION_EASE, MOTION_LIMITS } from "../tokens";
import { clamp, cubicBezier } from "../ticker";
import { boltAngles, DOOR, DOOR_CAMERA, DOOR_DIAL_STOPS, DOOR_TIMELINE } from "./geometry";
import { ATLAS, atlasCell, drawDialFace, mix, paintAtlas, readPalette, scale, type DoorPalette, type VaultCoverInput } from "./surfaces";
import {
  BACK_FRAGMENT,
  BOLT_VERTEX,
  CELL_FRAGMENT,
  CELL_VERTEX,
  DIAL_FRAGMENT,
  DOOR_FRAGMENT,
  FLAT_FRAGMENT,
  HINGE_VERTEX,
  SOLID_VERTEX,
  SPOKE_VERTEX,
  STEEL_FRAGMENT,
  TUNNEL_FRAGMENT,
  WALL_FRAGMENT,
} from "./shaders";

export interface DoorFrame {
  progress: number;
  dial: number;
  pointerX: number;
  pointerY: number;
}

export interface CoverRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Aperture {
  x: number;
  y: number;
  r: number;
}

export interface DoorScene {
  render: (frame: DoorFrame) => void;
  coverRect: (index: number) => CoverRect | null;
  aperture: () => Aperture;
  resize: () => void;
  setDpr: (dpr: number) => void;
  dpr: () => number;
  dialAt: (progress: number) => number;
  dispose: () => void;
}

interface DoorSceneOptions {
  forced: boolean;
  covers: VaultCoverInput[];
  onLost: () => void;
  onInvalidate: () => void;
}

const SOFTWARE = /swiftshader|llvmpipe|software|basic render/i;
const latch = cubicBezier(...MOTION_EASE.latch);
const inOut = cubicBezier(...MOTION_EASE.inOut);
const std = cubicBezier(...MOTION_EASE.std);
const RAD = Math.PI / 180;
const KEY_DIR: Vec3Tuple = [-0.55, 0.72, 0.62];
const CELL_FRAME = 0.022;

function seg(p: number, range: readonly [number, number]): number {
  return clamp((p - range[0]) / (range[1] - range[0]), 0, 1);
}

export function dialTarget(p: number): number {
  const s = seg(p, DOOR_TIMELINE.dial) * 3;
  const i = Math.min(2, Math.floor(s));
  const f = s - i;
  return DOOR_DIAL_STOPS[i] + (DOOR_DIAL_STOPS[i + 1] - DOOR_DIAL_STOPS[i]) * latch(f);
}

function probeContext(canvas: HTMLCanvasElement, forced: boolean): boolean {
  const attributes = { alpha: false, antialias: true, depth: true, powerPreference: "high-performance" as const };
  const gl = (canvas.getContext("webgl2", attributes) ?? canvas.getContext("webgl", attributes)) as WebGLRenderingContext | null;
  if (!gl) return false;
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const name = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "";
  if (SOFTWARE.test(name) && !forced) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return false;
  }
  return true;
}

function instanced<G extends Geometry>(geometry: G, attrs: Record<string, { size: number; data: number[] }>): G {
  for (const [key, attr] of Object.entries(attrs)) geometry.addAttribute(key, { instanced: 1, size: attr.size, data: new Float32Array(attr.data) });
  return geometry;
}

function cellLayout(count: number) {
  const [cw, ch] = DOOR.interior.cell;
  const lead = { x: 0, y: 0, w: cw * 1.24, h: ch * 1.3 };
  const cells = [{ ...lead, cover: 0 }];
  const cols = [-1.08, -0.6, 0.6, 1.08];
  const rows = [0.5, 0, -0.5];
  let k = 1;
  for (const y of rows) {
    for (const x of cols) {
      cells.push({ x, y, w: cw * 0.66, h: ch * 0.62, cover: k <= count - 1 ? k : -1 });
      k += 1;
    }
  }
  return cells;
}

export async function createDoorScene(canvas: HTMLCanvasElement, options: DoorSceneOptions): Promise<DoorScene | null> {
  if (!probeContext(canvas, options.forced)) return null;
  let dpr = Math.min(window.devicePixelRatio || 1, MOTION_LIMITS.dprCap);
  const renderer = new Renderer({ canvas, dpr, alpha: false, antialias: true, depth: true, powerPreference: "high-performance" });
  const gl = renderer.gl;
  let palette: DoorPalette = readPalette();

  const camera = new Camera(gl, { fov: DOOR_CAMERA.fovDeg, near: 0.1, far: 30 });
  const scene = new Transform();

  const light = {
    uKeyDir: { value: [...KEY_DIR] },
    uKeyColor: { value: [0.9, 0.92, 0.9] },
    uFillDir: { value: [0.7, -0.25, 0.5] },
    uFillColor: { value: [0.12, 0.14, 0.13] },
    uSky: { value: [0.34, 0.36, 0.35] },
    uGround: { value: [0.16, 0.17, 0.17] },
  };
  const applyLight = () => {
    if (palette.light) {
      light.uKeyColor.value = [0.62, 0.63, 0.62];
      light.uFillColor.value = [0.2, 0.2, 0.2];
      light.uSky.value = [0.62, 0.63, 0.62];
      light.uGround.value = [0.46, 0.47, 0.47];
    } else {
      light.uKeyColor.value = [0.95, 0.97, 0.96];
      light.uFillColor.value = [0.12, 0.14, 0.13];
      light.uSky.value = [0.36, 0.38, 0.37];
      light.uGround.value = [0.16, 0.17, 0.17];
    }
  };
  applyLight();

  const exposure = { value: 0.2 };
  const programs: Program[] = [];
  const geometries: Geometry[] = [];
  const make = (vertex: string, fragment: string, uniforms: Record<string, { value: unknown }>, extra: { cullFace?: null } = {}) => {
    const program = new Program(gl, { vertex, fragment, uniforms: { ...light, ...uniforms }, ...extra });
    programs.push(program);
    return program;
  };
  const add = <G extends Geometry>(g: G) => {
    geometries.push(g);
    return g;
  };

  const steelColor = { value: palette.steel };
  const darkSteel = { value: scale(palette.steel, 0.8) };

  const wall = new Mesh(gl, {
    geometry: add(new Plane(gl, { width: 16, height: 16 })),
    program: make(SOLID_VERTEX, WALL_FRAGMENT, {
      uBg: { value: palette.bg },
      uLip: { value: mix(palette.plate, palette.steelHi, 0.12) },
      uFrame: { value: DOOR.frameRadius },
      uLipWidth: { value: DOOR.frameLip },
    }),
  });
  wall.setParent(scene);

  const tunnel = new Mesh(gl, {
    geometry: add(new Cylinder(gl, { radiusTop: DOOR.frameRadius, radiusBottom: DOOR.frameRadius, height: DOOR.interior.depth, radialSegments: 96, openEnded: true })),
    program: make(SOLID_VERTEX, TUNNEL_FRAGMENT, { uColor: { value: palette.plate }, uExposure: exposure, uDepth: { value: DOOR.interior.depth } }, { cullFace: null }),
  });
  tunnel.rotation.x = Math.PI / 2;
  tunnel.position.z = -DOOR.interior.depth / 2;
  tunnel.setParent(scene);

  const back = new Mesh(gl, {
    geometry: add(new Plane(gl, { width: 4, height: 4 })),
    program: make(SOLID_VERTEX, BACK_FRAGMENT, { uColor: { value: palette.recess }, uExposure: exposure }),
  });
  back.position.z = -DOOR.interior.depth;
  back.setParent(scene);

  const atlasCanvas = document.createElement("canvas");
  atlasCanvas.width = 4;
  atlasCanvas.height = 4;
  const atlas = new Texture(gl, { image: atlasCanvas, generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR });
  const layout = cellLayout(options.covers.length);
  const rectFor = (cover: number, loaded: boolean[]) => {
    if (cover < 0 || !loaded[cover]) return [0, 0, -1, -1];
    const c = atlasCell(cover);
    return [c.x / ATLAS.width, 1 - (c.y + c.h) / ATLAS.height, c.w / ATLAS.width, c.h / ATLAS.height];
  };
  const cellGeometry = add(
    instanced(new Plane(gl, { width: 1, height: 1 }), {
      aOffset: { size: 3, data: layout.flatMap((c) => [c.x, c.y, -DOOR.interior.depth + 0.02]) },
      aSize: { size: 2, data: layout.flatMap((c) => [c.w, c.h]) },
      aRect: { size: 4, data: layout.flatMap((c) => rectFor(c.cover, [])) },
    }),
  );
  const parallax = { value: [0, 0] };
  const cellUniforms = {
    uAtlas: { value: atlas },
    uPlate: { value: palette.plate },
    uRecess: { value: palette.recess },
    uHi: { value: palette.steelHi },
    uExposure: exposure,
    uFrame: { value: CELL_FRAME },
    uParallax: parallax,
  };
  const cells = new Mesh(gl, { geometry: cellGeometry, program: make(CELL_VERTEX, CELL_FRAGMENT, cellUniforms), frustumCulled: false });
  cells.setParent(scene);

  const hinges = new Mesh(gl, {
    geometry: add(
      instanced(new Cylinder(gl, { radiusTop: DOOR.hinge.radius, radiusBottom: DOOR.hinge.radius, height: DOOR.hinge.height, radialSegments: 24 }), {
        aY: { size: 1, data: [...DOOR.hinge.ys] },
      }),
    ),
    program: make(HINGE_VERTEX, STEEL_FRAGMENT, { uColor: darkSteel, uShine: { value: 30 }, uSpec: { value: 0.5 } }),
    frustumCulled: false,
  });
  hinges.position.set(DOOR.hinge.x, 0, 0);
  hinges.setParent(scene);

  const hinge = new Transform();
  hinge.position.set(DOOR.hinge.x, 0, -DOOR.thickness / 2 - 0.01);
  hinge.setParent(scene);
  const door = new Transform();
  door.position.set(-DOOR.hinge.x, 0, 0);
  door.setParent(hinge);

  const body = new Mesh(gl, {
    geometry: add(new Cylinder(gl, { radiusTop: DOOR.radius, radiusBottom: DOOR.radius, height: DOOR.thickness, radialSegments: DOOR.segments })),
    program: make(SOLID_VERTEX, DOOR_FRAGMENT, { uColor: steelColor, uRadius: { value: DOOR.radius }, uRing: { value: 0.9 } }),
  });
  body.rotation.x = Math.PI / 2;
  body.setParent(door);

  const front = DOOR.thickness / 2;
  const angles = boltAngles().map((a) => a * RAD);
  const boltUniforms = {
    uColor: { value: palette.steelHi },
    uShine: { value: 60 },
    uSpec: { value: 0.7 },
    uProgress: { value: 0 },
    uStagger: { value: 0.09 },
    uCenter: { value: DOOR.radius + 0.16 - DOOR.bolts.length / 2 },
    uTravel: { value: DOOR.bolts.retract },
  };
  const bolts = new Mesh(gl, {
    geometry: add(
      instanced(new Cylinder(gl, { radiusTop: DOOR.bolts.radius, radiusBottom: DOOR.bolts.radius, height: DOOR.bolts.length, radialSegments: 16 }), {
        aAngle: { size: 1, data: angles },
        aIndex: { size: 1, data: angles.map((_, i) => i) },
      }),
    ),
    program: make(BOLT_VERTEX, STEEL_FRAGMENT, boltUniforms),
    frustumCulled: false,
  });
  bolts.setParent(door);

  const dialFaceCanvas = document.createElement("canvas");
  drawDialFace(dialFaceCanvas, palette);
  const dialTexture = new Texture(gl, { image: dialFaceCanvas, generateMipmaps: true });
  const dialPivot = new Transform();
  dialPivot.position.set(0, DOOR.dial.y, front + DOOR.dial.thickness / 2);
  dialPivot.setParent(door);
  const dial = new Mesh(gl, {
    geometry: add(new Cylinder(gl, { radiusTop: DOOR.dial.radius, radiusBottom: DOOR.dial.radius, height: DOOR.dial.thickness, radialSegments: 72 })),
    program: make(SOLID_VERTEX, DIAL_FRAGMENT, { uColor: steelColor, uRadius: { value: DOOR.dial.radius }, uFace: { value: dialTexture } }),
  });
  dial.rotation.x = Math.PI / 2;
  dial.setParent(dialPivot);

  const accent = { value: palette.accent };
  const lampOff = { value: palette.lampOff };
  const index = new Mesh(gl, {
    geometry: add(new Box(gl, { width: DOOR.index.width, height: DOOR.index.height, depth: 0.012 })),
    program: make(SOLID_VERTEX, FLAT_FRAGMENT, { uColor: accent, uOff: accent, uLit: { value: 1 } }),
  });
  index.position.set(0, DOOR.dial.y + DOOR.dial.radius + DOOR.index.gap + DOOR.index.height / 2, front + 0.006);
  index.setParent(door);

  const lit = { value: 0 };
  const lamp = new Mesh(gl, {
    geometry: add(new Cylinder(gl, { radiusTop: DOOR.lamp.radius, radiusBottom: DOOR.lamp.radius, height: 0.014, radialSegments: 24 })),
    program: make(SOLID_VERTEX, FLAT_FRAGMENT, { uColor: accent, uOff: lampOff, uLit: lit }),
  });
  lamp.rotation.x = Math.PI / 2;
  lamp.position.set(DOOR.lamp.x, DOOR.lamp.y, front + 0.007);
  lamp.setParent(door);

  const handle = new Transform();
  handle.position.set(0, DOOR.handle.y, front);
  handle.setParent(door);
  const hub = new Mesh(gl, {
    geometry: add(new Cylinder(gl, { radiusTop: DOOR.handle.hub, radiusBottom: DOOR.handle.hub, height: 0.08, radialSegments: 32 })),
    program: make(SOLID_VERTEX, STEEL_FRAGMENT, { uColor: darkSteel, uShine: { value: 40 }, uSpec: { value: 0.6 } }),
  });
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.04;
  hub.setParent(handle);
  const spokeAngles = Array.from({ length: DOOR.handle.spokes }, (_, i) => (90 + (i * 360) / DOOR.handle.spokes) * RAD);
  const spokes = new Mesh(gl, {
    geometry: add(
      instanced(new Box(gl, { width: DOOR.handle.spokeWidth, height: DOOR.handle.spoke, depth: DOOR.handle.spokeWidth }), {
        aAngle: { size: 1, data: spokeAngles },
        aIndex: { size: 1, data: spokeAngles.map((_, i) => i) },
      }),
    ),
    program: make(SPOKE_VERTEX, STEEL_FRAGMENT, {
      uColor: steelColor,
      uShine: { value: 50 },
      uSpec: { value: 0.6 },
      uProgress: { value: 0 },
      uStagger: { value: 0 },
      uCenter: { value: DOOR.handle.spoke / 2 + DOOR.handle.hub * 0.6 },
      uTravel: { value: 0 },
    }),
    frustumCulled: false,
  });
  spokes.position.z = 0.05;
  spokes.setParent(handle);

  let alive = true;
  let baseDistance: number = DOOR_CAMERA.distance;
  let width = 1;
  let height = 1;
  const resize = () => {
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    renderer.dpr = dpr;
    renderer.setSize(width, height);
    canvas.style.width = "";
    canvas.style.height = "";
    const aspect = width / height;
    const halfExtent = DOOR.frameRadius + 0.24;
    const fov = aspect >= 1 ? DOOR_CAMERA.fovDeg : 2 * Math.atan(Math.tan((DOOR_CAMERA.fovDeg * RAD) / 2) / aspect) / RAD;
    const fit = halfExtent / Math.tan((fov * RAD) / 2);
    camera.perspective({ aspect, fov });
    baseDistance = Math.max(DOOR_CAMERA.distance, fit);
  };
  resize();

  const applyPalette = () => {
    palette = readPalette();
    applyLight();
    steelColor.value = palette.steel;
    darkSteel.value = scale(palette.steel, 0.8);
    accent.value = palette.accent;
    lampOff.value = palette.lampOff;
    boltUniforms.uColor.value = palette.steelHi;
    cellUniforms.uPlate.value = palette.plate;
    cellUniforms.uRecess.value = palette.recess;
    cellUniforms.uHi.value = palette.steelHi;
    wall.program.uniforms.uBg.value = palette.bg;
    wall.program.uniforms.uLip.value = mix(palette.plate, palette.steelHi, 0.12);
    tunnel.program.uniforms.uColor.value = palette.plate;
    back.program.uniforms.uColor.value = palette.recess;
    drawDialFace(dialFaceCanvas, palette);
    dialTexture.needsUpdate = true;
  };

  const render = (frame: DoorFrame) => {
    if (!alive) return;
    const p = clamp(frame.progress, 0, 1);
    const rest = 1 - seg(p, [DOOR_TIMELINE.rest[1], 0.2]);
    const swing = inOut(seg(p, DOOR_TIMELINE.swing));
    const dolly = inOut(seg(p, DOOR_TIMELINE.dolly));
    const open = seg(p, DOOR_TIMELINE.dolly);
    exposure.value = 0.2 + 0.8 * std(swing);
    boltUniforms.uProgress.value = seg(p, [DOOR_TIMELINE.bolts[0], DOOR_TIMELINE.bolts[1] - 0.02]);
    handle.rotation.z = -DOOR.handle.turn * RAD * latch(seg(p, [0.42, DOOR_TIMELINE.bolts[1]]));
    lit.value = std(seg(p, [0.46, 0.49]));
    hinge.rotation.y = -DOOR.swing.open * RAD * swing;
    dialPivot.rotation.z = -frame.dial * RAD;

    const pxWorld = (2 * baseDistance * Math.tan((camera.fov * RAD) / 2)) / height;
    door.position.x = -DOOR.hinge.x + frame.pointerX * MOTION_LIMITS.pointerDoor * pxWorld * rest;
    door.position.y = -frame.pointerY * MOTION_LIMITS.pointerDoor * pxWorld * rest;
    parallax.value = [frame.pointerX * 10 * pxWorld * open * 0.4, -frame.pointerY * 10 * pxWorld * open * 0.4];
    light.uKeyDir.value = [KEY_DIR[0] + frame.pointerX * 0.5, KEY_DIR[1] - frame.pointerY * 0.4, KEY_DIR[2]];

    const distance = baseDistance - DOOR_CAMERA.dolly * dolly;
    const yaw = frame.pointerX * DOOR_CAMERA.pointerDeg * RAD;
    const pitch = -frame.pointerY * DOOR_CAMERA.pointerDeg * RAD;
    const target: Vec3Tuple = [0, 0, 0];
    camera.position.set(target[0] + Math.sin(yaw) * distance, target[1] + Math.sin(pitch) * distance, target[2] + Math.cos(yaw) * Math.cos(pitch) * distance);
    camera.lookAt(target);

    gl.clearColor(palette.bg[0], palette.bg[1], palette.bg[2], 1);
    renderer.render({ scene, camera, frustumCull: false, sort: false });
  };

  const corner = new Vec3();
  const coverRect = (index: number): CoverRect | null => {
    const cell = layout[index];
    if (!alive || !cell || cell.cover !== index) return null;
    const z = -DOOR.interior.depth + 0.02;
    const shift = z + 1.3;
    const [px, py] = parallax.value;
    const left = cell.x - cell.w / 2 + CELL_FRAME + px * shift;
    const right = cell.x + cell.w / 2 - CELL_FRAME + px * shift;
    const bottom = cell.y - cell.h / 2 + CELL_FRAME + py * shift;
    const top = cell.y + cell.h / 2 - CELL_FRAME + py * shift;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of [
      [left, bottom],
      [right, bottom],
      [left, top],
      [right, top],
    ]) {
      const [sx, sy] = toScreen(x, y, z);
      minX = Math.min(minX, sx);
      maxX = Math.max(maxX, sx);
      minY = Math.min(minY, sy);
      maxY = Math.max(maxY, sy);
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  };

  const toScreen = (x: number, y: number, z: number): [number, number] => {
    corner.set(x, y, z);
    camera.project(corner);
    return [(corner.x * 0.5 + 0.5) * width, (0.5 - corner.y * 0.5) * height];
  };
  const aperture = (): Aperture => {
    const z = -DOOR.interior.depth + 0.02;
    const [cx, cy] = toScreen(0, 0, z);
    const [ex] = toScreen(DOOR.frameRadius, 0, z);
    return { x: cx, y: cy, r: Math.abs(ex - cx) };
  };

  paintAtlas(atlasCanvas, options.covers, palette, () => alive).then((loaded) => {
    if (!alive || !loaded.some(Boolean)) return;
    atlas.image = atlasCanvas;
    atlas.needsUpdate = true;
    const rects = layout.flatMap((c) => rectFor(c.cover, loaded));
    const attr = cellGeometry.attributes.aRect;
    (attr.data as Float32Array).set(rects);
    attr.needsUpdate = true;
    options.onInvalidate();
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (!alive) return;
      drawDialFace(dialFaceCanvas, palette);
      dialTexture.needsUpdate = true;
      options.onInvalidate();
    });
  }

  const theme = new MutationObserver(() => {
    applyPalette();
    options.onInvalidate();
  });
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const dispose = () => {
    if (!alive) return;
    alive = false;
    theme.disconnect();
    canvas.removeEventListener("webglcontextlost", onLost);
    for (const g of geometries) g.remove();
    for (const p of programs) p.remove();
    for (const t of [atlas, dialTexture]) if (t.texture) gl.deleteTexture(t.texture);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };

  function onLost(event: Event) {
    event.preventDefault();
    dispose();
    options.onLost();
  }
  canvas.addEventListener("webglcontextlost", onLost);

  return {
    render,
    coverRect,
    aperture,
    resize,
    setDpr: (next: number) => {
      dpr = next;
      resize();
    },
    dpr: () => dpr,
    dialAt: dialTarget,
    dispose,
  };
}
