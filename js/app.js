/* ============================================================
   읽기 규칙
   - 시는 고유어 숫자 (한, 두, 세 …)
     하나·둘·셋·넷·열하나·열둘은 시 앞에서 한·두·세·네·열한·열두로 짧아진다
   - 분은 한자어 숫자 (일, 이, 삼 …)
   - 30분은 ‘반’이라고도 한다
   ============================================================ */
const SINO = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const NATIVE = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];
const NATIVE_TENS = ["", "열", "스물", "서른", "마흔", "쉰"];
// 시 앞에서 짧아지는 꼴. 1~4 와 11·12 만 다르다
const HOUR_WORD = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "열한", "열두"];

function sino(n) {
  if (n === 0) return "영";
  const tens = Math.floor(n / 10),
    ones = n % 10;
  return (tens ? (tens === 1 ? "" : SINO[tens]) + "십" : "") + SINO[ones];
}
const native = (n) => NATIVE_TENS[Math.floor(n / 10)] + NATIVE[n % 10];
// 받침이 있으면 a(은·이), 없으면 b(는·가)
const josa = (w, a, b) => w + ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? a : b);

const readHour = (h) => HOUR_WORD[h] + " 시";
const readMin = (m) => sino(m) + " 분";
const contracted = (h) => HOUR_WORD[h] !== native(h); // 하나 → 한 처럼 짧아졌는지
const readTime = (h, m) => (m ? `${readHour(h)} ${readMin(m)}` : readHour(h));

/* ---------- 음성 (브라우저 TTS) ---------- */
const canSpeak = "speechSynthesis" in window;
function speak(text) {
  if (!canSpeak) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.8;
  const voice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith("ko"));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}
if (canSpeak) speechSynthesis.getVoices();

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");

/* ============================================================
   시계판

   viewBox 300×300, 가운데 (150,150).
   바늘은 12시 방향으로 그린 뒤 <g> 를 통째로 돌린다.
   ============================================================ */
const C = 150;
const HOUR_LEN = 64,
  MIN_LEN = 104;
