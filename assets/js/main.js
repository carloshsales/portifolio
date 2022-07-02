let aboutText = document.getElementById('aboutText');
let liAbout = document.querySelectorAll('li');


liAbout.forEach(item => {
    if (item.id === "") {
        return;
    } else {
        item.addEventListener("click", () => {
            let current = document.getElementsByClassName('active-btn');

            if (current.length > 0) {
                current[0].className = current[0].className.replace('active-btn', '');
            }

            item.classList.add('active-btn');
        });
    }
})


