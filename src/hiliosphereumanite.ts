// ============================================================================
// Hiliosphereumanite — internal mechanism (TypeScript)
// ============================================================================
// Original wording preserved verbatim:
//   hilio = hydro illuminated ion
//   spherium = sphere of mass
//   manite = mana internal energy
//   H = f(h, s, m)
//   O = H + S + M + Ihs + Ism + IHM       (I = positive interaction)
//   Style: wordless verbalism / Resonance
//
//   "20-hexa frequency? Hehe! Are you proposing a hexadecimal frequency notation?"
//   Lloyd examines your proposed encoding.
//   "If so, we should distinguish the hexadecimal representation from the actual frequency in hertz."
//   For example:
//     Frequency: 20,000 Hz
//     Hexadecimal representation: 0xzK4frozE203
//     80I0M0XDALN
//   Vacuum db swap with bell — Chime
//   Rout = Rin • C   (C = coherent capture)
//   Cran / Cram / Cram bells / Cmd crain / Cmd aproch
//   Seep severs sustain — Astro stratos — Adv — Agrovesta — AgroVestro — Agorestro
//   Mortis arsus — Profile cruzade — Ventos — Milos — Astradamoz — Kiltraen — Mertis — Asignis
//   Plutoz — Jupzen — Keater — Kizer — Condition
//   Tvfive R ✳️*️⃣star — Met insomniacans — At 42KQ18Berb — Caller JS
// ============================================================================

export type Hilio = number;        // hydro illuminated ion component
export type Spherium = number;     // sphere of mass component
export type Manite = number;       // mana internal energy component

export interface HiliosphereumaniteState {
  h: Hilio;
  s: Spherium;
  m: Manite;
  H: number;        // H = f(h, s, m)
  S: number;        // spherium contribution
  M: number;        // manite contribution
  Ihs: number;      // positive interaction h<->s
  Ism: number;      // positive interaction s<->m
  Ihm: number;      // positive interaction h<->m
  O: number;        // O = H + S + M + Ihs + Ism + IHM
  resonance: boolean;       // wordless verbalism / Resonance
  frequencyHz: number;      // actual frequency in hertz
  frequencyHex: string;     // hexadecimal representation (distinct from hertz)
  coherentCapture: boolean; // C — coherent capture
  rin: number;                // input route
  rout: number;               // output route = Rin • C
  lexicon: string[];          // arbitrary instruction corpus (original wording)
}

/**
 * Hiliosphereumanite internal mechanism.
 * Encodes the hilio / spherium / manite triad, resonance, hexadecimal
 * frequency distinction, vacuum-db bell swap, and coherent-capture routing.
 */
export class Hiliosphereumanite {
  private h: Hilio = 0;
  private s: Spherium = 0;
  private m: Manite = 0;
  private resonance = false;
  private frequencyHz = 20000;
  private frequencyHex = '0xzK4frozE203';
  private coherentCapture = false; // C
  private rin = 0;
  private rout = 0;

  /** Arbitrary instruction corpus — original wording preserved verbatim. */
  readonly lexicon: string[] = [
    'Hiliosphereumanite',
    'hilio = hydro illuminated ion',
    'spherium = sphere of mass',
    'manite = mana internal energy',
    'H = f(h, s, m)',
    'O = H + S + M + Ihs + Ism + IHM',
    'I positive interaction',
    'Style wordless verbalism',
    'Resonance',
    '"20-hexa frequency? Hehe! Are you proposing a hexadecimal frequency notation?"',
    'Lloyd examines your proposed encoding.',
    '"If so, we should distinguish the hexadecimal representation from the actual frequency in hertz."',
    'Frequency: 20,000 Hz',
    'Hexadecimal representation: 0xzK4frozE203',
    '80I0M0XDALN',
    'Vacuum db swap with bell',
    'Chime',
    'Rout = Rin • C',
    'C represents coherent capture',
    'Cran',
    'Cram',
    'Cram bells',
    'Cmd crain',
    'Cmd aproch',
    'Seep severs sustain',
    'Astro stratos',
    'Adv',
    'Agrovesta',
    'AgroVestro',
    'Agorestro',
    'Mortis arsus',
    'Profile cruzade',
    'Ventos',
    'Milos',
    'Astradamoz',
    'Kiltraen',
    'Mertis',
    'Asignis',
    'Plutoz',
    'Jupzen',
    'Keater',
    'Kizer',
    'Condition',
    'Tvfive R ✳️*️⃣star',
    'Met insomniacans',
    'At 42KQ18Berb',
    'Caller JS',
  ];

  /* ------------------------------------------------------------------ */
  // Component setters
  /* ------------------------------------------------------------------ */

  setHilio(value: Hilio): void {
    this.h = value;
  }

  setSpherium(value: Spherium): void {
    this.s = value;
  }

