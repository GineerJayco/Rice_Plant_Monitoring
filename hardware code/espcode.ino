#include <WiFi.h>
#include "time.h"
#include "RTClib.h"
#include "DHT.h"

// ============================================================
//  DHT22
// ============================================================
#define DHTPIN  4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// ============================================================
//  ULTRASONIC SENSORS (water level in pot, per group)
// ============================================================
#define TRIG1 5
#define ECHO1 18
#define TRIG2 19
#define ECHO2 23

// ============================================================
//  SOIL MOISTURE SENSORS (one per plant, analog ADC)
//  ADC range: 0 (wet) → 4095 (dry), converted internally to 0–100%
//  Plant:       1     2     3     4     5     6
// ============================================================
const int SOIL_PINS[7] = {0, 34, 35, 36, 39, 13, 12};

// ============================================================
//  RELAY PINS (pumps) — LOW = ON, HIGH = OFF
// ============================================================
const int RELAY_PINS[7] = {0, 32, 33, 14, 16, 2, 15};

// ============================================================
//  STEPPER MOTOR
// ============================================================
#define STEP_PIN        25
#define DIR_PIN         26
#define ENA_PIN         27
#define DIR_FORWARD     HIGH
#define DIR_BACKWARD    LOW
#define STEP_DELAY_US   4000
#define MOTOR_SETTLE_MS 300
const int NUM_PLANTS = 6;
const int PLANT_POSITIONS[7] = {0, 0, 500, 1000, 1500, 2000, 2500};
int currentStepPosition = 0;

// ============================================================
//  SENSOR CALIBRATION & OFFSET VALUES
//
//  HOW TO CALIBRATE:
//  ─────────────────
//  ULTRASONIC:
//    Pour water to exactly your known depth (e.g. 2.0 cm).
//    Read the raw value from Serial Monitor.
//    offset = known_depth - raw_reading
//    Example: sensor reads 2.4 cm but actual is 2.0 cm → offset = -0.4
//
//  SOIL MOISTURE:
//    SOIL_ADC_WET → submerge sensor fully in water, note ADC from Serial Monitor
//    SOIL_ADC_DRY → hold sensor in dry air,         note ADC from Serial Monitor
//    SOIL_OFFSET_PCT → fine-tune per plant after comparing % to a reference
//    Example: sensor reads 48% but soil is actually 50% → offset = +2.0
//
//  DHT22:
//    Compare against a calibrated reference thermometer/hygrometer.
//    offset = actual_value - sensor_reading
//    Example: sensor reads 32.5°C but actual is 31.0°C → TEMP_OFFSET = -1.5
//
//  ▼▼▼ SET YOUR VALUES HERE ▼▼▼
// ============================================================

// --- ULTRASONIC OFFSET (cm) ---
#define ULTRASONIC_OFFSET_1   0.0   // sensor 1 (plants 1–3): set offset here
#define ULTRASONIC_OFFSET_2   0.0   // sensor 2 (plants 4–6): set offset here

// --- SOIL MOISTURE ADC CALIBRATION ---
// Calibrate by placing sensor in water (wet) and dry air (dry)
// and reading the raw ADC values from Serial Monitor.
#define SOIL_ADC_WET   1000   // ADC when sensor is fully submerged in water → = 100%
#define SOIL_ADC_DRY   3500   // ADC when sensor is in completely dry air    → = 0%

// Per-plant fine-tune offset in percentage points (applied after ADC→% conversion)
const float SOIL_OFFSET_PCT[7] = {
  0.0,   // [0] unused
  0.0,   // [1] plant 1: set offset here (e.g. +2.0 or -1.5)
  0.0,   // [2] plant 2: set offset here
  0.0,   // [3] plant 3: set offset here
  0.0,   // [4] plant 4: set offset here
  0.0,   // [5] plant 5: set offset here
  0.0    // [6] plant 6: set offset here
};

// --- DHT22 OFFSET ---
#define TEMP_OFFSET   0.0   // °C:  set offset here (e.g. -1.5 if reads too high)
#define HUM_OFFSET    0.0   // %RH: set offset here (e.g. +2.0 if reads too low)

// ▲▲▲ END OF CALIBRATION SECTION ▲▲▲

// ============================================================
//  FUZZY MEMBERSHIP BOUNDARIES
//  (linguistic universe of discourse for each input)
// ============================================================

// --- WATER LEVEL (cm depth in pot, after offset) ---
//  LOW  = sufficient water  (>= W_LOW_MAX)
//  MED  = transitioning     (W_HIGH_MIN to W_LOW_MAX)
//  HIGH = critically shallow (<= W_HIGH_MIN)
#define W_LOW_MAX   3.0   // >= 3 cm → LOW urgency  (pump OFF zone)
#define W_HIGH_MIN  2.0   // <= 2 cm → HIGH urgency (pump ON zone)

// --- SOIL MOISTURE (%, 100=wet, 0=dry, after calibration + offset) ---
//  WET   = soil has enough moisture  (>= S_WET_PCT)
//  MOIST = moderate moisture         (between S_DRY_PCT and S_WET_PCT)
//  DRY   = soil needs water          (<= S_DRY_PCT)
#define S_WET_PCT    70.0   // >= 70% → WET   (no watering needed)
#define S_MOIST_MID  52.5   // midpoint of moist range (for triangular MF)
#define S_DRY_PCT    35.0   // <= 35% → DRY   (watering urgent)

