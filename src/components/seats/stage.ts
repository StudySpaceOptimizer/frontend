import { ref } from 'vue'
import type { DrawObjectData } from './basic'
import { Seat } from './seat'
import Group from './group'

export default class DrawStage {
  private drawObjectDatas = ref<DrawObjectData[]>([])

  constructor(
    private datas: any[] = []
  ) {
  }

  get drawObject() {
    return this.drawObjectDatas
  }

  /**
   * This function will draw all the objects in the stage. It is a usecase of the Composite pattern.
   *
   * @param datas
   */
  public draw(width: number, height: number) {
    if (this.datas.length !== 0) {
      this.drawObjectDatas.value = this.datas
      return
    }

    const non_notebook_seats = new Group(0, 0, -45, [], 'non-notebook-seats')

    const seat_map = [
      0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0,
      0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1,
      1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1,
      1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1,
      1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1,
      0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1,
      0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1,
      0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0,
      0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0,
    ]

    let seat_count = 0
    for (let i = 0; i < seat_map.length; i++) {
      const x = (i % 17) * 55
      const y = Math.floor(i / 17) * 55
      if (seat_map[i] === 1) {
        seat_count++
        non_notebook_seats.add(new Seat(x, y, 0, 'B' + seat_count))
      }
    }

    const all_groups = new Group(width / 2, height / 2, 0, [], 'all-seats')
    all_groups.add(non_notebook_seats)

    this.drawObjectDatas.value.push(all_groups.draw())
  }
}
