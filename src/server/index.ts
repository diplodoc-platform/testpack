import express from 'express';

const app = express();

const {PROJECT, PORT} = process.env;

app.get('/', (_req, res) => {
    res.send('Welcome to the Playwright Test Server!');
});

app.use((req, _res, next) => {
    const url = new URL('http://localhost:3000' + req.url);

    const tail = url.pathname.split('/').pop() as string;
    if (tail === '') {
        url.pathname += 'index.html';
    } else if (!tail.match(/\..+?$/)) {
        url.pathname += '.html';
    }

    req.url = url.toString();

    next();
});

app.use(express.static(PROJECT as string));

app.listen(Number(PORT), () => {
    // eslint-disable-next-line no-console
    console.log(`Documentations served on http://localhost:${PORT}`);
});