// --- HUMIDITY (%, after offset) ---
//  HUMID = air has enough moisture   (>= H_HUMID_MAX)
//  MOD   = moderate humidity         (between H_DRY_MIN and H_HUMID_MAX)
//  DRY   = air is dry, high evap     (<= H_DRY_MIN)
#define H_HUMID_MAX  75.0   // >= 75% → HUMID
#define H_MOD_MID    60.0   // midpoint for triangular MF
#define H_DRY_MIN    45.0   // <= 45% → DRY

// --- TEMPERATURE (°C, after offset) ---
//  COOL = low stress  (<= T_COOL_MAX)
//  WARM = moderate    (between T_COOL_MAX and T_HOT_MIN)
//  HOT  = high stress (>= T_HOT_MIN)
#define T_COOL_MAX  28.0   // <= 28°C → COOL
#define T_WARM_MID  31.0   // midpoint for triangular MF
#define T_HOT_MIN   34.0   // >= 34°C → HOT

// ============================================================
//  OUTPUT PUMP ACTION LEVELS (defuzzified crisp values, 0.0–1.0)
//
//  OFF      = 0.00  do not pump
//  WEAK     = 0.25  brief pump pulse
//  MODERATE = 0.50  normal watering
//  STRONG   = 0.75  extended watering
//  FULL     = 1.00  maximum watering
//
//  The relay (binary) trips when the defuzzified output
//  reaches PUMP_ON_THRESHOLD. Adjust to tune sensitivity.
// ============================================================
#define PUMP_ON_THRESHOLD  0.40

// ============================================================
//  GLOBALS
// ============================================================
bool plantHealthy[7] = {false, true, true, true, true, true, true};

#define SENSOR_INTERVAL 10000
unsigned long lastSensorMillis = 0;

RTC_DS3231 rtc;

// ============================================================
//  SENSOR READING FUNCTIONS (offset applied inside)
// ============================================================

float readDistance(int trigPin, int echoPin, float offset) {
  digitalWrite(trigPin, LOW);  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH); delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) return 0.0; // timeout = sensor submerged/blocked → treat as full
  float raw = duration * 0.034 / 2.0;
  return max(0.0f, raw + offset);
}

// ADC → moisture % (100=wet, 0=dry) then per-plant offset applied
float readSoilPct(int plantNum) {
  int raw = analogRead(SOIL_PINS[plantNum]);
  float pct = (float)(SOIL_ADC_DRY - raw) / (float)(SOIL_ADC_DRY - SOIL_ADC_WET) * 100.0;
  return constrain(pct + SOIL_OFFSET_PCT[plantNum], 0.0, 100.0);
}

void readDHT(float &humidity, float &tempC) {
  humidity = constrain(dht.readHumidity()    + HUM_OFFSET,  0.0, 100.0);
  tempC    =           dht.readTemperature() + TEMP_OFFSET;
}

void pumpON(int p)  { if (p >= 1 && p <= 6) digitalWrite(RELAY_PINS[p], LOW);  }
void pumpOFF(int p) { if (p >= 1 && p <= 6) digitalWrite(RELAY_PINS[p], HIGH); }

// ============================================================
//  FUZZIFICATION — triangular / trapezoidal membership functions
//  Each function returns three membership degrees (0.0–1.0)
//  for the three linguistic levels of that input.
// ============================================================

// Water depth (cm): LOW = ok, MED = borderline, HIGH = shallow/urgent
void fuzzifyWater(float cm, float &mLow, float &mMed, float &mHigh) {
  // LOW  — trapezoidal, full at >= W_LOW_MAX
  mLow  = constrain((cm - W_HIGH_MIN) / (W_LOW_MAX - W_HIGH_MIN), 0.0, 1.0);
  // HIGH — trapezoidal, full at <= W_HIGH_MIN
  mHigh = constrain((W_LOW_MAX - cm)  / (W_LOW_MAX - W_HIGH_MIN), 0.0, 1.0);
  // MED  — triangular peak at midpoint
  float mid = (W_HIGH_MIN + W_LOW_MAX) / 2.0;
  mMed  = constrain(1.0 - fabs(cm - mid) / ((W_LOW_MAX - W_HIGH_MIN) / 2.0), 0.0, 1.0);
}

// Soil moisture (%): WET = ok, MOIST = moderate, DRY = urgent
void fuzzifySoil(float pct, float &mWet, float &mMoist, float &mDry) {
  // WET  — trapezoidal, full at >= S_WET_PCT
  mWet   = constrain((pct - S_DRY_PCT)  / (S_WET_PCT - S_DRY_PCT),  0.0, 1.0);
  // DRY  — trapezoidal, full at <= S_DRY_PCT
  mDry   = constrain((S_WET_PCT - pct)  / (S_WET_PCT - S_DRY_PCT),  0.0, 1.0);
  // MOIST — triangular peak at S_MOIST_MID
  mMoist = constrain(1.0 - fabs(pct - S_MOIST_MID) / ((S_WET_PCT - S_DRY_PCT) / 2.0), 0.0, 1.0);
}

