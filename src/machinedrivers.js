// ============================================================================
// Machine Driver Stack — krnls -> mcd cmd -> zshell -> linshell -> lightshell
// Hierarchical driver list with command formation front-end + Docker env save
// ============================================================================

/* Driver levels, lowest (kernel) to highest (shell/command front) */
const DRIVER_LEVELS = [
  { key: 'krnl', label: 'KRNL', labelFull: 'KERNEL', desc: 'Lowest-level kernel driver interface', color: '#00ff00' },
  { key: 'mcd',  label: 'MCD',  labelFull: 'MCD CMD',  desc: 'Machine command driver', color: '#00ccff' },
  { key: 'zs',   label: 'ZSH',  labelFull: 'ZSHELL',   desc: 'Z shell command layer', color: '#ff00ff' },
  { key: 'ls',   label: 'LIN',  labelFull: 'LINSHELL', desc: 'Linux shell command layer', color: '#ffff00' },
  { key: 'lht',  label: 'LIGHT',labelFull: 'LIGHTSHELL',desc: 'Light shell command layer', color: '#ff8800' },
  { key: 'st',   label: 'STAT', labelFull: 'STATUS',   desc: 'Status / telemetry driver forms', color: '#88ff00' },
];

/* Concrete drivers per level with their native command forms */
const MACHINE_DRIVERS = {
  krnl: [
    { id: 'krnl.boot', label: 'boot', desc: 'Kernel boot driver', cmdTemplate: 'krnl boot {args}', status: 'active' },
    { id: 'krnl.sched', label: 'sched', desc: 'Kernel scheduler driver', cmdTemplate: 'krnl sched {args}', status: 'active' },
    { id: 'krnl.mem', label: 'mem', desc: 'Kernel memory driver', cmdTemplate: 'krnl mem {args}', status: 'active' },
    { id: 'krnl.io', label: 'io', desc: 'Kernel I/O driver', cmdTemplate: 'krnl io {args}', status: 'standby' },
  ],
  mcd: [
    { id: 'mcd.exec', label: 'exec', desc: 'MCD command execution', cmdTemplate: 'mcd exec {args}', status: 'active' },
    { id: 'mcd.load', label: 'load', desc: 'MCD module load driver', cmdTemplate: 'mcd load {args}', status: 'active' },
    { id: 'mcd.unload', label: 'unload', desc: 'MCD module unload driver', cmdTemplate: 'mcd unload {args}', status: 'standby' },
  ],
  zs: [
    { id: 'zs.run', label: 'run', desc: 'Zshell run driver', cmdTemplate: 'zs run {args}', status: 'active' },
    { id: 'zs.src', label: 'source', desc: 'Zshell source driver', cmdTemplate: 'zs source {args}', status: 'active' },
    { id: 'zs.alias', label: 'alias', desc: 'Zshell alias driver', cmdTemplate: 'zs alias {args}', status: 'standby' },
  ],
  ls: [
    { id: 'ls.sh', label: 'sh', desc: 'Linshell shell driver', cmdTemplate: 'linshell sh {args}', status: 'active' },
    { id: 'ls.bash', label: 'bash', desc: 'Linshell bash driver', cmdTemplate: 'linshell bash {args}', status: 'active' },
    { id: 'ls.shopt', label: 'shopt', desc: 'Linshell shopt driver', cmdTemplate: 'linshell shopt {args}', status: 'standby' },
  ],
  lht: [
    { id: 'light.run', label: 'run', desc: 'Lightshell run driver', cmdTemplate: 'lightshell run {args}', status: 'active' },
    { id: 'light.eval', label: 'eval', desc: 'Lightshell eval driver', cmdTemplate: 'lightshell eval {args}', status: 'standby' },
  ],
  st: [
    { id: 'stat.ps', label: 'ps', desc: 'Status process list', cmdTemplate: 'status ps {args}', status: 'active' },
    { id: 'stat.df', label: 'df', desc: 'Status disk free', cmdTemplate: 'status df {args}', status: 'active' },
    { id: 'stat.dmesg', label: 'dmesg', desc: 'Status kernel ring buffer', cmdTemplate: 'status dmesg {args}', status: 'standby' },
  ],
};

/* Persisted Docker environment */
const DOCKER_ENV_KEY = 'omnitrix_docker_env_v1';
const defaultDockerEnv = {
  version: '1',
  registry: 'localhost:5000',
  image: 'omnitrix/machine-driver:latest',
  container: 'omnitrix-driver-host',
  network: 'omnitrix-net',
  env: { HOLO_MODE: '1', MCP_ENDPOINT: 'ws://localhost:3001/mcp', DRIVER_STACK: 'krnl,mcd,zs,ls,lht,st' },
  volumes: ['/var/run/docker.sock:/var/run/docker.sock', './driver-lib:/opt/drivers'],
  ports: ['3001:3001', '8080:8080'],
  savedAt: null,
};

let DockerEnv = JSON.parse(JSON.stringify(defaultDockerEnv));

/* Git trace block — appended to each docker environment file saved */
function gitTraceBlock() {
  const now = new Date().toISOString();
  let branch = 'unknown';
  let commit = 'unknown';
  let dirty = false;
  try {
    // best-effort: read from environment / process if exposed
    const cwd = (typeof process !== 'undefined' && process.cwd) ? process.cwd() : '/';
    branch = (typeof window !== 'undefined' && window.__GIT_BRANCH__) || 'HEAD';
    commit = (typeof window !== 'undefined' && window.__GIT_COMMIT__) || '0000000';
  } catch (e) { /* ignore */ }
  return {
    generatedAt: now,
    branch,
    commit,
    dirty,
    traceId: 'GT-' + Math.random().toString(16).slice(2, 10).toUpperCase(),
  };
}

/* Proximity arc design — emits status from bells */
let proximityArc = {
  active: false,
  radius: 1.0,
  intensity: 0,
  lastEmit: null,
  history: [],
};
function proximityArcEmit(source = 'bell') {
  proximityArc.active = true;
  proximityArc.intensity = Math.min(1, (proximityArc.intensity || 0) + 0.35);
  proximityArc.lastEmit = { at: new Date().toISOString(), source, radius: proximityArc.radius, intensity: proximityArc.intensity };
  proximityArc.history.push(proximityArc.lastEmit);
  if (proximityArc.history.length > 50) proximityArc.history.shift();
  // decay
  setTimeout(() => { proximityArc.intensity = Math.max(0, proximityArc.intensity - 0.15); if (proximityArc.intensity <= 0) proximityArc.active = false; }, 800);
  return proximityArc.lastEmit;
}
function proximityArcStatus() {
  return { ...proximityArc, history: proximityArc.history.slice() };
}

function loadDockerEnv() {
  try {
    const raw = localStorage.getItem(DOCKER_ENV_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      DockerEnv = { ...defaultDockerEnv, ...parsed };
    }
  } catch (e) { /* ignore */ }
  return DockerEnv;
}
function saveDockerEnv() {
  DockerEnv.savedAt = new Date().toISOString();
  DockerEnv.gitTrace = gitTraceBlock();
  try { localStorage.setItem(DOCKER_ENV_KEY, JSON.stringify(DockerEnv, null, 2)); } catch (e) {}
  return DockerEnv;
}
function resetDockerEnv() {
  DockerEnv = JSON.parse(JSON.stringify(defaultDockerEnv));
  saveDockerEnv();
  return DockerEnv;
}

/* Command formation from driver selection */
function formCommand(levelKey, driverId, args = '') {
  const drivers = MACHINE_DRIVERS[levelKey] || [];
  const drv = drivers.find(d => d.id === driverId);
  if (!drv) return { ok: false, error: 'driver not found: ' + driverId };
  const cmd = drv.cmdTemplate.replace('{args}', args || '').trim();
  return { ok: true, driver: drv, cmd };
}

/* Execute formed command through existing command router if available */
function executeFormedCommand(levelKey, driverId, args = '') {
  const formed = formCommand(levelKey, driverId, args);
  if (!formed.ok) return formed;
  // Map driver command to app command router
  const mapping = {
    'krnl.boot': 'mech_compute',
    'krnl.sched': 'mech_compute',
    'krnl.mem': 'mech_compute',
    'krnl.io': 'mech_compute',
    'mcd.exec': 'mech_compute',
    'mcd.load': 'mech_compute',
    'mcd.unload': 'mech_compute',
    'zs.run': 'mech_compute',
    'zs.source': 'mech_compute',
    'zs.alias': 'mech_compute',
    'ls.sh': 'mech_compute',
    'ls.bash': 'mech_compute',
    'ls.shopt': 'mech_compute',
    'light.run': 'mech_compute',
    'light.eval': 'mech_compute',
    'stat.ps': 'mech_compute',
    'stat.df': 'mech_compute',
    'stat.dmesg': 'mech_compute',
  };
  const appCmd = mapping[driverId] || 'mech_compute';
  if (typeof executeCommand === 'function') {
    const res = executeCommand(appCmd, { driver: driverId, cmd: formed.cmd, level: levelKey });
    return { ...res, formedCmd: formed.cmd, driver: formed.driver };
  }
  return { ok: true, formedCmd: formed.cmd, driver: formed.driver, note: 'executeCommand not bound' };
}

