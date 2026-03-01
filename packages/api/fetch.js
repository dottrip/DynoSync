fetch('https://dynosync-api.dynosync-dev.workers.dev/public/vehicles/7c112185-5447-4872-acb0-9c6bf93f6f58')
    .then(res => res.text())
    .then(console.log)
    .catch(console.error);
