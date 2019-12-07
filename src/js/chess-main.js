// Store game with password
// Load and play from password
// Admin view?

var gameInterval, canvas, ctx;
var pieces, turn, user_turn;
var selected;
var person;
var pgn;

var ranks = {
    1: "a",
    2: "b",
    3: "c",
    4: "d",
    5: "e",
    6: "f",
    7: "g",
    8: "h",
}

function default_pawns(row, side) {
    let arr = []
    for (var x = 1; x <= 8; x++) {
        arr.push({
            "type": "P",
            "row": row,
            "col": x,
            "moved": false,
            "side": side
        });
    }
    return arr;
}

function default_pieces(row, side) {
    let arr = [
        {
            "type": "R",
            "row": row,
            "col": 1,
            "side": side
        },
        {
            "type": "R",
            "row": row,
            "col": 8,
            "side": side
        },
        {
            "type": "N",
            "row": row,
            "col": 2,
            "side": side
        },
        {
            "type": "N",
            "row": row,
            "col": 7,
            "side": side
        },
        {
            "type": "B",
            "row": row,
            "col": 3,
            "side": side
        },
        {
            "type": "B",
            "row": row,
            "col": 6,
            "side": side
        },
        {
            "type": "Q",
            "row": row,
            "col": 4,
            "side": side
        },
        {
            "type": "K",
            "row": row,
            "col": 5,
            "side": side
        }
    ]
    return arr;
}

function is_admin(){
    return window.location.pathname.startsWith("/admin")
}

function init() {
    console.log(window.location.pathname)
    if (is_admin()) {
        fetch(new Request("/admin/chess/games", {
            method: 'GET',
        }))
        .then(response => response.json())
        .then((response) => {
            load(response)
            gameInterval = setInterval(game, 1000 / 10);
        });
    } else {
        person = prompt("Please enter your name", "");
        fetch(new Request("/chess/" + person, {
            method: 'GET',
        }))
        .then(response => response.json())
        .then((response) => {
            load(response)
            gameInterval = setInterval(game, 1000 / 10);
        });
    }
}

function load(response){
    if (response.game && response.game) {
        person = response.game.name
        pieces = JSON.parse(response.game.pieces);
        turn = response.game.turn;
        user_turn = response.game.userside;
        status = "Turn: " + turn + ". You play " + user_turn
        pgn = [] // TODO
    } else {
        pieces = default_pieces(1, "white").concat(default_pawns(2, "white")).concat(
            default_pieces(8, "black").concat(default_pawns(7, "black")));
        user_turn = turn = Math.random() < 0.5 ? "white" : "black"
        status = "You play " + turn
        if(is_admin()){
            status = "No games!"
            pieces.forEach(piece => {
                piece.inactive = true
            })
        }
        pgn = []
    }
}

function next_turn() {
    if (turn == "white") {
        turn = "black";
    } else {
        turn = "white";
    }
    if (turn != user_turn) {
        status = "Waiting for your turn"
    } else {
        status = "It is your turn"
    }
    var details = {
        pieces: JSON.stringify(pieces),
        name: person,
        turn: turn,
        userside: user_turn
    };
    var formBody = [];
    for (var property in details) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    fetch(new Request("/chess", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: formBody
    }))
        .then((response) => {
            console.log(response)
        })
}

window.onload = function () {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    document.addEventListener("mousedown", mousePush);

    // window.addEventListener('resize', resizeCanvas, false);
    // window.addEventListener('orientationchange', resizeCanvas, false);
    resizeCanvas();

    init();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // scaleX = window.innerWidth / 400;
    // scaleY = window.innerHeight / 600;

    // if (scaleX / scaleY > 1.3) {
    //     scaleX = scaleY = 1;
    // }
    // ctx.scale(scaleX, scaleY);
}
function game() {
    // update();
    draw();
}

function update() {

}

