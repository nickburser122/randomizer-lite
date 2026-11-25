self.onmessage = async () => {
  try {
    const t = await (await fetch('../words.json')).text(), s = new Set();
    for (const m of t.matchAll(/"([a-z]{3,8})"/g)) s.add(m[1]);
    postMessage([...s]);
  } catch {
    postMessage(null);
  }
};
