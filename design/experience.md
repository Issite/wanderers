Things that give a tribe experience points:
- Opening a crate (1)
- Killing a rabbit (1)
- Killing a tribesman (see below)

```javascript
// From the original client-side code
COMMON.getTribeScore = function(tribe) {
    let score = 0;
    for (let m of tribe.members)
        score += this.getTribesmanScore(m);
    return score;
};
COMMON.getTribesmanScore = function(who) {
    let score = 1;
    score += who.weaponDef.cost | 0; // 2, mostly
    score += who.helmetDef.cost | 0;
    score += who.shieldDef.cost | 0;
    return Math.max(1, score);
};
COMMON.levelTable = [];
{
    let current = 0;
    for (let i = 0; i < 100; i++) {
        COMMON.levelTable.push(i * (2 + i * 0.25) | 0);
    }
}
COMMON.levelToExp = function(level) {
    return COMMON.levelTable[level]
};
```