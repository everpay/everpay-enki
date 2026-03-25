export default {
  async fetch(req: Request) {
    const body = await req.json();

    let score = 0;

    if (body.amount > 1000) score += 30;
    if (body.country !== body.ip_country) score += 40;

    return new Response(JSON.stringify({ score }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
