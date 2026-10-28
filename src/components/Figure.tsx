import { useId, type ReactNode } from 'react'
import type { FigureSpec } from '../types'
import { cn } from '../utils'

type Variant = string | undefined

const ACCENT = 'figure-accent'
const MAIN = 'figure-main'
const AUX_LINE = 'figure-aux'
const FILL = 'figure-fill'
const LABEL = 'figure-labels'

function rad(deg: number): number {
  return (deg * Math.PI) / 180
}

function point(cx: number, cy: number, r: number, deg: number): [number, number] {
  return [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))]
}

function Arc({
  cx,
  cy,
  r,
  from,
  to,
  className = ACCENT,
  large = false,
}: {
  cx: number
  cy: number
  r: number
  from: number
  to: number
  className?: string
  large?: boolean
}) {
  const [x1, y1] = point(cx, cy, r, from)
  const [x2, y2] = point(cx, cy, r, to)
  return (
    <path
      d={`M ${x1} ${y1} A ${r} ${r} 0 ${large ? 1 : 0} 1 ${x2} ${y2}`}
      className={className}
      fill="none"
    />
  )
}

function Tick({ x1, y1, x2, y2, count = 1 }: { x1: number; y1: number; x2: number; y2: number; count?: number }) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy) || 1
  const nx = -dy / length
  const ny = dx / length
  return (
    <>
      {Array.from({ length: count }).map((_, index) => {
        const offset = (index - (count - 1) / 2) * 5
        const cx = mx + (dx / length) * offset
        const cy = my + (dy / length) * offset
        return (
          <line
            key={index}
            x1={cx - nx * 5}
            y1={cy - ny * 5}
            x2={cx + nx * 5}
            y2={cy + ny * 5}
            className="figure-tick"
          />
        )
      })}
    </>
  )
}

function Dot({ x, y, className = 'fill-[var(--accent)]' }: { x: number; y: number; className?: string }) {
  return <circle cx={x} cy={y} r={2.6} className={className} />
}

function Label({
  x,
  y,
  children,
  anchor = 'middle',
  accent,
  size,
}: {
  x: number
  y: number
  children: ReactNode
  anchor?: 'start' | 'middle' | 'end'
  accent?: boolean
  size?: number
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      className={cn(LABEL, accent && 'fill-[var(--accent)]')}
      style={size ? { fontSize: size } : undefined}
    >
      {children}
    </text>
  )
}

function Frame({ children, spec }: { children: ReactNode; spec: FigureSpec }) {
  const id = useId()
  const title = spec.caption ?? 'Геометрическая схема'
  return (
    <svg
      viewBox="0 0 320 220"
      className="h-auto w-full max-w-[420px]"
      role="img"
      aria-labelledby={id}
    >
      <title id={id}>{title}</title>
      {children}
    </svg>
  )
}

function Triangle({ points }: { points: [number, number][] }) {
  const path = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  return <path d={`${path} Z`} className={MAIN} />
}

function AnglePairs({ variant }: { variant: Variant }) {
  if (variant === 'line') {
    return (
      <Frame spec={{ type: 'angle-pairs', variant }}>
        <line x1={20} y1={110} x2={300} y2={110} className={MAIN} />
        <Dot x={70} y={110} />
        <Dot x={250} y={110} />
        <Dot x={160} y={110} />
        <Label x={70} y={130}>A</Label>
        <Label x={160} y={130}>C</Label>
        <Label x={250} y={130}>B</Label>
        <Label x={300} y={95} anchor="end">прямая AB</Label>
      </Frame>
    )
  }
  if (variant === 'types') {
    const items = [
      { x: 30, deg: 45, title: 'острый' },
      { x: 165, deg: 90, title: 'прямой' },
      { x: 30, y: 135, deg: 130, title: 'тупой' },
      { x: 165, y: 135, deg: 180, title: 'развёрнутый' },
    ]
    return (
      <Frame spec={{ type: 'angle-pairs', variant }}>
        {items.map((item) => {
          const cx = item.x + 45
          const cy = (item.y ?? 0) + 55
          const [ex, ey] = point(cx, cy, 40, item.deg)
          return (
            <g key={item.title}>
              <line x1={cx} y1={cy} x2={cx + 40} y2={cy} className={MAIN} />
              <line x1={cx} y1={cy} x2={ex} y2={ey} className={MAIN} />
              <Arc cx={cx} cy={cy} r={16} from={0} to={item.deg} className={ACCENT} />
              <Label x={cx + 4} y={cy + 34} anchor="start" size={9}>{item.title}</Label>
            </g>
          )
        })}
      </Frame>
    )
  }
  if (variant === 'vertical') {
    return (
      <Frame spec={{ type: 'angle-pairs', variant }}>
        <line x1={40} y1={180} x2={280} y2={40} className={MAIN} />
        <line x1={40} y1={40} x2={280} y2={180} className={MAIN} />
        <Dot x={160} y={110} />
        <Label x={160} y={126}>O</Label>
        <Label x={205} y={95} accent>1</Label>
        <Label x={115} y={95} accent>2</Label>
        <Label x={115} y={135} accent>3</Label>
        <Label x={205} y={135} accent>4</Label>
        <Label x={290} y={38} anchor="end">A</Label>
        <Label x={30} y={38} anchor="start">B</Label>
        <Label x={290} y={190} anchor="end">C</Label>
        <Label x={30} y={190} anchor="start">D</Label>
      </Frame>
    )
  }
  if (variant === 'angle') {
    const ax = 110
    const ay = 170
    const [cx, cy] = point(ax, ay, 140, -55)
    return (
      <Frame spec={{ type: 'angle-pairs', variant }}>
        <line x1={ax} y1={ay} x2={285} y2={ay} className={MAIN} />
        <line x1={ax} y1={ay} x2={cx} y2={cy} className={MAIN} />
        <Arc cx={ax} cy={ay} r={36} from={-55} to={0} className={ACCENT} />
        <Label x={ax - 8} y={ay + 20}>A</Label>
        <Label x={286} y={ay + 20} anchor="end">B</Label>
        <Label x={cx + 4} y={cy - 8} anchor="start">C</Label>
        <Label x={ax + 48} y={ay - 22} accent>1</Label>
      </Frame>
    )
  }

  if (variant === 'bisector') {
    const cx = 90
    const cy = 170
    const [ax, ay] = point(cx, cy, 120, -55)
    const [dx, dy] = point(cx, cy, 120, -27.5)
    return (
      <Frame spec={{ type: 'angle-pairs', variant }}>
        <line x1={cx} y1={cy} x2={280} y2={cy} className={MAIN} />
        <line x1={cx} y1={cy} x2={ax} y2={ay} className={MAIN} />
        <line x1={cx} y1={cy} x2={dx} y2={dy} className={ACCENT} />
        <Arc cx={cx} cy={cy} r={34} from={-55} to={-27.5} className={ACCENT} />
        <Arc cx={cx} cy={cy} r={34} from={-27.5} to={0} className={ACCENT} />
        <Label x={cx + 46} y={cy - 30} accent>1</Label>
        <Label x={cx + 40} y={cy - 6} accent>2</Label>
        <Label x={cx - 8} y={cy + 20}>O</Label>
        <Label x={276} y={cy + 20} anchor="end">B</Label>
        <Label x={ax - 2} y={ay - 8} anchor="end">A</Label>
        <Label x={dx + 8} y={dy + 2} accent>C</Label>
      </Frame>
    )
  }

  const cy = 160
  const cx = 100
  const angle = variant === 'adjacent-equal' ? 90 : 60
  const [bx] = point(cx, cy, 180, 0)
  const [ex, ey] = point(cx, cy, 130, -angle)
  return (
    <Frame spec={{ type: 'angle-pairs', variant }}>
      <line x1={20} y1={cy} x2={300} y2={cy} className={MAIN} />
      <line x1={cx} y1={cy} x2={ex} y2={ey} className={MAIN} />
      <Arc cx={cx} cy={cy} r={34} from={-angle} to={0} className={ACCENT} />
      <Arc cx={cx} cy={cy} r={34} from={-180} to={-angle} className={ACCENT} />
      <Label x={cx + 52} y={cy - 26} accent>1</Label>
      <Label x={cx - 52} y={cy - 26} accent>2</Label>
      <Label x={cx - 8} y={cy + 20}>O</Label>
      <Label x={bx + 6} y={cy + 20} anchor="start">B</Label>
      <Label x={ex + 2} y={ey - 8} anchor="start">A</Label>
      <Label x={20} y={cy + 20} anchor="start">C</Label>
      {variant === 'adjacent-equal' && (
        <>
          <polyline points={`${cx + 13},${cy} ${cx + 13},${cy - 13} ${cx},${cy - 13}`} className="figure-tick" fill="none" />
          <polyline points={`${cx - 13},${cy} ${cx - 13},${cy - 13} ${cx},${cy - 13}`} className="figure-tick" fill="none" />
        </>
      )}
    </Frame>
  )
}