// Humidity (%): HUMID = ok, MOD = moderate, DRY = urgent
void fuzzifyHumidity(float rh, float &mHumid, float &mMod, float &mDry) {
  // HUMID — trapezoidal, full at >= H_HUMID_MAX
  mHumid = constrain((rh - H_DRY_MIN)        / (H_HUMID_MAX - H_DRY_MIN), 0.0, 1.0);
  // DRY   — trapezoidal, full at <= H_DRY_MIN
  mDry   = constrain((H_HUMID_MAX - rh)       / (H_HUMID_MAX - H_DRY_MIN), 0.0, 1.0);
  // MOD   — triangular peak at H_MOD_MID
  mMod   = constrain(1.0 - fabs(rh - H_MOD_MID) / ((H_HUMID_MAX - H_DRY_MIN) / 2.0), 0.0, 1.0);
}

// Temperature (°C): COOL = ok, WARM = moderate, HOT = urgent
void fuzzifyTemp(float t, float &mCool, float &mWarm, float &mHot) {
  // COOL — trapezoidal, full at <= T_COOL_MAX
  mCool = constrain((T_HOT_MIN - t)         / (T_HOT_MIN - T_COOL_MAX), 0.0, 1.0);
  // HOT  — trapezoidal, full at >= T_HOT_MIN
  mHot  = constrain((t - T_COOL_MAX)        / (T_HOT_MIN - T_COOL_MAX), 0.0, 1.0);
  // WARM — triangular peak at T_WARM_MID
  mWarm = constrain(1.0 - fabs(t - T_WARM_MID) / ((T_HOT_MIN - T_COOL_MAX) / 2.0), 0.0, 1.0);
}

// ============================================================
//  RULE ACCUMULATOR — Mamdani fuzzy inference
//  AND operator = min() of all four antecedent memberships.
//  Accumulates weighted sum for centroid defuzzification.
// ============================================================
void rule(float w, float s, float h, float t, float output,
          float &sumNum, float &sumDen) {
  float strength = min(min(w, s), min(h, t));
  sumNum += strength * output;
  sumDen += strength;
}

// ============================================================
//  COMPLETE 81-RULE FUZZY INFERENCE TABLE
//
//  Inputs  (all post-offset):
//    cm    — water depth in pot (cm)
//    pct   — soil moisture (%, 100=wet 0=dry)
//    rh    — relative humidity (%)
//    tempC — air temperature (°C)
//
//  Antecedent notation used in comments:
//    W:  wL = Water LOW (sufficient, ≥3 cm)
//        wM = Water MED (borderline, 2–3 cm)
//        wH = Water HIGH (shallow, ≤2 cm)  ← triggers pump
//    S:  sW = Soil WET (≥70%)
//        sMo= Soil MOIST (35–70%)
//        sD = Soil DRY (≤35%)              ← triggers pump
//    H:  hHu= Humidity HUMID (≥75%)
//        hMd= Humidity MODERATE (45–75%)
//        hDr= Humidity DRY (≤45%)          ← increases evaporation
//    T:  tC = Temp COOL (≤28°C)
//        tWa= Temp WARM (28–34°C)
//        tHo= Temp HOT (≥34°C)             ← increases water demand
//
//  Output levels (crisp, centroid defuzzification):
//    0.00 = OFF       — no watering needed
//    0.25 = WEAK      — minimal watering
//    0.50 = MODERATE  — normal watering
//    0.75 = STRONG    — extended watering
//    1.00 = FULL      — maximum watering
//
//  General design rationale:
//    • Sheath Blight detected → HARD OFF (no fuzzy override possible)
//    • All conditions favorable         → OFF
//    • 1 mild stress factor             → WEAK at most
//    • 2 moderate stress factors        → MODERATE
//    • 3 stress factors                 → STRONG
//    • All 4 inputs stressed            → FULL
//    • Water HIGH alone forces at least MODERATE (pot must be refilled)
//    • Soil WET suppresses pump even when environment is harsh
// ============================================================

