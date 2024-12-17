export type DrawObjectDataType = 'v-rect' | 'v-text' | 'v-group'

export type DrawObjectData = {
  type: DrawObjectDataType
  id: string
  config: any
  children?: DrawObjectData[]
}

export class DrawUntil {
  static draw_id: { [key: string]: number } = {}
  static seat_id: { [key: string]: number } = {}

  static draw_id_gen(name: string) {
    if (DrawUntil.draw_id[name]) {
      return `${name}-${DrawUntil.draw_id[name]++}`
    } else {
      DrawUntil.draw_id[name] = 0
      return `${name}-0`
    }
  }

  static seat_id_reset() {
    DrawUntil.seat_id = {}
  }

  static seat_id_gen(type: string = 'A') {
    if (DrawUntil.seat_id[type] !== undefined) {
      const seatNumber = ++DrawUntil.seat_id[type]
      return `${type}${seatNumber.toString().padStart(2, '0')}`
    } else {
      DrawUntil.seat_id[type] = 1
      return `${type}01`
    }
  }
}