function ParallelCut({ variant }: { variant: Variant }) {
  const y1 = 68
  const y2 = 152
  const xTop = 118
  const xBottom = 202
  const anglesTop = [
    { n: 1, x: xTop - 22, y: y1 - 8 },
    { n: 2, x: xTop + 22, y: y1 - 8 },
    { n: 3, x: xTop - 22, y: y1 + 20 },
    { n: 4, x: xTop + 22, y: y1 + 20 },
    { n: 5, x: xBottom - 22, y: y2 - 8 },
    { n: 6, x: xBottom + 22, y: y2 - 8 },
    { n: 7, x: xBottom - 22, y: y2 + 20 },
    { n: 8, x: xBottom + 22, y: y2 + 20 },
  ]
  const highlight = new Set<number>()
  if (variant === 'alternate') [4, 5].forEach((n) => highlight.add(n))
  if (variant === 'corresponding') [1, 5].forEach((n) => highlight.add(n))
  if (variant === 'same-side') [3, 5].forEach((n) => highlight.add(n))
  return (
    <Frame spec={{ type: 'parallel-cut', variant }}>
      <line x1={24} y1={y1} x2={296} y2={y1} className={MAIN} />
      <line x1={24} y1={y2} x2={296} y2={y2} className={MAIN} />
      <line x1={xTop - 30} y1={y1 - 46} x2={xBottom + 30} y2={y2 + 46} className={MAIN} />
      <Label x={286} y={y1 - 10} anchor="end">a</Label>
      <Label x={286} y={y2 - 10} anchor="end">b</Label>
      <Label x={282} y={211} anchor="end">c</Label>
      {anglesTop.map((angle) => (
        <g key={angle.n}>
          <Label x={angle.x} y={angle.y} accent={highlight.has(angle.n)}>
            {angle.n}
          </Label>
        </g>
      ))}
      <Label x={xTop - 38} y={y1 + 6} anchor="end">M</Label>
      <Label x={xBottom + 20} y={y2 + 30} anchor="start">N</Label>
    </Frame>
  )
}

function CevianTriangle({ variant }: { variant: Variant }) {
  const A: [number, number] = [70, 30]
  const B: [number, number] = [20, 170]
  const C: [number, number] = [230, 150]
  const M: [number, number] = [125, 160]
  const D: [number, number] = [109.5, 161.5]
  const H: [number, number] = [82.8, 164]
  const showAll = variant === 'all'
  return (
    <Frame spec={{ type: 'triangle-cevians', variant }}>
      <Triangle points={[A, B, C]} />
      <Label x={A[0] - 2} y={A[1] - 8} accent>A</Label>
      <Label x={B[0] - 6} y={B[1] + 18}>B</Label>
      <Label x={C[0] + 6} y={C[1] + 18}>C</Label>
      {(variant === 'median' || showAll) && (
        <>
          <line x1={A[0]} y1={A[1]} x2={M[0]} y2={M[1]} className={ACCENT} />
          <Tick x1={B[0]} y1={B[1]} x2={M[0]} y2={M[1]} />
          <Tick x1={M[0]} y1={M[1]} x2={C[0]} y2={C[1]} />
          <Label x={M[0] + 10} y={M[1] + 16} accent>M</Label>
        </>
      )}
      {(variant === 'bisector' || showAll) && (
        <>
          <line x1={A[0]} y1={A[1]} x2={D[0]} y2={D[1]} className={showAll ? AUX_LINE : ACCENT} />
          <Arc cx={A[0]} cy={A[1]} r={26} from={44} to={62} className={ACCENT} />
          <Arc cx={A[0]} cy={A[1]} r={26} from={62} to={86} className={ACCENT} />
          <Label x={D[0] + 10} y={D[1] + 18} accent>D</Label>
        </>
      )}
      {(variant === 'altitude' || showAll) && (
        <>
          <line x1={A[0]} y1={A[1]} x2={H[0]} y2={H[1]} className={showAll ? AUX_LINE : ACCENT} />
          <polyline
            points={`${H[0] + 10},${H[1]} ${H[0] + 13},${H[1] - 13} ${H[0] + 2},${H[1] - 16}`}
            className="figure-tick"
            fill="none"
          />
          <Label x={H[0] - 8} y={H[1] + 18} accent>H</Label>
        </>
      )}
      {!variant || variant === 'plain' ? null : null}
    </Frame>
  )
}

