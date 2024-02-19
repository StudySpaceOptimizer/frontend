import Table from './table'
import Group from './group'
import Chair from './chair'
import Text from './text'
import { DrawUntil } from './basic'

/**
 * Specialized Group class for Seat that containes a Chair, a Table and a Text
 * 
 * Chair size: 25x25, Table size: 50x25, Text size: 25x25
 * 
 * @see {@link Group}
 */
export class Seat extends Group {
  constructor(
    x: number,
    y: number,
    rotation: number,
    // TODO: text content should be the seat number
    onlyTable: boolean = false,
    text: string = ''
  ) {
    // Chair, Text 14x12
    // Table 28x19
    const children = [
      new Table(0, 12, 28, 19, '#fab469'),
    ]

    if (!onlyTable) {
      text = DrawUntil.seat_id_gen()
      children.push(
        new Chair(7, 0, 14, 12),
        new Text(0, 12, 28, 19, text)
      )
    }
    else {
      console.log('Seat', text)
      console.log(children)
    }

    super(x, y, rotation, children, 'seat')
  }
}