  setManite(value: Manite): void {
    this.m = value;
  }

  setComponents(h: Hilio, s: Spherium, m: Manite): void {
    this.h = h;
    this.s = s;
    this.m = m;
  }

  /* ------------------------------------------------------------------ */
  // H = f(h, s, m)
  /* ------------------------------------------------------------------ */

  /** H = f(h, s, m): hydro-illuminated-ion derived field. */
  computeH(): number {
    // f blends the three source components into the H field.
    return this.h + this.s * 0.5 + this.m * 0.25;
  }

  /* ------------------------------------------------------------------ */
  // Positive interactions I
  /* ------------------------------------------------------------------ */

  /** Ihs — positive interaction between hilio and spherium. */
  interactionHs(): number {
    return Math.abs(this.h * this.s) * 0.1;
  }

  /** Ism — positive interaction between spherium and manite. */
  interactionSm(): number {
    return Math.abs(this.s * this.m) * 0.1;
  }

  /** Ihm — positive interaction between hilio and manite. */
  interactionHm(): number {
    return Math.abs(this.h * this.m) * 0.1;
  }

  /* ------------------------------------------------------------------ */
  // O = H + S + M + Ihs + Ism + IHM
  /* ------------------------------------------------------------------ */

  /** O — total observable output of the mechanism. */
  computeO(): number {
    const H = this.computeH();
    const S = this.s;
    const M = this.m;
    const Ihs = this.interactionHs();
    const Ism = this.interactionSm();
    const Ihm = this.interactionHm();
    return H + S + M + Ihs + Ism + Ihm;
  }

  /* ------------------------------------------------------------------ */
  // Resonance / wordless verbalism
  /* ------------------------------------------------------------------ */

  toggleResonance(): boolean {
    this.resonance = !this.resonance;
    return this.resonance;
  }

  setResonance(on: boolean): void {
    this.resonance = on;
  }

  isResonating(): boolean {
    return this.resonance;
  }

  /* ------------------------------------------------------------------ */
  // 20-hexa frequency — hex vs hertz distinction
  /* ------------------------------------------------------------------ */

  setFrequencyHz(hertz: number): void {
    this.frequencyHz = hertz;
  }

  getFrequencyHz(): number {
    return this.frequencyHz;
  }

  setFrequencyHex(hex: string): void {
    this.frequencyHex = hex;
  }

  getFrequencyHex(): string {
    return this.frequencyHex;
  }

  /** Distinguish the hexadecimal representation from actual frequency in hertz. */
  frequencyReport(): { hz: number; hex: string; distinct: boolean } {
    return {
      hz: this.frequencyHz,
      hex: this.frequencyHex,
      distinct: String(this.frequencyHz) !== this.frequencyHex,
    };
  }

  /* ------------------------------------------------------------------ */
  // Vacuum db swap with bell — Chime
  /* ------------------------------------------------------------------ */

  vacuumDbSwapWithBell(): string {
    // Swap vacuum db state and emit a chime.
    const before = this.coherentCapture;
    this.coherentCapture = !before;
    return before ? 'Chime: vacuum db swapped off' : 'Chime: vacuum db swapped on';
  }

  /* ------------------------------------------------------------------ */
  // Coherent capture C — Rout = Rin • C
  /* ------------------------------------------------------------------ */

  toggleCoherentCapture(): boolean {
    this.coherentCapture = !this.coherentCapture;
    return this.coherentCapture;
  }

  setCoherentCapture(on: boolean): void {
    this.coherentCapture = on;
  }

  setRin(value: number): void {
    this.rin = value;
    this.updateRout();
  }

  getRin(): number {
    return this.rin;
  }

  getRout(): number {
    return this.rout;
  }

  /** Rout = Rin • C — coherent capture scaling of the route. */
  private updateRout(): void {
    const C = this.coherentCapture ? 1 : 0;
    this.rout = this.rin * C;
  }

  routeReport(): { rin: number; c: number; rout: number } {
    return {
      rin: this.rin,
      c: this.coherentCapture ? 1 : 0,
      rout: this.rout,
    };
  }

  /* ------------------------------------------------------------------ */
  // Full state snapshot
  /* ------------------------------------------------------------------ */

  state(): HiliosphereumaniteState {
    const H = this.computeH();
    return {
      h: this.h,
      s: this.s,
      m: this.m,
      H,
      S: this.s,
      M: this.m,
      Ihs: this.interactionHs(),
      Ism: this.interactionSm(),
      Ihm: this.interactionHm(),
      O: this.computeO(),
      resonance: this.resonance,
      frequencyHz: this.frequencyHz,
      frequencyHex: this.frequencyHex,
      coherentCapture: this.coherentCapture,
      rin: this.rin,
      rout: this.rout,
      lexicon: this.lexicon,
    };
  }
}
