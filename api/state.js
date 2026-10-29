import { load, publicView, send } from './_store.js';

export default async function handler(req, res) {
  try {
    send(res, 200, publicView(await load()));
  } catch (e) {
    send(res, 500, { error: 'Não foi possível carregar os dados.' });
  }
}
