# 한국어 시계

자매 앱과 디자인 시스템을 공유합니다. **화면에 보이는 것(CSS·마크업·색·글꼴·카피)을 건드리기 전에 읽으세요.**

**https://claude.ai/artifact/C1LfGgisHTtDbmy7NyoUtF**

Artifact 툴의 `read` 로 `project/README.md` 를 먼저 읽습니다. 토큰은 `project/tokens.json`, 컴포넌트는 `project/components/<이름>/README.md` 에 있습니다.

자매 앱: 한국어 카드 — ../cards (tutoryoujin/korean-cards), 한국어 달력 — ../calendar (tutoryoujin/calendar-practice)
한쪽에만 디자인을 적용하면 갈라집니다.

## 이 앱의 핵심

시는 고유어(한·두·세…), 분은 한자어(일·이·삼…). 이 구분이 색으로 보입니다.

| 별칭 | 가리키는 값 | 뜻 |
| --- | --- | --- |
| `clk-hour-*` | `orange-*` | 시 · 고유어 |
| `clk-min-*` | `lavender-*` | 분 · 한자어 |
| `clk-ampm-*` | `gray-*` | 오전 · 오후 · 정각 |

별칭은 `css/app.css` 의 `:root` 에 있습니다. 색 옆에는 항상 "고유어 / 한자어", 바늘 손잡이에는 "시 / 분" 글자가 같이 있습니다 — 색만으로 구분되게 두지 마세요.

## 공통 파일

`css/tokens.css` · `css/shell.css` · `js/shell.js` 는 카드 저장소 `shared/` 의 복사본입니다. 여기서 고치지 말고 원본을 고친 뒤 복사하세요. CI(`tools/check_shared.py`)가 어긋남을 잡습니다.

## 자주 틀리는 것

- 색을 새로 만들지 말 것. 악센트 8쌍에서 고르고, 뜻 이름은 `var()` 별칭으로 만든다 (별칭에 hex 재기입 금지).
- `-bg` 와 `-ink` 는 쌍. 섞으면 한쪽 테마에서 안 읽힌다.
- 다크 모드는 `:root` · `@media … :root:not([data-theme="light"])` · `:root[data-theme="dark"]` 세 블록 전부.
- `body { font-synthesis: none }` — Jua 는 굵기가 하나뿐이다.
- 한국어 먼저, 영어는 아래 더 작게 `muted`. 해요체. 한자 쓰지 않음.

이 저장소는 GitHub Pages 루트에서 서비스됩니다. 파일을 하위 폴더로 내리면 라이브 URL이 깨집니다.
