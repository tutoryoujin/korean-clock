/* ────────────────────────────────────────────────────────────
   shell.js — 복사본. 여기서 고치지 말 것.

   원본: korean-cards/shared/shell.js
   고친 뒤  python tools/sync_shared.py  를 돌리면 두 앱에 퍼진다.
   sha256 699545bfe3dfa6e9
   ──────────────────────────────────────────────────────────── */
/* 한국어 with Youjin — 모든 앱이 공유하는 셸.
   마스코트 도형 · 헤더 · 푸터 · 햄버거. 다른 스크립트보다 먼저 부른다.

   마크업까지 여기서 만든다. 앱마다 index.html 에 따로 적어 두면
   한쪽만 고치고 끝내게 되고, 실제로 그렇게 갈라졌다.
   앱이 다른 부분은 YJ.config() 로만 받는다.

   정적 페이지는 <div id="siteHeader"> / <div id="siteFooter"> 를 두고
   YJ.mount() 를 부른다. 화면을 직접 그리는 앱은 YJ.header() /
   YJ.footer() 가 돌려주는 문자열을 쓴다.
*/
window.YJ = (function () {
  "use strict";

  /* ============================================================
     마스코트 이응 — 도형은 문서에 한 번만 둔다.

     자르는 영역은 반드시 symbol 의 viewBox 로 준다. 바깥 <svg> 에
     적은 viewBox 는 <use> 가 symbol 을 꺼내는 순간 무시되고,
     캐릭터가 왼쪽 위로 밀린 채 보인다.

     같은 이유로 바깥 CSS 선택자는 <use> 가 만든 섀도 트리 안쪽에
     닿지 않는다. 마크에서 팔을 "숨기는" 게 아니라 처음부터
     ieung-head 만 꺼내 쓰는 이유다. (색이 토큰으로 따라오는 건
     커스텀 속성이 상속되기 때문이고, 그쪽은 섀도 트리를 넘어간다.)
     ============================================================ */
  var IEUNG = [
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">',
    '<defs>',
    // 평면 이응 — 48px 이하. 좌표는 입체 이응과 같다 (viewBox 240x250 기준)
    '<g id="ieung-limbs">',
    '<ellipse fill="var(--ieung-limb)" cx="94" cy="214" rx="22" ry="14"/>',
    '<ellipse fill="var(--ieung-limb)" cx="146" cy="214" rx="22" ry="14"/>',
    '<rect fill="var(--ieung-limb)" x="35" y="150.5" width="34" height="19" rx="9.5" transform="rotate(-20 52 160)"/>',
    '<rect fill="var(--ieung-limb)" x="173" y="98.5" width="34" height="19" rx="9.5" transform="rotate(-50 190 108)"/>',
    '</g>',
    '<g id="ieung-head">',
    '<rect fill="var(--primary)" x="112" y="40" width="16" height="40" rx="8"/>',
    '<rect fill="var(--primary)" x="85" y="36" width="70" height="18" rx="9"/>',
    '<ellipse fill="var(--ieung-body)" cx="120" cy="142" rx="75" ry="71"/>',
    // 받침 — 몸 위에 그린다. 몸 뒤에 숨기면 꼭지가 머리에서 떠 보인다
    '<path fill="var(--primary)" d="M112 58 L112 68 Q112 72 107 73.5 A13 4.6 0 0 0 133 73.5 Q128 72 128 68 L128 58 Z"/>',
    '<ellipse fill="var(--ieung-blush)" cx="66" cy="176" rx="14" ry="8.5"/>',
    '<ellipse fill="var(--ieung-blush)" cx="174" cy="176" rx="14" ry="8.5"/>',
    '<circle fill="#fff" cx="92" cy="146" r="25"/><circle fill="#fff" cx="148" cy="146" r="25"/>',
    '<circle fill="var(--ieung-face)" cx="92" cy="148" r="17"/><circle fill="var(--ieung-face)" cx="148" cy="148" r="17"/>',
    '<circle fill="#fff" cx="86" cy="141" r="6"/><circle fill="#fff" cx="142" cy="141" r="6"/>',
    '<circle fill="#fff" cx="97" cy="154" r="2.4"/><circle fill="#fff" cx="153" cy="154" r="2.4"/>',
    '<path stroke="var(--ieung-face)" stroke-width="5" stroke-linecap="round" fill="none" d="M111 180 q9 9 18 0"/>',
    '</g>',
    // 입체 이응의 칠. 문서에 한 번만 두고 YJ.ieung() 이 만든 SVG 들이 id 로 함께 쓴다.
    // 광원은 언제나 왼쪽 위. 세로획·받침 그라데이션(v)은 userSpaceOnUse 로 한 번만.
    '<radialGradient id="ieung3d-b" cx="0.36" cy="0.28" r="0.8"><stop offset="0" stop-color="#dce6fd"/><stop offset="0.4" stop-color="#a9bdf0"/><stop offset="0.82" stop-color="#8aa1e2"/><stop offset="1" stop-color="#7690d8"/></radialGradient><radialGradient id="ieung3d-l" cx="0.35" cy="0.25" r="0.9"><stop offset="0" stop-color="#a9bbf0"/><stop offset="1" stop-color="#6880cf"/></radialGradient><linearGradient id="ieung3d-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a7ce6"/><stop offset="0.5" stop-color="#4356cf"/><stop offset="1" stop-color="#3646b8"/></linearGradient><linearGradient id="ieung3d-v" gradientUnits="userSpaceOnUse" x1="108" y1="0" x2="132" y2="0"><stop offset="0" stop-color="#6476e2"/><stop offset="0.45" stop-color="#4659d2"/><stop offset="1" stop-color="#3241a8"/></linearGradient><radialGradient id="ieung3d-e" cx="0.4" cy="0.3" r="0.75"><stop offset="0" stop-color="#ffffff"/><stop offset="0.8" stop-color="#f3f6ff"/><stop offset="1" stop-color="#dbe4fb"/></radialGradient><radialGradient id="ieung3d-p" cx="0.45" cy="0.7" r="0.7"><stop offset="0" stop-color="#3e4d86"/><stop offset="0.6" stop-color="#1e2742"/><stop offset="1" stop-color="#121830"/></radialGradient><filter id="ieung3d-f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter><filter id="ieung3d-s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter><filter id="ieung3d-k" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>',
    '</defs>',
    // 평면 전신
    '<symbol id="ieung-flat" viewBox="28 30 184 202"><use href="#ieung-limbs"/><use href="#ieung-head"/></symbol>',
    // 브랜드 마크 — 팔을 빼고 얼굴만. 정사각이라 정사각 칸에 꼭 맞는다
    '<symbol id="ieung-mark" viewBox="27 32 186 186"><use href="#ieung-head"/></symbol>',
    '</svg>'
  ].join("");

  /* ============================================================
     움직이는 입체 이응 — 표정 12종.

     <use> 로 공유하지 않고 매번 인라인 SVG 를 만든다. <use> 가 만든
     섀도 트리에는 바깥 CSS 가 닿지 않아서 움직이지 않는다.
     움직임은 shell.css 의 .mv 규칙이 그룹(mv-*)에 건다.

     YJ.ieung("yay")  →  '<svg class="mv ex-yay" …>…</svg>'
     ============================================================ */
  var EX = {
    basic: {
      pre: '',
      la: '<rect x="35.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-20 52 160)"/>',
      ra: '<rect x="173.0" y="98.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-50 190 108)"/>',
      bl: '0.6',
      face: '<g class="mv-eyes"><circle cx="92" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="92" cy="148" r="17" fill="url(#ieung3d-p)"/><circle cx="86" cy="141" r="6" fill="#ffffff"/><circle cx="97" cy="154" r="2.4" fill="#ffffff" opacity="0.9"/></g><circle cx="148" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="148" cy="148" r="17" fill="url(#ieung3d-p)"/><circle cx="142" cy="141" r="6" fill="#ffffff"/><circle cx="153" cy="154" r="2.4" fill="#ffffff" opacity="0.9"/></g></g><g class="mv-mouth"><path d="M111 180 q9 9 18 0" stroke="#1e2742" stroke-width="5" stroke-linecap="round" fill="none"/></g>'
    },
    yay: {
      pre: '<polygon points="212.0,52.0 215.7,60.9 225.3,61.7 218.0,67.9 220.2,77.3 212.0,72.3 203.8,77.3 206.0,67.9 198.7,61.7 208.3,60.9" fill="#f4e271" stroke="#f4e271" stroke-width="2.5" stroke-linejoin="round"/><polygon points="26.0,69.0 28.4,74.7 34.6,75.2 29.9,79.3 31.3,85.3 26.0,82.0 20.7,85.3 22.1,79.3 17.4,75.2 23.6,74.7" fill="#bdeace" stroke="#bdeace" stroke-width="2.5" stroke-linejoin="round"/>',
      la: '<rect x="31.0" y="102.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(40 48 112)"/>',
      ra: '<rect x="177.0" y="94.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-38 194 104)"/>',
      bl: '0.8',
      face: '<g class="mv-eyes"><path d="M76 150 q16 -20 32 0" stroke="#1e2742" stroke-width="6.5" stroke-linecap="round" fill="none"/><path d="M132 150 q16 -20 32 0" stroke="#1e2742" stroke-width="6.5" stroke-linecap="round" fill="none"/></g><g class="mv-mouth"><path d="M108 176 q12 0 24 0 q-2 16 -12 16 q-10 0 -12 -16 z" fill="#3a2440"/><path d="M113 186 q7 -5 14 0 q-3 6 -7 6 q-4 0 -7 -6 z" fill="#ff8fa3"/></g>'
    },
    sparkle: {
      pre: '',
      la: '<rect x="35.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-20 52 160)"/>',
      ra: '<rect x="171.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(20 188 160)"/>',
      bl: '0.6',
      face: '<g class="mv-eyes"><circle cx="92" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="92" cy="148" r="17" fill="url(#ieung3d-p)"/><g class="mv-twinkle"><polygon points="86.0,133.0 87.9,137.5 92.7,137.8 89.0,141.0 90.1,145.7 86.0,143.2 81.9,145.7 83.0,141.0 79.3,137.8 84.1,137.5" fill="#ffffff" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/></g><circle cx="98" cy="156" r="2.8" fill="#fff"/></g><circle cx="148" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="148" cy="148" r="17" fill="url(#ieung3d-p)"/><g class="mv-twinkle mv-d2"><polygon points="142.0,133.0 143.9,137.5 148.7,137.8 145.0,141.0 146.1,145.7 142.0,143.2 137.9,145.7 139.0,141.0 135.3,137.8 140.1,137.5" fill="#ffffff" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/></g><circle cx="154" cy="156" r="2.8" fill="#fff"/></g></g><g class="mv-mouth"><path d="M110 178 q10 12 20 0 z" fill="#3a2440" stroke="#3a2440" stroke-width="3" stroke-linejoin="round"/></g>'
    },
    wow: {
      pre: '',
      la: '<rect x="35.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-20 52 160)"/>',
      ra: '<rect x="171.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(20 188 160)"/>',
      bl: '0.45',
      face: '<g class="mv-eyes"><circle cx="92" cy="146" r="26" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="92" cy="146" r="11" fill="url(#ieung3d-p)"/><circle cx="86" cy="139" r="6" fill="#ffffff"/><circle cx="97" cy="152" r="2.4" fill="#ffffff" opacity="0.9"/></g><circle cx="148" cy="146" r="26" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="148" cy="146" r="11" fill="url(#ieung3d-p)"/><circle cx="142" cy="139" r="6" fill="#ffffff"/><circle cx="153" cy="152" r="2.4" fill="#ffffff" opacity="0.9"/></g></g><g class="mv-mouth"><ellipse cx="120" cy="185" rx="6" ry="7.5" fill="#3a2440"/></g>'
    },
    wink: {
      pre: '',
      la: '<rect x="35.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-20 52 160)"/>',
      ra: '<rect x="171.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(20 188 160)"/>',
      bl: '0.6',
      face: '<g class="mv-eyes"><circle cx="92" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="92" cy="148" r="17" fill="url(#ieung3d-p)"/><circle cx="86" cy="141" r="6" fill="#ffffff"/><circle cx="97" cy="154" r="2.4" fill="#ffffff" opacity="0.9"/></g><path d="M132 150 q16 -20 32 0" stroke="#1e2742" stroke-width="6.5" stroke-linecap="round" fill="none"/></g><g class="mv-mouth"><path d="M111 179 q9 11 18 0" stroke="#1e2742" stroke-width="5" stroke-linecap="round" fill="none"/></g><g class="mv-twinkle"><polygon points="178.0,116.0 180.1,121.1 185.6,121.5 181.4,125.1 182.7,130.5 178.0,127.6 173.3,130.5 174.6,125.1 170.4,121.5 175.9,121.1" fill="#f4e271" stroke="#f4e271" stroke-width="2.5" stroke-linejoin="round"/></g>'
    },
    focus: {
      pre: '',
      la: '<rect x="35.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-20 52 160)"/>',
      ra: '<rect x="171.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(20 188 160)"/>',
      bl: '0.4',
      face: '<g class="mv-eyes"><circle cx="92" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="97" cy="141" r="17" fill="url(#ieung3d-p)"/><circle cx="91" cy="134" r="6" fill="#ffffff"/><circle cx="102" cy="147" r="2.4" fill="#ffffff" opacity="0.9"/></g><circle cx="148" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="153" cy="141" r="17" fill="url(#ieung3d-p)"/><circle cx="147" cy="134" r="6" fill="#ffffff"/><circle cx="158" cy="147" r="2.4" fill="#ffffff" opacity="0.9"/></g></g><g class="mv-mouth"><path d="M114 183 q8 3 14 -3" stroke="#1e2742" stroke-width="5" stroke-linecap="round" fill="none"/></g><g class="mv-dot1"><circle cx="170" cy="74" r="4" fill="#56618a"/></g><g class="mv-dot2"><circle cx="182" cy="58" r="6" fill="#56618a"/></g>'
    },
    sleepy: {
      pre: '',
      la: '<rect x="35.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-20 52 160)"/>',
      ra: '<rect x="171.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(20 188 160)"/>',
      bl: '0.5',
      face: '<g class="mv-eyes"><path d="M76 152 q16 16 32 0" stroke="#1e2742" stroke-width="6.5" stroke-linecap="round" fill="none"/><path d="M132 152 q16 16 32 0" stroke="#1e2742" stroke-width="6.5" stroke-linecap="round" fill="none"/></g><g class="mv-mouth"><ellipse cx="120" cy="183" rx="4" ry="5" fill="#3a2440"/></g><g class="mv-z1"><text x="172" y="112" font-family="Nunito, sans-serif" font-weight="800" font-size="20" fill="#56618a">z</text></g><g class="mv-z2"><text x="186" y="96" font-family="Nunito, sans-serif" font-weight="800" font-size="14" fill="#56618a">z</text></g>'
    },
    huh: {
      pre: '',
      la: '<rect x="35.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-20 52 160)"/>',
      ra: '<rect x="171.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(20 188 160)"/>',
      bl: '0.6',
      face: '<g class="mv-eyes"><circle cx="92" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="89" cy="148" r="13" fill="url(#ieung3d-p)"/><circle cx="83" cy="141" r="6" fill="#ffffff"/><circle cx="94" cy="154" r="2.4" fill="#ffffff" opacity="0.9"/></g><circle cx="148" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="151" cy="148" r="13" fill="url(#ieung3d-p)"/><circle cx="145" cy="141" r="6" fill="#ffffff"/><circle cx="156" cy="154" r="2.4" fill="#ffffff" opacity="0.9"/></g></g><g class="mv-mouth"><path d="M108 183 q4 -4 8 0 q4 4 8 0 q4 -4 8 0" stroke="#1e2742" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g><g class="mv-sweat"><path d="M178 92 q8 12 0 18 q-8 -6 0 -18 z" fill="#bfe3ff"/></g>'
    },
    proud: {
      pre: '',
      la: '<rect x="35.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-20 52 160)"/>',
      ra: '<rect x="171.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(20 188 160)"/>',
      bl: '0.95',
      face: '<g class="mv-eyes"><path d="M78 150 q14 -20 28 0" stroke="#1e2742" stroke-width="6.5" stroke-linecap="round" fill="none"/><path d="M134 150 q14 -20 28 0" stroke="#1e2742" stroke-width="6.5" stroke-linecap="round" fill="none"/></g><g class="mv-mouth"><path d="M108 177 q12 14 24 0" stroke="#1e2742" stroke-width="5.5" stroke-linecap="round" fill="none"/></g>'
    },
    moved: {
      pre: '',
      la: '<rect x="35.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-20 52 160)"/>',
      ra: '<rect x="171.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(20 188 160)"/>',
      bl: '0.6',
      face: '<g class="mv-eyes"><circle cx="92" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="92" cy="148" r="17" fill="url(#ieung3d-p)"/><circle cx="85" cy="139" r="7" fill="#fff"/><circle cx="98" cy="152" r="3.2" fill="#fff"/><circle cx="82" cy="154" r="2.2" fill="#fff"/></g><circle cx="148" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="148" cy="148" r="17" fill="url(#ieung3d-p)"/><circle cx="141" cy="139" r="7" fill="#fff"/><circle cx="154" cy="152" r="3.2" fill="#fff"/><circle cx="138" cy="154" r="2.2" fill="#fff"/></g></g><g class="mv-mouth"><path d="M110 183 q5 5 10 0 q5 5 10 0" stroke="#1e2742" stroke-width="4.5" stroke-linecap="round" fill="none"/></g><g class="mv-tear"><path d="M78 170 q14 6 28 0" stroke="#bfe3ff" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M134 170 q14 6 28 0" stroke="#bfe3ff" stroke-width="5" stroke-linecap="round" fill="none"/></g>'
    },
    love: {
      pre: '',
      la: '<rect x="35.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-20 52 160)"/>',
      ra: '<rect x="171.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(20 188 160)"/>',
      bl: '0.9',
      face: '<g class="mv-eyes"><circle cx="92" cy="146" r="25" fill="url(#ieung3d-e)"/><circle cx="148" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-heart"><path d="M92 161.4 C69.6 145.4 80.8 129.4 92 141.4 C103.2 129.4 114.4 145.4 92 161.4 Z" fill="#ff6f8f"/><circle cx="86" cy="141" r="3.2" fill="#fff"/></g><g class="mv-heart"><path d="M148 161.4 C125.6 145.4 136.8 129.4 148 141.4 C159.2 129.4 170.4 145.4 148 161.4 Z" fill="#ff6f8f"/><circle cx="142" cy="141" r="3.2" fill="#fff"/></g></g><g class="mv-mouth"><path d="M110 178 q10 12 20 0 z" fill="#3a2440" stroke="#3a2440" stroke-width="3" stroke-linejoin="round"/></g>'
    },
    tongue: {
      pre: '',
      la: '<rect x="35.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(-20 52 160)"/>',
      ra: '<rect x="171.0" y="150.5" width="34" height="19" rx="9.5" fill="url(#ieung3d-l)" transform="rotate(20 188 160)"/>',
      bl: '0.6',
      face: '<g class="mv-eyes"><circle cx="92" cy="146" r="25" fill="url(#ieung3d-e)"/><g class="mv-pupil"><circle cx="92" cy="148" r="17" fill="url(#ieung3d-p)"/><circle cx="86" cy="141" r="6" fill="#ffffff"/><circle cx="97" cy="154" r="2.4" fill="#ffffff" opacity="0.9"/></g><path d="M132 150 q16 -20 32 0" stroke="#1e2742" stroke-width="6.5" stroke-linecap="round" fill="none"/></g><g class="mv-mouth"><path d="M110 179 q10 6 20 0" stroke="#1e2742" stroke-width="5" stroke-linecap="round" fill="none"/><g class="mv-tongue"><path d="M115 181 h10 v6 q0 7 -5 7 q-5 0 -5 -7 z" fill="#ff8fa3"/></g></g>'
    }
  };

  var BODY = [
    '<rect x="112" y="40" width="16" height="40" rx="8" fill="url(#ieung3d-v)"/>',
    '<rect x="85" y="36" width="70" height="18" rx="9" fill="url(#ieung3d-t)"/>',
    '<rect x="92" y="39" width="38" height="5" rx="2.5" fill="#ffffff" opacity="0.4"/>',
    '<ellipse cx="120" cy="142" rx="75" ry="71" fill="url(#ieung3d-b)"/>',
    '<ellipse cx="120" cy="77" rx="18" ry="5.5" fill="#3a4fae" opacity="0.32" filter="url(#ieung3d-k)"/>',
    '<path d="M112 58 L112 68 Q112 72 107 73.5 A13 4.6 0 0 0 133 73.5 Q128 72 128 68 L128 58 Z" fill="url(#ieung3d-v)"/>',
    '<ellipse cx="114.5" cy="70" rx="2" ry="5" fill="#ffffff" opacity="0.3"/>',
    '<ellipse cx="84" cy="100" rx="17" ry="9" fill="#ffffff" opacity="0.75" transform="rotate(-32 84 100)"/>',
    '<circle cx="104" cy="90" r="3.5" fill="#ffffff" opacity="0.8"/>'
  ].join("");
  var FEET = '<ellipse cx="94" cy="214" rx="22" ry="14" fill="url(#ieung3d-l)"/>' +
             '<ellipse cx="146" cy="214" rx="22" ry="14" fill="url(#ieung3d-l)"/>';
  var CHEEKS = '<g filter="url(#ieung3d-f)"><ellipse cx="66" cy="176" rx="14" ry="8.5" fill="#ff9fb3"/>' +
               '<ellipse cx="174" cy="176" rx="14" ry="8.5" fill="#ff9fb3"/></g>';

  /** 표정 이름(basic · yay · sparkle · wow · wink · focus · sleepy · huh ·
      proud · moved · love · tongue)을 받아 인라인 SVG 문자열을 돌려준다.
      label 을 주면 role="img" 로 읽히고, 없으면 장식으로 숨긴다. */
  function ieung(name, label) {
    var e = EX[name] || EX.basic;
    var a11y = label
      ? ' role="img" aria-label="' + esc(label) + '"'
      : ' aria-hidden="true" focusable="false"';
    return '<svg class="mv ex-' + (EX[name] ? name : "basic") + '" viewBox="0 0 240 250"' + a11y + '>' +
      '<g class="mv-shadow"><ellipse cx="120" cy="228" rx="64" ry="9" fill="#1e2742" opacity="0.16" filter="url(#ieung3d-s)"/></g>' +
      '<g class="mv-move"><g class="mv-breathe">' + e.pre + FEET +
      '<g class="mv-larm">' + e.la + '</g><g class="mv-rarm">' + e.ra + '</g>' +
      BODY + '<g class="mv-blush" opacity="' + e.bl + '">' + CHEEKS + '</g>' +
      e.face + '</g></g></svg>';
  }

  function injectIeung() {
    if (document.getElementById("ieung-mark")) return;
    var holder = document.createElement("div");
    holder.innerHTML = IEUNG;
    document.body.insertBefore(holder.firstChild, document.body.firstChild);
  }

  // </body> 앞에서 부르면 body 가 이미 있으므로 바로 넣는다.
  // <use> 가 가리키는 symbol 이 뒤늦게 생기면 브라우저에 따라 다시
  // 찾아 주지 않으므로, 기다리지 않고 동기로 넣는 편이 안전하다.
  if (document.body) {
    injectIeung();
  } else {
    document.addEventListener("DOMContentLoaded", injectIeung);
  }

  /* ============================================================
     햄버거 메뉴

     버튼에 직접 걸지 않고 document 에 한 번만 건다. 카드 앱은 화면을
     innerHTML 로 통째로 다시 그려서 버튼에 건 리스너가 날아간다.
     ============================================================ */
  function nav() { return document.getElementById("siteNav"); }
  function btn() { return document.querySelector(".menu-btn"); }

  function setMenu(open) {
    var n = nav(), b = btn();
    if (!n || !b) return;
    b.setAttribute("aria-expanded", String(open));
    b.setAttribute("aria-label", open ? "메뉴 닫기 / Close menu" : "메뉴 열기 / Open menu");
    n.hidden = !open;
  }

  document.addEventListener("click", function (e) {
    var n = nav();
    if (!n) return;
    if (e.target.closest(".menu-btn")) { setMenu(n.hidden); return; }
    // 메뉴 안의 링크를 눌러도 닫는다. 카드 앱은 해시 라우팅이라
    // 링크를 눌러도 페이지가 다시 로드되지 않는다.
    if (!n.hidden) setMenu(false);
  });

  document.addEventListener("keydown", function (e) {
    var n = nav();
    if (e.key === "Escape" && n && !n.hidden) {
      setMenu(false);
      if (btn()) btn().focus();
    }
  });

  /* ============================================================
     헤더와 푸터

     구조는 두 앱이 똑같다. 다른 것은 YJ.config() 로 받는 값뿐이다.
     ============================================================ */
  var cfg = {
    home: "./",               // 브랜드를 눌렀을 때 갈 곳
    ko: "한국어",             // 워드마크 가운데 낱말
    en: "",                   // 영문 병기
    h1: false,                // 워드마크를 <h1> 로 쌀지 (화면에 다른 h1 이 없을 때만)
    nav: [],                  // [{ href, key, ko, en }] — key 가 active 와 같으면 현재 위치
    tagline: { ko: "", en: "" },
    legal: ""                 // 저작권·면책 문구. 줄바꿈용 <br> 를 허용하므로 날 HTML 이다
  };

  function config(c) {
    for (var k in c) if (Object.prototype.hasOwnProperty.call(c, k)) cfg[k] = c[k];
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  var MARK = '<svg><use href="#ieung-mark"/></svg>';
  var WORDMARK = function () {
    return esc(cfg.ko) + ' <em>with Youjin</em><small>' + esc(cfg.en) + "</small>";
  };

  function header(active) {
    var tag = cfg.h1 ? "h1" : "span";
    var links = cfg.nav.map(function (n) {
      var on = n.key && n.key === active;
      return '          <a href="' + esc(n.href) + '"' +
        (on ? ' class="active" aria-current="page"' : "") + ">" +
        esc(n.ko) + "<small>" + esc(n.en) + "</small></a>";
    }).join("\n");
    return [
      '<header class="site-header">',
      '  <div class="site-inner">',
      '    <a class="brand" href="' + esc(cfg.home) + '" aria-label="' + esc(cfg.ko) + ' with Youjin 홈 / Home">',
      '      <span class="brand-mark" aria-hidden="true">' + MARK + "</span>",
      "      <" + tag + ' class="brand-text">' + WORDMARK() + "</" + tag + ">",
      "    </a>",
      '    <div class="menu">',
      '      <button class="menu-btn" type="button" aria-label="메뉴 열기 / Open menu"',
      '              aria-expanded="false" aria-controls="siteNav">',
      '        <span class="bars" aria-hidden="true"></span>',
      "      </button>",
      '      <nav class="site-nav" id="siteNav" aria-label="메뉴 / Menu" hidden>',
      links,
      "      </nav>",
      "    </div>",
      "  </div>",
      "</header>"
    ].join("\n");
  }

  /* 푸터에는 저작권 관련 내용만 둔다. 형제 앱 링크는 헤더 메뉴에
     이미 있어서 겹쳤다. */
  function footer() {
    return [
      '<footer class="site-footer">',
      '  <div class="site-inner">',
      '    <div class="foot-brand">',
      '      <span class="brand-mark sm" aria-hidden="true">' + MARK + "</span>",
      "      <div>",
      "        <b>" + esc(cfg.ko) + " <em>with Youjin</em></b>",
      "        <span>" + esc(cfg.tagline.ko) + "<br>" + esc(cfg.tagline.en) + "</span>",
      "      </div>",
      "    </div>",
      '    <p class="foot-legal">' + cfg.legal + "</p>",
      '    <p class="foot-copy">© ' + new Date().getFullYear() + " Made by Youjin. All rights reserved.</p>",
      "  </div>",
      "</footer>"
    ].join("\n");
  }

  /* 정적 페이지용 — 자리표시자를 실제 셸로 바꾼다 */
  function mount(active) {
    var h = document.getElementById("siteHeader");
    if (h) h.outerHTML = header(active);
    var f = document.getElementById("siteFooter");
    if (f) f.outerHTML = footer();
  }

  return { config: config, header: header, footer: footer, mount: mount, ieung: ieung };
})();
