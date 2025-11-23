(async function () {
  try {
    // login
    const auth = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "adminpass" }),
    });
    const { token } = await auth.json();
    console.log("token len", token?.length);
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // List favorites
    let res = await fetch("http://localhost:4000/favorites/me", { headers });
    console.log("/favorites/me ->", res.status, await res.text());

    // Toggle favorite for stationId=1
    res = await fetch("http://localhost:4000/favorites", {
      method: "POST",
      headers,
      body: JSON.stringify({ stationId: 1 }),
    });
    console.log("/favorites POST ->", res.status, await res.text());

    // List favorites again
    res = await fetch("http://localhost:4000/favorites/me", { headers });
    console.log("/favorites/me ->", res.status, await res.text());
  } catch (e) {
    console.error(e);
  }
})();
