/**
 * The departures map itself: an imperative d3 scene inside one <svg>.
 *
 * React owns everything around it (copy, the list, the bar); this module owns
 * the geometry and the interaction on the drawing, and reports what the user
 * is looking at through `onChange`. Two levels: the country, with a count per
 * state, and one open state, where cities are the buttons and pressing one
 * draws its connections, one line per destination.
 */
import * as d3 from 'd3';
import { cityKey, type City, type MapData, type MapItem, type StateFeature } from './data';

export interface CityNode extends City {
  xy: [number, number];
  lit: boolean;
  leaving: MapItem[];
  arriving: MapItem[];
  trips: MapItem[];
  n: number;
}

export interface Bundle {
  id: string;
  kind: 'request' | 'trip';
  other: { city: string; state: string; key: string };
  items: MapItem[];
}

export interface ViewState {
  level: 'country' | 'state';
  state: { abbr: string; name: string; requests: number; trips: number } | null;
  city: CityNode | null;
  bundles: Bundle[];
  hint: { strong?: string; text: string };
}

export interface Engine {
  openState(abbr: string): void;
  /** Open a state and, once it is open, press one of its cities. Works from any level. */
  goTo(abbr: string, cityKey?: string): void;
  closeState(): void;
  selectCity(key: string): void;
  clearCity(): void;
  highlightBundle(id: string | null): void;
  highlightItem(id: string | null): void;
  relayout(): void;
  destroy(): void;
  counts: Record<string, number>;
  states: { abbr: string; name: string }[];
}

export interface EngineOptions {
  items: MapItem[];
  /** Small screen: lower 48 only, shorter motion, no relief. */
  phone: boolean;
  root: HTMLElement; // gets data-level for CSS
  hover: HTMLElement; // the tooltip element, positioned inside the stage
  stage: HTMLElement;
  onChange: (v: ViewState) => void;
  onSelectBundle: (b: Bundle) => void;
}

type Sel = d3.Selection<any, any, any, any>;

const W = 975;
const H = 610;
const SMALL = new Set(['RI', 'DE', 'CT', 'NJ', 'MA', 'NH', 'VT', 'MD', 'DC']);