function CongruentTriangles({ variant }: { variant: Variant }) {
  const t1: [number, number][] = [
    [20, 160],
    [80, 45],
    [140, 160],
  ]
  const t2: [number, number][] = [
    [180, 160],
    [240, 45],
    [300, 160],
  ]
  return (
    <Frame spec={{ type: 'congruent-triangles', variant }}>
      <Triangle points={t1} />
      <Triangle points={t2} />
      <Label x={20} y={178}>A</Label>
      <Label x={80} y={36}>B</Label>
      <Label x={140} y={178}>C</Label>
      <Label x={180} y={178}>A₁</Label>
      <Label x={240} y={36}>B₁</Label>
      <Label x={300} y={178}>C₁</Label>
      {variant === 'sas' && (
        <>
          <Tick x1={20} y1={160} x2={80} y2={45} />
          <Tick x1={80} y1={45} x2={140} y2={160} />
          <Arc cx={80} cy={45} r={24} from={72} to={108} />
          <Tick x1={180} y1={160} x2={240} y2={45} />
          <Tick x1={240} y1={45} x2={300} y2={160} />
          <Arc cx={240} cy={45} r={24} from={72} to={108} />
        </>
      )}
      {variant === 'asa' && (
        <>
          <Tick x1={20} y1={160} x2={140} y2={160} />
          <Arc cx={20} cy={160} r={22} from={-64} to={0} />
          <Arc cx={140} cy={160} r={22} from={-116} to={-180} />
          <Tick x1={180} y1={160} x2={300} y2={160} />
          <Arc cx={180} cy={160} r={22} from={-64} to={0} />
          <Arc cx={300} cy={160} r={22} from={-116} to={-180} />
        </>
      )}
      {variant === 'sss' && (
        <>
          <Tick x1={20} y1={160} x2={80} y2={45} />
          <Tick x1={80} y1={45} x2={140} y2={160} />
          <Tick x1={140} y1={160} x2={20} y2={160} />
          <Tick x1={180} y1={160} x2={240} y2={45} />
          <Tick x1={240} y1={45} x2={300} y2={160} />
          <Tick x1={300} y1={160} x2={180} y2={160} />
        </>
      )}
    </Frame>
  )
}

function Isosceles({ variant }: { variant: Variant }) {
  if (variant === 'equilateral') {
    const A: [number, number] = [160, 19]
    const B: [number, number] = [68, 178]
    const C: [number, number] = [252, 178]
    return (
      <Frame spec={{ type: 'isosceles', variant }}>
        <Triangle points={[A, B, C]} />
        <Tick x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} />
        <Tick x1={B[0]} y1={B[1]} x2={C[0]} y2={C[1]} />
        <Tick x1={C[0]} y1={C[1]} x2={A[0]} y2={A[1]} />
        <Label x={A[0]} y={A[1] - 8}>B</Label>
        <Label x={B[0] - 8} y={B[1] + 16}>A</Label>
        <Label x={C[0] + 8} y={C[1] + 16}>C</Label>
        <Label x={A[0] + 4} y={A[1] + 34} accent size={9}>60°</Label>
        <Label x={B[0] + 48} y={B[1] - 18} accent size={9}>60°</Label>
        <Label x={C[0] - 48} y={C[1] - 18} accent size={9}>60°</Label>
      </Frame>
    )
  }
  const A: [number, number] = [60, 178]
  const B: [number, number] = [160, 30]
  const C: [number, number] = [260, 178]
  const M: [number, number] = [160, 178]
  return (
    <Frame spec={{ type: 'isosceles', variant }}>
      <Triangle points={[A, B, C]} />
      <Tick x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} />
      <Tick x1={B[0]} y1={B[1]} x2={C[0]} y2={C[1]} />
      <Label x={A[0] - 4} y={A[1] + 18}>A</Label>
      <Label x={B[0]} y={B[1] - 8}>B</Label>
      <Label x={C[0] + 6} y={C[1] + 18}>C</Label>
      {variant === 'median' && (
        <>
          <line x1={B[0]} y1={B[1]} x2={M[0]} y2={M[1]} className={ACCENT} />
          <polyline
            points={`${M[0] + 12},${M[1]} ${M[0] + 12},${M[1] - 12} ${M[0]},${M[1] - 12}`}
            className="figure-tick"
            fill="none"
          />
          <Label x={M[0] + 14} y={M[1] + 16} accent>M</Label>
        </>
      )}
    </Frame>
  )
}

function TriangleAngles({ variant }: { variant: Variant }) {
  const A: [number, number] = [60, 170]
  const B: [number, number] = [160, 40]
  const C: [number, number] = [260, 150]
  const D: [number, number] = [300, 186]
  return (
    <Frame spec={{ type: 'triangle-angles', variant }}>
      <Triangle points={[A, B, C]} />
      {variant === 'exterior' && <line x1={C[0]} y1={C[1]} x2={D[0]} y2={D[1]} className={AUX_LINE} />}
      <Label x={A[0] - 8} y={A[1] + 18}>A</Label>
      <Label x={B[0]} y={B[1] - 8}>B</Label>
      <Label x={C[0] + 6} y={C[1] - 4}>C</Label>
      {variant === 'exterior' && <Label x={D[0] - 4} y={D[1] + 10}>D</Label>}
      <Arc cx={A[0]} cy={A[1]} r={24} from={-60} to={0} className={ACCENT} />
      <Arc cx={B[0]} cy={B[1]} r={26} from={60} to={118} className={ACCENT} />
      <Arc cx={C[0]} cy={C[1]} r={22} from={-160} to={-105} className={ACCENT} />
      {variant === 'exterior' && (
        <>
          <Arc cx={C[0]} cy={C[1]} r={34} from={-12} to={38} className="figure-accent" />
          <Label x={C[0] + 26} y={C[1] + 30} accent>внешний</Label>
        </>
      )}
    </Frame>
  )
}

