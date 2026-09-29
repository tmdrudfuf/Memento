"""Demo collection for store screenshots: python scripts/demo_seed.py en|ko OUT_DIR

Writes seed.sql (tables must exist: open the app once first) and copy.sh (copies art into the
app's media folder on the device). Uses the images from scripts/make_demo_art.py.
"""
import datetime
import sys
from pathlib import Path

lang = sys.argv[1] if len(sys.argv) > 1 else "en"
out = Path(sys.argv[2] if len(sys.argv) > 2 else "demo-seed")
out.mkdir(parents=True, exist_ok=True)
L = lambda en, ko: ko if lang == "ko" else en

today = datetime.datetime.now().replace(hour=19, minute=0, second=0, microsecond=0)
ms = lambda d: int(d.timestamp() * 1000)
boards = [L("Japan 2026", "일본 2026"), L("Us", "우리"), L("Family", "가족"), L("Cooking", "요리")]

# (board, art, title, note, date, related art)
memories = [
    (0, "ramen", L("Ramen Night", "라멘 먹은 밤"), L("The place with no English menu. Best bowl of the trip.", "영어 메뉴가 없던 그 가게. 여행 중 최고의 한 그릇."), datetime.datetime(2026, 3, 14, 21), ["city", "ticket", "tower"]),
    (0, "tower", L("Tokyo Tower", "도쿄 타워"), None, datetime.datetime(2026, 3, 15, 18), ["city"]),
    (0, "ticket", L("Shinkansen to Kyoto", "교토 가는 신칸센"), None, datetime.datetime(2026, 3, 17, 9), []),
    (0, "fuji", L("Mt. Fuji", "후지산"), L("Clouds cleared for ten minutes.", "딱 10분 동안 구름이 걷혔다."), datetime.datetime(2026, 3, 18, 11), ["snow"]),
    (0, "city", None, None, datetime.datetime(2026, 3, 16, 23), []),
    (1, "coffee", L("Our café", "우리 단골 카페"), None, datetime.datetime(2026, 5, 2, 15), ["flowers"]),
    (1, "beach", L("Sunset walk", "노을 산책"), L("We missed the last bus and walked anyway.", "막차를 놓치고 그냥 걸었던 날."), today.replace(year=today.year - 2), ["picnic"]),
    (1, "flowers", L("Anniversary", "기념일"), None, datetime.datetime(2025, 11, 20, 20), []),
    (2, "cake", L("Mom's birthday", "엄마 생일"), L("She cried at the candles.", "촛불 보고 엄마가 울었다."), datetime.datetime(2026, 6, 8, 19), ["flowers"]),
    (2, "snow", L("First snow", "첫눈"), None, today.replace(year=today.year - 1), []),
    (3, "pasta", L("First homemade pasta", "처음 만든 파스타"), None, datetime.datetime(2026, 4, 25, 19), ["coffee"]),
]

sql = ["BEGIN;", "DELETE FROM media; DELETE FROM memories; DELETE FROM jars;"]
cp = ["set -e", "M=$1", "mkdir -p $M"]
q = lambda v: "NULL" if v is None else "'" + v.replace("'", "''") + "'"
now = ms(today)
for i, b in enumerate(boards, 1):
    upd = now + (1000 if i == 3 else 0)  # Family = last used, so it leads the capture sheet
    sql.append(f"INSERT INTO jars (id, name, createdAt, updatedAt, position) VALUES ({i}, {q(b)}, {now}, {upd}, {i});")
n = 0
for mid, (b, art, title, note, d, related) in enumerate(memories, 1):
    n += 1
    cover = f"demo-{mid}-{art}.jpg"
    cp.append(f"cp /data/local/tmp/demo/{art}.jpg $M/{cover}")
    created = min(ms(d), now - 30 * 86400000) if d.year < today.year else ms(d)
    sql.append(
        f"INSERT INTO memories (id, jarId, cover, title, note, memoryDate, createdAt, updatedAt, openCount, lastOpenedAt) "
        f"VALUES ({mid}, {b + 1}, '{cover}', {q(title)}, {q(note)}, {ms(d)}, {created}, {created}, 1, {created});"
    )
    for k, r in enumerate(related):
        f = f"demo-{mid}-{k}-{r}.jpg"
        cp.append(f"cp /data/local/tmp/demo/{r}.jpg $M/{f}")
        sql.append(f"INSERT INTO media (memoryId, file, kind, createdAt) VALUES ({mid}, '{f}', 'photo', {created + k});")
sql += [
    "INSERT INTO settings (key, value) VALUES ('welcomed', '1') ON CONFLICT(key) DO UPDATE SET value = '1';",
    "INSERT INTO settings (key, value) VALUES ('boardOrder', 'custom') ON CONFLICT(key) DO UPDATE SET value = 'custom';",
    "INSERT INTO settings (key, value) VALUES ('devPremium', '1') ON CONFLICT(key) DO UPDATE SET value = '1';",
    "COMMIT;",
]
(out / "seed.sql").write_text("\n".join(sql) + "\n", encoding="utf-8", newline="\n")
(out / "copy.sh").write_text("\n".join(cp) + "\necho copied\n", encoding="utf-8", newline="\n")
print(lang, "memories", n)
