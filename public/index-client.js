/* eslint-env browser */
/* global localStorage, fetch */

document.addEventListener("DOMContentLoaded", async function () {
  // Client-side auth check, ale NIE przekierowuj automatycznie na login
  const token = localStorage.getItem("access_token");

  const userWelcome = document.getElementById("user-welcome");
  const guestHeader = document.getElementById("guest-header");

  // Function to generate name from email
  function generateNameFromEmail(email) {
    const username = email.split("@")[0];
    // Capitalize first letter and replace dots/underscores with spaces
    return username
      .replace(/[._-]/g, " ")
      .split(" ")
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  }

  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      // User is logged in
      const userData = await response.json();

      // Generate name from email
      const generatedName = generateNameFromEmail(userData.data.email);

      // Update greeting with user's name
      const userGreeting = document.getElementById("user-greeting");
      if (userGreeting) {
        userGreeting.textContent = `Witaj ponownie, ${generatedName}! 👋`;
      }

      if (userWelcome) userWelcome.classList.remove("hidden");
      if (guestHeader) guestHeader.classList.add("hidden");
    } else {
      throw new Error("Token invalid");
    }
  } catch {
    // Token invalid
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    if (userWelcome) userWelcome.classList.add("hidden");
    if (guestHeader) guestHeader.classList.remove("hidden");
  }
});
