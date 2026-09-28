> Owner-provided monetization strategy (2026-09-28). "Photo Catcher" is now **Memento**. This document is the source of truth for pricing and Free/Premium boundaries; see ROADMAP.md for how it is built.

# Photo Catcher — Monetization Strategy

## 1. 기본 원칙

Photo Catcher의 수익 모델은 다음 세 가지를 사용한다.

**Free + Premium Subscription + Founder's Lifetime**

무료 사용자는 Photo Catcher의 핵심 경험인:

**Capture → Collect → Remember**

를 충분히 경험할 수 있어야 한다.

유료 기능은 Memory 생성을 막는 방식이 아니라 다음 가치를 확장하는 방향으로 설계한다.

**More → Protect → Together → Rediscover**

---

# 2. Free

**가격: $0**

Free 사용자는 Photo Catcher의 핵심 기능을 정상적으로 사용할 수 있다.

포함:

- Memory 최대 개수 제한 없음
- Memory Jar 최대 **3개**
- Symbolic Photo
- 관련 사진 추가
- 관련 영상 추가
- Memory Note
- Memory Detail
- 기본 Memory 탐색
- Local storage
- 기본 Rediscovery

### 광고

Free 버전에는 제한적으로 Google AdMob 광고를 표시한다.

광고 허용 화면:

- Home
- Memory Jar

기본 위치:

**화면 하단 Adaptive Banner**

광고 금지 화면:

- Capture
- Add Memory
- Memory Detail
- Photo Viewer
- Video Viewer
- Memory editing
- 개인적인 Memory 감상 과정

원칙:

> **Ads may exist around the collection, but never inside the memory.**

광고 때문에 Capture → Collect → Remember 흐름이 방해받아서는 안 된다.

---

# 3. Premium

### 가격

**$3.99 / month**

또는

**$29.99 / year**

연간 플랜을 기본 추천 플랜으로 사용한다.

Premium에는 다음 기능이 포함된다.

### Unlimited Jars

Memory Jar 개수 제한 제거.

### No Ads

모든 광고 제거.

### Cloud Backup

Memory와 관련 데이터를 안전하게 백업하고 복원할 수 있다.

구현 방식에 따라 실제 원본 미디어와 Photo Catcher metadata의 백업 범위는 별도로 정의한다.

### Device Sync

지원되는 기기 간 Memory Collection 동기화.

### Shared Jars

커플, 가족, 친구와 Memory Jar를 공유할 수 있다.

기본 정책:

> **Premium owner can invite Free users.**

초대받은 사용자가 Shared Jar에 참여하기 위해 반드시 Premium을 구매하도록 강제하지 않는다.

Shared Jar 자체가 자연스러운 사용자 유입 경로가 될 수 있도록 한다.

### Smart Memory Organization

AI를 이용하여 기존 사진 중 현재 Memory와 관련 있을 가능성이 높은 사진을 제안한다.

예:

> You took 8 other photos around this time and place.
> Add them to this Memory?

AI는 사용자의 Memory를 대신 생성하는 것이 아니라 정리를 돕는다.

### Advanced Rediscovery

기존 Memory를 자연스럽게 다시 발견하게 한다.

예:

> Remember this?

> 2 years ago today

> This week in 2027

### Yearly Recap

한 해 동안 수집한 Memory를 기반으로 개인적인 연간 회고 경험을 제공한다.

예:

**Your 2027 in Memories**

Yearly Recap은 단순 사진 slideshow보다 사용자가 직접 선택한 Memory Objects를 중심으로 구성한다.

---

# 4. Founder's Lifetime

초기 사용자에게 제한적으로 제공한다.

### 가격

**$59.99 one-time**

초기 출시 또는 Early Access 기간 동안 제공한다.

향후 제품 성장에 따라 Lifetime 판매를 종료할 수 있다.

Founder's Lifetime에는 다음이 포함된다.

- Unlimited Jars
- No Ads
- Shared Jars
- Advanced Rediscovery
- Yearly Recap
- 대부분의 향후 core Premium 기능

### Cloud / AI 정책

Cloud storage와 AI inference처럼 지속적인 서버 비용이 발생하는 기능은 무제한 평생 사용을 보장하지 않는다.

합리적인 usage allowance 또는 fair-use 정책을 적용할 수 있다.

Lifetime의 핵심 의미는:

> **Permanent access to Photo Catcher's core premium experience.**

이지 무제한 서버 리소스 제공이 아니다.

---

# 5. Feature Matrix

