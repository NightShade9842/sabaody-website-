let allPokemon = [];
let currentSlide = 0;
const visibleSlides = 4;

async function loadPokemon() {
    allPokemon = await fetch(`${API}/pokemon-all`).then(r => r.json());
    renderSlideshow(allPokemon.slice(0, 20));
    filterPokemon();
}

function renderSlideshow(list) {
    const track = document.getElementById('slideshowTrack');
    track.innerHTML = list.map(p => `
        <div class="slide-card">
            <img src="${getSpriteUrl(p.pokemon_name)}" 
                 onerror="this.src='${getAvatarUrl(p.pokemon_name, 120)}'">
            <div style="font-weight:bold;">${p.pokemon_name}</div>
            <div style="color:var(--gold);">Lv.${p.level} | ${p.rarity}</div>
            <div style="font-size:0.8rem;color:var(--text2);">Owner: ${p.owner_name || 'Wild'}</div>
        </div>
    `).join('');
    currentSlide = 0;
    updateSlidePosition();
}

function moveSlide(dir) {
    const maxSlides = Math.ceil(allPokemon.slice(0, 20).length / visibleSlides);
    currentSlide = Math.min(Math.max(currentSlide + dir, 0), maxSlides - 1);
    updateSlidePosition();
}

function updateSlidePosition() {
    const track = document.getElementById('slideshowTrack');
    const cardWidth = 200 + 16;
    track.style.transform = `translateX(-${currentSlide * visibleSlides * cardWidth}px)`;
}

function getSpriteUrl(name) {
    const dex = { Pikachu: 25, Charmander: 4, Squirtle: 7, Bulbasaur: 1, Eevee: 133, Gyarados: 130, Mewtwo: 150, Mew: 151 };
    const id = dex[name] || 1;
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function filterPokemon() {
    const search = document.getElementById('pokeSearch').value.toLowerCase();
    const rarity = document.getElementById('rarityFilter').value;
    let filtered = allPokemon.filter(p =>
        (p.pokemon_name.toLowerCase().includes(search) ||
         (p.owner_name && p.owner_name.toLowerCase().includes(search))) &&
        (!rarity || p.rarity === rarity)
    );
    const grid = document.getElementById('pokemonGrid');
    grid.innerHTML = filtered.map(p => `
        <div class="pokemon-card">
            <img src="${getSpriteUrl(p.pokemon_name)}" 
                 onerror="this.src='${getAvatarUrl(p.pokemon_name, 100)}'">
            <div class="pokemon-name">${p.pokemon_name}</div>
            <div class="pokemon-level">Lv. ${p.level} | ${p.rarity}</div>
            <div style="font-size:0.8rem;color:var(--text2);">Owner: ${p.owner_name || 'Wild'}</div>
        </div>
    `).join('');
}

loadPokemon();