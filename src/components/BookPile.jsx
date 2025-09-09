import React, { useEffect, useRef, useState } from "react";
import {
  Engine,
  World,
  Bodies,
  Runner,
  Body,
  Composite,
  Events,
} from "matter-js";

/**
 * インジケーター追加:
 * - 表面部中央上を 0 とする横軸を表示
 * - 目盛りは左右50px刻み（見やすさのため50px毎にラベル）
 * - 出現レンジ（中心 ±50px）をハイライト
 */

export default function BookPile({ count, pages: pagesProp }) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const runnerRef = useRef(null);

  // ↓左右の当たり判定を決める変数
  const STAGE_W = 920; //ユーザー調整済み。変更するときは伺いを立てること。

  // 外部で調整できる余白（ここを変えれば表示と当たり判定が同時に動く）
  const [inset, setInset] = useState(32);
  // 当たり判定で使う左右境界を保持（afterUpdate から参照）
  const boundaryRef = useRef({ left: 0, right: 0 });

  // 物理本（表面部）
  const bodiesRef = useRef([]); // Matter bodies
  const bookElsRef = useRef([]); // DOM elements mapping to bodies

  // 裏面（3つの塔）
  const bgRef = useRef({
    caps: [16, 16, 16],
    counts: [0, 0, 0],
    // each entry: { w, offset, angle }
    books: [[], [], []],
  });

  // フラグ
  const allowSurfaceSpawnRef = useRef(true); // 表面で出現を続けるか
  const allFullRef = useRef(false); // 全塔満杯で追加停止

  // 表示用 state (線の位置や強制再描画)
  const [lines, setLines] = useState({ left: 0, right: 0 });
  const [, setTick] = useState(0);

  const randRange = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // カラーパレット（白、灰、青、赤、黄） -> 枠線に使う
  const COLORS = ["#ffffff", "#000000ff", "#60a5fa", "#f87171", "#facc15"];
  const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  // 正規化: 8桁 hex や 4桁 shorthand が来ても 6桁不透明 hex にする
  const normalizeHex = (hex) => {
    if (typeof hex !== "string") return hex;
    const h = hex.trim();
    // 8桁 (#RRGGBBAA) -> drop AA
    if (/^#([0-9a-fA-F]{8})$/.test(h)) return "#" + h.slice(1, 7);
    // 4桁 (#RGBA) -> expand to #RRGGBB (drop A)
    if (/^#([0-9a-fA-F]{4})$/.test(h)) {
      const r = h[1],
        g = h[2],
        b = h[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    return h;
  };

  // 本の中身（表面塗り）パレット（#fff1cc, #d9cdab）からランダム
  const INNER_COLORS = ["#ffe9abff", "#d9cdab"];
  const pickInnerColor = () =>
    normalizeHex(INNER_COLORS[Math.floor(Math.random() * INNER_COLORS.length)]);

  const computeSafeCount = (cnt) => {
    if (Array.isArray(cnt)) return cnt.length;
    const n = Number(cnt);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  };

  // 初期化: Matter エンジン、地面、境界線計算、レンダーループ
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || STAGE_W;
    const height = container.clientHeight || 240;

    const stageLeft = width / 2 - STAGE_W / 2;
    const stageRight = width / 2 + STAGE_W / 2;

    // 境界線の内側余白（state の inset を利用）
    const leftBoundary = stageLeft + inset;
    const rightBoundary = stageRight - inset;
    // 表示用 state と当たり判定用 ref を両方更新
    setLines({ left: leftBoundary, right: rightBoundary });
    boundaryRef.current = { left: leftBoundary, right: rightBoundary };

    const engine = Engine.create({ enableSleeping: true });
    engine.world.gravity.y = 1.1;
    engineRef.current = engine;

    const ground = Bodies.rectangle(width / 2, height + 40, width * 2, 80, {
      isStatic: true,
      friction: 1,
      restitution: 0.01,
    });
    ground.label = "ground";
    World.add(engine.world, ground);

    // runner
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // afterUpdate で境界チェック（表面の本が左右境界を越えたら裏面へ移行）
    const afterUpdate = () => {
      const { left: leftBoundaryNow, right: rightBoundaryNow } =
        boundaryRef.current;
      for (let i = bodiesRef.current.length - 1; i >= 0; i--) {
        const body = bodiesRef.current[i];
        if (!body || !body.position) continue;
        const x = body.position.x;
        if (x < leftBoundaryNow || x > rightBoundaryNow) {
          // 1) 表面出現を止めるフラグを立てる（以降は裏面へ積む）
          allowSurfaceSpawnRef.current = false;

          // 2) この本を物理世界から削除し、裏面の塔に移す
          const borderColor = normalizeHex(
            (body.render && body.render.borderColor) || pickColor()
          );
          const innerColor = normalizeHex(
            (body.render && body.render.innerColor) || pickInnerColor()
          );
          try {
            Composite.remove(engine.world, body);
          } catch (e) {}
          bodiesRef.current.splice(i, 1);

          // 隣接する DOM を非表示にする（ある場合）
          const el = bookElsRef.current[i];
          if (el) {
            el.style.display = "none";
            bookElsRef.current[i] = null;
          }

          // 幅情報があれば、それを塔に渡す（なければランダム）
          const w =
            (body.render && body.render.w) || Math.floor(randRange(80, 160));
          moveToTower(w, borderColor, innerColor);
        }
      }
    };

    Events.on(engine, "afterUpdate", afterUpdate);

    // RAF で DOM を各 body に同期
    let rafId = 0;
    const syncLoop = () => {
      try {
        for (let i = 0; i < bodiesRef.current.length; i++) {
          const b = bodiesRef.current[i];
          const el = bookElsRef.current[i];
          if (!b || !el) continue;
          el.style.left = `${b.position.x}px`;
          el.style.top = `${b.position.y}px`;
          el.style.width = `${b.render?.w || 100}px`;
          el.style.height = `${b.render?.h || 12}px`;
          el.style.transform = `translate(-50%, -50%) rotate(${b.angle}rad)`;
        }
      } catch (e) {}
      rafId = requestAnimationFrame(syncLoop);
    };
    rafId = requestAnimationFrame(syncLoop);

    return () => {
      cancelAnimationFrame(rafId);
      Events.off(engine, "afterUpdate", afterUpdate);
      Runner.stop(runner);
      World.clear(engine.world, false);
      Engine.clear(engine);
      engineRef.current = null;
      runnerRef.current = null;
      bodiesRef.current = [];
      bookElsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // タワーへ移動（裏面）
  const moveToTower = (w, borderColor, innerColor) => {
    const bg = bgRef.current;
    const available = [0, 1, 2].filter((i) => bg.counts[i] < bg.caps[i]);
    if (available.length === 0) {
      allFullRef.current = true;
      allowSurfaceSpawnRef.current = false;
      return false;
    }
    const idx = available[Math.floor(Math.random() * available.length)];
    bg.counts[idx] += 1;

    // 各冊に少しずつ揺らぎを追加して自然な積み方に（回転は与えない）
    const offset = Math.round(randRange(-12, 12)); // px
    const angle = 0; // 回転不要のため 0 に固定
    // 枠線色・中身色を受け取れるように変更（無ければランダム）
    const bColor =
      typeof borderColor !== "undefined"
        ? normalizeHex(borderColor)
        : pickColor();
    const iColor =
      typeof innerColor !== "undefined"
        ? normalizeHex(innerColor)
        : pickInnerColor();
    bg.books[idx].push({
      w: clamp(Math.floor(w), 80, 160),
      offset,
      angle,
      borderColor: bColor,
      innerColor: iColor,
    });
    setTick((t) => t + 1);
    if (bg.counts.every((c, i) => c >= bg.caps[i])) {
      allFullRef.current = true;
      allowSurfaceSpawnRef.current = false;
    }
    return true;
  };

  // 表面に本を生成（物理ボディ）
  const spawnSurfaceBook = (w) => {
    const engine = engineRef.current;
    if (!engine) return null;
    const world = engine.world;
    const container = containerRef.current;
    if (!container) return null;

    const width = container.clientWidth || STAGE_W;
    // 中央上の出現ポイント（center ±50px）、中央(0)に戻すためシフトは 0
    const centerX = width / 2;
    const SPAWN_SHIFT_X = 0; // ユーザーによる手動の調整。変更する場合は伺いを立てること。
    const spawnX = centerX + randRange(-50, 50) + SPAWN_SHIFT_X;
    const spawnY = -40 - Math.random() * 80;

    const body = Bodies.rectangle(spawnX, spawnY, w, 12, {
      angle: (Math.random() - 0.5) * 0.2,
      friction: 0.2,
      frictionStatic: 0.2,
      frictionAir: 0.03,
      restitution: 0.02,
      density: 0.002 + Math.random() * 0.001,
      slop: 0.01,
    });
    body.label = "book";
    try {
      Body.setInertia(body, body.mass * 10000);
    } catch (e) {}
    body.sleepThreshold = 60;
    // 枠線色と中身色を持たせる（枠線は既存パレット、中身は指定の3色から）
    body.render = {
      w,
      h: 12,
      borderColor: pickColor(),
      innerColor: pickInnerColor(),
    };

    bodiesRef.current.push(body);
    World.add(world, body);

    // ensure a placeholder DOM entry exists (rendered list expects indexes)
    // actual DOM node is created in JSX ref callback
    return body;
  };

  // safe count と現在合計（表面 + 裏面）
  const safeCount = computeSafeCount(count);
  const bgTotal = () => bgRef.current.counts.reduce((a, b) => a + b, 0);
  const totalCurrent = () => bodiesRef.current.length + bgTotal();

  // count の増減に応じて追加/削除
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    // 少し遅延させてアニメーションを安定化
    // 初期表示時は遅延を短くする
    const delay = totalCurrent() === 0 ? 10 : 50;
    const timer = setTimeout(() => {
      // 現在合計と目標差分
      let currentTotal = totalCurrent();
      if (safeCount > currentTotal) {
        let toAdd = safeCount - currentTotal;
        // 1 tick での追加上限（大量追加で固まるのを防ぐ）
        // 初期表示時は制限を緩和
        const MAX_ADD_PER_RUN = currentTotal === 0 ? 20 : 6;
        toAdd = Math.min(toAdd, MAX_ADD_PER_RUN);

        for (let i = 0; i < toAdd; i++) {
          if (allFullRef.current) break;
          if (allowSurfaceSpawnRef.current) {
            // 表面に出す
            const w = Math.floor(randRange(80, 160));
            spawnSurfaceBook(w);
          } else {
            // 裏面に積む（直接）
            const w = Math.floor(randRange(80, 160));
            const ok = moveToTower(w);
            if (!ok) break;
          }
        }
        setTick((t) => t + 1);
      } else if (safeCount < totalCurrent()) {
        // 減らす: まず表面(body) を削除、それでも足りなければ裏面から減らす（LIFO）
        let needRemove = totalCurrent() - safeCount;
        while (needRemove > 0 && bodiesRef.current.length > 0) {
          const b = bodiesRef.current.pop();
          if (b) {
            try {
              Composite.remove(engine.world, b);
            } catch (e) {}
          }
          // hide DOM if exists
          if (bookElsRef.current.length > 0) {
            const el = bookElsRef.current.pop();
            if (el) el.style.display = "none";
          }
          needRemove--;
        }
        // 裏面から減らす（後ろに積んだものから削る）
        const bg = bgRef.current;
        while (needRemove > 0 && bg.counts.some((c) => c > 0)) {
          // find a tower with >0, prefer the last filled (simple strategy)
          let idx = [0, 1, 2].reverse().find((i) => bg.counts[i] > 0);
          if (typeof idx === "undefined") break;
          bg.counts[idx] -= 1;
          bg.books[idx].pop();
          needRemove--;
          setTick((t) => t + 1);
        }
        // If we removed some, ensure allowSurfaceSpawn may be re-enabled only if not allFull
        if (!bg.counts.every((c, i) => c >= bg.caps[i])) {
          allFullRef.current = false;
        }
      }
    }, delay); // 動的遅延

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCount]);

  // 表示用データ
  const bg = bgRef.current;
  const towerOffsets = [-180, 0, 180];
  const displaySurfaceCount = Math.min(200, bodiesRef.current.length);

  // インジケーター用目盛り配列（中心を0として左右に50px刻み）
  const half = Math.floor(STAGE_W / 2);
  const tickStep = 50;
  const ticks = [];
  for (let x = -half; x <= half; x += tickStep) ticks.push(x);

  return (
    <div
      ref={containerRef}
      className="relative h-56 md:h-64 rounded-2xl border overflow-hidden"
      style={{
        borderColor: "#d1d5db",
        backgroundColor: "#fef3c7",
        boxShadow: "0 8px 25px -5px rgba(0,0,0,0.1)",
      }}
    >
      {/* インジケーター（表面部中央上を 0 とした軸、目盛り、出現範囲ハイライト） */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 6,
          transform: "translateX(-50%)",
          width: `${STAGE_W}px`,
          height: 36,
          pointerEvents: "none",
          zIndex: 5,
          fontSize: 11,
          color: "#374151",
          display: "none", // ← 非表示化
        }}
      >
        {/* 軸線 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 1,
            background: "rgba(55,65,81,0.12)",
          }}
        />

        {/* 出現範囲ハイライト (中心 ±50px) */}
        <div
          style={{
            position: "absolute",
            left: `calc(50% - 50px)`,
            top: "6px",
            width: "100px",
            height: "24px",
            background: "rgba(34,197,94,0.06)",
            border: "1px dashed rgba(34,197,94,0.16)",
            transform: "translateX(0)",
            borderRadius: 4,
          }}
        />

        {/* 中心 0 ラベル */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -12,
            transform: "translateX(-50%)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          0
        </div>

        {/* 目盛りとラベル */}
        {ticks.map((t) => (
          <div
            key={t}
            style={{
              position: "absolute",
              left: `calc(50% + ${t}px)`,
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              style={{
                width: 2,
                height: 10,
                background: "rgba(55,65,81,0.18)",
                margin: "0 auto",
              }}
            />
            <div
              style={{
                marginTop: 2,
                textAlign: "center",
                fontSize: 10,
                color: "rgba(55,65,81,0.6)",
              }}
            >
              {t}
            </div>
          </div>
        ))}
      </div>

      {/* 裏面（後部レイヤー） */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full flex items-end justify-center">
          <div
            className="relative"
            style={{ width: STAGE_W + "px", maxWidth: "95%", height: "220px" }}
          >
            {[0, 1, 2].map((ti) => {
              const leftCalc = `calc(50% + ${towerOffsets[ti]}px)`;
              const cap = bg.caps[ti];
              const cnt = bg.counts[ti];
              return (
                <div
                  key={ti}
                  style={{
                    position: "absolute",
                    left: leftCalc,
                    bottom: 0,
                    transform: "translateX(-50%)",
                  }}
                >
                  {Array.from({ length: cnt }).map((_, j) => {
                    const book = bg.books[ti][j] || {};
                    const w = book.w || 100;
                    const offset =
                      typeof book.offset === "number"
                        ? book.offset
                        : Math.round(randRange(-8, 8));
                    const angle =
                      typeof book.angle === "number" ? book.angle : 0; // 回転は基本 0
                    return (
                      <div
                        key={j}
                        className="absolute origin-center rounded-md shadow-xl"
                        style={{
                          width: `${w}px`,
                          height: "12px",
                          position: "absolute",
                          bottom: `${j * 12}px`,
                          left: "50%",
                          // translateX(-50%) に加え offset を与えて自然なズレを表現（回転は無し）
                          transform: `translateX(calc(-50% + ${offset}px)) rotate(${angle}deg)`,
                          borderRadius: "4px",
                          backgroundColor: book.innerColor || "#d1d5db", // 中身色を反映
                          boxShadow: "0 16px 30px -12px rgba(0,0,0,0.18)",
                          border: `2px solid ${
                            book.borderColor || "rgba(0,0,0,0.06)"
                          }`, // 太めの枠線（パレット色）
                          zIndex: 2,
                        }}
                      >
                        <div
                          className="h-full w-2"
                          style={{ backgroundColor: "rgba(156,163,175,0.7)" }}
                        />
                      </div>
                    );
                  })}
                  <div
                    style={{
                      position: "absolute",
                      bottom: `${cnt * 12 + 6}px`,
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: 10,
                      color: "#6b7280",
                      display: "none",
                    }}
                  >
                    {cnt}/{cap} {/* ← カウント表示を非表示化 */}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 地面のハイライト */}
      <div
        className="absolute bottom-2 left-0 right-0 h-3"
        style={{ backgroundColor: "rgba(209,213,219,0.4)", zIndex: 5 }}
      />

      {/* 表面（前部レイヤー）: 物理ボディに対応する DOM をここで配置 */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full flex items-end justify-center"
        style={{ zIndex: 5 }}
      >
        <div
          className="relative"
          style={{ width: STAGE_W + "px", maxWidth: "95%", height: "220px" }}
        >
          {Array.from({ length: displaySurfaceCount }).map((_, i) => {
            // 既にボディがある場合は body.render.w を参照して幅決定
            const body = bodiesRef.current[i];
            const baseW =
              (body && body.render && body.render.w) ||
              Math.max(80, Math.min(160, 80 + (i % 5) * 12));
            return (
              <div
                key={i}
                ref={(el) => {
                  bookElsRef.current[i] = el;
                  // DOM と body の色を同期（body があればその色を適用）
                  if (el) {
                    const bColor =
                      body && body.render && body.render.borderColor;
                    const iColor =
                      body && body.render && body.render.innerColor;
                    if (iColor) el.style.backgroundColor = iColor;
                    if (bColor) el.style.border = `2px solid ${bColor}`;
                  }
                }}
                className="absolute origin-center rounded-md shadow-xl"
                style={{
                  width: baseW + "px",
                  height: "12px",
                  left: "50%",
                  top: "-100px",
                  transform: `translate(-50%, -50%)`,
                  backgroundColor:
                    (body && body.render && body.render.innerColor) ||
                    "#d1d5db",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                  border: `2px solid ${
                    (body && body.render && body.render.borderColor) ||
                    "rgba(0,0,0,0.06)"
                  }`, // 枠線を太くしてパレット色を適用
                  zIndex: 6,
                }}
              >
                <div
                  className="h-full w-2"
                  style={{ backgroundColor: "rgba(156,163,175,0.7)" }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 未読カウント / ステータス */}
      {safeCount === 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm gap-2"
          style={{ color: "#6b7280", zIndex: 5 }}
        >
          <span className="text-2xl">📚</span>スッキリ！未読なし
        </div>
      )}

      <div
        className="absolute top-2 left-4 text-xs flex items-center gap-2"
        style={{ color: "#6b7280", zIndex: 5 }}
      >
        <span className="text-lg">📚</span>未読 {safeCount} 冊
      </div>

      {/* 境界線（赤線） */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 5,
          display: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${lines.left}px`,
            top: 0,
            bottom: 0,
            width: "2px",
            background: "rgba(255,0,0,0.25)",
            transform: `translateX(-50%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${lines.right}px`,
            top: 0,
            bottom: 0,
            width: "2px",
            background: "rgba(255,0,0,0.25)",
            transform: `translateX(-50%)`,
          }}
        />
      </div>
    </div>
  );
}