export function createEngine(svgEl: SVGSVGElement, data: MapData, opts: EngineOptions): Engine {
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = opts.phone;
  // phones get the same motion at a little over half the length
  const dur = (ms: number) => (REDUCED ? 0 : Math.round(ms * (phone ? 0.55 : 1)));
  const isPhone = () => phone;
  const feats = data.states.features;
  const OFFSHORE = new Set(['AK', 'HI']);
  const hiddenState = (f: StateFeature) => phone && OFFSHORE.has(f.properties.abbr);
  const byAbbr = Object.fromEntries(feats.map((f) => [f.properties.abbr, f])) as Record<string, StateFeature>;

  // ---------- projection ----------
  // on a phone the lower 48 fill the frame; Alaska and Hawaii are reached through search
  const fitTo = phone ? { type: 'FeatureCollection', features: feats.filter((f) => !hiddenState(f)) } as GeoJSON.FeatureCollection : data.states;
  const projection = d3.geoAlbersUsa().fitExtent([[12, 12], [W - 12, H - 12]], fitTo);
  const path = d3.geoPath(projection);
  const frame = () => {
    const r = svgEl.getBoundingClientRect();
    const vb = svgEl.viewBox.baseVal;
    const s = r.width && vb.width ? Math.min(r.width / vb.width, r.height / vb.height) : 1;
    return { s, ox: (r.width - vb.width * s) / 2, oy: (r.height - vb.height * s) / 2, w: r.width, h: r.height };
  };
  const pxUnits = () => 1 / frame().s;
  const viewH = () => {
    const r = svgEl.getBoundingClientRect();
    return isPhone() && r.width ? Math.round((W * r.height) / r.width) : H;
  };

  // ---------- activity ----------
  const stateOf = (lng: number, lat: number) => {
    for (const f of feats) if (d3.geoContains(f, [lng, lat])) return f.properties.abbr;
    return null;
  };
  type Item = MapItem & { fromSt: string; toSt: string };
  const items: Item[] = opts.items.map((i) => ({
    ...i,
    fromSt: stateOf(i.from.lng, i.from.lat) || i.from.state,
    toSt: stateOf(i.to.lng, i.to.lat) || i.to.state,
  }));
  const requests = items.filter((i) => i.kind === 'request');
  const trips = items.filter((i) => i.kind === 'trip');
  // a request belongs to the state it departs from
  const counts: Record<string, number> = {};
  requests.forEach((r) => {
    counts[r.fromSt] = (counts[r.fromSt] || 0) + 1;
  });
  const maxCount = Math.max(0, ...Object.values(counts));
  const requestsOf = (ab: string) => requests.filter((r) => r.fromSt === ab);
  const tripsOf = (ab: string) => trips.filter((t) => t.fromSt === ab || t.toSt === ab);

  // cities: known places plus any endpoint we do not know, lit when something touches them
  const cities: CityNode[] = data.cities.map((c) => ({ ...c, xy: [0, 0], lit: false, leaving: [], arriving: [], trips: [], n: 0 }));
  const have = new Set(cities.map((c) => c.key));
  items.forEach((i) =>
    [i.from, i.to].forEach((e) => {
      if (!have.has(e.key)) {
        have.add(e.key);
        cities.push({ state: e.state, name: e.city, lat: e.lat, lng: e.lng, pop: 60000, key: e.key, xy: [0, 0], lit: false, leaving: [], arriving: [], trips: [], n: 0 });
      }
    })
  );
  const byKey = new Map(cities.map((c) => [c.key, c]));
  requests.forEach((r) => {
    byKey.get(r.from.key)?.leaving.push(r);
    byKey.get(r.to.key)?.arriving.push(r);
  });
  trips.forEach((t) => {
    byKey.get(t.from.key)?.trips.push(t);
    if (t.to.key !== t.from.key) byKey.get(t.to.key)?.trips.push(t);
  });
  cities.forEach((c) => {
    c.n = c.leaving.length + c.arriving.length;
    c.lit = c.n > 0 || c.trips.length > 0;
  });
  const cityList = cities
    .map((c) => ({ c, xy: projection([c.lng, c.lat]) }))
    .filter((x) => x.xy)
    .map((x) => Object.assign(x.c, { xy: x.xy as [number, number] }))
    .sort((a, b) => Number(b.lit) - Number(a.lit) || b.pop - a.pop);

  // ---------- scene state ----------
  let level: 'country' | 'state' = 'country';
  let open: StateFeature | null = null;
  let scope: string | null = null;
  let k = 1,
    tx = 0,
    ty = 0;
  let kRel = 1;
  let base: { k: number; tx: number; ty: number } | null = null;
  let city: CityNode | null = null;
  let bundles: (Bundle & { geom: Geom; offset: number; offsetApplied?: boolean; path: Sel; hit: Sel; dots: Sel[]; count: Sel | null })[] = [];
  type CityEl = { c: CityNode; g: SVGGElement; hit: SVGCircleElement; lhit: SVGRectElement; circ: SVGCircleElement; txt: SVGTextElement; ct: SVGTSpanElement | null };
  // nodes are made the first time a town earns a dot at the current zoom, so the
  // country view starts with a hundred nodes rather than two thousand
  let cityEls: { c: CityNode; el: CityEl | null }[] = [];
  let destroyed = false;

  // ---------- scaffold ----------
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();
  svg.attr('viewBox', `0 0 ${W} ${H}`);
  const defs = svg.append('defs');
  // a light or a dark paper tile, chosen up front: blending and filtering the
  // same tile at draw time was the single most expensive thing on a phone
  const darkMq = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => {
    const forced = document.documentElement.dataset.theme;
    return forced ? forced === 'dark' : darkMq.matches;
  };
  const texImage = defs
    .append('pattern')
    .attr('id', 'dm-tex')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', W)
    .attr('height', H)
    .append('image')
    .attr('href', isDark() ? '/map/texture-dark.jpg' : '/map/texture.jpg')
    .attr('width', W)
    .attr('height', H)
    .attr('preserveAspectRatio', 'none');
  const onTheme = () => texImage.attr('href', isDark() ? '/map/texture-dark.jpg' : '/map/texture.jpg');
  darkMq.addEventListener('change', onTheme);
  const bg = svg.append('rect').attr('class', 'dm-bg').attr('x', -2000).attr('y', -2000).attr('width', 5000).attr('height', 5000);
  const gZoom = svg.append('g');
  const layers = {
    edgeD: gZoom.append('g').attr('transform', 'translate(1,1.4)'),
    edgeL: gZoom.append('g').attr('transform', 'translate(-.6,-.8)'),
    states: gZoom.append('g'),
    texture: gZoom.append('g').attr('class', 'dm-texture'),
    borders: gZoom.append('g'),
  };
  const gDetail = gZoom.append('g');
  const gRoutes = gDetail.append('g');
  const gConts = gDetail.append('g');
  const gCities = gDetail.append('g').attr('class', 'dm-cities');
  const gQuiet = gCities.append('g');
  const gLit = gCities.append('g');
  const gLabels = svg.append('g');

  layers.edgeD.selectAll('path').data(feats).join('path').attr('class', 'dm-edge-d').attr('d', path).attr('data-ab', (f) => f.properties.abbr);
  layers.edgeL.selectAll('path').data(feats).join('path').attr('class', 'dm-edge-l').attr('d', path).attr('data-ab', (f) => f.properties.abbr);
  const statePaths = layers.states
    .selectAll('path')
    .data(feats)
    .join('path')
    .attr('class', (f) => 'dm-st' + (counts[f.properties.abbr] ? ' hot' : ''))
    .attr('d', path)
    .attr('data-ab', (f) => f.properties.abbr)
    .attr('tabindex', (f) => (counts[f.properties.abbr] ? 0 : -1))
    .attr('role', 'button')
    .attr('aria-label', (f) => `${f.properties.name}, ${counts[f.properties.abbr] || 0} open requests leaving`);
  layers.texture.selectAll('path').data(feats).join('path').attr('fill', 'url(#dm-tex)').attr('d', path).attr('data-ab', (f) => f.properties.abbr);
  layers.borders.selectAll('path').data(feats).join('path').attr('class', 'dm-bd').attr('d', path).attr('data-ab', (f) => f.properties.abbr);
  if (phone) OFFSHORE.forEach((ab) => svg.selectAll(`[data-ab="${ab}"]`).style('display', 'none'));

  // numbers live outside the zoomed group so they keep their pixel size
  const counted = feats.filter((f) => counts[f.properties.abbr] && !hiddenState(f));
  const cent = new Map(counted.map((f) => [f.properties.abbr, path.centroid(f)]));
  const small = counted.filter((f) => SMALL.has(f.properties.abbr)).sort((a, b) => cent.get(a.properties.abbr)![1] - cent.get(b.properties.abbr)![1]);
  const smallSlots = new Map(small.map((f, i) => [f.properties.abbr, i]));
  const leaders = gLabels.selectAll('path').data(small).join('path').attr('class', 'dm-leader').attr('data-ab', (f) => f.properties.abbr);
  const nums = gLabels
    .selectAll('text')
    .data(counted)
    .join('text')
    .attr('class', (f) => 'dm-num' + (counts[f.properties.abbr] === maxCount ? ' top' : ''))
    .attr('data-ab', (f) => f.properties.abbr)
    .text((f) => counts[f.properties.abbr]);

  const bboxOf = new Map(feats.map((f) => [f.properties.abbr, path.bounds(f)]));
  function layoutNumbers(): number[][] {
    const fr = frame();
    const rects: number[][] = [];
    // on a wide stage the small north-east states get a leader to a column at the
    // right; on a phone there is no such margin, so a number that does not fit
    // inside its state is simply not drawn
    const wide = fr.w >= 640;
    const slotMode = wide && k < 1.5;
    const scale = Math.min(1, Math.max(0.55, fr.w / 1100));
    nums.each(function (f: StateFeature) {
      const ab = f.properties.abbr;
      const c = cent.get(ab)!;
      const px = tx + k * c[0];
      const py = ty + k * c[1];
      let x = px,
        y = py;
      const sizePx = (counts[ab] === maxCount ? 28 : 21) * scale;
      const size = sizePx / fr.s;
      const ld = leaders.filter((d: StateFeature) => d === f);
      const digits = String(counts[ab]).length;
      const wPx = digits * 0.62 * sizePx + 6;
      let show = true;
      if (slotMode && smallSlots.has(ab)) {
        x = W - 28;
        y = 150 + smallSlots.get(ab)! * 26;
        ld.attr('d', `M${px},${py} L${x - 12},${y}`).style('display', null);
      } else {
        ld.style('display', 'none');
        const [[bx0, by0], [bx1, by1]] = bboxOf.get(ab)!;
        const bw = (bx1 - bx0) * k * fr.s;
        const bh = (by1 - by0) * k * fr.s;
        show = bw >= wPx + 4 && bh >= sizePx + 4;
      }
      d3.select(this).attr('x', x).attr('y', y).attr('font-size', size);
      (this as SVGTextElement).style.display = show ? '' : 'none';
      if (!show) return;
      const w = wPx + 4;
      const h = sizePx + 6;
      const cx = fr.ox + x * fr.s;
      const cy = fr.oy + y * fr.s;
      rects.push([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]);
    });
    return rects;
  }

  // ---------- hover ----------
  const hover = opts.hover;
  statePaths
    .on('mousemove', (ev: MouseEvent, f: StateFeature) => {
      if (level !== 'country') return;
      const r = opts.stage.getBoundingClientRect();
      hover.style.left = ev.clientX - r.left + 'px';
      hover.style.top = ev.clientY - r.top + 'px';
      const n = counts[f.properties.abbr] || 0;
      hover.innerHTML = `${f.properties.name}<small>${n ? n + (n === 1 ? ' request' : ' requests') : 'no open requests'}</small>`;
      hover.classList.add('on');
    })
    .on('mouseleave', () => hover.classList.remove('on'))
    .on('click', (_ev: MouseEvent, f: StateFeature) => {
      if (level === 'country') openState(f);
      else if (f === open && city) clearCity();
    })
    .on('keydown', (ev: KeyboardEvent, f: StateFeature) => {
      if ((ev.key === 'Enter' || ev.key === ' ') && level === 'country') {
        ev.preventDefault();
        openState(f);
      }
    });
  bg.on('click', () => {
    if (level === 'state') closeState();
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || level !== 'state') return;
    if (city) clearCity();
    else closeState();
  };
  document.addEventListener('keydown', onKey);
  const onResize = () => relayout();
  addEventListener('resize', onResize);

  // ---------- zoom: pinch or ctrl+scroll, drag to pan ----------
  const zoomFilter = (ev: any) => (ev.type === 'wheel' ? ev.ctrlKey || ev.metaKey : !ev.button);
  function applyTransform() {
    gZoom.attr('transform', `translate(${tx},${ty}) scale(${k})`);
    defs.select('pattern').attr('patternTransform', `scale(${1 / k})`);
    layers.edgeD.attr('transform', `translate(${1 / k},${1.4 / k})`);
    layers.edgeL.attr('transform', `translate(${-0.6 / k},${-0.8 / k})`);
    svgEl.classList.toggle('grab', k > 1.02);
  }
  const zoomC = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 7])
    .translateExtent([[0, 0], [W, H]])
    .filter(zoomFilter)
    .on('zoom', (ev) => {
      if (level !== 'country') return;
      const t = ev.transform;
      k = t.k;
      tx = t.x;
      ty = t.y;
      kRel = t.k;
      applyTransform();
      relayout();
    });
  const zoomB = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 8])
    .filter(zoomFilter)
    .on('zoom', (ev) => {
      if (!base) return;
      const t = ev.transform;
      kRel = t.k;
      k = base.k * t.k;
      tx = t.x + t.k * base.tx;
      ty = t.y + t.k * base.ty;
      applyTransform();
      relayout();
    });

  // ---------- open / close a state ----------
  function openState(f: StateFeature) {
    level = 'state';
    open = f;
    scope = f.properties.abbr;
    opts.root.dataset.level = 'state';
    hover.classList.remove('on');
    (document.activeElement as HTMLElement | null)?.blur?.();
    svg.on('.zoom', null);
    svgEl.classList.remove('grab');
    const ab = f.properties.abbr;
    const [[x0, y0], [x1, y1]] = path.bounds(f);
    const dx = x1 - x0,
      dy = y1 - y0,
      cx = (x0 + x1) / 2,
      cy = (y0 + y1) / 2;
    // the frame hugs the state: as tall as the screen allows for a tall state,
    // shorter for a wide one, so there are no empty bands above and below it
    const box = svgEl.parentElement as HTMLElement | null;
    if (box) box.style.height = '';
    const fr0 = svgEl.getBoundingClientRect();
    let VH = viewH();
    if (box && fr0.width && fr0.height) {
      const want = Math.min(fr0.height, (fr0.width * dy) / dx / 0.86 + 12);
      box.style.height = `${Math.round(want)}px`;
      VH = Math.round((W * want) / fr0.width);
    }
    svg.attr('viewBox', `0 0 ${W} ${VH}`);
    // small states need more than 10x on a phone, where the lower 48 fill the same box
    const K = Math.min(18, 0.86 / Math.max(dx / W, dy / VH));
    const TX = W / 2 - K * cx;
    const TY = VH / 2 - K * cy;

    svg.selectAll(`[data-ab]:not([data-ab="${ab}"])`).transition('fade').duration(dur(360)).ease(d3.easeCubicOut).style('opacity', 0).style('pointer-events', 'none');
    gLabels.selectAll('*').transition().duration(dur(260)).style('opacity', 0);
    clearDetail();
    cityEls = [];
    bundles = [];
    city = null;
    statePaths.filter((d: StateFeature) => d === f).classed('active', true);
    layers.borders.selectAll('path').filter((d: unknown) => d === f).classed('active', true);
    layers.edgeD.transition().duration(dur(750)).attr('transform', `translate(${1 / K},${1.4 / K})`);
    layers.edgeL.transition().duration(dur(750)).attr('transform', `translate(${-0.6 / K},${-0.8 / K})`);

    gZoom
      .transition('zoom')
      .delay(dur(120))
      .duration(dur(780))
      .ease(d3.easeCubicInOut)
      .attr('transform', `translate(${TX},${TY}) scale(${K})`)
      .on('end', () => {
        if (destroyed) return;
        k = K;
        tx = TX;
        ty = TY;
        base = { k, tx, ty };
        kRel = 1;
        defs.select('pattern').attr('patternTransform', `scale(${1 / k})`);
        buildDetail(false);
        svg.call(zoomB);
        svg.call(zoomB.transform, d3.zoomIdentity);
        settle();
      });
    emit();
  }

  function closeState() {
    const f = open;
    if (!f) return;
    svg.on('.zoom', null);
    base = null;
    city = null;
    bundles = [];
    cityEls = [];
    clearDetail();
    gZoom
      .transition('zoom')
      .duration(dur(640))
      .ease(d3.easeCubicInOut)
      .attr('transform', 'translate(0,0) scale(1)')
      .on('end', () => {
        if (destroyed) return;
        svg.selectAll('[data-ab]').transition().duration(dur(320)).style('opacity', 1).style('pointer-events', null);
        gLabels.selectAll('*').transition().delay(dur(120)).duration(dur(300)).style('opacity', 1);
        k = 1;
        tx = 0;
        ty = 0;
        kRel = 1;
        buildDetail(false);
        svg.call(zoomC);
        svg.call(zoomC.transform, d3.zoomIdentity);
        settle();
      });
    layers.edgeD.transition().duration(dur(640)).attr('transform', 'translate(1,1.4)');
    layers.edgeL.transition().duration(dur(640)).attr('transform', 'translate(-.6,-.8)');
    statePaths.classed('active', false);
    layers.borders.selectAll('path').classed('active', false);
    level = 'country';
    open = null;
    scope = null;
    opts.root.dataset.level = 'country';
    const box = svgEl.parentElement as HTMLElement | null;
    if (box) box.style.height = '';
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    defs.select('pattern').attr('patternTransform', null);
    emit();
  }

  // empty the drawing layers without touching the layers themselves
  function clearDetail() {
    [gRoutes, gConts, gQuiet, gLit].forEach((g) => g.selectAll('*').interrupt().remove());
  }

  // ---------- cities and the pressed city's lines ----------
  type Geom = { solid: [number, number][]; dotsFrom: [number, number] | null; dir: [number, number] | null };
  const norm = (v: [number, number]): [number, number] => {
    const l = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / l, v[1] / l];
  };
  const line = d3.line().curve(d3.curveCatmullRom.alpha(0.5));

  function routeGeometry(a: { lng: number; lat: number }, b: { lng: number; lat: number }, f: StateFeature | null): Geom | null {
    const interp = d3.geoInterpolate([a.lng, a.lat], [b.lng, b.lat]);
    const N = 90;
    const pts: { xy: [number, number] | null; inside: boolean }[] = [];
    for (let i = 0; i <= N; i++) {
      const p = interp(i / N);
      pts.push({ xy: projection(p), inside: f ? d3.geoContains(f, p) : true });
    }
    const first = pts[0].inside,
      last = pts[N].inside;
    let solid: typeof pts;
    let dotsFrom: [number, number] | null = null;
    let dir: [number, number] | null = null;
    if (first && last) solid = pts;
    else if (first) {
      // leaves the state: exit at the last land sample so inlets and lakes on the way do not cut it short
      const j = pts.map((p) => p.inside).lastIndexOf(true);
      solid = pts.slice(0, Math.min(N, j + 1) + 1);
      const p1 = solid[solid.length - 2].xy!,
        p2 = solid[solid.length - 1].xy!;
      dotsFrom = p2;
      dir = norm([p2[0] - p1[0], p2[1] - p1[1]]);
    } else if (last) {
      const j = pts.findIndex((p) => p.inside);
      solid = pts.slice(Math.max(j - 1, 0));
      const p1 = solid[1].xy!,
        p2 = solid[0].xy!;
      dotsFrom = p2;
      dir = norm([p2[0] - p1[0], p2[1] - p1[1]]);
    } else return null;
    return { solid: solid.filter((p) => p.xy).map((p) => p.xy as [number, number]), dotsFrom, dir };
  }

  function buildDetail(instant: boolean) {
    clearDetail();
    bundles = [];
    city = null;
    const ab = scope;
    const list = ab ? cityList.filter((c) => c.state === ab) : cityList.filter((c) => !(phone && OFFSHORE.has(c.state)));
    cityEls = list.map((c) => ({ c, el: null }));
    relayout();
    emit();
    if (!instant && ab) {
      let i = 0;
      cityEls.forEach((e) => {
        if (!e.el) return;
        d3.select(e.el.g)
          .style('opacity', 0)
          .transition()
          .delay(dur(60 + Math.min(i++, 12) * 40))
          .duration(dur(360))
          .style('opacity', 1);
      });
    }
  }

  function makeCityEl(c: CityNode): CityEl {
    const ab = scope;
    const g = (c.lit ? gLit : gQuiet)
      .append('g')
      .attr('class', 'dm-cityg' + (c.lit ? ' lit' : '') + (ab ? ' hot' : ''))
      .attr('transform', `translate(${c.xy[0]},${c.xy[1]})`);
    const hit = g.append('circle').attr('class', 'dm-chit');
    const lhit = g.append('rect').attr('class', 'dm-lhit');
    const circ = g.append('circle').attr('class', 'dm-city' + (c.lit ? '' : ' quiet'));
    const txt = g.append('text').attr('class', 'dm-clab' + (c.lit ? '' : ' quiet'));
    txt.append('tspan').text(c.name);
    if (ab && c.n) txt.append('tspan').attr('class', 'ct').text(c.n);
    if (ab)
      g.on('click', (ev: MouseEvent) => {
        ev.stopPropagation();
        selectCityNode(c);
      });
    if (city) {
      g.classed('sel', c === city);
      g.classed('faint', city.n > 0 && c !== city && !isConnected(c));
    }
    return { c, g: g.node()!, hit: hit.node()!, lhit: lhit.node()!, circ: circ.node()!, txt: txt.node()!, ct: txt.select('tspan.ct').node() as SVGTSpanElement | null };
  }

  const isConnected = (other: CityNode) => !!city && bundles.some((b) => b.other.key === other.key);

  function selectCityNode(c: CityNode) {
    if (city === c) return;
    city = c;
    drawBundles();
    cityEls.forEach((e) => {
      if (!e.el) return;
      e.el.g.classList.toggle('sel', e.c === c);
      e.el.g.classList.toggle('faint', c.n > 0 && e.c !== c && !isConnected(e.c));
    });
    relayout();
    emit();
  }
  function clearCity() {
    if (!city) return;
    city = null;
    bundles = [];
    cityEls.forEach((e) => e.el?.g.classList.remove('sel', 'faint'));
    gRoutes.selectAll('*').interrupt().transition().duration(dur(180)).style('opacity', 0).remove();
    gConts.selectAll('*').interrupt().transition().duration(dur(180)).style('opacity', 0).remove();
    relayout();
    emit();
  }

  function drawBundles() {
    gRoutes.selectAll('*').remove();
    gConts.selectAll('*').remove();
    bundles = [];
    if (!city) return;
    const me = city.key;
    const groups: Record<string, { kind: 'request' | 'trip'; other: Bundle['other'] & { lat: number; lng: number }; items: Item[] }> = {};
    [...city.leaving, ...city.arriving, ...city.trips].forEach((i) => {
      const it = i as Item;
      const other = it.from.key === me ? it.to : it.from;
      const key = it.kind + '|' + other.key;
      (groups[key] = groups[key] || { kind: it.kind, other: { city: other.city, state: other.state, key: other.key, lat: other.lat, lng: other.lng }, items: [] }).items.push(it);
    });
    const pairs: Record<string, typeof groups[string][]> = {};
    Object.values(groups).forEach((b) => (pairs[b.other.key] = pairs[b.other.key] || []).push(b));
    Object.values(groups)
      .sort((a, b) => b.items.length - a.items.length)
      .forEach((b, i) => {
        const g = routeGeometry({ lng: city!.lng, lat: city!.lat }, b.other, open);
        if (!g) return;
        const grp = pairs[b.other.key];
        const d = line(g.solid)!;
        const id = 'b' + i;
        const p = gRoutes.append('path').attr('class', 'dm-route' + (b.kind === 'trip' ? ' trip' : '')).attr('d', d).attr('data-b', id);
        const hit = gRoutes.append('path').attr('class', 'dm-hit').attr('d', d).attr('data-b', id);
        const dots: Sel[] = [];
        if (g.dotsFrom) for (let n = 1; n <= 3; n++) dots.push(gConts.append('circle').attr('class', 'dm-cont').attr('data-b', id));
        const count = b.items.length > 1 ? gConts.append('text').attr('class', 'dm-bcount').attr('data-b', id).text('×' + b.items.length) : null;
        const bundle = { id, kind: b.kind, other: { city: b.other.city, state: b.other.state, key: b.other.key }, items: b.items as MapItem[], geom: g, offset: (grp.indexOf(b) - (grp.length - 1) / 2) * 3.2, path: p, hit, dots, count };
        hit.on('click', (ev: MouseEvent) => {
          ev.stopPropagation();
          opts.onSelectBundle(publicBundle(bundle));
        });
        bundles.push(bundle);
      });
    relayout();
    bundles.forEach((b, i) => {
      const L = (b.path.node() as SVGPathElement).getTotalLength();
      b.path
        .attr('stroke-dasharray', `${L} ${L}`)
        .attr('stroke-dashoffset', L)
        .transition()
        .delay(dur(i * 45))
        .duration(dur(420))
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0)
        .on('end', function () {
          d3.select(this).attr('stroke-dasharray', null).attr('stroke-dashoffset', null);
          if (!destroyed) relayout();
        });
      b.dots.forEach((c, n) => c.style('opacity', 0).transition().delay(dur(i * 45 + 380 + n * 60)).duration(dur(200)).style('opacity', null));
      if (b.count) b.count.style('opacity', 0).transition().delay(dur(i * 45 + 300)).duration(dur(240)).style('opacity', null);
    });
  }
  const publicBundle = (b: (typeof bundles)[number]): Bundle => ({ id: b.id, kind: b.kind, other: b.other, items: b.items });

  const overlaps = (a: number[], b: number[]) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

  function relayout() {
    if (destroyed) return;
    const fr = frame();
    const u = 1 / fr.s / k;
    const placed = level === 'country' ? layoutNumbers() : [];
    // a phone frame is a third the width, so it earns a third of the names
    const crowd = phone ? 3 : 1;
    const fontPx = 12.5,
      labelMin = (900000 * crowd) / (k * k),
      dotMin = (300000 * crowd) / (k * k);
    const inFrame = (r: number[]) => r[0] >= 2 && r[2] <= fr.w - 2;
    cityEls.forEach((entry) => {
      const c = entry.c;
      const sx = fr.ox + (tx + k * c.xy[0]) * fr.s;
      const sy = fr.oy + (ty + k * c.xy[1]) * fr.s;
      const onScreen = sx > -40 && sx < fr.w + 40 && sy > -20 && sy < fr.h + 20;
      let label = false,
        side = 1;
      const w = fontPx * 0.56 * (c.name.length + (scope && c.n ? String(c.n).length + 1.4 : 0)) + 6;
      if (onScreen && (c === city || c.pop >= (c.lit ? labelMin / 6 : labelMin))) {
        const right = [sx + 4, sy - 8, sx + 8 + w, sy + 8];
        const left = [sx - 8 - w, sy - 8, sx - 4, sy + 8];
        if (inFrame(right) && !placed.some((q) => overlaps(q, right))) {
          placed.push(right);
          label = true;
        } else if (inFrame(left) && !placed.some((q) => overlaps(q, left))) {
          placed.push(left);
          label = true;
          side = -1;
        }
      }
      const dot = onScreen && (c.lit || label || c.pop >= dotMin);
      if (!dot) {
        if (entry.el) entry.el.g.style.display = 'none';
        return;
      }
      if (!entry.el) entry.el = makeCityEl(c);
      const e = entry.el;
      e.g.style.display = '';
      e.circ.setAttribute('r', String((c.lit ? 3.4 : 2.3) * u));
      e.hit.setAttribute('r', String((c.lit ? 14 : 8) * u));
      e.txt.style.display = label ? '' : 'none';
      e.lhit.style.display = label ? '' : 'none';
      if (label) {
        // the name is part of the button: a transparent box behind it takes the tap
        e.lhit.setAttribute('x', String(side > 0 ? 4 * u : -(4 + w) * u));
        e.lhit.setAttribute('y', String(-10 * u));
        e.lhit.setAttribute('width', String(w * u));
        e.lhit.setAttribute('height', String(20 * u));
        e.txt.setAttribute('x', String(side * 7 * u));
        e.txt.setAttribute('text-anchor', side > 0 ? 'start' : 'end');
        e.txt.setAttribute('y', String(4 * u));
        e.txt.setAttribute('font-size', String(fontPx * u));
        e.txt.setAttribute('stroke-width', String(2.2 * u));
        if (e.ct) e.ct.setAttribute('dx', String(5 * u));
      }
    });
    bundles.forEach((b) => {
      const pts = b.geom.solid;
      const a = pts[0],
        z = pts[pts.length - 1];
      const nrm = norm([-(z[1] - a[1]), z[0] - a[0]]);
      const off = b.offset * u;
      if (off !== 0 || b.offsetApplied) {
        const d = line(pts.map((q) => [q[0] + nrm[0] * off, q[1] + nrm[1] * off] as [number, number]))!;
        b.path.attr('d', d);
        b.hit.attr('d', d);
        b.offsetApplied = true;
      }
      if (b.geom.dotsFrom && b.geom.dir) {
        const df = b.geom.dotsFrom,
          dr = b.geom.dir;
        b.dots.forEach((c, n) =>
          c
            .attr('r', 1.4 * u)
            .attr('cx', df[0] + nrm[0] * off + dr[0] * (7 + 8 * (n + 1)) * u)
            .attr('cy', df[1] + nrm[1] * off + dr[1] * (7 + 8 * (n + 1)) * u)
        );
      }
      if (b.count) {
        const m = pts[Math.floor(pts.length / 2)];
        b.count
          .attr('x', m[0] + nrm[0] * (off + 10 * u))
          .attr('y', m[1] + nrm[1] * (off + 10 * u))
          .attr('font-size', 11.5 * u)
          .attr('stroke-width', 2.4 * u);
      }
    });
  }

  function hintFor(): ViewState['hint'] {
    const how = isPhone() ? 'Pinch' : 'Pinch or Ctrl+scroll';
    if (level === 'country') return { text: `${how} for more towns. Press a state, or search for a place.` };
    if (city) return { strong: city.name, text: `: ${bundles.length} ${bundles.length === 1 ? 'connection' : 'connections'} drawn; press the state or Esc to clear.` };
    const n = cityEls.filter((e) => e.c.n).length;
    return n
      ? { strong: `${n} ${n === 1 ? 'city has' : 'cities have'} deliveries`, text: `; press one to see what leaves and arrives, or click outside the state for all states.` }
      : { text: `Nothing leaves or arrives here yet; click outside the state for all states.` };
  }

  function emit() {
    if (destroyed) return;
    opts.onChange({
      level,
      state: open ? { abbr: open.properties.abbr, name: open.properties.name, requests: requestsOf(open.properties.abbr).length, trips: tripsOf(open.properties.abbr).length } : null,
      city,
      bundles: bundles.map(publicBundle),
      hint: hintFor(),
    });
  }

  function highlightBundle(id: string | null) {
    d3.selectAll('.dm-route, .dm-cont, .dm-bcount').classed('dim', !!id).classed('sel', false);
    if (!id) return;
    const b = bundles.find((x) => x.id === id);
    if (!b) return;
    svg.selectAll(`[data-b="${id}"]`).classed('dim', false);
    b.path.classed('sel', true);
  }

  // ---------- go somewhere by name ----------
  let pending: { abbr: string; cityKey?: string } | null = null;
  function goTo(abbr: string, cityKey?: string) {
    const f = byAbbr[abbr];
    if (!f) return;
    const pressCity = () => {
      if (!cityKey) return;
      const c = cityEls.find((e) => e.c.key === cityKey)?.c;
      if (c) selectCityNode(c);
    };
    if (level === 'state' && scope === abbr) {
      pressCity();
      return;
    }
    pending = { abbr, cityKey };
    if (level === 'state') closeState();
    else openState(f);
  }
  // the transitions call this when they land
  function settle() {
    if (!pending) return;
    const p = pending;
    if (level === 'country') {
      pending = { abbr: p.abbr, cityKey: p.cityKey };
      openState(byAbbr[p.abbr]);
      return;
    }
    pending = null;
    if (p.cityKey) {
      const c = cityEls.find((e) => e.c.key === p.cityKey)?.c;
      if (c) selectCityNode(c);
    }
  }

  // ---------- first paint ----------
  opts.root.dataset.level = 'country';
  buildDetail(true);
  svg.call(zoomC);

  return {
    openState: (ab) => {
      if (level === 'country' && byAbbr[ab]) openState(byAbbr[ab]);
    },
    goTo,
    closeState,
    selectCity: (key) => {
      const c = cityEls.find((e) => e.c.key === key)?.c;
      if (c) selectCityNode(c);
    },
    clearCity,
    highlightBundle,
    highlightItem: (id) => highlightBundle(id ? bundles.find((b) => b.items.some((i) => i.id === id))?.id ?? null : null),
    relayout,
    destroy: () => {
      destroyed = true;
      document.removeEventListener('keydown', onKey);
      removeEventListener('resize', onResize);
      darkMq.removeEventListener('change', onTheme);
      svg.on('.zoom', null);
      svg.selectAll('*').interrupt().remove();
    },
    counts,
    states: feats.map((f) => ({ abbr: f.properties.abbr, name: f.properties.name })),
  };
}
