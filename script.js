/* CyberStore - chức năng phía trình duyệt (demo, lưu bằng localStorage) */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = value => new Intl.NumberFormat("vi-VN").format(value) + " VNĐ";

  // Phân loại tự động theo tên game. Có thể bổ sung tên vào các nhóm bên dưới.
  const categoryRules = {
    sports: ["efootball", "fifa", "ea sports fc", "the sims"],
    horror: ["resident evil", "dead space", "outlast"],
    rpg: ["elden ring", "black myth", "baldur", "witcher", "hogwarts", "monster hunter",
          "cyberpunk", "god of war", "assassin"],
    action: ["gta", "valorant", "counter-strike", "apex", "doom", "mortal kombat",
             "devil may cry", "battlefield", "red dead"]
  };

  function classifyGame(name) {
    const normalized = name.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryRules)) {
      if (keywords.some(keyword => normalized.includes(keyword))) return category;
    }
    return "action";
  }

  // Gắn dữ liệu cho toàn bộ thẻ game hiện có, kể cả game ở phần xem thêm.
  $$(".game-card").forEach(card => {
    const title = $(".game-title", card)?.textContent.trim() || "";
    card.dataset.category = classifyGame(title);
    const buy = $(".btn-buy", card);
    if (buy) {
      buy.dataset.action = "add-cart";
      buy.href = "javascript:void(0)";
      buy.textContent = "Thêm giỏ hàng";
    }
    const detail = $(".btn-detail", card);
    if (detail) {
      detail.href = "javascript:void(0)";
      detail.addEventListener("click", () => {
        alert("Game: " + title + "\nThể loại: " + card.dataset.category.toUpperCase());
      });
    }
  });

  // Lọc game trong mục Khám phá theo thể loại.
  const filterButtons = $$(".filter-btn");
  const exploreCards = $$("#adult .game-card");
  filterButtons.forEach(button => button.addEventListener("click", () => {
    filterButtons.forEach(item => item.classList.toggle("active", item === button));
    const selected = button.dataset.filter;
    exploreCards.forEach(card => {
      card.hidden = selected !== "all" && card.dataset.category !== selected;
    });
  }));

  const getCart = () => {
    try { return JSON.parse(localStorage.getItem("cyberstore_cart") || "[]"); }
    catch { return []; }
  };
  const saveCart = cart => {
    localStorage.setItem("cyberstore_cart", JSON.stringify(cart));
    updateCartCount();
  };
  function cardInfo(card) {
    const title = $(".game-title", card)?.textContent.trim() || "Game";
    const priceText = $(".sale-price", card)?.textContent.trim() || "0";
    const digits = priceText.replace(/[^\d]/g, "");
    return { id: title.toLowerCase(), title, price: digits ? Number(digits) : 0 };
  }
  function updateCartCount() {
    $("#cart-count").textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);
  }
  $$(".btn-buy").forEach(button => button.addEventListener("click", event => {
    event.preventDefault();
    const item = cardInfo(button.closest(".game-card"));
    const cart = getCart();
    const existing = cart.find(row => row.id === item.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...item, quantity: 1 });
    saveCart(cart);
    button.textContent = "Đã thêm ✓";
    setTimeout(() => button.textContent = "Thêm giỏ hàng", 1200);
  }));

  function showModal(content) {
    $(".modal-backdrop")?.remove();
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true">${content}</section>`;
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop || event.target.closest(".close-modal")) backdrop.remove();
    });
    document.body.appendChild(backdrop);
    return backdrop;
  }

  $("#cart-button")?.addEventListener("click", () => {
    const cart = getCart();
    const lines = cart.length ? cart.map(item => `
      <div class="cart-line">
        <span>${escapeHtml(item.title)} × ${item.quantity}<br><small>${item.price ? money(item.price) : "Miễn phí"}</small></span>
        <button type="button" data-remove="${escapeHtml(item.id)}">Xóa</button>
      </div>`).join("") : '<p>Giỏ hàng đang trống.</p>';
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const modal = showModal(`<button class="close-modal" type="button">Đóng ✕</button>
      <h2>Giỏ hàng</h2>${lines}<h3 style="margin-top:16px">Tạm tính: ${money(total)}</h3>
      <p class="modal-note">Đây là giỏ hàng demo, chưa kết nối thanh toán.</p>`);
    $$("[data-remove]", modal).forEach(button => button.addEventListener("click", () => {
      saveCart(getCart().filter(item => item.id !== button.dataset.remove));
      modal.querySelector(".close-modal").click();
      $("#cart-button").click();
    }));
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[char]));
  }

  function currentUser() {
    try { return JSON.parse(localStorage.getItem("cyberstore_user") || "null"); }
    catch { return null; }
  }
  $("#account-button")?.addEventListener("click", () => {
    const user = currentUser();
    if (user) {
      const modal = showModal(`<button class="close-modal" type="button">Đóng ✕</button>
        <h2>Tài khoản</h2><p>Xin chào, <strong>${escapeHtml(user.name)}</strong>!</p>
        <p class="modal-note">${escapeHtml(user.email)}</p>
        <div class="modal-actions"><button class="primary" id="logout-button">Đăng xuất</button></div>`);
      $("#logout-button", modal).addEventListener("click", () => {
        localStorage.removeItem("cyberstore_user");
        modal.remove();
        $("#account-button").textContent = "👤 Tài khoản";
      });
      return;
    }
    showAuthForm("login");
  });

  function showAuthForm(mode) {
    const registering = mode === "register";
    const modal = showModal(`<button class="close-modal" type="button">Đóng ✕</button>
      <h2>${registering ? "Đăng ký tài khoản" : "Đăng nhập"}</h2>
      <form id="auth-form">
        ${registering ? '<label for="auth-name">Tên hiển thị</label><input id="auth-name" required maxlength="60">' : ""}
        <label for="auth-email">Email</label><input id="auth-email" type="email" required>
        <label for="auth-password">Mật khẩu</label><input id="auth-password" type="password" required minlength="6">
        <div class="modal-actions"><button class="primary" type="submit">${registering ? "Đăng ký" : "Đăng nhập"}</button>
        <button type="button" id="switch-auth">${registering ? "Đã có tài khoản? Đăng nhập" : "Tạo tài khoản"}</button></div>
        <p class="modal-note">Tài khoản demo chỉ lưu trên trình duyệt này; không dùng mật khẩu thật.</p>
        <p id="auth-message" role="status"></p>
      </form>`);
    $("#switch-auth", modal).addEventListener("click", () => showAuthForm(registering ? "login" : "register"));
    $("#auth-form", modal).addEventListener("submit", event => {
      event.preventDefault();
      const email = $("#auth-email", modal).value.trim().toLowerCase();
      const password = $("#auth-password", modal).value;
      const users = JSON.parse(localStorage.getItem("cyberstore_users") || "[]");
      if (registering) {
        if (users.some(user => user.email === email)) {
          $("#auth-message", modal).textContent = "Email này đã được đăng ký.";
          return;
        }
        const user = { name: $("#auth-name", modal).value.trim(), email, password };
        users.push(user);
        localStorage.setItem("cyberstore_users", JSON.stringify(users));
        $("#auth-message", modal).textContent = "Đăng ký thành công. Bạn có thể đăng nhập.";
      } else {
        const user = users.find(row => row.email === email && row.password === password);
        if (!user) {
          $("#auth-message", modal).textContent = "Email hoặc mật khẩu không đúng.";
          return;
        }
        localStorage.setItem("cyberstore_user", JSON.stringify({ name: user.name, email: user.email }));
        modal.remove();
        $("#account-button").textContent = "👤 " + user.name;
      }
    });
  }

  updateCartCount();
  const user = currentUser();
  if (user && $("#account-button")) $("#account-button").textContent = "👤 " + user.name;
})();
