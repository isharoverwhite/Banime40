# banime40 — Keymap Diagrams (Mermaid)

Reference for user guide. All 5 layers.

---

## Layer Switching Overview

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Base
    Base --> Num_Sym   : hold SPC
    Base --> Fn_Media  : hold BSP
    Base --> Navigation : hold -
    Base --> System    : hold /
    Num_Sym    --> Base : release SPC
    Fn_Media   --> Base : release BSP
    Navigation --> Base : release -
    System     --> Base : release /
```

---

## Layer 0 — Base (QWERTY)

```mermaid
block-beta
  columns 10
  q["Q"]     w["W"]     e["E"]     r["R"]     t["T"]      y["Y"]       u["U"]     i["I"]     o["O"]     p["P"]
  a["A"]     s["S"]     d["D"]     f["F"]     g["G"]      h["H"]       j["J"]     k["K"]     l["L"]     nav["- / Nav"]
  z["Z"]     x["X"]     c["C"]     v["V"]     b["B"]      n["N"]       m["M"]     cm[","]    dt["."]    sys["/ / Sys"]
  lc["LCTL"] lg["LGUI"] la["LALT"] ls["LSFT"] fn["BSP/Fn"] nm["SPC/Num"] en["ENT"] ap["APP"] dl["DEL"]  es["ESC"]
```

---

## Layer 1 — Num / Sym (hold SPC)

```mermaid
block-beta
  columns 10
  n1["1"]    n2["2"]    n3["3"]    n4["4"]    n5["5"]    n6["6"]    n7["7"]    n8["8"]    n9["9"]    n0["0"]
  tb["TAB"]  _a["···"]  _b["···"]  gv["` "]   lb["["]    rb["]"]    bs["\\"]   sc[";"]    sq["'"]    mn["-"]
  _c["···"]  _d["···"]  _e["···"]  _f["···"]  eq["="]    mn2["-"]   _g["···"]  _h["···"]  _i["···"]  _j["···"]
  _k["···"]  _l["···"]  _m["···"]  _n["···"]  _o["···"]  ac1["▓▓▓"] _p["···"]  _q["···"]  _r["···"]  _s["···"]
```

---

## Layer 2 — Fn / Media (hold BSP)

```mermaid
block-beta
  columns 10
  f1["F1"]   f2["F2"]   f3["F3"]   f4["F4"]   f5["F5"]   f6["F6"]   f7["F7"]   f8["F8"]   f9["F9"]   f10["F10"]
  tb2["TAB"] f11["F11"] f12["F12"] _t["···"]  _u["···"]  _v["···"]  _w["···"]  _x["···"]  _y["···"]  _z["···"]
  cp["CAPS"] pr["PRT"]  sl["SCL"]  pu["PAU"]  _aa["···"] nu["NUM"]  _ab["···"] vm["VOL-"] vp["VOL+"] mu["MUTE"]
  _ac["···"] _ad["···"] _ae["···"] _af["···"] ac2["▓▓▓"] _ag["···"] _ah["···"] _ai["···"] _aj["···"] _ak["···"]
```

---

## Layer 3 — Navigation (hold -)

```mermaid
block-beta
  columns 10
  es3["ESC"]  _al["···"] _am["···"] _an["···"] _ao["···"] in3["INS"]  pu3["PgUp"] up3["↑"]   pd3["PgDn"] dl3["DEL"]
  tb3["TAB"]  _ap["···"] _aq["···"] _ar["···"] _as["···"] hm3["HOME"] lf3["←"]   dn3["↓"]   rg3["→"]    _at["···"]
  _au["···"]  _av["···"] _aw["···"] _ax["···"] _ay["···"] en3["END"]  _az["···"] _ba["···"] _bb["···"]  ac3["▓▓▓"]
  _bc["···"]  _bd["···"] _be["···"] _bf["···"] bp3["BSP"] _bg["···"] _bh["···"] _bi["···"] _bj["···"]  _bk["···"]
```

---

## Layer 4 — System / Bluetooth (hold /)

```mermaid
block-beta
  columns 10
  b1["BT 1"]  b2["BT 2"]  b3["BT 3"]  b4["BT 4"]  b5["BT 5"]  _bl["···"] _bm["···"] _bn["···"] _bo["···"] bc["BTCLR"]
  _bp["···"]  _bq["···"]  _br["···"]  _bs["···"]  _bt2["···"] _bu["···"] us["USB"]  bl["BLE"]  tg["TOG"]  _bv["···"]
  _bw["···"]  _bx["···"]  _by["···"]  _bz["···"]  _ca["···"]  _cb["···"] _cc["···"] _cd["···"] _ce["···"] ac4["▓▓▓"]
  _cf["···"]  _cg["···"]  _ch["···"]  _ci["···"]  _cj["···"]  _ck["···"] _cl["···"] _cm["···"] _cn["···"] _co["···"]
```

---

## Legend

| Symbol | Meaning |
|---|---|
| `▓▓▓` | Key đang giữ để kích hoạt layer này |
| `···` | Không có phím (transparent / none) |
| `X / Y` | Tap = X, Hold = Y |
| `BT 1–5` | Chọn Bluetooth profile 1–5 |
| `BTCLR` | Xóa bond Bluetooth profile hiện tại |
| `USB` | Ép output sang USB HID |
| `BLE` | Ép output sang BLE |
| `TOG` | Toggle USB ↔ BLE |
