# Closed test kit (Google Play)

## The rule
New **personal** Play developer accounts must run a **closed test with at least 12 testers who stay opted in for 14 days in a row** before the app can go to Production. It helps to invite **15–20 people**, because some forget to opt in or uninstall early.

The same two weeks double as the product test from `PRODUCT_ASSESSMENT.md` §5: do people make memories and come back to them?

## Owner setup (after the Play account exists), ~15 minutes
1. **Collect Gmail addresses:** 15–20 friends and family with Android phones. Testers need the Google account they use on their phone's Play Store.
2. **Create the track:** Play Console → Memento → Testing → Closed testing → Create track (name: `friends`).
3. **Add testers:** Testers → Create email list → paste the addresses.
4. **Upload the build:** Create release → upload the latest `memento-N.aab` from GitHub Releases → Save → Review → Start rollout.
5. **Share the link:** copy the **"Join on Android"** opt-in link and send it with the message below.
6. **Start the clock:** the 14 days count from when each tester opts in. Track it in the table at the bottom.

## Invite message (Korean)
```
안녕! 내가 만든 앱 "Memento" 테스트를 도와줄 수 있을까? 🙏

사진 한 장으로 추억 하나를 통째로 간직하는 앱이야.
(예: 여행에서 먹은 라멘 사진 → 그날의 사진, 영상, 메모가 다 그 안에)

1) 아래 링크를 휴대폰에서 열고 "테스터 되기"를 눌러줘
   👉 [초대 링크]
2) 같은 화면의 "Google Play에서 다운로드"로 설치
3) 2주 동안 자유롭게 써 줘. 기억하고 싶은 순간이 생기면 사진 한 장 붙이기!

⚠️ 구글 정책상 14일 동안 앱을 지우지 말아 줘 (안 써도 설치만 되어 있으면 돼)
2주 뒤에 짧은 질문 5개 보낼게. 고마워!
```

## Invite message (English)
```
Hi! Could you help me test my app "Memento"? 🙏

It keeps a whole memory behind one photo.
(e.g. a ramen photo from a trip → that day's photos, video and a note, all inside)

1) Open this link on your phone and tap "Become a tester"
   👉 [invite link]
2) Install it from the "Download it on Google Play" link on the same page
3) Use it however you like for 2 weeks. When a moment feels worth keeping, pin one photo!

⚠️ Google requires testers to keep the app installed for 14 days (you don't have to use it daily)
I'll send 5 short questions after two weeks. Thank you!
```

## Tester guide (optional second message)
- **First memory:** tap **+ Add a memory**, pick one photo, tap a board (name your first board, e.g. "Us" or "Summer"). Done.
- **Details later:** open a memory to add more photos or a video, a title, a date or a note.
- **Premium in the test build:** Premium screens can be seen, but test purchases are only possible for accounts added as license testers.
- **Problems or ideas:** use Settings → Help & support, or just message me.

## Feedback questions (after 14 days; Google Form or message)
Each question maps to the MVP success criteria (`PRODUCT_ASSESSMENT.md` §5).
1. How many memories did you create? (Settings shows the count.)
2. Did you open any memory again a week or more after saving it? (Settings → "Revisited after a week".)
3. For your favourite memory: **would you have made a Photos/Gallery album for it?** Yes / No / Maybe
4. Was saving a memory quick enough? What slowed you down?
5. What would make you keep using Memento? What almost made you stop?

**Kill signal to watch for:** many "I could just make an album" answers **and** fewer than 20% of memories reopened after 7 days (§5).

## Tracking
| # | Tester | Invited | Opted in (date) | Installed | Day 14 reached | Feedback |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |
| 11 | | | | | | |
| 12 | | | | | | |
| 13 | | | | | | |
| 14 | | | | | | |
| 15 | | | | | | |