float evaluateFuzzyRules(float cm, float pct, float rh, float tempC) {

  // ── Step 1: Fuzzify all four inputs ────────────────────────
  float wL,  wM,  wH;          // water memberships
  float sW,  sMo, sD;          // soil memberships
  float hHu, hMd, hDr;         // humidity memberships
  float tC,  tWa, tHo;         // temperature memberships

  fuzzifyWater(cm,    wL,  wM,  wH);
  fuzzifySoil(pct,    sW,  sMo, sD);
  fuzzifyHumidity(rh, hHu, hMd, hDr);
  fuzzifyTemp(tempC,  tC,  tWa, tHo);

  float sumNum = 0.0, sumDen = 0.0;

  // ── Step 2: Evaluate all 81 rules ──────────────────────────
  //
  // Rules are grouped by water level (3 blocks × 27 rules each).
  // Within each block, soil varies slowest (outer), then humidity,
  // then temperature (innermost). This gives the full 3×3×3×3 = 81.

  // ══════════════════════════════════════════════════════════
  //  BLOCK A — Water LOW (sufficient, pot ≥ 3 cm)
  //  Water is not a stress factor. Pump driven by soil + env.
  // ══════════════════════════════════════════════════════════

  // A1: W=LOW, S=WET — soil and water both fine, env decides
  // IF W=Low AND S=Wet AND H=Humid AND T=Cool  → OFF
  rule(wL, sW, hHu, tC,  0.00, sumNum, sumDen);
  // IF W=Low AND S=Wet AND H=Humid AND T=Warm  → OFF
  rule(wL, sW, hHu, tWa, 0.00, sumNum, sumDen);
  // IF W=Low AND S=Wet AND H=Humid AND T=Hot   → OFF   (soil wet buffers heat)
  rule(wL, sW, hHu, tHo, 0.00, sumNum, sumDen);
  // IF W=Low AND S=Wet AND H=Mod   AND T=Cool  → OFF
  rule(wL, sW, hMd, tC,  0.00, sumNum, sumDen);
  // IF W=Low AND S=Wet AND H=Mod   AND T=Warm  → OFF
  rule(wL, sW, hMd, tWa, 0.00, sumNum, sumDen);
  // IF W=Low AND S=Wet AND H=Mod   AND T=Hot   → OFF   (soil still wet)
  rule(wL, sW, hMd, tHo, 0.00, sumNum, sumDen);
  // IF W=Low AND S=Wet AND H=Dry   AND T=Cool  → OFF
  rule(wL, sW, hDr, tC,  0.00, sumNum, sumDen);
  // IF W=Low AND S=Wet AND H=Dry   AND T=Warm  → OFF
  rule(wL, sW, hDr, tWa, 0.00, sumNum, sumDen);
  // IF W=Low AND S=Wet AND H=Dry   AND T=Hot   → WEAK  (high evap risk, pre-empt)
  rule(wL, sW, hDr, tHo, 0.25, sumNum, sumDen);

  // A2: W=LOW, S=MOIST — soil moderate, environment drives decision
  // IF W=Low AND S=Moist AND H=Humid AND T=Cool  → OFF
  rule(wL, sMo, hHu, tC,  0.00, sumNum, sumDen);
  // IF W=Low AND S=Moist AND H=Humid AND T=Warm  → OFF
  rule(wL, sMo, hHu, tWa, 0.00, sumNum, sumDen);
  // IF W=Low AND S=Moist AND H=Humid AND T=Hot   → WEAK  (1 env stress)
  rule(wL, sMo, hHu, tHo, 0.25, sumNum, sumDen);
  // IF W=Low AND S=Moist AND H=Mod   AND T=Cool  → OFF
  rule(wL, sMo, hMd, tC,  0.00, sumNum, sumDen);
  // IF W=Low AND S=Moist AND H=Mod   AND T=Warm  → WEAK  (2 mild stresses)
  rule(wL, sMo, hMd, tWa, 0.25, sumNum, sumDen);
  // IF W=Low AND S=Moist AND H=Mod   AND T=Hot   → MODERATE (2 env stresses)
  rule(wL, sMo, hMd, tHo, 0.50, sumNum, sumDen);
  // IF W=Low AND S=Moist AND H=Dry   AND T=Cool  → WEAK  (1 env stress)
  rule(wL, sMo, hDr, tC,  0.25, sumNum, sumDen);
  // IF W=Low AND S=Moist AND H=Dry   AND T=Warm  → MODERATE (2 env stresses)
  rule(wL, sMo, hDr, tWa, 0.50, sumNum, sumDen);
  // IF W=Low AND S=Moist AND H=Dry   AND T=Hot   → MODERATE (2 env stresses + moist)
  rule(wL, sMo, hDr, tHo, 0.50, sumNum, sumDen);

  // A3: W=LOW, S=DRY — soil is dry, pump needed despite good water level
  // IF W=Low AND S=Dry AND H=Humid AND T=Cool  → WEAK    (only soil dry)
  rule(wL, sD, hHu, tC,  0.25, sumNum, sumDen);
  // IF W=Low AND S=Dry AND H=Humid AND T=Warm  → MODERATE (soil + temp)
  rule(wL, sD, hHu, tWa, 0.50, sumNum, sumDen);
  // IF W=Low AND S=Dry AND H=Humid AND T=Hot   → MODERATE (soil + temp stress)
  rule(wL, sD, hHu, tHo, 0.50, sumNum, sumDen);
  // IF W=Low AND S=Dry AND H=Mod   AND T=Cool  → MODERATE (soil + humidity)
  rule(wL, sD, hMd, tC,  0.50, sumNum, sumDen);
  // IF W=Low AND S=Dry AND H=Mod   AND T=Warm  → MODERATE (3 mild stresses)
  rule(wL, sD, hMd, tWa, 0.50, sumNum, sumDen);
  // IF W=Low AND S=Dry AND H=Mod   AND T=Hot   → STRONG   (3 stresses)
  rule(wL, sD, hMd, tHo, 0.75, sumNum, sumDen);
  // IF W=Low AND S=Dry AND H=Dry   AND T=Cool  → MODERATE (soil + air dry)
  rule(wL, sD, hDr, tC,  0.50, sumNum, sumDen);
  // IF W=Low AND S=Dry AND H=Dry   AND T=Warm  → STRONG   (3 stresses)
  rule(wL, sD, hDr, tWa, 0.75, sumNum, sumDen);
  // IF W=Low AND S=Dry AND H=Dry   AND T=Hot   → STRONG   (3 major stresses)
  rule(wL, sD, hDr, tHo, 0.75, sumNum, sumDen);

  // ══════════════════════════════════════════════════════════
  //  BLOCK B — Water MED (borderline, pot 2–3 cm)
  //  Water is a mild stress. Other factors compound urgency.
  // ══════════════════════════════════════════════════════════

  // B1: W=MED, S=WET — water borderline but soil ok
  // IF W=Med AND S=Wet AND H=Humid AND T=Cool  → OFF    (only water slightly low)
  rule(wM, sW, hHu, tC,  0.00, sumNum, sumDen);
  // IF W=Med AND S=Wet AND H=Humid AND T=Warm  → OFF
  rule(wM, sW, hHu, tWa, 0.00, sumNum, sumDen);
  // IF W=Med AND S=Wet AND H=Humid AND T=Hot   → WEAK   (water low + heat)
  rule(wM, sW, hHu, tHo, 0.25, sumNum, sumDen);
  // IF W=Med AND S=Wet AND H=Mod   AND T=Cool  → OFF
  rule(wM, sW, hMd, tC,  0.00, sumNum, sumDen);
  // IF W=Med AND S=Wet AND H=Mod   AND T=Warm  → WEAK   (2 mild stresses)
  rule(wM, sW, hMd, tWa, 0.25, sumNum, sumDen);
  // IF W=Med AND S=Wet AND H=Mod   AND T=Hot   → WEAK   (2 stresses, soil wet dampens)
  rule(wM, sW, hMd, tHo, 0.25, sumNum, sumDen);
  // IF W=Med AND S=Wet AND H=Dry   AND T=Cool  → WEAK   (water + air dry)
  rule(wM, sW, hDr, tC,  0.25, sumNum, sumDen);
  // IF W=Med AND S=Wet AND H=Dry   AND T=Warm  → WEAK   (2 stresses)
  rule(wM, sW, hDr, tWa, 0.25, sumNum, sumDen);
  // IF W=Med AND S=Wet AND H=Dry   AND T=Hot   → MODERATE (3 stresses, soil wet helps)
  rule(wM, sW, hDr, tHo, 0.50, sumNum, sumDen);

  // B2: W=MED, S=MOIST — both water and soil are borderline
  // IF W=Med AND S=Moist AND H=Humid AND T=Cool  → OFF    (env ok)
  rule(wM, sMo, hHu, tC,  0.00, sumNum, sumDen);
  // IF W=Med AND S=Moist AND H=Humid AND T=Warm  → WEAK   (2 mild stresses)
  rule(wM, sMo, hHu, tWa, 0.25, sumNum, sumDen);
  // IF W=Med AND S=Moist AND H=Humid AND T=Hot   → MODERATE (water + soil + heat)
  rule(wM, sMo, hHu, tHo, 0.50, sumNum, sumDen);
  // IF W=Med AND S=Moist AND H=Mod   AND T=Cool  → WEAK   (2 mild stresses)
  rule(wM, sMo, hMd, tC,  0.25, sumNum, sumDen);
  // IF W=Med AND S=Moist AND H=Mod   AND T=Warm  → MODERATE (3 mild stresses)
  rule(wM, sMo, hMd, tWa, 0.50, sumNum, sumDen);
  // IF W=Med AND S=Moist AND H=Mod   AND T=Hot   → MODERATE (3 stresses)
  rule(wM, sMo, hMd, tHo, 0.50, sumNum, sumDen);
  // IF W=Med AND S=Moist AND H=Dry   AND T=Cool  → MODERATE (water + soil + dry air)
  rule(wM, sMo, hDr, tC,  0.50, sumNum, sumDen);
  // IF W=Med AND S=Moist AND H=Dry   AND T=Warm  → MODERATE (3 stresses)
  rule(wM, sMo, hDr, tWa, 0.50, sumNum, sumDen);
  // IF W=Med AND S=Moist AND H=Dry   AND T=Hot   → STRONG   (all 4 inputs stressed)
  rule(wM, sMo, hDr, tHo, 0.75, sumNum, sumDen);

  // B3: W=MED, S=DRY — water borderline + soil dry = significant urgency
  // IF W=Med AND S=Dry AND H=Humid AND T=Cool  → MODERATE (water + soil dry)
  rule(wM, sD, hHu, tC,  0.50, sumNum, sumDen);
  // IF W=Med AND S=Dry AND H=Humid AND T=Warm  → MODERATE (3 stresses)
  rule(wM, sD, hHu, tWa, 0.50, sumNum, sumDen);
  // IF W=Med AND S=Dry AND H=Humid AND T=Hot   → STRONG   (water + soil + heat)
  rule(wM, sD, hHu, tHo, 0.75, sumNum, sumDen);
  // IF W=Med AND S=Dry AND H=Mod   AND T=Cool  → MODERATE (water + soil + humidity)
  rule(wM, sD, hMd, tC,  0.50, sumNum, sumDen);
  // IF W=Med AND S=Dry AND H=Mod   AND T=Warm  → STRONG   (3–4 stresses)
  rule(wM, sD, hMd, tWa, 0.75, sumNum, sumDen);
  // IF W=Med AND S=Dry AND H=Mod   AND T=Hot   → STRONG   (all stressed)
  rule(wM, sD, hMd, tHo, 0.75, sumNum, sumDen);
  // IF W=Med AND S=Dry AND H=Dry   AND T=Cool  → STRONG   (3 stresses)
  rule(wM, sD, hDr, tC,  0.75, sumNum, sumDen);
  // IF W=Med AND S=Dry AND H=Dry   AND T=Warm  → STRONG   (all 4 stressed)
  rule(wM, sD, hDr, tWa, 0.75, sumNum, sumDen);
  // IF W=Med AND S=Dry AND H=Dry   AND T=Hot   → FULL     (critical: all stressed)
  rule(wM, sD, hDr, tHo, 1.00, sumNum, sumDen);

  // ══════════════════════════════════════════════════════════
  //  BLOCK C — Water HIGH (critically shallow, pot ≤ 2 cm)
  //  Water is critically low. Pot must be refilled.
  //  Even with wet soil, pump ON at least MODERATE to restore water.
  // ══════════════════════════════════════════════════════════

  // C1: W=HIGH, S=WET — pot nearly empty but soil still wet
  // IF W=High AND S=Wet AND H=Humid AND T=Cool  → WEAK     (refill gently, soil ok)
  rule(wH, sW, hHu, tC,  0.25, sumNum, sumDen);
  // IF W=High AND S=Wet AND H=Humid AND T=Warm  → MODERATE (water critical)
  rule(wH, sW, hHu, tWa, 0.50, sumNum, sumDen);
  // IF W=High AND S=Wet AND H=Humid AND T=Hot   → MODERATE (water critical + heat)
  rule(wH, sW, hHu, tHo, 0.50, sumNum, sumDen);
  // IF W=High AND S=Wet AND H=Mod   AND T=Cool  → MODERATE (water must be restored)
  rule(wH, sW, hMd, tC,  0.50, sumNum, sumDen);
  // IF W=High AND S=Wet AND H=Mod   AND T=Warm  → MODERATE (water + env moderate)
  rule(wH, sW, hMd, tWa, 0.50, sumNum, sumDen);
  // IF W=High AND S=Wet AND H=Mod   AND T=Hot   → STRONG   (water + heat)
  rule(wH, sW, hMd, tHo, 0.75, sumNum, sumDen);
  // IF W=High AND S=Wet AND H=Dry   AND T=Cool  → MODERATE (water + air dry)
  rule(wH, sW, hDr, tC,  0.50, sumNum, sumDen);
  // IF W=High AND S=Wet AND H=Dry   AND T=Warm  → STRONG   (water + env stress)
  rule(wH, sW, hDr, tWa, 0.75, sumNum, sumDen);
  // IF W=High AND S=Wet AND H=Dry   AND T=Hot   → STRONG   (water + heat + dry air)
  rule(wH, sW, hDr, tHo, 0.75, sumNum, sumDen);

  // C2: W=HIGH, S=MOIST — pot nearly empty, soil getting dry
  // IF W=High AND S=Moist AND H=Humid AND T=Cool  → MODERATE (water + soil moderate)
  rule(wH, sMo, hHu, tC,  0.50, sumNum, sumDen);
  // IF W=High AND S=Moist AND H=Humid AND T=Warm  → MODERATE (3 mild stresses)
  rule(wH, sMo, hHu, tWa, 0.50, sumNum, sumDen);
  // IF W=High AND S=Moist AND H=Humid AND T=Hot   → STRONG   (water + soil + heat)
  rule(wH, sMo, hHu, tHo, 0.75, sumNum, sumDen);
  // IF W=High AND S=Moist AND H=Mod   AND T=Cool  → MODERATE (water + soil + humidity)
  rule(wH, sMo, hMd, tC,  0.50, sumNum, sumDen);
  // IF W=High AND S=Moist AND H=Mod   AND T=Warm  → STRONG   (3 stresses)
  rule(wH, sMo, hMd, tWa, 0.75, sumNum, sumDen);
  // IF W=High AND S=Moist AND H=Mod   AND T=Hot   → STRONG   (3 stresses)
  rule(wH, sMo, hMd, tHo, 0.75, sumNum, sumDen);
  // IF W=High AND S=Moist AND H=Dry   AND T=Cool  → STRONG   (water + soil + dry air)
  rule(wH, sMo, hDr, tC,  0.75, sumNum, sumDen);
  // IF W=High AND S=Moist AND H=Dry   AND T=Warm  → STRONG   (3–4 stresses)
  rule(wH, sMo, hDr, tWa, 0.75, sumNum, sumDen);
  // IF W=High AND S=Moist AND H=Dry   AND T=Hot   → FULL     (all inputs stressed)
  rule(wH, sMo, hDr, tHo, 1.00, sumNum, sumDen);

  // C3: W=HIGH, S=DRY — both water and soil critically low → maximum urgency
  // IF W=High AND S=Dry AND H=Humid AND T=Cool  → STRONG   (water + soil both critical)
  rule(wH, sD, hHu, tC,  0.75, sumNum, sumDen);
  // IF W=High AND S=Dry AND H=Humid AND T=Warm  → STRONG   (water + soil + warm)
  rule(wH, sD, hHu, tWa, 0.75, sumNum, sumDen);
  // IF W=High AND S=Dry AND H=Humid AND T=Hot   → FULL     (water + soil + heat)
  rule(wH, sD, hHu, tHo, 1.00, sumNum, sumDen);
  // IF W=High AND S=Dry AND H=Mod   AND T=Cool  → STRONG   (water + soil + humidity)
  rule(wH, sD, hMd, tC,  0.75, sumNum, sumDen);
  // IF W=High AND S=Dry AND H=Mod   AND T=Warm  → FULL     (all stressed)
  rule(wH, sD, hMd, tWa, 1.00, sumNum, sumDen);
  // IF W=High AND S=Dry AND H=Mod   AND T=Hot   → FULL     (all stressed)
  rule(wH, sD, hMd, tHo, 1.00, sumNum, sumDen);
  // IF W=High AND S=Dry AND H=Dry   AND T=Cool  → FULL     (all stressed)
  rule(wH, sD, hDr, tC,  1.00, sumNum, sumDen);
  // IF W=High AND S=Dry AND H=Dry   AND T=Warm  → FULL     (all stressed)
  rule(wH, sD, hDr, tWa, 1.00, sumNum, sumDen);
  // IF W=High AND S=Dry AND H=Dry   AND T=Hot   → FULL     (worst case)
  rule(wH, sD, hDr, tHo, 1.00, sumNum, sumDen);

  // ── Step 3: Centroid defuzzification ───────────────────────
  if (sumDen == 0.0) return 0.0;
  return sumNum / sumDen;
}

