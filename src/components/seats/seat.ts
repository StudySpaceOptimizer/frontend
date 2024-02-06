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
  ) {
    const children = [
      new Chair(12.5, 0, 25, 25),
      new Table(0, 30, 50, 25, '#fab469'),
      // TODO: text content should be the seat number
      new Text(12.5, 0, 25, 25, DrawUntil.seat_id_gen())
    ]

    super(x, y, rotation, children, 'seat')
  }
}