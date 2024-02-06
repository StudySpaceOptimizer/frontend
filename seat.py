import json

seat = [
    [0  , 0 , 0 , 1 , 2 , 0 , 0 , 0 , 0 ,],
    [0  , 3 , 4 , 5 , 6 , 0 , 31, 31, 0 ,],
    [0  , 0 , 8 , 9 , 10, 0 , 7 , 0 , 0 ,],
    [32 , 0 , 11, 12, 13, 0 , 14, 15, 16,],
    [32 , 0 , 17, 18, 19, 0 , 20, 21, 22,],
    [0  , 0 , 23, 24, 25, 0 , 26, 27, 28,],
    [0  , 0 , 0 , 33, 29, 0 , 0 , 30, 0 ,],
]

special_seats = {
    '1': {
        'seats': [1, 2, 3]
    },
    '31': {
        'rotation': 90,
    },
    '7': {
        'rotation': 90,
        'seats': [1, 3]
    },
    '18': {
        'seats': [1, 3]
    },
    '32': {
        'rotation': 90,
    },
    '33': {
        'seats': [2, 4]
    }
}

margin_x = 0
margin_y = 15
width = 100
height = 120

datas = []

# type: vertical, horizontal
def genData(name, x, y, rotation:int =0, seats: list = [1, 2, 3, 4]):
    if rotation == 90:
        x += height

    return {
        'name': name,
        'x': x,
        'y': y,
        'rotation': rotation,
        'seats': seats,
    }

seat_id = 0

for row_index, row in enumerate(seat):
    for col_index, col in enumerate(row):
        if col != 0:
            special_seat = special_seats.get(str(col), {})
            x = special_seat.get('x', (margin_x * 2 + width) * col_index)
            y = special_seat.get('y', (margin_y * 2 + height) * row_index)
            rotation = special_seat.get('rotation', 0)
            seats = special_seat.get('seats', [1, 2, 3, 4])

            data = genData(
                seat_id, 
                x,
                y,
                rotation,
                seats
            )
            seat_id += 1
            datas.append(data)

with open('./src/components/seats.json', 'w') as file:
    json.dump(datas, file)