// ============================================================
//  CORE PUMP DECISION (per plant)
//
//  RULE 0 (hard gate, highest priority):
//    IF plant = Sheath Blight → pump OFF unconditionally
//    Rationale: excess moisture worsens fungal disease spread.
//
//  RULE 1–81 (fuzzy inference):
//    Defuzzified output >= PUMP_ON_THRESHOLD → pump ON
// ============================================================
bool shouldPumpOn(int plantNum, float depthCm, float soilPct,
                  float humidity, float tempC) {
  if (!plantHealthy[plantNum]) return false; // HARD GATE: Sheath Blight
  float output = evaluateFuzzyRules(depthCm, soilPct, humidity, tempC);
  return (output >= PUMP_ON_THRESHOLD);
}

// ============================================================
//  STEPPER
// ============================================================
void stepMotor(int steps, bool direction) {
  digitalWrite(DIR_PIN, direction ? DIR_FORWARD : DIR_BACKWARD);
  delayMicroseconds(10);
  for (int i = 0; i < steps; i++) {
    digitalWrite(STEP_PIN, HIGH); delayMicroseconds(STEP_DELAY_US);
    digitalWrite(STEP_PIN, LOW);  delayMicroseconds(STEP_DELAY_US);
  }
}

void moveMotorToPlant(int plantNum) {
  if (plantNum < 1 || plantNum > NUM_PLANTS) return;
  int targetPosition = PLANT_POSITIONS[plantNum];
  int stepsNeeded    = targetPosition - currentStepPosition;
  Serial.printf("Moving to Plant %d (%d steps)\n", plantNum, abs(stepsNeeded));
  digitalWrite(ENA_PIN, LOW);
  if (stepsNeeded != 0) {
    stepMotor(abs(stepsNeeded), stepsNeeded > 0);
    currentStepPosition = targetPosition;
  }
  digitalWrite(ENA_PIN, HIGH);
  delay(MOTOR_SETTLE_MS);
  Serial.println("READY");
}

