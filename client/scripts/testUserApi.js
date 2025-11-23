(async function () {
  try {
    const auth = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "adminpass" }),
    });
    const authJson = await auth.json();
    const token = authJson.token;
    console.log("token length", token?.length || "none");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const p = await fetch("http://localhost:4000/profile", { headers });
    console.log("/profile ->", p.status);
    console.log(await p.text());
    const r = await fetch("http://localhost:4000/rentals/me", { headers });
    console.log("/rentals/me ->", r.status);
    console.log(await r.text());
  } catch (e) {
    console.error(e);
  }
})();
