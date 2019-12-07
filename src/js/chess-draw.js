
function draw_selected(){
    if(selected){
        color("yellow")
        ctx.fillRect(50*(selected.col-1), 50*(8-selected.row), 50, 50)
    } 
}
function draw_piece(piece){
    if(piece.inactive){
        return;
    }
    if(piece.side == "white"){
        color("white")
    } else {
        color("black")
    }
    ctx.fillRect(50*(piece.col-1)+15, 50*(8-piece.row)+15, 20, 20);
    if(piece.side == "white"){
        color("black")
    } else {
        color("white")
    }
    ctx.fillText(piece.type, 50*(piece.col-1)+18, 50*(8-piece.row+0.2)+20)
}

function draw() {
    font(20)
    color("#ddd");
    ctx.fillRect(0, 0, 400, 600);
    color("#aaa")
    for(var x = 0; x < 8; x++){
        for(var y = 0; y < 8; y++){
            if(x % 2 == 0 && y % 2 == 1){
                ctx.fillRect(50*x, 50*y, 50, 50);
            }
            if(x % 2 == 1 && y % 2 == 0){
                ctx.fillRect(50*x, 50*y, 50, 50);
            }
        }
    }
    draw_selected();
    pieces.forEach(piece => {
        draw_piece(piece)
    });
    color("black")
    ctx.fillText(status, 20, 420)
}   