function piece_at(row, col) {
    return pieces.find(p => {
        return p.col == col && p.row == row
    });
}

// TODO king cannot take piece attacking him from right next door
function mousePush(e) {
    if (turn != user_turn && !is_admin()) {
        return;
    }

    col = Math.floor(e.clientX / 50) + 1;
    row = 8 - Math.floor(e.clientY / 50);
    var ap = piece_at(row, col)
    // If clicked on players piece
    if (ap && ap.side == turn) {
        selected = ap;
        // If clicked on space piece can move to
    } else if (selected && !selected.inactive && legal_move(selected, row, col)) {
        var tempCol = selected.col;
        var tempRow = selected.row;
        selected.col = col;
        selected.row = row;
        var check = in_check();
        selected.col = tempCol;
        selected.row = tempRow;
        if (check) {
            console.log("check!")
            // TODO check for mate
        } else {
            target = piece_at(row, col);
            if (target) {
                target.inactive = true;
                console.log("took", target.side, target.type)
            }

            var pgnTurn = "";
            if (selected.type == "P") {
                if (target) {
                    pgnTurn = ranks[selected.col] + "x"
                }
                pgnTurn += ranks[col] + "" + row
            } else if (selected.type == "K" && !selected.moved && (col == 7 || col == 3)) {
                // If castled
                if (col == 7) {
                    pgnTurn = "O-O"
                } else {
                    pgnTurn = "O-O-O"
                }
            } else {
                // Check if ambiguous (two of same type can move to space)
                // Check if castled
                pgnTurn += selected.type;
                if (target) {
                    pgnTurn = "x"
                }
                pgnTurn += ranks[col] + "" + row
            }

            if (selected.type == "P" && row == 8) {
                selected.type = "Q"
            }

            selected.col = col;
            selected.row = row;
            selected.moved = true;
            selected = undefined;
            next_turn()

            if (in_check()) {
                pgnTurn += "+"
            }
            pgn.push(pgnTurn);
        }
    } else {
        selected = undefined;
    }
    // console.log(pgn)
    console.log(JSON.stringify(pieces))
}
function in_check() {
    // in check if legal move from any opposing piece to king
    var king = pieces.find(piece => {
        return piece.type == "K" && piece.side == turn
    });
    var attacking = pieces.find(piece => {
        return (legal_move(piece, king.row, king.col))
    })
    return attacking != undefined;
}
function legal_move(piece, row, col) {
    if (row < 1 || row > 8 || col < 1 || col > 8) {
        return false;
    }
    var target = piece_at(row, col);
    if (piece.type == "P") {
        var dir;
        if (piece.side == "white") {
            dir = 1;
        } else {
            dir = -1;
        }
        // Move one forward
        if (!target && piece.col == col && row == piece.row + dir) {
            return true
            // Move two forward
        } else if (piece.col == col && row == piece.row + dir * 2 && !piece.moved
            && !target && !piece_at(row - dir, col)) {
            return true;
            // Attack
        } else if (target && target.side != piece.side && row == piece.row + dir && Math.abs(col - piece.col) == 1) {
            return true;
        }
        // TODO en passant
    } else if (piece.type == "R") {
        if (row == piece.row) {
            var dir = piece.col < col ? 1 : -1;
            for (var x = piece.col + dir; x != col; x += dir) {
                if (piece_at(row, x)) {
                    return false;
                }
            }
            return !target || target.side != piece.side;
        } else if (col == piece.col) {
            var dir = piece.row < row ? 1 : -1;
            for (var x = piece.row + dir; x != row; x += dir) {
                if (piece_at(x, col)) {
                    return false;
                }
            }
            return !target || target.side != piece.side;
        }
    } else if (piece.type == "N") {
        if ((!target || target.side != piece.side) && row != piece.row && Math.abs(row - piece.row) + Math.abs(col - piece.col) == 3) {
            return true;
        }
    } else if (piece.type == "B") {
        if (Math.abs(row - piece.row) == Math.abs(col - piece.col)) {
            var dirR = piece.row < row ? 1 : -1;
            var dirC = piece.col < col ? 1 : -1;
            for (var x = 1; x < Math.abs(row - piece.row); x++) {
                if (piece_at(piece.row + dirR * x, piece.col + dirC * x)) {
                    return false;
                }
            }
            return !target || target.side != piece.side;
        }
    } else if (piece.type == "Q") {
        if (row == piece.row) {
            var dir = piece.col < col ? 1 : -1;
            for (var x = piece.col + dir; x != col; x += dir) {
                if (piece_at(row, x)) {
                    return false;
                }
            }
            return !target || target.side != piece.side;
        } else if (col == piece.col) {
            var dir = piece.row < row ? 1 : -1;
            for (var x = piece.row + dir; x != row; x += dir) {
                if (piece_at(x, col)) {
                    return false;
                }
            }
            return !target || target.side != piece.side;
        } else if (Math.abs(row - piece.row) == Math.abs(col - piece.col)) {
            var dirR = piece.row < row ? 1 : -1;
            var dirC = piece.col < col ? 1 : -1;
            for (var x = 1; x < Math.abs(row - piece.row); x++) {
                if (piece_at(piece.row + dirR * x, piece.col + dirC * x)) {
                    return false;
                }
            }
            return !target || target.side != piece.side;
        }
    } else if (piece.type == "K") {
        if ((Math.abs(row - piece.row) <= 1 && Math.abs(col - piece.col) <= 1)
            && (row != piece.row || col != piece.col)) {
            return !target || target.side != piece.side
        }
        // castle King side
        if (row == piece.row && piece.col + 2 == col) {
            // No pieces between rook and king
            for (var x = 6; x <= 7; x++) {
                if (piece_at(row, x)) {
                    return false
                }
            }
            // Neither has moved nor in check
            var rook = piece_at(row, 8);
            if (rook && !rook.moved && !piece.moved && !in_check()) {
                // King does not pass through attacking
                for (var x = 6; x <= 6; x++) {
                    var attacking = pieces.find(piece => {
                        return piece.side != rook.side && legal_move(piece, row, x)
                    })
                    if (attacking) {
                        return false
                    }
                }
                rook.col = 6;
                rook.moved = true
                return true
            }
        } else if (row == piece.row && piece.col - 2 == col) {
            // No pieces between rook and king
            for (var x = 3; x <= 4; x++) {
                if (piece_at(row, x)) {
                    return false
                }
            }
            // Neither has moved nor in check
            var rook = piece_at(row, 1);
            if (rook && !rook.moved && !piece.moved && !in_check()) {
                // King does not pass through attacking
                for (var x = 4; x <= 4; x++) {
                    var attacking = pieces.find(piece => {
                        return piece.side != rook.side && legal_move(piece, row, x)
                    })
                    if (attacking) {
                        return false
                    }
                }
                rook.col = 4;
                rook.moved = true
                return true
            }
        }
        // TODO check for check after movie rook and king (rook can't get undone)
    }
    return false
}
function font(size) {
    ctx.font = size + "px Courier";
}
function color(c) {
    ctx.fillStyle = c;
}
function gameOver() {
    isGameOver = true;
    clearInterval(gameInterval);

    const urlParams = new URLSearchParams(window.location.search);
    const uid = urlParams.get('uid');
    const mid = urlParams.get('mid');
    const cid = urlParams.get('cid');
    const imid = urlParams.get('imid');
    if (imid) {
        const request = new Request(`/setScore?uid=${uid}&imid=${imid}&score=${score}`);
        fetch(request).then(response => console.log("set score"));
    }
    else {
        const request = new Request(`/setScore?uid=${uid}&mid=${mid}&cid=${cid}&score=${score}`);
        fetch(request).then(response => console.log("set score"));
    }
}