// ============================================================
//  SETUP
// ============================================================
void setup() {
  Serial.begin(115200);

  pinMode(STEP_PIN, OUTPUT); pinMode(DIR_PIN, OUTPUT); pinMode(ENA_PIN, OUTPUT);
  digitalWrite(ENA_PIN, HIGH);

  for (int i = 1; i <= 6; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    digitalWrite(RELAY_PINS[i], HIGH); // all pumps OFF at start
  }

  pinMode(TRIG1, OUTPUT); pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT); pinMode(ECHO2, INPUT);
  // GPIO 34,35,36,39 are input-only; 13,12 analog-capable — no pinMode needed

  dht.begin();

  if (!rtc.begin()) { Serial.println("RTC Fail"); while (1); }

  WiFi.begin("Lord of the Pings", "C@mprehensivehigh1");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  // NTP sync — retry until a valid time is received.
  // configTime() starts the sync in the background; getLocalTime()
  // returns false until the ESP32 has actually heard back from the
  // NTP server, so we loop with a short delay until it succeeds.
  // GMT+8 (Philippine Standard Time) = 28800 seconds offset.
  configTime(28800, 0, "pool.ntp.org", "time.nist.gov");

  Serial.print("Waiting for NTP sync");
  struct tm timeinfo;
  int ntpRetries = 0;
  while (!getLocalTime(&timeinfo)) {
    delay(500);
    Serial.print(".");
    ntpRetries++;
    if (ntpRetries > 20) {           // 10-second timeout
      Serial.println("\nNTP sync failed — RTC keeps its last value.");
      break;
    }
  }

  if (ntpRetries <= 20) {
    // Validate year before writing — NTP sometimes returns epoch 0
    if (timeinfo.tm_year + 1900 >= 2024) {
      rtc.adjust(DateTime(
        timeinfo.tm_year + 1900, timeinfo.tm_mon + 1, timeinfo.tm_mday,
        timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec
      ));
      Serial.printf("\nRTC set to: %04d/%02d/%02d %02d:%02d:%02d\n",
        timeinfo.tm_year + 1900, timeinfo.tm_mon + 1, timeinfo.tm_mday,
        timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    } else {
      Serial.println("\nNTP returned invalid year — RTC not updated.");
    }
  }

  WiFi.disconnect(true); WiFi.mode(WIFI_OFF);
  Serial.println("\nSystem Ready.");
}

