import express from 'express';

export async function createRouter(): Promise<express.Router> {
  const router = express.Router();

  router.post('/submit', async (req, res) => {
    const { name, mood, timestamp } = req.body;
    console.log('✅ Received mood:', name, mood, timestamp);

    try {
      const fetch = (await import('node-fetch')).default; // ✅ Moved inside try block

      const response = await fetch('http://192.168.49.2:30080/mood', {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mood, timestamp }),
   });


      const text = await response.text();
      res.status(response.status).send(text);
    } catch (err) {
      console.error('❌ Error forwarding to Go API:', err);
      res.status(500).send('Failed to forward mood');
    }
  });

  return router;
}
