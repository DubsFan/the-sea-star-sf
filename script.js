// Nav scroll
window.addEventListener(‘scroll’,()=>{document.getElementById(‘nav’).classList.toggle(‘scrolled’,window.scrollY>60)});

// Mobile menu
function toggleMenu(){document.getElementById(‘mobileMenu’).classList.toggle(‘open’)}

// Scroll reveal
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add(‘visible’);observer.unobserve(e.target)}})},{threshold:.08,rootMargin:‘0px 0px -40px 0px’});
document.querySelectorAll(’.reveal’).forEach(el=>observer.observe(el));

// Highlight today’s hours
const days=[‘Sunday’,‘Monday’,‘Tuesday’,‘Wednesday’,‘Thursday’,‘Friday’,‘Saturday’];
const today=days[new Date().getDay()];
document.querySelectorAll(’.hours-table .day’).forEach(td=>{
if(td.textContent===today){td.classList.add(‘today’);td.closest(‘tr’).querySelector(’.time’).classList.add(‘today’)}
});

// Floating particles
const pc=document.getElementById(‘particles’);
if(pc){for(let i=0;i<20;i++){const p=document.createElement(‘div’);p.className=‘particle’;const s=Math.random()*4+2;p.style.cssText=`width:${s}px;height:${s}px;left:${Math.random()*100}%;animation-duration:${Math.random()*12+10}s;animation-delay:${Math.random()*10}s`;pc.appendChild(p)}}

// Blog posts
const blogPosts=[
{date:‘February 2026’,title:‘Introducing the Spring Menu: Florals, Smoke & a Little Chaos’,content:`<p class="lead">Every season, we tear up the menu and start fresh. Spring 2026 is no exception. This rotation leans into the tension between delicate and aggressive: think sakura sake next to smoky mezcal, celery root meeting chili.</p><p>The Gypsy Tailwind is the cocktail we're proudest of this round. It started as an experiment with Aqar\u00e1 Agave and sakura sake. Then we added celery root syrup for earthiness and Liquid Alchemist peach for sweetness. Fresh lemon and mint pull it together. It tastes like spring in the Dogpatch: a little rough, a little beautiful.</p><p>Spill The Tea is the sleeper hit. Mezcal plus earl grey sounds strange until you taste it. The bergamot in the tea amplifies the smoke. Add amaro for bitterness, cola for body, and lemon to brighten it. It's a cocktail for people who think they've tried everything.</p><p>The full spring menu is live now. Come taste it before we change it again.</p>`},
{date:‘January 2026’,title:‘Behind the Nitro Espresso Martini: Rebuilding a Classic’,content:`<p class="lead">The espresso martini is everywhere. Every bar has one. Most are the same: vodka, coffee liqueur, espresso, sugar. We wanted to make one worth talking about.</p><p>Step one: ditch the vodka. We use Caff\u00e8 Borghetti, an Italian espresso liqueur with real depth, and split the base between mezcal and tequila. The smoke from the mezcal plays against the bitter coffee in a way vodka never could.</p><p>Step two: nitrogen. We charge the cocktail with nitro, which gives it that cascading, Guinness-style pour and a dense, creamy head without using cream or egg white. The texture is completely different from a shaken espresso martini.</p><p>The result is darker, more complex, and honestly more fun to drink. It's become one of our most ordered cocktails since it hit the menu, and we're not surprised.</p>`},
{date:‘December 2025’,title:‘127 Years at 2289 3rd Street: The History Beneath Your Feet’,content:`<p class="lead">There's a trough under the bar. Not a decorative one. A real, century-old trough that once served as a urinal and tobacco spittoon. It's one of only a handful of pre-Prohibition bar fixtures still intact in San Francisco.</p><p>The building at 2289 3rd Street first appeared as a saloon on Sanborn fire insurance maps from 1899. It's had at least five different names since then. A local couple ran it as The Sea Star Club from 1989 to 2011. Christopher Webster of The Dogpatch Saloon bought it and renamed it Hogan's Goat Tavern. In 2013, the team behind Southern Pacific Brewing brought the Sea Star name back. And in June 2015, Alicia, Ryan, and Tommy took the keys.</p><p>The Victorian tin ceilings are original. The long bar has been in the same spot for over a century. The building survived the 1906 earthquake, survived Prohibition, survived decades of industrial decline in the Dogpatch, and survived the tech boom that transformed every neighborhood around it.</p><p>We don't take that lightly. Every cocktail we serve, every Tuesday night we host live music, every regular who walks through that door is part of a story that started 127 years ago. We're just the latest chapter.</p>`}
];

function openBlog(i){
const p=blogPosts[i],m=document.getElementById(‘blogModal’);
m.innerHTML=`<div class="blog-date">${p.date}</div><h2>${p.title}</h2>${p.content}`;
document.getElementById(‘blogOverlay’).classList.add(‘open’);
document.body.style.overflow=‘hidden’;
}
function closeBlog(){
document.getElementById(‘blogOverlay’).classList.remove(‘open’);
document.body.style.overflow=’’;
}
document.getElementById(‘blogOverlay’).addEventListener(‘click’,e=>{if(e.target===e.currentTarget)closeBlog()});
document.addEventListener(‘keydown’,e=>{if(e.key===‘Escape’)closeBlog()});