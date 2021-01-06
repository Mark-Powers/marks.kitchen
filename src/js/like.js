function likePost(type, id){
    fetch(`/post/like/${type}/${id}`)
       .then(response => response.json())
        .then(response => {
          console.log(response)
          let btn_id=`btn_${type}_${id}`
          let el = document.getElementById(btn_id)
          el.innerText = `👍 (${response.likes})`
        })
}