function RightTriangle({ variant }: { variant: Variant }) {
  let A: [number, number] = [60, 50]
  let B: [number, number] = [268, 170]
  let C: [number, number] = [60, 170]
  if (variant === 'isosceles') {
    B = [180, 170]
  }
  if (variant === 'distance') {
    return (
      <Frame spec={{ type: 'right-triangle', variant }}>
        <line x1={30} y1={170} x2={300} y2={170} className={MAIN} />
        <Dot x={160} y={50} />
        <Label x={160} y={40}>A</Label>
        <line x1={160} y1={50} x2={160} y2={170} className={ACCENT} />
        <line x1={160} y1={50} x2={250} y2={170} className={AUX_LINE} />
        <Label x={160} y={190} accent>H</Label>
        <Label x={250} y={190}>B</Label>
        <polyline points="172,170 172,158 160,158" className="figure-tick" fill="none" />
        <Label x={196} y={105} accent>расстояние</Label>
      </Frame>
    )
  }
  const M: [number, number] = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]
  return (
    <Frame spec={{ type: 'right-triangle', variant }}>
      <Triangle points={[A, B, C]} />
      <polyline points={`${C[0] + 12},${C[1]} ${C[0] + 12},${C[1] - 12} ${C[0]},${C[1] - 12}`} className="figure-tick" fill="none" />
      <Label x={A[0] - 4} y={A[1] - 8}>A</Label>
      <Label x={B[0] + 4} y={B[1] + 16}>B</Label>
      <Label x={C[0] - 8} y={C[1] + 16}>C</Label>
      {variant === 'angle30' && (
        <>
          <Arc cx={B[0]} cy={B[1]} r={30} from={-180} to={-150} className={ACCENT} />
          <Label x={B[0] - 56} y={B[1] - 16} accent size={9}>30°</Label>
        </>
      )}
      {variant === 'median' && (
        <>
          <line x1={C[0]} y1={C[1]} x2={M[0]} y2={M[1]} className={ACCENT} />
          <Dot x={M[0]} y={M[1]} />
          <Label x={M[0] + 8} y={M[1] - 8} accent>M</Label>
        </>
      )}
      {variant === 'isosceles' && (
        <>
          <Arc cx={A[0]} cy={A[1]} r={26} from={45} to={90} className={ACCENT} />
          <Arc cx={B[0]} cy={B[1]} r={26} from={180} to={225} className={ACCENT} />
          <Label x={A[0] + 30} y={A[1] + 30} accent size={9}>45°</Label>
          <Label x={B[0] - 44} y={B[1] - 18} accent size={9}>45°</Label>
        </>
      )}
    </Frame>
  )
}

function Quadrilateral({ variant }: { variant: Variant }) {
  const R: [number, number][] = [
    [60, 50],
    [260, 50],
    [260, 170],
    [60, 170],
  ]
  const Rhombus: [number, number][] = [
    [160, 30],
    [270, 110],
    [160, 190],
    [50, 110],
  ]
  const Square: [number, number][] = [
    [90, 40],
    [230, 40],
    [230, 180],
    [90, 180],
  ]
  const Trap: [number, number][] = [
    [60, 175],
    [120, 50],
    [210, 50],
    [270, 175],
  ]
  const TrapIso: [number, number][] = [
    [55, 175],
    [100, 50],
    [235, 50],
    [280, 175],
  ]
  const TrapRect: [number, number][] = [
    [60, 175],
    [60, 50],
    [220, 50],
    [285, 175],
  ]

  if (variant === 'family') {
    const shapes = [
      { label: 'параллелограмм', pts: [[15, 55], [50, 20], [85, 20], [50, 55]] as [number, number][] },
      { label: 'прямоугольник', pts: [[105, 20], [155, 20], [155, 60], [105, 60]] as [number, number][] },
      { label: 'ромб', pts: [[220, 15], [255, 38], [220, 62], [185, 38]] as [number, number][] },
      { label: 'квадрат', pts: [[265, 110], [300, 110], [300, 145], [265, 145]] as [number, number][] },
    ]
    return (
      <Frame spec={{ type: 'quadrilateral', variant }}>
        <Triangle points={shapes[0].pts} />
        <Triangle points={shapes[1].pts} />
        <Triangle points={shapes[2].pts} />
        <Triangle points={shapes[3].pts} />
        <Label x={50} y={78} size={8}>параллелограмм</Label>
        <Label x={130} y={78} size={8}>прямоугольник</Label>
        <Label x={220} y={82} size={8}>ромб</Label>
        <Label x={282} y={162} size={8}>квадрат</Label>
        <Label x={160} y={200} size={9} accent>квадрат ⊂ прямоугольник, ромб ⊂ параллелограмм</Label>
      </Frame>
    )
  }

  let pts = R
  if (variant?.startsWith('rectangle')) pts = R
  if (variant?.startsWith('rhombus')) pts = Rhombus
  if (variant?.startsWith('square')) pts = Square
  if (variant === 'trapezoid') pts = Trap
  if (variant === 'trapezoid-isosceles') pts = TrapIso
  if (variant === 'trapezoid-rect') pts = TrapRect

  const [p1, p2, p3, p4] = pts
  return (
    <Frame spec={{ type: 'quadrilateral', variant }}>
      <Triangle points={pts} />
      <Label x={p1[0] - 8} y={p1[1] + 2}>A</Label>
      <Label x={p2[0] + 4} y={p2[1] + 2}>B</Label>
      <Label x={p3[0] + 4} y={p3[1] + 14}>C</Label>
      <Label x={p4[0] - 8} y={p4[1] + 14}>D</Label>
      {variant === 'trapezoid' && (
        <>
          <line x1={90} y1={190} x2={240} y2={190} className={AUX_LINE} />
          <Label x={165} y={205} size={8}>AD ∥ BC</Label>
        </>
      )}
      {variant === 'trapezoid-isosceles' && (
        <>
          <Tick x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} />
          <Tick x1={p3[0]} y1={p3[1]} x2={p4[0]} y2={p4[1]} />
        </>
      )}
      {variant === 'trapezoid-rect' && (
        <polyline points={`${p1[0] + 12},${p1[1]} ${p1[0] + 12},${p1[1] - 12} ${p1[0]},${p1[1] - 12}`} className="figure-tick" fill="none" />
      )}
      {variant === 'rectangle' && (
        <polyline points={`${p1[0] + 12},${p1[1]} ${p1[0] + 12},${p1[1] + 12} ${p1[0]},${p1[1] + 12}`} className="figure-tick" fill="none" />
      )}
      {variant === 'rectangle-diagonals' && (
        <>
          <line x1={p1[0]} y1={p1[1]} x2={p3[0]} y2={p3[1]} className={ACCENT} />
          <line x1={p2[0]} y1={p2[1]} x2={p4[0]} y2={p4[1]} className={ACCENT} />
          <Label x={160} y={122} accent>AC = BD</Label>
        </>
      )}
      {variant === 'rhombus' && (
        <>
          <Tick x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} />
          <Tick x1={p2[0]} y1={p2[1]} x2={p3[0]} y2={p3[1]} />
          <Tick x1={p3[0]} y1={p3[1]} x2={p4[0]} y2={p4[1]} />
          <Tick x1={p4[0]} y1={p4[1]} x2={p1[0]} y2={p1[1]} />
        </>
      )}
      {variant === 'rhombus-diagonals' && (
        <>
          <line x1={p1[0]} y1={p1[1]} x2={p3[0]} y2={p3[1]} className={ACCENT} />
          <line x1={p2[0]} y1={p2[1]} x2={p4[0]} y2={p4[1]} className={ACCENT} />
          <polyline points={`${160 + 10},${110} ${160 + 10},${110 + 10} ${160},${110 + 10}`} className="figure-tick" fill="none" />
          <Label x={160} y={105} accent>O</Label>
        </>
      )}
      {variant === 'square' && <polyline points={`${p1[0] + 12},${p1[1]} ${p1[0] + 12},${p1[1] + 12} ${p1[0]},${p1[1] + 12}`} className="figure-tick" fill="none" />}
      {variant === 'square-diagonals' && (
        <>
          <line x1={p1[0]} y1={p1[1]} x2={p3[0]} y2={p3[1]} className={ACCENT} />
          <line x1={p2[0]} y1={p2[1]} x2={p4[0]} y2={p4[1]} className={ACCENT} />
          <polyline points={`${160 + 10},${110} ${160 + 10},${110 + 10} ${160},${110 + 10}`} className="figure-tick" fill="none" />
        </>
      )}
    </Frame>
  )
}