const polar = (r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

function drawFace(svg, { knobs }) {
  let s = `<circle class="rim" cx="150" cy="150" r="142"/>`;
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0;
    const [x1, y1] = polar(big ? 128 : 133, i * 6);
    const [x2, y2] = polar(139, i * 6);
    s += `<line class="${big ? "tick big" : "tick"}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  // 분 숫자는 바깥쪽에 작게, 시 숫자는 안쪽에 크게
  for (let i = 1; i <= 12; i++) {
    const [mx, my] = polar(116, i * 30);
    s += `<text class="min-num" x="${mx}" y="${my}">${pad((i * 5) % 60)}</text>`;
    const [hx, hy] = polar(90, i * 30);
    s += `<text class="hour-num" x="${hx}" y="${hy}">${i}</text>`;
  }
  // 바늘(줄기)은 통째로 돌리고, 손잡이는 끝자리로 옮기기만 한다.
  // 손잡이까지 돌리면 "분" 글자가 거꾸로 서서 "곰"처럼 보인다.
  const hand = (kind, len) => `
    <g class="hand hand-${kind}" data-hand="${kind}">
      <line class="hit" x1="150" y1="150" x2="150" y2="${C - len}"/>
      <line class="stem" x1="150" y1="${C + 14}" x2="150" y2="${C - len}"/>
    </g>`;
  const knob = (kind, label, aria) => `
    <g class="knob-g knob-${kind}" data-hand="${kind}" tabindex="0" role="slider" aria-label="${aria}">
      <circle class="knob" cx="0" cy="0" r="15"/><text class="knob-text" x="0" y="0">${label}</text>
    </g>`;
  s += hand("hour", HOUR_LEN) + hand("min", MIN_LEN);
  s += `<circle class="cap" cx="150" cy="150" r="7"/>`;
  if (knobs) s += knob("hour", "시", "시침 / Hour hand") + knob("min", "분", "분침 / Minute hand");
  svg.innerHTML = s;
}

function setHands(svg, h, m) {
  const hourDeg = ((h % 12) + m / 60) * 30;
  svg.querySelector(".hand-hour").setAttribute("transform", `rotate(${hourDeg} 150 150)`);
  svg.querySelector(".hand-min").setAttribute("transform", `rotate(${m * 6} 150 150)`);
  const kh = svg.querySelector(".knob-hour"),
    km = svg.querySelector(".knob-min");
  if (kh) kh.setAttribute("transform", `translate(${polar(HOUR_LEN, hourDeg).join(" ")})`);
  if (km) km.setAttribute("transform", `translate(${polar(MIN_LEN, m * 6).join(" ")})`);
}

/* ============================================================
   시계 탭

   시각은 자정부터 센 분(0~1439) 하나로 들고 있다.
   분침이 12를 넘어가면 시가 바뀌고, 11시 → 12시를 넘으면 오전·오후가 바뀐다.
   ============================================================ */
let t = 15 * 60 + 30; // 처음 화면은 오후 세 시 삼십 분

const parts = () => {
  const h24 = Math.floor(t / 60);
  return { h: h24 % 12 || 12, m: t % 60, pm: h24 >= 12 };
};
const wrapDay = (n) => ((n % 1440) + 1440) % 1440;

const face = $("face");
drawFace(face, { knobs: true });

function render() {
  const { h, m, pm } = parts();
  setHands(face, h, m);
  $("amBtn").setAttribute("aria-checked", !pm);
  $("pmBtn").setAttribute("aria-checked", pm);

  const ampm = pm ? "오후" : "오전";
  const sentence = `${ampm} ${readTime(h, m)}`;
  face.querySelector(".knob-hour").setAttribute("aria-valuetext", readHour(h));
  face.querySelector(".knob-min").setAttribute("aria-valuetext", readMin(m));

  const notes = [];
  if (contracted(h))
    notes.push([
      `${native(h)} + 시 → ${readHour(h)}`,
      `${native(h)} gets shorter before 시: ${HOUR_WORD[h]}.`,
      "hour",
    ]);
  if (m === 30) notes.push([`${readHour(h)} 반이라고도 해요.`, "You can also say 반 — half past.", "min"]);

  $("reading").innerHTML = `
    <div class="digits">${ampm} ${h}:${pad(m)}</div>
    <div class="segments">
      <div class="seg seg-ampm"><small>${pm ? "PM" : "AM"}</small><span>${ampm}</span></div>
      <div class="seg seg-hour"><small>${h}시 · 고유어</small><span>${readHour(h)}</span><em>Native Korean</em></div>
      ${
        m
          ? `<div class="seg seg-min"><small>${m}분 · 한자어</small><span>${readMin(m)}</span><em>Sino-Korean</em></div>`
          : `<div class="seg seg-sharp"><small>${m}분</small><span>정각</span><em>o’clock</em></div>`
      }
    </div>
    <p class="panel-en">${h}:${pad(m)} ${pm ? "PM" : "AM"}${m ? "" : " · o’clock"}</p>
    ${notes.map((n) => `<div class="note note-${n[2]}"><span class="ko">✨ ${n[0]}</span><span class="en">${n[1]}</span></div>`).join("")}
    ${
      canSpeak
        ? `<button class="btn" id="speakBtn" type="button"><span class="ko">🔊 들어 보기</span><span class="en">Listen</span></button>`
        : ""
    }
    <button class="btn ghost" id="nowBtn" type="button"><span class="ko">지금 몇 시예요?</span><span class="en">Set to the current time</span></button>`;

  if (canSpeak) $("speakBtn").addEventListener("click", () => speak(sentence));
  $("nowBtn").addEventListener("click", () => {
    const d = new Date();
    t = d.getHours() * 60 + d.getMinutes();
    render();
  });
}

// 분침: 바뀐 만큼만 더한다. 12를 넘을 때 시가 따라 넘어가도록
function setMinute(newM) {
  let d = newM - (t % 60);
  if (d > 30) d -= 60;
  if (d < -30) d += 60;
  t = wrapDay(t + d);
}
// 시침: 분은 그대로 두고 시만 바꾼다. 11 ↔ 12 를 넘으면 오전·오후가 뒤집힌다
function setHourIdx(idx) {
  const h24 = Math.floor(t / 60);
  let d = idx - (h24 % 12);
  if (d > 6) d -= 12;
  if (d < -6) d += 12;
  t = wrapDay(t + d * 60);
}

function svgAngle(e) {
  const pt = face.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(face.getScreenCTM().inverse());
  const deg = (Math.atan2(p.x - C, -(p.y - C)) * 180) / Math.PI;
  return { deg: (deg + 360) % 360, dist: Math.hypot(p.x - C, p.y - C) };
}

let dragging = null;
face.addEventListener("pointerdown", (e) => {
  const handEl = e.target.closest("[data-hand]");
  const { dist } = svgAngle(e);
  // 바늘을 정확히 못 잡아도, 가운데 가까우면 시침·바깥이면 분침
  dragging = handEl ? handEl.dataset.hand : dist < 78 ? "hour" : "min";
  face.setPointerCapture(e.pointerId);
  face.classList.add("dragging");
  face.querySelector(".knob-" + dragging).classList.add("active");
  moveTo(e);
  e.preventDefault();
});
face.addEventListener("pointermove", (e) => dragging && moveTo(e));
function endDrag() {
  if (!dragging) return;
  face.querySelector(".knob-" + dragging).classList.remove("active");
  face.classList.remove("dragging");
  dragging = null;
}
face.addEventListener("pointerup", endDrag);
face.addEventListener("pointercancel", endDrag);

function moveTo(e) {
  const { deg } = svgAngle(e);
  if (dragging === "min") setMinute(Math.round(deg / 6) % 60);
  else {
    const m = t % 60;
    setHourIdx((Math.round(deg / 30 - m / 60) + 12) % 12);
  }
  render();
}

// 키보드: 화살표로 바늘 하나씩. Shift 를 누르면 5분씩
face.addEventListener("keydown", (e) => {
  const handEl = e.target.closest("[data-hand]");
  if (!handEl) return;
  const dir = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
  if (!dir) return;
  e.preventDefault();
  t = wrapDay(t + dir * (handEl.dataset.hand === "hour" ? 60 : e.shiftKey ? 5 : 1));
  render();
});

document.querySelector(".steps").addEventListener("click", (e) => {
  const b = e.target.closest(".step");
  if (!b) return;
  t = wrapDay(t + +b.dataset.step);
  render();
});
$("amBtn").addEventListener("click", () => {
  if (parts().pm) t = wrapDay(t - 720);
  render();
});
$("pmBtn").addEventListener("click", () => {
  if (!parts().pm) t = wrapDay(t + 720);
  render();
});

/* ============================================================
   읽는 법 탭
   ============================================================ */
$("hourList").innerHTML = Array.from({ length: 12 }, (_, i) => i + 1)
  .map(
    (h) => `
  <li><button class="row row-hour" type="button" data-say="${readHour(h)}">
    <span class="num">${h}시</span>
    <span class="word">${readHour(h)}</span>
    ${contracted(h) ? `<span class="base">${native(h)} → ${HOUR_WORD[h]}</span>` : ""}
  </button></li>`,
  )
  .join("");

$("minList").innerHTML = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
  .map(
    (m) => `
  <li><button class="row row-min" type="button" data-say="${readMin(m)}">
    <span class="num">${m}분</span>
    <span class="word">${readMin(m)}</span>
  </button></li>`,
  )
  .join("");

$("ruleView").addEventListener("click", (e) => {
  const row = e.target.closest(".row");
  if (row) speak(row.dataset.say);
});

/* ============================================================
   퀴즈

   오답은 학생들이 실제로 하는 실수로 만든다.
   틀린 보기를 고르면 왜 틀렸는지 그 실수에 맞춰 알려 준다.
   ============================================================ */
const QUIZ_LEN = 10;
const qFace = $("qFace");
drawFace(qFace, { knobs: false });

let quiz = {};
const rand = (n) => Math.floor(Math.random() * n);
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wrongOptions(h, m) {
  const min = readMin(m);
  // 핵심 두 가지는 매번 넣는다: 시를 한자어로, 분을 고유어로
  const core = [
    {
      text: `${sino(h)} 시 ${min}`,
      why: [`시는 고유어로 읽어요. ${sino(h)} 시가 아니라 ${readHour(h)}!`, "Hours use native Korean numbers: 한, 두, 세…"],
    },
    {
      text: `${readHour(h)} ${native(m)} 분`,
      why: [`분은 한자어로 읽어요. ${native(m)} 분이 아니라 ${min}!`, "Minutes use Sino-Korean numbers: 일, 이, 삼…"],
    },
  ];
  const extra = [];
  if (contracted(h))
    extra.push({
      text: `${native(h)} 시 ${min}`,
      why: [`${josa(native(h), "은", "는")} 시 앞에서 ${josa(HOUR_WORD[h], "이", "가")} 돼요.`,`${native(h)} becomes ${HOUR_WORD[h]} before 시.`],
    });
  // 바늘을 바꿔 읽음: 긴 바늘을 시로, 짧은 바늘을 분으로
  const sh = m / 5 || 12,
    sm = (h % 12) * 5;
  if (!(sh === h && sm === m))
    extra.push({
      text: readTime(sh, sm),
      why: ["짧은 바늘이 시, 긴 바늘이 분이에요.", "The short hand is the hour, the long hand is the minutes."],
    });
  // 40분이 넘으면 시침이 다음 숫자에 가까워서 한 시간 앞서 읽기 쉽다
  if (m >= 40)
    extra.push({
      text: `${readHour((h % 12) + 1)} ${min}`,
      why: [
        `짧은 바늘이 아직 ${(h % 12) + 1}에 닿지 않았어요.`,
        `The hour hand hasn't reached ${(h % 12) + 1} yet.`,
      ],
    });
  return [...core, shuffle(extra)[0]].filter(Boolean);
}

