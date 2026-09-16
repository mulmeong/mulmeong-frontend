# 사우나 지도 (MAP-*) 상세 기능 명세

> 이 문서의 독자는 **이 저장소를 처음 보는 AI 에이전트**다. 지도 화면을 수정하거나 이어서 구현하기 전에 이 문서를 먼저 읽는다.
> 전역 규칙은 저장소 루트 [CLAUDE.md](../CLAUDE.md)에 있다. 이 문서는 그 규칙을 전제로 지도 화면에만 해당하는 내용을 다룬다.
> 기준 시점: 2026-09-16 / 브랜치 `feat/map`

---

## 0. 30초 요약

- **라우트**: `/map` — [src/pages/MapPage.tsx](../src/pages/MapPage.tsx)
- **레이아웃**: `[검색 사이드바 380px] [상세 패널 347px(선택 시)] [지도 flex-1]` (데스크탑) / 세로 스택 (모바일)
- **지도 엔진**: 카카오맵 JS SDK v2 + clusterer 라이브러리, `autoload=false`로 지연 로드
- **상태**: 서버 상태 라이브러리 없음. 도메인 훅(`useOnsens` / `usePois` / `useSuggestions` / `useNearby`)이 각자 `useRef(Map)` 캐시와 요청 경합 가드를 직접 들고 있다
- **데이터**: `VITE_USE_MOCK`이 켜져 있으면 각 API 모듈이 `*Mock.ts`로 분기한다. 백엔드 미구현 구간은 전부 목으로 돌아간다
- **현재 범위**: MAP-01·02·03·04·05·07은 동작함. **MAP-08 길찾기 UI·API 계약 반영 완료, 실서버 통합 확인 대기**

---

## 1. 명세 ID 대응표

| ID      | 내용                                        | 상태                    | 구현 위치                                                                                                                                        |
| ------- | ------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| MAP-01① | 카카오맵 기반 줌·팬·클러스터링              | 구현됨                  | [MapCanvas.tsx](../src/features/map/components/MapCanvas.tsx)                                                                                    |
| MAP-02① | 마커 → 상세 카드                            | 구현됨                  | [OnsenDetailPanel.tsx](../src/features/map/components/OnsenDetailPanel.tsx)                                                                      |
| MAP-03① | 이 지역 재검색                              | 구현됨 (자동 갱신 방식) | `MapCanvas` idle → `MapPage.handleBoundsChange`                                                                                                  |
| MAP-04① | 카테고리 POI 토글                           | 구현됨                  | [PoiFilter.tsx](../src/features/map/components/PoiFilter.tsx) · [usePois.ts](../src/features/map/hooks/usePois.ts)                               |
| MAP-05① | 온천명·지역명 자동완성                      | 구현됨                  | [SearchSuggestions.tsx](../src/features/map/components/SearchSuggestions.tsx) · [useSuggestions.ts](../src/features/map/hooks/useSuggestions.ts) |
| MAP-07① | 리스트 뷰 토글 + 상단 매거진                | 구현됨                  | [MapSidebar.tsx](../src/features/map/components/MapSidebar.tsx) · [SidebarMagazine.tsx](../src/features/map/components/SidebarMagazine.tsx)      |
| MAP-08① | 카카오 길찾기 (대중교통·자동차·도보·자전거) | **UI·API 연결 구현**    | 비인증 `/external/directions`, 총 시간·요금·단계·경로선, 오류 안내. 실서버 통합 확인 대기                                                        |

> MAP-06은 기능명세서에 없다(결번). 없는 ID를 새로 만들지 말 것.

---

## 2. 화면 구조

### 2-1. 레이아웃 규칙

