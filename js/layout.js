/* ============================================================
   이 앱의 셸 설정.
   헤더·푸터의 마크업과 동작은 js/shell.js (카드 앱과 공유) 에 있다.
   여기서는 앱마다 다른 값만 넘기고, 자리표시자를 셸로 바꾼다.
   ============================================================ */
YJ.config({
  home: "./",
  ko: "한국어 시계",
  en: "Korean Clock",
  h1: true, // 이 화면에는 다른 <h1> 이 없다
  nav: [
    { href: "./", key: "clock", ko: "시계", en: "Clock" },
    // 형제 앱. 한쪽만 걸려 있으면 묶음이 아니라 외딴 페이지로 보인다.
    { href: "https://tutoryoujin.github.io/korean-cards/", ko: "한국어 카드", en: "Korean Cards" },
    { href: "https://tutoryoujin.github.io/calendar-practice/", ko: "한국어 달력", en: "Korean Calendar" }
  ],
  tagline: { ko: "시계 읽기, 매일 조금씩.", en: "Tell time in Korean, one minute at a time." },
  legal:
    "읽기 연습용이라 바늘은 1분 단위로 움직여요. 초는 다루지 않아요.<br />" +
    "Made for reading practice — the hands move in 1-minute steps, and seconds are left out."
});

YJ.mount("clock");