| Feature | Free | Premium | Founder's Lifetime |
|---|---|---|---|
| Memories | Unlimited | Unlimited | Unlimited |
| Memory Jars | 3 | Unlimited | Unlimited |
| Symbolic Photo | ✓ | ✓ | ✓ |
| Photos / Videos | ✓ | ✓ | ✓ |
| Notes | ✓ | ✓ | ✓ |
| Local Storage | ✓ | ✓ | ✓ |
| Basic Rediscovery | ✓ | ✓ | ✓ |
| Ads | Yes | No | No |
| Cloud Backup | — | ✓ | Fair-use |
| Device Sync | — | ✓ | Fair-use |
| Shared Jars | — | ✓ | ✓ |
| AI Organization | — | ✓ | Fair-use |
| Advanced Rediscovery | — | ✓ | ✓ |
| Yearly Recap | — | ✓ | ✓ |

---

# 6. Paywall Philosophy

Photo Catcher를 처음 실행했을 때 즉시 Paywall을 표시하지 않는다.

사용자는 먼저 핵심 경험을 이해해야 한다.

**Create → Capture → Collect → Remember**

이 경험을 하기 전에 결제를 요구하지 않는다.

Paywall은 Premium 기능을 실제로 필요로 하는 순간에 표시한다.

대표적인 Trigger:

### Fourth Jar

사용자가 네 번째 Memory Jar를 만들려고 할 때.

### Cloud Backup

Cloud Backup을 활성화하려 할 때.

### Shared Jar

새로운 Shared Jar를 만들거나 공유 기능을 사용하려 할 때.

### AI Organization

Smart Memory Organization을 사용하려 할 때.

### Yearly Recap

Premium Recap 기능을 사용할 때.

---

# 7. Fourth Jar Paywall

Free 사용자는 최대 3개의 Jar를 만들 수 있다.

네 번째 Jar 생성 시:

> **Your memories are growing.**
>
> You've filled your three free Memory Jars.
>
> Keep collecting with unlimited Jars.

Premium의 주요 혜택을 함께 보여준다.

- Unlimited Jars
- No Ads
- Backup
- Shared Jars
- Smart Organization
- Yearly Recap

기존 Memory나 Jar에는 계속 접근할 수 있어야 한다.

Premium 해지 또는 결제 실패 때문에 기존 Memory를 볼 수 없게 만들어서는 안 된다.

---

# 8. Advertising Philosophy

광고는 Photo Catcher의 핵심 수익원이 아니다.

수익 우선순위는:

**Premium Subscription → Lifetime Purchase → Advertising**

광고의 목적은 Free 사용자의 일부 운영 비용을 보조하는 것이다.

따라서 광고 노출을 극대화하기 위해 사용자 경험을 훼손하지 않는다.

사용하지 않는 광고 형태:

- Interstitial ads
- App-open ads
- Forced video ads
- Rewarded ads
- Memory 사이에 삽입되는 광고
- Capture 이후 표시되는 광고
- Photo Viewer 광고
- Memory Detail 광고

Free 사용자는 광고를 보더라도 Photo Catcher가 광고 중심 앱이라고 느껴서는 안 된다.

---

# 9. Ad Placement

초기 광고 위치는 다음 두 곳으로 제한한다.

### Home

Memory Jar collection 아래에 Adaptive Banner.

### Jar

Memory collection 아래에 Adaptive Banner.

가능하면 콘텐츠를 가리지 않고 layout 일부로 자연스럽게 존재하도록 한다.

상단 광고보다 **하단 배치**를 기본값으로 한다.

---

# 10. Monetization UX Principle

Photo Catcher에서 사용자가 돈을 지불하는 이유는:

> **기억을 만들기 위해서가 아니라, 기억의 컬렉션이 커졌기 때문이다.**

Free 사용자는 Memory를 자유롭게 만들 수 있다.

시간이 지나면서:

3 Jars → 더 많은 Memories → 더 많은 Jars 필요 → Backup 필요 → Shared Memories 필요 → Rediscovery 가치 증가 → Premium 가치 증가

라는 자연스러운 progression을 목표로 한다.

---

# 11. Core Monetization Statement

Photo Catcher의 핵심 경험은 무료다.

**Capture → Collect → Remember**

Premium은 그 경험을 확장한다.

**Collect More → Protect → Share → Rediscover**

광고는 무료 사용자의 경험 주변에만 존재한다.

> **Ads around memories, never inside memories.**

그리고 사용자가 몇 년 동안 Memory Collection을 쌓을수록 Premium의 가치도 자연스럽게 증가하도록 설계한다.