function MidlineFigure({ variant }: { variant: Variant }) {
  if (variant === 'trapezoid') {
    const A: [number, number] = [55, 175]
    const B: [number, number] = [105, 50]
    const C: [number, number] = [215, 50]
    const D: [number, number] = [265, 175]
    const Mpt: [number, number] = [80, 112.5]
    const N: [number, number] = [240, 112.5]
    return (
      <Frame spec={{ type: 'midline', variant }}>
        <Triangle points={[A, B, C, D]} />
        <line x1={Mpt[0]} y1={Mpt[1]} x2={N[0]} y2={N[1]} className={ACCENT} />
        <Label x={A[0] - 8} y={A[1] + 14}>A</Label>
        <Label x={B[0] - 2} y={B[1] - 8}>B</Label>
        <Label x={C[0] + 4} y={C[1] - 8}>C</Label>
        <Label x={D[0] + 4} y={D[1] + 14}>D</Label>
        <Label x={Mpt[0] - 8} y={Mpt[1] + 4}>M</Label>
        <Label x={N[0] + 8} y={N[1] + 4}>N</Label>
        <Label x={160} y={106} accent size={9}>MN = ½(AD + BC)</Label>
      </Frame>
    )
  }
  const A: [number, number] = [160, 30]
  const B: [number, number] = [40, 180]
  const C: [number, number] = [280, 180]
  const Mpt: [number, number] = [100, 105]
  const N: [number, number] = [160, 180]
  return (
    <Frame spec={{ type: 'midline', variant }}>
      <Triangle points={[A, B, C]} />
      <line x1={Mpt[0]} y1={Mpt[1]} x2={N[0]} y2={N[1]} className={ACCENT} />
      <Label x={A[0]} y={A[1] - 8}>A</Label>
      <Label x={B[0] - 4} y={B[1] + 16}>B</Label>
      <Label x={C[0] + 4} y={C[1] + 16}>C</Label>
      <Label x={Mpt[0] - 10} y={Mpt[1] - 2}>M</Label>
      <Label x={N[0] + 8} y={N[1] - 4}>N</Label>
      <Label x={120} y={155} accent size={9}>MN ∥ AC, MN = ½ AC</Label>
    </Frame>
  )
}

function AreasFigure({ variant }: { variant: Variant }) {
  if (variant === 'square') {
    return (
      <Frame spec={{ type: 'areas', variant }}>
        <Triangle points={[[90, 40], [230, 40], [230, 180], [90, 180]]} />
        <Label x={160} y={200} accent>a</Label>
        <Label x={245} y={115} accent anchor="start">a</Label>
        <Label x={160} y={120} accent>S = a²</Label>
      </Frame>
    )
  }
  if (variant === 'rectangle') {
    return (
      <Frame spec={{ type: 'areas', variant }}>
        <Triangle points={[[50, 60], [270, 60], [270, 170], [50, 170]]} />
        <Label x={160} y={192} accent>a</Label>
        <Label x={285} y={115} accent anchor="start">b</Label>
        <Label x={160} y={120} accent>S = ab</Label>
      </Frame>
    )
  }
  if (variant === 'parallelogram') {
    return (
      <Frame spec={{ type: 'areas', variant }}>
        <Triangle points={[[60, 170], [120, 50], [250, 50], [190, 170]]} />
        <line x1={120} y1={50} x2={120} y2={170} className={AUX_LINE} />
        <polyline points="132,170 132,158 120,158" className="figure-tick" fill="none" />
        <Label x={125} y={188} accent>a</Label>
        <Label x={88} y={115} accent anchor="end">h</Label>
        <Label x={200} y={120} accent size={9}>S = a · h</Label>
      </Frame>
    )
  }
  if (variant === 'triangle') {
    return (
      <Frame spec={{ type: 'areas', variant }}>
        <Triangle points={[[50, 170], [150, 50], [270, 170]]} />
        <line x1={150} y1={50} x2={150} y2={170} className={AUX_LINE} />
        <polyline points="162,170 162,158 150,158" className="figure-tick" fill="none" />
        <Label x={160} y={190} accent>a</Label>
        <Label x={138} y={112} accent anchor="end">h</Label>
        <Label x={200} y={120} accent size={9}>S = ½ah</Label>
      </Frame>
    )
  }
  if (variant === 'trapezoid') {
    return (
      <Frame spec={{ type: 'areas', variant }}>
        <Triangle points={[[55, 175], [110, 50], [215, 50], [265, 175]]} />
        <line x1={110} y1={50} x2={110} y2={175} className={AUX_LINE} />
        <polyline points="122,175 122,163 110,163" className="figure-tick" fill="none" />
        <Label x={160} y={195} accent>a</Label>
        <Label x={162} y={42} accent size={9}>b</Label>
        <Label x={98} y={115} accent anchor="end">h</Label>
      </Frame>
    )
  }
  return (
    <Frame spec={{ type: 'areas', variant }}>
      <Triangle points={[[160, 30], [270, 110], [160, 190], [50, 110]]} />
      <line x1={160} y1={30} x2={160} y2={190} className={AUX_LINE} />
      <line x1={50} y1={110} x2={270} y2={110} className={AUX_LINE} />
      <Label x={168} y={80} accent anchor="start">d₁</Label>
      <Label x={190} y={102} accent>d₂</Label>
      <Label x={160} y={210} accent size={9}>S = ½ d₁d₂</Label>
    </Frame>
  )
}