`MapPage`는 **`RootLayout` 밖에 있다**. `RootLayout`은 본문을 `max-w-5xl`로 묶는데 지도는 화면을 꽉 채워야 해서, 라우터에서 최상위로 두고 `<Header>`를 페이지가 직접 렌더한다. 같은 이유로 `/dart`도 밖에 있다 ([router.tsx:29-31](../src/routes/router.tsx#L29-L31)).

```
h-dvh, overflow-hidden
├── Header                      (고정)
└── flex-1, flex-col lg:flex-row
    ├── aside  검색 사이드바      lg:w-[380px] · 모바일 h-[45dvh]
    ├── div    접기 손잡이         w-0, 데스크탑 전용
    ├── aside  상세 패널 (선택 시) lg:w-[347px] · 모바일 h-[45dvh]
    └── main   지도               flex-1
```

### 2-2. 반응형 분기 (중요)

모바일에서는 폭이 좁아 **검색 사이드바와 상세 패널이 동시에 못 들어간다.** 그래서 상세가 열리면 검색 사이드바를 `hidden`으로 감춘다. 데스크탑은 둘 다 띄운다 — 상세가 검색을 **교체하지 않고 그 오른쪽에 더해진다**.

```tsx
// MapPage.tsx:116
selected ? 'hidden' : 'flex' // 모바일: 상세가 열리면 검색은 숨는다
lg: flex // 데스크탑: 항상 보인다
```

이 규칙을 깨뜨리는 변경(예: 상세를 모달로 바꾸기)은 모바일 45dvh 스트립 구조 전체에 영향을 준다.

### 2-3. 접기 손잡이 (MAP-07)

시안에 리스트 토글 버튼이 없어 **형태는 프론트에서 정했다.** 패널 경계에 붙은 23×51px 손잡이(`‹` / `›`)로 사이드바를 접는다. 모바일은 45dvh 고정 스트립이라 접는 의미가 없어 **데스크탑 전용**이다. 상세 패널이 열려 있는 동안에는 손잡이를 숨긴다.

---

## 3. 데이터 흐름

### 3-1. 전체 흐름도

```
MapSidebar (검색어·지역 입력)
   │ onSearch({ keyword, region })
   ▼
MapPage.handleSearch
   ├─ filtersRef에 조건 기억 ──────┐  (지도를 움직여도 조건을 잃지 않게)
   ├─ useOnsens.load(filters)      │
   └─ setFocus(...) ───────────┐   │
                                ▼   │
MapCanvas (focus effect)  지도 이동  │
   │ idle (600ms 디바운스)           │
   ▼                                │
MapPage.handleBoundsChange ─────────┘
   └─ load({ ...filtersRef.current, bounds })
```

### 3-2. 조건 기억이 `useRef`인 이유

검색어·지역의 **소유자는 `MapSidebar`**(자기 입력 상태)인데, 지도 idle로 재조회할 때도 그 조건이 필요하다. 상태로 올리면 사이드바와 페이지에 같은 값이 두 벌 생긴다. 그래서 `MapPage`는 `filtersRef`에 마지막 조건을 **기억만** 하고 렌더에는 쓰지 않는다 ([MapPage.tsx:29](../src/pages/MapPage.tsx#L29)).

렌더에 필요한 건 "조건이 있는가"뿐이라 그것만 `hasFilter` 상태로 따로 둔다.

### 3-3. 초기 화면에서 bounds를 보내지 않는 이유

첫 화면은 전국 뷰(`NATIONAL_VIEW`, level 12)다. 여기서 보이는 영역을 그대로 서버에 보내면 **전국 온천 505곳이 한 번에 쏟아진다.** 그래서 조건(`keyword` 또는 `region`)이 없으면 bounds 재조회를 아예 건너뛴다.

```ts
// MapPage.tsx:71-77
if (!hasFilter) return
```

**이 가드를 제거하면 안 된다.** 쿼터·성능 양쪽에 직결된다.

### 3-4. 검색 후 지도 이동 규칙 (`focus`)

| 입력               | 지도 동작                                                                     |
| ------------------ | ----------------------------------------------------------------------------- |
| 지역 선택          | `REGION_VIEWS[region]`으로 이동 — **결과 유무와 무관하게** 그 지역을 보여준다 |
| 검색 결과 1건      | 그 좌표로 `level 5`까지 당김                                                  |
| 검색 결과 2건 이상 | 결과 전체를 감싸는 bounds로 `setBounds`                                       |
| 검색 결과 0건      | 지도를 움직이지 않음 (빈 화면으로 튀지 않게)                                  |

`MapView` 타입이 `{lat,lng,level} | {bounds}` 유니온인 이유가 이것이다 ([types/onsen.ts:74](../src/types/onsen.ts#L74)).

---

## 4. 지도 캔버스 (MapCanvas)

카카오맵 SDK는 명령형 API라 **React 렌더 밖에서 산다.** `MapCanvas`는 마커·오버레이를 `useRef` 배열로 들고, effect마다 "걷어내고 다시 단다"를 반복한다. 이 컴포넌트를 고칠 때 지켜야 할 것들:

### 4-1. SDK 로드

[loadKakaoMap.ts](../src/features/map/utils/loadKakaoMap.ts)가 모듈 스코프 `loading` 프라미스로 **한 번만 로드**한다. 페이지를 오갈 때마다 스크립트를 다시 받지 않는다. `autoload=false`로 받아 `maps.load()` 시점을 직접 정한다.

`VITE_KAKAO_MAP_KEY`가 비면 에러 메시지를 지도 자리에 렌더한다. **키는 카카오 JS SDK 키라 클라이언트에 노출되는 게 정상**이지만, Kakao Developers 콘솔에서 **도메인 제한이 필수**다.

### 4-2. 마커는 clusterer가 붙인다

```ts
clusterer.addMarkers(markersRef.current) // O
marker.setMap(map) // X — 클러스터가 안 먹는다
```

**단, POI 마커는 clusterer에 넣지 않는다.** 넣으면 온천 클러스터의 숫자가 POI까지 세서 오염된다. POI는 `marker.setMap(map)`으로 직접 붙인다 ([MapCanvas.tsx:214-238](../src/features/map/components/MapCanvas.tsx#L214-L238)).

### 4-3. 마커 시각 체계

| 요소        | 모양                                             | zIndex |
| ----------- | ------------------------------------------------ | ------ |
| 온천 (기본) | 36px 검정 원 + 흰 온천 기호(♨ 형태를 SVG 선으로) | 2      |
| 온천 (선택) | 48px 흰 원 + 검정 기호 + 외곽 링                 | 3      |
| POI         | 20px 흰 원 + 검정 테두리                         | 1      |
| 클러스터    | 34/38/42px 검정 원 + 흰 숫자 (10, 50 구간)       | —      |

- 이모지 대신 **SVG 선으로 그린 이유**: 기기·OS별 이모지 글꼴 차이로 모양이 달라진다
- `svgMarker()`에서 `#`을 미리 이스케이프하면 **이중 인코딩돼 색이 깨진다**
- `MarkerImage`의 `offset`을 이미지 중앙(`size/2`)으로 잡아야 원의 중심이 실제 좌표를 가리킨다

### 4-4. 이름표(라벨)는 CustomOverlay

`Marker`는 텍스트를 못 올려서 이름표는 별도 `CustomOverlay`다. 마커와 **다른 객체**라 갱신할 때 따로 걷어내고 다시 단다.

`LABEL_MAX_LEVEL = 8` — 이보다 넓게 보면 이름표를 전부 숨긴다. 전국 뷰에서 글자가 서로 겹쳐 지도를 덮기 때문이다.

### 4-5. 줌·클러스터 상수

```ts
NATIONAL_VIEW.level = 12 // 초기 뷰이자 setMaxLevel — 더 축소 불가
CLUSTER_MIN_LEVEL = 7 // 이보다 확대하면 클러스터 해제
CLUSTER_ZOOM_STEP = 2 // 클러스터 클릭 시 당기는 단계
LABEL_MAX_LEVEL = 8 // 이보다 넓으면 이름표 숨김
BOUNDS_DEBOUNCE_MS = 600 // idle 디바운스 (쿼터 방어)
```

클러스터 기본 클릭 확대는 한 번에 너무 많이 당겨서 `disableClickZoom: true`로 끄고 직접 2단계씩 처리한다.

### 4-6. 반드시 남겨야 하는 두 개의 effect

**ResizeObserver + relayout** — 상세 패널이 열고 닫히면 지도 컨테이너 폭이 바뀐다. `map.relayout()` 없이는 타일이 잘린 채 남는다. relayout이 중심을 흔들 수 있어 직전 중심을 저장했다 되돌린다 ([MapCanvas.tsx:337-351](../src/features/map/components/MapCanvas.tsx#L337-L351)).

**animateMapCenter** — 목록에서 장소를 고르면 지도가 부드럽게 이동한다. 새 장소를 고르면 이전 애니메이션을 취소하는 cleanup을 반환한다 ([animateMapCenter.ts](../src/features/map/utils/animateMapCenter.ts)).

### 4-7. 하지 말 것

- 목록이 바뀔 때 **결과 전체에 `setBounds`를 걸지 말 것.** MAP-03이 "보이는 영역" 기준이라 서로 싸운다 (이동 → 재조회 → 이동 → … 무한 루프)
- `PoiFilter`를 감싼 오버레이 컨테이너의 `pointer-events-none`을 지우지 말 것. 지도 팬·줌이 막힌다. 버튼 쪽만 `pointer-events-auto`다
- 오버레이 `z-[100]`을 낮추지 말 것. 카카오맵이 타일·컨트롤에 자체 z-index를 써서 가려진다

---

## 5. 검색 사이드바 (MapSidebar)

### 5-1. 두 가지 모드

`searchedKeyword`가 있으면 **검색 결과 모드**, 없으면 **둘러보기 모드**다.

```
둘러보기 모드                     검색 결과 모드
├── 탭 (장소 검색 / 길찾기)       ├── 탭
├── 검색 입력                     ├── 검색 입력
├── 지역으로 둘러보기 (칩)        └── "{키워드}" 검색 결과 + 목록
├── 지금 이런 곳은 어때요 (가로)
└── 현재 지도에서 (조건 있을 때)
     └── SidebarMagazine (하단 고정)
```

`SidebarMagazine`은 스크롤 영역 **밖**이다. 검색 영역만 스크롤하고 매거진은 패널 하단에 남는다 (네이버 지도 기획전 방식 — MAP-07 명세).

### 5-2. 지역 필터는 8개

`REGIONS = ['서울','경기','인천','강원','충청','경상','전라','제주']`

기능명세서 MY-02는 **시·도 17단위**라고 되어 있지만, 지도 필터는 8개 광역 묶음이다. 포도알 지도(MY-02)와 **단위가 다르다** — 통합하려 하지 말 것. `REGION_VIEWS` 좌표는 명세에 없는 값이라 **대략치로 잡아둔 것**이고, 기획·BE에서 확정되면 교체한다.

`'전체'` 칩은 지역만 풀고 검색어는 건드리지 않는다. 지역 칩을 다시 눌러도 해제되지만 사용자가 알아채기 어려워 명시적 버튼을 뒀다.

### 5-3. 자동완성 (MAP-05)

- 200ms 디바운스, 입력창 포커스 중에만 열림
- `Suggestion`은 `{type:'region'}` | `{type:'onsen'}` 유니온
- 지역 제안을 고르면 → 검색어를 비우고 지역 필터로 전환
- 온천 제안을 고르면 → 그 이름으로 검색 (지도 이동은 기존 검색 경로가 처리)
- **접근성**: `role="combobox"` + `aria-expanded` + `aria-activedescendant`, ↑/↓/Enter/Esc 키보드 조작이 붙어 있다. 건드릴 때 깨뜨리지 말 것
- 실패해도 조용히 비운다 — 보조 기능이라 에러를 띄우지 않는다

### 5-4. 시안과 다른 부분 (의도된 것)

사이드바는 시안(1:479 / 1:555)의 좌표를 그대로 따르지 않는다. **팀 논의로 밀도·위계를 우선**하기로 해서 divider를 걷어내고 여백으로 섹션을 나눴다. 읽히는 순서는 `검색 → 지역 → 추천 → 현재 지도에서`. `SearchResultItem`도 같은 이유로 구분선 대신 hover 배경을 쓴다.

**시안과 다르다는 이유로 되돌리지 말 것.**

### 5-5. 미완 항목

- `SUGGESTIONS` ('비 오는 날 가기 좋은 온천' 등 4개)는 **하드코딩**이다. 링크 동작 없음 — 매거진 연동 후 채운다
- '전체보기' 버튼 2개 동작 없음

---

## 6. 상세 패널 (MAP-02)

탭 4개: **한눈에 / 리뷰 / 주변 / 정보**

| 탭     | 내용                                | 상태                                  |
| ------ | ----------------------------------- | ------------------------------------- |
| 한눈에 | `OnsenSpecSummary` — 수온·수질·효능 | 구현됨 (공용 컴포넌트)                |
| 리뷰   | 목 모드에서만 `MockReviewList`      | REV-* 미구현, 실서버는 "준비 중" 문구 |
| 주변   | `NearbyList` — PAM-04               | 구현됨 (탭 열릴 때만 호출)            |
| 정보   | 기본 정보 / 이용 안내 / 참고사항    | 구현됨                                |

### 6-1. 자리만 잡아둔 것들

- **찜(하트) 아이콘** — PAM-07·로그인 필요 범위. 지금은 `PAM-07`을 위한 자리만 있고 동작 없음
- **Place Action Row** — 저장·공유는 텍스트만 표시. 길찾기는 해당 온천을 도착지로 채우고 길찾기 패널을 연다
- `NearbyList`의 '전체 보기' — `hasMore`가 true여도 `disabled`. PAM-06 명세가 아직 없다

### 6-2. 선택 상태 관리

`MapPage`는 `selectedId: number`만 들고, 객체는 `onsens.find()`로 되찾는다. **온천 객체 사본을 따로 들지 말 것** — 목록이 재조회되면 사본이 낡는다.

```ts
const selected = onsens.find((onsen) => onsen.id === selectedId)
```

목록 재조회로 선택된 온천이 결과에서 빠지면 `selected`가 `undefined`가 되어 패널이 자동으로 닫힌다. 의도된 동작이다.

---

## 7. 쿼터 방어 (비기능 요구사항 — 최우선)

관광공사·카카오 API는 **일일 쿼터**가 있다. 지도 화면은 팬·줌마다 호출이 터질 수 있는 구조라 4겹으로 막아둔다. **이 중 하나라도 제거하는 변경은 하지 말 것.**

| 겹             | 위치                                       | 방법                                                 |
| -------------- | ------------------------------------------ | ---------------------------------------------------- |
| 1. 디바운스    | `MapCanvas`                                | idle 600ms, 자동완성 200ms                           |
| 2. 좌표 반올림 | `useOnsens.boundsKey` / `usePois.cacheKey` | 소수 3자리(≈100m) — 1px 팬마다 키가 새로 생기지 않게 |
| 3. 메모리 캐시 | 각 훅의 `useRef(new Map())`                | 같은 조건은 재요청 안 함                             |
| 4. 조건 가드   | `MapPage.handleBoundsChange`               | 조건 없으면 bounds 조회 자체를 안 함                 |

추가로 `NearbyList`는 **탭이 열렸을 때만** 호출한다 (`active` prop).

> 서버도 POI를 소수점 3자리로 반올림해 캐싱한다. 클라이언트가 같은 키를 써야 캐시가 맞는다 — 자릿수를 바꾸면 양쪽을 같이 바꿔야 한다.

### 7-1. 요청 경합 가드

모든 비동기 훅이 `requestId = useRef(0)` 패턴을 쓴다. 늦게 도착한 이전 요청이 최신 결과를 덮어쓰지 않게 한다.

```ts
const id = ++requestId.current
const result = await fetch(...)
if (id !== requestId.current) return   // 낡은 응답은 버린다
```

`usePois` / `useSuggestions`는 한 걸음 더 나가서, **조건이 바뀌면 렌더 시점에** 이전 결과를 버린다 (effect에서 지우면 한 프레임 깜빡인다).

```ts
const pois = fetched && fetched.key === queryKey ? fetched.places : []
```

---

## 8. API 계약

모든 호출은 `skipAuth: true` — **비로그인도 지도를 볼 수 있다 (AUTH-02).**

| 함수              | 엔드포인트                                                                           | 응답                                  |
| ----------------- | ------------------------------------------------------------------------------------ | ------------------------------------- |
| `searchOnsens`    | `GET /onsens?keyword&region&swLat&swLng&neLat&neLng`                                 | `OnsenListItem[]`                     |
| `suggestPlaces`   | `GET /onsens/suggest?keyword`                                                        | `Suggestion[]`                        |
| `fetchPoi`        | `GET /external/places/category?category&lat&lng&radius&size`                         | `PoiResult`                           |
| `fetchNearby`     | `GET /onsens/{id}/nearby?radius&limit`                                               | `NearbyResult`                        |
| `fetchDirections` | `GET /external/directions?originLat&originLng&destLat&destLng&mode&includePath=true` | 서버 응답을 `DirectionsResult`로 변환 |

길찾기는 `CAR` / `TRANSIT` / `WALK` / `BIKE`를 보내며 지도는 항상 `includePath=true`로 요청한다. 화면 시간은 **`totalDurationMin`** 기준이다. 대중교통의 도보 보정은 서버에서 수행하므로 프론트가 WALK를 추가 호출하지 않는다. `walkDurationMin: null`이면 **도보 시간 제외**를 표시한다. `summary`·`fare`·`steps`를 렌더링하고, `path`의 `[위도, 경도]`를 그대로 폴리라인으로 변환한다. 구간별 좌표를 임의로 만들지 않는다.

`api/directions.ts`에서 좌표 소수점 3자리 + mode를 키로 **1시간 메모리 캐시**와 진행 중 요청 공유를 적용한다. 캐시 조회는 TTL을 연장하지 않으며 실패 응답은 저장하지 않는다(경로 없음 결과는 캐시). `ROUTE_NOT_FOUND`(404)는 결과 없음과 [공식 카카오맵 길찾기 링크](https://apis.map.kakao.com/web/guide/#routeurl)를 제공한다. 사용자가 클릭할 때만 외부로 이동한다. 400·429·502·네트워크 실패는 안내 후 직접 재시도하도록 하고 자동 재요청하지 않는다.

### 8-1. 미확정 사항

- **`distanceKm`이 optional인 이유**: 목은 항상 채우지만 백엔드 `/onsens`가 거리를 붙여주는지 **아직 확인 안 됨.** 확인되면 `OnsenWithDistance`로 좁힌다
- **`Suggestion` 형태**: 시안이 없어 프론트에서 정했다. BE 검색 스펙이 정해지면 맞춘다
- POI 카테고리 6종의 **카카오 그룹코드 매핑은 서버가 들고 있다** — 프론트는 `CAFE`/`RESTAURANT`/… 문자열만 보낸다

### 8-2. 타입 규칙

`Onsen` 타입은 기능명세서 §4-2 스키마 기준이고, **명세에 없는 필드를 임의로 만들지 않는다.**

스펙 필드(`waterTempC`, `waterQuality`, `ph` 등)가 전부 optional인 이유: 출처가 행안부 온천현황이라 **505곳 중 일부만 값이 있다** (명세 §4: 86/93 매칭). UI는 값이 없는 경우를 항상 처리해야 한다 — `SearchResultItem`은 수질·수온이 없으면 태그로 대체하고, `Details`는 빈 행을 `rowsOf()`로 걸러낸다.

### 8-3. 목 모드

`env.useMock`(`VITE_USE_MOCK`)이 켜지면 각 API 함수가 `*Mock.ts`로 분기한다. 목 파일: `mapMock` · `poiMock` · `nearbyMock` · `reviewMock` · `directionsMock`.

목 모드에서만 보이는 것: 사이드바 추천 썸네일, `MockReviewList`.

---

## 9. 남은 작업

### 9-1. MAP-08 길찾기 (① 범위, UI·API 계약 반영)

- `DirectionsPanel`로 사이드바를 전환한다. 장소 검색 패널은 숨겨서 기존 검색어·지역을 보존한다
- `RoutePlaceInput`은 출발·도착 자동완성(200ms 디바운스, 키보드 선택, 캐시)을 제공한다. **실제 모드는 기존 `/onsens` 검색과 현재 위치를 사용한다(확정)**. 목 검색은 기존 온천과 서울역·강남역·수서역·부산역·제주공항을 지원한다
- 현재 위치 출발, 출발·도착 교환, 입력 초기화, 대중교통·자동차·도보·자전거 선택을 지원한다. 상세의 길찾기 또는 길찾기 모드의 지도 온천 클릭으로 도착지를 채운다
- `useDirections`가 명시적 조회·이동 수단 변경만 요청하고 API 계층에서 1시간 캐싱한다. 지도 팬·줌은 경로를 재조회하지 않는다. 입력 수정·초기화·탭 이탈은 진행 중 요청과 위치 조회의 UI 반영을 무효화한다
- 결과에 소요 시간·거리·대안 경로·이동 순서를 표시하고 `MapCanvas`에서 선택 경로의 `Polyline`과 출발·도착 표식을 그린다. 경로 교체·입력 수정·탭 이탈 시 지도 객체를 제거한다. 기존 초기 뷰포트 제한은 유지한다
- `directionsMock.ts`의 경로와 소요 시간은 **도로를 따르지 않는 화면 검토용 예시**다. 지도에 점선, 패널에 미리보기 안내를 표시한다. 본토↔제주 및 장거리 도보·자전거는 결과 없음 상태를 확인할 수 있다
- `types/directions.ts`는 화면용 모델이며 `api/directions.ts`에서 확정된 BE 응답을 검증·변환한다. 실제 응답은 단일 경로다. 실서버 오류 시 목 경로를 대신 표시하지 않는다

**남은 확인**: `VITE_USE_MOCK=false`와 실제 BE 주소로 4가지 수단의 통합 동작 확인. 계약 응답을 주입한 브라우저 검증은 완료(요청 형식·비인증·총 시간·도보 누락·요금·좌표 순서·오류·캐시 만료·모바일). REST 키는 서버에만 보관한다.

### 9-2. 그 외

- 사이드바 추천 묶음 실제 연동 (매거진)
- 찜 버튼 동작 (PAM-07 — 여행별 찜 목록 구조를 먼저 정해야 한다)
- 리뷰 탭 실서버 연동 (REV-*)
- `REGION_VIEWS` 좌표 확정

---

## 10. 작업 전 체크리스트

이 화면을 고치기 전에:

1. **`npm run build`로 검증한다.** `tsc`만으로는 놓치는 에러가 있다
2. 새 컴포넌트를 만들기 전에 `src/components/ui/`와 `src/features/map/components/`에 비슷한 게 있는지 본다
3. **공용 승격은 두 번째 사용 시점에.** 지도 전용이면 `features/map/`에 둔다
4. 컴포넌트에서 **`fetch`·`axios`를 직접 부르지 않는다.** `features/map/api/*` → 도메인 훅 경유
5. **모바일 ≥360px에서 깨지지 않는지 확인한다.** 가로 스크롤 금지
6. 7절의 쿼터 방어 4겹을 건드리는지 확인한다
7. 새 라이브러리 추가는 **먼저 제안하고 승인받는다** (프론트 2인 체제)
8. 명세 비고란에 물음표·논의 흔적이 있는 항목은 **구현 전에 질문한다**
