// ============================================================================
// Hiliosphereumanite — internal mechanism (compiled from TypeScript)
// Source: src/hiliosphereumanite.ts
// ============================================================================

class Hiliosphereumanite {
  constructor() {
    this.h = 0;
    this.s = 0;
    this.m = 0;
    this.resonance = false;
    this.frequencyHz = 20000;
    this.frequencyHex = '0xzK4frozE203';
    this.coherentCapture = false; // C
    this.rin = 0;
    this.rout = 0;

    this.lexicon = [
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
  }

  setHilio(value) { this.h = value; }
  setSpherium(value) { this.s = value; }
  setManite(value) { this.m = value; }
  setComponents(h, s, m) { this.h = h; this.s = s; this.m = m; }

  computeH() { return this.h + this.s * 0.5 + this.m * 0.25; }

  interactionHs() { return Math.abs(this.h * this.s) * 0.1; }
  interactionSm() { return Math.abs(this.s * this.m) * 0.1; }
  interactionHm() { return Math.abs(this.h * this.m) * 0.1; }

  computeO() {
    const H = this.computeH();
    const S = this.s;
    const M = this.m;
    const Ihs = this.interactionHs();
    const Ism = this.interactionSm();
    const Ihm = this.interactionHm();
    return H + S + M + Ihs + Ism + Ihm;
  }

  toggleResonance() { this.resonance = !this.resonance; return this.resonance; }
  setResonance(on) { this.resonance = on; }
  isResonating() { return this.resonance; }

  setFrequencyHz(hertz) { this.frequencyHz = hertz; }
  getFrequencyHz() { return this.frequencyHz; }
  setFrequencyHex(hex) { this.frequencyHex = hex; }
  getFrequencyHex() { return this.frequencyHex; }

  frequencyReport() {
    return { hz: this.frequencyHz, hex: this.frequencyHex, distinct: String(this.frequencyHz) !== this.frequencyHex };
  }

  vacuumDbSwapWithBell() {
    const before = this.coherentCapture;
    this.coherentCapture = !before;
    return before ? 'Chime: vacuum db swapped off' : 'Chime: vacuum db swapped on';
  }

  toggleCoherentCapture() { this.coherentCapture = !this.coherentCapture; return this.coherentCapture; }
  setCoherentCapture(on) { this.coherentCapture = on; }
  setRin(value) { this.rin = value; this.updateRout(); }
  getRin() { return this.rin; }
  getRout() { return this.rout; }

  updateRout() { const C = this.coherentCapture ? 1 : 0; this.rout = this.rin * C; }

  routeReport() { return { rin: this.rin, c: this.coherentCapture ? 1 : 0, rout: this.rout }; }

  state() {
    const H = this.computeH();
    return {
      h: this.h, s: this.s, m: this.m, H, S: this.s, M: this.m,
      Ihs: this.interactionHs(), Ism: this.interactionSm(), Ihm: this.interactionHm(),
      O: this.computeO(), resonance: this.resonance, frequencyHz: this.frequencyHz,
      frequencyHex: this.frequencyHex, coherentCapture: this.coherentCapture,
      rin: this.rin, rout: this.rout, lexicon: this.lexicon,
    };
  }
}

// Expose globally so the HTML can drive it.
window.Hiliosphereumanite = Hiliosphereumanite;