function PythagorasFigure({ variant }: { variant: Variant }) {
  const C: [number, number] = [130, 140]
  const A: [number, number] = [130, 60]
  const B: [number, number] = [210, 140]
  return (
    <Frame spec={{ type: 'pythagoras', variant }}>
      <rect x={50} y={60} width={80} height={80} className={FILL} />
      <rect x={50} y={60} width={80} height={80} className={ACCENT} fill="none" />
      <rect x={130} y={140} width={80} height={80} className={FILL} />
      <rect x={130} y={140} width={80} height={80} className={ACCENT} fill="none" />
      <Triangle points={[A, B, C]} />
      <polyline points={`${C[0] + 10},${C[1]} ${C[0] + 10},${C[1] - 10} ${C[0]},${C[1] - 10}`} className="figure-tick" fill="none" />
      <Label x={C[0] - 8} y={C[1] + 14}>C</Label>
      <Label x={A[0] - 8} y={A[1] - 4}>A</Label>
      <Label x={B[0] + 8} y={B[1] + 6}>B</Label>
      <Label x={112} y={100} accent anchor="end">a²</Label>
      <Label x={170} y={180} accent>b²</Label>
      <Label x={150} y={95} accent>c</Label>
      {variant === 'converse' && <Label x={200} y={178} accent size={9}>c² = a² + b²</Label>}
    </Frame>
  )
}

function SimilarFigure({ variant }: { variant: Variant }) {
  if (variant === 'height') {
    const A: [number, number] = [60, 170]
    const B: [number, number] = [270, 170]
    const C: [number, number] = [130, 50]
    const H: [number, number] = [130, 170]
    return (
      <Frame spec={{ type: 'similar', variant }}>
        <Triangle points={[A, B, C]} />
        <line x1={C[0]} y1={C[1]} x2={H[0]} y2={H[1]} className={ACCENT} />
        <polyline points={`${H[0] + 12},${H[1]} ${H[0] + 12},${H[1] - 12} ${H[0]},${H[1] - 12}`} className="figure-tick" fill="none" />
        <Label x={C[0]} y={C[1] - 8}>C</Label>
        <Label x={A[0] - 4} y={A[1] + 16}>A</Label>
        <Label x={B[0] + 4} y={B[1] + 16}>B</Label>
        <Label x={H[0] - 4} y={H[1] + 18} accent>H</Label>
        <Label x={95} y={112} accent anchor="end">h</Label>
      </Frame>
    )
  }
  const t1: [number, number][] = [
    [30, 185],
    [57.5, 125],
    [85, 185],
  ]
  const t2: [number, number][] = [
    [150, 185],
    [205, 65],
    [260, 185],
  ]
  return (
    <Frame spec={{ type: 'similar', variant }}>
      <Triangle points={t1} />
      <Triangle points={t2} />
      <Label x={28} y={198}>A</Label>
      <Label x={55} y={116}>B</Label>
      <Label x={88} y={198}>C</Label>
      <Label x={148} y={198}>A₁</Label>
      <Label x={205} y={57}>B₁</Label>
      <Label x={262} y={198}>C₁</Label>
      <Label x={160} y={32} accent size={10}>k = 2</Label>
      {variant === 'aa' && (
        <>
          <Arc cx={57.5} cy={125} r={12} from={66} to={114} className={ACCENT} />
          <Arc cx={205} cy={65} r={20} from={66} to={114} className={ACCENT} />
        </>
      )}
    </Frame>
  )
}

function TrigFigure() {
  const A: [number, number] = [80, 45]
  const B: [number, number] = [270, 170]
  const C: [number, number] = [80, 170]
  return (
    <Frame spec={{ type: 'trig' }}>
      <Triangle points={[A, B, C]} />
      <polyline points={`${C[0] + 11},${C[1]} ${C[0] + 11},${C[1] - 11} ${C[0]},${C[1] - 11}`} className="figure-tick" fill="none" />
      <Arc cx={A[0]} cy={A[1]} r={28} from={34} to={90} className={ACCENT} />
      <Label x={A[0] + 36} y={A[1] + 32} accent size={9}>α</Label>
      <Label x={A[0] - 5} y={A[1] - 8}>A</Label>
      <Label x={B[0] + 4} y={B[1] + 14}>B</Label>
      <Label x={C[0] - 8} y={C[1] + 14}>C</Label>
      <Label x={178} y={192} accent>a — противолежащий</Label>
      <Label x={68} y={110} accent anchor="end">b</Label>
      <Label x={140} y={95} accent>c</Label>
      <Label x={205} y={135} accent size={9}>sin α = a/c</Label>
    </Frame>
  )
}