function newQuestion() {
  let h, m;
  do {
    h = rand(12) + 1;
    m = (rand(11) + 1) * 5; // 5분 ~ 55분
  } while (quiz.seen.includes(`${h}:${m}`));
  quiz.seen.push(`${h}:${m}`);

  const answer = readTime(h, m);
  const opts = [{ text: answer }, ...wrongOptions(h, m)];
  quiz.h = h;
  quiz.m = m;
  quiz.answer = answer;
  quiz.opts = opts;

  setHands(qFace, h, m);
  qFace.setAttribute("aria-label", "시계 / Clock");
  $("opts").innerHTML = shuffle(opts)
    .map((o) => `<button class="opt" type="button">${o.text}</button>`)
    .join("");
  $("feedback").innerHTML = "";
  $("qNext").hidden = true;
  $("qSpeak").hidden = true;
  $("qNum").textContent = `${quiz.total + 1} / ${QUIZ_LEN}`;
  $("scoreText").textContent = quiz.right;
}

function startQuiz() {
  quiz = { right: 0, total: 0, seen: [], missed: [] };
  $("qNextKo").textContent = "다음 문제";
  $("qNextEn").textContent = "Next question";
  $("qResult").hidden = true;
  $("qPlay").hidden = false;
  newQuestion();
}

