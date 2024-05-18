import express from 'express';
import { createMaskedLink, getMaskInfo, resolveMask } from './database.js';
import { readFile, readdir } from 'fs/promises';

const pages = {};
for (const page of await readdir('./pages'))
  pages[page.split('.')[0]] = await readFile(`./pages/${page}`, { encoding: 'utf-8' });

const sync = f => (req, res, next) => f(req, res).catch(next);
const sendPage = (res, page, data = {}) =>
  res.send(Object.entries(data).reduce(
    (template, [key, val]) => template.replaceAll(`{{${key}}}`, val),
    pages[page]
  ));
const _404 = (res) => res.status(404).send(pages['404']);

const app = express();
app.use(express.static('./public'));
app.use(express.json());
app.get('/', (_req, res) => sendPage(res, 'index'));
app.post('/', sync(async (req, res) => {
  await createMaskedLink(req.body.mask, req.body.actual);
  res.sendStatus(200);
}));
app.get('/stats/:mask', sync(async (req, res) => {
  const info = await getMaskInfo(req.url.slice(7));
  if (!info) return _404(res);
  sendPage(res, 'stats', info);
}));
app.get('*', sync(async (req, res) => {
  const actual = await resolveMask(req.url.slice(1));
  if (actual) return res.redirect(actual);
  _404(res);
}));

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = (status !== 500 && err.message) || 'Internal Server Error';
  if (status === 500) console.error(err);
  res.status(status).json({ error: message });
});

const returnedServer = app.listen(8673, () => {
  console.log(`App started at http://localhost:${returnedServer.address().port}`);
});