// ============================================================
//  LOOP
// ============================================================
void loop() {

  // ── SERIAL COMMAND HANDLER ──────────────────────────────────
  // Commands from Raspberry Pi:
  //   MOVE:N       → move stepper to plant N (1–6)
  //   HEALTH:N:S   → S=1 Healthy, S=0 Sheath Blight detected
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.startsWith("MOVE:")) {
      int plantNum = cmd.substring(5).toInt();
      moveMotorToPlant(plantNum);

    } else if (cmd.startsWith("HEALTH:")) {
      // Format: HEALTH:<plantNum>:<0 or 1>
      int colon2 = cmd.indexOf(':', 7);
      if (colon2 > 0) {
        int plantNum = cmd.substring(7, colon2).toInt();
        int status   = cmd.substring(colon2 + 1).toInt();
        if (plantNum >= 1 && plantNum <= 6) {
          plantHealthy[plantNum] = (status == 1);
          Serial.printf("Plant %d: %s\n", plantNum,
            plantHealthy[plantNum] ? "Healthy" : "Sheath Blight — pump locked OFF");
        }
      }
    }
  }

  // ── SENSOR LOOP (every 10 s) ────────────────────────────────
  unsigned long now_ms = millis();
  if (now_ms - lastSensorMillis >= SENSOR_INTERVAL) {
    lastSensorMillis = now_ms;

    DateTime now = rtc.now();

    // Read shared sensors with offsets applied
    float humidity, tempC;
    readDHT(humidity, tempC);
    float depth1 = readDistance(TRIG1, ECHO1, ULTRASONIC_OFFSET_1); // plants 1–3
    float depth2 = readDistance(TRIG2, ECHO2, ULTRASONIC_OFFSET_2); // plants 4–6

    // Per-plant soil moisture (%) + fuzzy output + pump decision
    float soilPct[7], fuzzyOut[7];
    bool  pumpOn[7];

    for (int i = 1; i <= 6; i++) {
      soilPct[i]  = readSoilPct(i);
      float depth = (i <= 3) ? depth1 : depth2;
      fuzzyOut[i] = plantHealthy[i]
                    ? evaluateFuzzyRules(depth, soilPct[i], humidity, tempC)
                    : 0.0;
      pumpOn[i] = (fuzzyOut[i] >= PUMP_ON_THRESHOLD);
      pumpOn[i] ? pumpON(i) : pumpOFF(i);
    }

    // JSON output to Raspberry Pi
    // soil_pct: 0–100% (100=wet, 0=dry)
    // fuzzy:    0.00–1.00 defuzzified output per plant
    // pump:     230=ON, 0=OFF
    // health:   1=Healthy, 0=Sheath Blight
    char jsonBuf[768];
    snprintf(jsonBuf, sizeof(jsonBuf),
      "{"
        "\"temp\":%.1f,"
        "\"hum\":%.1f,"
        "\"depth1\":%.1f,\"depth2\":%.1f,"
        "\"soil_pct\":[0,%.1f,%.1f,%.1f,%.1f,%.1f,%.1f],"
        "\"fuzzy\":[0,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f],"
        "\"pump\":[0,%d,%d,%d,%d,%d,%d],"
        "\"health\":[0,%d,%d,%d,%d,%d,%d],"
        "\"dt\":\"%04d/%02d/%02d %02d:%02d:%02d\""
      "}",
      tempC, humidity,
      depth1, depth2,
      soilPct[1], soilPct[2], soilPct[3],
      soilPct[4], soilPct[5], soilPct[6],
      fuzzyOut[1], fuzzyOut[2], fuzzyOut[3],
      fuzzyOut[4], fuzzyOut[5], fuzzyOut[6],
      pumpOn[1]?230:0, pumpOn[2]?230:0, pumpOn[3]?230:0,
      pumpOn[4]?230:0, pumpOn[5]?230:0, pumpOn[6]?230:0,
      plantHealthy[1], plantHealthy[2], plantHealthy[3],
      plantHealthy[4], plantHealthy[5], plantHealthy[6],
      now.year(), now.month(), now.day(),
      now.hour(), now.minute(), now.second()
    );
    Serial.println(jsonBuf);
  }
}