function CircleAngles({ variant }: { variant: Variant }) {
  const cx = 160
  const cy = 110
  const r = 75
  if (variant === 'two-tangents') {
    const cx2 = 135
    const cy2 = 110
    const r2 = 58
    const P: [number, number] = [275, 110]
    const t1: [number, number] = [159, 56.6]
    const t2: [number, number] = [159, 163.4]
    return (
      <Frame spec={{ type: 'circle-angles', variant }}>
        <circle cx={cx2} cy={cy2} r={r2} className={MAIN} />
        <line x1={P[0]} y1={P[1]} x2={t1[0]} y2={t1[1]} className={ACCENT} />
        <line x1={P[0]} y1={P[1]} x2={t2[0]} y2={t2[1]} className={ACCENT} />
        <line x1={cx2} y1={cy2} x2={t1[0]} y2={t1[1]} className={AUX_LINE} />
        <line x1={cx2} y1={cy2} x2={t2[0]} y2={t2[1]} className={AUX_LINE} />
        <Dot x={cx2} y={cy2} />
        <Dot x={P[0]} y={P[1]} />
        <Label x={cx2} y={cy2 - 6}>O</Label>
        <Label x={P[0] + 4} y={P[1] + 16}>P</Label>
        <Label x={t1[0] + 6} y={t1[1] - 4} accent>A</Label>
        <Label x={t2[0] + 6} y={t2[1] + 10} accent>B</Label>
      </Frame>
    )
  }
  if (variant === 'tangent' || variant === 'tangent-radius') {
    return (
      <Frame spec={{ type: 'circle-angles', variant }}>
        <circle cx={cx} cy={cy} r={r} className={MAIN} />
        <line x1={25} y1={185} x2={295} y2={185} className={ACCENT} />
        <line x1={cx} y1={cy} x2={cx} y2={185} className={AUX_LINE} />
        <Dot x={cx} y={cy} />
        <Dot x={cx} y={185} />
        <Label x={cx + 5} y={cy - 6}>O</Label>
        <Label x={cx} y={203} accent>A</Label>
        <Label x={282} y={175} anchor="end" size={9}>касательная</Label>
        <polyline points={`${cx + 11},${185} ${cx + 11},${174} ${cx},${174}`} className="figure-tick" fill="none" />
      </Frame>
    )
  }
  if (variant === 'tangent-chord') {
    return (
      <Frame spec={{ type: 'circle-angles', variant }}>
        <circle cx={cx} cy={cy} r={r} className={MAIN} />
        <line x1={25} y1={185} x2={295} y2={185} className={ACCENT} />
        <line x1={cx} y1={185} x2={95} y2={147.5} className={ACCENT} />
        <Dot x={cx} y={185} />
        <Label x={cx} y={203} accent>A</Label>
        <Label x={88} y={142} accent>B</Label>
        <Arc cx={cx} cy={185} r={30} from={200} to={245} className="figure-accent" />
      </Frame>
    )
  }
  const A: [number, number] = [95, 147.5]
  const B: [number, number] = [225, 147.5]
  const C: [number, number] = [160, 35]
  const D: [number, number] = [107, 57]
  const isCentral = variant === 'central'
  const isInscribed = variant === 'inscribed' || variant === 'inscribed-theorem'
  const isDiameter = variant === 'diameter'
  const isSameArc = variant === 'same-arc'
  return (
    <Frame spec={{ type: 'circle-angles', variant }}>
      <circle cx={cx} cy={cy} r={r} className={MAIN} />
      <Dot x={cx} y={cy} />
      <Label x={cx + 6} y={cy - 5}>O</Label>
      {isCentral && (
        <>
          <line x1={cx} y1={cy} x2={A[0]} y2={A[1]} className={ACCENT} />
          <line x1={cx} y1={cy} x2={B[0]} y2={B[1]} className={ACCENT} />
          <Arc cx={cx} cy={cy} r={r} from={30} to={150} className="figure-accent" />
          <Label x={A[0] - 8} y={A[1] + 14}>A</Label>
          <Label x={B[0] + 8} y={B[1] + 14}>B</Label>
          <Label x={cx} y={cy + 34} accent size={9}>∠AOB = дуга AB</Label>
        </>
      )}
      {isInscribed && (
        <>
          <line x1={C[0]} y1={C[1]} x2={A[0]} y2={A[1]} className={ACCENT} />
          <line x1={C[0]} y1={C[1]} x2={B[0]} y2={B[1]} className={ACCENT} />
          <Label x={C[0]} y={C[1] - 8}>C</Label>
          <Label x={A[0] - 8} y={A[1] + 14}>A</Label>
          <Label x={B[0] + 8} y={B[1] + 14}>B</Label>
          <Arc cx={C[0]} cy={C[1]} r={26} from={54} to={86} className={ACCENT} />
          {variant === 'inscribed-theorem' && (
            <>
              <line x1={cx} y1={cy} x2={A[0]} y2={A[1]} className={AUX_LINE} />
              <line x1={cx} y1={cy} x2={B[0]} y2={B[1]} className={AUX_LINE} />
              <Arc cx={cx} cy={cy} r={40} from={30} to={150} className={ACCENT} />
              <Label x={cx} y={cy + 30} accent size={9}>2∠ACB = ∠AOB</Label>
            </>
          )}
        </>
      )}
      {isDiameter && (
        <>
          <line x1={85} y1={110} x2={235} y2={110} className={ACCENT} />
          <line x1={C[0]} y1={C[1]} x2={85} y2={110} className={ACCENT} />
          <line x1={C[0]} y1={C[1]} x2={235} y2={110} className={ACCENT} />
          <Label x={C[0]} y={C[1] - 8}>C</Label>
          <Label x={78} y={105}>A</Label>
          <Label x={242} y={105}>B</Label>
          <polyline points={`${160 + 12},${110} ${160 + 12},${110 - 12} ${160},${110 - 12}`} className="figure-tick" fill="none" />
        </>
      )}
      {isSameArc && (
        <>
          <line x1={C[0]} y1={C[1]} x2={A[0]} y2={A[1]} className={ACCENT} />
          <line x1={C[0]} y1={C[1]} x2={B[0]} y2={B[1]} className={ACCENT} />
          <line x1={D[0]} y1={D[1]} x2={A[0]} y2={A[1]} className={ACCENT} />
          <line x1={D[0]} y1={D[1]} x2={B[0]} y2={B[1]} className={AUX_LINE} />
          <Label x={C[0]} y={C[1] - 8}>C</Label>
          <Label x={D[0] - 10} y={D[1] - 4}>D</Label>
          <Label x={A[0] - 8} y={A[1] + 14}>A</Label>
          <Label x={B[0] + 8} y={B[1] + 14}>B</Label>
        </>
      )}
      {!isCentral && !isInscribed && !isDiameter && !isSameArc && (
        <>
          <line x1={cx} y1={cy} x2={235} y2={110} className={ACCENT} />
          <Label x={242} y={105}>A</Label>
          <Label x={170} y={100} accent>R</Label>
        </>
      )}
    </Frame>
  )
}