$("opts").addEventListener("click", (e) => {
  const btn = e.target.closest(".opt");
  if (!btn || btn.disabled) return;
  const picked = quiz.opts.find((o) => o.text === btn.textContent);
  const correct = picked.text === quiz.answer;
  quiz.total++;
  if (correct) quiz.right++;
  else quiz.missed.push({ time: `${quiz.h}:${pad(quiz.m)}`, answer: quiz.answer });

  document.querySelectorAll(".opt").forEach((o) => {
    o.disabled = true;
    if (o.textContent === quiz.answer) {
      o.classList.add("right");
      o.insertAdjacentHTML("afterbegin", `<span class="mark" aria-hidden="true">✓ </span>`);
    }
  });
  if (!correct) {
    btn.classList.add("wrong");
    btn.insertAdjacentHTML("afterbegin", `<span class="mark" aria-hidden="true">✗ </span>`);
  }

  $("feedback").innerHTML = correct
    ? `<span class="ko">맞아요! 🎉 ${quiz.h}:${pad(quiz.m)}</span><span class="en">Correct!</span>`
    : `<span class="ko">아쉬워요! 정답은 ‘${quiz.answer}’예요.</span><span class="en">Not quite — the answer is ‘${quiz.answer}’.</span>
       <span class="why">${picked.why[0]}</span><span class="en">${picked.why[1]}</span>`;
  $("scoreText").textContent = quiz.right;
  if (quiz.total >= QUIZ_LEN) {
    $("qNextKo").textContent = "결과 보기";
    $("qNextEn").textContent = "See results";
  }
  $("qNext").hidden = false;
  $("qSpeak").hidden = !canSpeak;
  $("qNext").focus();
});

