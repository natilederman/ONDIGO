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
  const dur = (ms: number) => (REDUCED ? 0 : ms);
  const isPhone = () => matchMedia('(max-width: 720px)').matches;
  const feats = data.states.features;
  const byAbbr = Object.fromEntries(feats.map((f) => [f.properties.abbr, f])) as Record<string, StateFeature>;

  // ---------- projection ----------
  const projection = d3.geoAlbersUsa().fitExtent([[12, 12], [W - 12, H - 12]], data.states);
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
  let cityEls: { c: CityNode; g: SVGGElement; hit: SVGCircleElement; circ: SVGCircleElement; txt: SVGTextElement; ct: SVGTSpanElement | null }[] = [];
  let destroyed = false;

  // ---------- scaffold ----------
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();
  svg.attr('viewBox', `0 0 ${W} ${H}`);
  const defs = svg.append('defs');
  defs
    .append('pattern')
    .attr('id', 'dm-tex')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', W)
    .attr('height', H)
    .append('image')
    .attr('href', '/map/texture.jpg')
    .attr('width', W)
    .attr('height', H)
    .attr('preserveAspectRatio', 'none');
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

  // numbers live outside the zoomed group so they keep their pixel size
  const counted = feats.filter((f) => counts[f.properties.abbr]);
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

  function layoutNumbers(): number[][] {
    const fr = frame();
    const rects: number[][] = [];
    const slotMode = k < 1.5;
    nums.each(function (f: StateFeature) {
      const ab = f.properties.abbr;
      const c = cent.get(ab)!;
      const px = tx + k * c[0];
      const py = ty + k * c[1];
      let x = px,
        y = py;
      const size = (counts[ab] === maxCount ? 28 : 21) / fr.s;
      const ld = leaders.filter((d: StateFeature) => d === f);
      if (slotMode && smallSlots.has(ab)) {
        x = W - 28;
        y = 150 + smallSlots.get(ab)! * 26;
        ld.attr('d', `M${px},${py} L${x - 12},${y}`).style('display', null);
      } else ld.style('display', 'none');
      d3.select(this).attr('x', x).attr('y', y).attr('font-size', size);
      const w = String(counts[ab]).length * 0.62 * size * fr.s + 10;
      const h = size * fr.s + 6;
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
    const VH = viewH();
    svg.attr('viewBox', `0 0 ${W} ${VH}`);
    const K = Math.min(10, 0.86 / Math.max(dx / W, dy / VH));
    const TX = W / 2 - K * cx;
    const TY = VH / 2 - K * cy;

    svg.selectAll(`[data-ab]:not([data-ab="${ab}"])`).transition('fade').duration(dur(360)).ease(d3.easeCubicOut).style('opacity', 0).style('pointer-events', 'none');
    gLabels.selectAll('*').transition().duration(dur(260)).style('opacity', 0);
    gDetail.selectAll(':scope > g > *').interrupt().transition().duration(dur(240)).style('opacity', 0).remove();
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
    gDetail.selectAll(':scope > g > *').interrupt().transition().duration(dur(220)).style('opacity', 0).remove();
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
      });
    layers.edgeD.transition().duration(dur(640)).attr('transform', 'translate(1,1.4)');
    layers.edgeL.transition().duration(dur(640)).attr('transform', 'translate(-.6,-.8)');
    statePaths.classed('active', false);
    layers.borders.selectAll('path').classed('active', false);
    level = 'country';
    open = null;
    scope = null;
    opts.root.dataset.level = 'country';
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    defs.select('pattern').attr('patternTransform', null);
    emit();
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
    gRoutes.selectAll('*').remove();
    gConts.selectAll('*').remove();
    gCities.selectAll('*').remove();
    bundles = [];
    city = null;
    const ab = scope;
    const list = ab ? cityList.filter((c) => c.state === ab) : cityList;
    // DOM order is reverse priority: lit cities are appended last so their hit
    // areas sit on top of the quiet towns crowded around them
    cityEls = [...list].reverse().map((c) => {
      const g = gCities
        .append('g')
        .attr('class', 'dm-cityg' + (c.lit ? ' lit' : '') + (ab ? ' hot' : ''))
        .attr('transform', `translate(${c.xy[0]},${c.xy[1]})`);
      const hit = g.append('circle').attr('class', 'dm-chit');
      const circ = g.append('circle').attr('class', 'dm-city' + (c.lit ? '' : ' quiet'));
      const txt = g.append('text').attr('class', 'dm-clab' + (c.lit ? '' : ' quiet'));
      txt.append('tspan').text(c.name);
      if (ab && c.n) txt.append('tspan').attr('class', 'ct').text(c.n);
      if (ab)
        g.on('click', (ev: MouseEvent) => {
          ev.stopPropagation();
          selectCityNode(c);
        });
      return { c, g: g.node()!, hit: hit.node()!, circ: circ.node()!, txt: txt.node()!, ct: txt.select('tspan.ct').node() as SVGTSpanElement | null };
    }).reverse();
    relayout();
    emit();
    if (!instant && ab)
      cityEls.forEach((e, i) => {
        d3.select(e.g)
          .style('opacity', 0)
          .transition()
          .delay(dur(60 + Math.min(i, 12) * 40))
          .duration(dur(360))
          .style('opacity', 1);
      });
  }

  const isConnected = (other: CityNode) => !!city && bundles.some((b) => b.other.key === other.key);

  function selectCityNode(c: CityNode) {
    if (city === c) return;
    city = c;
    drawBundles();
    cityEls.forEach((e) => {
      e.g.classList.toggle('sel', e.c === c);
      e.g.classList.toggle('faint', c.n > 0 && e.c !== c && !isConnected(e.c));
    });
    relayout();
    emit();
  }
  function clearCity() {
    if (!city) return;
    city = null;
    bundles = [];
    cityEls.forEach((e) => e.g.classList.remove('sel', 'faint'));
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
    const fontPx = 12.5,
      labelMin = 900000 / (k * k),
      dotMin = 300000 / (k * k);
    cityEls.forEach((e) => {
      const c = e.c;
      const sx = fr.ox + (tx + k * c.xy[0]) * fr.s;
      const sy = fr.oy + (ty + k * c.xy[1]) * fr.s;
      const onScreen = sx > -40 && sx < fr.w + 40 && sy > -20 && sy < fr.h + 20;
      let label = false,
        side = 1;
      if (onScreen && (c === city || c.pop >= (c.lit ? labelMin / 6 : labelMin))) {
        const w = fontPx * 0.56 * (c.name.length + (e.ct ? String(c.n).length + 1.4 : 0)) + 6;
        const right = [sx + 4, sy - 8, sx + 8 + w, sy + 8];
        const left = [sx - 8 - w, sy - 8, sx - 4, sy + 8];
        if (!placed.some((q) => overlaps(q, right))) {
          placed.push(right);
          label = true;
        } else if (!placed.some((q) => overlaps(q, left))) {
          placed.push(left);
          label = true;
          side = -1;
        }
      }
      const dot = onScreen && (c.lit || label || c.pop >= dotMin);
      e.g.style.display = dot ? '' : 'none';
      if (!dot) return;
      e.circ.setAttribute('r', String((c.lit ? 3.4 : 2.3) * u));
      e.hit.setAttribute('r', String((c.lit ? 14 : 8) * u));
      e.txt.style.display = label ? '' : 'none';
      if (label) {
        e.txt.setAttribute('x', String(side * 7 * u));
        e.txt.setAttribute('text-anchor', side > 0 ? 'start' : 'end');
        e.txt.setAttribute('y', String(4 * u));
        e.txt.setAttribute('font-size', String(fontPx * u));
        e.txt.setAttribute('stroke-width', String(2.2 * u));
        if (e.ct) e.ct.setAttribute('dx', String(5 * u));
      }
    });
    bundles.forEach((b) => {
      if (b.kind === 'trip') b.path.attr('stroke-dasharray', `${3.2 * u} ${3.2 * u}`);
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
    if (level === 'country') return { text: `${how} for more towns. Open a state to press its cities.` };
    if (city) return { strong: city.name, text: `: ${bundles.length} ${bundles.length === 1 ? 'connection' : 'connections'} drawn. Press the state or Esc to clear.` };
    const n = cityEls.filter((e) => e.c.n).length;
    return n
      ? { strong: `${n} ${n === 1 ? 'city has' : 'cities have'} deliveries.`, text: ` Press one to see what leaves and arrives there. ${how} for more towns.` }
      : { text: `Nothing leaves or arrives here yet. ${how} for more towns.` };
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

  // ---------- first paint ----------
  opts.root.dataset.level = 'country';
  buildDetail(true);
  svg.call(zoomC);

  return {
    openState: (ab) => {
      if (level === 'country' && byAbbr[ab]) openState(byAbbr[ab]);
    },
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
      svg.on('.zoom', null);
      svg.selectAll('*').interrupt().remove();
    },
    counts,
    states: feats.map((f) => ({ abbr: f.properties.abbr, name: f.properties.name })),
  };
}
