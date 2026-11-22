"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Заставка при кожному запуску: 3D-логотип зі скла (напівпрозорий матовий смарагд) робить один оберт навколо осі,
// після чого екран розчиняється й відкривається онбординг або каталог.
// Форму беремо з public/brand/sign.svg (кожна смужка логотипа видавлюється в обʼєм зі скошеними краями).
// Торкання екрана пропускає заставку.

const CREAM = 0xf4f1eb;
const SPIN_START = 0.25; // с: коли починається оберт
const SPIN_END = 2.65; // с: коли оберт закінчується
const FADE_AT = 3.0; // с: коли екран починає розчинятися
const END_AT = 3.5; // с: заставка закінчилась
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeOut = (p) => 1 - Math.pow(1 - p, 3);

export default function Splash({ onDone }) {
  const box = useRef(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let dead = false;
    let raf = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      done.current?.();
    };

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      finish(); // без WebGL просто пропускаємо заставку
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(CREAM, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;";
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(20, 1, 10, 6000);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    // світло: м'яке з боків і одне «лампове» зліва зверху, яке дає на матовому склі плавний градієнт і блік
    const key = new THREE.DirectionalLight(0xffffff, 0.6);
    key.position.set(-60, 80, 90);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfffe0, 0.6);
    rim.position.set(70, -20, -60);
    scene.add(rim);
    const lamp = new THREE.PointLight(0xaaffd8, 11000, 0, 2);
    lamp.position.set(-35, 40, 45);
    scene.add(lamp);

    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x03402a),
      metalness: 0,
      roughness: 0.6, // матовість: розсіює те, що видно крізь скло
      transmission: 0.2, // напівпрозорість
      thickness: 5,
      ior: 1.5,
      attenuationColor: new THREE.Color(0x02261a),
      attenuationDistance: 2.5,
      specularIntensity: 0.5,
      envMapIntensity: 0.35,
    });

    // Світіння країв: де поверхня дивиться «ребром» до глядача (скоси), додаємо світло-смарагдовий відблиск, як у матового скла
    const glow = { color: { value: new THREE.Color(0x1fae76) }, power: { value: 2.2 }, amount: { value: 0.4 } };
    material.onBeforeCompile = (shader) => {
      shader.uniforms.glowColor = glow.color;
      shader.uniforms.glowPower = glow.power;
      shader.uniforms.glowAmount = glow.amount;
      shader.fragmentShader = shader.fragmentShader
        .replace("void main() {", "uniform vec3 glowColor;\nuniform float glowPower;\nuniform float glowAmount;\nvoid main() {")
        .replace(
          "#include <opaque_fragment>",
          `float fres = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), glowPower);
           outgoingLight += glowColor * fres * glowAmount;
           #include <opaque_fragment>`,
        );
    };

    const pivot = new THREE.Group(); // обертається навколо вертикальної осі
    scene.add(pivot);
    const geos = [];
    let size = { w: 110, h: 110 };

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      // логотип займає ~50% ширини екрана
      const distW = size.w / 2 / 0.47 / (t * camera.aspect);
      const distH = size.h / 2 / 0.5 / t;
      camera.position.set(0, 0, Math.max(distW, distH));
      camera.updateProjectionMatrix();
    };

    let start = 0;
    let ready = false;
    let skipShift = 0;

    fetch("/brand/sign.svg")
      .then((r) => r.text())
      .then((text) => {
        if (dead) return;
        const data = new SVGLoader().parse(text);
        const group = new THREE.Group();
        for (const path of data.paths) {
          const shapes = SVGLoader.createShapes(path);
          const geo = new THREE.ExtrudeGeometry(shapes, {
            depth: 5,
            curveSegments: 14,
            bevelEnabled: true,
            bevelThickness: 0.9,
            bevelSize: 0.55,
            bevelOffset: -0.55,
            bevelSegments: 5,
          });
          geo.rotateX(Math.PI); // у SVG вісь Y йде вниз
          geos.push(geo);
          group.add(new THREE.Mesh(geo, material));
        }
        const bb = new THREE.Box3().setFromObject(group);
        const c = bb.getCenter(new THREE.Vector3());
        group.position.set(-c.x, -c.y, -c.z);
        size = { w: bb.max.x - bb.min.x, h: bb.max.y - bb.min.y };
        pivot.add(group);
        resize();
        ready = true;
        start = performance.now();
        loop();
      })
      .catch(finish);

    const loop = () => {
      if (dead) return;
      const t = (performance.now() - start) / 1000 + skipShift;
      const fadeIn = Math.min(1, t / 0.5);
      canvas.style.opacity = String(easeOut(fadeIn));

      if (reduce) {
        pivot.rotation.set(0, 0, 0);
      } else {
        const p = Math.min(1, Math.max(0, (t - SPIN_START) / (SPIN_END - SPIN_START)));
        const spin = easeInOut(p) * Math.PI * 2;
        pivot.rotation.y = spin;
        pivot.rotation.x = Math.sin(Math.min(t, SPIN_END) * 1.6) * 0.07;
      }
      const grow = 0.9 + 0.1 * easeOut(fadeIn) + (t > FADE_AT ? 0.06 * Math.min(1, (t - FADE_AT) / (END_AT - FADE_AT)) : 0);
      pivot.scale.setScalar(grow);

      {
        const fo = Math.min(1, Math.max(0, (t - FADE_AT) / (END_AT - FADE_AT)));
        el.style.opacity = String(1 - easeInOut(fo));
        if (t >= END_AT) {
          renderer.render(scene, camera);
          finish();
          return;
        }
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(() => ready && resize());
    ro.observe(el);

    // торкання пропускає оберт: одразу переходимо до розчинення
    const skip = () => {
      if (!ready) return;
      const t = (performance.now() - start) / 1000 + skipShift;
      if (t < FADE_AT) skipShift += FADE_AT - t;
    };
    el.addEventListener("pointerdown", skip);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", skip);
      geos.forEach((g) => g.dispose());
      material.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={box}
      role="img"
      aria-label="Meadow Flowers"
      className="absolute inset-0 z-[60] bg-cream"
      style={{ touchAction: "manipulation" }}
    />
  );
}