function showResult() {
  const { right } = quiz;
  const [mood, ...msg] =
    right === QUIZ_LEN
      ? ["yay", "완벽해요! 🎉", "Perfect score!"]
      : right >= 7
        ? ["proud", "잘했어요! 👏", "Great job!"]
        : right >= 4
          ? ["focus", "좋아요, 조금만 더! 💪", "Good, keep practicing!"]
          : ["huh", "다시 한번 해 봐요! 🌱", "Let’s try again!"];
  const missed = quiz.missed.length
    ? `<p class="missed-title">틀린 문제 다시 보기 · Review</p>
       <ul class="missed">${quiz.missed.map((q) => `<li><span>${q.time}</span><b>${q.answer}</b></li>`).join("")}</ul>`
    : "";
  $("qResult").innerHTML = `
    <div class="q-label"><span class="ko">결과</span>Result</div>
    <div class="result-mascot">${YJ.ieung(mood)}</div>
    <div class="result-score">${right} / ${QUIZ_LEN}</div>
    <div class="result-msg"><span class="ko">${msg[0]}</span><span class="en">${msg[1]}</span></div>
    ${missed}
    <button class="btn" id="qRestart" type="button"><span class="ko">다시 하기</span><span class="en">Play again</span></button>`;
  $("qPlay").hidden = true;
  $("qResult").hidden = false;
  $("qRestart").addEventListener("click", startQuiz);
  $("qRestart").focus();
}

$("qNext").addEventListener("click", () => (quiz.total >= QUIZ_LEN ? showResult() : newQuestion()));
$("qSpeak").addEventListener("click", () => speak(quiz.answer));

/* ---------- 탭 ---------- */
const TABS = { clock: ["tabClock", "clockView"], rule: ["tabRule", "ruleView"], quiz: ["tabQuiz", "quizView"] };
function showTab(which) {
  for (const [key, [tab, view]] of Object.entries(TABS)) {
    $(tab).setAttribute("aria-selected", key === which);
    $(view).hidden = key !== which;
  }
}
for (const key of Object.keys(TABS))
  $(TABS[key][0]).addEventListener("click", () => {
    showTab(key);
    // 주소에 남겨 두면 수업 중에 "퀴즈 탭" 링크를 바로 보낼 수 있다
    history.replaceState(null, "", key === "clock" ? location.pathname : "#" + key);
  });
const fromHash = location.hash.slice(1);
if (TABS[fromHash]) showTab(fromHash);

render();
startQuiz();