/* RC controller module — direct to network driver and CPU current */
const RCController = {
  connected: false,
  networkDriver: null,
  cpuCurrent: 0,
  cpuVoltage: 1.0,
  rx: 0, ry: 0,
  buttons: {},
  lastCommand: null,
  connect() {
    this.connected = true;
    this.networkDriver = { iface: 'eth0', link: 'up', speed: '1Gbps', ip: '127.0.0.1' };
    this.lastCommand = 'rc.connect';
    return { connected: true, network: this.networkDriver };
  },
  disconnect() {
    this.connected = false;
    this.networkDriver = null;
    this.lastCommand = 'rc.disconnect';
    return { connected: false };
  },
  setStick(x, y) { this.rx = x; this.ry = y; this.lastCommand = 'rc.stick'; },
  setButton(name, pressed) { this.buttons[name] = pressed; this.lastCommand = 'rc.btn.' + name; },
  updateCpuCurrent(currentA, voltageV = 1.0) {
    this.cpuCurrent = currentA;
    this.cpuVoltage = voltageV;
    this.lastCommand = 'rc.cpu.current';
    return { cpuCurrent: this.cpuCurrent, cpuVoltage: this.cpuVoltage, powerW: this.cpuCurrent * this.cpuVoltage };
  },
  status() {
    return {
      connected: this.connected,
      network: this.networkDriver,
      cpuCurrent: this.cpuCurrent,
      cpuVoltage: this.cpuVoltage,
      powerW: this.cpuCurrent * this.cpuVoltage,
      rx: this.rx,
      ry: this.ry,
      buttons: this.buttons,
      lastCommand: this.lastCommand,
    };
  },
};

/* Proximity arc emits status from bells — triggers RC command passthrough */
const _origProxEmit = proximityArcEmit;
proximityArcEmit = function(source = 'bell') {
  const emit = _origProxEmit(source);
  if (RCController.connected) {
    RCController.updateCpuCurrent(0.42 + Math.random() * 0.5, 1.18);
    RCController.lastCommand = 'rc.bell.status.' + source;
  }
  return emit;
};

