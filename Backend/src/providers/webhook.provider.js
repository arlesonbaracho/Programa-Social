function createWebhookProvider({ enabled, url, secret }) {
  return {
    async send({ event, payload }) {
      if (!enabled || !url) {
        return { sent: false, skipped: true, reason: "Webhook notifications disabled." };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "X-Webhook-Secret": secret } : {}),
        },
        body: JSON.stringify({
          event,
          payload,
          occurredAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with status ${response.status}.`);
      }

      return {
        sent: true,
        status: response.status,
      };
    },
  };
}

module.exports = { createWebhookProvider };