function InscribedCircle({ variant }: { variant: Variant }) {
  const A: [number, number] = [160, 30]
  const B: [number, number] = [40, 180]
  const C: [number, number] = [280, 180]
  if (variant === 'four-points') {
    const points = {
      A: [160, 30] as [number, number],
      B: [40, 180] as [number, number],
      C: [250, 160] as [number, number],
    }
    return (
      <Frame spec={{ type: 'inscribed-circle', variant }}>
        <Triangle points={[points.A, points.B, points.C]} />
        <Dot x={157} y={117} />
        <Label x={157} y={133} accent>I</Label>
        <Dot x={142} y={138.6} />
        <Label x={130} y={150} accent>O</Label>
        <Dot x={150} y={123.3} />
        <Label x={160} y={118} accent>G</Label>
        <Dot x={166} y={92.8} />
        <Label x={178} y={86} accent>H</Label>
        <Label x={160} y={208} size={9}>I — биссектрисы, O — серединные перпендикуляры</Label>
      </Frame>
    )
  }
  if (variant === 'circumcircle') {
    const cx = 160
    const cy = 129.6
    const r = 89.6
    return (
      <Frame spec={{ type: 'inscribed-circle', variant }}>
        <circle cx={cx} cy={cy} r={r} className={AUX_LINE} />
        <Triangle points={[[A[0], A[1] + 10], [80, 170], [240, 170]]} />
        <circle cx={cx} cy={cy} r={2.6} className="fill-[var(--accent)]" />
        <Label x={cx} y={cy - 6} accent>O</Label>
        <Label x={cx} y={A[1] + 2}>A</Label>
        <Label x={72} y={185}>B</Label>
        <Label x={248} y={185}>C</Label>
      </Frame>
    )
  }
  return (
    <Frame spec={{ type: 'inscribed-circle', variant }}>
      <Triangle points={[A, B, C]} />
      <circle cx={160} cy={118} r={62} className={ACCENT} />
      <Dot x={160} y={118} />
      <Label x={160} y={104} accent>I</Label>
      <Label x={160} y={22}>A</Label>
      <Label x={30} y={194}>B</Label>
      <Label x={290} y={194}>C</Label>
      <Label x={160} y={208} size={9}>r = S / p</Label>
    </Frame>
  )
}

export function Figure({ spec, className }: { spec: FigureSpec; className?: string }) {
  const variant = spec.variant
  let content: ReactNode = null
  switch (spec.type) {
    case 'angle-pairs':
      content = <AnglePairs variant={variant} />
      break
    case 'parallel-cut':
      content = <ParallelCut variant={variant} />
      break
    case 'triangle-cevians':
      content = <CevianTriangle variant={variant} />
      break
    case 'congruent-triangles':
      content = <CongruentTriangles variant={variant} />
      break
    case 'isosceles':
      content = <Isosceles variant={variant} />
      break
    case 'triangle-angles':
      content = <TriangleAngles variant={variant} />
      break
    case 'right-triangle':
      content = <RightTriangle variant={variant} />
      break
    case 'quadrilateral':
      content = <Quadrilateral variant={variant} />
      break
    case 'midline':
      content = <MidlineFigure variant={variant} />
      break
    case 'areas':
      content = <AreasFigure variant={variant} />
      break
    case 'pythagoras':
      content = <PythagorasFigure variant={variant} />
      break
    case 'similar':
      content = <SimilarFigure variant={variant} />
      break
    case 'trig':
      content = <TrigFigure />
      break
    case 'circle-angles':
      content = <CircleAngles variant={variant} />
      break
    case 'circle-basics':
      content = <CircleBasics variant={variant} />
      break
    case 'inscribed-circle':
      content = <InscribedCircle variant={variant} />
      break
    default:
      content = null
  }
  return <div className={cn('flex justify-center', className)}>{content}</div>
}

function CircleBasics({ variant }: { variant: Variant }) {
  const cx = 160
  const cy = 110
  const r = 75
  if (variant === 'chord') {
    return (
      <Frame spec={{ type: 'circle-basics', variant }}>
        <circle cx={cx} cy={cy} r={r} className={MAIN} />
        <line x1={104} y1={60} x2={216} y2={60} className={ACCENT} />
        <line x1={85} y1={110} x2={235} y2={110} className={ACCENT} />
        <Dot x={cx} y={cy} />
        <Label x={cx + 5} y={cy - 6}>O</Label>
        <Label x={102} y={52}>A</Label>
        <Label x={218} y={52}>B</Label>
        <Label x={80} y={104}>C</Label>
        <Label x={242} y={104}>D</Label>
        <Label x={160} y={80} accent size={9}>AB — хорда, CD — диаметр</Label>
      </Frame>
    )
  }
  if (variant === 'arc') {
    return (
      <Frame spec={{ type: 'circle-basics', variant }}>
        <circle cx={cx} cy={cy} r={r} className={MAIN} />
        <Arc cx={cx} cy={cy} r={r} from={30} to={150} className="figure-accent" />
        <Dot x={225} y={147.5} />
        <Dot x={95} y={147.5} />
        <Label x={228} y={162}>A</Label>
        <Label x={88} y={162}>B</Label>
        <Label x={160} y={200} accent size={9}>дуга AB</Label>
      </Frame>
    )
  }
  return (
    <Frame spec={{ type: 'circle-basics', variant }}>
      <circle cx={cx} cy={cy} r={r} className={MAIN} />
      <line x1={cx} y1={cy} x2={cx + r} y2={cy} className={ACCENT} />
      <Dot x={cx} y={cy} />
      <Dot x={cx + r} y={cy} />
      <Label x={cx + 5} y={cy - 6}>O</Label>
      <Label x={cx + r + 6} y={cy + 4}>A</Label>
      <Label x={205} y={100} accent>R</Label>
    </Frame>
  )
}