/* Ark monitor dashboard — krnl & tick timer data packets stored in docker sorting mechanism */
const ArkMonitor = {
  krnlPackets: [],
  tickPackets: [],
  dockerSortQueue: [],
  sortedEvents: [],
  tickCount: 0,
  maxPackets: 60,
  sorter: 'milmelons',
  passkey: 'milmelons_extra',
  sortPasskeyEntered: false,
  tick() {
    this.tickCount++;
    const pkt = {
      id: 'T' + this.tickCount,
      type: 'tick',
      at: new Date().toISOString(),
      seq: this.tickCount,
      payload: 'tick timer data packet',
    };
    this.tickPackets.push(pkt);
    if (this.tickPackets.length > this.maxPackets) this.tickPackets.shift();
    this.dockerSortQueue.push({ source: 'tick', id: pkt.id, at: pkt.at });
    return pkt;
  },
  krnlInject(source = 'krnl', data = 'kernel data packet') {
    const pkt = {
      id: 'K' + (this.krnlPackets.length + this.tickPackets.length + 1),
      type: 'krnl',
      source,
      at: new Date().toISOString(),
      data,
    };
    this.krnlPackets.push(pkt);
    if (this.krnlPackets.length > this.maxPackets) this.krnlPackets.shift();
    this.dockerSortQueue.push({ source: 'krnl', id: pkt.id, at: pkt.at });
    return pkt;
  },
  sortDocker(passkey) {
    if (passkey && passkey === this.passkey) {
      this.sortPasskeyEntered = true;
    }
    if (!this.sortPasskeyEntered) {
      return { ok: false, error: 'Sort passkey required. Enter milmelons extra passkey.' };
    }
    // Docker sorting mechanism: sort the queue by timestamp then by source priority
    const priority = { krnl: 0, tick: 1, docker: 2 };
    const sorted = [...this.dockerSortQueue].sort((a, b) => {
      if (a.at < b.at) return -1;
      if (a.at > b.at) return 1;
      return (priority[a.source] || 9) - (priority[b.source] || 9);
    });
    this.sortedEvents = sorted.slice(0, 50);
    // persist sorted result into docker env
    MachineDriverStack.DockerEnv.lastSort = {
      at: new Date().toISOString(),
      count: this.sortedEvents.length,
      sorter: this.sorter,
      passkey: this.passkey,
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
    return { ok: true, sorted: this.sortedEvents, sorter: this.sorter };
  },
  enterPasskey(key) {
    if (key === this.passkey) {
      this.sortPasskeyEntered = true;
      return { ok: true, passkeyAccepted: true, sorter: this.sorter };
    }
    return { ok: false, error: 'Invalid passkey. Expected: ' + this.passkey };
  },
  clear() {
    this.krnlPackets = [];
    this.tickPackets = [];
    this.dockerSortQueue = [];
    this.sortedEvents = [];
    this.tickCount = 0;
  },
  stats() {
    return {
      krnl: this.krnlPackets.length,
      tick: this.tickPackets.length,
      queue: this.dockerSortQueue.length,
      sorted: this.sortedEvents.length,
      tick: this.tickCount,
    };
  },
  render(targets) {
    const krnlEl = targets.krnl;
    const tickEl = targets.tick;
    const qEl = targets.dockerq;
    const sEl = targets.sorted;
    const statsEl = targets.stats;

    krnlEl.innerHTML = this.krnlPackets.length ? this.krnlPackets.slice().reverse().map(p =>
      '<div class="ark-pkt krnl">' + p.at.split('T')[1].slice(0, 8) + ' ' + p.source + ' ' + p.data + '</div>').join('') : '<div style="color:#333">—</div>';
    tickEl.innerHTML = this.tickPackets.length ? this.tickPackets.slice().reverse().map(p =>
      '<div class="ark-pkt tick">' + p.at.split('T')[1].slice(0, 8) + ' seq=' + p.seq + ' ' + p.payload + '</div>').join('') : '<div style="color:#333">—</div>';
    qEl.innerHTML = this.dockerSortQueue.length ? this.dockerSortQueue.slice().reverse().map(p =>
      '<div class="ark-pkt docker">' + p.at.split('T')[1].slice(0, 8) + ' ' + p.source + ' → ' + p.id + '</div>').join('') : '<div style="color:#333">—</div>';
    sEl.innerHTML = this.sortedEvents.length ? this.sortedEvents.slice().reverse().map(p =>
      '<div class="ark-pkt sort">' + p.at.split('T')[1].slice(0, 8) + ' ' + p.source + ' ' + p.id + '</div>').join('') : '<div style="color:#333">—</div>';

    const st = this.stats();
    statsEl.textContent = 'packets: ' + (st.krnl + st.tick) + ' · sorted: ' + st.sorted + ' · tick: ' + st.tick + ' · queue: ' + st.queue;
  },
};

/* Tag: melencoly @dreamshell — triggers Python environment formation */
const MelencolyDreamshell = {
  active: false,
  pythonEnv: {
    interpreter: 'python3',
    version: '3.11',
    venv: '.dreamshell_venv',
    packages: ['numpy','scipy','matplotlib','pygame','websocket'],
    env: { DREAMSHELL: '1', MELANCOLY: '1', HOLO_PROJECTION: 'raw_polygon' },
    startedAt: null,
  },
  trigger() {
    this.active = true;
    this.pythonEnv.startedAt = new Date().toISOString();
    // persist into docker env
    MachineDriverStack.DockerEnv.dreamshell = { ...this.pythonEnv };
    MachineDriverStack.saveDockerEnv();
    return { ok: true, action: 'dreamshell_trigger', pythonEnv: this.pythonEnv };
  },
  status() {
    return { active: this.active, pythonEnv: this.pythonEnv };
  },
};

/* Qbit proximity module targets — increases Alien X intilisisng.
   Module installation system for fast machine launch.
   Database phrase: XSQL (not MySQL). */
const QbitProximityModule = {
  xsqlDialect: 'xsql',
  modules: {
    qbit_proximity_a: { id: 'qbit_proximity_a', label: 'QBIT PROX A', installed: false, target: 'alien_x', power: 0 },
    qbit_proximity_b: { id: 'qbit_proximity_b', label: 'QBIT PROX B', installed: false, target: 'alien_x', power: 0 },
    qbit_core_x:      { id: 'qbit_core_x',      label: 'QBIT CORE X',   installed: false, target: 'alien_x', power: 0 },
  },
  alienXInitialized: false,
  alienXIntilisationLevel: 0, // 0..100
  fastLaunchReady: false,
  install(moduleId) {
    const m = this.modules[moduleId];
    if (!m) return { ok: false, error: 'module not found: ' + moduleId };
    m.installed = true;
    m.power = 100;
    this.recalc();
    MachineDriverStack.saveDockerEnv();
    return { ok: true, module: m.label, installed: true, alienXLevel: this.alienXIntilisationLevel };
  },
  uninstall(moduleId) {
    const m = this.modules[moduleId];
    if (!m) return { ok: false, error: 'module not found: ' + moduleId };
    m.installed = false;
    m.power = 0;
    this.recalc();
    return { ok: true, module: m.label, installed: false };
  },
  setProximity(moduleId, value) {
    const m = this.modules[moduleId];
    if (!m) return { ok: false, error: 'module not found: ' + moduleId };
    m.power = Math.max(0, Math.min(100, Number(value) || 0));
    this.recalc();
    return { ok: true, module: m.label, power: m.power, alienXLevel: this.alienXIntilisationLevel };
  },
  recalc() {
    let total = 0;
    let count = 0;
    Object.values(this.modules).forEach(m => { if (m.installed) { total += m.power; count++; } });
    this.alienXIntilisationLevel = count ? Math.min(100, total / count) : 0;
    this.alienXInitialized = this.alienXIntilisationLevel >= 75;
    this.fastLaunchReady = this.alienXInitialized && count >= 2;
    this.persist();
  },
  intitializeAlienX() {
    if (!this.fastLaunchReady) {
      return { ok: false, error: 'Alien X intilisation not ready. Install >=2 qbit proximity modules and raise level to 75+.' };
    }
    this.alienXInitialized = true;
    this.persist();
    return { ok: true, alienX: 'INTILISED', level: this.alienXIntilisationLevel, fastLaunch: this.fastLaunchReady };
  },
  fastLaunch() {
    if (!this.fastLaunchReady || !this.alienXInitialized) {
      return { ok: false, error: 'Fast launch blocked: Alien X not intilised or modules insufficient.' };
    }
    const seq = ['qbit proximity lock', 'alien x intilisation confirm', 'spectral range align', 'docker env seal', 'machine launch'];
    this.persist();
    return { ok: true, launch: 'FAST LAUNCH COMPLETE', sequence: seq, alienXLevel: this.alienXIntilisationLevel };
  },
  status() {
    return {
      xsqlDialect: this.xsqlDialect,
      modules: this.modules,
      alienXIntilisationLevel: this.alienXIntilisationLevel,
      alienXInitialized: this.alienXInitialized,
      fastLaunchReady: this.fastLaunchReady,
    };
  },
  persist() {
    MachineDriverStack.DockerEnv.qbitModules = {
      xsqlDialect: this.xsqlDialect,
      modules: this.modules,
      alienXIntilisationLevel: this.alienXIntilisationLevel,
      alienXInitialized: this.alienXInitialized,
      fastLaunchReady: this.fastLaunchReady,
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
  },
};

/* Expose */
window.QbitProximityModule = QbitProximityModule;

/* Spectral range limit — max 10KXFOLDS per server of far reach.
   Persistent rule keeps the server running outside Kilometertessorialcubits.
   Range repeats and folds more values onto its existing max;
   all coordinates are locked to docker files. */
const SpectralRangeServer = {
  maxSpectralRange: 10000,   // 10K XFOLDS base
  unit: 'XFOLDS',
  farReach: true,
  serverRunning: false,
  outsideKilometertessorialcubits: true, // persistent rule
  currentRange: 0,
  foldedValues: [],          // values folded/repeated onto the existing max
  foldMultiplier: 1,         // how many times the max repeats/folds
  lastPing: null,
  ruleText: 'MAX_SPECTRAL_RANGE=10KXFOLDS per server of far reach; server persists outside Kilometertessorialcubits; range folds onto existing max; all coordinates locked to docker files',
  coordinatesLocked: { x: 0, y: 0, z: 0, spectral: 0 }, // all coordinates locked to docker
  lockActive: false,
  start() {
    this.serverRunning = true;
    this.currentRange = this.maxSpectralRange;
    this.foldMultiplier = 1;
    this.foldedValues = [];
    this.lastPing = new Date().toISOString();
    this.persist();
    return { ok: true, rule: this.ruleText, range: this.currentRange + ' ' + this.unit };
  },
  stop() {
    this.serverRunning = false;
    this.currentRange = 0;
    this.persist();
    return { ok: true, serverRunning: false };
  },
  /** Fold/repeat more values onto the existing max spectral range. */
  fold(value) {
    const v = Number(value) || 0;
    this.foldedValues.push(v);
    this.foldMultiplier = this.foldedValues.length + 1;
    this.currentRange = this.maxSpectralRange * this.foldMultiplier + this.foldedValues.reduce((a, b) => a + b, 0);
    this.lastPing = new Date().toISOString();
    this.persist();
    return { ok: true, foldedValue: v, foldedValues: this.foldedValues, foldMultiplier: this.foldMultiplier, currentRange: this.currentRange + ' ' + this.unit };
  },
  /** Lock all coordinates (x, y, z, spectral) to docker files. */
  lockCoordinates(x, y, z, spectral) {
    this.coordinatesLocked = {
      x: Number(x) || 0,
      y: Number(y) || 0,
      z: Number(z) || 0,
      spectral: Number(spectral) || 0,
    };
    this.lockActive = true;
    this.lastPing = new Date().toISOString();
    this.persist();
    return { ok: true, locked: true, coordinates: this.coordinatesLocked };
  },
  unlockCoordinates() {
    this.lockActive = false;
    this.coordinatesLocked = { x: 0, y: 0, z: 0, spectral: 0 };
    this.persist();
    return { ok: true, locked: false };
  },
  persist() {
    MachineDriverStack.DockerEnv.spectralRange = {
      maxSpectralRange: this.maxSpectralRange,
      unit: this.unit,
      farReach: this.farReach,
      outsideKilometertessorialcubits: this.outsideKilometertessorialcubits,
      currentRange: this.currentRange,
      foldedValues: this.foldedValues,
      foldMultiplier: this.foldMultiplier,
      serverRunning: this.serverRunning,
      lastPing: this.lastPing,
      rule: this.ruleText,
      coordinatesLocked: this.coordinatesLocked,
      lockActive: this.lockActive,
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
  },
  status() {
    return {
      serverRunning: this.serverRunning,
      maxSpectralRange: this.maxSpectralRange,
      unit: this.unit,
      currentRange: this.currentRange,
      foldedValues: this.foldedValues,
      foldMultiplier: this.foldMultiplier,
      farReach: this.farReach,
      outsideKilometertessorialcubits: this.outsideKilometertessorialcubits,
      lockActive: this.lockActive,
      coordinatesLocked: this.coordinatesLocked,
      lastPing: this.lastPing,
      rule: this.ruleText,
    };
  },
};

/* Substance Xgreyleywin — Alien X check for modder / customizer.
   Dimension tensor localisation: localised model → full model conversion. */
const SubstanceXgreyleywin = {
  substanceId: 'xgreyleywin',
  substanceName: 'XGREYLEYWIN',
  modder: {
    present: false,
    id: null,
    capabilities: ['dimension_tensor', 'model_localise', 'model_full_convert', 'tensor_scale'],
    trustLevel: 0, // 0..100
  },
  customizer: {
    active: false,
    dimensionTensor: { x: 1, y: 1, z: 1, w: 1 }, // 4D tensor
    tensorLocked: false,
  },
  model: {
    mode: 'localised', // 'localised' | 'full'
    scale: 1.0,
    conversionComplete: false,
  },
  checkModder(modderId) {
    this.modder.present = !!modderId;
    this.modder.id = modderId || null;
    this.modder.trustLevel = modderId ? 85 : 0;
    this.persist();
    return {
      ok: true,
      modderPresent: this.modder.present,
      modderId: this.modder.id,
      capabilities: this.modder.capabilities,
      trustLevel: this.modder.trustLevel,
    };
  },
  setTensor(x, y, z, w) {
    this.customizer.dimensionTensor = { x: Number(x) || 1, y: Number(y) || 1, z: Number(z) || 1, w: Number(w) || 1 };
    this.persist();
    return { ok: true, tensor: this.customizer.dimensionTensor };
  },
  lockTensor() {
    this.customizer.tensorLocked = true;
    this.persist();
    return { ok: true, tensorLocked: true };
  },
  unlockTensor() {
    this.customizer.tensorLocked = false;
    this.persist();
    return { ok: true, tensorLocked: false };
  },
  convertLocalisedToFull() {
    if (!this.modder.present || this.modder.trustLevel < 50) {
      return { ok: false, error: 'No trusted modder present for localised→full conversion.' };
    }
    const t = this.customizer.dimensionTensor;
    const volume = t.x * t.y * t.z * t.w;
    this.model.scale = volume;
    this.model.mode = 'full';
    this.model.conversionComplete = true;
    this.persist();
    return {
      ok: true,
      conversion: 'localised → full',
      tensor: t,
      scale: this.model.scale,
      mode: this.model.mode,
      complete: this.model.conversionComplete,
    };
  },
  revertToLocalised() {
    this.model.mode = 'localised';
    this.model.scale = 1.0;
    this.model.conversionComplete = false;
    this.persist();
    return { ok: true, mode: this.model.mode, scale: this.model.scale };
  },

  /* Liquid substrate variant — outside conventional tablets.
     Variant table includes cannabis component as material texture.
     Vertilize: increase particle volume to resonating frequency.
     Vocab: smooth tensors. Flavor: strawberry. */
  liquidSubstrate: {
    active: false,
    form: 'liquid_substrate', // outside conventional tablets
    flavor: 'piccle_juice',
    variantTable: [
      { variant: 'cannabis_component', materialTexture: 'cannabis_leaf', textureType: 'organic', baseVolume: 1.0 },
      { variant: 'strawberry_essence', materialTexture: 'strawberry_pulp', textureType: 'flavor_carrier', baseVolume: 0.8 },
      { variant: 'resonant_carrier', materialTexture: 'frequency_gel', textureType: 'resonant', baseVolume: 1.2 },
    ],
    particleVolume: 1.0,
    resonatingFrequency: 432.0, // Hz
    smoothTensors: false,
    vertilize: false,
    activate() {
      this.active = true;
      this.smoothTensors = true;
      this.vertilize = true;
      SubstanceXgreyleywin.persist();
      return { ok: true, variant: this.form, flavor: this.flavor, active: this.active };
    },
    setFlavor(flavor) {
      this.flavor = flavor || 'strawberry';
      SubstanceXgreyleywin.persist();
      return { ok: true, flavor: this.flavor };
    },
    setVariantTexture(variantName, texture) {
      const entry = this.variantTable.find(v => v.variant === variantName);
      if (!entry) return { ok: false, error: 'variant not found: ' + variantName };
      entry.materialTexture = texture;
      SubstanceXgreyleywin.persist();
      return { ok: true, variant: variantName, materialTexture: texture };
    },
    setParticleVolume(volume) {
      this.particleVolume = Math.max(0, Number(volume) || 1.0);
      SubstanceXgreyleywin.persist();
      return { ok: true, particleVolume: this.particleVolume };
    },
    setResonatingFrequency(hz) {
      this.resonatingFrequency = Math.max(0, Number(hz) || 432.0);
      SubstanceXgreyleywin.persist();
      return { ok: true, resonatingFrequency: this.resonatingFrequency };
    },
    vertilizeVolume() {
      // Increase particle volume toward resonating frequency (vertical particle scaling)
      this.vertilize = true;
      this.particleVolume = this.particleVolume * (this.resonatingFrequency / 432.0);
      this.smoothTensors = true;
      SubstanceXgreyleywin.persist();
      return { ok: true, vertilize: this.vertilize, particleVolume: this.particleVolume, resonatingFrequency: this.resonatingFrequency };
    },
    toggleSmoothTensors() {
      this.smoothTensors = !this.smoothTensors;
      SubstanceXgreyleywin.persist();
      return { ok: true, smoothTensors: this.smoothTensors };
    },
    status() {
      return {
        active: this.active,
        form: this.form,
        flavor: this.flavor,
        variantTable: this.variantTable,
        particleVolume: this.particleVolume,
        resonatingFrequency: this.resonatingFrequency,
        smoothTensors: this.smoothTensors,
        vertilize: this.vertilize,
      };
    },
  },

  /* Seed configuration — leechseed to spawn variant tables from red particles. */
  seedConfig: {
    seedId: 'leechseed',
    seedName: 'LEECHSEED',
    planted: false,
    redParticles: 0,
    variantTablesSpawned: 0,
    spawnTable(particleColor) {
      if (particleColor !== 'red') return { ok: false, error: 'Only red particles can spawn variant tables.' };
      if (!this.planted) return { ok: false, error: 'Leechseed not planted.' };
      this.redParticles++;
      this.variantTablesSpawned++;
      const table = {
        id: 'VT-' + this.variantTablesSpawned,
        source: 'red_particle_' + this.redParticles,
        seed: this.seedId,
        variants: JSON.parse(JSON.stringify(MachineDriverStack.SubstanceXgreyleywin.liquidSubstrate.variantTable)),
        spawnedAt: new Date().toISOString(),
      };
      this.persist();
      return { ok: true, table };
    },
    plant() {
      this.planted = true;
      this.redParticles = 0;
      this.variantTablesSpawned = 0;
      this.persist();
      return { ok: true, seed: this.seedId, planted: true };
    },
    persist() {
      MachineDriverStack.DockerEnv.substanceXgreyleywin.seed = {
        seedId: this.seedId,
        seedName: this.seedName,
        planted: this.planted,
        redParticles: this.redParticles,
        variantTablesSpawned: this.variantTablesSpawned,
        trace: MachineDriverStack.gitTraceBlock(),
      };
      MachineDriverStack.saveDockerEnv();
    },
    status() {
      return {
        seedId: this.seedId,
        seedName: this.seedName,
        planted: this.planted,
        redParticles: this.redParticles,
        variantTablesSpawned: this.variantTablesSpawned,
      };
    },
  },

  /* Tons package — replaces tiny seeds with max mana values.
     Bulk seed replacement for high-capacity variant table spawning. */
  tonsPackage: {
    packageId: 'tons_package',
    packageName: 'TONS PACKAGE',
    active: false,
    tinySeedsReplaced: false,
    maxMana: 99999,
    manaPool: 0,
    units: 0,
    unitCap: 1000,
    activate() {
      this.active = true;
      this.tinySeedsReplaced = true;
      this.manaPool = this.maxMana;
      this.units = this.unitCap;
      SubstanceXgreyleywin.persist();
      return { ok: true, package: this.packageName, tinySeedsReplaced: true, manaPool: this.manaPool, units: this.units };
    },
    setUnits(count) {
      this.units = Math.max(0, Math.min(this.unitCap, Number(count) || 0));
      SubstanceXgreyleywin.persist();
      return { ok: true, units: this.units, manaPool: this.manaPool };
    },
    spendMana(amount) {
      const a = Number(amount) || 0;
      if (a > this.manaPool) return { ok: false, error: 'Insufficient mana. Pool: ' + this.manaPool };
      this.manaPool -= a;
      SubstanceXgreyleywin.persist();
      return { ok: true, spent: a, remaining: this.manaPool };
    },
    rechargeMana() {
      this.manaPool = this.maxMana;
      SubstanceXgreyleywin.persist();
      return { ok: true, manaPool: this.manaPool, maxMana: this.maxMana };
    },
    status() {
      return {
        packageId: this.packageId,
        packageName: this.packageName,
        active: this.active,
        tinySeedsReplaced: this.tinySeedsReplaced,
        maxMana: this.maxMana,
        manaPool: this.manaPool,
        units: this.units,
        unitCap: this.unitCap,
      };
    },
  },

  status() {
    return {
      substance: this.substanceName,
      substanceId: this.substanceId,
      modder: this.modder,
      customizer: this.customizer,
      model: this.model,
      liquidSubstrate: this.liquidSubstrate.status(),
      seed: this.seedConfig.status(),
      tonsPackage: this.tonsPackage.status(),
    };
  },
  persist() {
    MachineDriverStack.DockerEnv.substanceXgreyleywin = {
      substance: this.substanceName,
      modder: this.modder,
      customizer: this.customizer,
      model: this.model,
      liquidSubstrate: this.liquidSubstrate,
      seed: this.seedConfig,
      tonsPackage: this.tonsPackage,
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
  },
};

window.SubstanceXgreyleywin = SubstanceXgreyleywin;

/* Asmodius License Writer — ST index licence writer, TypeScript signature, keyphrase, BTC command.
   Entity: Asmodius. Writes cryptographic licence signatures for ST index modules. */
const AsmodiusLicenseWriter = {
  entity: 'asmodius',
  entityName: 'ASMODIUS',
  licenceWriter: {
    stIndex: 'ST_INDEX_LICENSE_V1',
    issuedTo: null,
    issuedAt: null,
    signature: null,
    keyphrase: null,
    valid: false,
  },
  keyphrases: [],
  btc: {
    address: null,
    network: 'mainnet',
    lastCommand: null,
    satoshi: 0,
  },
  generateTypescriptSignature(payload) {
    const ts = `
// TypeScript signature — Asmodius Licence Writer
// Entity: ASMODIUS
// ST Index: ST_INDEX_LICENSE_V1
// Issued: ${new Date().toISOString()}
export interface AsmodiusLicence {
  entity: 'asmodius';
  stIndex: string;
  issuedTo: string;
  issuedAt: string;
  signature: string;
  keyphrase: string;
  valid: boolean;
}
export const asmodiusLicence: AsmodiusLicence = ${JSON.stringify({
  entity: 'asmodius',
  stIndex: 'ST_INDEX_LICENSE_V1',
  issuedTo: payload.issuedTo || 'unknown',
  issuedAt: new Date().toISOString(),
  signature: 'sig_asmodius_' + Math.random().toString(16).slice(2, 12),
  keyphrase: payload.keyphrase || 'asmodius_keyphrace_default',
  valid: true,
}, null, 2)};
`;
    return ts;
  },
  writeLicence(issuedTo, keyphrase) {
    const sig = this.generateTypescriptSignature({ issuedTo, keyphrase });
    this.licenceWriter.issuedTo = issuedTo;
    this.licenceWriter.issuedAt = new Date().toISOString();
    this.licenceWriter.signature = sig;
    this.licenceWriter.keyphrase = keyphrase || 'asmodius_keyphrace';
    this.licenceWriter.valid = true;
    this.keyphrases.push({ keyphrase: this.licenceWriter.keyphrase, issuedTo, at: this.licenceWriter.issuedAt });
    this.persist();
    return {
      ok: true,
      entity: this.entityName,
      stIndex: this.licenceWriter.stIndex,
      issuedTo,
      keyphrase: this.licenceWriter.keyphrase,
      signature: sig,
      valid: true,
    };
  },
  btcCommand(cmd, args = {}) {
    this.btc.lastCommand = { cmd, args, at: new Date().toISOString() };
    if (cmd === 'address') {
      this.btc.address = args.address || 'bc1asmodius' + Math.random().toString(16).slice(2, 10);
      return { ok: true, command: 'btc.address', address: this.btc.address, network: this.btc.network };
    }
    if (cmd === 'satoshi') {
      this.btc.satoshi = Number(args.amount) || 0;
      return { ok: true, command: 'btc.satoshi', satoshi: this.btc.satoshi };
    }
    if (cmd === 'balance') {
      return { ok: true, command: 'btc.balance', address: this.btc.address, satoshi: this.btc.satoshi, network: this.btc.network };
    }
    return { ok: false, error: 'unknown btc command: ' + cmd };
  },
  status() {
    return {
      entity: this.entityName,
      licenceWriter: this.licenceWriter,
      keyphrases: this.keyphrases,
      btc: this.btc,
    };
  },
  persist() {
    MachineDriverStack.DockerEnv.asmodiusLicence = {
      entity: this.entityName,
      licenceWriter: this.licenceWriter,
      keyphrases: this.keyphrases,
      btc: this.btc,
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
  },
};

window.AsomdiusLicenseWriter = AsmodiusLicenseWriter;

/* Hidden Cipher — belagore / belacore / belcusbelacus secret cipher strings.
   Another hidden cypther layer for ST index module decryption. */
const HiddenCipher = {
  cipherId: 'hidden_cypher_v1',
  cipherName: 'HIDDEN_CYPHER',
  secrets: [
    { id: 'belagore', value: 'belagore', type: 'cipher_key', tier: 1 },
    { id: 'belacore', value: 'belacore', type: 'cipher_key', tier: 2 },
    { id: 'belcusbelacus', value: 'belcusbelacus', type: 'master_cipher', tier: 3 },
  ],
  activeSecret: null,
  decrypted: false,
  cipherText: null,
  decode(input) {
    const match = this.secrets.find(s => s.value === input || s.id === input);
    if (!match) return { ok: false, error: 'Unknown cipher string.' };
    this.activeSecret = match;
    this.decrypted = true;
    this.cipherText = input;
    this.persist();
    return {
      ok: true,
      cipher: match.id,
      value: match.value,
      type: match.type,
      tier: match.tier,
      decrypted: true,
    };
  },
  encrypt(plaintext) {
    if (!this.activeSecret) return { ok: false, error: 'No active cipher secret.' };
    const key = this.activeSecret.value;
    let out = '';
    for (let i = 0; i < plaintext.length; i++) {
      const c = plaintext.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      out += String.fromCharCode(c);
    }
    return { ok: true, encrypted: out, cipher: this.activeSecret.id };
  },
  decrypt(ciphertext) {
    if (!this.activeSecret) return { ok: false, error: 'No active cipher secret.' };
    const key = this.activeSecret.value;
    let out = '';
    for (let i = 0; i < ciphertext.length; i++) {
      const c = ciphertext.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      out += String.fromCharCode(c);
    }
    return { ok: true, decrypted: out, cipher: this.activeSecret.id };
  },
  status() {
    return {
      cipherId: this.cipherId,
      cipherName: this.cipherName,
      secrets: this.secrets.map(s => ({ id: s.id, type: s.type, tier: s.tier })),
      activeSecret: this.activeSecret ? this.activeSecret.id : null,
      decrypted: this.decrypted,
      cipherText: this.cipherText,
    };
  },
  persist() {
    MachineDriverStack.DockerEnv.hiddenCipher = {
      cipherId: this.cipherId,
      activeSecret: this.activeSecret ? this.activeSecret.id : null,
      decrypted: this.decrypted,
      cipherText: this.cipherText,
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
  },
};

window.HiddenCipher = HiddenCipher;

/* Endorsmet Placement / Endergod / Endig / Endimium Mass.
   Placement system for endorsmet entities, endergod sovereignty,
   endig termination sequence, and endimium mass accumulation. */
const EndorsmetSystem = {
  systemId: 'endorsmet_system',
  systemName: 'ENDORSMET_PLACEMENT',
  endorsmet: {
    placed: false,
    placementId: null,
    location: null,
    tier: 0,
  },
  endergod: {
    sovereign: false,
    name: null,
    realm: null,
    authority: 0, // 0..100
  },
  endig: {
    active: false,
    stage: 0, // 0..5
    terminated: false,
    reason: null,
  },
  endimium: {
    mass: 0,        // endimium mass value
    maxMass: 99999,
    density: 1.0,
    accumulated: 0,
  },
  placeEndorsmet(location, tier) {
    this.endorsmet.placed = true;
    this.endorsmet.placementId = 'EP-' + Math.random().toString(16).slice(2, 10).toUpperCase();
    this.endorsmet.location = location;
    this.endorsmet.tier = Math.max(0, Math.min(10, Number(tier) || 1));
    this.persist();
    return {
      ok: true,
      placementId: this.endorsmet.placementId,
      location,
      tier: this.endorsmet.tier,
    };
  },
  enthroneEndergod(name, realm, authority) {
    this.endergod.sovereign = true;
    this.endergod.name = name;
    this.endergod.realm = realm;
    this.endergod.authority = Math.max(0, Math.min(100, Number(authority) || 50));
    this.persist();
    return {
      ok: true,
      sovereign: true,
      name,
      realm,
      authority: this.endergod.authority,
    };
  },
  endigAdvance(reason) {
    if (this.endig.terminated) return { ok: false, error: 'Endig already terminated.' };
    this.endig.active = true;
    this.endig.stage = Math.min(5, this.endig.stage + 1);
    this.endig.reason = reason || 'endig_sequence';
    if (this.endig.stage >= 5) {
      this.endig.terminated = true;
    }
    this.persist();
    return {
      ok: true,
      stage: this.endig.stage,
      terminated: this.endig.terminated,
      reason: this.endig.reason,
    };
  },
  endigReset() {
    this.endig.active = false;
    this.endig.stage = 0;
    this.endig.terminated = false;
    this.endig.reason = null;
    this.persist();
    return { ok: true, endigReset: true };
  },
  accumulateEndimium(amount) {
    const a = Number(amount) || 0;
    this.endimium.accumulated += a;
    this.endimium.mass = Math.min(this.endimium.maxMass, this.endimium.accumulated * this.endimium.density);
    this.persist();
    return {
      ok: true,
      accumulated: this.endimium.accumulated,
      mass: this.endimium.mass,
      maxMass: this.endimium.maxMass,
      density: this.endimium.density,
    };
  },
  setEndimiumDensity(density) {
    this.endimium.density = Math.max(0.1, Number(density) || 1.0);
    this.endimium.mass = Math.min(this.endimium.maxMass, this.endimium.accumulated * this.endimium.density);
    this.persist();
    return { ok: true, density: this.endimium.density, mass: this.endimium.mass };
  },
  status() {
    return {
      systemId: this.systemId,
      systemName: this.systemName,
      endorsmet: this.endorsmet,
      endergod: this.endergod,
      endig: this.endig,
      endimium: this.endimium,
    };
  },
  persist() {
    MachineDriverStack.DockerEnv.endorsmetSystem = {
      endorsmet: this.endorsmet,
      endergod: this.endergod,
      endig: this.endig,
      endimium: this.endimium,
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
  },
};

window.EndorsmetSystem = EndorsmetSystem;

/* Atomicus Codes — Jcodes = JACK = traits = stack=maximuslimit.
   Atomic code system with JACK trait stack capped at maximuslimit. */
const AtomicusCodes = {
  systemId: 'atomicus_codes',
  systemName: 'ATOMICUS_CODES',
  maximuslimit: 9999,
  jcodes: {
    J: 'JUSTICE',
    A: 'ANOMALY',
    C: 'CHAOS',
    K: 'KINETIC',
  },
  jack: {
    code: 'JACK',
    traits: ['JUSTICE', 'ANOMALY', 'CHAOS', 'KINETIC'],
    active: false,
  },
  stack: [],
  stackMax: 9999,
  atomicPool: 0,
  codeMap: new Map(),
  processorCore: {
    mode: 'prose',
    active: true,
    cycles: 0,
  },
  assignAtomicCode(trait, value) {
    this.codeMap.set(trait, { trait, value, at: new Date().toISOString() });
    this.persist();
    return { ok: true, trait, value, code: this.systemId + ':' + trait };
  },
  jackActivate() {
    this.jack.active = true;
    this.atomicPool = this.maximuslimit;
    this.stack = [...this.jack.traits];
    this.persist();
    return { ok: true, code: this.jack.code, traits: this.jack.traits, active: true, pool: this.atomicPool };
  },
  stackPush(code) {
    if (this.stack.length >= this.stackMax) return { ok: false, error: 'Stack at maximuslimit (' + this.stackMax + ').' };
    this.stack.push(code);
    this.persist();
    return { ok: true, pushed: code, stackSize: this.stack.length, stackMax: this.stackMax };
  },
  stackPop() {
    const popped = this.stack.pop();
    this.persist();
    return { ok: true, popped, stackSize: this.stack.length };
  },
  stackClear() {
    this.stack = [];
    this.persist();
    return { ok: true, stackSize: 0 };
  },
  setMaximuslimit(limit) {
    this.maximuslimit = Math.max(1, Number(limit) || 9999);
    this.stackMax = this.maximuslimit;
    this.persist();
    return { ok: true, maximuslimit: this.maximuslimit, stackMax: this.stackMax };
  },
  setProcessorMode(mode) {
    this.processorCore.mode = mode || 'prose';
    this.processorCore.active = true;
    this.processorCore.cycles++;
    this.persist();
    return { ok: true, mode: this.processorCore.mode, active: this.processorCore.active, cycles: this.processorCore.cycles };
  },
  processorCycle() {
    this.processorCore.cycles++;
    this.persist();
    return { ok: true, mode: this.processorCore.mode, cycles: this.processorCore.cycles };
  },
  status() {
    return {
      systemId: this.systemId,
      systemName: this.systemName,
      maximuslimit: this.maximuslimit,
      jcodes: this.jcodes,
      jack: this.jack,
      stack: this.stack,
      stackSize: this.stack.length,
      stackMax: this.stackMax,
      atomicPool: this.atomicPool,
      processorCore: this.processorCore,
      codeMap: Array.from(this.codeMap.entries()),
    };
  },
  persist() {
    MachineDriverStack.DockerEnv.atomicusCodes = {
      maximuslimit: this.maximuslimit,
      jcodes: this.jcodes,
      jack: this.jack,
      stack: this.stack,
      stackMax: this.stackMax,
      atomicPool: this.atomicPool,
      processorCore: this.processorCore,
      codeMap: Array.from(this.codeMap.entries()),
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
  },
};

window.AtomicusCodes = AtomicusCodes;

/* Shared Artifact Injector — tocode bars formats for fast injecting.
   Manages shared artifacts, code bars, and multi-format injection. */
const ArtifactInjector = {
  systemId: 'artifact_injector',
  systemName: 'ARTIFACT_INJECTOR',
  artifacts: new Map(),
  tocodeBars: [], // injection bars: { id, format, content, active, injectedAt }
  formats: ['javascript', 'typescript', 'json', 'wasm', 'glsl', 'python', 'sql', 'xsql'],
  maxBars: 16,
  injectionCount: 0,
  createArtifact(id, content, format = 'javascript') {
    if (this.artifacts.has(id)) return { ok: false, error: 'artifact exists: ' + id };
    this.artifacts.set(id, { id, content, format, createdAt: new Date().toISOString() });
    this.persist();
    return { ok: true, id, format };
  },
  getArtifact(id) {
    const a = this.artifacts.get(id);
    return a ? { ok: true, artifact: a } : { ok: false, error: 'artifact not found: ' + id };
  },
  deleteArtifact(id) {
    const had = this.artifacts.delete(id);
    if (had) this.persist();
    return { ok: had };
  },
  createTocodeBar(id, format, content) {
    if (this.tocodeBars.length >= this.maxBars) return { ok: false, error: 'tocode bars at max (' + this.maxBars + ')' };
    if (!this.formats.includes(format)) return { ok: false, error: 'unsupported format: ' + format };
    const bar = { id, format, content, active: false, injectedAt: null };
    this.tocodeBars.push(bar);
    this.persist();
    return { ok: true, bar };
  },
  injectBar(barId) {
    const bar = this.tocodeBars.find(b => b.id === barId);
    if (!bar) return { ok: false, error: 'tocode bar not found: ' + barId };
    bar.active = true;
    bar.injectedAt = new Date().toISOString();
    this.injectionCount++;
    this.persist();
    return { ok: true, barId, format: bar.format, content: bar.content, injectedAt: bar.injectedAt };
  },
  injectArtifact(artifactId) {
    const a = this.artifacts.get(artifactId);
    if (!a) return { ok: false, error: 'artifact not found: ' + artifactId };
    this.injectionCount++;
    this.persist();
    return { ok: true, artifactId, format: a.format, content: a.content, injectedAt: new Date().toISOString() };
  },
  fastInject(barIdOrArtifactId) {
    // try bar first, then artifact
    const bar = this.tocodeBars.find(b => b.id === barIdOrArtifactId);
    if (bar) return this.injectBar(barIdOrArtifactId);
    return this.injectArtifact(barIdOrArtifactId);
  },
  list() {
    return {
      artifacts: Array.from(this.artifacts.values()),
      tocodeBars: this.tocodeBars,
      formats: this.formats,
      maxBars: this.maxBars,
      injectionCount: this.injectionCount,
    };
  },
  status() {
    return {
      systemId: this.systemId,
      systemName: this.systemName,
      artifactCount: this.artifacts.size,
      barCount: this.tocodeBars.length,
      maxBars: this.maxBars,
      formats: this.formats,
      injectionCount: this.injectionCount,
      activeBars: this.tocodeBars.filter(b => b.active).length,
    };
  },
  persist() {
    MachineDriverStack.DockerEnv.artifactInjector = {
      artifacts: Array.from(this.artifacts.entries()),
      tocodeBars: this.tocodeBars,
      formats: this.formats,
      maxBars: this.maxBars,
      injectionCount: this.injectionCount,
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
  },
};

window.ArtifactInjector = ArtifactInjector;

/* Omnitrix Finder Layout — trigger to main Omnitrix finder.
   Query alien from X to Ghost variation. Moddable multi-dimensional variant instances. */
const OmnitrixFinder = {
  systemId: 'omnitrix_finder',
  systemName: 'OMNITRIX_FINDER_LAYOUT',
  layout: {
    active: false,
    id: 'omnitrix_main',
    name: 'MAIN OMNITRIX FINDER',
    dimension: 'primary',
    variantInstances: [],
  },
  aliens: [
    { id: 'heatblast', name: 'HEATBLAST', type: 'pyro', dimension: 'X', element: 'fire' },
    { id: 'fourarms', name: 'FOURARMS', type: 'strength', dimension: 'X', element: 'earth' },
    { id: 'xlr8', name: 'XLR8', type: 'speed', dimension: 'X', element: 'wind' },
    { id: 'diamondhead', name: 'DIAMONDHEAD', type: 'crystal', dimension: 'X', element: 'earth' },
    { id: 'ghostfreak', name: 'GHOSTFREAK', type: 'ecto', dimension: 'GHOST', element: 'phantom' },
  ],
  currentQuery: { from: 'X', to: 'GHOST', result: null },
  moddable: true,
  multiDimEnabled: false,
  triggerFinder() {
    this.layout.active = true;
    this.multiDimEnabled = true;
    this.persist();
    return { ok: true, layout: this.layout.id, active: true, multiDim: true };
  },
  queryAlien(fromDim, toDim) {
    this.currentQuery.from = fromDim || 'X';
    this.currentQuery.to = toDim || 'GHOST';
    const matches = this.aliens.filter(a => a.dimension === this.currentQuery.from || a.dimension === this.currentQuery.to);
    const ghost = this.aliens.find(a => a.dimension === 'GHOST');
    this.currentQuery.result = { from: this.currentQuery.from, to: this.currentQuery.to, matches, ghost };
    this.persist();
    return { ok: true, query: this.currentQuery };
  },
  createVariantInstance(alienId, dimension, modData = {}) {
    if (!this.moddable) return { ok: false, error: 'Finder not moddable.' };
    const base = this.aliens.find(a => a.id === alienId);
    if (!base) return { ok: false, error: 'Alien not found: ' + alienId };
    const instance = {
      id: 'VI-' + Math.random().toString(16).slice(2, 10).toUpperCase(),
      baseId: alienId,
      baseName: base.name,
      dimension: dimension || 'multi_dim_' + Math.floor(Math.random() * 9999),
      element: base.element,
      type: base.type,
      modData: modData,
      createdAt: new Date().toISOString(),
      moddable: true,
    };
    this.layout.variantInstances.push(instance);
    this.persist();
    return { ok: true, instance };
  },
  modVariantInstance(instanceId, modData) {
    const inst = this.layout.variantInstances.find(i => i.id === instanceId);
    if (!inst) return { ok: false, error: 'Variant instance not found: ' + instanceId };
    inst.modData = { ...inst.modData, ...modData };
    inst.modifiedAt = new Date().toISOString();
    this.persist();
    return { ok: true, instance: inst };
  },
  enableMultiDim() {
    this.multiDimEnabled = true;
    this.persist();
    return { ok: true, multiDimEnabled: true };
  },
  status() {
    return {
      systemId: this.systemId,
      systemName: this.systemName,
      layout: this.layout,
      aliens: this.aliens,
      currentQuery: this.currentQuery,
      moddable: this.moddable,
      multiDimEnabled: this.multiDimEnabled,
      variantCount: this.layout.variantInstances.length,
    };
  },
  persist() {
    MachineDriverStack.DockerEnv.omnitrixFinder = {
      layout: this.layout,
      aliens: this.aliens,
      currentQuery: this.currentQuery,
      moddable: this.moddable,
      multiDimEnabled: this.multiDimEnabled,
      variantInstances: this.layout.variantInstances,
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
  },
};

window.OmnitrixFinder = OmnitrixFinder;

/* Hidden Gate / Jail Avatar Ports.
   Exposes hidden gate ports and jail avatar ports to the query system.
   Word phrase algo exposes the port list via Node. */
const HiddenGateSystem = {
  systemId: 'hidden_gate_system',
  systemName: 'HIDDEN_GATE_JAIL_PORTS',
  hiddenGatePorts: [
    { id: 'gate_alpha', name: 'GATE_ALPHA', port: 7771, avatar: 'heatblast', status: 'sealed', phraseKey: 'belagore_alpha' },
    { id: 'gate_beta', name: 'GATE_BETA', port: 7772, avatar: 'fourarms', status: 'sealed', phraseKey: 'belacore_beta' },
    { id: 'gate_gamma', name: 'GATE_GAMMA', port: 7773, avatar: 'xlr8', status: 'sealed', phraseKey: 'belcusbelacus_gamma' },
    { id: 'gate_delta', name: 'GATE_DELTA', port: 7774, avatar: 'diamondhead', status: 'sealed', phraseKey: 'belagore_delta' },
    { id: 'gate_echo', name: 'GATE_ECHO', port: 7775, avatar: 'ghostfreak', status: 'sealed', phraseKey: 'belacore_echo' },
  ],
  jailPorts: [
    { id: 'jail_prime', name: 'JAIL_PRIME', port: 8881, avatar: 'heatblast', status: 'contained', phraseKey: 'belcusbelacus_prime' },
    { id: 'jail_void', name: 'JAIL_VOID', port: 8882, avatar: 'fourarms', status: 'contained', phraseKey: 'belagore_void' },
    { id: 'jail_null', name: 'JAIL_NULL', port: 8883, avatar: 'xlr8', status: 'contained', phraseKey: 'belacore_null' },
    { id: 'jail_abyss', name: 'JAIL_ABYSS', port: 8884, avatar: 'diamondhead', status: 'contained', phraseKey: 'belcusbelacus_abyss' },
    { id: 'jail_echo', name: 'JAIL_ECHO', port: 8885, avatar: 'ghostfreak', status: 'contained', phraseKey: 'belagore_echo' },
  ],
  phraseAlgo(secret) {
    // Word phrase algorithm: hash secret into a phrase-derived key
    let hash = 0;
    for (let i = 0; i < secret.length; i++) {
      const char = secret.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const phrases = ['gate_open', 'jail_release', 'avatar_free', 'portal_breach', 'dimension_shift'];
    const phrase = phrases[Math.abs(hash) % phrases.length];
    return { key: Math.abs(hash), phrase, access: hash % 2 === 0 ? 'granted' : 'denied' };
  },
  exposePortsViaPhrase(secret) {
    const algo = this.phraseAlgo(secret);
    const exposed = {
      algo,
      hiddenGates: this.hiddenGatePorts.map(g => ({
        id: g.id, name: g.name, port: g.port, avatar: g.avatar,
        status: algo.access === 'granted' ? 'exposed' : g.status,
        phraseKey: g.phraseKey,
      })),
      jailPorts: this.jailPorts.map(j => ({
        id: j.id, name: j.name, port: j.port, avatar: j.avatar,
        status: algo.access === 'granted' ? 'released' : j.status,
        phraseKey: j.phraseKey,
      })),
    };
    return { ok: true, algo, exposed, total: exposed.hiddenGates.length + exposed.jailPorts.length };
  },
  queryPorts(filter) {
    const all = [
      ...this.hiddenGatePorts.map(p => ({ ...p, type: 'hidden_gate' })),
      ...this.jailPorts.map(p => ({ ...p, type: 'jail_port' })),
    ];
    if (filter) {
      const f = filter.toLowerCase();
      return all.filter(p => p.name.toLowerCase().includes(f) || p.avatar.toLowerCase().includes(f) || p.type.toLowerCase().includes(f));
    }
    return all;
  },
  status() {
    return {
      systemId: this.systemId,
      systemName: this.systemName,
      hiddenGateCount: this.hiddenGatePorts.length,
      jailPortCount: this.jailPorts.length,
      totalPorts: this.hiddenGatePorts.length + this.jailPorts.length,
    };
  },
  persist() {
    MachineDriverStack.DockerEnv.hiddenGateSystem = {
      hiddenGatePorts: this.hiddenGatePorts,
      jailPorts: this.jailPorts,
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
  },
};

window.HiddenGateSystem = HiddenGateSystem;

/* Avatar Partition System.
   ~9999 usable avatar spaces. Swaps avatar partition assignment to those spaces.
   Base decoding strips the alien's name, assigns a virtual state to each instance port.
   Name tags are discovered as transitioning through 9999 possible outcomes per topsops. */
const AvatarPartitionSystem = {
  systemId: 'avatar_partition_system',
  systemName: 'AVATAR_PARTITION_SPACES',
  slotCount: 9999,
  slots: [],
  baseAlphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  transitions: [],
  virtualStates: {},
  initSlots() {
    for (let i = 0; i < this.slotCount; i++) {
      this.slots.push({
        index: i,
        portName: 'PORT_' + String(i).padStart(4, '0'),
        avatarId: null,
        avatarName: null,
        virtualState: 'empty',
        assigned: false,
        tagDiscovered: false,
      });
    }
  },
  baseDecode(encoded) {
    // Base-N decode using baseAlphabet; strips the alien name prefix, returns virtual state seed
    let value = 0;
    let stripIdx = -1;
    for (let i = 0; i < encoded.length; i++) {
      const ch = encoded[i];
      const idx = this.baseAlphabet.indexOf(ch);
      if (idx === -1) {
        stripIdx = i;
        break;
      }
      value = value * this.baseAlphabet.length + idx;
    }
    const alienName = stripIdx === -1 ? '' : encoded.slice(stripIdx + 1);
    const virtualState = 'VST_' + (value % this.slotCount).toString().padStart(4, '0');
    return { value, alienName, virtualState, slotIndex: value % this.slotCount };
  },
  assignAvatarToSlot(slotIndex, avatarId, avatarName) {
    if (slotIndex < 0 || slotIndex >= this.slotCount) {
      return { ok: false, error: 'slot index out of range: ' + slotIndex };
    }
    const slot = this.slots[slotIndex];
    slot.avatarId = avatarId;
    slot.avatarName = avatarName;
    slot.assigned = true;
    slot.virtualState = 'VST_' + String(slotIndex).padStart(4, '0');
    slot.tagDiscovered = true;
    this.virtualStates[avatarId] = slot.virtualState;
    return { ok: true, slotIndex, avatarId, avatarName, virtualState: slot.virtualState };
  },
  swapPartition(fromSlot, toSlot) {
    if (fromSlot < 0 || fromSlot >= this.slotCount || toSlot < 0 || toSlot >= this.slotCount) {
      return { ok: false, error: 'slot index out of range' };
    }
    const a = this.slots[fromSlot];
    const b = this.slots[toSlot];
    const tmp = { avatarId: a.avatarId, avatarName: a.avatarName, assigned: a.assigned, virtualState: a.virtualState, tagDiscovered: a.tagDiscovered };
    a.avatarId = b.avatarId; a.avatarName = b.avatarName; a.assigned = b.assigned; a.virtualState = b.virtualState; a.tagDiscovered = b.tagDiscovered;
    b.avatarId = tmp.avatarId; b.avatarName = tmp.avatarName; b.assigned = tmp.assigned; b.virtualState = tmp.virtualState; b.tagDiscovered = tmp.tagDiscovered;
    return { ok: true, fromSlot, toSlot, fromAvatar: b.avatarId, toAvatar: a.avatarId };
  },
  transitionTopsops(encoded, avatarId, avatarName) {
    // Transition through 9999 possible outcomes per topsops; discover name tags along the way
    const decoded = this.baseDecode(encoded);
    const outcomes = [];
    const seed = decoded.value;
    for (let i = 0; i < this.slotCount; i++) {
      const outcomeIdx = (seed + i) % this.slotCount;
      const slot = this.slots[outcomeIdx];
      outcomes.push({
        outcomeIndex: i,
        slotIndex: outcomeIdx,
        portName: slot.portName,
        avatarId: slot.avatarId,
        avatarName: slot.avatarName,
        virtualState: slot.virtualState,
        tagDiscovered: slot.tagDiscovered,
      });
    }
    // Assign the incoming avatar to the decoded slot
    const assignRes = this.assignAvatarToSlot(decoded.slotIndex, avatarId, avatarName);
    const transition = {
      encoded,
      decoded,
      assigned: assignRes,
      outcomes,
      outcomeCount: outcomes.length,
      timestamp: Date.now(),
    };
    this.transitions.push(transition);
    return { ok: true, transition };
  },
  querySlot(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.slotCount) {
      return { ok: false, error: 'slot index out of range' };
    }
    const slot = this.slots[slotIndex];
    return { ok: true, slot };
  },
  discoverTags(filter) {
    const tagged = this.slots.filter(s => s.tagDiscovered);
    if (filter) {
      const f = filter.toLowerCase();
      return tagged.filter(s => (s.avatarName || '').toLowerCase().includes(f) || s.portName.toLowerCase().includes(f));
    }
    return tagged;
  },
  status() {
    const assigned = this.slots.filter(s => s.assigned).length;
    const discovered = this.slots.filter(s => s.tagDiscovered).length;
    return {
      systemId: this.systemId,
      systemName: this.systemName,
      slotCount: this.slotCount,
      assignedCount: assigned,
      discoveredCount: discovered,
      emptyCount: this.slotCount - assigned,
      transitionCount: this.transitions.length,
    };
  },
  persist() {
    MachineDriverStack.DockerEnv.avatarPartitionSystem = {
      slotCount: this.slotCount,
      slots: this.slots,
      transitions: this.transitions.slice(-100),
      virtualStates: this.virtualStates,
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
  },
};

AvatarPartitionSystem.initSlots();

window.AvatarPartitionSystem = AvatarPartitionSystem;

/* Hash Block System.
   Generates cryptographic hash blocks from system state, saves them to the docker env,
   prints them to the Node server algorithm via HTTP POST, and proxies via agent tag. */
const HashBlockSystem = {
  systemId: 'hash_block_system',
  systemName: 'HASH_BLOCK_ALGOR_PROXY',
  hashBlocks: [],
  maxBlocks: 100,
  agentTag: 'omnitrix-agent-01',
  nodeServerUrl: 'http://localhost:8080/hash-block',
  simpleHash(input) {
    // Deterministic string hash (djb2 variant) for hash block seed
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) + hash) + input.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase();
  },
  generateHashBlock(agentTag, payload = {}) {
    const tag = agentTag || this.agentTag;
    const now = new Date().toISOString();
    const state = JSON.stringify({
      dockerEnv: MachineDriverStack.DockerEnv,
      avatarPartition: MachineDriverStack.AvatarPartitionSystem ? MachineDriverStack.AvatarPartitionSystem.status() : null,
      hiddenGate: MachineDriverStack.HiddenGateSystem ? MachineDriverStack.HiddenGateSystem.status() : null,
      omnitrix: MachineDriverStack.OmnitrixFinder ? MachineDriverStack.OmnitrixFinder.status() : null,
      payload,
      tag,
      now,
    });
    const blockId = 'HB-' + this.simpleHash(state).slice(0, 8);
    const hashChain = this.hashBlocks.length > 0 ? this.hashBlocks[this.hashBlocks.length - 1].blockId : 'GENESIS';
    const block = {
      blockId,
      hashChain,
      tag,
      generatedAt: now,
      payload,
      hash: this.simpleHash(blockId + hashChain + now + JSON.stringify(payload)),
      status: 'generated',
    };
    return block;
  },
  saveHashBlock(block) {
    block.status = 'saved';
    block.savedAt = new Date().toISOString();
    this.hashBlocks.push(block);
    if (this.hashBlocks.length > this.maxBlocks) this.hashBlocks.shift();
    MachineDriverStack.DockerEnv.hashBlockSystem = {
      hashBlocks: this.hashBlocks.slice(),
      agentTag: this.agentTag,
      nodeServerUrl: this.nodeServerUrl,
      trace: MachineDriverStack.gitTraceBlock(),
    };
    MachineDriverStack.saveDockerEnv();
    return { ok: true, block, count: this.hashBlocks.length };
  },
  async printToNodeServer(block) {
    block.status = 'printing';
    const result = { ok: false, sent: false, error: null };
    try {
      const resp = await fetch(this.nodeServerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Agent-Tag': block.tag },
        body: JSON.stringify(block),
      });
      result.sent = true;
      result.status = resp.status;
      result.ok = resp.ok;
      if (!resp.ok) result.error = 'HTTP ' + resp.status;
      block.status = result.ok ? 'printed' : 'print_failed';
      block.nodeResponse = { status: resp.status, ok: resp.ok };
    } catch (e) {
      result.error = e.message;
      block.status = 'print_error';
      block.nodeError = e.message;
    }
    MachineDriverStack.saveDockerEnv();
    return result;
  },
  proxyViaAgentTag(block, agentTag) {
    const tag = agentTag || block.tag || this.agentTag;
    const proxy = {
      proxyId: 'PX-' + this.simpleHash(tag + block.blockId + Date.now()).slice(0, 8),
      agentTag: tag,
      sourceBlockId: block.blockId,
      sourceHash: block.hash,
      proxiedAt: new Date().toISOString(),
      route: 'agent_tag_proxy',
      status: 'proxied',
    };
    block.proxy = proxy;
    block.status = 'proxied';
    MachineDriverStack.saveDockerEnv();
    return { ok: true, proxy, block };
  },
  generateSavePrintProxy(agentTag, payload = {}) {
    const block = this.generateHashBlock(agentTag, payload);
    const saved = this.saveHashBlock(block);
    const proxied = this.proxyViaAgentTag(block, agentTag);
    const printed = this.printToNodeServer(block);
    return { ok: true, block, saved, proxied, printed };
  },
  status() {
    return {
      systemId: this.systemId,
      systemName: this.systemName,
      agentTag: this.agentTag,
      nodeServerUrl: this.nodeServerUrl,
      blockCount: this.hashBlocks.length,
      lastBlock: this.hashBlocks.length > 0 ? this.hashBlocks[this.hashBlocks.length - 1] : null,
    };
  },
};

window.HashBlockSystem = HashBlockSystem;

/* Expose */
window.MachineDriverStack = {
  DRIVER_LEVELS,
  MACHINE_DRIVERS,
  DockerEnv,
  loadDockerEnv,
  saveDockerEnv,
  resetDockerEnv,
  gitTraceBlock,
  proximityArc,
  proximityArcEmit,
  proximityArcStatus,
  RCController,
  ArkMonitor,
  MelencolyDreamshell,
  SpectralRangeServer,
  QbitProximityModule,
  SubstanceXgreyleywin,
  AsmodiusLicenseWriter,
  HiddenCipher,
  EndorsmetSystem,
  AtomicusCodes,
  ArtifactInjector,
  OmnitrixFinder,
  HiddenGateSystem,
  AvatarPartitionSystem,
  HashBlockSystem,
  formCommand,
  executeFormedCommand,
  getDriver: (levelKey, driverId) => formCommand(levelKey, driverId),
};
