
//estrategias del cache en pwa
//1. cache only: la aplicacion se carga siempre del cache (va una vez a la red y nunca mas)
//2. cache with network fallback: veo el cache, si no esta, me voy a la network
//3. network with cache fallback: voy a la red pero si la red no esta, cargo el cache
//4. cache dinamico: una combi de las 3 estrategias de cache
//si un elemento no esta en el cache, lo guardo para la proxima peticion
//no tienes seguridad de los elementos que van a ser cargados en cache

//app shell: son los elementos que requiere si o si la web para funcionar
//los recursos
//poner todo lo que pase por el proceso de cache
const APP_SHELL = [
    //"/",
    "index.html",
    "vendor/fontawesome-free-5.15.1-web/css/all.min.css",
    "css/style.css",    
    "img/logo.svg",
    "ubicaciones.html",    
    "js/init.js"
];

//del contenido de APP_SHELL que cosas jamas deberia cambiar
const APP_SHELL_INMUTABLE = [
    "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-alpha3/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-alpha3/dist/js/bootstrap.bundle.min.js",
    "https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js",
    "https://cdn.jsdelivr.net/npm/sweetalert2@10"
];

const CACHE_ESTATICO = "estatico-v1";
const CACHE_INMUTABLE = "inmutable-v1"

//esto se ejecuta una vez cuando el service worker es instalado
self.addEventListener('install', e=>{
    //programaticamente cuando llegue fetch voy a cambiarlo
    const cacheEstatico = caches.open(CACHE_ESTATICO).then(cache=>cache.addAll(APP_SHELL));
    //este no cambia nunca
    const cacheInmutable = caches.open(CACHE_INMUTABLE).then(cache=>cache.addAll(APP_SHELL_INMUTABLE)); 
    //equivalente al await
    //voy a esperar las dos promesas al mismo tiempo
    e.waitUntil(Promise.all([cacheEstatico,cacheInmutable]));
});

//esto se ejecuta una vez cuando el service worker se activa
self.addEventListener('activate', e=>{
    //limpiar caches antiguos
    console.log("el servive worker fue activado");
});

//esto se ejecuta por cada una de las peticiones que haga el navegador
self.addEventListener('fetch', e=>{
    //preguntarme si la peticion que estoy recibiendo se encuentra dentro de algun cache
    //si se encuentra en el cache la voy a servir desde ahi, sino voy a buscarla a la red
    //cache con network fallback

    const respuesta = caches.match(e.request).then(res=>{
        //me voy a preguntar si la respuesta esta en el cache
        //voy a hacer esta estrategia exceptuando con la api
        if(res && !e.request.url.includes("/api")){
            return res;
        } else {
            //con la api voy a usar la estrategia network with cache fallback
            //voy a internet, si la internet f, sirvo el cache
            //hacer la peticion a internet
            const petInternet = fetch(e.request).then(newRes=>{
                //si la respuesta es correcta
                if(newRes.ok || newRes.type == 'opaque'){
                    //la guardo en el cache dinamico 
                    return caches.open("dinamico-v1").then(cache=>{
                        //con esto se guarda en el cache, se debe clonar porque una promesa puede ser resuelta una sola vez
                        cache.put(e.request, newRes.clone());
                        return newRes.clone();
                    })
                } else {
                    //si no funciono el cache, si no funciono la internet, f
                    //retornas la respuesta de error normalmente
                    console.log(newRes);
                    return newRes;
                }
            });
            return petInternet;
        }

    }).catch(error=>caches.match(e.request));
    e.respondWith(respuesta);
    
});