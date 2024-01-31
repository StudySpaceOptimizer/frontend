let globalSeatNumber = 0

class DrawObject {
  constructor(
    public x: number,
    public y: number,
    public id: string,
    public text: string,
    public width: number,
    public height: number,
    public fill: string,
    public fontSize: number = 14,) {
  }

  draw = () => {
    const ret = [{
      type: 'v-rect',
      id: this.id,
      config: <any>{
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        fill: this.fill,
      }
    }]

    if (this.text) {
      ret.push({
        type: 'v-text',
        id: this.id + '-text',
        config: <any>{
          x: this.x,
          y: this.y,
          width: this.width,
          height: this.height,
          text: this.text,
          fontSize: this.fontSize,
          fill: '#fff',
          align: 'center',
          verticalAlign: 'middle',
          rotation: 0,
        }
      })
    }

    return ret
  }

  addText = (origin: string, text: string) => {
    if (!this.text) return
    this.text = (++globalSeatNumber).toString()
  }
}

export class Seat extends DrawObject {
  constructor(
    public x: number,
    public y: number,
    public id: string,
    public text: string,) {
    super(x, y, id, text, 25, 25, '#00bd7e')
  }
}

export class Table extends DrawObject {
  constructor(
    x: number,
    y: number,
    id: string,
    text?: string,) {
    if (!text) text = ''
    super(x, y, id, text, 102.5, 50, '#122323')
  }
}

export class Group {
  public objects: DrawObject[] = []

  constructor(public x: number, public y: number, public rotation: number, public name: string) {
  }

  add(...objects: DrawObject[]) {
    this.objects.push(...objects)
    return this
  }

  draw = () => {
    this.objects.forEach(object => {
      object.addText(object.text, this.name)
    })

    return {
      type: 'v-group',
      id: this.name,
      config: {
        x: this.x,
        y: this.y,
        rotation: this.rotation,
      },
      children: this.objects.map(object => object.draw()).flat()
    }
  }
}

const SEAT_CONFIGS = [
  { x: 17.5, y: 0, id: 'seat-1', text: 'seat-1' },
  { x: 60, y: 0, id: 'seat-2', text: 'seat-2' },
  { x: 17.5, y: 85, id: 'seat-3', text: 'seat-3' },
  { x: 60, y: 85, id: 'seat-4', text: 'seat-4' },
]

export function genGroups(prefix: string, configs: any[]) {
  const groups: any[] = []
  for (let i = 0; i < configs.length; ++i) {
    const group = new Group(configs[i].x, configs[i].y, configs[i].rotation, configs[i].name)
    group.add(new Table(0, 30, 'table', ''))
    console.log(configs[i].seats)
    for (let j = 0; j < configs[i].seats.length; ++j) {
      const type = configs[i].seats[j] - 1
      const seat = new Seat(
        SEAT_CONFIGS[type].x,
        SEAT_CONFIGS[type].y, 
        SEAT_CONFIGS[type].id, 
        SEAT_CONFIGS[type].text)
      group.add(seat)
    }

    groups.push(group.draw())
  }

  return groups
}

export const SEAT_TAMPLATE = {
  NORMAL: new Group(0, 0, 0, 'normal')
    .add(
      new Table(0, 30, 'table', ''),
      new Seat(17.5, 0, 'seat-1', '1'),
      new Seat(60, 0, 'seat-2', '2'),
      new Seat(17.5, 85, 'seat-3', '3'),
      new Seat(60, 85, 'seat-4', '4'),
    )
}