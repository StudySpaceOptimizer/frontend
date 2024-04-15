import Group from './group'
import Chair from './chair'
import Text from './text'

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
    text: string = ''
  ) {
    const children = [
      new Chair(0, 0, { width: 50, height: 50, concerRadius: 5}),
      new Text(0, 0, { width: 50, height: 50, text, fontSize: 14 }),
    ]

    super(x, y, rotation, children, 'seat')
  }
}