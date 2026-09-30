// lib/chaos.js

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Wraps an API handler: waits 0.3-1.5s, then fails ~10% of the time.
export function withChaos(handler) {
    return async function wrapped(request, context) {
        // Dev switch: put CHAOS=off in .env.local to turn the chaos off.
        if (process.env.CHAOS === "off") return handler(request, context);

        await sleep(300 + Math.random() * 1200);

        if (Math.random() < 0.1) {
            return Response.json(
                { error: "Random server error, please retry" },
                { status: 500 }
            );
        }
        return handler(request, context);
    };
}