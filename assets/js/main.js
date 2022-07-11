
const aboutText = document.querySelector('#aboutText');
const liAbout = document.querySelectorAll('li');


// import { text } from './text';

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

            switch (item.id) {
                case 'easy':
                    aboutText.innerHTML = `
                    Olá, me chamo Carlos Henrique, e ser um desenvolvedor sempre foi um sonho, e agora estou me inserindo na carreira como Desenvolvedor Fullstack JS
                    `;
                    break;
                case 'normal':
                    aboutText.innerHTML = `
                    Atualmente estou seguindo o curso Fullstack developer na Blue Edtech, e tem foco no JavaScript e suas bibliotecas/frameworks. Possuo outras experiências que me ajudam sempre na tentativa de aprender algo novo, já desenvolvi alguns jogos simples em GDScript (liguagem da Godot Engine), passei pelo Java, C/C++/C#, Python... Tentei muito até chegar onde estou no momento.
                    `;
                    break;
                case 'hard':
                    aboutText.innerHTML = `
                        Hoje tenho todo o tempo necessário para me tornar o desenvolvedor que sempre quis ser, com muito empenho e dedicação, estudo diáriamente várias horas por dia, tanto os conteúdos do curso quanto algumas ramificações para me especializar em outros tipos de tecnologia.
                    `;
                    break;
            }
        });


    }
})

